'use server';

import { db } from '@/db';
import { aiSessions, aiSessionBookmarks, bookmarks, users, tags, bookmarkTags } from '@/db/schema';
import { eq, and, or, desc, asc, gte, lte, sql, inArray, ilike } from 'drizzle-orm';
import type { AiSessionFilters, AiSessionSort, AiSessionWithBookmarks, AiSessionPaginationInfo, AiSessionType, AiSessionStatus } from '@/types/ai-session';
import type { Bookmark } from '@/types/bookmark';

// --- CREATE ---

export async function createAiSession(data: {
  type: AiSessionType;
  question: string;
  userId?: string;
  parentSessionId?: string;
  externalInteractionId?: string;
}): Promise<{ id: string }> {
  const [session] = await db
    .insert(aiSessions)
    .values({
      type: data.type,
      question: data.question,
      status: 'pending',
      userId: data.userId,
      parentSessionId: data.parentSessionId,
      externalInteractionId: data.externalInteractionId,
      startedAt: new Date(),
    })
    .returning();

  return { id: session.id };
}

// --- UPDATE ---

export async function updateAiSession(
  sessionId: string,
  data: {
    status?: AiSessionStatus;
    responseText?: string;
    modelName?: string;
    errorMessage?: string;
    processingTimeMs?: number;
    completedAt?: Date;
  }
): Promise<void> {
  await db
    .update(aiSessions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(aiSessions.id, sessionId));
}

export async function addBookmarksToSession(
  sessionId: string,
  bookmarkIds: string[]
): Promise<void> {
  if (bookmarkIds.length === 0) return;

  const values = bookmarkIds.map((bookmarkId, index) => ({
    sessionId,
    bookmarkId,
    sortOrder: index,
  }));

  await db
    .insert(aiSessionBookmarks)
    .values(values)
    .onConflictDoNothing();
}

// --- READ (List with pagination) ---

export async function getAiSessions(
  filters: AiSessionFilters,
  sort: AiSessionSort = { field: 'createdAt', order: 'desc' },
  limit: number = 25,
  cursor?: string
): Promise<{
  sessions: AiSessionWithBookmarks[];
  total: number;
  pagination: AiSessionPaginationInfo;
}> {
  const conditions = [];

  // Type filter
  if (filters.type) {
    conditions.push(eq(aiSessions.type, filters.type));
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    conditions.push(inArray(aiSessions.status, filters.status));
  }

  // Search query
  if (filters.searchQuery) {
    conditions.push(ilike(aiSessions.question, `%${filters.searchQuery}%`));
  }

  // Date range
  if (filters.dateRange?.from) {
    conditions.push(gte(aiSessions.createdAt, filters.dateRange.from));
  }
  if (filters.dateRange?.to) {
    conditions.push(lte(aiSessions.createdAt, filters.dateRange.to));
  }

  // Cursor-based pagination
  let cursorCondition = null;
  if (cursor) {
    const [createdAt, id] = cursor.split('_');
    if (sort.order === 'desc') {
      cursorCondition = or(
        lte(aiSessions.createdAt, new Date(createdAt)),
        and(
          eq(aiSessions.createdAt, new Date(createdAt)),
          lte(aiSessions.id, id)
        )
      );
    } else {
      cursorCondition = or(
        gte(aiSessions.createdAt, new Date(createdAt)),
        and(
          eq(aiSessions.createdAt, new Date(createdAt)),
          gte(aiSessions.id, id)
        )
      );
    }
  }

  const allConditions = [...conditions];
  if (cursorCondition) {
    allConditions.push(cursorCondition);
  }

  // Query sessions
  const results = await db
    .select()
    .from(aiSessions)
    .where(allConditions.length > 0 ? and(...allConditions) : undefined)
    .orderBy(sort.order === 'desc' ? desc(aiSessions.createdAt) : asc(aiSessions.createdAt))
    .limit(limit + 1);

  const hasNextPage = results.length > limit;
  const actualResults = hasNextPage ? results.slice(0, limit) : results;

  // Get related bookmarks for each session
  const sessionIds = actualResults.map(s => s.id);
  const sessionBookmarksData = sessionIds.length > 0
    ? await db
        .select({
          sessionId: aiSessionBookmarks.sessionId,
          bookmark: bookmarks,
        })
        .from(aiSessionBookmarks)
        .leftJoin(bookmarks, eq(aiSessionBookmarks.bookmarkId, bookmarks.id))
        .where(inArray(aiSessionBookmarks.sessionId, sessionIds))
        .orderBy(aiSessionBookmarks.sortOrder)
    : [];

  // Get user and tags for bookmarks
  const bookmarkIds = sessionBookmarksData
    .filter(b => b.bookmark)
    .map(b => b.bookmark!.id);

  const usersData = bookmarkIds.length > 0
    ? await db
        .select()
        .from(users)
        .where(inArray(users.id, sessionBookmarksData
          .filter(b => b.bookmark)
          .map(b => b.bookmark!.userId)))
    : [];

  const userById = new Map(usersData.map(u => [u.id, u]));

  const tagsData = bookmarkIds.length > 0
    ? await db
        .select({
          bookmarkId: bookmarkTags.bookmarkId,
          tag: tags,
        })
        .from(bookmarkTags)
        .leftJoin(tags, eq(bookmarkTags.tagId, tags.id))
        .where(inArray(bookmarkTags.bookmarkId, bookmarkIds))
    : [];

  const tagsByBookmark = tagsData.reduce((acc, { bookmarkId, tag }) => {
    if (!acc[bookmarkId]) acc[bookmarkId] = [];
    if (tag) acc[bookmarkId].push({ id: tag.id, label: tag.label });
    return acc;
  }, {} as Record<string, Array<{ id: string; label: string }>>);

  // Group bookmarks by session
  const bookmarksBySession = sessionBookmarksData.reduce((acc, { sessionId, bookmark }) => {
    if (!acc[sessionId]) acc[sessionId] = [];
    if (bookmark) {
      const user = userById.get(bookmark.userId);
      acc[sessionId].push({
        ...bookmark,
        user: user!,
        entry: {
          id: bookmark.id,
          title: bookmark.title,
          canonicalUrl: bookmark.canonicalUrl,
          rootUrl: bookmark.rootUrl,
          summary: bookmark.summary,
          domain: bookmark.domain,
          normalizedDomain: bookmark.normalizedDomain,
        },
        tags: tagsByBookmark[bookmark.id] || [],
      } as Bookmark);
    }
    return acc;
  }, {} as Record<string, Bookmark[]>);

  // Format results
  const sessions: AiSessionWithBookmarks[] = actualResults.map(session => ({
    ...session,
    type: session.type as AiSessionType,
    status: session.status as AiSessionStatus,
    relatedBookmarks: bookmarksBySession[session.id] || [],
  }));

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiSessions)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Generate next cursor
  let nextCursor: string | undefined;
  if (hasNextPage && sessions.length > 0) {
    const last = sessions[sessions.length - 1];
    nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
  }

  return {
    sessions,
    total: Number(count),
    pagination: {
      hasNextPage,
      hasPreviousPage: !!cursor,
      nextCursor,
    },
  };
}

// --- READ (Single session detail) ---

export async function getAiSessionById(
  sessionId: string
): Promise<AiSessionWithBookmarks | null> {
  const [session] = await db
    .select()
    .from(aiSessions)
    .where(eq(aiSessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  // Get related bookmarks with full details
  const bookmarksData = await db
    .select({
      sessionBookmark: aiSessionBookmarks,
      bookmark: bookmarks,
      user: users,
    })
    .from(aiSessionBookmarks)
    .leftJoin(bookmarks, eq(aiSessionBookmarks.bookmarkId, bookmarks.id))
    .leftJoin(users, eq(bookmarks.userId, users.id))
    .where(eq(aiSessionBookmarks.sessionId, sessionId))
    .orderBy(aiSessionBookmarks.sortOrder);

  // Get tags for bookmarks
  const bookmarkIds = bookmarksData.map(b => b.bookmark?.id).filter(Boolean) as string[];
  const tagsData = bookmarkIds.length > 0
    ? await db
        .select({
          bookmarkId: bookmarkTags.bookmarkId,
          tag: tags,
        })
        .from(bookmarkTags)
        .leftJoin(tags, eq(bookmarkTags.tagId, tags.id))
        .where(inArray(bookmarkTags.bookmarkId, bookmarkIds))
    : [];

  const tagsByBookmark = tagsData.reduce((acc, { bookmarkId, tag }) => {
    if (!acc[bookmarkId]) acc[bookmarkId] = [];
    if (tag) acc[bookmarkId].push({ id: tag.id, label: tag.label });
    return acc;
  }, {} as Record<string, Array<{ id: string; label: string }>>);

  // Format bookmarks
  const relatedBookmarks: Bookmark[] = bookmarksData
    .filter(b => b.bookmark)
    .map(({ bookmark, user }) => ({
      ...bookmark!,
      user: user!,
      entry: {
        id: bookmark!.id,
        title: bookmark!.title,
        canonicalUrl: bookmark!.canonicalUrl,
        rootUrl: bookmark!.rootUrl,
        summary: bookmark!.summary,
        domain: bookmark!.domain,
        normalizedDomain: bookmark!.normalizedDomain,
      },
      tags: tagsByBookmark[bookmark!.id] || [],
    }));

  // Get conversation history (parent chain)
  const conversationHistory = await getConversationHistory(sessionId);

  return {
    ...session,
    type: session.type as AiSessionType,
    status: session.status as AiSessionStatus,
    relatedBookmarks,
    conversationHistory,
  };
}

// --- Helper: Get conversation history ---

async function getConversationHistory(
  sessionId: string
): Promise<Array<{ id: string; question: string; createdAt: Date }>> {
  const parents: Array<{ id: string; question: string; createdAt: Date }> = [];
  let currentId: string | null = sessionId;

  while (currentId) {
    const [session] = await db
      .select({
        id: aiSessions.id,
        question: aiSessions.question,
        createdAt: aiSessions.createdAt,
        parentSessionId: aiSessions.parentSessionId,
      })
      .from(aiSessions)
      .where(eq(aiSessions.id, currentId))
      .limit(1);

    if (!session) break;

    if (session.id !== sessionId) {
      parents.unshift({ id: session.id, question: session.question, createdAt: session.createdAt });
    }

    currentId = session.parentSessionId;
  }

  return parents;
}

// --- DELETE ---

export async function deleteAiSession(sessionId: string): Promise<void> {
  await db.delete(aiSessions).where(eq(aiSessions.id, sessionId));
}
