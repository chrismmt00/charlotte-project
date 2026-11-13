// STUB until the back end ships this route. Requires an admin session in the real handler.
//
// POST /api/admin/outreach/activities   (outreach done by a person: a call, visit, text, email or event)
//   body { prospectId: string | null, newProspect?: { business, type }, kind: "Call"|"Visit"|"Text / DM"|"Email"|"Event",
//          outcome, at: "YYYY-MM-DDTHH:MM", notes?, next?, countsTowardWeek: boolean, callId? }
//   -> 201 { activity: { id, who, text, when } }
//   -> 422 { error: "invalid", fields: { business?: string } }
export async function POST(request) {
  let b;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!b.prospectId && !b.newProspect?.business?.trim()) {
    return Response.json({ error: "invalid", fields: { business: "Enter the business name" } }, { status: 422 });
  }
  const text = `${b.kind} · ${b.outcome}${b.notes ? ` · ${b.notes}` : ""}`;
  return Response.json({ activity: { id: `oa_${Date.now().toString(36)}`, who: "Chris", text, when: "just now" } }, { status: 201 });
}
