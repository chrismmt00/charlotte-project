// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// PUT /api/app/bookings/rules   Save booking rules (booking), ordering rules (restaurant) or store rules (store).
// Request:  { rules: { [ruleId: string]: string } }      e.g. { "r-dep": "$[x]", "r-buf": "10 min" }
// 200:      { saved: true, rules: { [ruleId: string]: string } }
import { bad, delay, devFail, readJson } from "@/lib/app/stub";

export async function PUT(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const body = await readJson(request);
  if (!body || typeof body.rules !== "object") return bad("Send the rules to save.");
  await delay(400);
  return Response.json({ saved: true, rules: body.rules });
}
