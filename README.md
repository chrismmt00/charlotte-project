# Klyvora

Klyvora's company site and the internal app that runs the business: public marketing site, lead/CRM pipeline, proposals, milestone invoicing, client portal, project tracking and support.

Planning context and decisions live in [docs/PROJECT-BRIEF.md](docs/PROJECT-BRIEF.md).

## Current status

The marketing site, internal admin, client portal, client business dashboard and public proposal screens are implemented. Most API routes return sample data or simulate actions; authentication, database persistence, Stripe billing and Brevo email delivery are still planned. Forms and sign-in screens do not yet complete real business transactions. This is a frontend preview, with backend work tracked in [docs/prompts/BACKEND-LOOP.md](docs/prompts/BACKEND-LOOP.md).

## Stack

- Next.js 16 (App Router), React 19, JavaScript (not TypeScript), Tailwind CSS 4
- Planned: PostgreSQL on Neon + Prisma, Auth.js, Vercel, Cloudflare Images/Stream, Brevo, Stripe

Pages and features: [docs/SITE-PLAN.md](docs/SITE-PLAN.md). Design tokens: [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md). Build prompts: [docs/prompts/](docs/prompts/) (design, front end, back end loops).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
