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

    // Click Continue
    await page.click("text=Continue");

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
    // SCREEN 8: Quiz Modal - First Question
    // ========================================
    console.log("8. Opening quiz modal");
    await page.click("text=Start Mastery Quiz");
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

      await choiceButton.click();
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
        await page.locator("button").filter({ hasText: "Submit" }).click();
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
        await nextButton.click();
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

        await choiceButton.click();
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
          await page.locator("button").filter({ hasText: "Submit" }).click();
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
        await nextButton.click();
        await page.waitForTimeout(200);
      } else if (await completeButton.isVisible().catch(() => false)) {
        // Take screenshot before completing
        await screenshot(page, `13-last-question-${deviceName}`);
        await completeButton.click();
        break;
      }

      // Answer the question
      for (const choice of choices) {
        const choiceButton = page
          .locator("button")
          .filter({ hasText: new RegExp(`^${choice}\\.`) });

        if (await choiceButton.isDisabled().catch(() => true)) continue;

        await choiceButton.click();
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
          await page.locator("button").filter({ hasText: "Submit" }).click();
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
      await finalCompleteButton.click();
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
    await page.click("text=Close Quiz");
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
      await historyToggle.click();
      await page.waitForTimeout(500);
      await screenshot(page, `16-history-sidebar-${deviceName}`);

      // Close sidebar
      const closeBtn = page.locator('button:has(svg[class*="X"])').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      }
    } else if (await historyButton.isVisible().catch(() => false)) {
      await historyButton.click();
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
