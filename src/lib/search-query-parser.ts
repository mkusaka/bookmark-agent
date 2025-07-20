export interface ParsedSearchQuery {
  phrases: string[];  // Double-quoted phrases
  terms: string[];    // Individual search terms
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const phrases: string[] = [];
  const terms: string[] = [];
  
  // Extract double-quoted phrases (including empty quotes)
  const phraseRegex = /"([^"]*)"/g;
  let match;
  const usedIndices = new Set<number>();
  
  while ((match = phraseRegex.exec(query)) !== null) {
    phrases.push(match[1]);
    // Record indices of matched parts
    for (let i = match.index; i < match.index + match[0].length; i++) {
      usedIndices.add(i);
    }
  }
  
  // Process parts outside double quotes
  let currentTerm = '';
  for (let i = 0; i < query.length; i++) {
    if (!usedIndices.has(i)) {
      if (query[i] === ' ') {
        if (currentTerm.trim()) {
          terms.push(currentTerm.trim());
        }
        currentTerm = '';
      } else {
        currentTerm += query[i];
      }
    }
  }
  
  // Add the last term
  if (currentTerm.trim()) {
    terms.push(currentTerm.trim());
  }
  
  return { phrases, terms };
}