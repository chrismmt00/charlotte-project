import { getClient } from "@/lib/admin/sample-clients";

// STUB until the back end ships this route.
// POST /api/admin/clients/[id]/contacts
//   body { name, role, email, phone?, gets: ("updates"|"invoices"|"tickets")[], invite: boolean }
//   -> 201 { contact: { id, name, role, email, phone, primary: false, access: "Invited · just now"|"Not invited", gets } }
//   -> 422 { error: { code: "invalid", message, fields } } | 404 unknown client
export async function POST(request, { params }) {
  const { id } = await params;
  if (!getClient(id)) return Response.json({ error: { code: "not_found", message: "No such client." } }, { status: 404 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 });
  }
  const fields = {};
  if (!String(body.name || "").trim()) fields.name = "Enter a name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || "")) fields.email = "Enter a valid email";
  if (Object.keys(fields).length) return Response.json({ error: { code: "invalid", message: "Fix the highlighted fields.", fields } }, { status: 422 });
  const gets = Array.isArray(body.gets) ? body.gets : [];
  return Response.json(
    {
      contact: {
        id: `ct_${Date.now().toString(36)}`,
        name: body.name.trim(),
        role: body.role || "Other",
        email: body.email,
        phone: body.phone || "",
        primary: false,
        access: body.invite ? "Invited · just now" : "Not invited",
        gets: gets.join(", ") || "Nothing",
      },
    },
    { status: 201 },
  );
}
