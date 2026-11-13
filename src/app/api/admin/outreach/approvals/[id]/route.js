// STUB until the back end ships this route. Requires an admin session in the real handler.
// Nothing reaches a prospect until a person calls this route with action "approve".
//
// POST /api/admin/outreach/approvals/[id]
//   body { action: "approve" | "edit" | "reject",
//          kind: "email" | "demo", prospectId,
//          email?: { to, from, subject, body, attach, followUp }   (approve or edit of an email; "edit" saves the draft)
//          note?: string }   (demo approve: the note sent with the link; demo reject: what Claude should change)
//   -> 200 { id, action, status: "sent" | "saved" | "rejected", prospect: { id, phase, next } }
//   -> 422 { error: "invalid", message }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request, { params }) {
  const { id } = await params;
  let b;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!["approve", "edit", "reject"].includes(b.action)) return Response.json({ error: "invalid", message: "action must be approve, edit or reject" }, { status: 422 });
  if (b.email && b.action !== "reject") {
    if (!EMAIL.test(b.email.to || "")) return Response.json({ error: "invalid", message: "Enter a valid To address." }, { status: 422 });
    if (!b.email.subject?.trim()) return Response.json({ error: "invalid", message: "Add a subject." }, { status: 422 });
  }
  const demo = b.kind === "demo";
  const status = b.action === "approve" ? "sent" : b.action === "edit" ? "saved" : "rejected";
  const prospect = demo
    ? b.action === "approve"
      ? { phase: "Demo sent", next: "Wait for feedback; follow up in 3 days" }
      : b.action === "reject"
        ? { phase: "Demo in progress", next: "Claude rebuilds the demo with your notes" }
        : { phase: "Demo ready for review", next: "Waiting for approval" }
    : b.action === "approve"
      ? { phase: "Emailed", next: "Follow up in 3 days if no reply" }
      : b.action === "reject"
        ? { phase: "Researched", next: "Skipped · Claude won’t redraft for 30 days" }
        : { phase: "Email drafted", next: "Waiting for approval" };
  return Response.json({ id, action: b.action, status, prospect: { id: b.prospectId || null, ...prospect } });
}
