// STUB until Auth.js replaces it. Reset links work once and expire in 1 hour; every other session is signed
// out when the password changes.
//
// POST /api/auth/admin/reset   { email }
//   200 -> { sent: true }    always, whether or not the email is on the team (no account probing)
// POST /api/auth/admin/reset   { token, password }
//   200 -> { next: "/admin" }
//   400 -> { error } when the password is under 12 characters
//   410 -> { error: "This reset link has expired." } when the token is "expired"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }
  if (body?.token) {
    if (body.token === "expired") return Response.json({ error: "This reset link has expired." }, { status: 410 });
    if (String(body.password || "").length < 12) return Response.json({ error: "Use at least 12 characters." }, { status: 400 });
    return Response.json({ next: "/admin" });
  }
  if (!EMAIL_RE.test(String(body?.email || "").trim())) return Response.json({ error: "Enter a work email." }, { status: 400 });
  return Response.json({ sent: true });
}
