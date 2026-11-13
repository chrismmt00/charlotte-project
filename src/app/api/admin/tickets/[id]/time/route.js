import { getTicket } from "@/lib/admin/sample-support";
import { readJson, bad, notFound } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session. Nothing is stored.
// POST /api/admin/tickets/[id]/time { hours, who, what } -> 201 { entry: { id, hours, who, what } }
//   Plan hours count against the client's monthly cap; going over the cap is allowed and flagged.
//   400 { error } when hours is not a number above zero.
export async function POST(request, ctx) {
  const { id } = await ctx.params;
  if (!getTicket(id)) return notFound("Ticket");
  const { body, error } = await readJson(request);
  if (error) return error;
  const hours = Number(body?.hours);
  if (!(hours > 0) || hours > 24) return bad("Hours must be more than zero.");
  return Response.json({ entry: { id: `te_${Date.now().toString(36)}`, hours, who: body.who, what: body.what } }, { status: 201 });
}
