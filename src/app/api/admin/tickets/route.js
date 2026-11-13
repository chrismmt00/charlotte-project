import { TICKETS, TICKET_STATUSES, SUPPORT_CLIENTS, getTicketsPayload } from "@/lib/admin/sample-support";
import { readJson, bad } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session. Nothing is stored.
// GET  /api/admin/tickets?status=Open|In progress|Waiting on client|Closed -> 200 { tickets, clients, today }
// POST /api/admin/tickets { clientId, requester, type, source, subject, body, assigned, priority }
//   -> 201 { ticket: { id, num, status, quoteRequest } }
//      a client with no monthly plan gets a quote request and { proposalDraftId } instead of a plan-hours ticket
//   400 { error } when the subject or the client is missing
export function GET(request) {
  const status = new URL(request.url).searchParams.get("status");
  const payload = getTicketsPayload();
  if (status && TICKET_STATUSES.includes(status)) payload.tickets = TICKETS.filter((t) => t.status === status);
  return Response.json(payload);
}

export async function POST(request) {
  const { body, error } = await readJson(request);
  if (error) return error;
  const client = SUPPORT_CLIENTS.find((c) => c.id === body?.clientId);
  if (!client) return bad("Pick a client.");
  if (!String(body?.subject || "").trim()) return bad("Give the ticket a subject.");
  const num = "TK-042";
  const quoteRequest = !client.plan;
  return Response.json(
    { ticket: { id: num.toLowerCase(), num, status: "Open", quoteRequest }, ...(quoteRequest ? { proposalDraftId: "pr_draft_[new]" } : {}) },
    { status: 201 }
  );
}
