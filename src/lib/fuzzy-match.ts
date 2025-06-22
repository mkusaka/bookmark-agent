/**
 * Simple fuzzy matching function that checks if all characters in the pattern
 * appear in the string in the same order (but not necessarily consecutively).
 * 
 * @param pattern - The pattern to search for
 * @param str - The string to search in
 * @returns true if pattern matches str, false otherwise
 * 
 * @example
 * fuzzyMatch('gthb', 'github.com') // true
 * fuzzyMatch('abc', 'a1b2c3') // true
 * fuzzyMatch('abc', 'cba') // false (wrong order)
 */
export function fuzzyMatch(pattern: string, str: string): boolean {
  const normalizedPattern = pattern.toLowerCase();
  const normalizedStr = str.toLowerCase();
  let patternIdx = 0;
  
  for (let i = 0; i < normalizedStr.length && patternIdx < normalizedPattern.length; i++) {
    if (normalizedStr[i] === normalizedPattern[patternIdx]) {
      patternIdx++;
    }
  }
  
  return patternIdx === normalizedPattern.length;
}