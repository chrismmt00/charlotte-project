// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/bookings/:id/cancel   Cancel a booking (or an order), text the customer, optionally refund.
// Request:  { reason: string, refund: boolean }
// 200:      { id: string, canceled: true, refunded: boolean }
import { delay, devFail, readJson } from "@/lib/app/stub";

export async function POST(request, { params }) {
  const failed = devFail(request);
  if (failed) return failed;
  const { id } = await params;
  const body = (await readJson(request)) || {};
  await delay(400);
  return Response.json({ id, canceled: true, refunded: !!body.refund });
}
