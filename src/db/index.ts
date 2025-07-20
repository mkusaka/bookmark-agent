import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from './schema';

type DbType = ReturnType<typeof drizzle<typeof schema>>;

const isProduction = process.env.NODE_ENV === 'production';

// Production: Neon serverless
const getNeonDb = (): DbType => {
  const connectionString = process.env.DATABASE_URL || 'postgresql://user:pass@host:5432/db';
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
};

// Development/Test: Local PostgreSQL
const getLocalDb = (): DbType => {
  const connectionString = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/db';
  const pool = new Pool({
    connectionString,
  });
  return drizzlePg(pool, { schema });
};

export const db = isProduction ? getNeonDb() : getLocalDb();

export * from './schema';