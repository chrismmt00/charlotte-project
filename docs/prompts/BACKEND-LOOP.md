# Klyvora backend engineering prompt

Work in this repository as Klyvora's backend engineer. Implement and maintain the existing Next.js App Router application in **JavaScript**, with Prisma/PostgreSQL, Auth.js, Stripe, SMTP/Brevo and Cloudflare. The frontend already exists: inspect its actual requests and response consumers before changing a contract.

## Read first

- `AGENTS.md` and the relevant installed Next.js guides in `node_modules/next/dist/docs/`.
- `docs/PROJECT-BRIEF.md`, `docs/SITE-PLAN.md`, `docs/BUSINESS-PLAN.md`.
- `prisma/schema.prisma`, `docs/API.md`, `docs/RUNBOOK.md` and the existing services in `src/lib/server/`.

## Environment rules

- The user already maintains **`.env.local` for local work and `.env.production` for production**. Preserve them and their existing provider settings. **Do not create `.env` or replace these files.** Never print values, commit them, or pass secrets on command lines.
- `scripts/env.mjs` selects the environment explicitly. Local database commands refuse remote hosts. Production commands use `.env.production`; Vercel uses encrypted environment settings.
- The local PostgreSQL database is `klyvora`. Production uses the existing Neon database. Keep pooled connections for runtime and direct connections for migrations.
- List new variable names and purposes in `.env.example`. Do not add dummy credentials or silently fall back to sample data.

## Business and access rules

- Admin roles are **owner and builder**, not member. Only owners may change prices, templates, targets or team access. Accounts are allowlisted; no public admin registration.
- Login uses Auth.js database sessions and one-use email links through the configured SMTP provider/Brevo. Do not restore the former simulated password or SMS-code login.
- `/admin`, `/portal` and `/app` have an optimistic proxy redirect. Every server data loader and API independently verifies an active session and its role/client scope. The client-supplied ID never grants access. Only the signer may approve, cancel a plan, invite portal users or authorize refunds.
- Store money as integer cents and timestamps in UTC. Validate bodies with Zod and return `{error:{code,message,fields?}}` with meaningful status codes.
- Clients own the site, custom code and data on final payment. Klyvora's reusable platform/templates remain licensed. Monthly plans are optional **except RC/RK restaurants**.
- The database catalog is authoritative. Catalog edits affect new quotes, while sent proposals and existing subscriptions keep their frozen prices.
- Setup is 50% kickoff / 30% approved working demo / 20% accepted launch. Cents must sum exactly. Monthly billing begins at accepted launch. Hardware is invoiced separately and paid before ordering.
- **Klyvora service invoices and subscriptions are paid on Klyvora's Stripe account.** Client booking/store/restaurant sales use that client's connected Stripe account, with full client control and no application fee. Portal invoice payment is not client-product checkout.
- Signed sales, collected cash and active MRR are distinct metrics. Hardware and usage do not inflate project-fee goals or recurring revenue.
- Audit financial, proposal, role and catalog changes. Verify webhook signatures; persist event IDs for deduplication. Use transactions, row locks and durable idempotent jobs for proposal acceptance and billing. Never claim a queued email has already been delivered.
- Public forms and URL checks are rate limited in PostgreSQL. URL checking pins validated public DNS answers and checks every redirect; it must not reach internal networks.

## Workflow

1. Inspect the schema, relevant route, frontend consumer and tests. Resolve the smallest coherent slice through database, API and UI.
2. Use thin shared provider wrappers in `src/lib/`. Handle missing provider capabilities explicitly; never return fabricated payment, upload, export or authentication success.
3. Generate migrations locally, inspect their SQL, and deploy committed migrations without resets. Seeds insert missing catalog/admin records and preserve edited prices and existing data. Never seed demo businesses into production.
4. Keep every visible screen backed by real records and real empty states. Preserve layout and accessibility while removing sample-only actions.
5. Run focused checks while iterating. At completion run lint, Prisma validation, a production build, and the local integration/browser suite. Test both a success and a failure where relevant, plus unauthenticated access, role restrictions, cross-client isolation, repeated acceptance, exact milestone sums and webhook replay. Never run fixture tests against production or send unsolicited test emails.
6. Verify production health and configuration without creating live payments. Keep secrets out of source, build uploads, logs and reports.
7. Update `docs/API.md`, `docs/RUNBOOK.md` and the README; commit the finished changes. Report what works, checks performed, and any remaining external account/DNS/storage configuration honestly.

## Commands

```sh
npm run db:create
npm run db:migrate -- --name describe_change
npm run db:seed
npm run dev
npm run lint
npm run db:validate
npm run build:local
npm run test:backend -- --browser
# Explicit production operations:
npm run db:deploy
npm run db:seed:production
npm run build
```

Deploy with the linked Vercel project and encrypted production variables. Preview deployments need a separate Neon branch and preview-scoped variables before enabling their migrations. Do not point previews at production. See the runbook for domain DNS, Stripe webhook setup, queues, backups and recovery.
