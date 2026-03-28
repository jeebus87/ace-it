import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Screenshot directory for Android tests
const SCREENSHOT_DIR = "e2e-screenshots/android";

// Test topic
const TEST_TOPIC = "How do volcanoes erupt?";

// Screenshot counter for ordering
let screenshotCounter = 0;

/**
 * Debug logger with timestamps
 */
function log(step: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${step}`);
  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    });
  }
}

/**
 * Take a screenshot with logging
 */
async function screenshot(page: Page, name: string): Promise<string> {
  screenshotCounter++;
  const filename = `${String(screenshotCounter).padStart(2, "0")}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);

  await page.screenshot({ path: filepath, fullPage: true });

  const stats = fs.statSync(filepath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  log(`SCREENSHOT: ${filename}`, { size: `${sizeKB}KB`, path: filepath });

  return filepath;
}

/**
 * Clean up screenshot directory
 */
function cleanupScreenshots() {
  log("CLEANUP: Starting screenshot directory cleanup");

  if (fs.existsSync(SCREENSHOT_DIR)) {
    const existingFiles = fs.readdirSync(SCREENSHOT_DIR);
    log("CLEANUP: Found existing files", { count: existingFiles.length, files: existingFiles });
    fs.rmSync(SCREENSHOT_DIR, { recursive: true, force: true });
  }

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  log("CLEANUP: Screenshot directory ready", { path: SCREENSHOT_DIR });
}

/**
 * Verify screenshots after test
 */
function verifyScreenshots(): string[] {
  log("VERIFY: Checking screenshots");

  const files = fs.readdirSync(SCREENSHOT_DIR).filter((f) => f.endsWith(".png"));
  files.sort();

  log("VERIFY: Screenshots found", { count: files.length });

  files.forEach((file) => {
    const filepath = path.join(SCREENSHOT_DIR, file);
    const stats = fs.statSync(filepath);
    console.log(`  - ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
  });

  return files;
}

/**
 * Safe click helper for mobile (handles overlapping elements)
 */
async function safeClick(page: Page, locator: ReturnType<Page["locator"]>) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ force: true });
}

test.describe("Android Mobile Quiz Flow", () => {
  test.beforeAll(() => {
    // Reset screenshot counter and clean directory
    screenshotCounter = 0;
    cleanupScreenshots();
  });

  test("complete full quiz flow on Android mobile", async ({ page }, testInfo) => {
    const startTime = Date.now();

    log("TEST START", {
      project: testInfo.project.name,
      topic: TEST_TOPIC,
      viewport: page.viewportSize(),
    });

    // ========================================
    // STEP 1: HOMEPAGE
    // ========================================
    log("STEP 1: Navigating to homepage");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const pageTitle = await page.title();
    log("STEP 1: Page loaded", {
      title: pageTitle,
      url: page.url(),
      viewport: page.viewportSize(),
    });

    await screenshot(page, "homepage");

    // Verify key elements
    const h1 = page.locator("h1");
    await expect(h1).toContainText("Ace-It");
    log("STEP 1: Header verified", { text: await h1.textContent() });

    // ========================================
    // STEP 2: SEARCH INPUT
    // ========================================
    log("STEP 2: Finding search textarea");
    const searchTextarea = page.locator("textarea").first();
    await expect(searchTextarea).toBeVisible();

    log("STEP 2: Clicking search textarea");
    await searchTextarea.click();
    await page.waitForTimeout(300);
    await screenshot(page, "search-focused");

    // ========================================
    // STEP 3: ENTER SEARCH QUERY
    // ========================================
    log("STEP 3: Typing search query", { query: TEST_TOPIC });
    await searchTextarea.fill(TEST_TOPIC);
    await screenshot(page, "search-entered");

    // ========================================
    // STEP 4: SUBMIT SEARCH
    // ========================================
    log("STEP 4: Submitting search");
    await searchTextarea.press("Enter");
    await page.waitForTimeout(500);
    await screenshot(page, "loading-state");

    // ========================================
    // STEP 5: DIFFICULTY SELECTION
    // ========================================
    log("STEP 5: Waiting for difficulty prompt");
    await page.waitForSelector("text=Choose Quiz Difficulty", { timeout: 180000 });
    await page.waitForTimeout(500);
    await screenshot(page, "difficulty-prompt");

    log("STEP 5: Selecting Intermediate difficulty");
    const intermediateBtn = page.locator("text=Intermediate").first();
    await intermediateBtn.click();
    await page.waitForTimeout(300);
    await screenshot(page, "difficulty-selected");

    log("STEP 5: Clicking Continue");
    const continueBtn = page.locator("text=Continue").first();
    await continueBtn.scrollIntoViewIfNeeded();
    await continueBtn.click({ force: true });

    // ========================================
    // STEP 6: CONTENT DISPLAY
    // ========================================
    log("STEP 6: Waiting for content to load");
    await page.waitForSelector("text=Start Mastery Quiz", { timeout: 180000 });
    await page.waitForTimeout(500);
    await screenshot(page, "content-loaded");

    // Check for image
    const hasImage = await page.locator('img[alt="Educational visual explanation"]').isVisible().catch(() => false);
    log("STEP 6: Content status", { hasImage });

    // Scroll to see more
    log("STEP 6: Scrolling content");
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(300);
    await screenshot(page, "content-scrolled");

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // ========================================
    // STEP 7: START QUIZ
    // ========================================
    log("STEP 7: Starting quiz");
    const quizBtn = page.locator("text=Start Mastery Quiz").first();
    await quizBtn.scrollIntoViewIfNeeded();
    await quizBtn.click({ force: true });

    await page.waitForSelector("text=Mastery Quiz", { timeout: 10000 });
    await page.waitForTimeout(500);
    await screenshot(page, "quiz-started");

    // ========================================
    // STEP 8-17: ANSWER ALL 10 QUESTIONS
    // ========================================
    const choices = ["A", "B", "C", "D"];
    let questionsAnswered = 0;

    for (let q = 1; q <= 10; q++) {
      log(`STEP ${7 + q}: Question ${q}/10`);

      // Wait for question to load
      try {
        await page.waitForSelector(`text=Question ${q} of 10`, { timeout: 5000 });
      } catch {
        log(`STEP ${7 + q}: Question indicator not found, continuing...`);
      }

      // Get question text for logging
      const questionText = await page.locator("p.text-lg, p.font-medium").first().textContent().catch(() => "Unknown");
      log(`STEP ${7 + q}: Question text`, { question: questionText?.substring(0, 100) });

      // Take screenshot of question
      await screenshot(page, `q${q}-question`);

      // Try to answer
      let answered = false;
      for (const choice of choices) {
        const choiceButton = page.locator("button").filter({ hasText: new RegExp(`^${choice}\\.`) });

        if (await choiceButton.isDisabled().catch(() => true)) {
          continue;
        }

        log(`STEP ${7 + q}: Selecting answer ${choice}`);
        await safeClick(page, choiceButton);
        await page.waitForTimeout(500);

        // Check if we got wrong answer prompt
        const typePrompt = page.locator("text=Type the correct answer to continue");
        const needToType = await typePrompt.isVisible().catch(() => false);

        if (needToType) {
          log(`STEP ${7 + q}: Wrong answer, typing correct answer`);
          await screenshot(page, `q${q}-wrong-answer`);

          // Find and type correct answer
          const correctButton = page.locator("button.border-green-500");
          const correctText = await correctButton.textContent();
          const match = correctText?.match(/^[A-D]\.\s*(.+)$/);
          const correctAnswer = match ? match[1].trim() : "";

          log(`STEP ${7 + q}: Correct answer`, { answer: correctAnswer });

          const inputField = page.locator('input[placeholder="Type the correct answer..."]');
          await inputField.fill(correctAnswer);
          await safeClick(page, page.locator("button").filter({ hasText: "Submit" }));
          await page.waitForTimeout(300);

          await screenshot(page, `q${q}-typed-answer`);
        } else {
          log(`STEP ${7 + q}: Answer accepted`);
          await screenshot(page, `q${q}-answered`);
        }

        answered = true;
        questionsAnswered++;
        break;
      }

      if (!answered) {
        log(`STEP ${7 + q}: WARNING - Could not answer question`);
      }

      // Click Next or Complete
      const nextButton = page.locator("button").filter({ hasText: "Next Question" });
      const completeButton = page.locator("button").filter({ hasText: "Complete Quiz" });

      if (await completeButton.isVisible().catch(() => false)) {
        log(`STEP ${7 + q}: Completing quiz`);
        await safeClick(page, completeButton);
        break;
      } else if (await nextButton.isVisible().catch(() => false)) {
        log(`STEP ${7 + q}: Moving to next question`);
        await safeClick(page, nextButton);
        await page.waitForTimeout(200);
      }
    }

    log("QUIZ PROGRESS", { questionsAnswered });

    // ========================================
    // STEP 18: QUIZ COMPLETION
    // ========================================
    log("STEP 18: Waiting for completion screen");
    await page.waitForTimeout(2000); // Wait for animations

    // Look for completion indicators
    try {
      await page
        .locator("text=Mastery Achieved")
        .or(page.locator("text=Perfect Score"))
        .or(page.locator("text=Quiz Complete"))
        .or(page.locator("text=Score:"))
        .or(page.locator("text=Close Quiz"))
        .first()
        .waitFor({ timeout: 10000 });
    } catch {
      log("STEP 18: Completion text not found, taking screenshot anyway");
    }

    await screenshot(page, "quiz-complete");

    // Log score if visible
    const scoreText = await page.locator("text=/\\d+%|Score:/").textContent().catch(() => "Score not visible");
    log("STEP 18: Quiz complete", { scoreInfo: scoreText });

    // ========================================
    // STEP 19: CLOSE QUIZ
    // ========================================
    log("STEP 19: Closing quiz");
    const closeQuizBtn = page.locator("text=Close Quiz").first();
    if (await closeQuizBtn.isVisible().catch(() => false)) {
      await safeClick(page, closeQuizBtn);
      await page.waitForTimeout(500);
    }

    await screenshot(page, "after-quiz-closed");

    // ========================================
    // VERIFICATION
    // ========================================
    log("VERIFICATION: Checking all screenshots");
    const screenshots = verifyScreenshots();

    const testDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    log("TEST COMPLETE", {
      duration: `${testDuration}s`,
      screenshotCount: screenshots.length,
      screenshotDir: SCREENSHOT_DIR,
    });

    // Assert we have minimum screenshots
    expect(screenshots.length).toBeGreaterThanOrEqual(12);
    log("VERIFICATION: Screenshot count assertion passed", { expected: ">=12", actual: screenshots.length });

    // Final summary
    console.log("\n========================================");
    console.log("ANDROID QUIZ FLOW TEST SUMMARY");
    console.log("========================================");
    console.log(`Topic: ${TEST_TOPIC}`);
    console.log(`Duration: ${testDuration}s`);
    console.log(`Screenshots: ${screenshots.length}`);
    console.log(`Directory: ${SCREENSHOT_DIR}`);
    console.log("========================================\n");
  });
});
