# Klyvora design system

Source: Chris's "Klyvora Portfolio" project in Claude Design (`Klyvora Portfolio.dc.html`, last edited Jul 14, 2026). Read Nov 5, 2026. The design is a one-page dark portfolio; the company site keeps its look and swaps the content for Klyvora's offers. Tokens live in `src/app/globals.css`; fonts load in `src/app/layout.js`.

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
| `success` | `#4ade80` | "Available" pulse dot |

Gradients: brand mark `linear-gradient(135deg,#89AACC,#4E85BF)`; featured-card ring `linear-gradient(90deg,#89AACC,#4E85BF,#89AACC)` at `background-size:200% 100%` animated (`gradShift 6s`). Project tiles use radial/conic blue washes (`rgba(137,170,204,.38)`, `rgba(78,133,191,.3)`) over `#0d1015`.

Glass nav: `rgba(20,20,20,.72)` + `backdrop-filter: blur(14px)` + `1px solid rgba(255,255,255,.08)` + `0 8px 30px rgba(0,0,0,.35)`.

## Type
- **Body/UI:** Inter, antialiased. 13px nav, 14px buttons/body-small, 15px hero sub (line-height 1.7, max-width 480px), 21px/500 card titles, 20px/500 step titles.
- **Display:** Instrument Serif, italic, 400. H1 `clamp(60px,10vw,144px)`, line-height .92, letter-spacing -.02em. H2 `clamp(36px,5vw,58px)`, weight 400, line-height 1.05, letter-spacing -.01em.
- **Eyebrow:** 11px, uppercase, letter-spacing .3em, muted.
- Headline style: one short serif line, lowercase feel ("Things I build", "Honest numbers", "Let's build yours.").

## Shape and spacing
- Radii: pills `999px` (buttons, nav, nav links); cards `24px` (services) / `26px` (pricing, testimonials) / `28px` (project tiles, featured ring); inputs `14px`; brand mark circle 36px.
- Section padding `110px 24px 40px` (stats `100px 24px`); content `max-width:1200px; margin:0 auto`.
- Grids: services 6-column, cards span 2, gap 18px; projects 12-column bento (span 7 / span 5, aspect 16/10), testimonials 3-column gap 20px; contact form 2-column with full-width submit.
- Transitions `all .25s–.35s ease`; hover lifts and glows, no color changes except links → accent-light.

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

## Page structure in the design (for the Home page)
1. Hero: eyebrow "Klyvora — Web apps & AI workflows", serif H1, rotating role word, sub copy, primary "See the work" + secondary "Start a project ↗", background video (HLS via hls.js, Mux stock clip) + AI-workflow line animation, "Scroll" hint.
2. Services "Things I build": 5 cards (Custom web apps, AI workflow automation, Chatbots & agents, Websites & landing pages, AI harnesses & tooling).
3. Featured projects bento: OrderPoint (kiosk), Dispatch (AI intake-to-invoice), Hostline, Ledgerlight. Placeholders.
4. Process: Discover → Blueprint → Build → Run & improve.
5. Pricing "Honest numbers": Launch $1.5k+ / Build $5k+ (featured) / Automate $750/mo. Placeholder; replace with the real menu from `docs/PROJECT-BRIEF.md`.
6. Testimonials (3 cards), stats row, "Visual playground", Journal (3 posts), contact form (name, email, message) with social links.

## Adapting it for the company site
- Keep: dark palette, Inter + Instrument Serif, pill nav, card radii, bento tiles, blue gradient accents, marquee, process section, honest-pricing framing.
- Change: H1 goes from a person's name to a Klyvora line; "I" → "we"; services map to the offer menu; pricing shows real setup + monthly; "Journal" becomes the blog later; testimonials come from real clients only.
- Mobile: the design was made desktop-first with a mobile pass; rebuild responsive with Tailwind breakpoints rather than copying inline styles.
