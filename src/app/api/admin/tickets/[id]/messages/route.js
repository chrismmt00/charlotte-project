import { getTicket } from "@/lib/admin/sample-support";
import { readJson, bad, notFound } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session. No email is sent.
// POST /api/admin/tickets/[id]/messages { kind: "reply" | "note", body, after?: "Waiting on client"|"In progress"|"Closed"|"Keep status" }
//   -> 201 { message: { id, kind: "team" | "internal", body } }
//   A reply emails the client from the support address; a note is internal and never leaves the team.
//   400 { error } when the body is empty.
export async function POST(request, ctx) {
  const { id } = await ctx.params;
  if (!getTicket(id)) return notFound("Ticket");
  const { body, error } = await readJson(request);
  if (error) return error;
  if (!String(body?.body || "").trim()) return bad("Write something first.");
  if (!["reply", "note"].includes(body.kind)) return bad("kind must be reply or note.");
  return Response.json({ message: { id: `m_${Date.now().toString(36)}`, kind: body.kind === "reply" ? "team" : "internal", body: body.body } }, { status: 201 });
}
