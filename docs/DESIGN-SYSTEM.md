# Klyvora design system

Source: Chris's "Klyvora Portfolio" project in Claude Design (`Klyvora Portfolio.dc.html`, last edited Jul 14, 2026). Read Nov 5, 2026. The design is a one-page dark portfolio; the company site keeps its look and swaps the content for Klyvora's offers. Tokens live in `src/app/globals.css`; fonts load in `src/app/layout.js`.

Every page, overlay and component is drawn on the "Klyvora Site Pages" canvas (https://claude.ai/artifact/BUncFbi6TT6PaJ1XuujMuf): Row 0 Inventory (the index), Row 1 Components, Row 2 Public pages with 375 frames, Row 3 Overlays, Row 4 Admin with 1024 frames, Row 5 Portal, Row 6 Client admin, and a light-mode copy of every board in the block on the far right. Build what is drawn; where this file and the canvas disagree, the canvas is newer. Decisions Chris made on Nov 5–6, 2026 are marked below.

## Colors
| Token | Value | Use |
|---|---|---|
| `bg` | `#0a0a0a` | Page background, secondary buttons |
| `bg-deep` | `#0d1015` | Project-card base behind blue gradients |
| `surface` | `#141414` | Cards (services, pricing, testimonials at 50% alpha) |
| `surface-2` | `#101010` | Inputs |
| `border` | `#1f1f1f` | Default 1px borders, dividers |
| `border-2` | `#2a2a2a` | Nav CTA pill border |
| `fg` | `#f5f5f5` | Text, primary buttons |
| `muted` | `#878787` | Body copy, labels, nav links, social links |
| `muted-2` | `#b5b5b5` | Secondary text on dark cards |
| `accent` | `#4E85BF` | Blue: gradients, glows, selection (`rgba(78,133,191,.4)`) |
| `accent-light` | `#89AACC` | Link hover, gradient partner |
| `success` | `#4ade80` | "Available" pulse dot, paid and live status |
| `warning` | `#f5b84e` | Admin and portal status only (due soon, waiting, past due warnings). Added Nov 6, 2026 |
| `danger` | `#ef6a6a` | Admin and portal status only (overdue, failed payment, destructive buttons). Added Nov 6, 2026 |

`warning` and `danger` never appear on the public site. Public form errors use an `fg` 1px border, an icon and plain text (see "Forms, errors and status").

### Light mode (asked for by Chris Nov 5, 2026; approved on the canvas Nov 6)
Same token names, switched by `data-theme="light"` on `<html>`. The toggle is a sun/moon button in the nav pill on desktop and a Dark/Light control in the mobile sheet; the choice persists per visitor.

| Token | Light value | Note |
|---|---|---|
| `bg` | `#fafafa` | |
| `bg-deep` | `#eef2f7` | Admin content area |
| `surface` | `#ffffff` | |
| `surface-2` | `#f4f4f4` | Inputs |
| `border` | `#e6e6e6` | |
| `border-2` | `#d4d4d4` | |
| `fg` | `#0a0a0a` | |
| `muted` | `#6b6b6b` | 14px and up only |
| `muted-2` | `#4a4a4a` | All text under 14px |
| `accent` | `#4E85BF` | Unchanged |
| `accent-light` | `#37679C` | Blue text and focus rings need the darker value on white |
| `success` | `#15803d` | |
| `warning` | `#b26a00` | Admin and portal status only |
| `danger` | `#c23b3b` | Admin and portal status only |

Email templates cannot use CSS variables, so they use the light hex values written out, on purpose (the Emails board notes this).

Gradients: brand mark `linear-gradient(135deg,#89AACC,#4E85BF)`; featured-card ring `linear-gradient(90deg,#89AACC,#4E85BF,#89AACC)` at `background-size:200% 100%` animated (`gradShift 6s`). Project tiles use radial/conic blue washes (`rgba(137,170,204,.38)`, `rgba(78,133,191,.3)`) over `#0d1015`.

Glass nav: `rgba(20,20,20,.72)` + `backdrop-filter: blur(14px)` + `1px solid rgba(255,255,255,.08)` + `0 8px 30px rgba(0,0,0,.35)`.

## Type
- **Body/UI:** Inter, antialiased. 13px nav, 14px buttons/body-small, 15px hero sub (line-height 1.7, max-width 480px), 21px/500 card titles, 20px/500 step titles.
- **Display:** Instrument Serif, italic, 400. H1 `clamp(60px,10vw,144px)`, line-height .92, letter-spacing -.02em. H2 `clamp(36px,5vw,58px)`, weight 400, line-height 1.05, letter-spacing -.01em.
- **Eyebrow:** 11px, uppercase, letter-spacing .3em, **muted-2** (Chris, Nov 6, 2026: all text under 14px uses `muted-2`, `#b5b5b5` dark / `#4a4a4a` light; `muted` `#878787` is for 14px and up only. The portfolio used `#878787` on eyebrows; the site does not).
- **Inner-page H1** (Services, Pricing, About, Contact, Work): the display face at `clamp(52px, 8vw, 112px)`; only Home uses the larger hero size.
- Headline style: one short serif line, lowercase feel ("Things I build", "Honest numbers", "Let's build yours.").

## Shape and spacing
- Radii: pills `999px` (buttons, nav, nav links); cards `24px` (services) / `26px` (pricing, testimonials) / `28px` (project tiles, featured ring); inputs `14px`; brand mark circle 36px.
- Section padding `110px 24px 40px` (stats `100px 24px`); content `max-width:1200px; margin:0 auto`.
- Grids: services 6-column, cards span 2, gap 18px; projects 12-column bento (span 7 / span 5, aspect 16/10), testimonials 3-column gap 20px; contact form 2-column with full-width submit.
- Transitions `all .25s–.35s ease`; hover lifts and glows, no color changes except links → accent-light.

## Density: public, admin, portal, client admin
- **Public site and portal:** the sizes above (14–15px body, 24–28px card radius, 14px inputs). The portal is a client-facing surface and keeps the public look.
- **Admin (`/admin`, decided Nov 6, 2026):** the same tokens at a tighter density. 13px body, 8px/12px paddings, 16px card radius, 1px `border` dividers, a 240px sidebar on `bg` (72px collapsed rail), a 64px topbar (collapse, ⌘K palette, bell, user menu), content on `bg-deep`, 12px inputs. Tables are 13px with sortable headers and a 6-per-page pager. Pages Chris uses between site visits (dashboard, leads, lead detail, settings, reports) also have a 1024 tablet layout.
- **Client admin (`/app`, decided Nov 6, 2026):** deliberately **not** the admin density. Owners run it on phones, so it stays at 14px body, 24px card radius and 44px touch targets, with a bottom sheet for navigation on small screens.

## Forms, errors and status
- Every form has five states: idle, submitting (button disabled, spinner), success, validation error, failed (network or server). Every list has four: live, loading (skeleton rows), empty (dashed card with one action), error (card with an fg border and a retry button).
- **Public form errors:** `fg` 1px border on the field, an icon and plain text under it. No red on the public site.
- **Admin and portal status:** `success`, `warning`, `danger` chips and text; destructive buttons use `danger`. Money and destructive actions always get a confirm dialog and a toast.
- **Dialogs:** small 440px, medium 560px, large 720–760px, radius 16px (admin) or 24px (public, client admin), on a `rgba(0,0,0,.6)` scrim; drawers slide from the right at 480px. Escape and the scrim close them; focus returns to the trigger.
- **Toasts:** bottom centre, one at a time, 2600ms (undo toasts 6000ms), `aria-live="polite"`, errors `assertive`.
- **Motion:** 180–240ms ease-out for overlays and sheets, 120ms for menus; everything freezes under `prefers-reduced-motion`.

## Components
- **Nav:** fixed, centered pill, `padding:7px 8px`, items gap 4px. Brand = 36px gradient circle with "K". Links 13px muted, `8px 16px` pill. CTA "Say hi ↗" with `1px solid #2a2a2a` border.
- **Button primary:** `#f5f5f5` on `#0a0a0a` text, `15px 30px`, 14px/500, pill, `2px solid transparent`.
- **Button secondary:** `#0a0a0a` bg, `#f5f5f5` text, `2px solid #1f1f1f`.
- **Card:** `#141414`, `1px solid #1f1f1f`, radius 24–26px, padding 30–34px.
- **Featured card:** 2px gradient ring wrapper (radius 28px) around a card.
- **Input:** `#101010`, `1px solid #1f1f1f`, radius 14px, `15px 17px`, 14px text.
- **Stat:** `border-top:1px solid #1f1f1f; padding-top:36px`, big number + label.
- **Marquee:** repeating "Building the future for small business •" strip over a dark overlay `rgba(5,5,5,.72)` above the hero video.
- **Status dot:** green pulse (`pulseDot`) next to "Available".

## Motion and behavior (must be reproduced on the real site)
- **Loader** (`showLoader` toggle): fixed full-screen `#0a0a0a` overlay. "Klyvora" small caps top-left; one serif italic word in the center cycling Design → Build → Automate (`clamp(44px,6vw,76px)`, `rgba(245,245,245,.85)`, `roleFade .5s` on each change); a tabular-nums serif counter 0→100 bottom-right (`clamp(72px,10vw,130px)`); a 3px progress bar at the bottom, gradient `#89AACC → #4E85BF` with a soft glow. About 2.2s, then fades out over .6s and unmounts. Skip it on repeat visits in the same session.
- **Hero background**, three layers: (1) muted looping background video, `object-fit: cover`, opacity .55 (the design used an HLS stream through hls.js; the site should use a short MP4/WebM, or Cloudflare Stream, with `poster`); (2) `rgba(0,0,0,.35)` overlay; (3) a `<canvas>` "AI workflow" network drawn with 2D context: six pill nodes labelled Order placed, Kitchen ticket, New lead, AI reply sent, Invoice paid, Books updated (pill `rgba(16,18,22,.85)` fill, `rgba(137,170,204,.22)` stroke, 11px Inter text `rgba(157,184,210,.75)`, a `#4E85BF` dot), thin `rgba(137,170,204,.22)` edges, and `#89AACC` pulses with a `#4E85BF` glow travelling along edges; nodes drift slowly and lean toward the cursor; paused when off-screen; DPR-aware. A 180px bottom fade to `#0a0a0a`.
- **Rotating word** in the hero subline: `<span>` with `min-width: 2ch`, swaps every ~2.2s with `roleFade .45s ease-out` (fade + 10px rise). Word list is a prop (`roles`).
- **Scroll hint:** "Scroll" eyebrow over a 1px × 40px track with a gradient segment running down (`scrollDown 1.5s ease-in-out infinite`).
- **Nav** is fixed, centered, glass pill, 20px from the top.
- **Visual playground:** a `260vh` section with a `100vh` sticky inner. Centered copy (eyebrow with 32px rules either side, "Visual *playground*", one line). Two columns of three square tiles (`min(260px,22vw)`, radius 24, `1px solid #1f1f1f`, each rotated −4°…+3°, blue gradient patterns on `#0d1015`), pinned at `left: 5vw` and `right: 5vw`, `top: 50%`, `pointer-events: none`, `will-change: transform`. On scroll through the section the left column rises and the right column sinks (parallax, about 0.9 × viewport height of travel), driven by `requestAnimationFrame` from the section's progress.
- **Reveals:** sections fade/rise in on first view (`IntersectionObserver`, `-60px` root margin, `translateY(28px)` → 0).
- **Marquee:** 40s linear loop; **featured ring:** `gradShift 6s`; **status dot:** `pulseDot 2s`; respect `prefers-reduced-motion` by freezing all of the above.

## Page structure in the design (for the Home page)
1. Hero: eyebrow "Klyvora — Web apps & AI workflows", serif H1, rotating role word, sub copy, primary "See the work" + secondary "Start a project ↗", background video (HLS via hls.js, Mux stock clip) + AI-workflow line animation, "Scroll" hint.
2. Services "Things I build": 5 cards (Custom web apps, AI workflow automation, Chatbots & agents, Websites & landing pages, AI harnesses & tooling).
3. Featured projects bento: OrderPoint (kiosk), Dispatch (AI intake-to-invoice), Hostline, Ledgerlight. Placeholders.
4. Process: Discover → Blueprint → Build → Run & improve.
5. Pricing "Honest numbers": Launch $1.5k+ / Build $5k+ (featured) / Automate $750/mo. Placeholder; replace with the real menu from `docs/PROJECT-BRIEF.md`.
6. Testimonials (3 cards), stats row, "Visual playground", Journal (3 posts), contact form (name, email, message) with social links.

## Writing rules
- "We", never "I". No lorem ipsum. No invented prices, statistics, testimonials or client names: use `[PLACEHOLDER]` until a real one exists. Prices come from `docs/PROJECT-BRIEF.md` and the offer catalog, nowhere else.
- Admin sample data is marked with a "Sample data" pill and placeholder names in brackets.

## Adapting it for the company site
- Keep: dark palette, Inter + Instrument Serif, pill nav, card radii, bento tiles, blue gradient accents, marquee, process section, honest-pricing framing.
- Change: H1 goes from a person's name to a Klyvora line; "I" → "we"; services map to the offer menu; pricing shows real setup + monthly; "Journal" becomes the blog later; testimonials come from real clients only.
- Mobile: the design was made desktop-first with a mobile pass; rebuild responsive with Tailwind breakpoints rather than copying inline styles.
