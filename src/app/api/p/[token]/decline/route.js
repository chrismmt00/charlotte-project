import { publicProposal } from "@/lib/admin/sample-proposals";

// STUB until the back end ships this route. The real route closes the proposal, saves the reason on the lead and
// stops the nudges.
// POST /api/p/[token]/decline
//   body { reason?: string }
//   -> 200 { status: "Declined" }
//   -> 409 { error: { code: "closed", message } } expired, declined or already signed | 404 unknown token
export async function POST(_request, { params }) {
  const { token } = await params;
  const pr = publicProposal(token);
  if (!pr) return Response.json({ error: { code: "not_found", message: "No such proposal." } }, { status: 404 });
  if (pr.state !== "open" && pr.state !== "draft") {
    return Response.json({ error: { code: "closed", message: "This proposal is no longer open." } }, { status: 409 });
  }
  return Response.json({ status: "Declined" });
}
