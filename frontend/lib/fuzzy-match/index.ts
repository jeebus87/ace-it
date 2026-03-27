/**
 * Fuzzy Match Library
 * Advanced fuzzy matching for quiz answer validation
 */

// Types
export type { MatchResult, MatchConfig, MatchType } from './types';
export { DEFAULT_CONFIG } from './types';

// Main matching functions
export { fuzzyMatch, isFuzzyMatch } from './matcher';

// Utility functions (for advanced use cases)
export {
  levenshteinDistance,
  levenshteinSimilarity,
  isWithinEditDistance,
  findBestMatch,
} from './levenshtein';

export { stem, stemWords, haveSameStem } from './stemmer';

export { wordsToNumber, extractNumbers, numbersMatch } from './numbers';
