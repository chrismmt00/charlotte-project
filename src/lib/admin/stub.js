// Helpers shared by the delivery and billing stub route handlers (projects, invoices, subscriptions, tickets).
// STUB until the back end ships the real routes: no database, no Stripe, no session check.

export async function readJson(request) {
  try {
    return { body: await request.json() };
  } catch {
    return { error: Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 }) };
  }
}

export function bad(message, code = "invalid", status = 400) {
  return Response.json({ error: { code, message } }, { status });
}

export function notFound(what) {
  return Response.json({ error: { code: "not_found", message: `${what} not found.` } }, { status: 404 });
}
