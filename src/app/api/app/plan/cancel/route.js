// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/plan/cancel   Give notice on the monthly plan. The client keeps site, code, domain, data and Stripe.
// Hosting, this admin, support and small changes stop after the notice period. Restaurant plans are required
// while ordering and the kiosk run on Klyvora, so for them this records a request to move ordering to their own hosting.
// Request:  { reason?: "Cost" | "We can host it ourselves" | "Closing or selling the business" | "Something else" }
// 200:      { canceled: true, endsOn: string, requested?: boolean }
import { delay, devFail, readJson } from "@/lib/app/stub";

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  await readJson(request);
  await delay(500);
  return Response.json({ canceled: true, endsOn: "[date + notice]" });
}
