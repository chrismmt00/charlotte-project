import { getProjectsPayload } from "@/lib/admin/sample-projects";

// STUB until the back end ships this route. Needs an admin session.
// GET /api/admin/projects -> 200 { projects: Project[], team: Person[], today }
// Shapes are documented at the top of src/lib/admin/sample-projects.js. Money is cents in the real API.
export function GET() {
  return Response.json(getProjectsPayload());
}
