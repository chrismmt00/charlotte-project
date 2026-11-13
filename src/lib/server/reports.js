import "server-only";
import { prisma } from "@/lib/prisma";
import { fail } from "./http";
import { metrics, catalog, today, day } from "./data";

export async function reports(query = {}) {
  const to = query.to || today();
  const range = query.from ? "custom" : query.range || "90d";
  if (!["7d", "30d", "90d", "ytd", "custom"].includes(range))
    fail(422, "range", "Unknown date range.");
  const start = new Date(`${to}T00:00:00Z`);
  if (!Number.isFinite(start.getTime()))
    fail(422, "range", "Choose a valid end date.");
  if (range === "ytd") {
    start.setUTCMonth(0, 1);
  } else
    start.setUTCDate(start.getUTCDate() - (Number.parseInt(range) || 90) + 1);
  const from = query.from || day(start);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    from > to
  )
    fail(422, "range", "Choose a valid date range.");
  const after = new Date(`${from}T00:00:00Z`),
    before = new Date(`${to}T23:59:59.999Z`);
  if (before - after > 366 * 86400000)
    fail(422, "range", "Choose a range of at most one year.");
  const [m, deals, invoices, leads, activities, offers, pending] =
    await Promise.all([
      metrics(),
      prisma.proposal.findMany({
        where: { status: "Accepted", acceptedAt: { gte: after, lte: before } },
      }),
      prisma.invoice.findMany({
        where: {
          paidAt: { gte: after, lte: before },
          kind: { notIn: ["hardware", "usage"] },
        },
      }),
      prisma.lead.findMany({ select: { status: true } }),
      prisma.activity.findMany({
        where: {
          createdAt: { gte: after, lte: before },
          type: { in: ["call", "email", "Call", "Email"] },
        },
      }),
      catalog(),
      prisma.subscription.aggregate({
        where: { status: "pending" },
        _sum: { mrrCents: true },
      }),
    ]);
  const months = new Map(),
    weeks = new Map();
  function month(d) {
    const key = day(d).slice(0, 7);
    if (!months.has(key))
      months.set(key, { key, label: key, signed: 0, cash: 0 });
    return months.get(key);
  }
  for (const p of deals) month(p.acceptedAt).signed += p.setupCents / 100;
  for (const i of invoices) month(i.paidAt).cash += i.paidCents / 100;
  for (const a of activities) {
    const d = new Date(a.createdAt);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const key = day(d);
    if (!weeks.has(key))
      weeks.set(key, { key, label: key, emails: 0, calls: 0 });
    weeks.get(key)[a.type.toLowerCase() === "email" ? "emails" : "calls"]++;
  }
  const stages = [
    "New",
    "Contacted",
    "Demo booked",
    "Proposal sent",
    "Signed",
    "Lost",
  ];
  const demos = leads.filter((l) =>
      ["Demo booked", "Proposal sent", "Signed"].includes(l.status),
    ).length,
    closed = leads.filter((l) => l.status === "Signed").length;
  return {
    range,
    from,
    to,
    label: `${from} – ${to}`,
    empty: !deals.length && !invoices.length && !activities.length,
    targets: m.targets,
    tiles: {
      signed: deals.reduce((n, p) => n + p.setupCents, 0) / 100,
      cash: invoices.reduce((n, i) => n + i.paidCents, 0) / 100,
      mrr: m.mrr,
      mrrAtLaunch: m.mrr + (pending._sum.mrrCents || 0) / 100,
      closeRate: demos ? Math.round((closed / demos) * 100) : 0,
      daysToSign: deals.length
        ? Math.round(
            deals.reduce(
              (n, p) => n + (p.acceptedAt - p.createdAt) / 86400000,
              0,
            ) / deals.length,
          )
        : 0,
      contactsThisWeek: m.contactsThisWeek,
    },
    months: [...months.values()].sort((a, b) => a.key.localeCompare(b.key)),
    mrr: [
      {
        key: today().slice(0, 7),
        label: "Current",
        value: m.mrr,
        projected: false,
      },
    ],
    funnel: stages.map((stage) => ({
      stage,
      n: leads.filter((l) => l.status === stage).length,
    })),
    weeks: [...weeks.values()].sort((a, b) => a.key.localeCompare(b.key)),
    byOffer: offers
      .filter((o) => !o.addOnOf)
      .map((o) => {
        const mine = deals.filter((p) => p.offerCode === o.code);
        return {
          code: o.code,
          name: o.name,
          signed: mine.length,
          setup: mine.reduce((n, p) => n + p.setupCents, 0) / 100,
          monthly:
            mine
              .filter((p) => p.monthly)
              .reduce((n, p) => n + p.monthlyCents, 0) / 100,
          planTaken: mine.filter((p) => p.monthly).length,
          monthlyRequired: o.monthlyRequired,
        };
      }),
  };
}
