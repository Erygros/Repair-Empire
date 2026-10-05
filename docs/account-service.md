# Account service: Prompt 11.3

## Cause and architecture

The old auth route returned 503 whenever DATABASE_URL was missing. The client translated every 503 into "Account-Service ist noch nicht konfiguriert." There was no local .env configuration at the start of this repair. A configured database alone would not have fixed everything: the Drizzle adapter also lacked the explicit mapping from users/sessions/accounts/verifications to Better Auth model names. Transactions were not enabled, confirmation fields were validated only by the client, and development previews bypassed account protection.

The existing architecture is retained: Better Auth 1.7.7 with its username plugin and native Node scrypt password hashing; PostgreSQL; Drizzle ORM with postgres.js. There is one user table, one credential table and one session system. Username and email are normalized on the server; expression indexes independently enforce case-insensitive uniqueness. Confirmation fields are never persisted. The CEO name stays separate from username and is passed to the existing character creator.

## Local operation

Changed files:

- src/lib/account-config.ts, src/lib/account-validation.ts, src/lib/auth.ts, src/lib/session.ts
- src/db/index.ts, src/db/schema.ts
- src/app/api/auth/[...all]/route.ts, src/app/api/account/status/route.ts, src/app/api/character/route.ts
- src/app/play/page.tsx, src/app/create-character/page.tsx
- src/components/auth-form.tsx, src/components/logout-button.tsx, src/components/character-creator-3d.tsx
- drizzle.config.ts, drizzle/0001_sloppy_magdalene.sql, drizzle/meta/0001_snapshot.json, drizzle/meta/_journal.json
- scripts/local-db.mjs, tests/auth.integration.mjs, tests/run-auth-production.mjs
- .env.example, .gitignore, package.json, package-lock.json, README.md, docs/account-service.md

In a terminal, run:

```powershell
npm install
npm run db:local
```

Keep that process running. In another terminal:

```powershell
npm run db:migrate
npm run dev
```

The local helper starts a real PostgreSQL 18 cluster on 127.0.0.1:55432, generates independent random credentials and an auth secret, and writes .env.local only if it does not exist. It refuses to overwrite a configuration for another database and refuses to run in production/Vercel. Data and credentials remain in the ignored .local directory; it does not connect to or alter a production database. Stop the database helper with Ctrl+C. A later run preserves the database.

Local configuration has been exercised successfully for all three required variables. The website is available at http://localhost:3000. Do not copy the local URL or database credentials into Vercel.

## Production configuration

No Vercel project settings or production secrets were accessible or changed during this repair. Their current presence cannot be confirmed from this checkout.

Keep an existing PostgreSQL provider if there is one. If none exists, use managed PostgreSQL such as [Neon](https://neon.com/docs/get-started/connect-neon); its [pooled connection strings](https://neon.com/docs/connect/connection-pooling) support serverless workloads. No provider account or production database has been provisioned by this task.

In **Vercel Dashboard > your Repair-Empire project > Settings > Environment Variables**, set these server-only values for Production:

| Variable | Required value |
| --- | --- |
| DATABASE_URL | The actual provider connection URI, e.g. postgresql://USER:PASSWORD@POOLED_HOST:5432/DATABASE?sslmode=require. Use pooling and provider SSL settings. Never use the local loopback URL. |
| BETTER_AUTH_SECRET | At least 32 cryptographically random characters, independent from local credentials. Generate 48 random bytes with the command in .env.example. Never use the placeholder. |
| BETTER_AUTH_URL | The exact public HTTPS origin serving the website, e.g. https://YOUR-PROJECT.vercel.app or https://YOUR-CUSTOM-DOMAIN.example. No /api/auth suffix, path, query or hash. |

Use distinct database/secret values for Preview and Development when those environments are needed; each deployment's origin must match its BETTER_AUTH_URL. A custom-domain deployment must use its chosen canonical origin. Do not add NEXT_PUBLIC_ variants of any secret or database variable.

Apply migrations to the intended production database from a trusted local terminal or CI job that has its DATABASE_URL configured securely:

```powershell
npm run db:migrate
```

This migration command loads the normal Next environment files, so confirm the target first. Running it with the generated local .env.local migrates only the local database, not Vercel. Do not use schema resets or drizzle-kit push against production.

Then **Vercel > Deployments > latest deployment > Redeploy**. Saving environment variables does not update an already deployed function. There is no automatic production migration in the build; run migrations explicitly for a new database before exercising accounts. Fixed Founder models also support the existing pre-0003 database: identity is stored in appearance JSON, and legacy presentation resolves to Nathan or Sophia. Builds no longer require the new model-ID column, so Supabase setup can wait until launch.

## Migrations

- 0000_spooky_red_wolf.sql: original user, account, session, verification, character and company tables.
- 0001_sloppy_magdalene.sql: shared rate_limit table and case-insensitive username/email unique indexes.
- Both migrations were applied successfully to the new local database and are recorded by Drizzle. Neither was run against production.
- The second migration is additive, with no dropped tables, reset or deleted users. If an older production database contains differently cased duplicate users created with spoofed normalization fields, the new unique index intentionally fails instead of silently deleting data. Check and resolve such records explicitly before retrying.

Preflight queries for an existing production database:

```sql
SELECT lower(trim(username)), count(*) FROM "user"
GROUP BY lower(trim(username)) HAVING count(*) > 1;
SELECT lower(trim(email)), count(*) FROM "user"
GROUP BY lower(trim(email)) HAVING count(*) > 1;
```

## Security and verification

- Better Auth signup uses an actual adapter transaction for user, credential and session creation. A forced credential-insert failure was tested and rolls everything back.
- Native Node scrypt creates and verifies hashes. Passwords and confirmations never enter user records or client session outputs.
- Sessions expire after seven days, refresh after one day, and are revoked on logout. Production cookies are Secure, HttpOnly and SameSite=Lax.
- /play, /create-character and /account always require an active account session, including development. The character API also requires an authenticated, same-origin request; fake development character IDs were removed.
- Better Auth CSRF protection remains enabled. The auth route additionally rejects foreign POST origins before processing signup/login.
- Shared database-backed rate limits: signup 5 attempts per 300 seconds; username/email login 8 per 60 seconds; general auth 30 per 60 seconds. Atomic counter updates prevent multi-instance memory-only bypasses.
- Character and company creation remains transactional; duplicate character creation returns 409, while database outages return safe 503 errors.
- No DATABASE_URL or BETTER_AUTH_SECRET was found in 23 production client files. .env.local and .local are ignored by Git.

Run the integration suite with the local database and dev server running:

```powershell
npm run test:auth
npm run typecheck
npm run lint
npm run build
npm run test:auth:production
```

The production runner launches and stops its own servers on ports 3001-3003, using only the guarded local database. Tests refuse remote or Vercel database targets, use isolated test users, clean up their user records, and never print password hashes or cookies.

Results on 2026-10-02: 27/27 tests passed in development and production mode. Coverage includes valid registration, all required invalid inputs, both case-insensitive duplicate types, concurrent duplicates, database unique-index enforcement, rollback, login, wrong password, unknown user, logout, creator prefill, character/company persistence, redirect decisions, expired/tampered sessions, CSRF, and both rate limits. Production configuration missing and connection unavailable cases also pass with explicit safe 503 responses and protected routes closed.

Browser verification additionally completed the actual form registration > prefilled creator > existing skill selection > character creation > /play > account > logout > case-insensitive login > /play workflow. TypeScript, lint and production build passed without warnings or errors.

Remaining external work: provision/identify the production PostgreSQL database, configure or verify the three Vercel variables, apply migrations there, redeploy and run the same account smoke test on the live origin. Email delivery for verification/password reset is not configured and was not added by this account/login repair. npm audit reports four pre-existing moderate advisories in Drizzle Kit's development tooling dependency chain; no broad dependency downgrade was applied.
