import { getReports } from "@/lib/admin/sample-reports";

// STUB until the back end ships this route. Requires an admin session (owner or builder).
// GET /api/admin/reports?range=7d|30d|90d|ytd          default 90d
// GET /api/admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD custom window (both required, from <= to)
//   200 -> the report object documented in src/lib/admin/sample-reports.js
//          { range, from, to, label, empty, targets, tiles, months, mrr, funnel, weeks, byOffer }
//   400 -> { error: { code: "bad_range", message } }
// The real route computes signed from accepted proposals, cash from paid invoices,
// MRR from active subscriptions and contacts from the outreach log.
export function GET(request) {
  const sp = new URL(request.url).searchParams;
  const report = getReports({ range: sp.get("range") || undefined, from: sp.get("from") || undefined, to: sp.get("to") || undefined });
  if (report.error) {
    return Response.json({ error: { code: "bad_range", message: report.error } }, { status: 400 });
  }
  return Response.json(report);
}
