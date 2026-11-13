import { Suspense } from "react";
import ReportsView from "@/components/admin/reports/ReportsView";
import { adminData, supportClients } from "@/lib/server/views";
export const metadata = { title: "Reports" };
export default function Page() { return <Suspense fallback={<div aria-busy="true">Loading…</div>}><Content /></Suspense>; }
async function Content() {
  const data = await adminData("reports");

  return <ReportsView initial={data} />;
}
