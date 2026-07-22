/**
 * Local development auth helper - not for deployed environments
 *
 * Afinia only configures a Google OAuth provider for login, which cannot be
 * completed in a local/headless dev environment. This script creates a user
 * (matching AUTH_WHITELIST) and a better-auth session directly in the database,
 * then prints a validly-signed `better-auth.session_token` cookie so you can
 * access the OAuth-gated `/app` routes locally.
 *
 * Usage (from apps/web, with apps/web/.env.local populated):
 *   set -a; . ./.env.local; set +a
 *   node <path-to>/tsx/dist/cli.mjs scripts/dev-create-session.ts
 */
import { authSchema } from 'afinia-common/schema';
import { randomBytes } from 'crypto';
import { auth } from '../lib/auth/config';
import { db } from '../lib/db/client';

async function makeSignature(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function main() {
  const email = process.env.AUTH_WHITELIST!;
  const secret = process.env.AUTH_SECRET!;
  const userId = 'dev-user-1';
  const token = randomBytes(24).toString('hex');

  await db
    .insert(authSchema.user)
    .values({
      id: userId,
      name: 'Dev User',
      email,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  await db.insert(authSchema.session).values({
    id: 'sess-' + token.slice(0, 12),
    token,
    userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const signed = await makeSignature(token, secret);
  const cookieValue = encodeURIComponent(`${token}.${signed}`);
  const cookieHeader = `better-auth.session_token=${cookieValue}`;

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });

  console.log('VERIFY_SESSION_USER=' + (session?.user?.email ?? 'NULL'));
  console.log('COOKIE_NAME=better-auth.session_token');
  console.log('COOKIE_VALUE=' + cookieValue);
  process.exit(session ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
