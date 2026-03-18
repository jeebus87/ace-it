import { test, expect } from '@playwright/test';

test.describe('Full Quiz Completion Test', () => {
  test('complete entire quiz from search to finish', async ({ page }) => {
    test.setTimeout(600000); // 10 minute timeout for full quiz

    // Setup console logging
    page.on('console', msg => {
      console.log('BROWSER:', msg.text());
    });

    // 1. Navigate to site
    console.log('ACTION: Navigate to site');
    await page.goto('https://ace-it.juridionai.com/');
    await page.waitForLoadState('networkidle');

    // 2. Enter a random educational question
    console.log('ACTION: Enter search query');
    const searchTextarea = page.locator('textarea').first();
    await searchTextarea.fill('What causes earthquakes?');
    await searchTextarea.press('Enter');

    // 3. Wait for difficulty prompt (quiz is ready)
    console.log('ACTION: Waiting for content to load...');
    await page.waitForSelector('text=Choose Quiz Difficulty', { timeout: 180000 });
    console.log('ACTION: Difficulty prompt appeared');

    // 4. Select difficulty and continue
    await page.click('text=Continue');
    console.log('ACTION: Selected difficulty');

    // 5. Wait for quiz button
    await page.waitForSelector('text=Start Mastery Quiz', { timeout: 120000 });
    console.log('ACTION: Quiz button appeared');

    // 6. Start the quiz
    await page.click('text=Start Mastery Quiz');
    await expect(page.getByRole('heading', { name: 'Mastery Quiz' })).toBeVisible();
    console.log('ACTION: Quiz modal opened');

    // 7. Complete all 10 questions
    for (let q = 1; q <= 10; q++) {
      console.log(`\n=== QUESTION ${q}/10 ===`);

      // Wait for question to be visible
      await page.waitForSelector(`text=Question ${q} of 10`, { timeout: 10000 });

      // Get the question text
      const questionText = await page.locator('p').filter({ hasText: /^Q\d+:/ }).textContent();
      console.log(`Question: ${questionText?.substring(0, 80)}...`);

      // Try to select an answer - start with A (most likely correct for educational quizzes)
      const choices = ['A', 'B', 'C', 'D'];
      let answered = false;

      for (const choice of choices) {
        if (answered) break;

        const choiceButton = page.locator('button').filter({ hasText: new RegExp(`^${choice}\\.`) });

        // Check if this choice is disabled (already tried)
        const isDisabled = await choiceButton.isDisabled().catch(() => true);
        if (isDisabled) continue;

        // Click the choice
        await choiceButton.click();
        console.log(`Clicked choice ${choice}`);

        // Wait a moment for feedback
        await page.waitForTimeout(500);

        // Check if we need to type the answer (incorrect)
        const typePrompt = page.locator('text=Type the correct answer to continue');
        const needToType = await typePrompt.isVisible().catch(() => false);

        if (needToType) {
          console.log('Incorrect - need to type correct answer');

          // Find the correct answer (highlighted in green)
          const correctButton = page.locator('button.border-green-500');
          const correctText = await correctButton.textContent();
          const match = correctText?.match(/^[A-D]\.\s*(.+)$/);
          const correctAnswer = match ? match[1].trim() : '';

          console.log(`Correct answer: ${correctAnswer.substring(0, 50)}...`);

          // Type the correct answer
          const inputField = page.locator('input[placeholder="Type the correct answer..."]');
          await inputField.fill(correctAnswer);
          await page.locator('button').filter({ hasText: 'Submit' }).click();

          await page.waitForTimeout(500);
        }

        // Check if Next/Complete button is visible
        const nextButton = page.locator('button').filter({ hasText: 'Next Question' });
        const completeButton = page.locator('button').filter({ hasText: 'Complete Quiz' });

        const canProceed = await nextButton.isVisible().catch(() => false) ||
                          await completeButton.isVisible().catch(() => false);

        if (canProceed) {
          answered = true;

          if (q < 10) {
            await nextButton.click();
            console.log('Clicked Next Question');
          } else {
            await completeButton.click();
            console.log('Clicked Complete Quiz!');
          }
        }
      }
    }

    // 8. Verify quiz completion
    console.log('\n=== QUIZ COMPLETE ===');
    await expect(page.locator('text=Mastery Achieved').or(page.locator('text=Perfect Score'))).toBeVisible({ timeout: 5000 });

    // Get final score
    const scoreText = await page.locator('text=Score:').textContent();
    console.log(`Final ${scoreText}`);

    // Close the quiz
    await page.click('text=Close Quiz');
    console.log('Quiz closed successfully');
  });
});
