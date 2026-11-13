import { getClient } from "@/lib/admin/sample-clients";

// STUB until the back end ships this route. The real route sends a Brevo magic-link email (valid 7 days).
// POST /api/admin/clients/[id]/invite
//   body { contactId?: string, email?: string, can: ("project"|"approve"|"invoices"|"tickets")[] }
//   -> 200 { invite: { email, expiresInDays: 7 } }
//   -> 422 { error: { code: "invalid", message } } | 404 unknown client
export async function POST(request, { params }) {
  const { id } = await params;
  if (!getClient(id)) return Response.json({ error: { code: "not_found", message: "No such client." } }, { status: 404 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 });
  }
  const email = String(body.email || "");
  if (!body.contactId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: { code: "invalid", message: "Pick a contact or enter an email." } }, { status: 422 });
  }
  return Response.json({ invite: { email: email || "[contact email]", expiresInDays: 7 } });
}
