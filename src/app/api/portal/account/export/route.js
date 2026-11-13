// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// POST {}  ->  202 { requestedAt }
//   Queues the data export (zip of CSV + files). The link is emailed within 24 hours and works for 7 days.
//   Card numbers are never included.
import { stubError, stubShouldFail } from "@/lib/portal/stub";

export async function POST(request) {
  if (stubShouldFail(request)) return stubError(500, "server_error", "Could not request the export.");
  return Response.json({ requestedAt: new Date().toISOString() }, { status: 202 });
}
