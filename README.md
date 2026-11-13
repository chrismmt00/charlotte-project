# Klyvora

Klyvora's company site and the internal app that runs the business: public marketing site, lead/CRM pipeline, proposals, milestone invoicing, client portal, project tracking and support.

Planning context and decisions live in [docs/PROJECT-BRIEF.md](docs/PROJECT-BRIEF.md).

## Current status

The marketing site, internal admin, client portal, client business dashboard and proposals use PostgreSQL-backed services. Auth.js provides allowlisted email login and database sessions. Leads, proposals, milestone billing, support, settings and client records persist; Stripe and email work through server-only wrappers and durable jobs. See [docs/API.md](docs/API.md) for contracts and [docs/RUNBOOK.md](docs/RUNBOOK.md) for deployment, checks and remaining external configuration.

## Stack

- Next.js 16 (App Router), React 19, JavaScript (not TypeScript), Tailwind CSS 4
- PostgreSQL on Neon + Prisma 7, Auth.js, Vercel, Cloudflare Images/private R2, SMTP/Brevo, Stripe

Pages and features: [docs/SITE-PLAN.md](docs/SITE-PLAN.md). Design tokens: [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md). Build prompts: [docs/prompts/](docs/prompts/) (design, front end, back end loops).

## Getting started

```bash
npm install
npm run db:create
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Use the existing `.env.local` for development and `.env.production` for production. Variable names are documented in `.env.example`; no credentials belong in Git. Run `npm run build:local` then `npm run test:backend -- --browser` for local integration and browser checks. Production builds use `npm run build`.
