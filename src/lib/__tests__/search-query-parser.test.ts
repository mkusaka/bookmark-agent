import { describe, it, expect } from 'vitest';
import { parseSearchQuery } from '../search-query-parser';

describe('parseSearchQuery', () => {
  it('should parse simple space-separated terms', () => {
    const result = parseSearchQuery('claude code limit');
    expect(result).toEqual({
      phrases: [],
      terms: ['claude', 'code', 'limit']
    });
  });

  it('should parse double-quoted phrases', () => {
    const result = parseSearchQuery('"claude code"');
    expect(result).toEqual({
      phrases: ['claude code'],
      terms: []
    });
  });

  it('should parse mixed queries with phrases and terms', () => {
    const result = parseSearchQuery('"claude code" limit');
    expect(result).toEqual({
      phrases: ['claude code'],
      terms: ['limit']
    });
  });

  it('should parse multiple quoted phrases', () => {
    const result = parseSearchQuery('"hello world" "foo bar" baz');
    expect(result).toEqual({
      phrases: ['hello world', 'foo bar'],
      terms: ['baz']
    });
  });

  it('should handle empty queries', () => {
    const result = parseSearchQuery('');
    expect(result).toEqual({
      phrases: [],
      terms: []
    });
  });

  it('should handle queries with only spaces', () => {
    const result = parseSearchQuery('   ');
    expect(result).toEqual({
      phrases: [],
      terms: []
    });
  });

  it('should handle quotes within terms', () => {
    const result = parseSearchQuery('test "quoted phrase" more');
    expect(result).toEqual({
      phrases: ['quoted phrase'],
      terms: ['test', 'more']
    });
  });

  it('should handle multiple spaces between terms', () => {
    const result = parseSearchQuery('claude    code    limit');
    expect(result).toEqual({
      phrases: [],
      terms: ['claude', 'code', 'limit']
    });
  });

  it('should handle leading and trailing spaces', () => {
    const result = parseSearchQuery('  claude code  ');
    expect(result).toEqual({
      phrases: [],
      terms: ['claude', 'code']
    });
  });

  it('should handle unclosed quotes by treating them as regular text', () => {
    const result = parseSearchQuery('"unclosed quote');
    expect(result).toEqual({
      phrases: [],
      terms: ['"unclosed', 'quote']
    });
  });

  it('should handle complex queries', () => {
    const result = parseSearchQuery('search "exact phrase" and "another phrase" with terms');
    expect(result).toEqual({
      phrases: ['exact phrase', 'another phrase'],
      terms: ['search', 'and', 'with', 'terms']
    });
  });

  it('should handle empty quotes', () => {
    const result = parseSearchQuery('test "" empty');
    expect(result).toEqual({
      phrases: [''],
      terms: ['test', 'empty']
    });
  });
});