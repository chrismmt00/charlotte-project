// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// GET /api/portal/invoices -> 200 { invoices, card, plan }
//   invoices: [{ id, name, percent, amount, status: paid|due|after-approval|not-yet, dueLabel, note, receiptUrl }]
//   card: { brand, last4, exp }    plan: { monthly, status: none|pending|active|ending, required }
import { CARD, PROJECT, invoices, offerFor } from "@/lib/portal/sample";
import { stubError, stubShouldFail } from "@/lib/portal/stub";

export async function GET(request) {
  if (stubShouldFail(request)) return stubError(500, "server_error", "Could not load invoices.");
  const offer = offerFor(PROJECT.offerCode);
  return Response.json({
    invoices: invoices(offer, PROJECT.stage),
    card: CARD,
    plan: { monthly: offer.monthly, status: PROJECT.monthlyChosen ? "pending" : "none", required: offer.monthlyRequired },
  });
}
