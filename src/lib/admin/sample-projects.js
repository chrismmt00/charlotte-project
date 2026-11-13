// SAMPLE DATA for /admin/projects until the back end ships GET /api/admin/projects.
// Every name is a bracketed placeholder. The shapes below are the contract the back end must return.
//
// Money is whole dollars here for display; the API and database store cents (setupCents, amountCents)
// and the UI divides by 100. Milestone amounts are the setup split 50 / 30 / 20, rounded to whole
// dollars with the remainder on the last milestone so the three always add up to the setup price.
//
// GET /api/admin/projects -> { projects: Project[], team: Person[], today }
// Project: {
//   id, clientId, client, offerCode, offer, setup, monthly, monthlyRequired, monthlyChosen,
//   startedAt, stage: "kickoff" | "demo" | "launch", owner,
//   next, milestones: Milestone[], tasks: Task[]
// }
// Milestone: { id: "kickoff" | "demo" | "launch", label, percent, amount, status: "done" | "current" | "todo",
//   target: "YYYY-MM-DD" | null, note, invoice: "INV-0000" | null }
// Task: { id, title, status: "To do" | "Doing" | "Review" | "Done", who, milestone: Milestone.id,
//   due: "YYYY-MM-DD", est, blocked, desc, checklist: [{ id, text, done }], time: [{ id, what, who, hours }] }
// Person: { name, initials, note? }

import { getOffer } from "@/lib/offers";

// The sample "today" that due-soon and this-week figures are measured against.
export const SAMPLE_TODAY = "2026-11-10";

export const TEAM = [
  { name: "Chris", initials: "CD" },
  { name: "Geoffrey", initials: "GE" },
  { name: "Demetrius", initials: "DM" },
  { name: "Claude", initials: "AI", note: "Drafts and photo passes only" },
];

export const TASK_STATUSES = ["To do", "Doing", "Review", "Done"];
export const MILESTONE_IDS = ["kickoff", "demo", "launch"];
export const MILESTONE_NAMES = { kickoff: "Kickoff", demo: "Working demo", launch: "Launch" };
export const STAGE_LABEL = { kickoff: "Kickoff", demo: "Working demo", launch: "Launch" };

export function splitSetup(setup) {
  const kickoff = Math.round(setup * 0.5);
  const demo = Math.round(setup * 0.3);
  return { kickoff, demo, launch: setup - kickoff - demo };
}

function milestones(setup, rows) {
  const amt = splitSetup(setup);
  const pct = { kickoff: 50, demo: 30, launch: 20 };
  return MILESTONE_IDS.map((id, i) => ({
    id,
    label: `${MILESTONE_NAMES[id]} · ${pct[id]}%`,
    percent: pct[id],
    amount: amt[id],
    ...rows[i],
  }));
}

function t(id, title, status, who, milestone, due, est, desc, extra = {}) {
  return { id, title, status, who, milestone, due, est, desc, blocked: false, checklist: [], time: [], ...extra };
}

const WB = getOffer("WB");
const RK = getOffer("RK");
const W2 = getOffer("W2");

export const PROJECTS = [
  {
    id: "pj_braids7",
    clientId: "ld_7",
    client: "Braids studio [7]",
    offerCode: WB.code,
    offer: WB.name,
    setup: WB.setup,
    monthly: WB.monthly,
    monthlyRequired: WB.monthlyRequired,
    monthlyChosen: true,
    startedAt: "[date]",
    stage: "demo",
    owner: "Chris",
    milestones: milestones(WB.setup, [
      { status: "done", target: null, note: "Paid [date]", invoice: "INV-0008" },
      { status: "current", target: "2026-11-16", note: "Accepting the demo sends the 30% invoice (INV-0014, drafted)", invoice: "INV-0014" },
      { status: "todo", target: "2026-11-20", note: "Due at acceptance; the monthly plan starts", invoice: null },
    ]),
    tasks: [
      t("tk_b1", "Collect service list and prices", "Done", "Chris", "kickoff", "2026-11-03", 1, "Call the owner; get the service menu, durations and deposit amounts.", {
        time: [{ id: "te_b1", what: "Owner call", who: "Chris", hours: 1 }],
      }),
      t("tk_b2", "Home + services page", "Done", "Geoffrey", "demo", "2026-11-05", 4, "Hero, services teaser, the booking button above the fold.", {
        time: [
          { id: "te_b2", what: "Layout and hero", who: "Geoffrey", hours: 2.5 },
          { id: "te_b3", what: "Services section", who: "Geoffrey", hours: 2 },
        ],
      }),
      t("tk_b3", "Booking flow with deposit", "Doing", "Geoffrey", "demo", "2026-11-12", 6, "Service → date → slot → deposit through the owner's own Stripe account. Reminders 24h before.", {
        checklist: [
          { id: "cl_1", text: "Date and time picker", done: true },
          { id: "cl_2", text: "Deposit step (Stripe test mode)", done: false },
          { id: "cl_3", text: "Reminder text 24h before", done: false },
        ],
        time: [
          { id: "te_b4", what: "Slot picker", who: "Geoffrey", hours: 2 },
          { id: "te_b5", what: "Deposit step", who: "Geoffrey", hours: 1.5 },
        ],
      }),
      t("tk_b4", "Photo pass · 12 style photos", "Doing", "Demetrius", "demo", "2026-11-11", 2, "Crop to 4:3, compress, alt text. Pick 3 for the hero.", {
        time: [{ id: "te_b6", what: "Crops and compression", who: "Demetrius", hours: 1 }],
      }),
      t("tk_b5", "Demo link to the client for approval", "To do", "Chris", "demo", "2026-11-13", 0.5, "Post the demo link to the portal so the owner can approve it."),
      t("tk_b6", "Google Business link + hours", "To do", "Demetrius", "launch", "2026-11-18", 1, "Blocked: we need the owner's Google login or manager access.", { blocked: true }),
      t("tk_b7", "Domain pointed + SSL", "To do", "Geoffrey", "launch", "2026-11-20", 1, "Registrar is [registrar]; TTL 1h."),
      t("tk_b8", "Services page copy review", "Review", "Chris", "demo", "2026-11-10", 0.5, "Read it as the owner would.", {
        time: [{ id: "te_b7", what: "Copy pass", who: "Chris", hours: 0.5 }],
      }),
    ],
  },
  {
    id: "pj_foodtruck6",
    clientId: "ld_6",
    client: "Food truck [6]",
    offerCode: RK.code,
    offer: RK.name,
    setup: RK.setup,
    monthly: RK.monthly,
    monthlyRequired: RK.monthlyRequired,
    monthlyChosen: true,
    startedAt: "[date]",
    stage: "kickoff",
    owner: "Geoffrey",
    milestones: milestones(RK.setup, [
      { status: "current", target: null, note: "Waiting on INV-0011 (overdue); work starts when it clears", invoice: "INV-0011" },
      { status: "todo", target: null, note: "Due at demo approval", invoice: null },
      { status: "todo", target: null, note: "Due at acceptance; the required restaurant plan starts", invoice: null },
    ]),
    tasks: [
      t("tk_f1", "Collect menu, modifiers and prices", "Doing", "Geoffrey", "kickoff", "2026-11-11", 2, "Get the PDF menu, modifiers and the catering tiers.", {
        time: [{ id: "te_f1", what: "Menu call", who: "Geoffrey", hours: 0.5 }],
      }),
      t("tk_f2", "Kiosk hardware quote", "Review", "Chris", "kickoff", "2026-11-12", 1, "Vendor quote for the stand and tablet. It goes on INV-0013 at 100% before we order.", {
        time: [{ id: "te_f2", what: "Vendor quotes", who: "Chris", hours: 0.5 }],
      }),
      t("tk_f3", "Collect logo and truck photos", "To do", "Demetrius", "kickoff", "2026-11-14", 1, "Blocked: waiting on the owner's photo folder.", { blocked: true }),
      t("tk_f4", "Ordering flow on the menu", "To do", "Geoffrey", "demo", "2026-11-21", 8, "Menu → modifiers → cart → pay through the owner's own Stripe account."),
      t("tk_f5", "Kitchen queue for kiosk orders", "To do", "Geoffrey", "demo", "2026-11-24", 6, "Kiosk and online orders land in the same queue."),
    ],
  },
  {
    id: "pj_studio9",
    clientId: "ld_9",
    client: "Studio [9]",
    offerCode: W2.code,
    offer: W2.name,
    setup: W2.setup,
    monthly: W2.monthly,
    monthlyRequired: W2.monthlyRequired,
    monthlyChosen: false,
    startedAt: "[date]",
    stage: "launch",
    owner: "Geoffrey",
    milestones: milestones(W2.setup, [
      { status: "done", target: null, note: "Paid [date]", invoice: "INV-0007" },
      { status: "done", target: null, note: "Demo approved [date] · INV-0012 sent", invoice: "INV-0012" },
      { status: "current", target: "2026-11-12", note: "Due at acceptance · no monthly plan chosen", invoice: null },
    ]),
    tasks: [
      t("tk_s1", "Content checklist", "Done", "Chris", "kickoff", "2026-10-24", 1, "Pages, photos, logins.", {
        time: [{ id: "te_s1", what: "Checklist call", who: "Chris", hours: 1 }],
      }),
      t("tk_s2", "Home, about and services pages", "Done", "Geoffrey", "demo", "2026-11-01", 6, "Built to the approved outline.", {
        time: [{ id: "te_s2", what: "Page build", who: "Geoffrey", hours: 6.5 }],
      }),
      t("tk_s3", "Analytics and search console", "Done", "Demetrius", "launch", "2026-11-07", 1, "Verify the domain, submit the sitemap.", {
        time: [{ id: "te_s3", what: "Setup", who: "Demetrius", hours: 1 }],
      }),
      t("tk_s4", "Final copy pass", "Doing", "Geoffrey", "launch", "2026-11-11", 2, "Owner's last edits from the demo.", {
        time: [{ id: "te_s4", what: "Edits round", who: "Geoffrey", hours: 1 }],
      }),
      t("tk_s5", "Redirects from the old site", "To do", "Geoffrey", "launch", "2026-11-12", 1.5, "Map every old URL so search traffic lands on the new pages."),
      t("tk_s6", "Handover pack: code, data export, DNS steps", "To do", "Chris", "launch", "2026-11-12", 1, "They chose no monthly plan, so they take the code and data at final payment."),
    ],
  },
];

export function getProject(id) {
  return PROJECTS.find((p) => p.id === id) || null;
}

// The next open milestone per client, for the New invoice dialog.
export function nextMilestoneFor(client) {
  const p = PROJECTS.find((x) => x.client === client);
  if (!p) return null;
  const m = p.milestones.find((x) => x.status !== "done" && !x.invoice);
  return m ? { project: p, milestone: m } : null;
}

export function getProjectsPayload() {
  return { projects: PROJECTS, team: TEAM, today: SAMPLE_TODAY };
}
