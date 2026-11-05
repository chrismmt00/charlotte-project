# Project brief — Klyvora

Upload this file to the project as knowledge. It carries the decisions from the planning chats (Oct 26–27 and Nov 5, 2026) so every new conversation starts with the same context. Update it when decisions change.

## The company
- **Name: Klyvora** (chosen Nov 5, 2026; see "Business name"). A software and AI company. The name is deliberately not tied to a place, an industry or one product: Klyvora can build anything in technology, from websites and web apps to AI harnesses, automations, kiosks and hardware integrations.
- Based in Charlotte, NC. Founders: Chris (full-stack dev, product direction, AI harnesses, founder-led sales), Geoffrey Fylak (CS, NC State), Demetrius Brown (CS, UNC Charlotte).
- First market: independent Charlotte businesses. Builds affordable custom websites, booking systems, online ordering, ecommerce stores, narrow AI automations, custom AI harnesses and a connected restaurant platform. Custom code on reusable foundations, not Wix/Squarespace.
- Customers (first market): restaurants, food trucks, bakeries, barbershops, hair salons and braiders, nail/lash/esthetics studios, boutiques and product brands, appointment and home services. Deliberate outreach to Black-owned businesses; serves the whole local market.
- Positioning: the owner keeps their domain, data, customer list and payment account; a local human answers the phone; no per-order commissions. We sell the result in the owner's numbers (missed bookings, delivery-app cuts, manual DMs), never the technology.
- Chris separately runs Exotic Web Designs (exotic-web-designs.com). Klyvora is a distinct brand with three founders.

## 90-day goals (revised Nov 5, 2026)
- **Signed sales:** $20,000 in setup/project fees.
- **Cash collected:** at least $17,000. Milestone billing leaves the last projects mid-payment at day 90, so cash runs roughly 85% of signed. Signing about $24,000 gets cash to $20,000.
- **Live recurring revenue:** $1,500/month at day 90 (stretch: $2,000), then **$5,000/month by day 180**. Longer-term planning assumption: $20,000/month.
- Track those three numbers separately. Recurring revenue counts only active software, hosting and support subscriptions, not hardware funds, installment payments or AI/messaging usage.
- Payment schedule: 50% at start, 30% at working demo, 20% at acceptance; monthly billing starts at accepted launch. Hardware funded 100% up front by the client.
- Founder agreement (ownership, hours, IP, decision rights) before major commitments.
- Why the change: the original plan reached $5,000/month at day 90 by assuming 35 launched customers, 20 of them restaurant + kiosk installs, while the restaurant platform is still being built. A realistic day-90 mix, weighted toward websites, booking and AI, is about 23 customers: $20,776 in setup and $1,726/month if all of them launch. The full math and the 90-day roadmap are in `docs/BUSINESS-PLAN.md`.

## Pricing (revised Oct 26, clarified Nov 5, 2026)
| Code | Offer | Setup | Monthly | Best for |
|---|---|---|---|---|
| W1 | Starter Website | $499 | $49 | No site, social-only, Linktree |
| W2 | Standard Website | $1,499 | $49 | Established business, outdated/broken site |
| WB | Website + Booking bundle (Starter site + booking) | $999 | $79 | Appointment businesses; marketplace-only booking |
| BK | Booking add-on (keeps a site someone else built) | $799 | $79 | Decent site, call/DM-only booking |
| EC | Ecommerce store | $999 | $99 | Products sold by DM/Cash App, no store |
| RC | Restaurant core (site + ordering + menu admin) | $1,499 | $149 | No direct ordering / delivery apps only |
| RK | Restaurant core + 1 kiosk | $1,798 | $178 | Counter service with lines |
| AI | AI automation | $499 | $49 + usage | Good site, manual follow-ups |
| — | Custom AI harness | from $1,499 (raise to $2,499 after first few) | $99 + usage | One workflow run by an agent |
| — | Custom web application | from $2,499 (raise to $3,499 after first few) | optional $99 | One focused workflow with login |

- **Adding booking later:** booking on a site Klyvora built costs +$500 setup and +$30/month. That's how WB = W1 + booking ($999 / $79), and a W2 client adding booking pays +$500 and moves to $79/month. BK is only for owners keeping a site someone else built.
- **Restaurant add-on modules:**

| Add-on | Setup | Monthly |
|---|---|---|
| Kiosk application | $299 per device | $29 per device |
| Branded customer mobile app | from $1,499 | $49 |
| Employee management | $499 | $29 |
| Kitchen operations | $299 | $29 |
| Basic inventory | $499 | $39 |
| Loyalty and retention | $299 | $19 |

- RK is RC plus one kiosk ($1,499 + $299, $149 + $29); each extra kiosk is another $299 setup and $29/month. The mobile-friendly web experience is included in the core. The branded app price assumes a tested shared mobile foundation exists; building it first takes extra investment.
- Hardware, onsite installation and travel, payment processing, delivery services, third-party subscriptions and AI/messaging usage are billed separately. Every proposal caps pages, design rounds, integrations, hosting, support hours and minor changes. Substantial new functionality gets a separate quote.

Reasoning behind the revisions: Charlotte freelancers charge $1,800–5,500 for a site, agencies $4,000–12,000, so $499 is a foot-in-the-door tier, not the ceiling. Square Appointments is free for one location ($29/$69 paid tiers), so standalone booking at $99/mo is hard to defend; bundle it with the site. Square gives restaurants the software free and charges 2.65% processing; our pitch is owning the ordering channel and a local human, not cheaper software.

## Ownership (decided Nov 5, 2026)
- **Klyvora owns what it builds:** the reusable platform, foundations, components, templates and tools, including improvements made during client projects. Package clients (W1, W2, WB, BK, EC, RC, RK, AI and the restaurant add-ons) get a license to use it while their subscription is active.
- **Custom work belongs to the client:** anything built only for one client transfers to them on final payment. That covers a custom web application, the client-specific workflow and integrations of a custom AI harness, or a separately quoted feature. Klyvora platform code inside it stays Klyvora's and is licensed to the client.
- **The client always owns:** their domain, branding, content, data, customer list and Stripe account. If they cancel, they keep all of it and get a full export of their content and data; the platform code stays with Klyvora.
- Write these terms into the proposal/contract template and have a lawyer review it.

## Accessibility program (for Black-owned and other under-resourced owners)
- Keep one low universal entry tier (W1). Discount or split setup fees, never the monthly.
- A defined quarterly "founding customer" program with a fixed number of reduced/deferred-setup slots, in exchange for a case study and referrals. Eligibility by business size, revenue, neighborhood or first-time-online status (not by the owner's race — check with an advisor on NC/federal rules).
- Route outreach through community partners (see files below), not through the price list.

## Tech stack for the company web app (decided Oct 27, 2026)
- **Frontend/app:** React with Next.js. **JavaScript, not TypeScript.** The repo is set up and named `klyvora`: Next.js 16.4 (App Router), React 19.3, Tailwind CSS 4.
- **Database:** PostgreSQL on Neon (production) with Prisma ORM. **Hosting:** Vercel. **Auth:** Auth.js (decided Nov 5).
- **Media:** Cloudflare for uploads. Note: Cloudflare Stream is the video product; for images use Cloudflare Images (or R2 storage). Use Stream for any video (client promo clips, demo videos).
- **Email:** Brevo (transactional email for proposals, invoices, booking confirmations; marketing lists).
- **Payments:** Stripe. Klyvora's own Stripe account bills Klyvora's setup invoices, milestone payments and monthly subscriptions. Client checkout runs through **each client's own Stripe account, which the client owns**. Connect it through Stripe Connect as an account they fully control (Standard-style, with full Stripe dashboard access). Klyvora takes no fee on their sales, in line with "no per-order commissions."
- The company site and the internal operations app are ONE Next.js project: public marketing site + the system that runs the business (lead/CRM pipeline, proposals, milestone invoicing, client portal, project tracking, support). Pages, admin features, portal and data model are planned in `docs/SITE-PLAN.md` (Nov 5). Production hosting: Vercel.

## Sales and outreach
- Conversion assumptions from the plan (25% contact→demo, 25% demo→close) are unvalidated; cold outreach to strangers runs well below that, walk-ins and referrals higher. Replace with real numbers fast. The day-90 mix (about 23 customers) takes about 770–1,150 contacts at a 2–3% cold conversion rate, roughly 65–95 a week.
- Working the current lead list needs 75–190 contacts per week. Best openers: businesses whose website now redirects to spam/gambling or is dead (40 found); new openings; marketplace-only booking.
- Outreach rules: CAN-SPAM for email (real mailing address, honest subject, honor opt-outs, one at a time from a real inbox); business lines only, business hours; no bulk or automated texts without consent; DMs by hand; log every touch so nobody is contacted twice. Upwork ToS forbids automated bidding — Claude drafts, a founder submits.

## Files produced so far
- `docs/BUSINESS-PLAN.md` (this repo) — revised plan text (Nov 5, 2026): Klyvora name, corrected pricing, ownership terms, recalculated goals and roadmap. Source for the PDF revision.
- `charlotte-business-plan.pdf` — original plan (Oct 26, 2026). Superseded by `docs/BUSINESS-PLAN.md`; regenerate the PDF from it.
- `charlotte-partner-organizations.xlsx` — 44 Charlotte organizations for outreach, Top 5 flagged: Historic West End Partners/HWEBA ($100/yr), CPCC Small Business Center (volunteer instructor), LISC Charlotte (West End hub, funds technical assistance), Charlotte Small Business Growth Fund (5 CDFI lenders), Freedom Business Collective (free Thrive Thursdays).
- `charlotte-leads.xlsx` — 657 leads (623 phones, 106 emails, 82 Black-owned, 236 scored 4–5 with verified gaps), each with offer code, price and pitch angle; tabs for Offers, Goal Math, Scripts, pipeline tracking. Score ≤3 came from directories: confirm the business is open before pitching. Check that its Offers and Goal Math tabs match the Nov 5 pricing and goals.
- `weekly-leads-task-prompt.md` — prompt for a Monday 7:37 AM scheduled task that delivers 60–80 new leads weekly (not yet created; creation was blocked by session permissions).

## Business name
**Klyvora**, chosen Nov 5, 2026. Pick one pronunciation and use it everywhere. It's not spelled the way it sounds, so on the phone spell it out: K-L-Y-V-O-R-A.

Checks done Nov 5, 2026:
- Web search: no company, product or other use of "Klyvora" found.
- Domains (registry lookups): **klyvora.ai, klyvora.dev and klyvoralabs.com are unregistered.** klyvora.com was registered Aug 29, 2025 through Spaceship and shows a parked "for sale" page, so it may be buyable. getklyvora.com, klyvorahq.com, klyvoraai.com and klyvora.app are registered. So are the misspellings klivora.com, clyvora.com and clivora.com.

Still to do before filing: NC Secretary of State business search, USPTO trademark search (classes 9 and 42 for software and SaaS), handles (Instagram, LinkedIn, X, GitHub), then register the domain(s).

Naming preferences, so future chats don't re-propose the wrong style: short, coined or a single word; sounds advanced (the feel of Stripe/Linear/Vercel, Anthropic/DeepMind, Nvidia/Tesla); no place or NC reference; no "Technologies"/"Software" suffix needed; the name comes first and any domain is fine.

Rejected for conflicts: Backroom Software (exists), OpenSign (exists), Tryon Software (Tryon Solutions is a Charlotte tech firm), Hornet anything (NBA trademark) — Oct 27. Logicwell (live Canadian B2B software), ThinkWire (live event platform), Kernelcraft (IT consultancy), TensorFold (AI inference project), Lemma, Hamming, Tycho, Minsky, Curie and Planck (all used by AI companies), Torqa (too close to Torq), Ixen (AI company in Madrid), Synthel (sounds like Syntel) — Nov 5. Also considered and passed over: Main Thread, Stackform, Ternix, Servoframe, Exoframe, Triode, Exarc, Second Order.

## Open questions
1. **The founder agreement comes before the NC SOS filing.** Sign the operating agreement (ownership, vesting, IP assignment, decision rights, hours) when the LLC is formed, not after. It should also cover any code Chris brings from Exotic Web Designs.
2. **Design system.** Read from the Claude Design project on Nov 5 (`docs/DESIGN-SYSTEM.md`); tokens and fonts are in the app. Claude Design closes Dec 14, 2026, so move or export the project before then if the original is still wanted.

## Next steps
1. Sign the founder agreement, then file with NC SOS. Register klyvora.ai and/or klyvora.dev and get a price for klyvora.com. Claim the handles.
2. Write the proposal/contract template with the ownership terms and milestone schedule; have a lawyer review it.
3. Build the site in two separate chats: `docs/prompts/FRONTEND-LOOP.md` (pages and components) and `docs/prompts/BACKEND-LOOP.md` (Prisma, Auth.js, Stripe, Brevo, API). Home page design: https://claude.ai/artifact/D5tXcmUwge3DipSaEWqNd7
4. Regenerate the business plan PDF from `docs/BUSINESS-PLAN.md`; check the leads workbook's Offers and Goal Math tabs against it.
5. Set up the weekly lead task.
6. Connect Upwork/Fiverr accounts when ready for proposal drafting.
