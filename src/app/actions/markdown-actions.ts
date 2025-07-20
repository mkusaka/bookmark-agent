'use server';

import { db } from '@/db';
import { bookmarks } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface CloudflareMarkdownResponse {
  result: string;
  success: boolean;
  errors?: Array<{ message: string }>;
}

export async function fetchMarkdownContent(url: string): Promise<string | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/markdown`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ url }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: CloudflareMarkdownResponse = await response.json();

    if (!data.success || !data.result) {
      return null;
    }

    return data.result;
  } catch (error) {
    return null;
  }
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