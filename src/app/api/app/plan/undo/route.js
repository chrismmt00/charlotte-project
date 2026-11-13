// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/plan/undo   Take back a cancellation notice while the plan is still running.
// Request:  {}
// 200:      { canceled: false }
import { delay, devFail } from "@/lib/app/stub";

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  await delay(300);
  return Response.json({ canceled: false });
}
