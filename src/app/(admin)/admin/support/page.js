import TicketsView from "@/components/admin/support/TicketsView";
import { TICKETS, getSupportClients } from "@/lib/admin/sample-support";

export const metadata = { title: "Support" };

// Reads GET /api/admin/tickets once the back end ships it; sample data until then.
export default function SupportPage() {
  return <TicketsView initialTickets={TICKETS} clients={getSupportClients()} />;
}
