# AGENTS.md

## Cursor Cloud specific instructions

Afinia is a single-product **pnpm workspace monorepo** (TypeScript):

- `apps/web` (`afinia-web`) — Next.js 16 dashboard + tRPC API + better-auth. This is the product UI and the main thing to run locally.
- `apps/ingest` (`afinia-ingest`) — SST/AWS Lambdas (webhook + cron syncs) that pull data from the Up Banking API into Postgres. Runs on AWS; not needed to develop the web app against an existing/seeded DB.
- `packages/common` (`afinia-common`) — shared Drizzle schema + Up API client (consumed as TS source, no build step).

Standard commands live in each `package.json` (`dev`, `build`, `lint`, `typecheck`) and the root `package.json` (`web:dev`, `db:*`). Prefer those over reinventing commands.

### Environment / runtime notes

- Node 22 is what runs here; `apps/ingest` declares `engines.node >=24`, so `pnpm` prints an "Unsupported engine" **warning** for it — this is harmless for local web dev and installs/builds still succeed.
- `apps/web` reads env from `apps/web/.env.local` (gitignored). Several modules **throw at import** if their env vars are missing, so all of these must be set for the web app to boot: `DATABASE_URL`, `UP_API_KEY` (any non-empty value for UI-only work), `AUTH_SECRET`, `BASE_URL` (`http://localhost:3000`), `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`. Also set `AUTH_WHITELIST` (the single email allowed to sign in) and `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (may be dummy unless doing real Google login). Generate VAPID keys with `web-push`'s `generateVAPIDKeys()`.

### Database (required, not auto-provisioned)

- Both web and ingest need Postgres via `DATABASE_URL`. There is **no** Docker/compose here; install a local Postgres (e.g. `postgresql`) yourself if it isn't present, create a DB, and point `DATABASE_URL` at it (e.g. `postgresql://postgres:postgres@localhost:5432/afinia`).
- Migrations/seed scripts (`db:generate/migrate/seed`) are wired through **SST** (`sst shell`), which needs AWS credentials. To set up the schema **locally without AWS**, use `apps/ingest/drizzle.local.config.ts` (reads `DATABASE_URL` from the env) with drizzle-kit directly:
  ```bash
  cd apps/ingest
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/afinia \
    pnpm exec drizzle-kit push --config=drizzle.local.config.ts --force
  ```
  App tables live in the `afinia` Postgres schema; better-auth tables live in `public`. Tables have RLS enabled but no policies — connecting as a superuser/owner (e.g. `postgres`) bypasses RLS, which is what the app relies on locally.

### Auth: logging in locally

- The only login provider configured is **Google OAuth**, gated by an email whitelist (`AUTH_WHITELIST`), so normal login can't be completed headlessly. To reach the OAuth-gated `/app` routes locally, mint a session directly with `apps/web/dev-create-session.ts` — it inserts a whitelisted user + `session` row and prints a validly-signed `better-auth.session_token` cookie. Set that cookie in the browser (DevTools → Application → Cookies) or send it as a `Cookie:` header with curl. The session cookie is httpOnly.

### Known caveat: writes hit the real Up Banking API

- Editing a transaction's category (tRPC `transaction.reassignCategory`) first `PATCH`es the real Up Banking API and only then updates the DB. With a placeholder `UP_API_KEY` this write **fails** — a genuine `UP_API_KEY` is required to exercise write flows. Read/insights flows (dashboard, spending, accounts, transaction detail) work fine against a seeded DB.
