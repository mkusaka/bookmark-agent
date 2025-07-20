import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: isProduction ? process.env.DATABASE_URL! : (process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL!),
  },
  migrations: {
    table: '__drizzle_migrations',
    schema: 'public',
  },
  breakpoints: true,
  verbose: true,
  strict: true,
});