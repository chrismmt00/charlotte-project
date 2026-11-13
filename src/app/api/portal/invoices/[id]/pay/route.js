// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// POST { method: "card" | "other" }  ->  200 { checkoutUrl, paid: false }
//   The real route creates a Stripe Checkout session on the CLIENT's own Stripe account (Klyvora's cut is $0)
//   and returns its URL. For method "card" it may charge the card on file and answer { paid: true }.
//   402 { error: { code: "card_declined", message } }   the bank declined; nothing charged
//   x-stub-fail: 1 (development only) makes this stub answer 402.
import { stubError, stubShouldFail } from "@/lib/portal/stub";

export async function POST(request, ctx) {
  const { id } = await ctx.params;
  if (stubShouldFail(request)) return stubError(402, "card_declined", "Your bank declined the card. Nothing was charged.");
  return Response.json({ checkoutUrl: `https://checkout.stripe.com/c/pay/placeholder-${encodeURIComponent(id)}`, paid: false });
}
