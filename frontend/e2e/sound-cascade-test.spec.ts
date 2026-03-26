import { test, expect } from "@playwright/test";

// Random topics for testing
const TOPICS = [
  "What causes rainbows?",
  "How do volcanoes form?",
  "Why is the sky blue?",
  "How do airplanes fly?",
  "What causes thunder?",
  "How do magnets work?",
  "Why do seasons change?",
  "How does photosynthesis work?",
];

test.describe("Sound Cascade Prevention Test", () => {
  test("rapidly clicking through quiz should not crash the app", async ({
    page,
  }) => {
    test.setTimeout(300000); // 5 minute timeout

    // Track any page crashes or errors
    let hasError = false;
    let errorMessage = "";

    page.on("pageerror", (error) => {
      console.log("PAGE ERROR:", error.message);
      hasError = true;
      errorMessage = error.message;
    });

    page.on("crash", () => {
      console.log("PAGE CRASHED!");
      hasError = true;
      errorMessage = "Page crashed";
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("CONSOLE ERROR:", msg.text());
      }
    });

    // 1. Navigate to site
    console.log("ACTION: Navigate to site");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 2. Enter a random topic
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    console.log(`ACTION: Enter search query - "${topic}"`);
    const searchTextarea = page.locator("textarea").first();
    await searchTextarea.fill(topic);
    await searchTextarea.press("Enter");

    // 3. Wait for difficulty prompt
    console.log("ACTION: Waiting for content to load...");
    await page.waitForSelector("text=Choose Quiz Difficulty", {
      timeout: 180000,
    });

    // 4. Select difficulty and continue
    await page.click("text=Continue");
    console.log("ACTION: Selected difficulty");

    // 5. Wait for quiz button
    await page.waitForSelector("text=Start Mastery Quiz", { timeout: 120000 });

    // 6. Start the quiz
    await page.click("text=Start Mastery Quiz");
    await expect(
      page.getByRole("heading", { name: "Mastery Quiz" })
    ).toBeVisible();
    console.log("ACTION: Quiz modal opened");

    // 7. Rapidly answer all questions (stress test for sound cascading)
    console.log("\n=== RAPID ANSWER TEST (Sound Cascade Prevention) ===\n");

    for (let q = 1; q <= 10; q++) {
      // Check for crashes before each question
      expect(hasError).toBe(false);

      console.log(`Question ${q}/10 - Rapid clicking test`);

      // Wait for question to appear
      await page.waitForSelector(`text=Question ${q} of 10`, { timeout: 10000 });

      // Get all answer buttons
      const choices = ["A", "B", "C", "D"];

      // Rapidly click through choices with minimal delay (stress test)
      for (const choice of choices) {
        const choiceButton = page.locator("button").filter({
          hasText: new RegExp(`^${choice}\\.`),
        });

        const isDisabled = await choiceButton.isDisabled().catch(() => true);
        if (isDisabled) continue;

        // Click with minimal delay to trigger potential sound cascade
        await choiceButton.click();
        await page.waitForTimeout(50); // Very short delay to stress test

        // Check if we got an answer right or need to type
        const typePrompt = page.locator(
          "text=Type the correct answer to continue"
        );
        const needToType = await typePrompt.isVisible().catch(() => false);

        if (needToType) {
          // Find and type correct answer
          const correctButton = page.locator("button.border-green-500");
          const correctText = await correctButton.textContent();
          const match = correctText?.match(/^[A-D]\.\s*(.+)$/);
          const correctAnswer = match ? match[1].trim() : "";

          const inputField = page.locator(
            'input[placeholder="Type the correct answer..."]'
          );
          await inputField.fill(correctAnswer);
          await page.locator("button").filter({ hasText: "Submit" }).click();
          await page.waitForTimeout(100);
        }

        // Check if we can proceed
        const nextButton = page.locator("button").filter({
          hasText: "Next Question",
        });
        const completeButton = page.locator("button").filter({
          hasText: "Complete Quiz",
        });

        const canProceed =
          (await nextButton.isVisible().catch(() => false)) ||
          (await completeButton.isVisible().catch(() => false));

        if (canProceed) {
          if (q < 10) {
            await nextButton.click();
          } else {
            await completeButton.click();
          }
          break;
        }
      }
    }

    // 8. Verify quiz completed without crashes
    console.log("\n=== VERIFYING COMPLETION ===");

    // Wait for completion screen
    await expect(
      page.locator("text=Mastery Achieved").or(page.locator("text=Perfect Score"))
    ).toBeVisible({ timeout: 10000 });

    // Final crash check
    expect(hasError).toBe(false);

    if (hasError) {
      console.log(`TEST FAILED: ${errorMessage}`);
    } else {
      console.log("SUCCESS: Quiz completed without sound cascade crashes!");
    }

    // Close the quiz
    await page.click("text=Close Quiz");
    console.log("Quiz closed successfully");
  });

  test("multiple rapid correct answers should not cause audio overload", async ({
    page,
  }) => {
    test.setTimeout(300000);

    // Monitor for audio-related errors
    const audioErrors: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text().toLowerCase();
      if (
        text.includes("audio") ||
        text.includes("oscillator") ||
        text.includes("webaudio")
      ) {
        console.log("AUDIO LOG:", msg.text());
        if (msg.type() === "error") {
          audioErrors.push(msg.text());
        }
      }
    });

    // 1. Navigate and start quiz
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    console.log(`Testing with topic: "${topic}"`);

    const searchTextarea = page.locator("textarea").first();
    await searchTextarea.fill(topic);
    await searchTextarea.press("Enter");

    await page.waitForSelector("text=Choose Quiz Difficulty", {
      timeout: 180000,
    });
    await page.click("text=Continue");
    await page.waitForSelector("text=Start Mastery Quiz", { timeout: 120000 });
    await page.click("text=Start Mastery Quiz");
    await expect(
      page.getByRole("heading", { name: "Mastery Quiz" })
    ).toBeVisible();

    // 2. Complete quiz while checking for audio errors
    for (let q = 1; q <= 10; q++) {
      await page.waitForSelector(`text=Question ${q} of 10`, { timeout: 10000 });

      const choices = ["A", "B", "C", "D"];
      for (const choice of choices) {
        const choiceButton = page.locator("button").filter({
          hasText: new RegExp(`^${choice}\\.`),
        });

        const isDisabled = await choiceButton.isDisabled().catch(() => true);
        if (isDisabled) continue;

        await choiceButton.click();
        await page.waitForTimeout(100);

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
          await page.waitForTimeout(100);
        }

        const nextButton = page.locator("button").filter({
          hasText: "Next Question",
        });
        const completeButton = page.locator("button").filter({
          hasText: "Complete Quiz",
        });

        if (
          (await nextButton.isVisible().catch(() => false)) ||
          (await completeButton.isVisible().catch(() => false))
        ) {
          if (q < 10) {
            await nextButton.click();
          } else {
            await completeButton.click();
          }
          break;
        }
      }
    }

    // 3. Verify no audio errors occurred
    expect(audioErrors.length).toBe(0);

    await expect(
      page.locator("text=Mastery Achieved").or(page.locator("text=Perfect Score"))
    ).toBeVisible({ timeout: 10000 });

    console.log(
      `SUCCESS: Quiz completed with ${audioErrors.length} audio errors`
    );

    await page.click("text=Close Quiz");
  });
});
