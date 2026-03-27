/**
 * Main fuzzy matching algorithm
 * Combines multiple strategies for robust answer matching
 */

import { MatchResult, MatchConfig, DEFAULT_CONFIG } from './types';
import { levenshteinDistance, levenshteinSimilarity, findBestMatch } from './levenshtein';
import { stem, stemWords } from './stemmer';
import { numbersMatch } from './numbers';

// Stop words to filter out for word-level matching
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'of', 'to', 'in',
  'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'just', 'and', 'but', 'or', 'yet', 'both', 'either',
  'neither', 'this', 'that', 'these', 'those', 'it', 'its',
]);

// Domain-specific important terms that should be weighted higher
const KEY_TERMS = new Set([
  // Biology
  'mitochondria', 'mitochondrion', 'atp', 'dna', 'rna', 'cell', 'nucleus',
  'protein', 'enzyme', 'photosynthesis', 'respiration', 'chromosome',
  'gene', 'mutation', 'evolution', 'species', 'ecosystem', 'organism',
  // Chemistry
  'atom', 'molecule', 'electron', 'proton', 'neutron', 'ion', 'bond',
  'reaction', 'catalyst', 'oxidation', 'reduction', 'acid', 'base',
  // Physics
  'force', 'energy', 'mass', 'velocity', 'acceleration', 'momentum',
  'gravity', 'electric', 'magnetic', 'wave', 'frequency', 'amplitude',
  // Math
  'equation', 'function', 'variable', 'coefficient', 'derivative',
  'integral', 'matrix', 'vector', 'probability', 'theorem',
]);

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize text into words
 */
function tokenize(text: string, minLength: number = 2): string[] {
  return normalizeText(text)
    .split(/\s+/)
    .filter(word => word.length >= minLength);
}

/**
 * Get content words (remove stop words)
 */
function getContentWords(text: string, minLength: number = 3): string[] {
  return tokenize(text, minLength).filter(word => !STOP_WORDS.has(word));
}

/**
 * Main fuzzy matching function with full diagnostics
 */
export function fuzzyMatch(
  typed: string,
  correct: string,
  config: Partial<MatchConfig> = {}
): MatchResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Normalize inputs
  const normalizedTyped = normalizeText(typed);
  const normalizedCorrect = normalizeText(correct);

  // === Check 1: Exact match after normalization ===
  if (normalizedTyped === normalizedCorrect) {
    return {
      isMatch: true,
      confidence: 1.0,
      matchType: 'exact',
    };
  }

  // === Check 2: Minimum input validation ===
  if (normalizedTyped.length < cfg.minInputLength) {
    return {
      isMatch: false,
      confidence: 0,
      matchType: 'no_match',
      details: { missedTerms: ['Input too short'] },
    };
  }

  const inputRatio = normalizedTyped.length / normalizedCorrect.length;
  if (inputRatio < cfg.minInputRatio) {
    return {
      isMatch: false,
      confidence: 0,
      matchType: 'no_match',
      details: { missedTerms: ['Input too short relative to answer'] },
    };
  }

  // === Check 3: Levenshtein for short answers ===
  if (normalizedCorrect.length <= 25) {
    const distance = levenshteinDistance(normalizedTyped, normalizedCorrect);
    const similarity = levenshteinSimilarity(normalizedTyped, normalizedCorrect);

    if (distance <= cfg.maxEditDistance && similarity >= cfg.editDistanceThreshold) {
      return {
        isMatch: true,
        confidence: similarity,
        matchType: 'levenshtein',
        details: { editDistance: distance },
      };
    }
  }

  // === Check 4: Substring containment ===
  if (cfg.allowPartialMatch) {
    // Typed contains the correct answer
    if (normalizedTyped.includes(normalizedCorrect)) {
      return {
        isMatch: true,
        confidence: 0.95,
        matchType: 'partial',
      };
    }

    // Correct contains the typed (if typed is substantial)
    if (normalizedCorrect.includes(normalizedTyped) && inputRatio >= 0.5) {
      return {
        isMatch: true,
        confidence: inputRatio,
        matchType: 'partial',
      };
    }
  }

  // === Check 5: Word-level matching with stemming ===
  const typedWords = getContentWords(typed, 2);
  const correctWords = getContentWords(correct, 2);

  if (correctWords.length === 0) {
    // No significant words, fall back to normalized comparison
    const similarity = levenshteinSimilarity(normalizedTyped, normalizedCorrect);
    return {
      isMatch: similarity >= cfg.editDistanceThreshold,
      confidence: similarity,
      matchType: similarity >= cfg.editDistanceThreshold ? 'levenshtein' : 'no_match',
    };
  }

  // Stem all words
  const typedStems = new Set(stemWords(typedWords));
  const correctStems = stemWords(correctWords);
  const typedStemsArray = Array.from(typedStems);

  // Count matching words with fuzzy matching for typos
  let matchedCount = 0;
  let keyTermsMatched = 0;
  let keyTermsTotal = 0;
  const matchedTerms: string[] = [];
  const missedTerms: string[] = [];

  for (let i = 0; i < correctWords.length; i++) {
    const correctWord = correctWords[i];
    const correctStem = correctStems[i];
    const isKeyTerm = KEY_TERMS.has(correctWord) || KEY_TERMS.has(correctStem);

    if (isKeyTerm) keyTermsTotal++;

    // Check for exact stem match
    if (typedStems.has(correctStem)) {
      matchedCount++;
      matchedTerms.push(correctWord);
      if (isKeyTerm) keyTermsMatched++;
      continue;
    }

    // Check for fuzzy match on the word itself
    const wordMatch = findBestMatch(correctWord, typedWords, 0.75);
    if (wordMatch) {
      matchedCount += wordMatch.similarity;
      matchedTerms.push(correctWord);
      if (isKeyTerm) keyTermsMatched++;
      continue;
    }

    // Check for fuzzy match on stems
    const stemMatch = findBestMatch(correctStem, typedStemsArray, 0.75);
    if (stemMatch) {
      matchedCount += stemMatch.similarity;
      matchedTerms.push(correctWord);
      if (isKeyTerm) keyTermsMatched++;
      continue;
    }

    missedTerms.push(correctWord);
  }

  const wordOverlapRatio = matchedCount / correctWords.length;

  // === Check 6: Number verification ===
  // If both have numbers, they should match
  const hasTypedNumbers = /\d/.test(typed);
  const hasCorrectNumbers = /\d/.test(correct);

  if (hasTypedNumbers && hasCorrectNumbers) {
    if (!numbersMatch(typed, correct)) {
      // Numbers don't match - reduce confidence significantly
      return {
        isMatch: false,
        confidence: wordOverlapRatio * 0.5,
        matchType: 'no_match',
        details: { wordOverlapRatio, matchedTerms, missedTerms: ['Numbers do not match'] },
      };
    }
  }

  // === Check 7: Key term priority ===
  // If key terms are present, they must mostly match
  if (keyTermsTotal > 0) {
    const keyTermRatio = keyTermsMatched / keyTermsTotal;
    if (keyTermRatio < 0.5) {
      // Missing too many key terms
      return {
        isMatch: false,
        confidence: wordOverlapRatio * 0.7,
        matchType: 'no_match',
        details: { wordOverlapRatio, matchedTerms, missedTerms },
      };
    }
  }

  // === Final decision based on word overlap ===
  if (wordOverlapRatio >= cfg.wordOverlapThreshold) {
    return {
      isMatch: true,
      confidence: wordOverlapRatio,
      matchType: 'word_overlap',
      details: { wordOverlapRatio, matchedTerms, missedTerms },
    };
  }

  // Slightly more lenient if most key terms match
  if (keyTermsTotal > 0 && keyTermsMatched >= keyTermsTotal * 0.8 && wordOverlapRatio >= 0.5) {
    return {
      isMatch: true,
      confidence: wordOverlapRatio,
      matchType: 'word_overlap',
      details: { wordOverlapRatio, matchedTerms, missedTerms },
    };
  }

  return {
    isMatch: false,
    confidence: wordOverlapRatio,
    matchType: 'no_match',
    details: { wordOverlapRatio, matchedTerms, missedTerms },
  };
}

/**
 * Simple boolean match function (drop-in replacement)
 */
export function isFuzzyMatch(typed: string, correct: string): boolean {
  return fuzzyMatch(typed, correct).isMatch;
}
