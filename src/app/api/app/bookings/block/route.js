// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/bookings/block   Block a window so it can't be booked online.
// Request:  { day: string ("Thursday [date]" | "Every week on this day" | ...), from: "HH:MM", to: "HH:MM", note?: string }
// 201:      { id: string, day: string, from: string, to: string }
// 400:      { error: string }   (to is not after from)
import { bad, delay, devFail, newId, readJson } from "@/lib/app/stub";

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const body = await readJson(request);
  if (!body || !body.from || !body.to || body.to <= body.from) return bad("The end time has to be after the start time.");
  await delay(400);
  return Response.json({ id: newId("blk"), day: body.day, from: body.from, to: body.to }, { status: 201 });
}
