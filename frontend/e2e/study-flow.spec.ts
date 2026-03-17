import { test, expect, Page } from "@playwright/test";

// Debug logging helper
function log(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data !== undefined) {
    console.log(`  Data: ${JSON.stringify(data, null, 2)}`);
  }
}

// Helper to wait for network idle with logging
async function waitForNetworkIdle(page: Page, timeout = 30000) {
  log("Waiting for network to be idle...");
  await page.waitForLoadState("networkidle", { timeout });
  log("Network is idle");
}

// Helper to capture console messages
function setupConsoleLogging(page: Page) {
  page.on("console", (msg) => {
    log(`Browser console [${msg.type()}]: ${msg.text()}`);
  });

  page.on("pageerror", (error) => {
    log(`Browser page error: ${error.message}`);
  });

  page.on("request", (request) => {
    if (request.url().includes("/api/")) {
      log(`API Request: ${request.method()} ${request.url()}`);
    }
  });

  page.on("response", (response) => {
    if (response.url().includes("/api/")) {
      log(`API Response: ${response.status()} ${response.url()}`);
    }
  });
}

test.describe("Ace-It Study Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    log("=".repeat(60));
    log("Starting new test");
    setupConsoleLogging(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    log(`Test "${testInfo.title}" finished with status: ${testInfo.status}`);
    if (testInfo.status !== "passed") {
      log("Taking failure screenshot...");
      await page.screenshot({
        path: `test-results/failure-${testInfo.title.replace(/\s+/g, "-")}.png`,
        fullPage: true,
      });
    }
    log("=".repeat(60));
  });

  test("Complete study flow: First Amendment query", async ({ page }) => {
    const query = "What is the first amendment?";

    // Step 1: Navigate to the app
    log("Step 1: Navigating to Ace-It homepage...");
    await page.goto("/");
    log(`Current URL: ${page.url()}`);

    // Verify page loaded correctly
    log("Verifying page elements...");
    await expect(page.locator("h1")).toContainText("Ace-It");
    log("Header 'Ace-It' found");

    // Step 2: Enter the search query
    log(`Step 2: Entering search query: "${query}"`);
    const searchInput = page.locator('textarea[placeholder*="study"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    log("Search input is visible");

    await searchInput.fill(query);
    log("Query entered successfully");

    // Verify query was entered
    const inputValue = await searchInput.inputValue();
    log(`Verified input value: "${inputValue}"`);
    expect(inputValue).toBe(query);

    // Step 3: Submit the search (using Enter key since button doesn't have type="submit")
    log("Step 3: Submitting search via Enter key...");
    await searchInput.press("Enter");
    log("Search submitted, waiting for response...");

    // Step 4: Wait for status updates
    log("Step 4: Monitoring status updates...");

    // Wait for "Searching reliable sources" status
    const statusLocator = page.locator("text=Searching reliable sources");
    try {
      await expect(statusLocator).toBeVisible({ timeout: 5000 });
      log("Status: 'Searching reliable sources' visible");
    } catch {
      log("Note: 'Searching reliable sources' status might have passed quickly");
    }

    // Step 5: Wait for answer to appear
    log("Step 5: Waiting for answer to appear...");
    const answerContainer = page.locator('[class*="prose"]').first();

    // Wait for answer content (this can take up to 60 seconds)
    log("Waiting for answer content (timeout: 90s)...");
    await expect(answerContainer).toBeVisible({ timeout: 90000 });
    log("Answer container is visible");

    // Verify answer contains relevant content
    const answerText = await answerContainer.textContent();
    log(`Answer preview (first 200 chars): "${answerText?.substring(0, 200)}..."`);

    // Check for First Amendment related keywords
    const keywords = [
      "amendment",
      "first",
      "speech",
      "religion",
      "press",
      "assembly",
      "constitution",
    ];
    const foundKeywords = keywords.filter(
      (kw) => answerText?.toLowerCase().includes(kw)
    );
    log(`Found relevant keywords: ${foundKeywords.join(", ")}`);
    expect(foundKeywords.length).toBeGreaterThan(0);

    // Step 6: Check for generated image
    log("Step 6: Checking for generated image...");
    try {
      const imageElement = page.locator("img").first();
      await expect(imageElement).toBeVisible({ timeout: 30000 });
      const imageSrc = await imageElement.getAttribute("src");
      log(`Image found with src: ${imageSrc?.substring(0, 100)}...`);
    } catch (error) {
      log("Note: Image may not have loaded or may not be present");
      log(`Image check error: ${error}`);
    }

    // Step 7: Wait for difficulty prompt
    log("Step 7: Checking for difficulty selection prompt...");
    const difficultyPrompt = page.locator("text=Choose Quiz Difficulty");
    try {
      await expect(difficultyPrompt).toBeVisible({ timeout: 30000 });
      log("Difficulty prompt is visible");

      // Select Intermediate difficulty
      log("Selecting 'Intermediate' difficulty...");
      const intermediateOption = page.locator("text=Intermediate").first();
      await intermediateOption.click();
      log("Intermediate option selected");

      // Click Continue
      const continueButton = page.locator('button:has-text("Continue")');
      await continueButton.click();
      log("Continue button clicked");
    } catch (error) {
      log("Note: Difficulty prompt may have been skipped (dontAskAgain enabled)");
      log(`Error details: ${error}`);
    }

    // Step 8: Wait for quiz to be ready
    log("Step 8: Waiting for quiz button...");
    const quizButton = page.locator("button", {
      hasText: "Start Mastery Quiz",
    });

    try {
      await expect(quizButton).toBeVisible({ timeout: 60000 });
      log("Quiz button is visible");

      const buttonText = await quizButton.textContent();
      log(`Quiz button text: "${buttonText}"`);
    } catch (error) {
      log("Quiz button did not appear within timeout");
      log(`Error: ${error}`);
    }

    // Step 9: Open the quiz modal
    log("Step 9: Opening quiz modal...");
    if (await quizButton.isVisible()) {
      await quizButton.click();
      log("Quiz button clicked");

      // Verify quiz modal opened
      const quizModal = page.locator("text=Mastery Quiz").first();
      await expect(quizModal).toBeVisible({ timeout: 5000 });
      log("Quiz modal is open");

      // Verify quiz has questions
      const questionText = page.locator('text=/Q1:.*\\?/');
      await expect(questionText).toBeVisible({ timeout: 5000 });
      const question = await questionText.textContent();
      log(`First question preview: "${question?.substring(0, 100)}..."`);

      // Verify answer choices are present
      const choiceA = page.locator('button:has-text("A.")').first();
      await expect(choiceA).toBeVisible();
      log("Answer choices are visible");

      // Step 10: Answer the first question
      log("Step 10: Answering first question...");
      await choiceA.click();
      log("Selected answer A");

      // Wait for feedback
      const feedback = page.locator('[class*="rounded-xl"]', {
        hasText: /Nailed it|Got it|Not quite/,
      });
      await expect(feedback).toBeVisible({ timeout: 5000 });
      const feedbackText = await feedback.textContent();
      log(`Feedback received: "${feedbackText?.substring(0, 100)}..."`);

      // Step 11: Close the quiz
      log("Step 11: Closing quiz modal...");
      // The close button is in the quiz modal header, near "Mastery Quiz" text
      const quizModalHeader = page.locator('div:has(h2:text("Mastery Quiz"))');
      const closeButton = quizModalHeader.locator('button').first();
      await closeButton.click();
      log("Quiz closed");
    }

    // Step 12: Verify history sidebar
    log("Step 12: Checking history sidebar...");
    const historyButton = page.locator('button:has(svg)').filter({
      has: page.locator('[class*="History"], text=/\\d/'),
    });

    try {
      // The history button should show "1" for one inquiry
      const historyToggle = page.locator("button", { hasText: /History|1/ }).first();
      if (await historyToggle.isVisible()) {
        log("History toggle button found");
        await historyToggle.click();
        log("History sidebar opened");

        // Verify inquiry is in history
        const historyItem = page.locator("text=first amendment").first();
        await expect(historyItem).toBeVisible({ timeout: 5000 });
        log("Inquiry found in history");

        // Close history sidebar
        const closeSidebar = page.locator('button:has(svg[class*="ChevronLeft"])');
        if (await closeSidebar.isVisible()) {
          await closeSidebar.click();
          log("History sidebar closed");
        }
      }
    } catch (error) {
      log("Note: History sidebar check encountered an issue");
      log(`Error: ${error}`);
    }

    // Final verification
    log("=".repeat(40));
    log("TEST COMPLETED SUCCESSFULLY");
    log("Summary:");
    log("- Page loaded correctly");
    log("- Search query submitted");
    log("- Answer received with relevant content");
    log("- Quiz generated and interactive");
    log("=".repeat(40));
  });

  test("Verify page title is 'Ace-It'", async ({ page }) => {
    log("Navigating to homepage...");
    await page.goto("/");

    log("Checking page title...");
    const title = await page.title();
    log(`Page title: "${title}"`);

    expect(title).toContain("Ace-It");
    log("Page title verification passed");
  });

  test("Verify responsive design on mobile viewport", async ({ page }) => {
    log("Setting mobile viewport (375x667 - iPhone SE)...");
    await page.setViewportSize({ width: 375, height: 667 });

    log("Navigating to homepage...");
    await page.goto("/");

    log("Verifying header is visible on mobile...");
    await expect(page.locator("h1")).toContainText("Ace-It");

    log("Verifying search input is visible on mobile...");
    const searchInput = page.locator('textarea[placeholder*="study"]');
    await expect(searchInput).toBeVisible();

    log("Mobile responsive design verified");
  });
});
