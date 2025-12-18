'use server';

import { db } from '@/db';
import { bookmarks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { fetchMarkdownFromCloudflare } from '@/lib/cloudflare/markdown';

export async function fetchMarkdownContent(url: string): Promise<string | null> {
  return fetchMarkdownFromCloudflare(url);
}

export async function getOrFetchMarkdownContent(bookmarkId: string, url: string): Promise<string | null> {

  try {
    // First, check if we have cached markdown content
    const bookmark = await db
      .select({
        markdownContent: bookmarks.markdownContent,
        markdownFetchedAt: bookmarks.markdownFetchedAt,
      })
      .from(bookmarks)
      .where(eq(bookmarks.id, bookmarkId))
      .limit(1);

    if (bookmark.length > 0 && bookmark[0].markdownContent) {
      return bookmark[0].markdownContent;
    }

    // If not cached, fetch from Cloudflare
    const markdownContent = await fetchMarkdownContent(url);
    
    if (markdownContent) {
      // Save to database
      await db
        .update(bookmarks)
        .set({
          markdownContent,
          markdownFetchedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(bookmarks.id, bookmarkId));
      
    }

    return markdownContent;
  } catch (error) {
    return null;
  }
}

export async function refreshMarkdownContent(bookmarkId: string, url: string): Promise<string | null> {

  try {
    // Force fetch from Cloudflare
    const markdownContent = await fetchMarkdownContent(url);
    
    if (markdownContent) {
      // Update database
      await db
        .update(bookmarks)
        .set({
          markdownContent,
          markdownFetchedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(bookmarks.id, bookmarkId));
      
    }

    return markdownContent;
  } catch (error) {
    return null;
  }
}