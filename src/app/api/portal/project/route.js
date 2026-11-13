// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// GET /api/portal/project -> 200 { client, project, checklist, files, team, timeline }
//   Shapes: see CLIENT, PROJECT, checklist(), files(), TEAM and timeline() in src/lib/portal/sample.js.
//   The real route returns only the signed-in contact's own project.
import { CLIENT, PROJECT, TEAM, checklist, files, timeline } from "@/lib/portal/sample";
import { stubError, stubShouldFail } from "@/lib/portal/stub";

export async function GET(request) {
  if (stubShouldFail(request)) return stubError(500, "server_error", "Could not load the project.");
  return Response.json({ client: CLIENT, project: PROJECT, checklist: checklist(PROJECT.stage), files: files(PROJECT.stage), team: TEAM, timeline: timeline(PROJECT.stage) });
}
