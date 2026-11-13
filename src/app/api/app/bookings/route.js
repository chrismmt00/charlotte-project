// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/bookings   Add a walk-in or phone booking.
// Request:  { name: string (required), phone?: string, service: string, slot: string, depositInPerson: boolean, day?: number }
// 201:      { id: string, time: string, who: string, what: string, status: "No deposit" | "Deposit paid" }
// 400:      { error: string }   (name missing)
import { bad, delay, devFail, newId, readJson } from "@/lib/app/stub";

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const body = await readJson(request);
  if (!body || !String(body.name || "").trim()) return bad("Add a name so it shows in the list.");
  await delay(400);
  return Response.json(
    { id: newId("bk"), time: "2:00", who: String(body.name).trim(), what: `${body.service} · added by you`, status: body.depositInPerson ? "Deposit paid" : "No deposit" },
    { status: 201 }
  );
}
