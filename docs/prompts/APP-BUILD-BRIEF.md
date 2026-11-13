# Brief for every helper building Klyvora app screens

You are porting screens from a design canvas into a real Next.js app. Several helpers work at the same time in the same folder, each on its own routes. Read this whole file first.

## Where things are
- App repo: `C:\Projects\charlotte-project\.claude\worktrees\klyvora-site-design-bb683f` (Next.js 16 App Router, React 19, **JavaScript only**, Tailwind CSS 4).
- Design source boards (HTML with inline styles plus a `class Component extends DCLogic` script that holds behaviour, states and sample data): `C:\Users\Chris\AppData\Local\Temp\claude\b160fc926f9e7685\020fc094-8617-4079-b52a-895872cd5d40\scratchpad\klyvora-site\project\`. Each board has Tweaks in its `data-props` (for example `state live|loading|empty|error`, `dialog none|...`, `tab ...`): every state and dialog listed there must exist in the real UI. `Overlay-*.dc.html` files are thin wrappers that open a dialog on a page; read them to see which dialog/state each one shows. The canvas uses `--accent-2` where the app uses `accent-light`. Strip inline styles for reading with: `PYTHONIOENCODING=utf-8 python C:\Users\Chris\AppData\Local\Temp\claude\b160fc926f9e7685\020fc094-8617-4079-b52a-895872cd5d40\scratchpad\tools\strip.py <file>`.
- Business rules (newest): `C:\Projects\charlotte-project\.claude\worktrees\project-brief-company-name-7a19a9\docs\PROJECT-BRIEF.md`, `SITE-PLAN.md`, `DESIGN-SYSTEM.md`. Key ones: monthly plan optional on every offer except restaurants (RC, RK); clients own site, code and data on final payment, only Klyvora templates/platform are licensed; setup billed 50% kickoff / 30% working demo / 20% acceptance, monthly starts at launch; client payments go to the client's own Stripe and Klyvora's cut is $0; outreach: Claude drafts, a person approves and sends every email and demo.

## Next.js in this repo (differs from your training data)
- Read `AGENTS.md` and check `node_modules/next/dist/docs/` when unsure.
- `params` and `searchParams` are Promises. `cacheComponents: true` is on: **any page that awaits params or reads searchParams must do it inside `<Suspense>`**, even with `generateStaticParams`. Pattern (see `src/app/(marketing)/services/[slug]/page.js`): `export default function Page({ params }) { return <Suspense fallback={<Fallback/>}><Content params={params} /></Suspense> }` with `async function Content({ params }) { const { id } = await params; ... }`. In client components use `useSearchParams()` inside a Suspense-wrapped child. Prefer local React state for tabs and dialogs over query params; if you sync a tab to `?tab=`, keep it inside Suspense.
- Route handlers: `src/app/api/**/route.js`, `export async function GET/POST(request)` returning `Response.json(...)`.
- Server Components by default; `"use client"` only for interactive parts.

## Shared code you must reuse (do not edit these; if one blocks you, say so in your report)
- `src/app/globals.css`: tokens as Tailwind colors: `bg-bg bg-bg-deep bg-surface bg-surface-2 border-border border-border-2 text-fg text-muted text-muted-2 text-accent text-accent-light text-success text-warning text-danger` (`warning`/`danger` are for admin, portal and client-admin status only, never the public site). Utilities `eyebrow display-1 display-page display-2 glass gradient-ring container-site`; radii `rounded-card` 24, `rounded-card-lg` 26, `rounded-tile` 28, `rounded-input` 14, `rounded-admin` 16. Light mode is automatic through the tokens (`[data-theme="light"]` on html). Opacity modifiers work, e.g. `bg-danger/10`.
- Admin: `src/components/admin/AdminShell.js` (already wraps every `/admin/*` page via `src/app/(admin)/admin/layout.js`; `/admin/signin*` renders without the shell), `src/components/admin/ui.js` (`PageHead`, `Panel`, `Chip` + tones accent/success/warning/danger/muted/fg, `LEAD_STATUS_TONE`, `Ring`, `Bar`, `Empty`, `Skeleton`, button class strings `btnPrimary btnSecondary btnDanger btnGhost`, `LinkArrow`, `money`), `src/lib/admin/nav.js`, `src/lib/admin/sample.js` (LEADS, TASKS, metrics), `src/components/admin/TaskList.js`. Reference page: `src/app/(admin)/admin/page.js` (the dashboard).
- Public UI: `src/components/ui/` (Button, Card, Section/PageHeader/Eyebrow, Field/Label/ErrorIcon/inputClass, Bits, Faq), `src/components/site/LeadForm.js` (five-state form pattern), `src/lib/offers.js` (every price: OFFERS, getOffer, money, MILESTONES, RESTAURANT_ADD_ONS), `src/lib/theme.js` (`useTheme()` hook returns `[theme, setTheme]`), `src/lib/site.js`.

## Density rules
- Admin (`/admin`): 13px body, 16px panel radius, 1px border dividers, content on bg-deep, tables 13px with sortable headers where the board has them, pager where the board has one.
- Portal (`/portal`) and client admin (`/app`): public density (14–15px body, 24px card radius, 44px touch targets). Client admin is used by owners on phones.

## UI rules (every screen)
- Every list has four states: live, loading (skeleton), empty (dashed card with one action), error (card with an fg border, icon and a retry button). Every form has five: idle, validation error, submitting, success, failed. Money and destructive actions get a confirm dialog and then a toast. Build the states the board shows; expose them through real behaviour (filters that empty a list, a failed submit), and where real data can't produce a state yet, add a small dev-only switch: render it only when `process.env.NODE_ENV !== "production"`.
- Dialogs: real `role="dialog" aria-modal="true" aria-labelledby`, focus moves in on open, Escape and the scrim close, Tab stays inside, focus returns to the trigger. Sizes: small 440px, medium 560px, large 720–760px; radius 16px in admin, 24px in portal/client admin; scrim `bg-[rgba(var(--scrim-rgb),.6)]`. Drawers slide from the right at 480px. Toasts: bottom centre, `aria-live="polite"`, 2600ms (undo toasts 6000ms). If you need a reusable Dialog/Drawer/Toast, put it in your own area folder (e.g. `src/components/admin/leads/Dialog.js`); a later pass will merge duplicates.
- Accessibility: real `<button>`, `<a>`, `<label>`, `<table>` with `<th scope>`, `aria-label` on icon-only buttons, inline stroke SVG icons (no emoji), visible focus, text under 14px uses `text-muted-2`, 4.5:1 contrast.
- Copy: "we" not "I", no lorem ipsum, never invent prices, stats, client names or testimonials. Sample people and businesses stay as bracketed placeholders exactly like the board (`Barbershop [1]`, `[Owner 2]`). Admin pages show sample data; keep the shell's "Sample data" pill meaning true.
- Must work at 375px with no horizontal page scroll (wide tables scroll inside a box), and at 1024px for admin pages the board gives a Tablet frame for.

## Data and stubs
- Put sample data for your area in its own file, e.g. `src/lib/admin/sample-leads.js`, shaped as the back end should return it, with a comment naming the route and JSON shape.
- Add stub route handlers for the endpoints your screens call under your own folder (e.g. `src/app/api/admin/leads/route.js`), returning sample data or 201, with a header comment: `STUB until the back end ships this route` plus the exact request/response shape. Client mutations should call these stubs and handle failure.

## Hard limits
- Touch only the routes and folders your task names, plus new files under your own area folders. Never edit: globals.css, any layout.js you didn't create, AdminShell, ui.js, nav.js, sample.js, offers.js, theme.js, site.js, LeadForm, marketing pages.
- Do NOT run `npm run build` or `npm run dev` (another process owns `.next`). Do run `npx eslint <your files>` and fix everything it reports. The React Compiler lint rules are on: no reassigning variables during render, no setState synchronously inside an effect body (use event handlers, lazy initial state, or useSyncExternalStore).
- Do not commit. Do not install packages.

## Report back (short)
Each route and its files; stub routes with exact request/response shapes; which board states/dialogs you built and any you couldn't, and why; placeholders the founders must fill in; anything in shared files that blocked you.
