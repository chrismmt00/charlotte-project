// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// POST { signatureName, title? }  ->  200 { invoice: { id, percent: 20, amount }, planStarted }
//   Typed e-signature. Makes the 20% invoice due, releases the code and handover pack, and starts the
//   monthly plan if one was chosen (planStarted is false when none was).
//   400 { error: { code: "signature_required" } } when signatureName is shorter than 4 characters.
import { PROJECT, offerFor, partAmount } from "@/lib/portal/sample";
import { readJson, stubError, stubShouldFail } from "@/lib/portal/stub";

export async function POST(request) {
  if (stubShouldFail(request)) return stubError(500, "server_error", "Could not save the signature.");
  const body = await readJson(request);
  const name = String(body?.signatureName || "").trim();
  if (name.length < 4) return stubError(400, "signature_required", "Type your full name to sign.");
  return Response.json({ invoice: { id: "INV-0014", percent: 20, amount: partAmount(offerFor(PROJECT.offerCode), 20) }, planStarted: PROJECT.monthlyChosen });
}
