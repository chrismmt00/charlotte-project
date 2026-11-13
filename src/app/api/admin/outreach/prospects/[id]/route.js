// STUB until the back end ships this route. Requires an admin session in the real handler.
//
// PATCH /api/admin/outreach/prospects/[id]
//   body: any subset of { phase, owner, next,
//          demo: { builder: "Claude"|"Chris"|"Geoffrey"|"Demetrius", notifyProspect: boolean },   (assign or hand off a demo)
//          convert: true }                                                                        (creates a lead with source "Outreach")
//   -> 200 { prospect: { id, ...changedFields }, leadId? }
export async function PATCH(request, { params }) {
  const { id } = await params;
  let b;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const out = { prospect: { id, ...b } };
  if (b.convert) out.leadId = `ld_${id.replace("pr_", "o")}`;
  return Response.json(out);
}
