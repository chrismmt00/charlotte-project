import ProjectsView from "@/components/admin/projects/ProjectsView";
import { PROJECTS, SAMPLE_TODAY, TEAM } from "@/lib/admin/sample-projects";

export const metadata = { title: "Projects" };

// Reads GET /api/admin/projects once the back end ships it; sample data until then.
// Money is whole dollars here, cents in the API.
export default function ProjectsPage() {
  return <ProjectsView initialProjects={PROJECTS} team={TEAM} today={SAMPLE_TODAY} />;
}
