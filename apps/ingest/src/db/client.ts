import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Resource } from 'sst';

if (!Resource.DATABASE_URL.value) {
  throw new Error('Please provide database URL');
}

const connectionString = Resource.DATABASE_URL.value;

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
