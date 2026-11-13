import { publicProposal } from "@/lib/admin/sample-proposals";

// STUB until the back end ships this route. The real route stores the typed signature with timestamp, IP and the page
// version, creates the client, the project with its three milestones and the kickoff invoice, schedules the monthly
// for launch, and emails the portal link.
// POST /api/p/[token]/accept
//   body { signatureName: string, monthly: boolean }
//   -> 200 { status: "Accepted" }
//   -> 422 { error: { code: "invalid", message } }  short signature, or monthly:false on RC/RK
//   -> 409 { error: { code: "closed", message } }   expired, declined or already signed
//   -> 404 unknown token
export async function POST(request, { params }) {
  const { token } = await params;
  const pr = publicProposal(token);
  if (!pr) return Response.json({ error: { code: "not_found", message: "No such proposal." } }, { status: 404 });
  if (pr.state === "expired" || pr.state === "declined" || pr.state === "signed") {
    return Response.json({ error: { code: "closed", message: "This proposal is no longer open." } }, { status: 409 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 });
  }
  if (String(body.signatureName || "").trim().length < 3) {
    return Response.json({ error: { code: "invalid", message: "Type your full name to sign." } }, { status: 422 });
  }
  if ((pr.offerCode === "RC" || pr.offerCode === "RK") && body.monthly === false) {
    return Response.json({ error: { code: "invalid", message: "The monthly plan is required for restaurants." } }, { status: 422 });
  }
  return Response.json({ status: "Accepted" });
}
