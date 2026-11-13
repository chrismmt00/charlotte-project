// SAMPLE DATA for /admin/clients and /admin/clients/[id] until the back end ships its routes.
// Every name is a bracketed placeholder. Food truck [6] and Braids studio [7] are the two Signed leads in sample.js;
// Studio [9] is the client in sample.js TASKS. The three live clients on a running plan add up to the dashboard's $227/mo MRR.
//
// GET /api/admin/clients -> { clients: ClientSummary[] }
//   ClientSummary: { id, leadId, business, contact, since, source, offerCode, offer, stage, owner,
//                    monthly: { on, required, price, status }, next, mrr }
//   monthly.status: "starts at launch" | "running" | "none" | "cancels at period end"
// GET /api/admin/clients/[id] -> { client: Client }   404 { error } when unknown
//   Client = ClientSummary + { legalName, address, domain, template, stripe: { customerId, connect: { status, accountId } },
//     build, milestones[], invoices[], contacts[], portalUsers[], files[], events[], tasks[], tickets, addOns[], notes, notesSavedAt, pinned[] }
//   stripe.connect.status: "connected" | "pending" | "not-connected" | "not-needed"
//   (connect = the client's OWN Stripe account via Stripe Connect, Standard-style; Klyvora's application fee is $0)
import { getOffer } from "@/lib/offers";
import { MILESTONE_LABELS, MILESTONE_TRIGGERS, NEEDS_CONNECT, splitMilestones } from "@/components/proposal/model";

export const CLIENT_STAGES = ["In build", "Demo review", "Live", "Paused"];
export const STAGE_TONE = { "In build": "accent", "Demo review": "fg", Live: "success", Paused: "muted" };
export const OWNERS = ["Chris", "Geoffrey", "Demetrius"];

// paid: milestones paid so far (0–3). overdue: the current milestone's invoice is past due.
function buildMilestones(setup, paid, { overdue = false, dates = [] } = {}) {
  return splitMilestones(setup).map((m, i) => ({
    key: ["kickoff", "demo", "launch"][i],
    label: MILESTONE_LABELS[i],
    percent: m.percent,
    amount: m.amount,
    trigger: MILESTONE_TRIGGERS[i],
    status: i < paid ? "Paid" : i === paid ? (overdue ? "Overdue" : "Open") : "Not started",
    date: dates[i] || (i < paid ? "[date]" : i === paid ? "target [date]" : "—"),
  }));
}

function contact(n, role, { primary = false, access = "Not invited", gets = "Project updates" } = {}) {
  const slug = role === "Owner" ? "owner" : role === "Manager" ? "manager" : role === "Bookkeeper" ? "books" : "team";
  return {
    id: `ct_${n}_${slug}`,
    name: `[${role} ${n}]`,
    role,
    email: `[${slug}${n}@example.com]`,
    phone: "[Phone]",
    primary,
    access,
    gets,
  };
}

const RAW = [
  {
    id: "cl_6",
    leadId: "ld_6",
    n: 6,
    business: "Food truck [6]",
    source: "Partner",
    offerCode: "RK",
    stage: "In build",
    owner: "Geoffrey",
    monthly: { on: true, status: "starts at launch" },
    paid: 0,
    overdue: true,
    next: "Kickoff · 50% · invoice overdue",
    domain: "[foodtruck6.com]",
    template: true,
    connect: { status: "not-connected", accountId: null },
    invoices: [{ id: "INV-0011", milestone: 0, status: "Overdue", due: "[date] · 6 days late" }],
    contacts: [
      contact(6, "Owner", { primary: true, access: "Active", gets: "Everything" }),
      contact(6, "Manager", { access: "Not invited", gets: "Project updates" }),
    ],
    files: [
      ["PDF", "proposal-signed.pdf", "e-signed [date]"],
      ["DOC", "menu-and-prices.docx", "from client"],
      ["JPG", "truck-photos (8)", "from client"],
    ],
    events: [
      ["$", "Kickoff invoice INV-0011 is overdue", "[date] · Stripe"],
      ["S", "Proposal PR-0005 signed by [Owner 6]", "[date] · typed signature"],
      ["P", "Portal invite accepted by [Owner 6]", "[date]"],
    ],
    tasks: [
      ["Send INV-0011 reminder", false, "Geoffrey", "Tomorrow"],
      ["Collect menu, modifiers and photos", false, "Geoffrey", "Fri"],
      ["Order kiosk hardware after it is paid in full", false, "Chris", "—"],
    ],
    tickets: { open: 0 },
    notes: "Kickoff waits on INV-0011. Hardware is invoiced separately and paid in full before we order it.",
    pinned: [["Hardware paid up front", "never order before it clears"]],
    addOns: [["One kiosk application", "included in RK"]],
  },
  {
    id: "cl_7",
    leadId: "ld_7",
    n: 7,
    business: "Braids studio [7]",
    source: "Outreach",
    offerCode: "WB",
    stage: "In build",
    owner: "Chris",
    monthly: { on: true, status: "starts at launch" },
    paid: 1,
    next: "Working demo · 30%",
    domain: "[braidsstudio7.com]",
    template: false,
    connect: { status: "connected", accountId: "acct_[…]" },
    invoices: [
      { id: "INV-[0001]", milestone: 0, status: "Paid", due: "[date]" },
      { id: "INV-[0002]", milestone: 1, status: "Draft", due: "on demo approval" },
    ],
    contacts: [
      contact(7, "Owner", { primary: true, access: "Active", gets: "Everything" }),
      contact(7, "Manager", { access: "Not invited", gets: "Project updates" }),
      contact(7, "Bookkeeper", { access: "Invited · 2d ago", gets: "Invoices" }),
    ],
    files: [
      ["SVG", "logo-braids7.svg", "24 KB · from client"],
      ["JPG", "style-photos (12)", "41 MB · from client"],
      ["PDF", "proposal-signed.pdf", "310 KB · e-signed [date]"],
      ["DOC", "services-and-prices.docx", "88 KB · from client"],
      ["PDF", "kickoff-receipt.pdf", "62 KB · Stripe"],
      ["MD", "content-plan.md", "6 KB · Chris"],
    ],
    events: [
      ["$", "Kickoff invoice paid · $499.50", "[date] · Stripe"],
      ["P", "Portal invite accepted by [Owner 7]", "[date]"],
      ["F", "12 photos uploaded by the client", "yesterday · portal"],
      ["T", "Ticket opened: “Logo file is blurry”", "yesterday · waiting on us"],
      ["N", "Note added by Chris", "today 09:40"],
    ],
    tasks: [
      ["Collect services and prices", true, "Chris", "done"],
      ["Home and services pages built", true, "Geoffrey", "done"],
      ["Booking flow with deposit", false, "Geoffrey", "Thu"],
      ["Demo link to client for approval", false, "Chris", "Fri"],
    ],
    tickets: { open: 1, latest: "“Logo file is blurry” · waiting on us" },
    notes: "Wants deposits on the longer styles only. Prefers text over calls. Content checklist half done: hours and policies still missing.",
    pinned: [
      ["Don’t call before 11am", "appointments start early"],
      ["Domain renews [date]", "they own it at [registrar]"],
    ],
    addOns: [["SMS reminders", "included"]],
  },
  {
    id: "cl_9",
    leadId: null,
    n: 9,
    business: "Studio [9]",
    source: "Referral",
    offerCode: "W2",
    stage: "Demo review",
    owner: "Geoffrey",
    monthly: { on: false, status: "none" },
    paid: 1,
    next: "Working demo · 30% · demo out for review",
    domain: "[studio9.com]",
    template: false,
    connect: { status: "not-needed", accountId: null },
    invoices: [
      { id: "INV-[0003]", milestone: 0, status: "Paid", due: "[date]" },
      { id: "INV-[0004]", milestone: 1, status: "Draft", due: "on demo approval" },
    ],
    contacts: [contact(9, "Owner", { primary: true, access: "Active", gets: "Everything" })],
    files: [
      ["PDF", "proposal-signed.pdf", "e-signed [date]"],
      ["JPG", "portfolio (20)", "from client"],
    ],
    events: [
      ["D", "Working demo shared for review", "[date] · Geoffrey"],
      ["$", "Kickoff invoice paid", "[date] · Stripe"],
    ],
    tasks: [
      ["Ship the demo for review", true, "Geoffrey", "done"],
      ["Collect demo feedback", false, "Geoffrey", "Thu"],
      ["Prepare the handover pack", false, "Geoffrey", "at launch"],
    ],
    tickets: { open: 0 },
    notes: "Self-managed: they take the code at final payment and host it themselves. Handover pack goes out at launch.",
    pinned: [["Self-hosting", "handover pack at launch"]],
    addOns: [],
  },
  {
    id: "cl_11",
    leadId: null,
    n: 11,
    business: "Hair salon [11]",
    source: "Site form",
    offerCode: "WB",
    stage: "Live",
    owner: "Chris",
    monthly: { on: true, status: "running" },
    paid: 3,
    next: "Monthly plan running",
    domain: "[hairsalon11.com]",
    template: false,
    connect: { status: "connected", accountId: "acct_[…]" },
    invoices: [
      { id: "INV-[0005]", milestone: 0, status: "Paid", due: "[date]" },
      { id: "INV-[0006]", milestone: 1, status: "Paid", due: "[date]" },
      { id: "INV-[0007]", milestone: 2, status: "Paid", due: "[date]" },
    ],
    contacts: [contact(11, "Owner", { primary: true, access: "Active", gets: "Everything" })],
    files: [["PDF", "handover-notes.pdf", "Chris"]],
    events: [["$", "Monthly plan charged · $79", "[date] · Stripe"]],
    tasks: [],
    tickets: { open: 0 },
    notes: "",
    pinned: [],
    addOns: [],
  },
  {
    id: "cl_12",
    leadId: null,
    n: 12,
    business: "Florist [12]",
    source: "Walk-in",
    offerCode: "EC",
    stage: "Live",
    owner: "Demetrius",
    monthly: { on: true, status: "running" },
    paid: 3,
    next: "Monthly plan running",
    domain: "[florist12.com]",
    template: false,
    connect: { status: "connected", accountId: "acct_[…]" },
    invoices: [
      { id: "INV-[0008]", milestone: 0, status: "Paid", due: "[date]" },
      { id: "INV-[0009]", milestone: 1, status: "Paid", due: "[date]" },
      { id: "INV-[0010]", milestone: 2, status: "Paid", due: "[date]" },
    ],
    contacts: [contact(12, "Owner", { primary: true, access: "Active", gets: "Everything" })],
    files: [["PDF", "store-policies.pdf", "Demetrius"]],
    events: [["$", "Monthly plan charged · $99", "[date] · Stripe"]],
    tasks: [],
    tickets: { open: 0 },
    notes: "",
    pinned: [],
    addOns: [],
  },
  {
    id: "cl_13",
    leadId: null,
    n: 13,
    business: "Tailor [13]",
    source: "Referral",
    offerCode: "W1",
    stage: "Live",
    owner: "Geoffrey",
    monthly: { on: true, status: "running" },
    paid: 3,
    next: "Monthly plan running",
    domain: "[tailor13.com]",
    template: true,
    connect: { status: "not-needed", accountId: null },
    invoices: [
      { id: "INV-[0012]", milestone: 0, status: "Paid", due: "[date]" },
      { id: "INV-[0013]", milestone: 1, status: "Paid", due: "[date]" },
      { id: "INV-[0014]", milestone: 2, status: "Paid", due: "[date]" },
    ],
    contacts: [contact(13, "Owner", { primary: true, access: "Active", gets: "Everything" })],
    files: [],
    events: [["$", "Monthly plan charged · $49", "[date] · Stripe"]],
    tasks: [],
    tickets: { open: 0 },
    notes: "",
    pinned: [],
    addOns: [],
  },
];

function planLabel(c) {
  const o = getOffer(c.offerCode);
  if (!c.monthly.on) return "Self-managed · no monthly";
  const price = `$${o.monthly}/month`;
  if (c.monthly.status === "starts at launch") return `${price} · ${o.monthlyRequired ? "required · " : ""}starts at launch`;
  if (c.monthly.status === "cancels at period end") return `${price} · cancels at period end`;
  return o.monthlyRequired ? `${price} · required` : price;
}

function toClient(r) {
  const o = getOffer(r.offerCode);
  const milestones = buildMilestones(o.setup, r.paid, { overdue: r.overdue });
  const paidToDate = milestones.filter((m) => m.status === "Paid").reduce((t, m) => t + m.amount, 0);
  const portalUsers = r.contacts
    .filter((ct) => ct.access !== "Not invited")
    .map((ct) => ({
      contactId: ct.id,
      name: ct.name,
      email: ct.email,
      status: ct.access === "Active" ? "Active" : "Invited",
      last: ct.access === "Active" ? "yesterday" : "never · expires in 5d",
      can: ct.gets === "Invoices" ? "Invoices only" : "Everything",
    }));
  return {
    id: r.id,
    leadId: r.leadId,
    business: r.business,
    contact: `[Owner ${r.n}]`,
    since: "[date]",
    source: r.source,
    offerCode: r.offerCode,
    offer: o.name,
    stage: r.stage,
    owner: r.owner,
    monthly: { on: r.monthly.on, required: !!o.monthlyRequired, price: o.monthly, usage: !!o.usage, status: r.monthly.status },
    plan: planLabel(r),
    next: r.next,
    mrr: r.monthly.on && r.monthly.status === "running" ? o.monthly : 0,
    legalName: "[Legal name] LLC",
    address: "[Street], Charlotte, NC [ZIP]",
    domain: r.domain,
    template: r.template,
    stripe: { customerId: "cus_[…]", connect: NEEDS_CONNECT.includes(r.offerCode) ? r.connect : { status: "not-needed", accountId: null } },
    build: o.setup,
    paidToDate,
    milestones,
    invoices: r.invoices.map((inv) => ({ ...inv, for: `${milestones[inv.milestone].label} · ${milestones[inv.milestone].percent}%`, amount: milestones[inv.milestone].amount })),
    contacts: r.contacts,
    portalUsers,
    files: r.files.map(([ext, name, meta], i) => ({ id: `f_${r.n}_${i}`, ext, name, meta })),
    events: r.events.map(([icon, title, meta]) => ({ icon, title, meta })),
    tasks: r.tasks.map(([label, done, who, when]) => ({ label, done, who, when })),
    tickets: r.tickets,
    addOns: r.addOns.map(([name, note]) => ({ name, note })),
    notes: r.notes,
    notesSavedAt: r.notes ? "09:40 by Chris" : null,
    pinned: r.pinned.map(([title, note]) => ({ title, note })),
  };
}

export const CLIENTS = RAW.map(toClient);

const SUMMARY_KEYS = ["id", "leadId", "business", "contact", "since", "source", "offerCode", "offer", "stage", "owner", "monthly", "plan", "next", "mrr"];

export function listClients() {
  return CLIENTS.map((c) => Object.fromEntries(SUMMARY_KEYS.map((k) => [k, c[k]])));
}

export function getClient(id) {
  return CLIENTS.find((c) => c.id === id) || null;
}
