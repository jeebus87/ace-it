import { test, expect, Page } from "@playwright/test";

/**
 * E2E Tests for Fuzzy Answer Matching
 * Tests the fuzzy matching system when users type answers after getting a question wrong
 */

const BASE_URL = "http://localhost:3000";

// Helper to take screenshots
async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e-screenshots/fuzzy-${name}.png`,
    fullPage: true,
  });
  console.log(`Screenshot: fuzzy-${name}`);
}

// Helper for safe clicking
async function safeClick(page: Page, locator: ReturnType<Page["locator"]>) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ force: true });
}

// Helper to start a quiz and get to a wrong answer state
async function getToWrongAnswerState(page: Page): Promise<{ correctAnswer: string }> {
  // Search for a topic
  await page.goto(BASE_URL);
  await page.waitForLoadState("networkidle");

  const searchInput = page.locator('input[placeholder*="Search"]').first();
  await searchInput.fill("What is photosynthesis?");
  await searchInput.press("Enter");

  // Wait for difficulty prompt and select
  await page.waitForSelector("text=Select Quiz Difficulty", { timeout: 60000 });
  await safeClick(page, page.locator("text=Intermediate"));
  await page.waitForTimeout(500);

  // Wait for quiz to be ready
  await page.waitForSelector("text=Start Mastery Quiz", { timeout: 120000 });
  await safeClick(page, page.locator("text=Start Mastery Quiz").first());
  await page.waitForSelector("text=Mastery Quiz", { timeout: 10000 });
  await page.waitForTimeout(500);

  // Try to answer wrong intentionally
  const choices = ["A", "B", "C", "D"];
  let correctAnswer = "";

  for (const choice of choices) {
    const choiceButton = page
      .locator("button")
      .filter({ hasText: new RegExp(`^${choice}\\.`) });

    if (await choiceButton.isDisabled().catch(() => true)) continue;

    await safeClick(page, choiceButton);
    await page.waitForTimeout(500);

    // Check if we need to type (wrong answer)
    const typePrompt = page.locator("text=Type the correct answer to continue");
    const needToType = await typePrompt.isVisible().catch(() => false);

    if (needToType) {
      // Get the correct answer from the green highlighted button
      const correctButton = page.locator("button.border-green-500");
      const correctText = await correctButton.textContent();
      const match = correctText?.match(/^[A-D]\.\s*(.+)$/);
      correctAnswer = match ? match[1].trim() : "";
      break;
    } else {
      // Got it right, close and try again
      await page.reload();
      return getToWrongAnswerState(page);
    }
  }

  return { correctAnswer };
}

// Test helper to verify fuzzy match acceptance
async function testFuzzyMatch(
  page: Page,
  typedAnswer: string,
  shouldMatch: boolean,
  testName: string
) {
  const inputField = page.locator('input[placeholder="Type the correct answer..."]');
  const submitButton = page.locator("button").filter({ hasText: "Submit" });

  // Clear and type the answer
  await inputField.fill("");
  await inputField.fill(typedAnswer);
  await screenshot(page, `${testName}-typed`);

  // Submit
  await safeClick(page, submitButton);
  await page.waitForTimeout(500);

  // Check result
  const nextButton = page.locator("button").filter({ hasText: /Next Question|Complete Quiz/ });
  const canProceed = await nextButton.isVisible().catch(() => false);

  if (shouldMatch) {
    expect(canProceed).toBe(true);
    console.log(`PASS: "${typedAnswer}" was correctly accepted`);
  } else {
    expect(canProceed).toBe(false);
    console.log(`PASS: "${typedAnswer}" was correctly rejected`);
  }

  await screenshot(page, `${testName}-result`);
}

test.describe("Fuzzy Answer Matching Tests", () => {
  test.setTimeout(180000); // 3 minutes per test

  test("exact match is accepted", async ({ page }) => {
    const { correctAnswer } = await getToWrongAnswerState(page);
    console.log(`Testing exact match with: "${correctAnswer}"`);

    if (correctAnswer) {
      await testFuzzyMatch(page, correctAnswer, true, "exact-match");
    }
  });

  test("lowercase match is accepted", async ({ page }) => {
    const { correctAnswer } = await getToWrongAnswerState(page);
    console.log(`Testing lowercase with: "${correctAnswer.toLowerCase()}"`);

    if (correctAnswer) {
      await testFuzzyMatch(page, correctAnswer.toLowerCase(), true, "lowercase");
    }
  });

  test("typo with 1-2 character difference is accepted", async ({ page }) => {
    const { correctAnswer } = await getToWrongAnswerState(page);

    if (correctAnswer && correctAnswer.length > 5) {
      // Introduce a typo by swapping two adjacent characters
      const chars = correctAnswer.split("");
      if (chars.length > 3) {
        [chars[2], chars[3]] = [chars[3], chars[2]];
      }
      const typoAnswer = chars.join("");
      console.log(`Testing typo: "${typoAnswer}" (original: "${correctAnswer}")`);

      await testFuzzyMatch(page, typoAnswer, true, "typo");
    }
  });

  test("missing articles (the, a, an) is accepted", async ({ page }) => {
    const { correctAnswer } = await getToWrongAnswerState(page);

    if (correctAnswer) {
      // Remove common articles
      const withoutArticles = correctAnswer
        .replace(/\b(the|a|an)\s+/gi, "")
        .trim();
      console.log(`Testing without articles: "${withoutArticles}" (original: "${correctAnswer}")`);

      if (withoutArticles !== correctAnswer) {
        await testFuzzyMatch(page, withoutArticles, true, "no-articles");
      }
    }
  });

  test("partial key words are accepted", async ({ page }) => {
    const { correctAnswer } = await getToWrongAnswerState(page);

    if (correctAnswer) {
      // Extract key words (words > 4 chars, no common words)
      const skipWords = new Set(["the", "a", "an", "is", "are", "was", "were", "of", "to", "in", "for", "on", "with", "that", "this", "and", "but", "or"]);
      const words = correctAnswer.split(/\s+/).filter(w => w.length > 3 && !skipWords.has(w.toLowerCase()));

      // Use first 70% of key words
      const partialWords = words.slice(0, Math.max(1, Math.ceil(words.length * 0.7)));
      const partialAnswer = partialWords.join(" ");

      console.log(`Testing partial words: "${partialAnswer}" (original: "${correctAnswer}")`);

      if (partialAnswer.length >= 5) {
        await testFuzzyMatch(page, partialAnswer, true, "partial-words");
      }
    }
  });

  test("completely wrong answer is rejected", async ({ page }) => {
    const { correctAnswer } = await getToWrongAnswerState(page);

    if (correctAnswer) {
      // Use a clearly wrong answer
      const wrongAnswers = ["xyz123", "completely wrong answer", "bananas"];
      const wrongAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
      console.log(`Testing wrong answer: "${wrongAnswer}" (correct: "${correctAnswer}")`);

      await testFuzzyMatch(page, wrongAnswer, false, "wrong-answer");
    }
  });

  test("too short answer is rejected", async ({ page }) => {
    const { correctAnswer } = await getToWrongAnswerState(page);

    if (correctAnswer && correctAnswer.length > 10) {
      // Use only first 2 characters
      const tooShort = correctAnswer.substring(0, 2);
      console.log(`Testing too short: "${tooShort}" (correct: "${correctAnswer}")`);

      await testFuzzyMatch(page, tooShort, false, "too-short");
    }
  });

  test("word order variation is accepted", async ({ page }) => {
    const { correctAnswer } = await getToWrongAnswerState(page);

    if (correctAnswer) {
      // Reverse word order
      const words = correctAnswer.split(/\s+/);
      if (words.length >= 3) {
        const reversed = words.reverse().join(" ");
        console.log(`Testing reversed: "${reversed}" (original: "${correctAnswer}")`);

        await testFuzzyMatch(page, reversed, true, "word-order");
      }
    }
  });
});

test.describe("Fuzzy Match Unit Tests", () => {
  // These tests verify the fuzzy matching logic directly in the browser context
  test("verify fuzzy match algorithm in browser", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // Inject test cases and run them in browser context
    const results = await page.evaluate(async () => {
      // Dynamically import the fuzzy match module
      const { isFuzzyMatch } = await import("@/lib/fuzzy-match");

      const testCases = [
        // [typed, correct, shouldMatch, description]
        ["photosynthesis", "photosynthesis", true, "Exact match"],
        ["Photosynthesis", "photosynthesis", true, "Case insensitive"],
        ["photosynthisis", "photosynthesis", true, "Typo tolerance"],
        ["mitocondria", "mitochondria", true, "Typo tolerance 2"],
        ["the cell", "cell", true, "Article removed"],
        ["cell membrane", "The cell membrane", true, "Article ignored"],
        ["ATP production", "ATP is produced", true, "Word overlap"],
        ["produces ATP", "ATP production", true, "Word order"],
        ["running", "run", true, "Stemming"],
        ["cellular", "cell", true, "Stem match"],
        ["nucleus", "mitochondria", false, "Wrong term"],
        ["ab", "mitochondria", false, "Too short"],
        ["xyz", "photosynthesis", false, "Completely wrong"],
      ];

      const results = [];
      for (const [typed, correct, expected, desc] of testCases) {
        const actual = isFuzzyMatch(typed as string, correct as string);
        results.push({
          typed,
          correct,
          expected,
          actual,
          pass: actual === expected,
          description: desc,
        });
      }

      return results;
    });

    console.log("\n=== Fuzzy Match Unit Test Results ===\n");
    let passed = 0;
    let failed = 0;

    for (const result of results) {
      const status = result.pass ? "PASS" : "FAIL";
      console.log(`${status}: ${result.description}`);
      console.log(`  Typed: "${result.typed}" | Correct: "${result.correct}"`);
      console.log(`  Expected: ${result.expected} | Actual: ${result.actual}\n`);

      if (result.pass) {
        passed++;
      } else {
        failed++;
      }
    }

    console.log(`\nTotal: ${passed} passed, ${failed} failed\n`);
    expect(failed).toBe(0);
  });
});
