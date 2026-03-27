/**
 * Levenshtein (edit) distance algorithms for typo tolerance
 */

/**
 * Calculate the Levenshtein distance between two strings
 * Uses Wagner-Fischer algorithm with O(min(m,n)) space optimization
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure a is the shorter string for space optimization
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  const m = a.length;
  const n = b.length;

  // Only need two rows at a time
  let prevRow = new Array(m + 1);
  let currRow = new Array(m + 1);

  // Initialize first row
  for (let i = 0; i <= m; i++) {
    prevRow[i] = i;
  }

  for (let j = 1; j <= n; j++) {
    currRow[0] = j;

    for (let i = 1; i <= m; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[i] = Math.min(
        prevRow[i] + 1,       // deletion
        currRow[i - 1] + 1,   // insertion
        prevRow[i - 1] + cost // substitution
      );
    }

    // Swap rows
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[m];
}

/**
 * Calculate similarity ratio (0-1) based on Levenshtein distance
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLength;
}

/**
 * Check if two strings match within an allowed edit distance
 */
export function isWithinEditDistance(a: string, b: string, maxDistance: number): boolean {
  return levenshteinDistance(a, b) <= maxDistance;
}

/**
 * Find the best matching word from a list of candidates
 */
export function findBestMatch(
  word: string,
  candidates: string[],
  minSimilarity: number = 0.7
): { word: string; similarity: number } | null {
  let bestMatch: { word: string; similarity: number } | null = null;

  for (const candidate of candidates) {
    const similarity = levenshteinSimilarity(word, candidate);
    if (similarity >= minSimilarity) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { word: candidate, similarity };
      }
    }
  }

  return bestMatch;
}
