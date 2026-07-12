/**
 * Local development Drizzle config (NOT used in deploy).
 *
 * The default `drizzle.config.ts` reads the database URL from SST
 * (`Resource.DATABASE_URL`), which requires AWS credentials. This variant reads
 * `DATABASE_URL` from the environment so schema can be applied to a local
 * Postgres without SST, e.g.:
 *   DATABASE_URL=postgres://... drizzle-kit push --config=drizzle.local.config.ts
 */
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('Please provide DATABASE_URL');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: [
    '../../packages/common/db/schema/afinia.ts',
    '../../packages/common/db/schema/auth.ts',
  ],
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
