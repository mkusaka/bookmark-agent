'use server';

import { db } from '@/db';
import { bookmarks, users, entries, tags, bookmarkTags } from '@/db/schema';
import { eq, and, or, ilike, desc, asc, gte, lte, sql, inArray } from 'drizzle-orm';
import type { BookmarkFilters, BookmarkSort, Bookmark, PaginationInfo } from '@/types/bookmark';

export async function getBookmarks(
  filters: BookmarkFilters,
  sort: BookmarkSort = { field: 'bookmarkedAt', order: 'desc' },
  limit: number = 25,
  cursor?: string
): Promise<{ bookmarks: Bookmark[]; total: number; pagination: PaginationInfo }> {
  try {
    // Build where conditions (without cursor)
    const filterConditions = [];
    
    // Cursor condition (kept separate)
    let cursorCondition = null;
    if (cursor) {
      const [bookmarkedAt, id] = cursor.split('_');
      if (sort.order === 'desc') {
        cursorCondition = or(
          lte(bookmarks.bookmarkedAt, new Date(bookmarkedAt)),
          and(
            eq(bookmarks.bookmarkedAt, new Date(bookmarkedAt)),
            lte(bookmarks.id, id)
          )
        );
      } else {
        cursorCondition = or(
          gte(bookmarks.bookmarkedAt, new Date(bookmarkedAt)),
          and(
            eq(bookmarks.bookmarkedAt, new Date(bookmarkedAt)),
            gte(bookmarks.id, id)
          )
        );
      }
    }

    // Search query - search in title, summary, comment, description, and url
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const searchPattern = `%${filters.searchQuery}%`;
      console.log('Applying search filter:', searchPattern);
      // First, let's use simple ILIKE search
      filterConditions.push(
        or(
          ilike(entries.title, searchPattern),
          ilike(entries.summary, searchPattern),
          ilike(bookmarks.comment, searchPattern),
          ilike(bookmarks.description, searchPattern),
          ilike(bookmarks.url, searchPattern)
        )
      );
    }

    // Domain filter (using entry.normalizedDomain)
    if (filters.selectedDomains && filters.selectedDomains.length > 0) {
      console.log('Applying domain filter:', filters.selectedDomains);
      filterConditions.push(inArray(entries.normalizedDomain, filters.selectedDomains));
    }

    // User filter
    if (filters.selectedUsers && filters.selectedUsers.length > 0) {
      console.log('Applying user filter:', filters.selectedUsers);
      filterConditions.push(inArray(bookmarks.userId, filters.selectedUsers));
    }

    // Date range filter
    if (filters.dateRange?.from) {
      filterConditions.push(gte(bookmarks.bookmarkedAt, filters.dateRange.from));
    }
    if (filters.dateRange?.to) {
      filterConditions.push(lte(bookmarks.bookmarkedAt, filters.dateRange.to));
    }

    // Apply tag filter if needed - get bookmark IDs first
    let bookmarkIdsWithTags: string[] = [];
    if (filters.selectedTags && filters.selectedTags.length > 0) {
      console.log('Applying tag filter:', filters.selectedTags);
      const tagResults = await db
        .select({ bookmarkId: bookmarkTags.bookmarkId })
        .from(bookmarkTags)
        .where(inArray(bookmarkTags.tagId, filters.selectedTags))
        .groupBy(bookmarkTags.bookmarkId);

      bookmarkIdsWithTags = tagResults.map((b) => b.bookmarkId);
      
      if (bookmarkIdsWithTags.length === 0) {
        // No bookmarks match the tag filter
        return { 
          bookmarks: [], 
          total: 0,
          pagination: {
            hasNextPage: false,
            hasPreviousPage: false,
            nextCursor: undefined,
            previousCursor: undefined,
          }
        };
      }
      
      // Add tag filter to conditions
      filterConditions.push(inArray(bookmarks.id, bookmarkIdsWithTags));
    }

    // Combine filter conditions with cursor condition for query
    const allConditions = [...filterConditions];
    if (cursorCondition) {
      allConditions.push(cursorCondition);
    }

    // Build the query
    const query = db
      .select({
        bookmark: bookmarks,
        user: users,
        entry: entries,
      })
      .from(bookmarks)
      .leftJoin(users, eq(bookmarks.userId, users.id))
      .leftJoin(entries, eq(bookmarks.entryId, entries.id))
      .where(allConditions.length > 0 ? and(...allConditions) : undefined)

      .orderBy(
        sort.order === 'desc' 
          ? desc(
              sort.field === 'title' ? entries.title :
              sort.field === 'user' ? users.name :
              bookmarks.bookmarkedAt
            )
          : asc(
              sort.field === 'title' ? entries.title :
              sort.field === 'user' ? users.name :
              bookmarks.bookmarkedAt
            )
      )
      .limit(limit + 1); // Fetch one extra to check if there's a next page

    // Execute the query
    const results = await query;

    // Check if there's a next page
    const hasNextPage = results.length > limit;
    const actualResults = hasNextPage ? results.slice(0, limit) : results;

    // Get tags for each bookmark
    const bookmarkIds = actualResults.map((r) => r.bookmark.id);
    const bookmarkTagsData = await db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
        tag: tags,
      })
      .from(bookmarkTags)
      .leftJoin(tags, eq(bookmarkTags.tagId, tags.id))
      .where(inArray(bookmarkTags.bookmarkId, bookmarkIds));

    // Group tags by bookmark
    const tagsByBookmark = bookmarkTagsData.reduce((acc, { bookmarkId, tag }) => {
      if (!acc[bookmarkId]) acc[bookmarkId] = [];
      if (tag) acc[bookmarkId].push(tag);
      return acc;
    }, {} as Record<string, typeof tags.$inferSelect[]>);

    // Format the results - filter out bookmarks without entries
    const formattedBookmarks = actualResults
      .filter((result) => result.entry !== null)
      .map((result) => ({
        ...result.bookmark,
        user: result.user!,
        entry: result.entry!,
        tags: tagsByBookmark[result.bookmark.id] || [],
      }));

    // Generate next cursor if there's a next page
    let nextCursor: string | undefined;
    if (hasNextPage && formattedBookmarks.length > 0) {
      const lastBookmark = formattedBookmarks[formattedBookmarks.length - 1];
      nextCursor = `${lastBookmark.bookmarkedAt.toISOString()}_${lastBookmark.id}`;
    }

    // Generate previous cursor (simplified - in production you'd track this better)
    let previousCursor: string | undefined;
    if (cursor && formattedBookmarks.length > 0) {
      const firstBookmark = formattedBookmarks[0];
      previousCursor = `${firstBookmark.bookmarkedAt.toISOString()}_${firstBookmark.id}`;
    }

    // Get total count (using only filter conditions, not cursor)
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .leftJoin(users, eq(bookmarks.userId, users.id))
      .leftJoin(entries, eq(bookmarks.entryId, entries.id))
      .where(filterConditions.length > 0 ? and(...filterConditions) : undefined);

    const [{ count }] = await countQuery;

    return {
      bookmarks: formattedBookmarks,
      total: Number(count),
      pagination: {
        hasNextPage,
        hasPreviousPage: !!cursor,
        nextCursor,
        previousCursor,
      },
    };
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw new Error('Failed to fetch bookmarks');
  }
}

export async function getDomains() {
  try {
    // Get distinct normalized domains from entries
    const normalizedDomains = await db
      .selectDistinct({ normalizedDomain: entries.normalizedDomain })
      .from(entries)
      .innerJoin(bookmarks, eq(bookmarks.entryId, entries.id))
      .where(sql`${entries.normalizedDomain} IS NOT NULL`)
      .orderBy(entries.normalizedDomain);

    return normalizedDomains.map(r => r.normalizedDomain).filter(Boolean) as string[];
  } catch (error) {
    console.error('Error fetching domains:', error);
    throw new Error('Failed to fetch domains');
  }
}

export async function getTags() {
  try {
    const allTags = await db.select().from(tags).orderBy(tags.label);
    return allTags;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error('Failed to fetch tags');
  }
}

export async function getUsers() {
  try {
    const allUsers = await db.select().from(users).orderBy(users.name);
    return allUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function getBookmarkById(id: string): Promise<Bookmark | null> {
  try {
    const result = await db
      .select({
        bookmark: bookmarks,
        user: users,
        entry: entries,
      })
      .from(bookmarks)
      .leftJoin(users, eq(bookmarks.userId, users.id))
      .leftJoin(entries, eq(bookmarks.entryId, entries.id))
      .where(eq(bookmarks.id, id))
      .limit(1);

    if (result.length === 0 || !result[0].entry) {
      return null;
    }

    // Get tags for this bookmark
    const tagsResult = await db
      .select({
        tag: tags,
      })
      .from(bookmarkTags)
      .leftJoin(tags, eq(bookmarkTags.tagId, tags.id))
      .where(eq(bookmarkTags.bookmarkId, id));

    const bookmarkTagsList = tagsResult
      .filter(({ tag }) => tag !== null)
      .map(({ tag }) => tag!);

    return {
      ...result[0].bookmark,
      user: result[0].user!,
      entry: result[0].entry!,
      tags: bookmarkTagsList,
    };
  } catch (error) {
    console.error('Error fetching bookmark by ID:', error);
    throw new Error('Failed to fetch bookmark');
  }
}