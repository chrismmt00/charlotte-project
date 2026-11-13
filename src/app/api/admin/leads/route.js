import { listLeads } from "@/lib/admin/sample-leads";

// STUB until the back end ships this route. Requires an admin session in the real handler.
//
// GET /api/admin/leads
//   -> 200 { leads: LeadRow[] }   (shape documented in src/lib/admin/sample-leads.js)
//
// POST /api/admin/leads
//   body { business, name, email, phone?, offerCode?, offer?, source?, owner?, status?, notes?, runSiteCheck?: boolean }
//   -> 201 { lead: LeadRow }      (status defaults to "New", owner to "Chris")
//   -> 422 { error: "invalid", fields: { business?: string, name?: string, email?: string } }
export function GET() {
  return Response.json({ leads: listLeads() });
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const fields = {};
  if (!body.business?.trim()) fields.business = "Enter the business name";
  if (!body.name?.trim()) fields.name = "Enter a contact name";
  if (!EMAIL.test(body.email || "")) fields.email = "Enter a valid email";
  if (Object.keys(fields).length) return Response.json({ error: "invalid", fields }, { status: 422 });
  const lead = {
    id: `ld_${Date.now().toString(36)}`,
    business: body.business.trim(),
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone || "",
    offerCode: body.offerCode || null,
    offer: body.offer || "Not sure yet",
    source: body.source || "Other",
    status: body.status || "New",
    score: 3,
    owner: body.owner || "Chris",
    next: "—",
    when: "Just now",
    ageHours: 0,
    message: body.notes || "",
  };
  return Response.json({ lead }, { status: 201 });
}
