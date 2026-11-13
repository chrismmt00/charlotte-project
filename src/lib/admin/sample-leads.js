// SAMPLE DATA for /admin/leads and /admin/leads/[id] until the back end ships its routes.
// Every name is a bracketed placeholder. The list rows come from LEADS in ./sample.js (ids ld_1…ld_10)
// so dashboard links resolve; this file adds the fields the lead screens need.
//
// GET /api/admin/leads -> { leads: LeadRow[] }
//   LeadRow: { id, business, name, email, phone, offerCode, offer, source, status, score, owner, next, when, ageHours, message }
// GET /api/admin/leads/[id] -> { lead: LeadDetail }
//   LeadDetail: LeadRow & {
//     address, site, siteUrl, hours, campaign, page, notes, notesSavedAt,
//     nextAction: { type, date: "YYYY-MM-DD", time: "HH:MM", owner, note } | null,
//     activity: { id, kind: "status"|"call"|"email"|"note"|"check", title, meta, body }[]   (newest first),
//     siteCheck: { url, ranAt, by, items: { label, pass, note }[] } | null,
//     proposals: { id, title, offerCode, status: "Draft"|"Sent"|"Accepted", meta }[]
//   }

import { LEADS, LEAD_STATUSES } from "./sample";

export { LEAD_STATUSES };

// People who can own a lead. Claude owns leads it is drafting for; a person approves anything it sends.
export const OWNERS = ["Chris", "Geoffrey", "Demetrius", "Claude"];
export const OWNER_INITIALS = { Chris: "C", Geoffrey: "G", Demetrius: "D", Claude: "AI" };

export const LEAD_SOURCES = ["Site form", "Estimator", "Check my site", "Walk-in", "Referral", "Phone call", "Instagram", "Google", "Event", "Partner", "Outreach", "Workbook import", "Other"];

export const STATUS_HELP = {
  New: "Came in, nobody has reached out yet.",
  Contacted: "We called, emailed or texted at least once.",
  "Demo booked": "A demo or visit is on the calendar.",
  "Proposal sent": "They have a proposal link; waiting on them.",
  Signed: "Deposit paid or contract signed — convert to client.",
  Lost: "Not happening now; keep the reason for the next pitch.",
};

// Dot colour per status (Tailwind classes on the shared tokens).
export const STATUS_DOT = {
  New: "bg-accent-light",
  Contacted: "bg-muted-2",
  "Demo booked": "bg-accent",
  "Proposal sent": "bg-fg",
  Signed: "bg-success",
  Lost: "bg-muted",
};

export const NEXT_TYPES = ["Call back", "Send email", "Demo", "Follow up", "Send proposal", "Site visit"];

const EXTRA = {
  ld_1: {
    ageHours: 2,
    message: "Booking by DM is eating my evenings. Want deposits and reminders on my own site.",
    site: "[barbershop1.example]",
    hours: "Tue–Sat 9–7 · closed Sun, Mon",
    page: "/contact?offer=WB",
    notes: "Wants to keep his domain. Brother does his Instagram.",
    notesSavedAt: "14:02 by Chris",
    nextAction: { type: "Call back", date: "2026-11-12", time: "10:00", owner: "Chris", note: "" },
    activity: [
      { kind: "note", title: "Note", meta: "14:02 · Chris", body: "Wants to keep his domain. Brother does his Instagram — loop him in for photos." },
      { kind: "call", title: "Call · Voicemail · 1 min", meta: "40 min ago · Chris", body: "Left a voicemail mentioning the email. Try again after 7pm when the shop closes." },
      { kind: "status", title: "Status · New → Contacted", meta: "1h ago · Chris", body: "" },
      { kind: "email", title: "Email sent · “Your booking page, done in a week”", meta: "1h ago · Chris · opened 2×", body: "Intro, the three findings from the check, demo offer for Thursday. Template: Intro + demo." },
      { kind: "check", title: "Claude ran Check my site", meta: "2h ago · automatic", body: "No booking found on [barbershop1.example]; 4.1s on mobile; Google profile not linked. Suggested offer: Website + Booking." },
      { kind: "status", title: "Lead received · New", meta: "2h ago · Site form · /contact?offer=WB", body: "Booking by DM is eating my evenings. Want deposits and reminders on my own site." },
    ],
    siteCheck: {
      url: "[barbershop1.example]",
      ranAt: "2h ago",
      by: "Claude",
      items: [
        { label: "Online booking", pass: false, note: "None found — booking happens by DM" },
        { label: "Loads fast on a phone", pass: false, note: "4.1s to first content on 4G" },
        { label: "Secure (HTTPS)", pass: true, note: "Certificate valid" },
        { label: "Hours and address listed", pass: true, note: "Matches Google" },
        { label: "Google Business Profile linked", pass: false, note: "Profile exists, no website link" },
        { label: "Contact form works", pass: false, note: "Form posts to a dead address" },
      ],
    },
    proposals: [],
  },
  ld_2: {
    ageHours: 5,
    message: "On two delivery apps. Want our own ordering and a kiosk for the lunch line.",
    site: "Delivery apps only",
    hours: "Mon–Sat 11–9",
    page: "/contact?offer=RC",
    notes: "Lunch line is the pain. Ask about the kiosk at the demo.",
    notesSavedAt: "yesterday by Chris",
    nextAction: { type: "Demo", date: "2026-11-13", time: "15:00", owner: "Chris", note: "Bring the ordering demo on the tablet" },
    activity: [
      { kind: "status", title: "Status · Contacted → Demo booked", meta: "Today · Chris", body: "" },
      { kind: "call", title: "Call · Answered · 12 min", meta: "Today · Chris", body: "Booked the demo for Thursday 3:00. Wants to see kiosk orders landing in the same queue." },
      { kind: "status", title: "Lead received · New", meta: "Today · Referral", body: "On two delivery apps. Want our own ordering and a kiosk for the lunch line." },
    ],
    siteCheck: null,
    proposals: [{ id: "pr_d2", title: "Restaurant core · proposal v1", offerCode: "RC", status: "Draft", meta: "edited today by Chris" }],
  },
  ld_3: {
    ageHours: 26,
    message: "Have a site already. Booking still happens by text.",
    site: "[nailsalon3.example]",
    hours: "Tue–Sun 10–7",
    page: "/contact?offer=BK",
    nextAction: { type: "Follow up", date: "2026-11-14", time: "11:00", owner: "Geoffrey", note: "" },
    activity: [
      { kind: "email", title: "Email sent · “Booking on the site you already have”", meta: "Yesterday · Geoffrey", body: "Short intro and a demo offer." },
      { kind: "status", title: "Status · New → Contacted", meta: "Yesterday · Geoffrey", body: "" },
      { kind: "status", title: "Lead received · New", meta: "Yesterday · Instagram", body: "Have a site already. Booking still happens by text." },
    ],
  },
  ld_4: {
    ageHours: 30,
    message: "Just need a page with services, prices and a way to reach me.",
    site: "None · Facebook page",
    nextAction: { type: "Send email", date: "2026-11-13", time: "09:30", owner: "Demetrius", note: "" },
  },
  ld_5: {
    ageHours: 72,
    message: "Pre-orders for weekends and holidays.",
    site: "[bakery5.example]",
    hours: "Wed–Sun 7–3",
    page: "/contact?offer=EC",
    nextAction: { type: "Follow up", date: "2026-11-12", time: "14:00", owner: "Chris", note: "Ask if the proposal was opened" },
    activity: [
      { kind: "email", title: "Proposal sent · Ecommerce store", meta: "3d ago · Chris · opened twice", body: "" },
      { kind: "status", title: "Status · Demo booked → Proposal sent", meta: "3d ago · Chris", body: "" },
      { kind: "note", title: "Note", meta: "4d ago · Chris", body: "Walked in on a Saturday. Sells out of pre-orders by noon." },
      { kind: "status", title: "Lead received · New", meta: "4d ago · Walk-in", body: "Pre-orders for weekends and holidays." },
    ],
    proposals: [
      { id: "pr_d5", title: "Ecommerce store · proposal v1", offerCode: "EC", status: "Sent", meta: "sent 3d ago · opened twice" },
    ],
  },
  ld_6: {
    ageHours: 168,
    message: "Catering and a lunch line. Need our own ordering and one kiosk.",
    nextAction: { type: "Demo", date: "2026-11-17", time: "10:00", owner: "Geoffrey", note: "Kickoff call" },
    proposals: [{ id: "pr_d6", title: "Restaurant core + 1 kiosk · proposal", offerCode: "RK", status: "Accepted", meta: "accepted 1w ago" }],
  },
  ld_7: {
    ageHours: 170,
    message: "Booking by DM. Want deposits for long appointments.",
    nextAction: { type: "Send email", date: "2026-11-13", time: "12:00", owner: "Chris", note: "Content checklist" },
    proposals: [{ id: "pr_d7", title: "Website + Booking · proposal", offerCode: "WB", status: "Accepted", meta: "accepted 1w ago" }],
  },
  ld_8: {
    ageHours: 48,
    message: "Ran Check my site. Selling through DMs and Cash App; ready for a real store.",
    site: "[boutique8.example]",
    nextAction: { type: "Send email", date: "2026-11-13", time: "16:00", owner: "Demetrius", note: "Send the site-check report" },
  },
  ld_9: {
    ageHours: 96,
    message: "Used the estimator. Booking by text; want reminders.",
    nextAction: { type: "Call back", date: "2026-11-16", time: "10:00", owner: "Geoffrey", note: "" },
  },
  ld_10: {
    ageHours: 336,
    message: "Went with a POS bundle instead.",
    nextAction: null,
    activity: [
      { kind: "status", title: "Status · Contacted → Lost", meta: "2w ago · Chris", body: "Reason: went with someone else (POS bundle)." },
      { kind: "status", title: "Lead received · New", meta: "2w ago · Workbook import", body: "" },
    ],
  },
};

function num(id) {
  return id.replace("ld_", "");
}

function withExtra(l) {
  const x = EXTRA[l.id] || {};
  const n = num(l.id);
  return {
    ...l,
    email: `[owner${n}@example.com]`,
    phone: "[Phone]",
    ageHours: x.ageHours ?? 0,
    message: x.message || "",
  };
}

// GET /api/admin/leads
export function listLeads() {
  return LEADS.map(withExtra);
}

// GET /api/admin/leads/[id]
export function getLead(id) {
  const base = LEADS.find((l) => l.id === id);
  if (!base) return null;
  const row = withExtra(base);
  const x = EXTRA[id] || {};
  return {
    ...row,
    address: "[Street] · Charlotte, NC [ZIP]",
    site: x.site || "[website]",
    hours: x.hours || "[Hours]",
    campaign: "[campaign]",
    page: x.page || `/contact?offer=${row.offerCode}`,
    notes: x.notes || "",
    notesSavedAt: x.notesSavedAt || "",
    nextAction: x.nextAction === undefined ? null : x.nextAction,
    activity: (x.activity || [{ kind: "status", title: "Lead received · New", meta: `${row.when} · ${row.source}`, body: row.message }]).map((a, i) => ({ id: `${id}_a${i}`, ...a })),
    siteCheck: x.siteCheck || null,
    proposals: x.proposals || [],
  };
}

// Plain email for mailto: links (placeholders keep their brackets on screen).
export function plainEmail(e) {
  return (e || "").replace(/[[\]]/g, "");
}
