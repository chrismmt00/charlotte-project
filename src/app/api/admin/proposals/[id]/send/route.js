import { getProposal } from "@/lib/admin/sample-proposals";

// STUB until the back end ships this route. The real route freezes the prices, emails the link through Brevo
// and moves the lead to "Proposal sent".
// POST /api/admin/proposals/[id]/send
//   body { to, cc?, message, autoNudge: boolean }
//   -> 200 { proposal: { id, status: "Sent", link: "https://klyvora.ai/p/[token]", expiresInDays } }
//   -> 422 { error: { code: "invalid", message, fields } } | 404 unknown proposal
export async function POST(request, { params }) {
  const { id } = await params;
  const pr = getProposal(id);
  if (!pr) return Response.json({ error: { code: "not_found", message: "No such proposal." } }, { status: 404 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to || "")) {
    return Response.json({ error: { code: "invalid", message: "Enter a valid email to send to.", fields: { to: "Enter a valid email" } } }, { status: 422 });
  }
  return Response.json({ proposal: { id, status: "Sent", link: `https://klyvora.ai/p/${pr.token}`, expiresInDays: pr.validDays } });
}
