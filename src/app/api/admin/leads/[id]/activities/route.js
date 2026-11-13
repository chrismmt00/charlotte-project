// STUB until the back end ships this route. Requires an admin session in the real handler.
//
// POST /api/admin/leads/[id]/activities
//   body { kind: "call"|"email"|"note", body, at: "YYYY-MM-DDTHH:MM",
//          outcome?, minutes?                         (call)
//          direction?: "Sent"|"Received", subject?    (email)
//          nextAction?: { type, date, owner } }
//   -> 201 { activity: { id, kind, title, meta, body } }
//   -> 422 { error: "invalid", fields: { kind?: string, body?: string } }
export async function POST(request, { params }) {
  const { id } = await params;
  let b;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!["call", "email", "note"].includes(b.kind)) return Response.json({ error: "invalid", fields: { kind: "Pick call, email or note" } }, { status: 422 });
  if (b.kind === "note" && !b.body?.trim()) return Response.json({ error: "invalid", fields: { body: "Write the note" } }, { status: 422 });
  const title =
    b.kind === "call"
      ? `Call · ${b.outcome || "Answered"}${b.minutes ? ` · ${b.minutes} min` : ""}`
      : b.kind === "email"
        ? `Email ${(b.direction || "Sent").toLowerCase()}${b.subject ? ` · “${b.subject}”` : ""}`
        : "Note";
  return Response.json({ activity: { id: `${id}_a${Date.now().toString(36)}`, kind: b.kind, title, meta: "just now · Chris", body: b.body || "" } }, { status: 201 });
}
