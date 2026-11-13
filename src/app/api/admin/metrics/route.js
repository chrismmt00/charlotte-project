import { getMetrics } from "@/lib/admin/sample";

// STUB: returns sample numbers. The back end replaces this with the real computation
// (signed = accepted proposal setup totals, cash = paid invoices, mrr = active subscriptions)
// and requires an admin session. Shape: { signed, cash, mrr, targets: { signed, cash, mrr },
// contactsThisWeek, overdueInvoices, openTickets, activeClients }.
export function GET() {
  return Response.json(getMetrics());
}
