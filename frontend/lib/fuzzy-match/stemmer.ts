/**
 * Simple English stemmer without external dependencies
 * Handles common suffixes and irregular forms
 */

// Common suffix rules (order matters - check longer suffixes first)
const SUFFIX_RULES: Array<{ suffix: string; replacement: string; minStem: number }> = [
  { suffix: 'ational', replacement: 'ate', minStem: 2 },
  { suffix: 'tional', replacement: 'tion', minStem: 2 },
  { suffix: 'ization', replacement: 'ize', minStem: 2 },
  { suffix: 'fulness', replacement: 'ful', minStem: 2 },
  { suffix: 'iveness', replacement: 'ive', minStem: 2 },
  { suffix: 'ousness', replacement: 'ous', minStem: 2 },
  { suffix: 'lessly', replacement: 'less', minStem: 2 },
  { suffix: 'ingly', replacement: '', minStem: 3 },
  { suffix: 'ation', replacement: 'ate', minStem: 2 },
  { suffix: 'ement', replacement: '', minStem: 2 },
  { suffix: 'eness', replacement: '', minStem: 2 },
  { suffix: 'ances', replacement: 'ance', minStem: 2 },
  { suffix: 'ences', replacement: 'ence', minStem: 2 },
  { suffix: 'ities', replacement: 'ity', minStem: 2 },
  { suffix: 'ously', replacement: 'ous', minStem: 2 },
  { suffix: 'ively', replacement: 'ive', minStem: 2 },
  { suffix: 'fully', replacement: 'ful', minStem: 2 },
  { suffix: 'ness', replacement: '', minStem: 3 },
  { suffix: 'ment', replacement: '', minStem: 3 },
  { suffix: 'less', replacement: '', minStem: 3 },
  { suffix: 'ious', replacement: '', minStem: 2 },
  { suffix: 'eous', replacement: '', minStem: 2 },
  { suffix: 'ting', replacement: 't', minStem: 2 },
  { suffix: 'ning', replacement: 'n', minStem: 2 },
  { suffix: 'ming', replacement: 'm', minStem: 2 },
  { suffix: 'ling', replacement: 'le', minStem: 2 },
  { suffix: 'ing', replacement: '', minStem: 3 },
  { suffix: 'ied', replacement: 'y', minStem: 2 },
  { suffix: 'ies', replacement: 'y', minStem: 2 },
  { suffix: 'ion', replacement: '', minStem: 3 },
  { suffix: 'ful', replacement: '', minStem: 3 },
  { suffix: 'ive', replacement: '', minStem: 3 },
  { suffix: 'ous', replacement: '', minStem: 3 },
  { suffix: 'ed', replacement: '', minStem: 3 },
  { suffix: 'er', replacement: '', minStem: 3 },
  { suffix: 'es', replacement: '', minStem: 3 },
  { suffix: 'ly', replacement: '', minStem: 3 },
  { suffix: "'s", replacement: '', minStem: 2 },
  { suffix: 's', replacement: '', minStem: 3 },
];

// Irregular word mappings
const IRREGULAR_STEMS: Record<string, string> = {
  // Common irregular verbs
  ran: 'run', running: 'run', runs: 'run',
  was: 'be', were: 'be', been: 'be', being: 'be', am: 'be', is: 'be', are: 'be',
  had: 'have', has: 'have', having: 'have',
  did: 'do', does: 'do', doing: 'do', done: 'do',
  went: 'go', goes: 'go', going: 'go', gone: 'go',
  made: 'make', makes: 'make', making: 'make',
  said: 'say', says: 'say', saying: 'say',
  took: 'take', takes: 'take', taking: 'take', taken: 'take',
  came: 'come', comes: 'come', coming: 'come',
  saw: 'see', sees: 'see', seeing: 'see', seen: 'see',
  knew: 'know', knows: 'know', knowing: 'know', known: 'know',
  got: 'get', gets: 'get', getting: 'get', gotten: 'get',
  gave: 'give', gives: 'give', giving: 'give', given: 'give',
  found: 'find', finds: 'find', finding: 'find',
  thought: 'think', thinks: 'think', thinking: 'think',
  told: 'tell', tells: 'tell', telling: 'tell',
  // Irregular plurals
  children: 'child', men: 'man', women: 'woman',
  mice: 'mouse', geese: 'goose', teeth: 'tooth',
  feet: 'foot', people: 'person', leaves: 'leaf',
  lives: 'life', knives: 'knife', wives: 'wife',
  // Scientific terms
  mitochondria: 'mitochondrion', bacteria: 'bacterium',
  nuclei: 'nucleus', stimuli: 'stimulus', fungi: 'fungus',
  data: 'datum', media: 'medium', criteria: 'criterion',
};

/**
 * Apply simple stemming to a word
 */
export function stem(word: string): string {
  const lower = word.toLowerCase();

  // Check irregular mappings first
  if (IRREGULAR_STEMS[lower]) {
    return IRREGULAR_STEMS[lower];
  }

  // Don't stem very short words
  if (lower.length <= 3) {
    return lower;
  }

  // Apply suffix rules
  for (const rule of SUFFIX_RULES) {
    if (lower.endsWith(rule.suffix)) {
      const stemPart = lower.slice(0, -rule.suffix.length);
      if (stemPart.length >= rule.minStem) {
        return stemPart + rule.replacement;
      }
    }
  }

  return lower;
}

/**
 * Stem all words in an array
 */
export function stemWords(words: string[]): string[] {
  return words.map(stem);
}

/**
 * Check if two words have the same stem
 */
export function haveSameStem(word1: string, word2: string): boolean {
  return stem(word1) === stem(word2);
}
