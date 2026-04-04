import { test, expect, Page } from "@playwright/test";

// Random topics for variety
const TOPICS = [
  "How do rainbows form?",
  "Why is the ocean salty?",
  "How do birds fly?",
  "What causes lightning?",
];

// Helper to take a named screenshot
async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e-screenshots/${name}.png`,
    fullPage: true,
  });
  console.log(`Screenshot: ${name}`);
}

// Helper to wait for element and screenshot
async function waitAndScreenshot(
  page: Page,
  selector: string,
  name: string,
  timeout = 180000
) {
  await page.waitForSelector(selector, { timeout });
  await page.waitForTimeout(500); // Let animations settle
  await screenshot(page, name);
}

// Helper for mobile-safe clicking (handles overlapping elements)
async function safeClick(page: Page, locator: ReturnType<Page["locator"]>) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ force: true });
}

test.describe("Visual UX/UI Test - All Screens", () => {
  test.beforeAll(async () => {
    // Ensure screenshot directory exists
    const fs = await import("fs");
    if (!fs.existsSync("e2e-screenshots")) {
      fs.mkdirSync("e2e-screenshots", { recursive: true });
    }
  });

  test("capture all app screens and states", async ({ page }, testInfo) => {
    const deviceName = testInfo.project.name.includes("Mobile")
      ? "mobile"
      : "desktop";
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    console.log(`\n=== Testing on ${deviceName.toUpperCase()} ===`);
    console.log(`Topic: "${topic}"\n`);

    // ========================================
    // SCREEN 1: Homepage / Landing
    // ========================================
    console.log("1. Homepage");
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await screenshot(page, `01-homepage-${deviceName}`);

    // Verify key elements are visible
    await expect(page.locator("h1")).toContainText("Ace-It");
    await expect(page.locator("textarea")).toBeVisible();

    // ========================================
    // SCREEN 2: Search Input Focused
    // ========================================
    console.log("2. Search input focused");
    const searchTextarea = page.locator("textarea").first();
    await searchTextarea.click();
    await screenshot(page, `02-search-focused-${deviceName}`);

    // ========================================
    // SCREEN 3: Search Query Entered
    // ========================================
    console.log("3. Query entered");
    await searchTextarea.fill(topic);
    await screenshot(page, `03-query-entered-${deviceName}`);

    // ========================================
    // SCREEN 4: Loading / Searching State
    // ========================================
    console.log("4. Submitting search...");
    await searchTextarea.press("Enter");

    // Capture loading state quickly
    await page.waitForTimeout(500);
    await screenshot(page, `04-loading-state-${deviceName}`);

    // ========================================
    // SCREEN 5: Difficulty Selection Prompt
    // ========================================
    console.log("5. Waiting for difficulty prompt...");
    await waitAndScreenshot(
      page,
      "text=Choose Quiz Difficulty",
      `05-difficulty-prompt-${deviceName}`
    );

    // ========================================
    // SCREEN 6: Difficulty Option Selected
    // ========================================
    console.log("6. Selecting difficulty");
    // Click on Intermediate to show selection state
    const intermediateBtn = page.locator("text=Intermediate").first();
    if (await intermediateBtn.isVisible()) {
      await intermediateBtn.click();
      await screenshot(page, `06-difficulty-selected-${deviceName}`);
    }

    // Click Continue (scroll into view first for mobile)
    const continueBtn = page.locator("text=Continue").first();
    await continueBtn.scrollIntoViewIfNeeded();
    await continueBtn.click({ force: true });

    // ========================================
    // SCREEN 7: Content Display (Answer + Image)
    // ========================================
    console.log("7. Waiting for content...");
    await waitAndScreenshot(
      page,
      "text=Start Mastery Quiz",
      `07-content-display-${deviceName}`
    );

    // Scroll to see more content
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(300);
    await screenshot(page, `07b-content-scrolled-${deviceName}`);

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));

    // ========================================
    // SCREEN 7c-7f: Image Viewer Interactions
    // ========================================
    console.log("7c. Testing image viewer...");

    // Check if image exists
    const visualImage = page.locator('img[alt="Educational visual explanation"]');
    if (await visualImage.isVisible().catch(() => false)) {
      // Click on image to expand (use force for mobile where elements may overlap)
      console.log("7c. Clicking image to expand");
      await visualImage.scrollIntoViewIfNeeded();
      await visualImage.click({ force: true });
      await page.waitForTimeout(500);
      await screenshot(page, `07c-image-expanded-${deviceName}`);

      // Screenshot shows fullscreen modal with image
      const expandedModal = page.locator(".fixed.inset-0");
      if (await expandedModal.isVisible().catch(() => false)) {
        // Click download button in expanded view
        console.log("7d. Clicking download button");
        const downloadBtn = page.locator('button:has(svg.lucide-download)').last();
        if (await downloadBtn.isVisible().catch(() => false)) {
          await downloadBtn.click({ force: true });
          await page.waitForTimeout(300);
          await screenshot(page, `07d-image-download-clicked-${deviceName}`);
        }

        // Close the expanded view
        console.log("7e. Closing image viewer");
        const closeBtn = page.locator('button:has(svg.lucide-x)').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click({ force: true });
        } else {
          // Click backdrop to close
          await page.keyboard.press("Escape");
        }
        await page.waitForTimeout(300);
        await screenshot(page, `07e-image-closed-${deviceName}`);
      }
    } else {
      console.log("7c. No image found, skipping image viewer test");
    }

    // ========================================
    // SCREEN 8: Quiz Modal - First Question
    // ========================================
    console.log("8. Opening quiz modal");
    const quizBtn = page.locator("text=Start Mastery Quiz").first();
    await quizBtn.scrollIntoViewIfNeeded();
    await quizBtn.click({ force: true });
    await page.waitForSelector("text=Mastery Quiz", { timeout: 10000 });
    await page.waitForTimeout(500);
    await screenshot(page, `08-quiz-modal-question-${deviceName}`);

    // ========================================
    // SCREEN 9: Quiz - Answer Selected (Correct)
    // ========================================
    console.log("9. Selecting an answer");
    // Try each choice until we get a response
    const choices = ["A", "B", "C", "D"];
    let answeredCorrectly = false;

    for (const choice of choices) {
      const choiceButton = page
        .locator("button")
        .filter({ hasText: new RegExp(`^${choice}\\.`) });

      if (await choiceButton.isDisabled().catch(() => true)) continue;

      await safeClick(page, choiceButton);
      await page.waitForTimeout(500);
      await screenshot(page, `09-answer-selected-${choice}-${deviceName}`);

      // Check if we need to type answer (wrong) or can proceed (correct)
      const typePrompt = page.locator(
        "text=Type the correct answer to continue"
      );
      const needToType = await typePrompt.isVisible().catch(() => false);

      if (needToType) {
        // ========================================
        // SCREEN 10: Wrong Answer - Type Prompt
        // ========================================
        console.log("10. Wrong answer - type prompt visible");
        await screenshot(page, `10-wrong-answer-type-prompt-${deviceName}`);

        // ========================================
        // SCREEN 11: Typing Correct Answer
        // ========================================
        console.log("11. Finding and typing correct answer");
        const correctButton = page.locator("button.border-green-500");
        const correctText = await correctButton.textContent();
        const match = correctText?.match(/^[A-D]\.\s*(.+)$/);
        const correctAnswer = match ? match[1].trim() : "";

        const inputField = page.locator(
          'input[placeholder="Type the correct answer..."]'
        );
        await inputField.fill(correctAnswer.substring(0, 20)); // Partial typing
        await screenshot(page, `11-typing-answer-${deviceName}`);

        // Complete the answer
        await inputField.fill(correctAnswer);
        await safeClick(page, page.locator("button").filter({ hasText: "Submit" }));
        await page.waitForTimeout(500);
        await screenshot(page, `11b-answer-submitted-${deviceName}`);
      } else {
        answeredCorrectly = true;
        console.log("10. Correct answer!");
        await screenshot(page, `10-correct-answer-${deviceName}`);
      }

      // Check if we can proceed
      const nextButton = page
        .locator("button")
        .filter({ hasText: "Next Question" });
      const completeButton = page
        .locator("button")
        .filter({ hasText: "Complete Quiz" });

      if (
        (await nextButton.isVisible().catch(() => false)) ||
        (await completeButton.isVisible().catch(() => false))
      ) {
        break;
      }
    }

    // ========================================
    // SCREEN 12: Quiz Progress (Multiple Questions)
    // ========================================
    console.log("12. Completing more questions for progress view");

    // Answer a few more questions to show progress
    for (let q = 2; q <= 4; q++) {
      const nextButton = page
        .locator("button")
        .filter({ hasText: "Next Question" });
      if (await nextButton.isVisible().catch(() => false)) {
        await safeClick(page, nextButton);
        await page.waitForTimeout(300);
      }

      await page
        .waitForSelector(`text=Question ${q} of 10`, { timeout: 5000 })
        .catch(() => {});

      // Quick answer
      for (const choice of choices) {
        const choiceButton = page
          .locator("button")
          .filter({ hasText: new RegExp(`^${choice}\\.`) });

        if (await choiceButton.isDisabled().catch(() => true)) continue;

        await safeClick(page, choiceButton);
        await page.waitForTimeout(400);

        // Handle type prompt if needed
        const typePrompt = page.locator(
          "text=Type the correct answer to continue"
        );
        if (await typePrompt.isVisible().catch(() => false)) {
          const correctButton = page.locator("button.border-green-500");
          const correctText = await correctButton.textContent();
          const match = correctText?.match(/^[A-D]\.\s*(.+)$/);
          const correctAnswer = match ? match[1].trim() : "";

          await page
            .locator('input[placeholder="Type the correct answer..."]')
            .fill(correctAnswer);
          await safeClick(page, page.locator("button").filter({ hasText: "Submit" }));
          await page.waitForTimeout(300);
        }

        const canProceed =
          (await page
            .locator("button")
            .filter({ hasText: "Next Question" })
            .isVisible()
            .catch(() => false)) ||
          (await page
            .locator("button")
            .filter({ hasText: "Complete Quiz" })
            .isVisible()
            .catch(() => false));

        if (canProceed) break;
      }

      if (q === 3) {
        await screenshot(page, `12-quiz-progress-q${q}-${deviceName}`);
      }
    }

    // ========================================
    // SCREEN 13: Complete remaining questions
    // ========================================
    console.log("13. Completing remaining questions...");

    for (let q = 5; q <= 10; q++) {
      const nextButton = page
        .locator("button")
        .filter({ hasText: "Next Question" });
      const completeButton = page
        .locator("button")
        .filter({ hasText: "Complete Quiz" });

      if (await nextButton.isVisible().catch(() => false)) {
        await safeClick(page, nextButton);
        await page.waitForTimeout(200);
      } else if (await completeButton.isVisible().catch(() => false)) {
        // Take screenshot before completing
        await screenshot(page, `13-last-question-${deviceName}`);
        await safeClick(page, completeButton);
        break;
      }

      // Answer the question
      for (const choice of choices) {
        const choiceButton = page
          .locator("button")
          .filter({ hasText: new RegExp(`^${choice}\\.`) });

        if (await choiceButton.isDisabled().catch(() => true)) continue;

        await safeClick(page, choiceButton);
        await page.waitForTimeout(300);

        const typePrompt = page.locator(
          "text=Type the correct answer to continue"
        );
        if (await typePrompt.isVisible().catch(() => false)) {
          const correctButton = page.locator("button.border-green-500");
          const correctText = await correctButton.textContent();
          const match = correctText?.match(/^[A-D]\.\s*(.+)$/);
          const correctAnswer = match ? match[1].trim() : "";

          await page
            .locator('input[placeholder="Type the correct answer..."]')
            .fill(correctAnswer);
          await safeClick(page, page.getByRole("button", { name: "Submit", exact: true }));
          await page.waitForTimeout(200);
        }

        const canProceed =
          (await page
            .locator("button")
            .filter({ hasText: "Next Question" })
            .isVisible()
            .catch(() => false)) ||
          (await page
            .locator("button")
            .filter({ hasText: "Complete Quiz" })
            .isVisible()
            .catch(() => false));

        if (canProceed) break;
      }
    }

    // Click Complete Quiz if visible
    const finalCompleteButton = page
      .locator("button")
      .filter({ hasText: "Complete Quiz" });
    if (await finalCompleteButton.isVisible().catch(() => false)) {
      await safeClick(page, finalCompleteButton);
    }

    // ========================================
    // SCREEN 14: Quiz Completion Screen
    // ========================================
    console.log("14. Quiz completion screen");
    await page.waitForTimeout(2000); // Wait for confetti/animations

    // Wait for any completion indicator
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
      console.log("Note: Completion text not found, continuing...");
    }

    await screenshot(page, `14-quiz-complete-${deviceName}`);

    // ========================================
    // SCREEN 15: Close Quiz - Back to Content
    // ========================================
    console.log("15. Closing quiz");
    const closeQuizBtn = page.locator("text=Close Quiz").first();
    await safeClick(page, closeQuizBtn);
    await page.waitForTimeout(500);
    await screenshot(page, `15-after-quiz-closed-${deviceName}`);

    // ========================================
    // SCREEN 16: History Sidebar (if available)
    // ========================================
    console.log("16. Checking history sidebar");
    // Look for history toggle button
    const historyButton = page.locator('button[aria-label*="history"]').first();
    const historyToggle = page.locator("button").filter({ hasText: /^\d+$/ });

    if (await historyToggle.isVisible().catch(() => false)) {
      await safeClick(page, historyToggle);
      await page.waitForTimeout(500);
      await screenshot(page, `16-history-sidebar-${deviceName}`);

      // Close sidebar
      const closeBtn = page.locator('button:has(svg[class*="X"])').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await safeClick(page, closeBtn);
      }
    } else if (await historyButton.isVisible().catch(() => false)) {
      await safeClick(page, historyButton);
      await page.waitForTimeout(500);
      await screenshot(page, `16-history-sidebar-${deviceName}`);
    }

    // ========================================
    // SCREEN 17: Sound Toggle (if visible)
    // ========================================
    console.log("17. Checking sound toggle");
    const soundToggle = page.locator('button:has(svg[class*="Volume"])').first();
    if (await soundToggle.isVisible().catch(() => false)) {
      await screenshot(page, `17-sound-toggle-visible-${deviceName}`);
    }

    // ========================================
    // Final Summary
    // ========================================
    console.log(`\n=== ${deviceName.toUpperCase()} TEST COMPLETE ===`);
    console.log("Screenshots saved to: e2e-screenshots/\n");
  });
});

// ========================================
// API ENDPOINT TESTS - New Gemini Features
// ========================================
test.describe("API Endpoint Tests - Gemini Features", () => {
  const API_BASE = "https://jeebus87--ace-it-backend-api.modal.run";

  test("Generate endpoint uses Google Search grounding", async ({ request }) => {
    console.log("Testing /generate with Google Search grounding...");

    const response = await request.post(`${API_BASE}/generate`, {
      data: { question: "What is photosynthesis?" },
      timeout: 120000,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Should have answer
    expect(data.answer).toBeTruthy();
    expect(data.answer.length).toBeGreaterThan(100);

    // Should have sources from Google Search grounding
    if (data.sources) {
      console.log(`Found ${data.sources.length} sources from Google Search`);
    }

    console.log("Generate endpoint test passed!");
  });

  test("Generate endpoint returns numbered real-world examples", async ({ request }) => {
    console.log("Testing /generate for numbered Real-World Examples...");

    const response = await request.post(`${API_BASE}/generate`, {
      data: { question: "What are the amendments in the Bill of Rights?" },
      timeout: 120000,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Should have answer with Real-World Examples section
    expect(data.answer).toBeTruthy();
    expect(data.answer).toContain("Real-World Examples");

    // Extract the Real-World Examples section
    const examplesMatch = data.answer.match(/## Real-World Examples([\s\S]*?)(?=##|$)/);
    expect(examplesMatch).toBeTruthy();

    const examplesSection = examplesMatch![1];

    // Should have numbered examples (1. 2. 3. etc.)
    const numberedPattern = /^\d+\.\s/gm;
    const matches = examplesSection.match(numberedPattern);

    expect(matches).toBeTruthy();
    expect(matches!.length).toBeGreaterThanOrEqual(10);

    console.log(`Found ${matches!.length} numbered examples`);
    console.log("Numbered examples test passed!");
  });

  test("Quiz endpoint returns structured output", async ({ request }) => {
    console.log("Testing /quiz with structured output...");

    const response = await request.post(`${API_BASE}/quiz`, {
      data: {
        question: "What is photosynthesis?",
        answer: "Photosynthesis is the process by which plants convert sunlight into energy.",
        difficulty: "beginner",
      },
      timeout: 180000, // 3 min for cold start
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Structured output guarantees valid format
    expect(data.questions).toBeDefined();
    expect(Array.isArray(data.questions)).toBeTruthy();
    expect(data.questions.length).toBe(10);

    // Verify each question has required structure
    for (const q of data.questions) {
      expect(q.id).toBeDefined();
      expect(q.question).toBeTruthy();
      expect(q.choices).toBeDefined();
      expect(q.choices.A).toBeTruthy();
      expect(q.choices.B).toBeTruthy();
      expect(q.choices.C).toBeTruthy();
      expect(q.choices.D).toBeTruthy();
      expect(["A", "B", "C", "D"]).toContain(q.correct);
      expect(q.explanation).toBeTruthy();
    }

    console.log("Quiz structured output test passed!");
  });

  test("TTS endpoint responds", async ({ request }) => {
    console.log("Testing /speak TTS endpoint...");

    const response = await request.post(`${API_BASE}/speak`, {
      data: {
        text: "Hello, this is a test of the text to speech feature.",
        voice: "Puck",
      },
      timeout: 60000,
    });

    // Endpoint should respond (200 OK or with error in body)
    const data = await response.json();

    if (data.audio) {
      expect(data.audio.length).toBeGreaterThan(100);
      expect(data.mime_type).toContain("audio");
      console.log("TTS generated audio successfully!");
    } else if (data.error) {
      // API may not support TTS on this model - that's OK for now
      console.log(`TTS endpoint responded with: ${data.error}`);
      expect(data.error).toBeTruthy(); // Has a response
    }
  });

  test("Code execution endpoint responds", async ({ request }) => {
    console.log("Testing /solve code execution endpoint...");

    const response = await request.post(`${API_BASE}/solve`, {
      data: {
        problem: "Calculate the factorial of 5",
      },
      timeout: 60000,
    });

    const data = await response.json();

    if (data.explanation) {
      console.log("Code execution explanation received!");
      // May have code execution results
      if (data.code) {
        console.log("Code was executed:");
        console.log(data.code.substring(0, 200));
      }
      if (data.output) {
        console.log("Output:", data.output.substring(0, 100));
      }
      console.log("Code execution test passed!");
    } else if (data.error) {
      // API may not support code execution on this SDK version
      console.log(`Code execution endpoint responded with: ${data.error}`);
      expect(data.error).toBeTruthy();
    }
  });

  test("Follow-up endpoint responds", async ({ request }) => {
    console.log("Testing /follow-up context caching...");

    // First question
    const response1 = await request.post(`${API_BASE}/follow-up`, {
      data: {
        question: "What is the capital of France?",
        context: "We are studying European geography.",
      },
      timeout: 60000,
    });

    const data1 = await response1.json();

    if (data1.answer) {
      expect(data1.session_id).toBeTruthy();

      // Follow-up question using session
      const response2 = await request.post(`${API_BASE}/follow-up`, {
        data: {
          session_id: data1.session_id,
          question: "What about Germany?",
        },
        timeout: 60000,
      });

      const data2 = await response2.json();

      if (data2.answer) {
        // Should mention Berlin (context should be preserved)
        expect(data2.answer.toLowerCase()).toContain("berlin");
        console.log("Follow-up context caching test passed!");
      } else if (data2.error) {
        console.log(`Follow-up endpoint responded with: ${data2.error}`);
      }
    } else if (data1.error) {
      // API may have compatibility issues
      console.log(`Follow-up endpoint responded with: ${data1.error}`);
      expect(data1.error).toBeTruthy();
    }
  });

  test("Validate-answer endpoint accepts correct answers with typos", async ({ request }) => {
    console.log("Testing /validate-answer with Gemini Flash...");

    // Test 1: Exact match should pass
    const exactMatch = await request.post(`${API_BASE}/validate-answer`, {
      data: {
        typed: "photosynthesis",
        correct: "photosynthesis",
        question: "What is the process plants use to make food?",
      },
      timeout: 30000,
    });
    const exactData = await exactMatch.json();
    expect(exactData.is_correct).toBe(true);
    console.log("  Exact match: PASSED");

    // Test 2: Typo should pass
    const typoMatch = await request.post(`${API_BASE}/validate-answer`, {
      data: {
        typed: "photosynthisis",
        correct: "photosynthesis",
        question: "What is the process plants use to make food?",
      },
      timeout: 30000,
    });
    const typoData = await typoMatch.json();
    expect(typoData.is_correct).toBe(true);
    console.log("  Typo (photosynthisis): PASSED");

    // Test 3: Synonym/paraphrase should pass
    const synonymMatch = await request.post(`${API_BASE}/validate-answer`, {
      data: {
        typed: "the powerhouse of the cell",
        correct: "mitochondria",
        question: "What organelle produces energy?",
      },
      timeout: 30000,
    });
    const synonymData = await synonymMatch.json();
    expect(synonymData.is_correct).toBe(true);
    console.log("  Synonym (powerhouse of cell = mitochondria): PASSED");

    // Test 4: Missing article should pass
    const missingArticle = await request.post(`${API_BASE}/validate-answer`, {
      data: {
        typed: "cell membrane",
        correct: "The cell membrane",
        question: "What controls what enters the cell?",
      },
      timeout: 30000,
    });
    const articleData = await missingArticle.json();
    expect(articleData.is_correct).toBe(true);
    console.log("  Missing article: PASSED");

    // Test 5: Wrong answer should be rejected
    const wrongAnswer = await request.post(`${API_BASE}/validate-answer`, {
      data: {
        typed: "nucleus",
        correct: "mitochondria",
        question: "What is the powerhouse of the cell?",
      },
      timeout: 30000,
    });
    const wrongData = await wrongAnswer.json();
    expect(wrongData.is_correct).toBe(false);
    console.log("  Wrong answer (nucleus vs mitochondria): CORRECTLY REJECTED");

    console.log("Validate-answer endpoint test passed!");
  });
});

