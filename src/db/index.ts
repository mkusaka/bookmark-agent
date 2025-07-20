import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from './schema';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

// Production: Neon serverless
const getNeonDb = () => {
  const connectionString = process.env.DATABASE_URL;
  
  // During build, we need a valid connection string format even if it's a placeholder
  if (isBuild && (!connectionString || connectionString === 'postgresql://localhost/placeholder')) {
    // Return a mock database object during build
    return new Proxy({} as any, {
      get: () => () => Promise.resolve([]),
    });
  }
  
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }
  
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
};

// Development/Test: Local PostgreSQL
const getLocalDb = () => {
  const connectionString = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
  
  // During build, we need a valid connection string format even if it's a placeholder
  if (isBuild && (!connectionString || connectionString === 'postgresql://localhost/placeholder')) {
    // Return a mock database object during build
    return new Proxy({} as any, {
      get: () => () => Promise.resolve([]),
    });
  }
  
  if (!connectionString) {
    throw new Error('Database connection string is not defined');
  }
  
  const pool = new Pool({
    connectionString,
  });
  return drizzlePg(pool, { schema });
};

export const db = isProduction ? getNeonDb() : getLocalDb();

export * from './schema';