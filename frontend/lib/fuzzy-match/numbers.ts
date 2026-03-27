/**
 * Number format handling for fuzzy matching
 * Handles conversions between digit and word forms
 */

// Number word mappings
const WORD_TO_NUMBER: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30,
  forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
  million: 1000000, billion: 1000000000,
  // Common ordinals
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
};

const MULTIPLIERS = new Set(['hundred', 'thousand', 'million', 'billion']);

/**
 * Parse a number word phrase to a number
 * Example: "three hundred sixty five" -> 365
 */
export function wordsToNumber(text: string): number | null {
  const words = text.toLowerCase().trim().split(/[\s-]+/);
  let result = 0;
  let current = 0;
  let hasNumber = false;

  for (const word of words) {
    const value = WORD_TO_NUMBER[word];

    if (value === undefined) {
      // Skip non-number words (like "and")
      if (word !== 'and') {
        continue;
      }
    } else if (MULTIPLIERS.has(word)) {
      if (current === 0) current = 1;
      if (word === 'hundred') {
        current *= 100;
      } else if (word === 'thousand') {
        current *= 1000;
        result += current;
        current = 0;
      } else if (word === 'million') {
        current *= 1000000;
        result += current;
        current = 0;
      } else if (word === 'billion') {
        current *= 1000000000;
        result += current;
        current = 0;
      }
      hasNumber = true;
    } else {
      current += value;
      hasNumber = true;
    }
  }

  result += current;
  return hasNumber ? result : null;
}

/**
 * Extract all numbers from text (both digit and word forms)
 */
export function extractNumbers(text: string): number[] {
  const numbers: number[] = [];

  // Extract digit numbers
  const digitMatches = text.match(/\d+(?:,\d{3})*(?:\.\d+)?/g);
  if (digitMatches) {
    for (const match of digitMatches) {
      const num = parseFloat(match.replace(/,/g, ''));
      if (!isNaN(num)) {
        numbers.push(num);
      }
    }
  }

  // Try to parse word numbers from segments
  const wordNum = wordsToNumber(text);
  if (wordNum !== null && !numbers.includes(wordNum)) {
    numbers.push(wordNum);
  }

  return numbers;
}

/**
 * Check if two strings contain matching numbers
 * Returns true if no numbers present in either, or if numbers match
 */
export function numbersMatch(a: string, b: string): boolean {
  const numsA = extractNumbers(a);
  const numsB = extractNumbers(b);

  // If neither has numbers, that's fine
  if (numsA.length === 0 && numsB.length === 0) return true;

  // If one has numbers and other doesn't, check if it matters
  if (numsA.length === 0 || numsB.length === 0) {
    // Allow if the side without explicit numbers might have word numbers
    return true;
  }

  // Sort and compare - allow if any numbers match
  for (const numA of numsA) {
    for (const numB of numsB) {
      if (Math.abs(numA - numB) < 0.001) {
        return true;
      }
    }
  }

  // Check if the numbers in one match any in the other
  const setA = new Set(numsA.map(n => Math.round(n)));
  const setB = new Set(numsB.map(n => Math.round(n)));

  for (const n of setA) {
    if (setB.has(n)) return true;
  }

  return false;
}
