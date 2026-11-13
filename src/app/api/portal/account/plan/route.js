// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// POST { action: "end", reason? }  ->  200 { endsOn }   ends the monthly plan 30 days out (signer only)
// POST { action: "keep" }          ->  200 { endsOn: null }   undo before it ends
//   403 { error: { code: "plan_required" } } for restaurant offers (RC, RK): the plan cannot be ended here.
import { PROJECT, offerFor } from "@/lib/portal/sample";
import { readJson, stubError, stubShouldFail } from "@/lib/portal/stub";

export async function POST(request) {
  if (stubShouldFail(request)) return stubError(500, "server_error", "Could not change the plan.");
  const body = await readJson(request);
  if (offerFor(PROJECT.offerCode).monthlyRequired) return stubError(403, "plan_required", "The monthly plan is required for this offer.");
  if (body?.action === "keep") return Response.json({ endsOn: null });
  return Response.json({ endsOn: "[Date + 30 days]" });
}
