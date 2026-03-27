/**
 * Fuzzy matching type definitions
 */

export type MatchType = 'exact' | 'levenshtein' | 'word_overlap' | 'partial' | 'no_match';

export interface MatchResult {
  isMatch: boolean;
  confidence: number; // 0-1 score
  matchType: MatchType;
  details?: {
    editDistance?: number;
    wordOverlapRatio?: number;
    matchedTerms?: string[];
    missedTerms?: string[];
  };
}

export interface MatchConfig {
  maxEditDistance: number;      // Max Levenshtein distance for typo tolerance
  editDistanceThreshold: number; // Min similarity ratio for Levenshtein
  wordOverlapThreshold: number;  // Min ratio of matching words
  minInputLength: number;        // Minimum typed input length
  minInputRatio: number;         // Min ratio of typed/correct length
  allowPartialMatch: boolean;    // Allow substring matches
}

export const DEFAULT_CONFIG: MatchConfig = {
  maxEditDistance: 3,
  editDistanceThreshold: 0.75,
  wordOverlapThreshold: 0.7,
  minInputLength: 3,
  minInputRatio: 0.4,
  allowPartialMatch: true,
};
