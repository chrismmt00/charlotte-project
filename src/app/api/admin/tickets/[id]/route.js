import { getTicket, getSupportClients, TICKET_STATUSES, ASSIGNEES } from "@/lib/admin/sample-support";
import { readJson, bad, notFound } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session. Nothing is stored.
// GET   /api/admin/tickets/[id] -> 200 { ticket: Ticket, cap: { hours, usedByClient } }   404 { error }
// PATCH /api/admin/tickets/[id]
//   { status?, assigned? } or, to close, { status: "Closed", resolution, rootCause, askRating, addToKb }
//   -> 200 { ticket }   400 { error } for an unknown status or assignee, or closing without a resolution
export async function GET(_request, ctx) {
  const { id } = await ctx.params;
  const ticket = getTicket(id);
  if (!ticket) return notFound("Ticket");
  const c = getSupportClients().find((x) => x.id === ticket.clientId);
  return Response.json({ ticket, cap: { hours: c?.capHours ?? 0, usedByClient: c?.usedHours ?? 0 } });
}

export async function PATCH(request, ctx) {
  const { id } = await ctx.params;
  const ticket = getTicket(id);
  if (!ticket) return notFound("Ticket");
  const { body, error } = await readJson(request);
  if (error) return error;
  if (body?.status && !TICKET_STATUSES.includes(body.status)) return bad("Unknown status.");
  if (body?.assigned && !ASSIGNEES.includes(body.assigned)) return bad("Unknown assignee.");
  if (body?.status === "Closed" && !String(body.resolution || "").trim()) return bad("Write the resolution the client will see.");
  return Response.json({ ticket: { ...ticket, ...(body?.status ? { status: body.status } : {}), ...(body?.assigned ? { assigned: body.assigned } : {}) } });
}
