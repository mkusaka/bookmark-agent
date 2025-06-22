import { config } from 'dotenv';
import { beforeAll, afterAll, vi } from 'vitest';

// Load test environment variables before importing db
config({ path: '.env.test' });

// Ensure NODE_ENV is test (for TypeScript)

// Now import db after environment is set up
const { db } = await import('@/db');
const { users, entries, bookmarks, tags, bookmarkTags } = await import('@/db/schema');

// Setup and teardown for tests
beforeAll(async () => {
  console.log('Setting up test database...');
});

afterAll(async () => {
  console.log('Cleaning up test database...');
  // Clean up test data in reverse order of dependencies
  await db.delete(bookmarkTags);
  await db.delete(bookmarks);
  await db.delete(tags);
  await db.delete(entries);
  await db.delete(users);
});