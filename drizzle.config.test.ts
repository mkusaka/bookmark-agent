import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.LOCAL_DATABASE_URL!,
  },
  migrations: {
    table: '__drizzle_migrations',
    schema: 'public',
  },
  breakpoints: true,
  verbose: true,
  strict: true,
});