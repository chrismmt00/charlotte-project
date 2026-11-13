import { Suspense } from "react";
import OutreachView from "@/components/admin/outreach/OutreachView";
import { adminData, supportClients } from "@/lib/server/views";
export const metadata = { title: "Outreach" };
export default function Page() { return <Suspense fallback={<div aria-busy="true">Loading…</div>}><Content /></Suspense>; }
async function Content() {
  const data = await adminData("outreach");

  return <OutreachView initial={data} />;
}
