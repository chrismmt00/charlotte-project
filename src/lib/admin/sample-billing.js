// SAMPLE DATA for /admin/invoices and /admin/subscriptions until the back end ships the routes.
// Every name is a bracketed placeholder. Shapes below are the contract the back end must return.
//
// Money is whole dollars here for display. The API and database store cents (amountCents, priceCents,
// usageCents) and the UI divides by 100. The Stripe invoice is the source of truth for amounts and status.
//
// GET /api/admin/invoices?status=Draft|Due|Overdue|Paid -> { invoices: Invoice[], today }
// Invoice: {
//   id, number, clientId, client, forLabel, kind: "milestone" | "hardware" | "monthly" | "add-on" | "custom",
//   due: "YYYY-MM-DD" | null, amount: number | null (null = hardware quote not in yet),
//   paid: number (part-payments recorded), status: "Draft" | "Due" | "Overdue" | "Paid",
//   trigger, billingEmail, stripe, lines: [{ description, note, amount }],
//   history: [{ when, text }], plan: null | { count, firstOn, every: "2 weeks" | "Month", autoCharge }
// }
// POST /api/admin/invoices { clientId, kind, lines: [{ description, qty, unit }], due, memo, methods, sendNow }
//   -> 201 { invoice }
// POST /api/admin/invoices/[id]/send { to, template, copyMe } -> 200 { invoice }   (draft -> Due, or a reminder)
// POST /api/admin/invoices/[id]/payments
//   { kind: "manual", amount, method, receivedOn, reference?, note? } -> 200 { invoice }
//   { kind: "plan", count, firstOn, every, autoCharge }              -> 200 { invoice }
// PATCH /api/admin/invoices/[id] { status: "void" } -> 200 { invoice }
//
// GET /api/admin/subscriptions?status=... -> { subscriptions: Subscription[] }
// Subscription: {
//   id, client, clientId, since, planLabel, offerCode, price (monthly), usage (this month, dollars),
//   status: "Active" | "Starts at launch" | "Past due" | "Paused" | "Canceled", required: boolean,
//   next: "YYYY-MM-DD" | "on launch" | null, card, includes, optionalNote,
//   usageRows: [{ label, amount }], charges: [{ when, what, amount, tone }]
// }
// POST /api/admin/subscriptions/[id]/cancel { when: "period-end" | "now", reason, handoverPack, acknowledgedRequired? }
//   -> 200 { subscription }   400 when a required (restaurant) plan is canceled without acknowledgedRequired
// PATCH /api/admin/subscriptions/[id] { action: "retry" | "pause" | "resume" | "card-link" } -> 200 { subscription }

import { SAMPLE_TODAY } from "@/lib/admin/sample-projects";

export { SAMPLE_TODAY };

export const INVOICE_STATUSES = ["Draft", "Due", "Overdue", "Paid"];
export const BILLING_EMAIL = "billing@example.com";
export const INVOICE_TARGET = 17000;

export const INVOICE_CLIENTS = ["Food truck [6]", "Braids studio [7]", "Studio [9]", "Bakery [5]", "Detailing [4]"];

function inv(number, client, forLabel, kind, due, amount, status, trigger, extra = {}) {
  const split = forLabel.split(" · ");
  return {
    id: `inv_${number.slice(4)}`,
    number,
    client,
    forLabel,
    kind,
    due,
    amount,
    paid: status === "Paid" ? amount : 0,
    status,
    trigger,
    billingEmail: BILLING_EMAIL,
    stripe: "in_[…]",
    lines: amount == null
      ? [{ description: "Kiosk hardware · [vendor] stand + tablet", note: "quantity 1 · awaiting vendor quote", amount: null }]
      : [{ description: split[0], note: split[1] || "", amount }],
    history: [{ when: "[date]", text: `Created from ${trigger.toLowerCase()}` }],
    plan: null,
    ...extra,
  };
}

const sent = (text = `Sent to ${BILLING_EMAIL} · opened twice`) => ({ when: "[date]", text });

export const INVOICES = [
  inv("INV-0013", "Food truck [6]", "Kiosk hardware · 100% before order", "hardware", null, null, "Draft", "Vendor quote accepted"),
  inv("INV-0014", "Braids studio [7]", "Website + Booking · working demo 30%", "milestone", null, 300, "Draft", "Client accepts the demo"),
  inv("INV-0012", "Studio [9]", "Standard Website · working demo 30%", "milestone", "2026-11-17", 450, "Due", "Client accepts the demo", {
    history: [{ when: "[date]", text: "Created from client accepts the demo" }, sent()],
  }),
  inv("INV-0011", "Food truck [6]", "Restaurant core + 1 kiosk · kickoff 50%", "milestone", "2026-11-04", 899, "Overdue", "Signed proposal", {
    history: [
      { when: "[date]", text: "Created from signed proposal" },
      sent(),
      { when: "[date]", text: "Due date passed · reminder scheduled" },
    ],
  }),
  inv("INV-0010", "Bakery [5]", "Ecommerce store · monthly plan", "monthly", "2026-11-01", 99, "Paid", "Monthly plan · Stripe subscription", {
    history: [{ when: "[date]", text: "Created from monthly plan · stripe subscription" }, sent(), { when: "[date]", text: "Paid · card via Stripe" }],
  }),
  inv("INV-0009", "Detailing [4]", "Starter Website · monthly plan", "monthly", "2026-10-18", 49, "Paid", "Monthly plan · Stripe subscription", {
    history: [{ when: "[date]", text: "Created from monthly plan · stripe subscription" }, sent(), { when: "[date]", text: "Paid · card via Stripe" }],
  }),
  inv("INV-0008", "Braids studio [7]", "Website + Booking · kickoff 50%", "milestone", "[date]", 500, "Paid", "Signed proposal", {
    history: [{ when: "[date]", text: "Created from signed proposal" }, sent(), { when: "[date]", text: "Paid · card via Stripe" }],
  }),
  inv("INV-0007", "Studio [9]", "Standard Website · kickoff 50%", "milestone", "[date]", 750, "Paid", "Signed proposal", {
    history: [{ when: "[date]", text: "Created from signed proposal" }, sent(), { when: "[date]", text: "Paid · card via Stripe" }],
  }),
];

export const NEXT_INVOICE_NUMBER = 15;

export function getInvoicesPayload() {
  return { invoices: INVOICES, today: SAMPLE_TODAY };
}

/* ---------- Subscriptions ---------- */

export const SUB_STATUSES = ["Active", "Starts at launch", "Past due", "Paused", "Canceled"];

const USAGE_ROWS = [
  { label: "412 texts × $0.015", amount: 6.18 },
  { label: "18 call minutes × $0.09", amount: 1.62 },
  { label: "Carrier fees", amount: 0.44 },
];

export const SUBSCRIPTIONS = [
  {
    id: "sub_bakery5",
    client: "Bakery [5]",
    since: "[date]",
    planLabel: "Ecommerce store · EC",
    offerCode: "EC",
    price: 99,
    usage: 0,
    status: "Active",
    required: false,
    next: "2026-12-01",
    card: "Visa ···· [4242]",
    includes: "Hosting, store admin, support, updates",
    optionalNote: "Yes · cancel keeps the store code; checkout then needs their own Stripe and hosting",
    usageRows: [],
    charges: [
      { when: "2026-12-01", what: "upcoming", amount: 99, tone: "muted" },
      { when: "[date]", what: "paid", amount: 99, tone: "fg" },
      { when: "[date]", what: "paid", amount: 99, tone: "fg" },
    ],
  },
  {
    id: "sub_detailing4",
    client: "Detailing [4]",
    since: "[date]",
    planLabel: "Starter Website · W1",
    offerCode: "W1",
    price: 49,
    usage: 0,
    status: "Active",
    required: false,
    next: "2026-11-18",
    card: "Mastercard ···· [4444]",
    includes: "Hosting, site admin, support",
    optionalNote: "Yes · cancel keeps the site",
    usageRows: [],
    charges: [
      { when: "2026-11-18", what: "upcoming", amount: 49, tone: "muted" },
      { when: "[date]", what: "paid", amount: 49, tone: "fg" },
      { when: "[date]", what: "paid", amount: 49, tone: "fg" },
    ],
  },
  {
    id: "sub_foodtruck6",
    client: "Food truck [6]",
    since: "[date]",
    planLabel: "Restaurant core + 1 kiosk · RK",
    offerCode: "RK",
    price: 178,
    usage: 0,
    status: "Starts at launch",
    required: true,
    next: "on launch",
    card: "none yet",
    includes: "Hosting, ordering, menu updates, kiosk device plan ($29), support",
    optionalNote: "No · required for restaurants: ordering and menu updates run on our admin",
    usageRows: [],
    charges: [{ when: "on launch", what: "first charge", amount: 178, tone: "muted" }],
  },
  {
    id: "sub_ai1",
    client: "[AI client]",
    since: "[date]",
    planLabel: "AI automation · AI",
    offerCode: "AI",
    price: 49,
    usage: 8,
    status: "Past due",
    required: false,
    next: "2026-11-04",
    card: "Visa ···· [0341] · declined",
    includes: "Text-back agent, booking hand-off, support",
    optionalNote: "Yes · cancel stops the agent; their number stays theirs",
    usageRows: USAGE_ROWS,
    charges: [
      { when: "2026-11-04", what: "declined", amount: 57, tone: "danger" },
      { when: "[date]", what: "paid", amount: 49, tone: "fg" },
      { when: "[date]", what: "paid", amount: 49, tone: "fg" },
    ],
  },
  {
    id: "sub_braids7",
    client: "Braids studio [7]",
    since: "[date]",
    planLabel: "Website + Booking · WB",
    offerCode: "WB",
    price: 79,
    usage: 0,
    status: "Starts at launch",
    required: false,
    next: "on launch",
    card: "Visa ···· [4242]",
    includes: "Hosting, booking admin, reminders, support",
    optionalNote: "Yes · cancel keeps the site; booking then needs their own hosting",
    usageRows: [],
    charges: [{ when: "on launch", what: "first charge", amount: 79, tone: "muted" }],
  },
  {
    id: "sub_studio9",
    client: "Studio [9]",
    since: "[date]",
    planLabel: "Standard Website · W2",
    offerCode: "W2",
    price: 0,
    usage: 0,
    status: "Canceled",
    required: false,
    next: null,
    card: "—",
    includes: "Self-managed · takes the code at launch",
    optionalNote: "They never started a plan",
    usageRows: [],
    charges: [],
  },
];

export function getSubscriptionsPayload() {
  return { subscriptions: SUBSCRIPTIONS };
}
