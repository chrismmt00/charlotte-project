# Klyvora web app plan

Drafted Nov 5, 2026; updated Nov 6 after every page was drawn. One Next.js project: the public site that sells Klyvora, the admin that runs the business, a client portal, and the client admin that the monthly plan pays for. Every route below has a board on the design canvas (https://claude.ai/artifact/BUncFbi6TT6PaJ1XuujMuf); build what is drawn. Pricing and offers come from `docs/PROJECT-BRIEF.md`; this file plans the pages and features.

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
| `/work` and `/work/[slug]` | Case studies | Problem → build → result, screenshots, owner quote, offer used. The list has an empty state until the first real case study exists; all content is `[PLACEHOLDER]` until then |
| `/about` | Trust | Charlotte-based team of three, mission, "we write our own code", the ownership promise |
| `/contact` | Quote request | Short form (name, business, phone/email, what they need, current site URL), Calendly-style call booking, phone number |
| `/quote` | Guided estimator | Five steps: pick offer (radio cards) → add-ons (kiosk quantity, monthly plan on/off except restaurants) → summary with the 50/30/20 split → details form → sent. Submits as a lead with the chosen package |
| `/check` | "Check my site" tool | Paste a URL → checking → plain-English report (dead, redirecting to spam, slow, not mobile-friendly, no booking, or fine) → email the report. Captures the lead with the URL |
| `/p/[token]` | Public proposal | Open, signed, expired and declined states; the client can toggle the optional monthly on or off before signing; typed e-signature; signing creates the client, project, milestone invoices and the scheduled subscription |
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
- **Ownership promise** stated plainly on Pricing and About: you own your site, its code, your domain, content, data, customers and Stripe account on final payment; only Klyvora templates and platform are licensed (Chris, Nov 5, 2026).
- **The monthly is optional** on every offer except restaurants, and the pricing page, estimator and proposal all say so. The estimator's plan switch is locked on for RC and RK.
- **Spanish toggle** for key pages later (Charlotte market).
- Fast, accessible, mobile-first; Lighthouse 95+ as a selling point ("your site will load like this one").
- SEO basics: metadata per page, OG images, sitemap, local business schema, Charlotte keyword pages.

## Admin (`/admin`)
Internal only; Chris, Geoffrey, Demetrius. Roles: owner and builder (owner-only: targets, prices, team, API keys). Claude appears on the team list as an agent for outreach. Admin density and the 1024 tablet layouts are in `docs/DESIGN-SYSTEM.md`.

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
| `/admin/support` and `/admin/support/[id]` | Tickets from the portal/email: open, waiting on client, resolved; SLA per plan; hours used against the plan's support cap; thread with reply and internal note, log time, close. New tickets from clients without a plan get a quote path |
| `/admin/content` | Case studies, blog posts, testimonials, demo content (phase 4) |
| `/admin/outreach` | Daily prospecting run by Claude Cowork with a person approving every email and demo (Chris, Nov 6, 2026). Stat tiles on top, then tabs, because one long page showed too much at once: **Approval queue** (default: drafted emails and finished demos waiting for a person to send), **Today's run** (what Claude did and why it picked each business), **Prospects** (table by phase Found → … → Became a lead / Not a fit, owner, drawer with reasoning and timeline), **Call list**, **Scripts**, **Partners**. Weekly contacts vs the 65–95 goal |
| `/admin/outreach/demo/[id]` | Demo review: the demo site Claude or a founder built for a prospect; approve and send, request changes, or hand it to a person. Ready, building and not-found states |
| `/admin/reports` | The three numbers vs the day-90 targets; signed and collected per week with the target line; MRR line with a dotted projection to $1,500; pipeline funnel (contact → demo → close, replacing the untested 25%/25%); outreach contacts per week against the 65–95 band; revenue by offer (restaurant offers marked "plan required"); range 7d/30d/90d/YTD or custom; CSV export. Loading and day-one empty states |
| `/admin/settings` | Tabs: General (targets, company), Team (invite, change role, remove; Claude as agent), Catalog (offer prices with an `optional`/`required` monthly flag; every price change needs an audit note), Templates (proposal and email templates, Brevo), Outreach (Claude's brief and guardrails), Notifications. Owner-only tabs show a lock to builders |

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
Magic-link login per client user (`/portal/signin`: request, sent, expired, wrong account). Admins use password plus a two-factor code. Phase 3. The portal follows the project stage: kickoff (content checklist), demo (approve the working demo, which creates the 30% invoice), launch (sign-off with typed e-signature, which makes the 20% due and starts any monthly plan), live.

| Route | Purpose |
|---|---|
| `/portal` | Project status, next milestone, what we need from you |
| `/portal/project` | Timeline, approvals (approve the demo, sign off at launch), content checklist, files |
| `/portal/invoices` | Invoices and subscription, pay via Stripe, receipts, update card |
| `/portal/support` | Open a ticket, see hours used vs plan cap, knowledge base |
| `/portal/account` | Contacts, notifications, data export request (the "you keep everything" promise), end the monthly plan (restaurants see the required-plan note instead) |

## Client admin (`/app`)
What the monthly plan buys (Chris, Nov 5–6, 2026): Klyvora hosts the site and the owner runs it here. Owners sign in with a magic link. One app, three `kind`s that change the words and the catalog shape: **booking** (salon, barber, services), **restaurant** (menu, online ordering, kiosks), **store** (products). Owners use it on phones, so it keeps the public density (14px body, 24px radius), not the admin density. Restaurant plans cannot be cancelled from here because the plan is required; every other kind can.

| Route | Purpose |
|---|---|
| `/app` | Today at a glance: bookings or orders, revenue, new customers, site status, what to do next |
| `/app/bookings` | Calendar and list; add a booking, block time, per-row menu (call, text, reschedule, no-show, cancel); booking rules (hours, buffers, deposits). Restaurants see orders and a pause-online-ordering switch instead |
| `/app/catalog` | Services, menu or products by group; add, edit, reorder by drag, hide; prices and durations; discounts |
| `/app/site` | Edit page text and photos, hours, contact details; publish is disabled until something changed; upload states |
| `/app/customers` | Customer list with visits, spend and notes; export |
| `/app/payments` | Payouts and transactions from the client's own Stripe account; refund; the page states that Klyvora's cut is $0 |
| `/app/plan` | Plan, invoices and card; download the site code (always available); cancel the plan, which keeps the site, code and data and says what stops |

## Data model (first pass)
`User` (admin, role owner/builder/agent) · `Lead` (status, source, score, tags, offerCode, nextActionAt) · `Activity` (lead/client timeline) · `Client` (kind booking/restaurant/store) · `Contact` (client users, portal and client-admin login) · `Offer` (catalog: code, name, setup, monthly, monthlyRequired, scope caps, addOnOf) · `Proposal` (items, terms, monthlyChosen, status, acceptedAt, signature) · `Project` (status, milestones) · `Milestone` (kickoff/demo/acceptance, percent, invoiceId) · `Task` · `TimeEntry` · `Invoice` (Stripe id, amount, dueAt, paidAt) · `Subscription` (Stripe id, offer, status, mrr) · `Ticket` · `TicketMessage` · `File` (Cloudflare key) · `CaseStudy` / `Post` · `AuditLog` (price changes carry a note).

Added Nov 6, 2026 for outreach and the client admin: `Prospect` (phase, owner, reasoning, demoId) · `OutreachRun` (date, counts, log) · `Approval` (email or demo, status, approvedBy) · `Demo` (prospect, builder, url, status) · `Booking` / `Order` · `CatalogGroup` / `CatalogItem` · `Customer` · `SitePage` (editable text and photos) · `PlanEvent` (cancel, resume).

## Repo layout
```
src/app/
  (marketing)/      layout with site nav/footer; /, services, pricing, work, about, contact, quote, founding, blog, privacy, terms
  (portal)/portal/  client layout
  (admin)/admin/    admin layout with sidebar
  (app)/app/        client admin layout (what the monthly buys)
  p/[token]/        public proposal
  check/            check-my-site tool
  api/              route handlers: Stripe webhooks, Brevo webhooks, site-check tool
  globals.css       design tokens from the Klyvora design (colors, type, radius, spacing)
src/components/ui/  buttons, cards, inputs, tables, badges from the design system
src/components/     marketing sections, admin widgets
src/lib/            prisma client, stripe, brevo, auth, offers
src/proxy.js        session check for /admin and /portal (Next 16 calls middleware "proxy")
prisma/schema.prisma
```

## Design system
Read from Chris's Klyvora Portfolio project in Claude Design on Nov 5 and written up in `docs/DESIGN-SYSTEM.md`. Tokens, fonts (Inter + Instrument Serif) and base utilities are in `src/app/globals.css` and `src/app/layout.js`. Every page, state, overlay and component above is drawn on the "Klyvora Site Pages" canvas (https://claude.ai/artifact/BUncFbi6TT6PaJ1XuujMuf), dark and light, with an Inventory board as the index; Row 1 holds the component families with their states and layer names. Components still to build.

## Next steps
1. Build the base UI components (nav, buttons, card, input, section, eyebrow) from `docs/DESIGN-SYSTEM.md`.
2. Build phase 1: marketing layout, Home, Services, Pricing, Contact form writing leads to Neon via Prisma and emailing via Brevo. Deploy to Vercel.
3. Prisma schema for Lead, Offer, User; Auth.js for `/admin`.
4. Phase 2 admin.
