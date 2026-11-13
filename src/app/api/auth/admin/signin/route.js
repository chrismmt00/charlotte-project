// STUB until Auth.js replaces it (the back end wires real credentials, rate limits, lockout and sessions).
// This stub never checks a real password and never stores one: it accepts any well-formed email with a
// password of 8 or more characters and rejects anything shorter, so both outcomes can be seen.
//
// POST /api/auth/admin/signin   { email, password, stay? }
//   200 -> { next: "/admin/signin/code" }      password accepted; the two-factor code comes next on new devices
//   401 -> { error: "That email and password don’t match.", triesLeft: 4 }
//   400 -> { error: "Send an email and a password." }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send an email and a password." }, { status: 400 });
  }
  const email = String(body?.email || "").trim();
  const password = String(body?.password || "");
  if (!EMAIL_RE.test(email) || !password) return Response.json({ error: "Send an email and a password." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "That email and password don’t match.", triesLeft: 4 }, { status: 401 });
  return Response.json({ next: "/admin/signin/code" });
}
