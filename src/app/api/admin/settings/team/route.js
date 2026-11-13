// STUB until the back end ships this route. Owner only; the real route also writes an audit row,
// signs the removed person out the moment they are removed, and emails the invite link (valid 7 days).
//
// POST /api/admin/settings/team
//   { action: "invite", email, role: "Owner" | "Builder" }  -> 201 { member: { id, name, email, role, active: "Invited", tfa: "Off", human: true, pending: true } }
//   { action: "role", id, role: "Owner" | "Builder" }        -> 200 { member: { id, role } }
//   { action: "remove", id, reassignTo }                      -> 200 { ok: true }
//   { action: "rotate-key" }                                  -> 200 { rotatedAt }   the new key is shown once in the Cowork setup, not returned here
//   400 -> { error: { code: "invalid", message } }   403 -> { error: { code: "owner_only", message } }
// Claude is never invited; it has the Agent role through an API key.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ["Owner", "Builder"];

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 });
  }
  const bad = (message) => Response.json({ error: { code: "invalid", message } }, { status: 400 });
  switch (body?.action) {
    case "invite": {
      const email = String(body.email || "").trim();
      if (!EMAIL_RE.test(email)) return bad("Enter a work email like name@klyvora.ai.");
      if (!ROLES.includes(body.role)) return bad("Pick Owner or Builder.");
      const name = email.split("@")[0];
      const nice = name.charAt(0).toUpperCase() + name.slice(1);
      return Response.json(
        { member: { id: `p_${Date.now().toString(36)}`, name: nice, email, role: body.role, active: "Invited", tfa: "Off", human: true, pending: true } },
        { status: 201 }
      );
    }
    case "role":
      if (!body.id || !ROLES.includes(body.role)) return bad("Pick a person and a role.");
      return Response.json({ member: { id: body.id, role: body.role } });
    case "remove":
      if (!body.id) return bad("Pick a person.");
      return Response.json({ ok: true });
    case "rotate-key":
      return Response.json({ rotatedAt: new Date().toISOString() });
    default:
      return bad("Unknown action.");
  }
}
