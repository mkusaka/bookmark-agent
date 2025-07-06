'use server';

import { db } from '@/db';
import { bookmarks, users, tags, bookmarkTags } from '@/db/schema';
import { eq, and, or, ilike, desc, asc, gte, lte, sql, inArray } from 'drizzle-orm';
import { unstable_cacheTag as cacheTag } from 'next/cache';
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

    // Search query - search in title, summary, comment, description, url, and markdownContent
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const searchPattern = `%${filters.searchQuery}%`;
      console.log('Applying search filter:', searchPattern);
      // Use bookmarks table columns
      filterConditions.push(
        or(
          ilike(bookmarks.title, searchPattern),
          ilike(bookmarks.summary, searchPattern),
          ilike(bookmarks.comment, searchPattern),
          ilike(bookmarks.description, searchPattern),
          ilike(bookmarks.url, searchPattern),
          ilike(bookmarks.markdownContent, searchPattern)
        )
      );
    }

    // Domain filter (using bookmarks.normalizedDomain)
    if (filters.selectedDomains && filters.selectedDomains.length > 0) {
      console.log('Applying domain filter:', filters.selectedDomains);
      filterConditions.push(inArray(bookmarks.normalizedDomain, filters.selectedDomains));
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

    // Build the query - no more join with entries
    const query = db
      .select({
        bookmark: bookmarks,
        user: users,
      })
      .from(bookmarks)
      .leftJoin(users, eq(bookmarks.userId, users.id))
      .where(allConditions.length > 0 ? and(...allConditions) : undefined)
      .orderBy(
        sort.order === 'desc' 
          ? desc(
              sort.field === 'title' ? bookmarks.title :
              sort.field === 'user' ? users.name :
              bookmarks.bookmarkedAt
            )
          : asc(
              sort.field === 'title' ? bookmarks.title :
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

    // Format the results
    const formattedBookmarks = actualResults
      .map((result) => ({
        ...result.bookmark,
        user: result.user!,
        // entry data is now part of bookmark
        entry: {
          id: result.bookmark.id, // Use bookmark ID as a placeholder
          title: result.bookmark.title,
          canonicalUrl: result.bookmark.canonicalUrl,
          rootUrl: result.bookmark.rootUrl,
          summary: result.bookmark.summary,
          domain: result.bookmark.domain,
          normalizedDomain: result.bookmark.normalizedDomain,
        },
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

export async function getUniqueDomains(): Promise<string[]> {
  'use cache';
  cacheTag('domains');
  
  try {
    const result = await db
      .selectDistinct({ domain: bookmarks.normalizedDomain })
      .from(bookmarks)
      .orderBy(bookmarks.normalizedDomain);
    
    return result.map(r => r.domain).filter(Boolean);
  } catch (error) {
    console.error('Error fetching domains:', error);
    throw new Error('Failed to fetch domains');
  }
}

export async function getUniqueTags(): Promise<Array<{ id: string; label: string }>> {
  'use cache';
  cacheTag('tags');
  
  try {
    const result = await db
      .select({ id: tags.id, label: tags.label })
      .from(tags)
      .orderBy(tags.label);
    
    return result;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error('Failed to fetch tags');
  }
}

export async function getUniqueUsers(): Promise<Array<{ id: string; name: string }>> {
  try {
    const result = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .orderBy(users.name);
    
    return result;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function getBookmarkById(bookmarkId: string): Promise<Bookmark | null> {
  try {
    const result = await db
      .select({
        bookmark: bookmarks,
        user: users,
      })
      .from(bookmarks)
      .leftJoin(users, eq(bookmarks.userId, users.id))
      .where(eq(bookmarks.id, bookmarkId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    // Get tags for the bookmark
    const tagsData = await db
      .select({
        tag: tags,
      })
      .from(bookmarkTags)
      .leftJoin(tags, eq(bookmarkTags.tagId, tags.id))
      .where(eq(bookmarkTags.bookmarkId, bookmarkId));

    const bookmarkTagList = tagsData
      .filter(({ tag }) => tag !== null)
      .map(({ tag }) => tag!);

    // Format the result
    const { bookmark, user } = result[0];
    return {
      ...bookmark,
      user: user!,
      // entry data is now part of bookmark
      entry: {
        id: bookmark.id,
        title: bookmark.title,
        canonicalUrl: bookmark.canonicalUrl,
        rootUrl: bookmark.rootUrl,
        summary: bookmark.summary,
        domain: bookmark.domain,
        normalizedDomain: bookmark.normalizedDomain,
      },
      tags: bookmarkTagList,
    };
  } catch (error) {
    console.error('Error fetching bookmark by ID:', error);
    throw new Error('Failed to fetch bookmark');
  }
}

export async function getSimilarBookmarks(bookmarkId: string, limit: number = 10): Promise<Bookmark[]> {
  try {
    // Get the bookmark
    const targetBookmark = await db.query.bookmarks.findFirst({
      where: eq(bookmarks.id, bookmarkId),
    });

    if (!targetBookmark) {
      return [];
    }

    // Get similar bookmarks based on domain
    const similarByDomain = await db
      .select({
        bookmark: bookmarks,
        user: users,
      })
      .from(bookmarks)
      .leftJoin(users, eq(bookmarks.userId, users.id))
      .where(
        and(
          eq(bookmarks.normalizedDomain, targetBookmark.normalizedDomain),
          sql`${bookmarks.id} != ${bookmarkId}`
        )
      )
      .limit(limit);

    // Get tags for each bookmark
    const bookmarkIds = similarByDomain.map((r) => r.bookmark.id);
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

    // Format the results
    const formattedBookmarks = similarByDomain
      .map((result) => ({
        ...result.bookmark,
        user: result.user!,
        // entry data is now part of bookmark
        entry: {
          id: result.bookmark.id,
          title: result.bookmark.title,
          canonicalUrl: result.bookmark.canonicalUrl,
          rootUrl: result.bookmark.rootUrl,
          summary: result.bookmark.summary,
          domain: result.bookmark.domain,
          normalizedDomain: result.bookmark.normalizedDomain,
        },
        tags: tagsByBookmark[result.bookmark.id] || [],
      }));

    return formattedBookmarks;
  } catch (error) {
    console.error('Error fetching similar bookmarks:', error);
    throw new Error('Failed to fetch similar bookmarks');
  }
}

// Alias functions for backwards compatibility
export const getDomains = getUniqueDomains;
export const getTags = getUniqueTags;
export const getUsers = getUniqueUsers;