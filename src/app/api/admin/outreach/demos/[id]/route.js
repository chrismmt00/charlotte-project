import { getDemo } from "@/lib/admin/sample-outreach";

// STUB until the back end ships this route. Requires an admin session in the real handler.
//
// GET /api/admin/outreach/demos/[id]
//   -> 200 { demo: Demo }   (shape documented in src/lib/admin/sample-outreach.js)
//   -> 404 { error: "not_found" }
//
// POST /api/admin/outreach/demos/[id]
//   body { action: "cancel" }
//     -> 200 { id, status: "cancelled", prospect: { phase: "Replied" } }
//   body { action: "handoff", to: "Chris"|"Geoffrey"|"Demetrius", note?, name?, tagline? }
//     -> 200 { id, status: "handed", prospect: { owner, phase: "Demo in progress" } }
//   -> 422 { error: "invalid", message }
// Approving a demo or requesting changes goes through POST /api/admin/outreach/approvals/[approvalId].
export async function GET(request, { params }) {
  const { id } = await params;
  const demo = getDemo(id);
  if (!demo) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ demo });
}

export async function POST(request, { params }) {
  const { id } = await params;
  let b;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (b.action === "cancel") return Response.json({ id, status: "cancelled", prospect: { phase: "Replied" } });
  if (b.action === "handoff" && b.to) return Response.json({ id, status: "handed", prospect: { owner: b.to, phase: "Demo in progress" } });
  return Response.json({ error: "invalid", message: "action must be cancel or handoff (with to)" }, { status: 422 });
}
