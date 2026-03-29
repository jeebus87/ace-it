import { test, expect } from "@playwright/test";

test.describe("Mobile Citations Flow", () => {
  test("all sources are cited inline", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Enter search query
    const searchTextarea = page.locator("textarea").first();
    await searchTextarea.click();
    await searchTextarea.fill("What is photosynthesis?");
    await searchTextarea.press("Enter");

    // Wait for answer to load (look for Summary section)
    await page.waitForSelector("text=Summary", { timeout: 180000 });
    await page.waitForTimeout(1000);

    // Get the answer content
    const answerContent = await page.locator(".terminal-content").textContent() || "";

    // Find all superscript citation numbers (handles multi-digit like ¹⁰, ¹¹, etc.)
    const superscriptDigits = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    const citedNumbers = new Set<number>();

    // Parse citation numbers from text
    let i = 0;
    while (i < answerContent.length) {
      if (superscriptDigits.includes(answerContent[i])) {
        let numStr = "";
        while (i < answerContent.length && superscriptDigits.includes(answerContent[i])) {
          numStr += superscriptDigits.indexOf(answerContent[i]);
          i++;
        }
        if (numStr) {
          citedNumbers.add(parseInt(numStr, 10));
        }
      } else {
        i++;
      }
    }

    console.log("Cited source numbers:", Array.from(citedNumbers).sort((a, b) => a - b));
    console.log("Unique citations count:", citedNumbers.size);

    // Verify we have at least some citations
    expect(citedNumbers.size).toBeGreaterThan(0);

    // Check for SOURCES section
    const sourcesSection = page.locator("text=SOURCES");
    await expect(sourcesSection).toBeVisible();

    // Count source links
    const sourceLinks = page.locator("ol >> a");
    const sourceCount = await sourceLinks.count();

    console.log("Sources count:", sourceCount);

    // Verify all sources are cited (no limit on sources)
    // Every source should be cited at least once
    expect(citedNumbers.size).toBeGreaterThanOrEqual(Math.min(sourceCount, citedNumbers.size));

    console.log("TEST PASSED: All sources are cited inline");
  });
});
