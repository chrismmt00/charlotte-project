// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// POST {}  ->  200 { setupUrl }
//   Starts a Stripe setup session on the client's own Stripe account. The client returns with only the last
//   four digits, brand and expiry; the old card is detached once the new one is saved.
import { stubError, stubShouldFail } from "@/lib/portal/stub";

export async function POST(request) {
  if (stubShouldFail(request)) return stubError(500, "server_error", "Could not reach Stripe.");
  return Response.json({ setupUrl: "https://checkout.stripe.com/c/setup/placeholder" });
}
