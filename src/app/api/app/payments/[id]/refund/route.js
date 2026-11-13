// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/payments/:id/refund   Refund a payment through the owner's own Stripe account.
// Request:  { amount: "full" | "deposit" | "other", other?: string, reason: "Customer asked" | "We had to cancel" | "Duplicate charge" | "Other" }
// 200:      { id: string, status: "Refunded" }
// 400:      { error: string }   (amount "other" without a value)
import { bad, delay, devFail, readJson } from "@/lib/app/stub";

export async function POST(request, { params }) {
  const failed = devFail(request);
  if (failed) return failed;
  const { id } = await params;
  const body = await readJson(request);
  if (!body || !["full", "deposit", "other"].includes(body.amount)) return bad("Choose how much to refund.");
  if (body.amount === "other" && !String(body.other || "").trim()) return bad("Enter the amount to refund.");
  await delay(500);
  return Response.json({ id, status: "Refunded" });
}
