# Klyvora web app plan

Drafted Nov 5, 2026. One Next.js project: the public site that sells Klyvora, the admin that runs the business, and a client portal. Pricing and offers come from `docs/PROJECT-BRIEF.md`; this file plans the pages and features.

**Stack (decided Nov 5):** Next.js 16 App Router, React 19, JavaScript, Tailwind CSS 4, PostgreSQL on **Neon** + Prisma, **Vercel** (hosting), **Auth.js** (admin and portal login), Brevo (email), Stripe (Klyvora's billing; clients own their own Stripe accounts), Cloudflare Images/R2/Stream (media). Design system: `docs/DESIGN-SYSTEM.md`, tokens in `src/app/globals.css`, components in `src/components/ui`.

## Build order
Marketing comes first so outreach can start. Everything else lands behind it.

| Phase | Ships | Why first |
|---|---|---|
| 1. Marketing site | Home, Services (+ one page per offer), Pricing, Work, About, Contact/quote form, legal pages, lead capture into the database, Brevo notifications | Lets outreach link to something real this week |
| 2. Admin core | Login, lead inbox, CRM pipeline, proposals, contract e-sign, Stripe milestone invoices | Turns conversations into signed and paid work |
| 3. Client portal | Project status, approvals, invoices, files, support | Fewer status texts; a professional front for 50/30/20 billing |
| 4. Admin growth | Project boards, support tickets, subscriptions, reports, blog/case-study CMS | Scales delivery once there are 10+ clients |

Public offers that themselves need software (booking, ecommerce, restaurant platform) are separate products built per client. This repo is the company site + ops app only.

## Public site

### Pages
| Route | Purpose | Key content |
|---|---|---|
| `/` | Convert a cold visitor into a quote request | Hero (what Klyvora builds, who for), four offer cards, "how it works" (call → proposal → 50/30/20 → launch → care), proof (case studies, before/after of dead sites), founding-customer program, FAQ, final CTA |
| `/services` | Overview of all offers | Grid of offers grouped: Websites, Booking, Ecommerce, Restaurants, AI & custom |
| `/services/websites` | W1 and W2 | Scope caps (pages, design rounds), what's included monthly, examples |
| `/services/booking` | WB and BK | Who it's for, booking demo (embedded live demo), "add booking later" rule |
| `/services/ecommerce` | EC | Store demo, "you own your Stripe, we take no cut" |
| `/services/restaurants` | RC, RK and add-ons | Platform tour, add-on module table, kiosk hardware note, pilot program |
| `/services/ai` | AI automation, custom AI harness | Plain-language examples (missed-call text-back, review requests, intake agents), usage billing explained |
| `/services/custom` | Custom web application | Starter scope, fixed-quote process, "you own custom code" |
| `/pricing` | Full price table | Setup + monthly for every code, add-on table, what's billed separately, milestone schedule, founding prices, FAQ on ownership |
| `/work` and `/work/[slug]` | Case studies | Problem → build → result, screenshots, owner quote, offer used |
| `/about` | Trust | Charlotte-based team of three, mission, "we write our own code", the ownership promise |
| `/contact` | Quote request | Short form (name, business, phone/email, what they need, current site URL), Calendly-style call booking, phone number |
| `/quote` | Guided estimator (optional in phase 1) | Pick offer → add-ons → shows setup/monthly → submits as a lead with the chosen package |
| `/founding` | Founding-customer program | Slots, eligibility, what they give back (case study, referrals), apply form |
| `/blog`, `/blog/[slug]` | SEO and local authority (phase 4) | "Does your Charlotte business need a website?", restaurant ordering fees, etc. |
| `/privacy`, `/terms` | Legal | Needed for Stripe, Brevo and ads |
| `/portal/*` | Client portal (see below) | |

### Features people will like
- **Instant price transparency.** Every offer shows setup + monthly on the page, not "contact us". That's the pitch against agencies.
- **Live demos**, not screenshots: a demo booking flow, a demo store, a demo restaurant menu/order, a demo AI text-back you can trigger with your own phone. These double as sales tools in person.
- **"Check my site" tool:** paste a URL, get a plain-English report (is it dead, redirecting to spam, slow, not mobile-friendly, no booking). The 40 dead-site leads in the workbook are exactly this audience. Captures the lead with their URL.
- **Quote estimator** that ends in a lead, with the estimate emailed to them via Brevo.
- **Book a call** directly on the site (Cal.com or Calendly embed in phase 1; own booking later, since booking is a product Klyvora sells).
- **Case studies with before/after** and a local map of launched clients.
- **Ownership promise** stated plainly on Pricing and About: you own your domain, content, data, customers and Stripe account; custom work is yours on final payment.
- **Spanish toggle** for key pages later (Charlotte market).
- Fast, accessible, mobile-first; Lighthouse 95+ as a selling point ("your site will load like this one").
- SEO basics: metadata per page, OG images, sitemap, local business schema, Charlotte keyword pages.

## Admin (`/admin`)
Internal only; Chris, Geoffrey, Demetrius. Roles: owner, member.

### Pages
| Route | Purpose |
|---|---|
| `/admin` | Dashboard: the three numbers (signed sales, cash collected, live MRR) vs the day-90 targets; pipeline summary; this week's tasks; overdue invoices; open tickets; contacts made this week vs the 65–95 goal |
| `/admin/leads` | Lead inbox and pipeline. Kanban or table: New → Contacted → Demo booked → Proposal sent → Signed → Lost. Source tag (site form, estimator, check-my-site, workbook import, referral, partner). Import the `charlotte-leads.xlsx` list. Offer code, score, pitch angle, next action date |
| `/admin/leads/[id]` | One lead: timeline of calls/emails/notes, business info, current site URL and audit result, proposals, convert to client |
| `/admin/clients` and `/admin/clients/[id]` | Client record: contacts, offers bought, subscriptions, projects, invoices, files, portal users, Stripe customer link, notes |
| `/admin/proposals` and `/admin/proposals/[id]` | Build a proposal from offer templates (scope caps, milestones, ownership terms), send a link, track opened/accepted, e-sign, auto-create project + invoices on acceptance |
| `/admin/projects` and `/admin/projects/[id]` | Per-project board: milestones (kickoff 50% → demo 30% → acceptance 20%), tasks, assignee, content checklist from the client, launch checklist, time log |
| `/admin/invoices` | Stripe invoices and subscriptions in one list: due, paid, overdue, next milestone; one-click send; payment plans |
| `/admin/subscriptions` | Active MRR by client and offer; churn; upcoming renewals; usage charges (AI/messaging) added monthly |
| `/admin/support` | Tickets from the portal/email: open, waiting on client, resolved; SLA per plan; hours used against the plan's support cap |
| `/admin/content` | Case studies, blog posts, testimonials, demo content (phase 4) |
| `/admin/outreach` | Weekly contact targets, scripts, partner list, which leads to call this week (replaces the workbook's tabs over time) |
| `/admin/reports` | Signed vs cash vs MRR over time, funnel conversion (contact → demo → close, replacing the untested 25%/25%), revenue by offer, delivery hours per offer vs price (margin check) |
| `/admin/settings` | Team members and roles, offer catalog and prices (one source of truth for site, estimator and proposals), proposal templates, email templates (Brevo), Stripe connection, integrations |

### Features that will be good to have
- **Offer catalog as data.** Prices live in one table and drive the pricing page, estimator, proposals and invoices, so a price change is one edit.
- **Proposal → contract → invoices in one flow.** Accepting a proposal creates the client, the project with its three milestones, the Stripe invoices (50% due now), and the subscription scheduled to start at launch.
- **Milestone-aware billing:** marking "demo accepted" sends the 30% invoice; marking "launched" sends the 20% and starts the monthly plan. Hardware is invoiced separately and in full before ordering.
- **Dashboard tied to the plan's three numbers** so the day-90 targets are visible every day, with the gap to go.
- **Activity timeline on every record** (calls, emails, proposal views, payments), with Brevo events (opened, clicked) pulled in.
- **Follow-up reminders:** next-action dates on leads; overdue follow-ups on the dashboard; a daily digest email.
- **Lead scoring/tags** carried from the workbook: score, Black-owned (for partner routing, not pricing), neighborhood, dead-site flag.
- **Content collection checklist** per project (logo, photos, hours, menu, services, copy) that the client fills in the portal; the top cause of late launches.
- **Time tracking per project** to compare delivery hours against the fixed price and fix scopes early.
- **Support hours cap** per plan with usage shown to client and admin.
- **Audit log** of who changed prices, sent invoices, edited proposals.
- **Email templates** (proposal sent, invoice due, launch, review request) through Brevo, editable in settings.
- **Workbook import** for the 657 leads, with dedupe on phone/email.
- **Global search** (cmd-K) across leads, clients, projects, invoices.
- **Mobile-usable admin** for logging calls between site visits.

## Client portal (`/portal`)
Magic-link or password login per client user. Phase 3.

| Route | Purpose |
|---|---|
| `/portal` | Project status, next milestone, what we need from you |
| `/portal/project` | Timeline, approvals (approve the demo, sign off at launch), content checklist, files |
| `/portal/invoices` | Invoices and subscription, pay via Stripe, receipts, update card |
| `/portal/support` | Open a ticket, see hours used vs plan cap, knowledge base |
| `/portal/account` | Contacts, notifications, data export request (the "you keep everything" promise) |

## Data model (first pass)
`User` (admin, role) · `Lead` (status, source, score, tags, offerCode, nextActionAt) · `Activity` (lead/client timeline) · `Client` · `Contact` (client users, portal login) · `Offer` (catalog: code, name, setup, monthly, scope caps, addOnOf) · `Proposal` (items, terms, status, acceptedAt, signature) · `Project` (status, milestones) · `Milestone` (kickoff/demo/acceptance, percent, invoiceId) · `Task` · `TimeEntry` · `Invoice` (Stripe id, amount, dueAt, paidAt) · `Subscription` (Stripe id, offer, status, mrr) · `Ticket` · `File` (Cloudflare key) · `CaseStudy` / `Post` · `AuditLog`.

## Repo layout
```
src/app/
  (marketing)/      layout with site nav/footer; /, services, pricing, work, about, contact, quote, founding, blog, privacy, terms
  (portal)/portal/  client layout
  (admin)/admin/    admin layout with sidebar
  api/              route handlers: Stripe webhooks, Brevo webhooks, site-check tool
  globals.css       design tokens from the Klyvora design (colors, type, radius, spacing)
src/components/ui/  buttons, cards, inputs, tables, badges from the design system
src/components/     marketing sections, admin widgets
src/lib/            prisma client, stripe, brevo, auth, offers
src/proxy.js        session check for /admin and /portal (Next 16 calls middleware "proxy")
prisma/schema.prisma
```

## Design system
Read from Chris's Klyvora Portfolio project in Claude Design on Nov 5 and written up in `docs/DESIGN-SYSTEM.md`. Tokens, fonts (Inter + Instrument Serif) and base utilities are in `src/app/globals.css` and `src/app/layout.js`. Components still to build.

## Next steps
1. Build the base UI components (nav, buttons, card, input, section, eyebrow) from `docs/DESIGN-SYSTEM.md`.
2. Build phase 1: marketing layout, Home, Services, Pricing, Contact form writing leads to Neon via Prisma and emailing via Brevo. Deploy to Vercel.
3. Prisma schema for Lead, Offer, User; Auth.js for `/admin`.
4. Phase 2 admin.
