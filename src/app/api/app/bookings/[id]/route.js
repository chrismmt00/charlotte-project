// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// PATCH /api/app/bookings/:id   Move a booking or order along, mark a no-show, or reschedule.
// Request:  { action: "status", status: string }                     advance (Check in, Start, Pack, ...)
//         | { action: "no-show" }                                    booking only; the deposit is kept
//         | { action: "reschedule", day: number, time?: string }     booking only
// 200:      { id: string, status: string, day?: number }
// 400:      { error: string }
import { bad, delay, devFail, readJson } from "@/lib/app/stub";

export async function PATCH(request, { params }) {
  const failed = devFail(request);
  if (failed) return failed;
  const { id } = await params;
  const body = await readJson(request);
  if (!body || !["status", "no-show", "reschedule"].includes(body.action)) return bad("Unknown action.");
  await delay(250);
  const status = body.action === "no-show" ? "No-show" : body.status;
  return Response.json({ id, status, day: body.day });
}
