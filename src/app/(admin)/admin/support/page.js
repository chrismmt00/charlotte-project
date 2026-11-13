import { Suspense } from "react";
import TicketsView from "@/components/admin/support/TicketsView";
import { adminData, supportClients } from "@/lib/server/views";
export const metadata = { title: "Support" };
export default function Page() { return <Suspense fallback={<div aria-busy="true">Loading…</div>}><Content /></Suspense>; }
async function Content() {
  const data = await adminData("tickets");
  const clients = await supportClients();
  return <TicketsView initialTickets={data.tickets} clients={clients} />;
}
