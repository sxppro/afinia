import { authSchema } from 'afinia-common/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/client';
import { siteConfig } from '../siteConfig';

export const auth = betterAuth({
  appName: siteConfig.name,
  baseURL: process.env.AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.email !== process.env.AUTH_WHITELIST) {
            return false;
          }
        },
      },
    },
  },
  secret: process.env.AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  trustedOrigins: [process.env.AUTH_URL || '', 'http://localhost:3000'],
});
