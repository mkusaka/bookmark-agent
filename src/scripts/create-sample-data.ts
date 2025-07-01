import { db } from '@/db';
import { users, entries, bookmarks, tags, bookmarkTags } from '@/db/schema';
import { normalizeDomain } from '@/lib/domain-normalizer';

async function createSampleData() {
  console.log('Creating sample data...\n');

  try {
    // Create a test user
    const [user] = await db.insert(users).values({
      name: 'Test User',
      hatenaId: 'testuser',
    }).returning();
    console.log(`Created user: ${user.name}`);

    // Create some entries
    const sampleEntries = [
      {
        title: 'GitHub - The world\'s leading software development platform',
        canonicalUrl: 'https://github.com',
        rootUrl: 'https://github.com',
        summary: 'GitHub is where people build software.',
        domain: 'github.com',
        normalizedDomain: normalizeDomain('https://github.com'),
      },
      {
        title: 'Stack Overflow - Where Developers Learn, Share, & Build Careers',
        canonicalUrl: 'https://stackoverflow.com',
        rootUrl: 'https://stackoverflow.com',
        summary: 'Stack Overflow is the largest online community for developers.',
        domain: 'stackoverflow.com',
        normalizedDomain: normalizeDomain('https://stackoverflow.com'),
      },
      {
        title: 'MDN Web Docs',
        canonicalUrl: 'https://developer.mozilla.org',
        rootUrl: 'https://developer.mozilla.org',
        summary: 'Resources for developers, by developers.',
        domain: 'developer.mozilla.org',
        normalizedDomain: normalizeDomain('https://developer.mozilla.org'),
      },
    ];

    const insertedEntries = await db.insert(entries).values(sampleEntries).returning();
    console.log(`Created ${insertedEntries.length} entries`);

    // Create bookmarks
    const sampleBookmarks = insertedEntries.map((entry, index) => ({
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
    console.log(`Created ${insertedBookmarks.length} bookmarks`);

    // Create some tags
    const sampleTags = ['programming', 'development', 'reference', 'documentation'];
    const insertedTags = await db.insert(tags).values(
      sampleTags.map(label => ({ label }))
    ).returning();
    console.log(`Created ${insertedTags.length} tags`);

    // Create bookmark-tag relationships
    for (let i = 0; i < insertedBookmarks.length; i++) {
      const bookmark = insertedBookmarks[i];
      const tagCount = i + 1; // First bookmark gets 1 tag, second gets 2, etc.
      
      for (let j = 0; j < Math.min(tagCount, insertedTags.length); j++) {
        await db.insert(bookmarkTags).values({
          bookmarkId: bookmark.id,
          tagId: insertedTags[j].id,
          userId: user.id,
        });
      }
    }
    console.log('Created bookmark-tag relationships');

    console.log('\n✅ Sample data created successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }

  process.exit(0);
}

createSampleData();