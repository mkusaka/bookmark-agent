import { db } from '@/db';
import { users, entries, bookmarks, tags, bookmarkTags } from '@/db/schema';
import { HatenaBookmarkClient } from './client';
import { HatenaBookmark } from './types';
import { eq } from 'drizzle-orm';
import { normalizeDomain } from '@/lib/domain-normalizer';

export class HatenaBookmarkImporter {
  private client: HatenaBookmarkClient;

  constructor() {
    this.client = new HatenaBookmarkClient();
  }

  async importUserBookmarks(hatenaId: string, limit?: number, totalCount?: number, skip?: number) {
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

      console.log(`Fetching bookmarks for user: ${hatenaId}`);
      const itemsPerPage = 20; // Hatena API returns 20 items per page
      
      let totalImported = 0;

      // If both limit and totalCount are provided, fetch from the last page backwards
      if (limit && totalCount) {
        const lastPageIndex = Math.ceil(totalCount / itemsPerPage);
        const itemsOnLastPage = totalCount % itemsPerPage || itemsPerPage;
        
        console.log(`Total bookmarks: ${totalCount}, limiting to ${limit} oldest bookmarks`);
        console.log(`Last page index: ${lastPageIndex} (contains ${itemsOnLastPage} items)`);
        console.log(`Will fetch from last page backwards`);
        
        // Use generator to fetch bookmarks page by page
        const fetchOldestBookmarks = async function* (this: HatenaBookmarkImporter) {
          for (let pageIndex = lastPageIndex; pageIndex >= 0; pageIndex--) {
            console.log(`Fetching page ${pageIndex}...`);
            const response = await this.client.fetchUserBookmarks(hatenaId, pageIndex);
            
            if (response.item.bookmarks.length === 0) {
              continue;
            }
            
            // Yield bookmarks in reverse order (oldest first within the page)
            const reversedBookmarks = response.item.bookmarks.reverse();
            for (const bookmark of reversedBookmarks) {
              yield bookmark;
            }
            
            // Add delay to avoid rate limiting
            // if (pageIndex > 0) {
            //   await new Promise(resolve => setTimeout(resolve, 1000));
            // }
          }
        }.bind(this);
        
        // Import bookmarks using the generator
        const bookmarkGenerator = fetchOldestBookmarks();
        
        for await (const hatenaBookmark of bookmarkGenerator) {
          if (totalImported >= limit) {
            break;
          }
          
          try {
            const result = await this.importSingleBookmark(hatenaBookmark, user.id);
            if (result !== 'skipped') {
              totalImported++;
              
              if (totalImported % 10 === 0) {
                console.log(`Imported ${totalImported}/${limit} bookmarks...`);
              }
            }
          } catch (error) {
            console.error(`Error importing bookmark: ${hatenaBookmark.url}`, error);
          }
        }
      } else {
        // Normal import from the beginning with optional skip
        const targetCount = limit || Number.MAX_SAFE_INTEGER;
        const skipCount = skip || 0;
        
        if (skip && limit) {
          console.log(`Skipping ${skip} bookmarks, then importing ${limit} bookmarks`);
        } else if (skip) {
          console.log(`Skipping ${skip} bookmarks, then importing all remaining`);
        } else if (limit) {
          console.log(`Limiting to ${limit} bookmarks`);
        } else {
          console.log('Importing all bookmarks');
        }
        
        // Use generator to fetch bookmarks page by page
        const fetchBookmarksFromStart = async function* (this: HatenaBookmarkImporter) {
          let page = 0;
          
          while (true) {
            console.log(`Fetching page ${page}...`);
            const response = await this.client.fetchUserBookmarks(hatenaId, page);
            
            if (response.item.bookmarks.length === 0) {
              break;
            }
            
            for (const bookmark of response.item.bookmarks) {
              yield bookmark;
            }
            
            page++;
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }.bind(this);
        
        // Import bookmarks using the generator
        const bookmarkGenerator = fetchBookmarksFromStart();
        
        let processedCount = 0;
        
        for await (const hatenaBookmark of bookmarkGenerator) {
          processedCount++;
          
          // Skip the first N bookmarks without DB access
          if (skipCount > 0 && processedCount <= skipCount) {
            if (processedCount % 100 === 0) {
              console.log(`Skipped ${processedCount}/${skipCount} bookmarks...`);
            }
            continue;
          }
          
          if (totalImported >= targetCount) {
            break;
          }
          
          try {
            const result = await this.importSingleBookmark(hatenaBookmark, user.id);
            if (result !== 'skipped') {
              totalImported++;
              
              if (totalImported % 10 === 0) {
                const actualProgress = skipCount > 0 ? totalImported + skipCount : totalImported;
                const actualTarget = skipCount > 0 && targetCount !== Number.MAX_SAFE_INTEGER 
                  ? targetCount + skipCount 
                  : targetCount === Number.MAX_SAFE_INTEGER 
                    ? 'all' 
                    : targetCount;
                console.log(`Imported ${actualProgress}/${actualTarget} bookmarks (${totalImported} newly imported)...`);
              }
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

  private async importSingleBookmark(hatenaBookmark: HatenaBookmark, userId: string): Promise<'imported' | 'skipped'> {
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
        normalizedDomain: normalizeDomain(hatenaBookmark.entry.root_url),
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
      console.log(`[${new Date().toISOString()}] Bookmark already exists: ${hatenaBookmark.url}`);
      return 'skipped';
    }

    // Create bookmark
    const [newBookmark] = await db.insert(bookmarks).values({
      comment: hatenaBookmark.comment || '',
      description: hatenaBookmark.comment_expanded || '',
      url: hatenaBookmark.url,
      domain,
      normalizedDomain: normalizeDomain(hatenaBookmark.url),
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
    
    return 'imported';
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
            const result = await this.importSingleBookmark(hatenaBookmark, user.id);
            if (result === 'imported') {
              imported++;
            }
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

      console.log(`Latest import completed. Imported: ${imported}`);
      return { imported };
    } catch (error) {
      console.error('Latest import failed:', error);
      throw error;
    }
  }
}
