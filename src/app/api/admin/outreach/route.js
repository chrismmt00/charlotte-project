import { getOutreach } from "@/lib/admin/sample-outreach";

// STUB until the back end ships this route. Requires an admin session in the real handler.
//
// GET /api/admin/outreach
//   -> 200 { stats, queue, run, prospects, calls, scripts, partners }
//   (every shape is documented at the top of src/lib/admin/sample-outreach.js)
export function GET() {
  return Response.json(getOutreach());
}
