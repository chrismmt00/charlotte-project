// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/bookings/discount   Stores: create a coupon in the owner's own Stripe account.
// Request:  { code: string (required), amount: "10% off" | "15% off" | "$5 off" | "Free shipping", minimum?: string, ends?: "YYYY-MM-DD" }
// 201:      { id: string, code: string }
// 400:      { error: string }
import { bad, delay, devFail, newId, readJson } from "@/lib/app/stub";

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const body = await readJson(request);
  if (!body || !String(body.code || "").trim()) return bad("Give the discount a code.");
  await delay(400);
  return Response.json({ id: newId("cpn"), code: String(body.code).trim().toUpperCase() }, { status: 201 });
}
