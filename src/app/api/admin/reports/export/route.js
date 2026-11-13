import { getReports, reportsCsv } from "@/lib/admin/sample-reports";

// STUB until the back end ships this route. Requires an admin session (owner or builder).
// GET /api/admin/reports/export?range=90d&sections=months,pipeline,outreach
//     (or ?from=YYYY-MM-DD&to=YYYY-MM-DD instead of range)
//   200 -> text/csv, Content-Disposition: attachment; filename="reports-<range>.csv"
//          one block per section separated by a blank line
//   400 -> { error: { code: "bad_range" | "no_sections", message } }
// The real export may zip one CSV per section; prospects who opted out are excluded from the outreach log.
const SECTIONS = ["months", "pipeline", "outreach"];

export function GET(request) {
  const sp = new URL(request.url).searchParams;
  const report = getReports({ range: sp.get("range") || undefined, from: sp.get("from") || undefined, to: sp.get("to") || undefined });
  if (report.error) {
    return Response.json({ error: { code: "bad_range", message: report.error } }, { status: 400 });
  }
  const sections = (sp.get("sections") || "months,pipeline").split(",").filter((s) => SECTIONS.includes(s));
  if (!sections.length) {
    return Response.json({ error: { code: "no_sections", message: "Pick at least one section." } }, { status: 400 });
  }
  const name = report.range === "custom" ? `reports-${report.from}-to-${report.to}` : `reports-${report.range}`;
  return new Response(reportsCsv(report, sections), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
