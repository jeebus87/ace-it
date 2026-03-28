import { test, expect } from "@playwright/test";

test.describe("Mobile Citations Flow", () => {
  test("citations appear in order with matching sources", async ({ page }) => {
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
    const answerContent = await page.locator(".terminal-content").textContent();

    // Find all superscript citations in the answer
    const superscriptPattern = /[¹²³⁴⁵⁶⁷⁸⁹]/g;
    const foundCitations = answerContent?.match(superscriptPattern) || [];

    console.log("Found citations:", foundCitations);
    console.log("Citation count:", foundCitations.length);

    // Verify we have at least some citations
    expect(foundCitations.length).toBeGreaterThan(0);

    // Verify citations are in ascending order
    const citationValues = foundCitations.map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c));
    let lastValue = 0;
    for (const val of citationValues) {
      expect(val).toBeGreaterThanOrEqual(lastValue);
      lastValue = val;
    }
    console.log("Citations are in order: PASS");

    // Check for SOURCES section
    const sourcesSection = page.locator("text=SOURCES");
    await expect(sourcesSection).toBeVisible();

    // Count source links
    const sourceLinks = page.locator("ol >> a");
    const sourceCount = await sourceLinks.count();

    console.log("Sources count:", sourceCount);

    // Verify we have sources matching citations
    expect(sourceCount).toBeGreaterThan(0);

    // Get max citation number
    const maxCitation = Math.max(...citationValues);
    console.log("Max citation number:", maxCitation);

    // Sources should be >= max citation number
    expect(sourceCount).toBeGreaterThanOrEqual(maxCitation);

    console.log("TEST PASSED: Citations in order with matching sources");
  });
});
