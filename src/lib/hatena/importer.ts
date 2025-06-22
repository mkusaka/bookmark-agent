import { db } from '@/db';
import { users, entries, bookmarks, tags, bookmarkTags } from '@/db/schema';
import { HatenaBookmarkClient } from './client';
import { HatenaBookmark } from './types';
import { eq } from 'drizzle-orm';

export class HatenaBookmarkImporter {
  private client: HatenaBookmarkClient;

  constructor() {
    this.client = new HatenaBookmarkClient();
  }

  async importUserBookmarks(hatenaId: string) {
    try {
      // Get or create user
      let user = await db.query.users.findFirst({
        where: eq(users.hatenaId, hatenaId),
      });

      if (!user) {
        const [newUser] = await db.insert(users).values({
          name: hatenaId,
          hatenaId,
        }).returning();
        user = newUser;
      }

      // Fetch all bookmarks
      console.log(`Fetching bookmarks for user: ${hatenaId}`);
      const responses = await this.client.fetchAllUserBookmarks(hatenaId);

      let totalImported = 0;

      for (const response of responses) {
        for (const hatenaBookmark of response.item.bookmarks) {
          try {
            await this.importSingleBookmark(hatenaBookmark, user.id);
            totalImported++;
            
            if (totalImported % 10 === 0) {
              console.log(`Imported ${totalImported} bookmarks...`);
            }
          } catch (error) {
            console.error(`Error importing bookmark: ${hatenaBookmark.url}`, error);
          }
        }
      }

      console.log(`Import completed. Total bookmarks imported: ${totalImported}`);
      return totalImported;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  private async importSingleBookmark(hatenaBookmark: HatenaBookmark, userId: string) {
    // Extract domain from URL
    const domain = new URL(hatenaBookmark.url).hostname;

    // Get or create entry
    let entry = await db.query.entries.findFirst({
      where: eq(entries.canonicalUrl, hatenaBookmark.entry.canonical_url),
    });

    if (!entry) {
      const [newEntry] = await db.insert(entries).values({
        title: hatenaBookmark.entry.title,
        canonicalUrl: hatenaBookmark.entry.canonical_url,
        rootUrl: hatenaBookmark.entry.root_url,
        summary: hatenaBookmark.entry.summary || '',
        domain: new URL(hatenaBookmark.entry.canonical_url).hostname,
      }).returning();
      entry = newEntry;
    }

    // Check if bookmark already exists
    const existingBookmark = await db.query.bookmarks.findFirst({
      where: (bookmarks, { and, eq }) => and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.url, hatenaBookmark.url)
      ),
    });

    if (existingBookmark) {
      console.log(`Bookmark already exists: ${hatenaBookmark.url}`);
      return;
    }

    // Create bookmark
    const [newBookmark] = await db.insert(bookmarks).values({
      comment: hatenaBookmark.comment || '',
      description: hatenaBookmark.comment_expanded || '',
      url: hatenaBookmark.url,
      domain,
      bookmarkedAt: new Date(hatenaBookmark.created),
      bookmarkUrl: `https://b.hatena.ne.jp/entry/${hatenaBookmark.location_id}`,
      userId,
      entryId: entry.id,
    }).returning();

    // Process tags
    for (const tagLabel of hatenaBookmark.tags) {
      // Get or create tag
      let tag = await db.query.tags.findFirst({
        where: eq(tags.label, tagLabel),
      });

      if (!tag) {
        const [newTag] = await db.insert(tags).values({
          label: tagLabel,
        }).returning();
        tag = newTag;
      }

      // Create bookmark-tag relationship
      await db.insert(bookmarkTags).values({
        bookmarkId: newBookmark.id,
        tagId: tag.id,
        userId,
      }).onConflictDoNothing();
    }
  }

  async importLatestBookmarks(hatenaId: string, sinceDate?: Date) {
    try {
      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.hatenaId, hatenaId),
      });

      if (!user) {
        throw new Error(`User not found: ${hatenaId}`);
      }

      console.log(`Fetching latest bookmarks for user: ${hatenaId}`);
      
      let imported = 0;
      let skipped = 0;
      let page = 0;
      let hasMore = true;
      let shouldContinue = true;

      while (hasMore && shouldContinue) {
        // Fetch bookmarks page by page
        const response = await this.client.fetchUserBookmarks(hatenaId, page);
        
        if (response.item.bookmarks.length === 0) {
          hasMore = false;
          break;
        }

        for (const hatenaBookmark of response.item.bookmarks) {
          const bookmarkDate = new Date(hatenaBookmark.created);
          
          // Stop processing if we've reached bookmarks older than sinceDate
          if (sinceDate && bookmarkDate <= sinceDate) {
            shouldContinue = false;
            break;
          }

          // Check if bookmark already exists
          const existingBookmark = await db.query.bookmarks.findFirst({
            where: (bookmarks, { and, eq }) => and(
              eq(bookmarks.userId, user.id),
              eq(bookmarks.url, hatenaBookmark.url)
            ),
          });

          if (existingBookmark) {
            // If we found an existing bookmark, we can stop here
            // as we've likely already imported all newer bookmarks
            console.log(`Found existing bookmark, stopping: ${hatenaBookmark.url}`);
            shouldContinue = false;
            break;
          }

          try {
            await this.importSingleBookmark(hatenaBookmark, user.id);
            imported++;
          } catch (error) {
            console.error(`Error importing bookmark: ${hatenaBookmark.url}`, error);
          }
        }

        page++;
        
        // Add a small delay to avoid rate limiting
        if (hasMore && shouldContinue) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Latest import completed. Imported: ${imported}, Skipped: ${skipped}`);
      return { imported, skipped };
    } catch (error) {
      console.error('Latest import failed:', error);
      throw error;
    }
  }
}