import { getProposal } from "@/lib/admin/sample-proposals";

// STUB until the back end ships this route.
// GET   /api/admin/proposals/[id] -> 200 { proposal } | 404
// PATCH /api/admin/proposals/[id]
//   body { status: "Accepted" | "Declined" | "Sent", note? }  (mark signed on paper, mark declined, send a nudge)
//     -> 200 { proposal: { id, status } } | 422 for an unknown status
//   body without status = save the draft (full builder body, same as POST) -> 200 { proposal } | 422 { error: { fields } }
const missing = () => Response.json({ error: { code: "not_found", message: "No such proposal." } }, { status: 404 });

export async function GET(_request, { params }) {
  const { id } = await params;
  const proposal = getProposal(id);
  return proposal ? Response.json({ proposal }) : missing();
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  if (!getProposal(id)) return missing();
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 });
  }
  if (body.status === undefined) {
    // Draft save: the full builder body, same shape as POST /api/admin/proposals.
    if ((body.offerCode === "RC" || body.offerCode === "RK") && body.monthly === false) {
      return Response.json({ error: { code: "invalid", message: "The monthly is required for restaurants.", fields: { monthly: "Required" } } }, { status: 422 });
    }
    return Response.json({ proposal: { ...body, id } });
  }
  if (!["Accepted", "Declined", "Sent"].includes(body.status)) {
    return Response.json({ error: { code: "invalid", message: "Unknown status." } }, { status: 422 });
  }
  return Response.json({ proposal: { id, status: body.status } });
}
