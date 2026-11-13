import { Suspense } from "react";
import SubscriptionsView from "@/components/admin/billing/SubscriptionsView";
import { adminData, supportClients } from "@/lib/server/views";
export const metadata = { title: "Subscriptions" };
export default function Page() { return <Suspense fallback={<div aria-busy="true">Loading…</div>}><Content /></Suspense>; }
async function Content() {
  const data = await adminData("subscriptions");

  return <SubscriptionsView initialSubs={data.subscriptions} />;
}
