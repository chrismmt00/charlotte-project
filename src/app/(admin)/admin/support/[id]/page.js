import { Suspense } from "react";
import { notFound } from "next/navigation";
import TicketView from "@/components/admin/support/TicketView";
import { Skeleton } from "@/components/admin/ui";
import { SAMPLE_TODAY, getSupportClients, getTicket, usedHoursFor, TICKETS } from "@/lib/admin/sample-support";

export const metadata = { title: "Ticket" };

// params is a Promise and cacheComponents is on, so it is awaited inside <Suspense>.
// Reads GET /api/admin/tickets/[id] once the back end ships it; sample data until then. An unknown id is a 404.
export default function TicketPage({ params }) {
  return (
    <Suspense fallback={<TicketFallback />}>
      <TicketContent params={params} />
    </Suspense>
  );
}

function TicketFallback() {
  return (
    <div aria-busy="true" aria-label="Loading ticket" className="flex flex-col gap-4">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function TicketContent({ params }) {
  const { id } = await params;
  const ticket = getTicket(id);
  if (!ticket) notFound();
  const client = getSupportClients().find((c) => c.id === ticket.clientId);
  // Hours the client's other tickets used this month; this ticket's own entries are added live in the view.
  const others = TICKETS.filter((t) => t.id !== ticket.id);
  const usedByOthers = usedHoursFor(ticket.clientId, others, SAMPLE_TODAY);
  return <TicketView ticket={{ ...ticket, planLabel: client?.planLabel ?? "" }} capHours={client?.capHours ?? 0} usedByOthers={usedByOthers} today={SAMPLE_TODAY} />;
}
