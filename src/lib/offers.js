// The offer catalog. Source of truth: docs/PROJECT-BRIEF.md "Pricing".
// The back end will replace this with GET /api/offers (Prisma) and must keep the same shape:
// { code, slug, name, setup, setupFrom, monthly, monthlyNote, monthlyRequired, usage, bestFor, summary, includes[], addOns[] }
// Dollars are whole numbers here for display; the database stores cents.

export const ADD_BOOKING_LATER = { setup: 500, monthly: 30 };

export const RESTAURANT_ADD_ONS = [
  { code: "KIOSK", name: "Kiosk application", setup: 299, setupNote: "per device", monthly: 29, monthlyNote: "per device" },
  { code: "APP", name: "Branded customer mobile app", setup: 1499, setupFrom: true, monthly: 49 },
  { code: "STAFF", name: "Employee management", setup: 499, monthly: 29 },
  { code: "KITCHEN", name: "Kitchen operations", setup: 299, monthly: 29 },
  { code: "INVENTORY", name: "Basic inventory", setup: 499, monthly: 39 },
  { code: "LOYALTY", name: "Loyalty and retention", setup: 299, monthly: 19 },
];

export const BILLED_SEPARATELY = [
  "Hardware, paid in full before we order it",
  "Onsite installation and travel",
  "Payment processing, paid to Stripe",
  "Delivery services",
  "Third-party subscriptions",
  "AI and messaging usage",
];

export const MILESTONES = [
  { percent: 50, when: "at kickoff" },
  { percent: 30, when: "at a working demo you approve" },
  { percent: 20, when: "when you accept the launch" },
];

export const OFFERS = [
  {
    code: "W1",
    slug: "websites",
    name: "Starter Website",
    setup: 499,
    monthly: 49,
    monthlyNote: "hosting and admin",
    monthlyRequired: false,
    bestFor: "No site yet, social-only, or a Linktree",
    summary: "A landing page or a few pages, no booking or payments. For being found and reached.",
    includes: [
      "Landing page or up to 5 pages",
      "Contact form, map, hours, reviews",
      "Mobile-first and fast",
      "Your domain and content stay yours",
    ],
    addOns: ["Add booking later: +$500 setup, +$30/month"],
  },
  {
    code: "W2",
    slug: "websites",
    name: "Standard Website",
    setup: 1499,
    monthly: 49,
    monthlyNote: "hosting and admin",
    monthlyRequired: false,
    bestFor: "An established business with an outdated or broken site",
    summary: "A full site with [PAGE CAP] pages and [ROUNDS] design rounds, built around how customers find you.",
    includes: [
      "[PAGE CAP] pages, [ROUNDS] design rounds",
      "Copy help and photo direction",
      "Local search basics and analytics",
      "The site and its code are yours on final payment",
    ],
    addOns: ["Add booking later: +$500 setup, the monthly moves to $79"],
  },
  {
    code: "WB",
    slug: "booking",
    name: "Website + Booking",
    setup: 999,
    monthly: 79,
    monthlyNote: "hosting, admin and booking",
    monthlyRequired: false,
    featured: true,
    bestFor: "Appointment businesses booking by DM or on a marketplace",
    summary: "A Starter site with online booking: deposits through your own Stripe, reminders, your calendar.",
    includes: [
      "Starter site plus online booking",
      "Deposits through your own Stripe account",
      "Text and email reminders",
      "No-show protection and your own calendar",
    ],
    addOns: [],
  },
  {
    code: "BK",
    slug: "booking",
    name: "Booking add-on",
    setup: 799,
    monthly: 79,
    monthlyNote: "booking and admin",
    monthlyRequired: false,
    bestFor: "A decent site someone else built, with call or DM-only booking",
    summary: "Keep the site you have and add booking to it.",
    includes: [
      "Booking added to your existing site",
      "Deposits through your own Stripe account",
      "Text and email reminders",
    ],
    addOns: [],
  },
  {
    code: "EC",
    slug: "ecommerce",
    name: "Ecommerce store",
    setup: 999,
    monthly: 99,
    monthlyNote: "hosting, admin and store",
    monthlyRequired: false,
    bestFor: "Products sold by DM or Cash App, with no store",
    summary: "A small store for what you sell today. Checkout runs through your own Stripe account; we take nothing per order.",
    includes: [
      "Product catalog and checkout",
      "Checkout through your own Stripe account",
      "Order emails and simple inventory counts",
      "No per-order fees from us",
    ],
    addOns: [],
  },
  {
    code: "RC",
    slug: "restaurants",
    name: "Restaurant core",
    setup: 1499,
    monthly: 149,
    monthlyNote: "platform and support",
    monthlyRequired: true,
    bestFor: "No direct ordering, or delivery apps only",
    summary: "Your site, menu admin and online ordering on one system, with staff roles and reports.",
    includes: [
      "Site, menu admin and online ordering",
      "Customer records, staff roles, reports",
      "Mobile-friendly ordering included",
      "No delivery-app commissions on your own orders",
    ],
    addOns: ["Self-serve kiosk: +$299 and +$29/month per device"],
  },
  {
    code: "RK",
    slug: "restaurants",
    name: "Restaurant core + 1 kiosk",
    setup: 1798,
    monthly: 178,
    monthlyNote: "platform, kiosk and support",
    monthlyRequired: true,
    bestFor: "Counter service with lines",
    summary:
      "Restaurant core plus one self-serve kiosk ($1,499 + $299, $149 + $29). Each extra kiosk is another $299 and $29/month.",
    includes: ["Everything in Restaurant core", "One kiosk application", "Kiosk orders land in the same kitchen queue"],
    addOns: ["Each extra kiosk: +$299 and +$29/month"],
  },
  {
    code: "AI",
    slug: "ai",
    name: "AI automation",
    setup: 499,
    monthly: 49,
    monthlyNote: "plus usage",
    monthlyRequired: false,
    usage: true,
    bestFor: "A good site, but follow-ups done by hand",
    summary:
      "One narrow job handled by an agent with guardrails and a human handoff: missed-call text-back, review requests, intake.",
    includes: ["One automation, set up and tested", "Guardrails and a human handoff", "Usage billed at cost, shown monthly"],
    addOns: [],
  },
  {
    code: "AH",
    slug: "ai",
    name: "Custom AI harness",
    setup: 1499,
    setupFrom: true,
    monthly: 99,
    monthlyNote: "plus usage",
    monthlyRequired: false,
    usage: true,
    bestFor: "One workflow run by an agent wired to your tools",
    summary: "An agent connected to your tools with permissions, logs and testing. The client-specific workflow is yours.",
    includes: ["One workflow, permissions and logs", "Testing before it touches customers", "Founding price for the first few clients"],
    addOns: [],
  },
  {
    code: "CA",
    slug: "custom",
    name: "Custom web application",
    setup: 2499,
    setupFrom: true,
    monthly: 99,
    monthlyNote: "hosting and care",
    monthlyRequired: false,
    bestFor: "One focused workflow with login",
    summary: "One focused workflow with login, roles and a dashboard. Fixed quote, and the custom code is yours.",
    includes: [
      "Login, roles and a dashboard",
      "Fixed quote before we start",
      "The custom code is yours on final payment",
      "Founding price for the first few clients",
    ],
    addOns: [],
  },
];

export const SERVICE_GROUPS = [
  {
    slug: "websites",
    name: "Websites",
    title: "A site that answers the questions customers call about.",
    lede: "Fast, mobile-first, and yours. Start with a landing page or go straight to a full site.",
  },
  {
    slug: "booking",
    name: "Online booking",
    title: "Bookings and deposits on your own site.",
    lede: "Stop taking appointments in DMs or paying a marketplace for your own regulars.",
  },
  {
    slug: "ecommerce",
    name: "Ecommerce",
    title: "A store for what you already sell.",
    lede: "Turn DM and Cash App orders into a checkout that runs through your own Stripe account.",
  },
  {
    slug: "restaurants",
    name: "Restaurant ordering and kiosks",
    title: "Your menu, ordering and kiosks on one system.",
    lede: "Own the ordering channel instead of renting it from a delivery app.",
  },
  {
    slug: "ai",
    name: "AI automation",
    title: "The follow-ups you never get to, handled.",
    lede: "Narrow, tested automations with guardrails and a person to hand off to.",
  },
  {
    slug: "custom",
    name: "Custom web apps",
    title: "One workflow, built properly.",
    lede: "Login, roles and a dashboard for the job a spreadsheet can't do anymore.",
  },
];

export function money(n) {
  return "$" + Number(n).toLocaleString("en-US");
}

export function setupLabel(o) {
  return (o.setupFrom ? "from " : "") + money(o.setup) + (o.setupNote ? " " + o.setupNote : "");
}

export function monthlyLabel(o) {
  if (o.monthly == null) return "";
  let s = money(o.monthly) + "/mo";
  if (o.usage) s += " + usage";
  if (o.monthlyNote && o.monthlyNote.startsWith("per")) s += " " + o.monthlyNote;
  return s;
}

export function offersFor(slug) {
  return OFFERS.filter((o) => o.slug === slug);
}

export function getOffer(code) {
  return OFFERS.find((o) => o.code === code) || null;
}

export function getGroup(slug) {
  return SERVICE_GROUPS.find((g) => g.slug === slug) || null;
}
