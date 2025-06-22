import { describe, it, expect } from 'vitest';
import { fuzzyMatch } from '@/lib/fuzzy-match';

describe('fuzzyMatch', () => {
  describe('basic matching', () => {
    it('should match exact strings', () => {
      expect(fuzzyMatch('test', 'test')).toBe(true);
      expect(fuzzyMatch('hello', 'hello')).toBe(true);
    });

    it('should match with different cases', () => {
      expect(fuzzyMatch('TEST', 'test')).toBe(true);
      expect(fuzzyMatch('test', 'TEST')).toBe(true);
      expect(fuzzyMatch('TeSt', 'tEsT')).toBe(true);
    });

    it('should match subsequences', () => {
      expect(fuzzyMatch('abc', 'aabbcc')).toBe(true);
      expect(fuzzyMatch('abc', 'a1b2c3')).toBe(true);
      expect(fuzzyMatch('gthb', 'github.com')).toBe(true);
    });

    it('should not match if pattern characters are out of order', () => {
      expect(fuzzyMatch('abc', 'acb')).toBe(false);
      expect(fuzzyMatch('abc', 'bac')).toBe(false);
      expect(fuzzyMatch('abc', 'cba')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty pattern', () => {
      expect(fuzzyMatch('', 'test')).toBe(true);
      expect(fuzzyMatch('', '')).toBe(true);
    });

    it('should handle empty string', () => {
      expect(fuzzyMatch('test', '')).toBe(false);
    });

    it('should handle pattern longer than string', () => {
      expect(fuzzyMatch('testing', 'test')).toBe(false);
      expect(fuzzyMatch('abcdef', 'abc')).toBe(false);
    });

    it('should handle special characters', () => {
      expect(fuzzyMatch('a.b', 'a.b.c')).toBe(true);
      expect(fuzzyMatch('a-b', 'a-b-c')).toBe(true);
      expect(fuzzyMatch('@usr', '@user123')).toBe(true);
    });
  });

  describe('real-world examples', () => {
    it('should match domain names', () => {
      expect(fuzzyMatch('gthb', 'github.com')).toBe(true);
      expect(fuzzyMatch('gogl', 'google.com')).toBe(true);
      expect(fuzzyMatch('stkof', 'stackoverflow.com')).toBe(true);
      expect(fuzzyMatch('ytb', 'youtube.com')).toBe(true);
    });

    it('should match user names', () => {
      expect(fuzzyMatch('jdoe', 'johndoe')).toBe(true);
      expect(fuzzyMatch('asmith', 'alicesmith')).toBe(true);
      expect(fuzzyMatch('usr1', 'user123')).toBe(true);
    });

    it('should match tag names', () => {
      expect(fuzzyMatch('js', 'javascript')).toBe(true);
      expect(fuzzyMatch('rct', 'react')).toBe(true);
      expect(fuzzyMatch('njs', 'nodejs')).toBe(true);
      expect(fuzzyMatch('ts', 'typescript')).toBe(true);
    });

    it('should match Japanese text', () => {
      expect(fuzzyMatch('にほん', 'にほんご')).toBe(true);
      expect(fuzzyMatch('プロ', 'プログラミング')).toBe(true);
      expect(fuzzyMatch('テス', 'テスト')).toBe(true);
    });
  });

  describe('non-matching cases', () => {
    it('should not match unrelated strings', () => {
      expect(fuzzyMatch('xyz', 'abc')).toBe(false);
      expect(fuzzyMatch('test', 'exam')).toBe(false);
    });

    it('should not match if any character is missing', () => {
      expect(fuzzyMatch('abcd', 'abc')).toBe(false);
      expect(fuzzyMatch('test', 'tst')).toBe(false);
    });

    it('should respect character order', () => {
      expect(fuzzyMatch('github', 'hubgit')).toBe(false);
      expect(fuzzyMatch('react', 'crater')).toBe(false);
    });
  });
});