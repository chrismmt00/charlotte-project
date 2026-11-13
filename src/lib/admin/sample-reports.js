// SAMPLE DATA for /admin/reports until the back end ships GET /api/admin/reports.
// Numbers come from the AdminReports board; offer prices come from src/lib/offers.js.
//
// GET /api/admin/reports?range=7d|30d|90d|ytd            (or ?from=YYYY-MM-DD&to=YYYY-MM-DD)
// -> {
//   range: "90d" | "custom", from: "YYYY-MM-DD", to: "YYYY-MM-DD", label: "last 90 days",
//   empty: boolean,                                   // true when nothing in range to chart
//   targets: { signed, cash, mrr },                   // dollars, from Settings → General → Targets
//   tiles: { signed, cash, mrr, mrrAtLaunch, closeRate, daysToSign, contactsThisWeek },
//   months:  [{ key: "2026-09", label: "Sep", signed, cash }],          // setup fees signed / cash collected
//   mrr:     [{ key: "2026-09", label: "Sep", value, projected: false }],// billing now, then projected at launch
//   funnel:  [{ stage, n }],                                             // pipeline right now, not range-bound
//   weeks:   [{ key: "2026-11-09", label: "W8", emails, calls }],       // outreach contacts per week
//   byOffer: [{ code, name, signed, setup, monthly, planTaken, monthlyRequired }]
// }
// Dollars are whole numbers here; the database stores cents.

import { OFFERS } from "@/lib/offers";
import { TARGETS } from "@/lib/admin/sample";

// Sample "today". The real route uses the request time.
export const SAMPLE_TODAY = "2026-11-13";

export const RANGES = [
  { key: "7d", label: "7 days", long: "last 7 days", days: 7 },
  { key: "30d", label: "30 days", long: "last 30 days", days: 30 },
  { key: "90d", label: "90 days", long: "last 90 days", days: 90 },
  { key: "ytd", label: "YTD", long: "this year" },
];

const MONTHS = [
  { key: "2026-09", label: "Sep", start: "2026-09-01", end: "2026-09-30", signed: 2497, cash: 1748 },
  { key: "2026-10", label: "Oct", start: "2026-10-01", end: "2026-10-31", signed: 4996, cash: 3747 },
  { key: "2026-11", label: "Nov", start: "2026-11-01", end: "2026-11-30", signed: 7494, cash: 3248 },
];

const MRR_BILLING = { "2026-09": 0, "2026-10": 99, "2026-11": 148 };
const MRR_PROJECTED = [
  { key: "2026-12", label: "Dec", value: 405 },
  { key: "2027-01", label: "Jan", value: 553 },
  { key: "2027-02", label: "Feb", value: 652 },
];

const FUNNEL = [
  { stage: "Found by Claude", n: 212 },
  { stage: "Emailed", n: 141 },
  { stage: "Replied", n: 19 },
  { stage: "Demo sent", n: 11 },
  { stage: "Proposal sent", n: 7 },
  { stage: "Signed", n: 5 },
];

// Week start (Monday) → emails approved and sent, calls logged.
const WEEKS = [
  ["2026-09-21", 42, 11],
  ["2026-09-28", 58, 14],
  ["2026-10-05", 61, 19],
  ["2026-10-12", 70, 22],
  ["2026-10-19", 66, 18],
  ["2026-10-26", 74, 21],
  ["2026-11-02", 81, 24],
  ["2026-11-09", 52, 9],
].map(([start, emails, calls], i) => ({ key: start, label: `W${i + 1}`, start, end: addDays(start, 6), emails, calls }));

// Signed proposals: offer code, signed date, kept the optional monthly plan.
const DEALS = [
  { code: "WB", signedAt: "2026-09-12", plan: true },
  { code: "W1", signedAt: "2026-09-26", plan: false },
  { code: "EC", signedAt: "2026-10-09", plan: true },
  { code: "WB", signedAt: "2026-10-23", plan: true },
  { code: "RK", signedAt: "2026-11-04", plan: true },
];

const DAYS_TO_SIGN = 9;
const BY_OFFER_CODES = ["WB", "RK", "EC", "W1", "AI"];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && aEnd >= bStart;
}

function fmtDay(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${d}`;
}

// Resolve a query into a window. Returns { error } for a bad query.
export function resolveRange({ range, from, to } = {}) {
  if (from || to) {
    if (!ISO.test(from || "") || !ISO.test(to || "")) return { error: "Pick both dates." };
    if (from > to) return { error: "The start date is after the end date." };
    return { range: "custom", from, to, label: `${fmtDay(from)} – ${fmtDay(to)}` };
  }
  const r = RANGES.find((x) => x.key === (range || "90d"));
  if (!r) return { error: "Unknown range." };
  const start = r.key === "ytd" ? `${SAMPLE_TODAY.slice(0, 4)}-01-01` : addDays(SAMPLE_TODAY, -(r.days - 1));
  return { range: r.key, from: start, to: SAMPLE_TODAY, label: r.long };
}

export function getReports(query = {}) {
  const w = resolveRange(query);
  if (w.error) return w;
  const months = MONTHS.filter((m) => overlaps(m.start, m.end, w.from, w.to)).map(({ key, label, signed, cash }) => ({ key, label, signed, cash }));
  const weeks = WEEKS.filter((x) => overlaps(x.start, x.end, w.from, w.to)).map(({ key, label, emails, calls }) => ({ key, label, emails, calls }));
  const deals = DEALS.filter((d) => d.signedAt >= w.from && d.signedAt <= w.to);
  const billing = months.map((m) => ({ key: m.key, label: m.label, value: MRR_BILLING[m.key] ?? 0, projected: false }));
  const mrrNow = MRR_BILLING[MONTHS[MONTHS.length - 1].key];
  const demos = FUNNEL.find((f) => f.stage === "Demo sent").n;
  const signedN = FUNNEL.find((f) => f.stage === "Signed").n;
  const lastWeek = WEEKS[WEEKS.length - 1];

  const byOffer = BY_OFFER_CODES.map((code) => {
    const o = OFFERS.find((x) => x.code === code);
    const mine = deals.filter((d) => d.code === code);
    const taken = mine.filter((d) => d.plan || o.monthlyRequired).length;
    return {
      code,
      name: o.name,
      signed: mine.length,
      setup: mine.length * o.setup,
      monthly: taken * o.monthly,
      planTaken: taken,
      monthlyRequired: !!o.monthlyRequired,
    };
  });

  return {
    range: w.range,
    from: w.from,
    to: w.to,
    label: w.label,
    empty: months.length === 0 && weeks.length === 0,
    targets: TARGETS,
    tiles: {
      signed: months.reduce((s, m) => s + m.signed, 0),
      cash: months.reduce((s, m) => s + m.cash, 0),
      mrr: mrrNow,
      mrrAtLaunch: MRR_PROJECTED[0].value,
      closeRate: Math.round((signedN / demos) * 100),
      daysToSign: DAYS_TO_SIGN,
      contactsThisWeek: lastWeek.emails + lastWeek.calls,
    },
    months,
    mrr: billing.length ? [...billing, ...MRR_PROJECTED.map((p) => ({ ...p, projected: true }))] : [],
    funnel: FUNNEL,
    weeks,
    byOffer,
  };
}

// CSV for GET /api/admin/reports/export. sections: "months" | "pipeline" | "outreach".
// Prospects who opted out are excluded from the outreach log by the real export.
function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function reportsCsv(report, sections = ["months", "pipeline"]) {
  const rows = [];
  const push = (...cells) => rows.push(cells.map(csvCell).join(","));
  push("Klyvora reports", report.label, `${report.from} to ${report.to}`, "Sample data");
  if (sections.includes("months")) {
    push();
    push("Month", "Signed ($)", "Cash collected ($)", "Monthly recurring ($/mo)", "Projected");
    const mrr = Object.fromEntries(report.mrr.map((m) => [m.key, m]));
    for (const m of report.months) push(m.key, m.signed, m.cash, mrr[m.key]?.value ?? "", "no");
    for (const m of report.mrr.filter((x) => x.projected)) push(m.key, "", "", m.value, "yes");
  }
  if (sections.includes("pipeline")) {
    push();
    push("Stage", "Leads");
    for (const f of report.funnel) push(f.stage, f.n);
  }
  if (sections.includes("outreach")) {
    push();
    push("Week", "Emails sent", "Calls logged", "Contacts");
    for (const w of report.weeks) push(w.key, w.emails, w.calls, w.emails + w.calls);
  }
  return rows.join("\r\n") + "\r\n";
}
