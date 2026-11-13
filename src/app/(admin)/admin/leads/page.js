import { Suspense } from "react";
import LeadsView from "@/components/admin/leads/LeadsView";
import { adminData, supportClients } from "@/lib/server/views";
export const metadata = { title: "Leads" };
export default function Page() { return <Suspense fallback={<div aria-busy="true">Loading…</div>}><Content /></Suspense>; }
async function Content() {
  const data = await adminData("leads");

  return <LeadsView initial={data.leads} />;
}
