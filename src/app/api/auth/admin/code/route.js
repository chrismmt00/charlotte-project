// STUB until Auth.js replaces it. No real code is ever sent or stored: any 6 digits are accepted except 000000,
// which is rejected so the error state can be seen.
//
// POST /api/auth/admin/code   { code: "123456", trustDevice?: boolean }
//   200 -> { next: "/admin" }
//   401 -> { error: "That code didn’t work." }
// POST /api/auth/admin/code   { resend: true }
//   200 -> { sent: true }       (a real one allows 3 sends an hour)
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a 6-digit code." }, { status: 400 });
  }
  if (body?.resend) return Response.json({ sent: true });
  const code = String(body?.code || "");
  if (!/^\d{6}$/.test(code) || code === "000000") return Response.json({ error: "That code didn’t work." }, { status: 401 });
  return Response.json({ next: "/admin" });
}
