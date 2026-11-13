// STUB until the back-end session ships the real route (docs/prompts/BACKEND-LOOP.md, item 3).
// Contract: POST { name, business?, email, phone?, siteUrl?, message, source, offerCode?, company_website? }
//   201 { id }                         on success
//   400 { error: { code, message } }   on validation failure
// The real route validates with zod, rate-limits by IP, stores a Lead + Activity and sends Brevo emails.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 });
  }
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const message = String(body?.message || "").trim();
  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return Response.json({ error: { code: "invalid", message: "Name, a valid email and a short message are required." } }, { status: 400 });
  }
  // Honeypot filled in: pretend success, store nothing.
  if (body?.company_website) {
    return Response.json({ id: "ignored" }, { status: 201 });
  }
  const id = `stub_${Date.now().toString(36)}`;
  console.log("[lead stub]", { id, source: body.source, offerCode: body.offerCode || null, name, email });
  return Response.json({ id }, { status: 201 });
}
