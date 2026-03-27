/**
 * Unit tests for fuzzy matching library
 * Run with: npx tsx lib/fuzzy-match/test.ts
 */

import { fuzzyMatch, isFuzzyMatch } from './index';

const testCases: [string, string, string, boolean][] = [
  // Typos - should match
  ["photosynthisis", "photosynthesis", "Typo: i instead of e", true],
  ["mitocondria", "mitochondria", "Typo: missing h", true],
  ["nucles", "nucleus", "Typo: missing u", true],
  ["cellullar", "cellular", "Typo: double l", true],
  ["resparation", "respiration", "Typo: a instead of i", true],

  // Case variations - should match
  ["PHOTOSYNTHESIS", "photosynthesis", "All caps", true],
  ["Mitochondria", "mitochondria", "Title case", true],

  // Missing articles - should match
  ["cell membrane", "The cell membrane", "Missing 'the'", true],
  ["produces ATP", "It produces ATP", "Missing 'It'", true],

  // Word order - should match
  ["ATP mitochondria", "mitochondria ATP", "Swapped order", true],
  ["respiration cellular", "cellular respiration", "Swapped words", true],

  // Stemming - should match
  ["cells", "cell", "Plural to singular", true],
  ["running", "run", "Verb tense", true],

  // Partial key terms - should match
  ["mitochondria ATP", "The mitochondria produces ATP", "Key terms only", true],
  ["powerhouse cell", "The powerhouse of the cell", "Key words present", true],
  ["photosynthesis light energy", "Photosynthesis converts light energy", "Partial phrase (75%)", true],

  // Should REJECT
  ["nucleus", "mitochondria", "Completely different term", false],
  ["ab", "mitochondria", "Too short", false],
  ["banana", "photosynthesis", "Unrelated word", false],
  ["xyz123", "cellular respiration", "Random gibberish", false],
  ["the a an is", "mitochondria produces ATP", "Only stop words", false],
];

console.log("\n=== Fuzzy Match Unit Test Results ===\n");

let passed = 0;
let failed = 0;

for (const [typed, correct, desc, shouldMatch] of testCases) {
  const result = fuzzyMatch(typed, correct);
  const isCorrect = result.isMatch === shouldMatch;

  const icon = isCorrect ? "✓" : "✗";
  const status = result.isMatch ? "MATCH" : "REJECT";

  if (isCorrect) {
    passed++;
    console.log(`[${icon}] ${status}: "${typed}" → "${correct}"`);
    console.log(`    ${desc} (confidence: ${(result.confidence * 100).toFixed(0)}%)\n`);
  } else {
    failed++;
    console.log(`[${icon}] ${status}: "${typed}" → "${correct}"`);
    console.log(`    ${desc} - EXPECTED: ${shouldMatch ? "MATCH" : "REJECT"}`);
    console.log(`    Details: ${JSON.stringify(result.details)}\n`);
  }
}

console.log(`=== Summary: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  process.exit(1);
}
