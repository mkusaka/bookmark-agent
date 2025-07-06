import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookmarks, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { HatenaBookmarkImporter } from '@/lib/hatena/importer';
import { revalidateTag } from 'next/cache';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization with constant-time comparison
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!authHeader || !process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Pad both strings to the same length for constant-time comparison
    const maxLength = Math.max(authHeader.length, expectedAuth.length);
    const authHeaderPadded = authHeader.padEnd(maxLength, ' ');
    const expectedAuthPadded = expectedAuth.padEnd(maxLength, ' ');
    
    const authHeaderBuffer = Buffer.from(authHeaderPadded);
    const expectedAuthBuffer = Buffer.from(expectedAuthPadded);
    
    const isEqual = crypto.timingSafeEqual(authHeaderBuffer, expectedAuthBuffer);
    
    if (!isEqual) {
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
          imported: result,
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

    // Revalidate cached domains and tags if any bookmarks were imported
    const totalImported = results.reduce((sum, r) => sum + (r.imported || 0), 0);
    if (totalImported > 0) {
      console.log(`Revalidating cache tags after importing ${totalImported} bookmarks`);
      revalidateTag('domains');
      revalidateTag('tags');
    }

    return NextResponse.json({
      success: true,
      message: 'Bookmark sync completed',
      results,
      timestamp: new Date().toISOString(),
      cacheRevalidated: totalImported > 0,
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