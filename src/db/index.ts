import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from './schema';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Production: Neon serverless
const getNeonDb = () => {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
};

// Development/Test: Local PostgreSQL
const getLocalDb = () => {
  const connectionString = isTest ? process.env.LOCAL_DATABASE_URL : process.env.LOCAL_DATABASE_URL;
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