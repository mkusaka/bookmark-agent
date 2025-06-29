import { db } from '@/db';
import { entries } from '@/db/schema';
import { normalizeDomain } from '@/lib/domain-normalizer';
import { eq, isNull } from 'drizzle-orm';

async function migrateNormalizedDomain() {
  console.log('Starting normalized domain migration (simple version)...');
  
  try {
    // Migrate entries table
    console.log('Migrating entries table...');
    const nullEntries = await db
      .select()
      .from(entries)
      .where(isNull(entries.normalizedDomain));
    
    console.log(`Found ${nullEntries.length} entries to update`);
    
    for (let i = 0; i < nullEntries.length; i++) {
      const entry = nullEntries[i];
      const normalizedDomain = normalizeDomain(entry.canonicalUrl);
      
      await db
        .update(entries)
        .set({ normalizedDomain })
        .where(eq(entries.id, entry.id));
      
      if ((i + 1) % 100 === 0) {
        console.log(`Updated ${i + 1}/${nullEntries.length} entries...`);
      }
    }
    
    console.log(`Total entries updated: ${nullEntries.length}`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateNormalizedDomain();