import { PROPOSALS } from "@/lib/admin/sample-proposals";

// STUB until the back end ships this route. Requires an admin session in the real handler.
// GET  /api/admin/proposals -> 200 { proposals: Proposal[] }   (shape in src/lib/admin/sample-proposals.js)
// POST /api/admin/proposals
//   body { leadId, business, name, offerCode, addOns: { [code]: qty }, monthly: boolean, quote?: number,
//          scopeOff: number[], extras, caps: { pages, rounds, integrations, hosting, support, changes },
//          termsTemplate, validDays, earliestStart }
//   -> 201 { proposal: Proposal }  (status "Draft", id PR-xxxx, token for /p/[token])
//   -> 422 { error: { code: "invalid", message, fields } }  monthly:false on RC/RK is rejected
export function GET() {
  return Response.json({ proposals: PROPOSALS });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 });
  }
  const fields = {};
  if (!String(body.name || "").trim()) fields.name = "Give the proposal a name";
  if (!body.offerCode) fields.offerCode = "Pick an offer";
  if ((body.offerCode === "RC" || body.offerCode === "RK") && body.monthly === false) fields.monthly = "The monthly is required for restaurants";
  if (Object.keys(fields).length) return Response.json({ error: { code: "invalid", message: "Fix the highlighted fields.", fields } }, { status: 422 });
  const n = String(PROPOSALS.length + 1).padStart(4, "0");
  return Response.json({ proposal: { ...body, id: `PR-${n}`, token: `new-${Date.now().toString(36)}`, status: "Draft" } }, { status: 201 });
}
