import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookmarks, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { HatenaBookmarkImporter } from '@/lib/hatena/importer';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting bookmark sync cron job');

    // Get all unique hatena IDs
    const uniqueUsers = await db
      .selectDistinct({ hatenaId: users.hatenaId })
      .from(users);

    const results = [];
    const importer = new HatenaBookmarkImporter();

    for (const user of uniqueUsers) {
      if (!user.hatenaId) continue;

      try {
        // Get the most recent bookmark for this user
        const latestBookmark = await db
          .select({ bookmarkedAt: bookmarks.bookmarkedAt })
          .from(bookmarks)
          .innerJoin(users, eq(bookmarks.userId, users.id))
          .where(eq(users.hatenaId, user.hatenaId))
          .orderBy(desc(bookmarks.bookmarkedAt))
          .limit(1);

        const sinceDate = latestBookmark.length > 0 
          ? latestBookmark[0].bookmarkedAt 
          : undefined;

        console.log(`Syncing bookmarks for ${user.hatenaId} since ${sinceDate?.toISOString() || 'beginning'}`);

        // Import latest bookmarks
        const result = await importer.importLatestBookmarks(
          user.hatenaId,
          sinceDate
        );

        results.push({
          hatenaId: user.hatenaId,
          ...result,
          sinceDate: sinceDate?.toISOString(),
        });

      } catch (error) {
        console.error(`Error syncing bookmarks for ${user.hatenaId}:`, error);
        results.push({
          hatenaId: user.hatenaId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('Bookmark sync cron job completed');

    return NextResponse.json({
      success: true,
      message: 'Bookmark sync completed',
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}