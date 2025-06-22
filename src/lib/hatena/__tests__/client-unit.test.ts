import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HatenaBookmarkClient } from '../client';

// Mock fetch
global.fetch = vi.fn();

describe('HatenaBookmarkClient (Unit Tests)', () => {
  const client = new HatenaBookmarkClient();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUserBookmarks', () => {
    it('should fetch bookmarks for a user without page parameter', async () => {
      const mockResponse = {
        pager: { pages: [] },
        item: { bookmarks: [] },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.fetchUserBookmarks('testuser');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://b.hatena.ne.jp/api/users/testuser/bookmarks',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BookmarkAgent/1.0)',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch bookmarks for a user with page parameter', async () => {
      const mockResponse = {
        pager: { pages: [] },
        item: { bookmarks: [] },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.fetchUserBookmarks('testuser', 2);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://b.hatena.ne.jp/api/users/testuser/bookmarks?page=2',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BookmarkAgent/1.0)',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when response is not ok', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await expect(client.fetchUserBookmarks('testuser')).rejects.toThrow(
        'Failed to fetch bookmarks: Not Found'
      );
    });
  });

  describe('fetchAllUserBookmarks', () => {
    it('should fetch all pages until no next page', async () => {
      const mockResponses = [
        {
          pager: {
            next: { label: 'Next', xhr_path: '/api/users/testuser/bookmarks?page=2', page_path: '/testuser/bookmarks?page=2' },
            pages: [],
          },
          item: { bookmarks: [] },
        },
        {
          pager: { pages: [] },
          item: { bookmarks: [] },
        },
      ];

      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockResponses[callCount++],
        } as Response)
      );

      // Mock setTimeout to avoid actual delays
      vi.useFakeTimers();
      const promise = client.fetchAllUserBookmarks('testuser', 5);
      
      // Advance timers for each expected setTimeout call
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);
      
      const results = await promise;
      vi.useRealTimers();

      expect(results).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should stop at maxPages', async () => {
      const mockResponse = {
        pager: {
          next: { label: 'Next', xhr_path: '/next', page_path: '/next' },
          pages: [],
        },
        item: { bookmarks: [] },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Mock setTimeout to avoid actual delays
      vi.useFakeTimers();
      const promise = client.fetchAllUserBookmarks('testuser', 2);
      
      // Advance timers for each expected setTimeout call
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);
      
      const results = await promise;
      vi.useRealTimers();

      expect(results).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});