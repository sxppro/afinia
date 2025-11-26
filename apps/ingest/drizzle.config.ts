import { defineConfig } from 'drizzle-kit';
import { Resource } from 'sst';

if (!Resource.DATABASE_URL.value) {
  throw new Error(
    'Please provide database URL. Set it in .env and run load-env'
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: [
    '../../packages/common/db/schema/afinia.ts',
    '../../packages/common/db/schema/auth.ts',
  ],
  out: './drizzle',
  dbCredentials: {
    url: Resource.DATABASE_URL.value,
  },
});
