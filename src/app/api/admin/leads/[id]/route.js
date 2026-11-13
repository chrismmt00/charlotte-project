import { getLead } from "@/lib/admin/sample-leads";

// STUB until the back end ships this route. Requires an admin session in the real handler.
//
// GET /api/admin/leads/[id]
//   -> 200 { lead: LeadDetail }   (shape documented in src/lib/admin/sample-leads.js)
//   -> 404 { error: "not_found" }
//
// PATCH /api/admin/leads/[id]
//   body: any subset of { status, owner, notes,
//          nextAction: { type, date: "YYYY-MM-DD", time: "HH:MM", owner, note, remind: boolean } | null,
//          lostReason, lostNote, recheckIn90Days: boolean,
//          convert: { monthly: boolean, sendDeposit: boolean, invitePortal: boolean } }
//   -> 200 { lead: { id, ...changedFields }, clientId? }
//   (convert marks the lead Signed and, on the back end, creates the client through POST /api/admin/clients)
//
// DELETE /api/admin/leads/[id]
//   -> 204 (no body)
export async function GET(request, { params }) {
  const { id } = await params;
  const lead = getLead(id);
  if (!lead) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ lead });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.status === "Lost" && body.lostReason === "") {
    return Response.json({ error: "invalid", fields: { lostReason: "Pick a reason" } }, { status: 422 });
  }
  const out = { lead: { id, ...body } };
  if (body.convert) {
    out.lead.status = "Signed";
    out.clientId = `cl_${id.replace("ld_", "")}`;
  }
  return Response.json(out);
}

export async function DELETE() {
  return new Response(null, { status: 204 });
}
