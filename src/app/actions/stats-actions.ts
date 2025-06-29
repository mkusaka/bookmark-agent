'use server';

import { db } from '@/db';
import { bookmarks, entries, tags, bookmarkTags, users } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function getBookmarkStats() {
  const stats = await db
    .select({
      totalBookmarks: sql<number>`count(distinct ${bookmarks.id})`,
      totalEntries: sql<number>`count(distinct ${entries.id})`,
      totalUsers: sql<number>`count(distinct ${users.id})`,
    })
    .from(bookmarks)
    .innerJoin(entries, eq(bookmarks.entryId, entries.id))
    .innerJoin(users, eq(bookmarks.userId, users.id));

  return {
    totalBookmarks: stats[0]?.totalBookmarks || 0,
    totalEntries: stats[0]?.totalEntries || 0,
    totalUsers: stats[0]?.totalUsers || 0,
  };
}

export async function getDomainStats() {
  const domainStats = await db
    .select({
      domain: entries.normalizedDomain,
      count: sql<number>`count(*)`,
    })
    .from(bookmarks)
    .innerJoin(entries, eq(bookmarks.entryId, entries.id))
    .where(sql`${entries.normalizedDomain} is not null`)
    .groupBy(entries.normalizedDomain)
    .orderBy(desc(sql`count(*)`));

  return domainStats.map(stat => ({
    domain: stat.domain!,
    count: stat.count,
  }));
}

export async function getTagStats() {
  // Get all tags with their usage counts
  const tagStats = await db
    .select({
      id: tags.id,
      label: tags.label,
      count: sql<number>`count(${bookmarkTags.bookmarkId})`,
    })
    .from(tags)
    .leftJoin(bookmarkTags, eq(tags.id, bookmarkTags.tagId))
    .groupBy(tags.id, tags.label)
    .orderBy(desc(sql`count(${bookmarkTags.bookmarkId})`), tags.label);

  return {
    totalTags: tagStats.length,
    tags: tagStats.map(tag => ({
      id: tag.id,
      label: tag.label,
      count: tag.count,
    })),
  };
}

export async function getTimelineStats(timeRange?: { start: Date; end: Date }) {
  const conditions = [];
  if (timeRange) {
    conditions.push(
      sql`${bookmarks.bookmarkedAt} >= ${timeRange.start}`,
      sql`${bookmarks.bookmarkedAt} <= ${timeRange.end}`
    );
  }

  const whereClause = conditions.length > 0 ? sql`where ${sql.join(conditions, sql` and `)}` : sql``;

  const timelineData = await db.execute(sql`
    select 
      date_trunc('month', ${bookmarks.bookmarkedAt}) as month,
      count(*) as count
    from ${bookmarks}
    ${whereClause}
    group by month
    order by month
  `);

  return timelineData.rows.map(row => ({
    month: row.month as Date,
    count: Number(row.count),
  }));
}

export async function getUserStats() {
  const userStats = await db
    .select({
      id: users.id,
      hatenaId: users.hatenaId,
      count: sql<number>`count(${bookmarks.id})`,
    })
    .from(users)
    .leftJoin(bookmarks, eq(users.id, bookmarks.userId))
    .groupBy(users.id, users.hatenaId)
    .orderBy(desc(sql`count(${bookmarks.id})`));

  return userStats.map(user => ({
    id: user.id,
    hatenaId: user.hatenaId,
    count: user.count,
  }));
}

import { eq, desc } from 'drizzle-orm';