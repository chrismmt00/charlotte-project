// STUB until the back end ships this route. Requires an admin session in the real handler.
//
// POST /api/admin/outreach/run   (starts Claude Cowork's search now instead of waiting for 8:00)
//   body {}
//   -> 202 { runId, startedAt, steps: 5 }
//   -> 409 { error: "already_running", runId }
// The real run reports progress through GET /api/admin/outreach (run.status, run.step); the screen
// currently steps through the five stages on a timer.
export function POST() {
  return Response.json({ runId: `run_${Date.now().toString(36)}`, startedAt: new Date().toISOString(), steps: 5 }, { status: 202 });
}
