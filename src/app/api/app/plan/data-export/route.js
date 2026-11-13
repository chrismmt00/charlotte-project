// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/plan/data-export   Request an export of customers, orders or bookings, photos and text. Emailed within 24 hours.
// Request:  {}
// 202:      { requested: true }
import { delay, devFail } from "@/lib/app/stub";

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  await delay(400);
  return Response.json({ requested: true }, { status: 202 });
}
