import { db } from '@/db';
import { users, entries, bookmarks } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function createSampleBookmarks() {
  console.log('Creating sample bookmarks...\n');

  try {
    // Get existing user
    const user = await db.query.users.findFirst({
      where: eq(users.hatenaId, 'testuser'),
    });

    if (!user) {
      console.error('No test user found. Please run create-sample-data.ts first.');
      process.exit(1);
    }

    // Get existing entries
    const existingEntries = await db.query.entries.findMany();

    if (existingEntries.length === 0) {
      console.error('No entries found. Please run create-sample-data.ts first.');
      process.exit(1);
    }

    console.log(`Found ${existingEntries.length} entries to create bookmarks for.`);

    // Create bookmarks for existing entries
    const sampleBookmarks = existingEntries.map((entry, index) => ({
      comment: `Great resource #${index + 1}`,
      description: `This is a longer description for ${entry.title}`,
      url: entry.canonicalUrl,
      domain: entry.domain,
      bookmarkedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000), // Different days
      bookmarkUrl: `https://b.hatena.ne.jp/entry/${index + 1}`,
      userId: user.id,
      entryId: entry.id,
    }));

    const insertedBookmarks = await db.insert(bookmarks).values(sampleBookmarks).returning();
    console.log(`✅ Created ${insertedBookmarks.length} bookmarks`);

  } catch (error) {
    console.error('Error creating bookmarks:', error);
    process.exit(1);
  }

  process.exit(0);
}

createSampleBookmarks();