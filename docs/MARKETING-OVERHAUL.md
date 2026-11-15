# Public website overhaul

## Implementation and boundaries

The live site and repository were audited on November 15, 2026. The live homepage matched the repository: six older service groups, conflicting website prices, an eleven-section sales page, empty case studies, a visual playground, an estimator, and undefined founding offers. The legal pages contained unresolved drafting text. The public canonical default pointed to klyvora.ai rather than klyvorastudio.com.

The new public site retains Instrument Serif, Inter, the neutral dark/light themes, muted blue accents, rounded cards, and the existing keyboard-accessible mobile navigation. The homepage now has six content sections, including its hero. No client screenshots, testimonials, performance figures, or team biographies were invented.

The public catalog is `src/lib/marketing/catalog.js`. All public pricing cards, service pages, quote selections, and inquiry price descriptions read from it. Per the owner’s clarified positioning, every listed service is available to commission: website design, software configuration, team access, testing, and onboarding are delivered as part of each project. Public cards, pages, metadata, and the quote form do not display internal development status or suggest that customers can immediately sign into a finished self-service product. Implementation and acceptance checks remain internal delivery responsibilities. The public catalog does not overwrite the historical database Offer catalog, signed proposals, subscriptions, or billing amounts. New commercial IDs are intentionally not mapped to obsolete billing packages.

The new `/api/quote` adapter validates required business information, service selection, URLs, and field lengths, then delegates to the existing `/api/leads` handler. Industry, service, published starting pricing, equipment, and project description are saved in the existing lead message so the current admin inbox and exports can display them. Existing origin validation, transactional lead/activity persistence, honeypot, database-backed rate limits, confirmation email queue, and owner notification queue are retained. This creates an inquiry, not an order or subscription.

No schema migrations or production data changes are included. Authentication, application APIs, customer records, dashboards, proposal acceptance, Stripe logic, and existing client subscriptions are unchanged. The historical catalog provider was moved from the root layout into the admin layout, retaining its data for the proposal builder and the existing root session provider. Public pages now prerender without a private database read; protected routes retain their existing authorization boundaries.

## Navigation and sitemap

Main navigation: Industry Solutions, Custom Websites, AI & Software, Pricing, and Get a Quote. About, Contact, legal information, and client sign-in remain in the footer.

Indexable routes:

- `/`
- `/solutions`
- `/solutions/restaurants`
- `/solutions/daycare`
- `/solutions/beauty`
- `/solutions/ecommerce`
- `/websites`
- `/ai-software`
- `/pricing`
- `/contact`
- `/about`

`/privacy` and `/terms` remain reachable with honest policy-status notices and `noindex` until approved policies exist; they are excluded from the sitemap. These notices are not substitutes for approved legal policies and block a public launch. Original drafts are retained privately in source, never rendered by these routes.

The functioning `/check` website-analysis tool is retained, unlinked from primary navigation, with current public pricing and quote links. The sitemap contains only promoted pages, and will include real blog or work entries when those collections contain approved content. Empty `/blog` and `/work` pages and their template examples return 404s. Reference collections are retained. Unknown dynamic solution/service parameters use Next.js’s not-found UI and `noindex`; with Cache Components, Next.js may have streamed a 200 response before resolving those unknown parameters, as documented in the bundled `not-found.js` guide.

Exact 301 redirects, preserving query parameters, are defined in `src/lib/marketing/redirects.js`:

| Retired route                   | Replacement                    |
| ------------------------------- | ------------------------------ |
| `/services`                     | `/solutions`                   |
| `/services/websites`            | `/websites`                    |
| `/services/booking`, `/booking` | `/solutions/beauty`            |
| `/services/restaurants`         | `/solutions/restaurants`       |
| `/services/ecommerce`           | `/solutions/ecommerce`         |
| `/services/ai`                  | `/ai-software`                 |
| `/services/custom`              | `/ai-software#custom-software` |
| `/quote`, `/founding`           | `/contact`                     |

## Product capabilities requiring verification

These are internal delivery requirements, not public service-availability labels or website publishing blockers. Klyvora offers all listed services as commissioned projects. Features, integrations, and access are delivered within the agreed project scope, with appropriate implementation, testing, and acceptance before operational use. No backend was built or enabled by this marketing work.

| Solution               | Repository evidence                                                                                                                                | Outstanding launch verification                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Restaurants            | Shared client dashboard has restaurant-specific terminology, catalog/menu records, orders, customer records, payment views, and ordering controls. | Customer-facing ordering and provider checkout, kiosk deployment, kitchen routing, printing, role enforcement across devices, real-time availability, supported POS/terminal integrations, reports, and complete order/refund lifecycle.                                                                                                                 |
| Beauty                 | Shared dashboard and APIs cover bookings, service catalogs, customers, and payment records.                                                        | Public booking and availability, staff schedules, booking portal, deposit checkout, actual reminder delivery, walk-in queue, technician rotation, employee earnings, and tip calculations.                                                                                                                                                               |
| Ecommerce              | Store-oriented dashboard, catalog, order/customer/payment records, and site editing exist.                                                         | Production storefront/cart/checkout, variants, stock consistency under concurrent purchases, customer account isolation, shipping/pickup calculations, refunds, and shipping/POS integrations.                                                                                                                                                           |
| Childcare              | No childcare business kind is defined in `src/lib/app/kinds.js`; existing kinds are booking, restaurant, and store.                                | Deliver the operational module, parent/guardian permissions, classroom access, child profiles, attendance, staff-confirmed authorized pickup, identity/custody restrictions, audit trails, photos/consent, communication, tuition records, access/retention/deletion controls, and applicable safety/privacy review before operational use for a client. |
| AI/custom applications | Bespoke project offerings; no universal prebuilt workflow is assumed.                                                                              | Scope-specific provider permissions, logs, human handoffs, failure handling, messaging consent where needed, usage limits/costs, testing, and acceptance.                                                                                                                                                                                                |

No cameras, door access, proprietary terminals, or POS integrations are promised compatible without assessment. Childcare pickup may never rely on a PIN or QR code alone; the marketing copy states staff authorization and identity requirements. No operational childcare features are enabled by this work.

## Business/legal approval and client delivery requirements

1. Obtain human legal review and approved Privacy and Terms documents. Confirm legal entity, registration details, responsible company contact, mailing address, effective dates, governing law, disputes, warranties, liability, and change-notice procedure.
2. Verify actual data flows and providers, including hosting, database, email, payments, media, and any analytics/cookies. Confirm what each receives, storage regions, subprocessors, security measures, lawful notices/consents, retention schedules, backups, deletion, and data-request procedures. The code alone does not establish production practices.
3. Approve shared-platform licensing and subscription agreements: client website deliverables versus reusable Klyvora IP, service activation, billing/cancellation notice, suspension, support boundaries, data export format/timing/fees/retention, and the end of hosted functionality. Separately define client-specific IP for bespoke software.
4. Standardize the included tablet model, stand, procurement cost, device roles, remote configuration, supported operating systems, and warranty. Define equipment ownership, replacements, networking, installation responsibility, third-party charges, and any approved adjustment for bring-your-own hardware. No automatic credit or discount is promised.
5. Define initial data-entry/product/menu caps, onboarding duration, support hours/channels, routine maintenance boundaries, and exclusions in the proposal. Approve the two-round revision policy, final bug/content review, 14-day correction period, 50/30/20 milestones, hardware advance payments, and subscription activation date.
6. Verify notification recipients, provider configuration, job delivery and monitoring, and actual email receipts in the deployment environment. Local tests verify persisted leads and queued delivery without sending external email. Reconfirm public email and phone contact details before release.
7. For each commissioned project, complete implementation, testing, and acceptance before operational use. Childcare needs a separate implementation and safety/privacy review, including children’s data and photos, custody restrictions, staff handoffs, auditability, retention, and any security equipment. These checks belong to client delivery and do not prevent offering the service on the marketing website.
8. Update the internal proposal/offer catalog through an approved commercial migration if staff need automated quoting for these new packages. Existing signed contracts and subscriptions must retain their agreed prices. Until then, use a reviewed, manually scoped proposal for new inquiries; no old Offer code is selected by the public quote form.

## Verification

Run `npm run build:local`, `npm run test:marketing`, and `npm run test:backend -- --browser` against local PostgreSQL. The marketing suite checks public routes and metadata, prices, redirects, internal links, empty/unknown routes, validation, failure recovery, saved leads and queued emails, honeypot/rate limits, responsive overflow, keyboard navigation, light mode, and protected-route redirects. Browser screenshots are written to ignored `artifacts/marketing/` for visual review. The existing backend suite verifies authentication, tenant isolation, proposals, invoices/subscriptions, payment safeguards, webhooks, and protected browser screens.

Verification completed locally:

- `npm run build:local` — passed. Core marketing routes prerender statically.
- `npm run test:marketing` — 246 checks passed, including axe-core WCAG A/AA checks across all public pages, selected mobile pages, and the light-theme homepage. Quote requests were persisted, confirmation and owner notification jobs were queued, and isolated fixtures were cleaned up without sending external email.
- `npm run test:backend -- --browser` — all 85 existing backend and protected-screen browser checks passed after relocating the catalog boundary. The first run reported a React streaming error; the final run passed without changing business or payment logic.
- `git diff --check` — passed.
- Desktop and mobile screenshots were visually reviewed for the homepage, pricing, and contact flow.

Automated and visual checks support the WCAG 2.2 AA implementation target; they do not constitute a full accessibility conformance audit or measured field Core Web Vitals. Product implementation and acceptance belong to each commissioned project’s delivery. The owner subsequently authorized production deployment of the reviewed website, including the existing policy-status notices; approved legal policies remain outstanding. Production Stripe, SMTP, and Cloudflare Images authentication were verified with read-only checks, without sending email. Existing private R2 storage configuration remains incomplete and is separate from marketing lead capture.
