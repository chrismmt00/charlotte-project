// STUB until Auth.js replaces it. Invites work for 7 days. Claude is never invited this way; it gets an API
// key with the Agent role in Settings.
//
// POST /api/auth/admin/invite   { token, name, password }
//   200 -> { next: "/admin" }
//   400 -> { error } when the name is empty or the password is under 12 characters
//   410 -> { error: "This invite has expired." } when the token is "expired"
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }
  if (!body?.token || body.token === "expired") return Response.json({ error: "This invite has expired." }, { status: 410 });
  if (!String(body.name || "").trim() || String(body.password || "").length < 12) {
    return Response.json({ error: "Send a name and a password of 12 or more characters." }, { status: 400 });
  }
  return Response.json({ next: "/admin" });
}
