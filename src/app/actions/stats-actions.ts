'use server';

import { db } from '@/db';
import { bookmarks, tags, bookmarkTags, users } from '@/db/schema';
import { sql, eq, desc } from 'drizzle-orm';

export async function getBookmarkStats() {
  const stats = await db
    .select({
      totalBookmarks: sql<number>`count(distinct ${bookmarks.id})`,
      totalDomains: sql<number>`count(distinct ${bookmarks.normalizedDomain})`,
      totalUsers: sql<number>`count(distinct ${users.id})`,
    })
    .from(bookmarks)
    .innerJoin(users, eq(bookmarks.userId, users.id));

  return {
    totalBookmarks: stats[0]?.totalBookmarks || 0,
    totalEntries: stats[0]?.totalDomains || 0, // Keep as totalEntries for backward compatibility
    totalUsers: stats[0]?.totalUsers || 0,
  };
}

export async function getDomainStats() {
  const domainStats = await db
    .select({
      domain: bookmarks.normalizedDomain,
      count: sql<number>`count(*)`,
    })
    .from(bookmarks)
    .where(sql`${bookmarks.normalizedDomain} is not null`)
    .groupBy(bookmarks.normalizedDomain)
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
    .orderBy(desc(sql`count(${bookmarkTags.bookmarkId})`));

  return tagStats.map(stat => ({
    id: stat.id,
    label: stat.label,
    count: stat.count,
  }));
}

export async function getUserStats() {
  const userStats = await db
    .select({
      id: users.id,
      name: users.name,
      count: sql<number>`count(${bookmarks.id})`,
    })
    .from(users)
    .leftJoin(bookmarks, eq(users.id, bookmarks.userId))
    .groupBy(users.id, users.name)
    .orderBy(desc(sql`count(${bookmarks.id})`));

  return userStats.map(stat => ({
    id: stat.id,
    name: stat.name,
    count: stat.count,
  }));
}

export async function getTimelineStats() {
  const timelineStats = await db
    .select({
      date: sql<string>`date_trunc('day', ${bookmarks.bookmarkedAt})::date`,
      count: sql<number>`count(*)`,
    })
    .from(bookmarks)
    .groupBy(sql`date_trunc('day', ${bookmarks.bookmarkedAt})`)
    .orderBy(sql`date_trunc('day', ${bookmarks.bookmarkedAt})`);

  return timelineStats.map(stat => ({
    date: stat.date,
    count: stat.count,
  }));
}

export async function getBookmarkGrowthStats() {
  const growthStats = await db
    .select({
      date: sql<string>`date_trunc('month', ${bookmarks.bookmarkedAt})::date`,
      count: sql<number>`count(*)`,
      cumulative: sql<number>`sum(count(*)) over (order by date_trunc('month', ${bookmarks.bookmarkedAt}))`,
    })
    .from(bookmarks)
    .groupBy(sql`date_trunc('month', ${bookmarks.bookmarkedAt})`)
    .orderBy(sql`date_trunc('month', ${bookmarks.bookmarkedAt})`);

  return growthStats.map(stat => ({
    date: stat.date,
    count: stat.count,
    cumulative: stat.cumulative,
  }));
}