// STUB until Auth.js replaces it. "Email me a sign-in link instead" on the admin sign-in card.
// The link works once and expires in 15 minutes.
//
// POST /api/auth/admin/link   { email }
//   200 -> { sent: true }    always, whether or not the email is on the team (no account probing)
//   400 -> { error } for a malformed email
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }
  if (!EMAIL_RE.test(String(body?.email || "").trim())) return Response.json({ error: "Enter a work email." }, { status: 400 });
  return Response.json({ sent: true });
}
