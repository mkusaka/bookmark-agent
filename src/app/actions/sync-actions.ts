'use server';

import { db } from '@/db';
import { bookmarks, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { HatenaBookmarkImporter } from '@/lib/hatena/importer';

export type SyncResultItem = {
  hatenaId: string;
  imported?: number;
  sinceDate?: string;
  error?: string;
};

export async function syncLatestBookmarks(): Promise<{
  success: boolean;
  results: SyncResultItem[];
  timestamp: string;
}> {
  const importer = new HatenaBookmarkImporter();
  const results: SyncResultItem[] = [];

  const uniqueUsers = await db
    .selectDistinct({ hatenaId: users.hatenaId })
    .from(users);

  for (const user of uniqueUsers) {
    if (!user.hatenaId) continue;

    try {
      const latestBookmark = await db
        .select({ bookmarkedAt: bookmarks.bookmarkedAt })
        .from(bookmarks)
        .innerJoin(users, eq(bookmarks.userId, users.id))
        .where(eq(users.hatenaId, user.hatenaId))
        .orderBy(desc(bookmarks.bookmarkedAt))
        .limit(1);

      const sinceDate =
        latestBookmark.length > 0 ? latestBookmark[0].bookmarkedAt : undefined;

      const imported = await importer.importLatestBookmarks(
        user.hatenaId,
        sinceDate
      );

      results.push({
        hatenaId: user.hatenaId,
        imported,
        sinceDate: sinceDate?.toISOString(),
      });
    } catch (err) {
      results.push({
        hatenaId: user.hatenaId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return {
    success: true,
    results,
    timestamp: new Date().toISOString(),
  };
}
