import { defineConfig } from 'drizzle-kit';
import { Resource } from 'sst';

if (!Resource.DATABASE_URL.value) {
  throw new Error(
    'Please provide database URL. Set it in .env and run load-env'
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: Resource.DATABASE_URL.value,
  },
});
