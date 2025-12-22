import { db } from '@/db';
import { users, bookmarks, tags, bookmarkTags } from '@/db/schema';
import { HatenaBookmarkClient } from './client';
import { HatenaBookmark } from './types';
import { and, eq, inArray } from 'drizzle-orm';
import { normalizeDomain } from '@/lib/domain-normalizer';
import { syncBookmarkToGeminiFileSearchStore } from '@/lib/gemini/bookmark-sync';
import { fetchMarkdownFromCloudflare } from '@/lib/cloudflare/markdown';
import PQueue from 'p-queue';

const CONCURRENCY = 10;

export class HatenaBookmarkImporter {
  private client: HatenaBookmarkClient;
  private tagIdCache: Map<string, string>;

  constructor() {
    this.client = new HatenaBookmarkClient();
    this.tagIdCache = new Map();
  }

  async importUserBookmarks(
    hatenaId: string,
    limit?: number,
    totalCount?: number,
    skip?: number
  ): Promise<{ imported: number; updated: number; skipped: number }> {
    try {
      if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_FILE_SEARCH_STORE_NAME) {
        throw new Error('GEMINI_API_KEY and GEMINI_FILE_SEARCH_STORE_NAME are required for import');
      }

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
      
      let imported = 0;
      let updated = 0;
      let skippedCount = 0;

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
          if (imported + updated >= limit) {
            break;
          }
          
          try {
            const result = await this.importSingleBookmark(hatenaBookmark, user.id);
            if (result === 'imported') {
              imported++;
            } else if (result === 'updated') {
              updated++;
            } else {
              skippedCount++;
            }
              
            const changed = imported + updated;
            if (changed % 10 === 0) {
              console.log(`Processed ${changed}/${limit} bookmarks (imported=${imported}, updated=${updated}, skipped=${skippedCount})...`);
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
        console.log(`Using ${CONCURRENCY} concurrent workers`);

        const queue = new PQueue({ concurrency: CONCURRENCY });
        let processedCount = 0;
        let reachedLimit = false;
        let page = 0;

        while (!reachedLimit) {
          console.log(`Fetching page ${page}...`);
          const response = await this.client.fetchUserBookmarks(hatenaId, page);

          if (response.item.bookmarks.length === 0) {
            break;
          }

          const bookmarksToProcess: HatenaBookmark[] = [];

          for (const bookmark of response.item.bookmarks) {
            processedCount++;

            // Skip the first N bookmarks without DB access
            if (skipCount > 0 && processedCount <= skipCount) {
              if (processedCount % 100 === 0) {
                console.log(`Skipped ${processedCount}/${skipCount} bookmarks...`);
              }
              continue;
            }

            if (imported + updated + bookmarksToProcess.length >= targetCount) {
              reachedLimit = true;
              break;
            }

            bookmarksToProcess.push(bookmark);
          }

          // Process page bookmarks in parallel
          const results = await Promise.all(
            bookmarksToProcess.map((hatenaBookmark) =>
              queue.add(async () => {
                try {
                  return await this.importSingleBookmark(hatenaBookmark, user.id);
                } catch (error) {
                  console.error(`Error importing bookmark: ${hatenaBookmark.url}`, error);
                  return 'error' as const;
                }
              })
            )
          );

          for (const result of results) {
            if (result === 'imported') {
              imported++;
            } else if (result === 'updated') {
              updated++;
            } else if (result === 'skipped') {
              skippedCount++;
            }
          }

          const changed = imported + updated;
          const actualProgress = skipCount > 0 ? changed + skipCount : changed;
          const actualTarget =
            skipCount > 0 && targetCount !== Number.MAX_SAFE_INTEGER
              ? targetCount + skipCount
              : targetCount === Number.MAX_SAFE_INTEGER
                ? 'all'
                : targetCount;
          console.log(
            `Processed ${actualProgress}/${actualTarget} bookmarks (imported=${imported}, updated=${updated}, skipped=${skippedCount})...`
          );

          page++;

          // Add delay to avoid Hatena API rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      console.log(`Import completed. imported=${imported}, updated=${updated}, skipped=${skippedCount}`);
      return { imported, updated, skipped: skippedCount };
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  private async importSingleBookmark(
    hatenaBookmark: HatenaBookmark,
    userId: string
  ): Promise<'imported' | 'updated' | 'skipped'> {
    // Extract domain from URL
    const domain = new URL(hatenaBookmark.url).hostname;
    const canonicalUrl = hatenaBookmark.entry.canonical_url;
    const desiredBookmark = {
      comment: hatenaBookmark.comment || '',
      description: hatenaBookmark.comment_expanded || '',
      url: hatenaBookmark.url,
      domain,
      bookmarkedAt: new Date(hatenaBookmark.created),
      bookmarkUrl: `https://b.hatena.ne.jp/entry/${hatenaBookmark.location_id}`,
      title: hatenaBookmark.entry.title,
      canonicalUrl,
      rootUrl: hatenaBookmark.entry.root_url,
      summary: hatenaBookmark.entry.summary || '',
      normalizedDomain: normalizeDomain(canonicalUrl),
    } as const;

    // Check if bookmark already exists
    const existingBookmark = await db.query.bookmarks.findFirst({
      where: (bookmarks, { and, eq }) => and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.url, hatenaBookmark.url)
      ),
    });

    if (existingBookmark) {
      const needsUpdate =
        existingBookmark.comment !== desiredBookmark.comment ||
        existingBookmark.description !== desiredBookmark.description ||
        existingBookmark.domain !== desiredBookmark.domain ||
        existingBookmark.bookmarkedAt.getTime() !== desiredBookmark.bookmarkedAt.getTime() ||
        existingBookmark.bookmarkUrl !== desiredBookmark.bookmarkUrl ||
        existingBookmark.title !== desiredBookmark.title ||
        existingBookmark.canonicalUrl !== desiredBookmark.canonicalUrl ||
        existingBookmark.rootUrl !== desiredBookmark.rootUrl ||
        existingBookmark.summary !== desiredBookmark.summary ||
        existingBookmark.normalizedDomain !== desiredBookmark.normalizedDomain;

      let updatedBookmark = false;
      if (needsUpdate) {
        await db
          .update(bookmarks)
          .set({
            ...desiredBookmark,
            updatedAt: new Date(),
          })
          .where(eq(bookmarks.id, existingBookmark.id));
        updatedBookmark = true;
      }

      const tagsChanged = await this.syncBookmarkTags(
        existingBookmark.id,
        userId,
        hatenaBookmark.tags
      );

      // Fetch markdown if missing
      let markdownFetched = false;
      if (!existingBookmark.markdownContent) {
        markdownFetched = await this.fetchAndSaveMarkdownIfMissing(existingBookmark.id, existingBookmark.url);
      }

      // Sync to Gemini if bookmark/tags changed, markdown fetched, or not yet indexed
      const needsGeminiSync = updatedBookmark || tagsChanged || markdownFetched || !existingBookmark.geminiDocumentName;

      if (needsGeminiSync) {
        await this.syncGeminiIndexIfEnabled(existingBookmark.id);
      }

      if (updatedBookmark || tagsChanged || markdownFetched) {
        return 'updated';
      }

      // If only Gemini sync was needed (bookmark unchanged but missing from File Store)
      if (!existingBookmark.geminiDocumentName) {
        return 'updated';
      }

      return 'skipped';
    }

    // Create bookmark with all entry data
    const [newBookmark] = await db.insert(bookmarks).values({
      userId,
      ...desiredBookmark,
    }).returning();

    await this.syncBookmarkTags(newBookmark.id, userId, hatenaBookmark.tags);

    // Fetch markdown content if not already present
    await this.fetchAndSaveMarkdownIfMissing(newBookmark.id, newBookmark.url);

    await this.syncGeminiIndexIfEnabled(newBookmark.id);

    return 'imported';
  }

  private async syncGeminiIndexIfEnabled(bookmarkId: string) {
    await syncBookmarkToGeminiFileSearchStore(bookmarkId);
  }

  private async fetchAndSaveMarkdownIfMissing(bookmarkId: string, url: string): Promise<boolean> {
    // Check if Cloudflare credentials are configured
    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
      console.log(`  Skipping markdown fetch: Cloudflare credentials not configured`);
      return false;
    }

    try {
      console.log(`  Fetching markdown for: ${url}`);
      const markdownContent = await fetchMarkdownFromCloudflare(url);

      if (markdownContent) {
        console.log(`  Markdown fetched (${markdownContent.length} chars), saving to DB...`);
        await db
          .update(bookmarks)
          .set({
            markdownContent,
            markdownFetchedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(bookmarks.id, bookmarkId));
        console.log(`  Markdown saved to DB`);
        return true;
      }
      console.log(`  No markdown content returned from Cloudflare`);
      return false;
    } catch (error) {
      console.error(`Failed to fetch markdown for ${url}:`, error);
      return false;
    }
  }

  private async getOrCreateTagId(tagLabel: string): Promise<string> {
    const cached = this.tagIdCache.get(tagLabel);
    if (cached) return cached;

    const existing = await db.query.tags.findFirst({
      where: eq(tags.label, tagLabel),
    });
    if (existing) {
      this.tagIdCache.set(tagLabel, existing.id);
      return existing.id;
    }

    const [created] = await db
      .insert(tags)
      .values({ label: tagLabel })
      .onConflictDoNothing()
      .returning();

    const createdId = created?.id;
    if (createdId) {
      this.tagIdCache.set(tagLabel, createdId);
      return createdId;
    }

    // If we lost a race to another inserter, fetch again.
    const after = await db.query.tags.findFirst({
      where: eq(tags.label, tagLabel),
    });
    if (!after) {
      throw new Error(`Failed to create or fetch tag: ${tagLabel}`);
    }
    this.tagIdCache.set(tagLabel, after.id);
    return after.id;
  }

  private async syncBookmarkTags(
    bookmarkId: string,
    userId: string,
    desiredTagLabels: string[]
  ): Promise<boolean> {
    const desired = Array.from(new Set(desiredTagLabels.filter(Boolean)));

    const existing = await db
      .select({ tagId: tags.id, label: tags.label })
      .from(bookmarkTags)
      .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
      .where(and(eq(bookmarkTags.bookmarkId, bookmarkId), eq(bookmarkTags.userId, userId)));

    const existingLabels = new Set(existing.map((t) => t.label));
    const desiredLabels = new Set(desired);

    const labelsToAdd = desired.filter((l) => !existingLabels.has(l));
    const labelsToRemove = existing
      .filter((t) => !desiredLabels.has(t.label))
      .map((t) => t.tagId);

    if (labelsToAdd.length === 0 && labelsToRemove.length === 0) {
      return false;
    }

    for (const label of labelsToAdd) {
      const tagId = await this.getOrCreateTagId(label);
      await db
        .insert(bookmarkTags)
        .values({ bookmarkId, tagId, userId })
        .onConflictDoNothing();
    }

    if (labelsToRemove.length > 0) {
      await db
        .delete(bookmarkTags)
        .where(
          and(
            eq(bookmarkTags.bookmarkId, bookmarkId),
            eq(bookmarkTags.userId, userId),
            inArray(bookmarkTags.tagId, labelsToRemove)
          )
        );
    }

    return true;
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
      let foundExisting = false;

      while (!foundExisting) {
        const response = await this.client.fetchUserBookmarks(hatenaId, page);
        
        if (response.item.bookmarks.length === 0) {
          break;
        }

        for (const hatenaBookmark of response.item.bookmarks) {
          // Check if we've reached bookmarks before sinceDate
          if (sinceDate && new Date(hatenaBookmark.created) < sinceDate) {
            foundExisting = true;
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
            console.log(`Found existing bookmark, stopping import`);
            foundExisting = true;
            break;
          }

          const result = await this.importSingleBookmark(hatenaBookmark, user.id);
          if (result === 'imported') {
            imported++;
            console.log(`Imported: ${hatenaBookmark.url}`);
          }
        }

        page++;
        
        // Add delay to avoid rate limiting
        if (!foundExisting) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Import completed. Total new bookmarks imported: ${imported}`);
      return imported;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }
}
