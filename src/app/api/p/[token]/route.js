import { publicProposal } from "@/lib/admin/sample-proposals";

// STUB until the back end ships this route. Public: no session, the token is the credential. The real route
// records a view (Activity) and never returns internal notes.
// GET /api/p/[token] -> 200 { proposal: PublicProposal } (shape in src/lib/admin/sample-proposals.js)
//                    -> 404 { error: { code: "not_found", message } }
export async function GET(_request, { params }) {
  const { token } = await params;
  const proposal = publicProposal(token);
  if (!proposal) return Response.json({ error: { code: "not_found", message: "No such proposal." } }, { status: 404 });
  return Response.json({ proposal });
}
