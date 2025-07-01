import { db } from '@/db';
import { users, entries, bookmarks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { normalizeDomain } from '@/lib/domain-normalizer';

async function testMigration() {
  console.log('Creating test bookmark without migrated data...\n');

  try {
    // Get test user
    const user = await db.query.users.findFirst({
      where: eq(users.hatenaId, 'testuser'),
    });

    if (!user) {
      console.error('Test user not found');
      process.exit(1);
    }

    // Create a new entry
    const [newEntry] = await db.insert(entries).values({
      title: 'Test Entry for Migration',
      canonicalUrl: 'https://example.com/test',
      rootUrl: 'https://example.com',
      summary: 'This is a test entry to verify migration',
      domain: 'example.com',
      normalizedDomain: normalizeDomain('https://example.com/test'),
    }).returning();

    console.log(`Created test entry: ${newEntry.title}`);

    // Create a bookmark WITHOUT the new fields (simulating old data)
    const [newBookmark] = await db.insert(bookmarks).values({
      comment: 'Test bookmark for migration',
      description: 'Testing the migration process',
      url: 'https://example.com/test',
      domain: 'example.com',
      bookmarkedAt: new Date(),
      bookmarkUrl: 'https://b.hatena.ne.jp/entry/test',
      userId: user.id,
      entryId: newEntry.id,
      // Explicitly NOT setting title, canonicalUrl, etc.
    }).returning();

    console.log(`Created test bookmark: ${newBookmark.id}`);
    console.log(`  - Has title? ${newBookmark.title ? 'Yes' : 'No'}`);
    console.log(`  - Has canonicalUrl? ${newBookmark.canonicalUrl ? 'Yes' : 'No'}`);
    console.log(`  - Has normalizedDomain? ${newBookmark.normalizedDomain ? 'Yes' : 'No'}`);

    console.log('\n✅ Test data created. Now run the migration script to test it.');
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }

  process.exit(0);
}

testMigration();