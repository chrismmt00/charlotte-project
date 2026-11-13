# Klyvora operations runbook

## Environments and setup

Use the existing `.env.local` and `.env.production`. Do not create `.env`. Both are ignored by Git and Vercel uploads. `.env.example` documents variable names only. `scripts/env.mjs` loads one environment explicitly and refuses a remote database for local commands. Real credentials must never appear in source, reports, screenshots or shell arguments.

The local PostgreSQL database is `klyvora`. Neon is production. Runtime uses `DATABASE_URL` (pooled on Neon), migrations use `DIRECT_URL` (the unpooled hostname). Prisma 7 uses `prisma.config.mjs` and `@prisma/adapter-pg`; generated client files are not committed.

```sh
npm install
npm run db:create
npm run db:migrate -- --name describe_change
npm run db:seed
npm run dev
```

Seeds insert missing catalog entries and admin accounts without changing existing prices, roles or business records. `OWNER_EMAIL` and `ADMIN_EMAILS` configure initial team access; the owner manages subsequent accounts in Settings. Database sessions recheck active accounts/roles on every request. Removing a member invalidates their sessions.

## Checks

```sh
npm run lint
npm run db:validate
npm run build:local
npm run test:backend -- --browser
node scripts/verify-services.mjs
```

The integration suite launches its own server on localhost:3438, uses isolated local records, disables automatic provider jobs and cleans up its fixtures. It tests real database sessions, magic-link callback/replay, authorization, client isolation, forms, concurrent acceptance, billing amounts, webhook signatures/replay and browser rendering. It refuses a remote database. The browser test uses installed Microsoft Edge. Do not run the fixture suite against production.

`verify-services.mjs --production` performs only read-only Stripe, SMTP and Cloudflare checks and prints no credentials or email content. SMTP verification sends no email.

## Production and Vercel

The project is `klyvora`, linked locally through ignored `.vercel/project.json`. Production uses Node.js 24. Vercel encrypted variables come from the existing production file through `node scripts/setup-vercel.mjs`; values are not printed. That script uses the already authenticated Vercel CLI credential on Windows and verifies the linked project name before writing.

```sh
npm run db:deploy
npm run db:seed:production
npm run build
npx vercel --prod --yes
```

The Vercel build runs `prisma migrate deploy` before the application build. Never use `migrate reset` or `db push --accept-data-loss` in production. Review and commit migrations; never edit a committed migration. A preview environment must have its own Neon branch and preview-scoped database/provider variables before enabling preview migrations. Production credentials are not copied into previews.

`GET /api/health` must return `{status:"ok",service:"klyvora",backend:true}` after deployment. Check `/api/offers` and unauthenticated `/api/admin/metrics` (401). Do not create live payments or customer records as a production smoke test.

The user connected `chrismmt00/charlotte-project` in Vercel, with `master` as the production branch. Pushes to master trigger production deployments. CLI deployment is also available.

The user connected the GoDaddy domain during setup; Vercel verified its DNS configuration. Vercel recommends A records for `@` of `216.150.1.1` and `216.150.16.1`, and `www` CNAME `c70b7996473962a2.vercel-dns-016.com`. Confirm current recommendations in Vercel before changing DNS. Preserve MX, SPF, DKIM and DMARC records for email. Domain TLS and canonical-domain magic links require DNS cutover and propagation.

## Stripe and email

Klyvora invoices/subscriptions use Klyvora's Stripe account. Client business payments/refunds use that client's connected account with zero application fee. Never send a Klyvora milestone invoice through a client's connected account.

Local webhook setup:

```sh
node scripts/stripe-listen.mjs --configure
node scripts/stripe-listen.mjs
```

This requires a test-mode key and saves the CLI signing secret in the existing local file without displaying it. After production health is verified, register billing and Connect webhook destinations:

```sh
node scripts/setup-stripe-webhooks.mjs https://YOUR-VERIFIED-PRODUCTION-HOST
node scripts/setup-vercel.mjs
npx vercel --prod --yes
```

The setup script saves returned signing secrets to the existing production file, then encrypted Vercel variables must be refreshed and a new deployment created. Billing and Connect signatures are verified separately. Event IDs are persisted transactionally. Invoice/subscription objects are reread from Stripe to avoid delayed events rolling status backwards. No card details are stored.

SMTP credentials already supplied by the user are supported; `BREVO_API_KEY` is optional. Provider wrappers are server-only. Lead/proposal/support notifications use the durable queue; magic-link delivery is immediate. The queue stores delivery state without leaking provider credentials in error messages. Mail delivery is at least once across a process crash, so rare duplicate notifications are possible.

## Jobs and financial recovery

Acceptance locks the proposal and atomically creates the client, contact, project, three milestones, kickoff invoice and queued provider work. Milestones require previous invoices paid; monthly billing is queued only at accepted launch. Provider idempotency keys and unique milestone invoice/project constraints prevent routine duplicate billing. Monetary amounts are cents; the final milestone receives the rounding remainder.

A small job batch runs with Next.js `after()` following successful mutations. Daily cron at 13:00 UTC provides a no-cost fallback; a busy operation should use a more frequent external scheduler or plan-supported cron. Authenticate worker requests with `Authorization: Bearer CRON_SECRET`. `npm run jobs` runs against the local app; `node scripts/env.mjs --env production scripts/jobs.mjs` runs against the configured production URL. Never execute the worker on integration-test fixtures.

Inspect `Job` rows for `pending`/`failed`, attempts and the non-sensitive error summary. Fix provider configuration, then reset only the affected failed row to `pending`, `attempts:0`, `runAt:now`. Do not delete financial records to retry a job. Stripe is authoritative for paid invoices. Use Stripe's dashboard for partial payments/refunds; webhook replay can reconcile database state. Signed proposals keep frozen amounts even after catalog edits.

## Files and exports

Public business photos use the configured Cloudflare Images account. Private project files require `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET`; the bucket must not be public. Private uploads are explicitly disabled by the owner for now (`PRIVATE_UPLOADS_ENABLED=false`); clients are directed to email the owner. Enabling them later requires credentials and `PRIVATE_UPLOADS_ENABLED=true`. Missing configuration fails explicitly. Downloads require a client-scoped session and expire after five minutes. Proxy uploads are subject to the hosting platform's request size limits; use direct signed uploads for files beyond those limits.

Business records can be downloaded immediately as authenticated JSON/CSV. Source download uses an attached client-owned handover repository; the app does not invent a ZIP or send a fake GitHub invitation. Attach the repository during delivery. Client website checkout engines and an automated prospecting agent are separate integrations; no simulated payment/prospecting run is reported as real.

## Backup, restoration and rotation

Before a significant migration, create a Neon branch/restore point or take a `pg_dump` custom-format backup over the direct connection. Supply PostgreSQL connection settings through environment variables or a protected password file, not a URL in shell history. Store dumps encrypted outside the repository. Neon retention depends on the account's configured plan; verify it in the Neon console.

Restore into a separate Neon branch/database first with `pg_restore`, run schema/health checks, and verify record counts and the three financial metrics. Point a preview environment at the restored branch and test access/billing with test credentials. A production cutover requires a defined write pause and reconciliation of Stripe events since the backup. Never overwrite the live database as a restore test.

Rotate database/provider credentials at their providers, update the existing environment files and encrypted Vercel variables, redeploy and verify health. Rotate webhook signing secrets with overlap when the provider supports it. Changing `AUTH_SECRET` invalidates verification links; revoke sessions explicitly if responding to an account compromise. Rotate credentials that have been exposed outside their intended secret storage.
