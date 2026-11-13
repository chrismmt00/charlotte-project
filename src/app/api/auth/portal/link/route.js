// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// Magic-link request for the client portal.
// POST { email }  ->  200 { sent: true }
//   The real route always answers 200, whether or not the email belongs to a project, so addresses cannot be
//   probed. It emails the link only for a known contact, and logs unknown addresses.
//   400 { error: { code: "invalid_email", message } }   not an email
//   x-stub-fail: 1 (development only) makes this stub answer 503.
import { EMAIL_RE, readJson, stubError, stubShouldFail } from "@/lib/portal/stub";

export async function POST(request) {
  if (stubShouldFail(request)) return stubError(503, "unavailable", "Could not send the email.");
  const body = await readJson(request);
  const email = String(body?.email || "").trim();
  if (!EMAIL_RE.test(email) && !email.startsWith("[")) return stubError(400, "invalid_email", "Enter the email on your proposal.");
  return Response.json({ sent: true });
}
