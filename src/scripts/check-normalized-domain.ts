import { db } from '@/db';
import { entries } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function checkNormalizedDomain() {
  try {
    // Check entries with null normalized_domain
    const nullEntries = await db
      .select({ count: sql<number>`count(*)` })
      .from(entries)
      .where(sql`${entries.normalizedDomain} IS NULL`);
    
    console.log(`Entries with NULL normalized_domain: ${nullEntries[0].count}`);
    
    // Show sample of entries with NULL normalized_domain
    const sampleNullEntries = await db
      .select()
      .from(entries)
      .where(sql`${entries.normalizedDomain} IS NULL`)
      .limit(5);
    
    console.log('\nSample entries with NULL normalized_domain:');
    sampleNullEntries.forEach(entry => {
      console.log(`- ${entry.rootUrl} (id: ${entry.id})`);
    });
    
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkNormalizedDomain();