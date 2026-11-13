// SAMPLE DATA for /admin/settings until the back end ships its routes. People and contact details
// are bracketed placeholders; prices come from src/lib/offers.js (the back end reads them from the database).
//
// GET /api/admin/settings -> {
//   me: { id, name, role: "owner" | "builder" },                      // from the session, never from the client
//   values: { ...flat editable fields, see DEFAULT_VALUES },           // General, Targets, Outreach, Notifications
//   integrations: [{ name, use, status: "Connected" | "Key set" | "Not connected", tone }],
//   team: [{ id, name, email, role: "Owner" | "Builder" | "Agent", active, tfa: "On" | "Off" | "Key", human, pending? }],
//   catalog: [{ code, name, sub, setup, monthly, monthlyRequired, usage, changed }],   // dollars, whole numbers
//   history: [{ id, what, who, when, note, tone }],                                      // newest first
//   proposalTemplates: [{ id, name, sub, body, defaultBody, custom }],
//   emailTemplates: [{ id, name, sub, subject, body, defaultSubject, defaultBody, custom }],
//   lastRun: { started, found, skipped, errors }
// }
// PATCH /api/admin/settings
//   { values: { "general.name": "...", ... } }                 -> 200 { values }   (owner: any key; builder: notify.* only)
//   { template: { id, subject?, body } }                       -> 200 { template }  (owner only)
//   400 { error: { code: "invalid", message, fields: { [key]: message } } }   403 { error: { code: "owner_only", message } }
// POST /api/admin/settings/team  { action: "invite", email, role } -> 201 { member }
//   { action: "role", id, role } -> 200 { member }   { action: "remove", id, reassignTo } -> 200 { ok: true }
//   { action: "rotate-key" } -> 200 { rotatedAt }   (the new key is shown once, in the Cowork setup, never here)
// PATCH /api/admin/settings/catalog/[code]  { setup, monthly, note } -> 200 { offer, history }   (note required, owner only)

import { OFFERS } from "@/lib/offers";

export const DEFAULT_VALUES = {
  // General
  "general.name": "Klyvora",
  "general.email": "contact@klyvorastudio.com",
  "general.phone": "(919) 391-0982",
  "general.hours": "[Hours]",
  "general.address": "[MAILING ADDRESS]",
  // Targets (docs/PROJECT-BRIEF.md)
  "targets.signed": "20000",
  "targets.cash": "17000",
  "targets.mrr": "1500",
  "targets.prospects": "10",
  // Outreach
  "outreach.areas": "[NEIGHBORHOODS]",
  "outreach.types": "Barbers, salons, restaurants, detailers, boutiques",
  "outreach.signals": "No website, outdated site, marketplace-only booking or ordering, delivery apps only",
  "outreach.time": "08:00",
  "outreach.from": "[hello@klyvora.ai]",
  "outreach.cap": "10",
  "outreach.followup": true,
  "outreach.demo": true,
  "outreach.build": true,
  "outreach.dnc": "",
  // Notifications (each person sets their own)
  "notify.lead": true,
  "notify.reply": true,
  "notify.digest": true,
  "notify.overdue": true,
  "notify.ticket": true,
  "notify.signed": true,
  "notify.phone": "[Phone number]",
  "notify.quietFrom": "21:00",
  "notify.quietTo": "08:00",
};

// [min, max, message]. Used by the screen and by the stub route.
export const NUMBER_RULES = {
  "targets.signed": [1000, 1000000, "Whole dollars between 1,000 and 1,000,000."],
  "targets.cash": [0, 1000000, "Whole dollars, 0 or more."],
  "targets.mrr": [0, 100000, "Whole dollars, 0 or more."],
  "targets.prospects": [1, 50, "Between 1 and 50 a day."],
  "outreach.cap": [1, 50, "Between 1 and 50 a day."],
};

export function parseWhole(v) {
  const s = String(v ?? "");
  if (!/^\s*\$?[\d,]+\s*$/.test(s)) return NaN;
  return Number(s.replace(/[,$\s]/g, ""));
}

export function numberError(key, v) {
  const rule = NUMBER_RULES[key];
  if (!rule) return "";
  const n = parseWhole(v);
  return Number.isInteger(n) && n >= rule[0] && n <= rule[1] ? "" : rule[2];
}

export const NOTIFY_KEYS = Object.keys(DEFAULT_VALUES).filter((k) => k.startsWith("notify."));

export const INTEGRATIONS = [
  { name: "Stripe", use: "Klyvora invoices and monthly plans", status: "Connected", tone: "success" },
  { name: "Brevo", use: "Outreach and notification email", status: "Connected", tone: "success" },
  { name: "Neon + Prisma", use: "Database", status: "Connected", tone: "success" },
  { name: "Vercel", use: "Hosting and deploys", status: "Connected", tone: "success" },
  { name: "Cloudflare", use: "Images and video", status: "Connected", tone: "success" },
  { name: "Claude API", use: "Agent access, scoped to prospects and drafts", status: "Key set", tone: "accent" },
];

export const TEAM = [
  { id: "chris", name: "Chris [Last name]", email: "[email]", role: "Owner", active: "Now", tfa: "On", human: true },
  { id: "geoffrey", name: "Geoffrey Fylak", email: "[email]", role: "Builder", active: "Today", tfa: "On", human: true },
  { id: "demetrius", name: "Demetrius Brown", email: "[email]", role: "Builder", active: "Yesterday", tfa: "Off", human: true },
  { id: "claude", name: "Claude", email: "agent · API key", role: "Agent", active: "Today 08:06", tfa: "Key", human: false },
];

export const CATALOG = OFFERS.map((o) => ({
  code: o.code,
  name: o.name,
  sub: o.bestFor,
  setup: o.setup,
  monthly: o.monthly,
  monthlyRequired: !!o.monthlyRequired,
  usage: !!o.usage,
  changed: "—",
}));

export const HISTORY = [
  { id: "h1", what: "Website + Booking · $999 / $79", who: "Chris", when: "[date]", note: "Launch pricing from PROJECT-BRIEF.", tone: "accent" },
  { id: "h2", what: "Restaurant core · monthly required", who: "Chris", when: "[date]", note: "Ordering needs hosting, payments and support to keep running.", tone: "accent" },
  { id: "h3", what: "Catalog created · 10 offers", who: "Chris", when: "[date]", note: "Prices match PROJECT-BRIEF.", tone: "muted" },
];

const PROPOSAL = [
  {
    id: "scope-web",
    name: "Scope · websites (W1, W2)",
    sub: "Checklist pre-fill",
    body: "• Design from a Klyvora template, your colors and photos\n• Pages: {{pages}}\n• Contact form to your inbox\n• Hosting set up on your accounts\n• You own the site, the code and the data",
  },
  {
    id: "scope-booking",
    name: "Scope · booking (WB, BK)",
    sub: "Checklist pre-fill",
    body: "• Online booking with reminders by text and email\n• Your Stripe account for deposits\n• Staff and services set up with you\n• Booking admin on your phone",
  },
  {
    id: "scope-rest",
    name: "Scope · restaurants (RC, RK)",
    sub: "Monthly plan required",
    body: "• Menu and online ordering for pickup\n• Orders print or ping the kitchen\n• Monthly plan required: ordering needs hosting, payments and support to keep running\n• Kiosk: $299 per device, $29/mo per device",
  },
  {
    id: "terms",
    name: "Plain-words terms",
    sub: "Accordion on the proposal page",
    body: "Setup is paid 50% at kickoff, 30% at the working demo and 20% when you accept the launch.\nThe monthly plan is optional unless the proposal says required (restaurants). Skip it and you still own the site and the code.\nYou own your domain, content, data, Stripe account and the code. Klyvora templates are licensed, not sold.\nEither side can end the monthly plan with 30 days’ notice.",
  },
];
export const PROPOSAL_TEMPLATES = PROPOSAL.map((t) => ({ ...t, defaultBody: t.body, custom: false }));

const EMAIL = [
  {
    id: "outreach",
    name: "Outreach · first email",
    sub: "Claude’s draft starts from this; a person approves and sends",
    subject: "A quick look at {{business}}’s website",
    body: "Hi {{first_name}},\n\nWe build websites for {{category}} in Charlotte. We took a look at {{business}} and noticed {{signal}}.\n\nIf it helps, we can put together a working demo for free. No pressure either way.\n\n{{sender_name}}\nKlyvora · {{sender_phone}}",
  },
  {
    id: "followup",
    name: "Outreach · follow-up",
    sub: "After 3 days of silence",
    subject: "Re: A quick look at {{business}}’s website",
    body: "Hi {{first_name}},\n\nFloating this back up. The demo link still works: {{demo_link}}.\n\n{{sender_name}}",
  },
  {
    id: "proposal",
    name: "Proposal sent",
    sub: "With the /p/ link",
    subject: "Your Klyvora proposal · {{offer}}",
    body: "Hi {{first_name}},\n\nHere is the proposal we talked about: {{proposal_link}}\n\nIt spells out the price in three parts, what you own (everything) and the optional monthly plan. Sign on the page when you are ready; the kickoff invoice follows.\n\n{{sender_name}}",
  },
  {
    id: "magic",
    name: "Portal sign-in link",
    sub: "Magic link, 15 minutes",
    subject: "Your Klyvora sign-in link",
    body: "Hi {{first_name}},\n\nTap to sign in to your portal: {{magic_link}}\n\nThe link works once and expires in 15 minutes. If you didn’t ask for it, ignore this email.",
  },
  {
    id: "invoice",
    name: "Invoice",
    sub: "Sent and reminders",
    subject: "Invoice {{invoice_number}} · {{amount}} · {{business}}",
    body: "Hi {{first_name}},\n\nInvoice {{invoice_number}} for {{amount}} is ready: {{pay_link}}\n\nDue {{due_date}}. Receipts arrive by email once paid.\n\nKlyvora",
  },
  {
    id: "demo",
    name: "Demo approved",
    sub: "After the client approves",
    subject: "Demo approved · next up, launch",
    body: "Thanks {{first_name}}, the working demo is approved. The 30% invoice is on its way and we start the launch checklist today.\n\n{{sender_name}}",
  },
];
export const EMAIL_TEMPLATES = EMAIL.map((t) => ({ ...t, defaultSubject: t.subject, defaultBody: t.body, custom: false }));

// Values used for the template preview. Real values fill from the record when the email or proposal is created.
export const PREVIEW_VARS = {
  business: "[Business name]",
  first_name: "[First name]",
  category: "barbershops",
  signal: "bookings only through Instagram DMs",
  sender_name: "Chris",
  sender_phone: "(919) 391-0982",
  demo_link: "klyvora.ai/demo/[id]",
  offer: "Website + Booking",
  proposal_link: "klyvora.ai/p/[token]",
  magic_link: "klyvora.ai/portal/sign-in?token=…",
  invoice_number: "INV-0012",
  amount: "$499.50",
  pay_link: "klyvora.ai/pay/[id]",
  due_date: "[Date]",
  pages: "Home, Services, About, Contact",
};

export const LAST_RUN = { started: "Today 08:00 · 6 min", found: "10 · 4 drafts waiting for approval", skipped: "3 on the do-not-contact list", errors: "None" };

export function getSettings() {
  return {
    me: { id: "chris", name: "Chris", role: "owner" },
    values: DEFAULT_VALUES,
    integrations: INTEGRATIONS,
    team: TEAM,
    catalog: CATALOG,
    history: HISTORY,
    proposalTemplates: PROPOSAL_TEMPLATES,
    emailTemplates: EMAIL_TEMPLATES,
    lastRun: LAST_RUN,
  };
}
