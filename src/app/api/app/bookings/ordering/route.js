// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/bookings/ordering   Restaurants: pause or resume online ordering. The kiosk keeps running.
// Request:  { paused: boolean, resume?: "30m" | "1h" | "tomorrow" | "manual" }
// 200:      { paused: boolean, resume: string | null }
import { delay, devFail, readJson } from "@/lib/app/stub";

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const body = (await readJson(request)) || {};
  await delay(300);
  return Response.json({ paused: !!body.paused, resume: body.paused ? body.resume || "manual" : null });
}
