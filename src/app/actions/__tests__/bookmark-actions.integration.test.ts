import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getBookmarks } from '../bookmark-actions';
import { db } from '@/db';
import { users, entries, bookmarks, tags, bookmarkTags } from '@/db/schema';
import type { BookmarkFilters, BookmarkSort } from '@/types/bookmark';
import { eq } from 'drizzle-orm';

// Skip these tests in CI environment
const skipInCI = process.env.CI ? describe.skip : describe;

skipInCI('bookmark-actions integration tests', () => {
  let testUserId: string;
  let testTagId1: string;
  let testTagId2: string;
  let testBookmarkId1: string;
  let testBookmarkId2: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test user
    const [testUser] = await db.insert(users).values({
      name: 'Test User',
      hatenaId: 'testuser',
    }).returning();
    testUserId = testUser.id;

    // Create test entries
    const [entry1] = await db.insert(entries).values({
      title: 'Test Entry about React',
      canonicalUrl: 'https://example.com/react',
      rootUrl: 'https://example.com',
      summary: 'A great article about React development',
      domain: 'example.com',
    }).returning();

    const [entry2] = await db.insert(entries).values({
      title: 'Another Test Entry',
      canonicalUrl: 'https://test.com/article',
      rootUrl: 'https://test.com',
      summary: 'Another interesting article',
      domain: 'test.com',
    }).returning();

    // Create test tags
    const [tag1] = await db.insert(tags).values({
      label: 'React',
    }).returning();
    testTagId1 = tag1.id;

    const [tag2] = await db.insert(tags).values({
      label: 'JavaScript',
    }).returning();
    testTagId2 = tag2.id;

    // Create test bookmarks
    const [bookmark1] = await db.insert(bookmarks).values({
      comment: 'Great React article',
      description: 'This is a detailed comment about React',
      url: 'https://example.com/react',
      domain: 'example.com',
      bookmarkedAt: new Date('2024-01-01'),
      userId: testUserId,
      entryId: entry1.id,
    }).returning();
    testBookmarkId1 = bookmark1.id;

    const [bookmark2] = await db.insert(bookmarks).values({
      comment: 'Interesting article',
      description: 'Another bookmark description',
      url: 'https://test.com/article',
      domain: 'test.com',
      bookmarkedAt: new Date('2024-01-02'),
      userId: testUserId,
      entryId: entry2.id,
    }).returning();
    testBookmarkId2 = bookmark2.id;

    // Create bookmark-tag relationships
    await db.insert(bookmarkTags).values([
      {
        bookmarkId: testBookmarkId1,
        tagId: testTagId1,
        userId: testUserId,
      },
      {
        bookmarkId: testBookmarkId1,
        tagId: testTagId2,
        userId: testUserId,
      },
      {
        bookmarkId: testBookmarkId2,
        tagId: testTagId2,
        userId: testUserId,
      },
    ]);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  async function cleanupTestData() {
    try {
      // Clean up in reverse order of dependencies
      if (testUserId) {
        await db.delete(bookmarkTags).where(eq(bookmarkTags.userId, testUserId));
        await db.delete(bookmarks).where(eq(bookmarks.userId, testUserId));
      }
      await db.delete(tags).where(eq(tags.label, 'React'));
      await db.delete(tags).where(eq(tags.label, 'JavaScript'));
      await db.delete(entries).where(eq(entries.domain, 'example.com'));
      await db.delete(entries).where(eq(entries.domain, 'test.com'));
      await db.delete(users).where(eq(users.hatenaId, 'testuser'));
    } catch (error) {
      // Ignore errors during cleanup
      console.log('Cleanup error (ignored):', error);
    }
  }

  describe('search functionality', () => {
    it('should filter bookmarks by search query', async () => {
      const filters: BookmarkFilters = {
        searchQuery: 'React',
        selectedDomains: [],
        selectedTags: [],
        selectedUsers: [],
      };

      const result = await getBookmarks(filters);

      expect(result.bookmarks).toHaveLength(1);
      expect(result.bookmarks[0].entry?.title).toContain('React');
      expect(result.total).toBe(1);
    });

    it('should find bookmarks by comment', async () => {
      const filters: BookmarkFilters = {
        searchQuery: 'Great',
        selectedDomains: [],
        selectedTags: [],
        selectedUsers: [],
      };

      const result = await getBookmarks(filters);

      expect(result.bookmarks).toHaveLength(1);
      expect(result.bookmarks[0].comment).toContain('Great');
    });

    it('should return empty results for non-matching search', async () => {
      const filters: BookmarkFilters = {
        searchQuery: 'NonExistentKeyword123',
        selectedDomains: [],
        selectedTags: [],
        selectedUsers: [],
      };

      const result = await getBookmarks(filters);

      expect(result.bookmarks).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('domain filtering', () => {
    it('should filter bookmarks by domain', async () => {
      const filters: BookmarkFilters = {
        searchQuery: '',
        selectedDomains: ['example.com'],
        selectedTags: [],
        selectedUsers: [],
      };

      const result = await getBookmarks(filters);

      expect(result.bookmarks).toHaveLength(1);
      expect(result.bookmarks[0].domain).toBe('example.com');
    });

    it('should filter by multiple domains', async () => {
      const filters: BookmarkFilters = {
        searchQuery: '',
        selectedDomains: ['example.com', 'test.com'],
        selectedTags: [],
        selectedUsers: [],
      };

      const result = await getBookmarks(filters);

      expect(result.bookmarks).toHaveLength(2);
    });
  });

  describe('tag filtering', () => {
    it('should filter bookmarks by tag', async () => {
      const filters: BookmarkFilters = {
        searchQuery: '',
        selectedDomains: [],
        selectedTags: [testTagId1], // React tag
        selectedUsers: [],
      };

      const result = await getBookmarks(filters);

      expect(result.bookmarks).toHaveLength(1);
      expect(result.bookmarks[0].tags.some(tag => tag.label === 'React')).toBe(true);
    });

    it('should return bookmarks with any of the selected tags', async () => {
      const filters: BookmarkFilters = {
        searchQuery: '',
        selectedDomains: [],
        selectedTags: [testTagId2], // JavaScript tag
        selectedUsers: [],
      };

      const result = await getBookmarks(filters);

      expect(result.bookmarks).toHaveLength(2); // Both bookmarks have JavaScript tag
    });
  });

  describe('combined filters', () => {
    it('should apply search and domain filters together (AND condition)', async () => {
      const filters: BookmarkFilters = {
        searchQuery: 'React',
        selectedDomains: ['example.com'],
        selectedTags: [],
        selectedUsers: [],
      };

      const result = await getBookmarks(filters);

      expect(result.bookmarks).toHaveLength(1);
      expect(result.bookmarks[0].entry?.title).toContain('React');
      expect(result.bookmarks[0].domain).toBe('example.com');
    });

    it('should apply search, domain, and tag filters together', async () => {
      const filters: BookmarkFilters = {
        searchQuery: 'React',
        selectedDomains: ['example.com'],
        selectedTags: [testTagId1],
        selectedUsers: [],
      };

      const result = await getBookmarks(filters);

      expect(result.bookmarks).toHaveLength(1);
    });

    it('should return empty when filters do not match', async () => {
      const filters: BookmarkFilters = {
        searchQuery: 'React',
        selectedDomains: ['test.com'], // React article is on example.com
        selectedTags: [],
        selectedUsers: [],
      };

      const result = await getBookmarks(filters);

      expect(result.bookmarks).toHaveLength(0);
    });
  });

  describe('sorting', () => {
    it('should sort by bookmarked date descending', async () => {
      const filters: BookmarkFilters = {
        searchQuery: '',
        selectedDomains: [],
        selectedTags: [],
        selectedUsers: [],
      };

      const sort: BookmarkSort = {
        field: 'bookmarkedAt',
        order: 'desc',
      };

      const result = await getBookmarks(filters, sort);

      expect(result.bookmarks[0].bookmarkedAt > result.bookmarks[1].bookmarkedAt).toBe(true);
    });

    it('should sort by title ascending', async () => {
      const filters: BookmarkFilters = {
        searchQuery: '',
        selectedDomains: [],
        selectedTags: [],
        selectedUsers: [],
      };

      const sort: BookmarkSort = {
        field: 'title',
        order: 'asc',
      };

      const result = await getBookmarks(filters, sort);

      const titles = result.bookmarks.map(b => b.entry?.title || '');
      expect(titles[0] < titles[1]).toBe(true);
    });
  });
});