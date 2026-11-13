// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// POST { email }  ->  201 { person: { id, name, email, role: "invited" } }
//   Emails a sign-in link. Only the signer may invite. 400 { error: { code: "invalid_email" } }
import { EMAIL_RE, readJson, stubError, stubShouldFail } from "@/lib/portal/stub";

export async function POST(request) {
  if (stubShouldFail(request)) return stubError(500, "server_error", "Could not send the invite.");
  const body = await readJson(request);
  const email = String(body?.email || "").trim();
  if (!EMAIL_RE.test(email)) return stubError(400, "invalid_email", "Enter an email like name@yourbusiness.com.");
  return Response.json({ person: { id: `p_${Date.now().toString(36)}`, name: email.split("@")[0], email, role: "invited" } }, { status: 201 });
}
