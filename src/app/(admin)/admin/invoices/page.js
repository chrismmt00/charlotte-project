import { Suspense } from "react";
import InvoicesView from "@/components/admin/billing/InvoicesView";
import { adminData, supportClients } from "@/lib/server/views";
export const metadata = { title: "Invoices" };
export default function Page() { return <Suspense fallback={<div aria-busy="true">Loading…</div>}><Content /></Suspense>; }
async function Content() {
  const data = await adminData("invoices");
  const subscriptions = await adminData("subscriptions");
  return <InvoicesView initialInvoices={data.invoices} subscriptions={subscriptions.subscriptions} today={data.today} />;
}
