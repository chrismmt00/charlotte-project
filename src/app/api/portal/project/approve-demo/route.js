// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// POST { note? }  ->  200 { invoice: { id, percent: 30, amount } }
//   Only the signer may approve. Approving the working demo moves the project to launch and creates and
//   sends the 30% invoice. 409 { error: { code: "wrong_stage" } } if the project is not at the demo stage.
import { PROJECT, offerFor, partAmount } from "@/lib/portal/sample";
import { readJson, stubError, stubShouldFail } from "@/lib/portal/stub";

export async function POST(request) {
  if (stubShouldFail(request)) return stubError(500, "server_error", "Could not approve the demo.");
  await readJson(request);
  return Response.json({ invoice: { id: "INV-0013", percent: 30, amount: partAmount(offerFor(PROJECT.offerCode), 30) } });
}
