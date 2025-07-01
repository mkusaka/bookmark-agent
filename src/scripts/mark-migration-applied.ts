import { db } from '@/db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

async function markMigrationApplied() {
  const migrationFile = '0005_square_junta.sql';
  const migrationPath = path.join(process.cwd(), 'drizzle', migrationFile);
  
  try {
    // Read the migration file and compute hash
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    const hash = crypto.createHash('sha256').update(migrationContent).digest('hex');
    
    console.log(`Marking migration ${migrationFile} as applied...`);
    console.log(`Migration hash: ${hash}`);
    
    // Insert into __drizzle_migrations
    await db.execute(sql`
      INSERT INTO __drizzle_migrations (id, hash, created_at)
      VALUES (5, ${hash}, ${Date.now()})
    `);
    
    console.log('✅ Migration marked as applied successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

markMigrationApplied();