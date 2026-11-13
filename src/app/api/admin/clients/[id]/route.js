import { getClient } from "@/lib/admin/sample-clients";

// STUB until the back end ships this route. Requires an admin session in the real handler.
// GET   /api/admin/clients/[id] -> 200 { client: Client } | 404 { error: { code: "not_found", message } }
// PATCH /api/admin/clients/[id]
//   body { business?, legalName?, address?, domain?, offerCode?, stage?, owner?, monthly?: boolean, template?: boolean, notes? }
//   -> 200 { client: Client }
//   -> 422 { error: { code: "invalid", message, fields } }  e.g. monthly:false on a restaurant offer (RC, RK), blank business
// Changing offer or plan writes an audit line and never touches Stripe until confirmed on the Subscriptions tab.
const missing = () => Response.json({ error: { code: "not_found", message: "No such client." } }, { status: 404 });

export async function GET(_request, { params }) {
  const { id } = await params;
  const client = getClient(id);
  return client ? Response.json({ client }) : missing();
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) return missing();
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 });
  }
  const fields = {};
  if ("business" in body && !String(body.business).trim()) fields.business = "Enter the business name";
  const offerCode = body.offerCode || client.offerCode;
  if (body.monthly === false && (offerCode === "RC" || offerCode === "RK")) fields.monthly = "The monthly is required for restaurants";
  if (Object.keys(fields).length) return Response.json({ error: { code: "invalid", message: "Fix the highlighted fields.", fields } }, { status: 422 });
  return Response.json({ client: { ...client, ...body } });
}
