// STUB until the back end ships this route. Requires an admin session in the real handler.
// Partners are not prospects: they never get Claude's cold emails.
//
// POST /api/admin/outreach/partners
//   body { name, type, owner, email?, phone? }   -> 201 { partner: Partner }   (shape in src/lib/admin/sample-outreach.js)
//   body { partnerId, touch: true, note? }        -> 200 { partner: { id, last: "just now", overdue: false } }
//   -> 422 { error: "invalid", fields: { name?: string } }
export async function POST(request) {
  let b;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (b.touch) return Response.json({ partner: { id: b.partnerId, last: "just now", overdue: false } });
  if (!b.name?.trim()) return Response.json({ error: "invalid", fields: { name: "Enter the partner’s name" } }, { status: 422 });
  return Response.json(
    { partner: { id: `pt_${Date.now().toString(36)}`, name: b.name.trim(), type: b.type || "Other", last: "just now", overdue: false, referrals: 0, signed: 0, owner: b.owner || "Chris" } },
    { status: 201 }
  );
}
