import ReportsView from "@/components/admin/reports/ReportsView";
import { getReports } from "@/lib/admin/sample-reports";

export const metadata = { title: "Reports" };

// The first paint uses the default 90-day report from the sample file; the client refetches
// GET /api/admin/reports?range= when the range changes. The back end returns the same shape.
export default function ReportsPage() {
  return <ReportsView initial={getReports({ range: "90d" })} />;
}
