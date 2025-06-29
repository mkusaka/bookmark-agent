import { db } from '@/db';
import { entries } from '@/db/schema';
import { normalizeDomain } from '@/lib/domain-normalizer';
import { sql, eq } from 'drizzle-orm';

async function fixProtocolDomains() {
  console.log('Fixing entries with protocol in normalizedDomain...');
  
  try {
    // Get all entries with protocol in normalizedDomain
    const protocolEntries = await db
      .select()
      .from(entries)
      .where(sql`${entries.normalizedDomain} LIKE 'http://%' OR ${entries.normalizedDomain} LIKE 'https://%'`);
    
    console.log(`Found ${protocolEntries.length} entries with protocol in normalizedDomain`);
    
    if (protocolEntries.length === 0) {
      console.log('No entries need fixing!');
      process.exit(0);
    }
    
    // Show sample before fixing
    console.log('\nSample entries to be fixed:');
    protocolEntries.slice(0, 5).forEach(entry => {
      console.log(`- ID: ${entry.id}`);
      console.log(`  Current: ${entry.normalizedDomain}`);
      console.log(`  Will be: ${normalizeDomain(entry.canonicalUrl)}`);
    });
    
    // Fix each entry
    console.log('\nFixing entries...');
    let fixed = 0;
    
    for (const entry of protocolEntries) {
      const newNormalizedDomain = normalizeDomain(entry.canonicalUrl);
      
      await db
        .update(entries)
        .set({ normalizedDomain: newNormalizedDomain })
        .where(eq(entries.id, entry.id));
      
      fixed++;
      if (fixed % 100 === 0) {
        console.log(`Fixed ${fixed}/${protocolEntries.length} entries...`);
      }
    }
    
    console.log(`\nTotal entries fixed: ${fixed}`);
    
    // Verify the fix
    const remainingProtocolEntries = await db
      .select({ count: sql<number>`count(*)` })
      .from(entries)
      .where(sql`${entries.normalizedDomain} LIKE 'http://%' OR ${entries.normalizedDomain} LIKE 'https://%'`);
    
    console.log(`Remaining entries with protocol: ${remainingProtocolEntries[0].count}`);
    
    if (remainingProtocolEntries[0].count > 0) {
      console.warn('Warning: Some entries still have protocol in normalizedDomain!');
    } else {
      console.log('Success: All entries have been fixed!');
    }
    
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

fixProtocolDomains();