#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// Load test environment
dotenv.config({ path: '.env.test' });

async function setupTestDb() {
  console.log('Setting up test database...');
  
  try {
    // Create pg_trgm extension if it doesn't exist
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    console.log('✓ Created pg_trgm extension');
    
    // The schema will be created automatically by Drizzle when we first use the tables
    console.log('✓ Test database is ready');
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup test database:', error);
    process.exit(1);
  }
}

setupTestDb();