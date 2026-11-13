// Client portal sample data, shaped the way the back end should return it.
// Every price comes from src/lib/offers.js; nothing here invents a number.
//
// GET /api/portal/project  -> { client, project, checklist, files, team }
// GET /api/portal/invoices -> { invoices, card, plan }
// GET /api/portal/tickets  -> { tickets, hours }
// The portal shows the signed-in contact's one project. Bracketed values are placeholders.

import { getOffer, MILESTONES } from "@/lib/offers";

export const STAGES = ["kickoff", "demo", "launch", "accepted"];

export const CLIENT = {
  id: "cl_007",
  business: "Braids studio [7]",
  kind: "booking", // booking | restaurant | store
  firstName: "[First name]",
  signerName: "[First name] [Last name]",
  email: "[you@business.com]",
  phone: "[Client phone]",
};

export const PROJECT = {
  id: "pr_007",
  offerCode: "WB",
  stage: "demo", // kickoff | demo | launch | accepted
  monthlyChosen: true, // chosen on the proposal; always true for RC/RK
  previewUrl: "#", // staging link, filled by the back end
  liveUrl: "#", // the client's domain once live
  domain: "[yourbusiness.com]",
  stripeConnected: true,
  repoUrl: "#", // GitHub repository under the client's account, released at final payment
};

export const CARD = { brand: "Visa", last4: "[4242]", exp: "[MM/YY]" };

// Hours of small changes a month on the plan, as drawn on the Portal board. Confirm per offer.
export const HOURS = { used: 1.5, cap: 2, resetsOn: "[date]" };

export const TEAM = [
  { initial: "G", name: "Geoffrey Fylak", role: "Building your site · replies on tickets" },
  { initial: "C", name: "Chris [Last name]", role: "Founder · your proposal and invoices" },
];

export function offerFor(code) {
  return getOffer(code) || getOffer("WB");
}

// "$499.50": setup parts have cents, so the portal always shows two decimals for invoice amounts.
export function money2(n) {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function partAmount(offer, percent) {
  return Math.round(offer.setup * percent) / 100;
}

const MILESTONE_TITLES = ["Kickoff", "Working demo", "Accepted launch"];
const INVOICE_META = [
  { id: "INV-0012", name: "Kickoff", waiting: "—" },
  { id: "INV-0013", name: "Working demo", waiting: "At demo approval" },
  { id: "INV-0014", name: "Acceptance", waiting: "At launch sign-off" },
];

// The three setup milestones for the home card.
export function milestones(offer, stage) {
  const mi = STAGES.indexOf(stage);
  return MILESTONES.map((m, i) => ({
    num: String(i + 1).padStart(2, "0"),
    title: MILESTONE_TITLES[i],
    percent: m.percent,
    amount: partAmount(offer, m.percent),
    state: i < mi ? "done" : i === mi ? "now" : "next",
  }));
}

// Invoices follow the stage: kickoff is paid at signing; the 30% is created when the demo is approved
// (stage launch) and the 20% when the launch is signed off (stage accepted).
export function invoices(offer, stage, paidExtra = {}) {
  const paidCount = { kickoff: 1, demo: 1, launch: 1, accepted: 2 }[stage];
  const dueIdx = stage === "launch" ? 1 : stage === "accepted" ? 2 : -1;
  return MILESTONES.map((m, i) => {
    const meta = INVOICE_META[i];
    const paid = i < paidCount || !!paidExtra[meta.id];
    const due = !paid && i === dueIdx;
    const status = paid ? "paid" : due ? "due" : i === 1 && stage === "demo" ? "after-approval" : "not-yet";
    return {
      id: meta.id,
      name: `${meta.name} · ${m.percent}%`,
      percent: m.percent,
      amount: partAmount(offer, m.percent),
      status,
      dueLabel: paid ? "[Date]" : due ? "Today" : meta.waiting === "—" ? "[Date]" : meta.waiting,
      note: i === 1 && stage === "demo" ? "Created when you approve" : "—",
      receiptUrl: paid ? `/api/portal/invoices/${meta.id}/receipt` : null,
    };
  });
}

export const INVOICE_STATUS = {
  paid: { label: "Paid", tone: "success" },
  due: { label: "Due now", tone: "warning" },
  "after-approval": { label: "After you approve", tone: "muted" },
  "not-yet": { label: "Not yet", tone: "muted" },
};

export function timeline(stage) {
  const live = stage === "accepted";
  const si = STAGES.indexOf(stage);
  const T = [
    ["Kickoff", "Proposal signed, 50% paid, content list sent", "[Date]"],
    ["Content received", "Logo, photos, hours, services, about", stage === "kickoff" ? "This week" : "[Date]"],
    ["Working demo", "Click through it on your phone, then approve", stage === "kickoff" ? "Week 2" : stage === "demo" ? "Now" : "[Date]"],
    ["Launch sign-off", "Final check, type your name, 20% due", si < 2 ? "Week 3" : stage === "launch" ? "Now" : "[Date]"],
    ["Live", "Site on your domain, code in your GitHub, monthly plan starts if you chose it", live ? "[Date]" : "Week 3"],
  ];
  const doneUpTo = { kickoff: 1, demo: 2, launch: 3, accepted: 5 }[stage];
  const nowIdx = { kickoff: 1, demo: 2, launch: 3, accepted: -1 }[stage];
  return T.map((t, i) => ({ title: t[0], sub: t[1], when: t[2], done: i < doneUpTo && i !== nowIdx, now: i === nowIdx }));
}

// Content checklist. state: received | needed | uploading | failed
export function checklist(stage) {
  const early = stage === "kickoff";
  const preLaunch = stage === "kickoff" || stage === "demo";
  return [
    { id: "logo", title: "Logo", sub: "PNG or SVG, the biggest you have", state: "received" },
    { id: "photos", title: "Photos of the shop and your work", sub: "10 to 20; we pick and crop", state: preLaunch ? "needed" : "received" },
    { id: "hours", title: "Hours, address, phone", sub: "Received from the proposal", state: "received" },
    { id: "services", title: "Services and prices", sub: "A list or a photo of the board works", state: early ? "needed" : "received" },
    { id: "about", title: "A few lines about you", sub: "Who you are, how long, what you are known for", state: early ? "needed" : "received" },
  ];
}

export const UPLOAD_MAX_MB = 50;

export function files(stage) {
  const live = stage === "accepted";
  return [
    { id: "proposal", name: "Signed proposal", sub: "PDF · signed [Date]", ready: true, action: "Download", href: "/api/portal/files/proposal" },
    { id: "brand", name: "Brand files", sub: "Logo, colors, fonts we used", ready: true, action: "Download", href: "/api/portal/files/brand" },
    {
      id: "code",
      name: "Site code",
      sub: live ? "GitHub repository under your account + zip" : "Yours at final payment",
      ready: live,
      action: live ? "Open on GitHub" : "Unlocks at launch sign-off",
      href: live ? PROJECT.repoUrl : null,
      external: true,
    },
    {
      id: "handover",
      name: "Handover pack",
      sub: live ? "Accounts, how-tos, who to call" : "How-tos, accounts, what to do without us",
      ready: live,
      action: live ? "Download" : "Unlocks at launch sign-off",
      href: live ? "/api/portal/files/handover" : null,
    },
  ];
}

export const STAGE_COPY = {
  kickoff: {
    chip: "Week 1 · Kickoff",
    title: "We are setting up. Send us your content.",
    text: "Your kickoff payment is in and the build has started on a Klyvora template. The faster the photos and text arrive, the sooner the demo.",
    homeLede: "has started. Next up: your content.",
    homeCta: "Send your content",
    homeHref: "/portal/project#content",
  },
  demo: {
    chip: "Week 2 · Working demo",
    title: "Your working demo is ready.",
    text: "Open it on your phone, make a test booking (it takes no money), and tell us what to change. Approve when it does what we agreed.",
    homeLede: "is in build. Next up: approve the working demo.",
    homeCta: "Review the demo",
    homeHref: "/portal/project",
  },
  launch: {
    chip: "Week 3 · Launch",
    title: "Launch is ready for your sign-off.",
    text: "Domain connected, Stripe in live mode, reminders tested. Sign off and the site is yours.",
    homeLede: "is almost there. Next up: sign off on the launch.",
    homeCta: "Sign off on the launch",
    homeHref: "/portal/project",
  },
  accepted: {
    chip: "Live",
    title: "Launched. Your site is live.",
    text: "Code is in your GitHub account, the handover pack is below, and the monthly plan (if you chose it) has started.",
    homeLede: "is live. This portal keeps your invoices, requests and files.",
    homeCta: "Open the project",
    homeHref: "/portal/project",
  },
};

// Ticket status: open | in-progress | closed
export const TICKETS = [
  {
    id: "TK-040",
    subject: "Reminder texts not sending",
    status: "in-progress",
    when: "Yesterday",
    messages: [
      { who: "You", when: "Yesterday 14:10", text: "Customers say they did not get the reminder text for Tuesday." },
      {
        who: "Geoffrey · Klyvora",
        when: "Yesterday 15:02",
        text: "Found it: the sender number needed re-verifying with the carrier. Done; Tuesday’s reminders went out at 15:00. We will watch tomorrow’s batch too.",
      },
      { who: "You", when: "Today 09:20", text: "Thanks, two customers confirmed they got it." },
    ],
  },
  {
    id: "TK-031",
    subject: "Change Saturday hours to 9–4",
    status: "closed",
    when: "[date]",
    messages: [
      { who: "You", when: "[date]", text: "Saturday is now 9 to 4." },
      { who: "Demetrius · Klyvora", when: "[date]", text: "Updated on the site and in the booking slots. 0.2 h logged to your plan." },
    ],
  },
];

export const TICKET_STATUS = {
  open: { label: "Open", tone: "warning" },
  "in-progress": { label: "In progress", tone: "accent" },
  closed: { label: "Closed", tone: "muted" },
};

// role: signer | viewer | invited
export const PEOPLE = [
  { id: "you", name: "[First name] [Last name]", email: "[you@business.com]", role: "signer", initial: "B" },
  { id: "p2", name: "[Second contact]", email: "[front-desk@business.com]", role: "viewer", initial: "F" },
];

export const NOTIFICATIONS = [
  { key: "milestone", label: "Milestone updates", sub: "Email when the demo is ready or launch needs your sign-off", on: true },
  { key: "invoice", label: "Invoices and receipts", sub: "Email; always on for receipts", on: true },
  { key: "ticket", label: "Replies to your requests", sub: "Email, and a text if you asked for one", on: true },
  { key: "text", label: "Texts", sub: "To your mobile number; never before 8am or after 9pm", on: true },
];

export const KB = [
  {
    q: "Change your hours",
    a: "Once live, open the booking admin → Site → Hours. Holiday hours take effect the same minute. Before launch, send them as a ticket.",
  },
  { q: "Add or swap photos", a: "Booking admin → Site → Photos. Drag to reorder. We resize and compress them for you." },
  { q: "Read today’s bookings", a: "Booking admin → Overview shows today; Bookings shows the week. Each booking has call and text buttons." },
  {
    q: "What the monthly plan covers",
    a: "Hosting, monitoring, backups, booking reminders by text, and 2 hours of small changes a month. It is optional; end it any time and keep the site, the code and your data.",
  },
];

export const PLAN_ENDS = "[Date + 30 days]";
