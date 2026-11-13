import { Suspense } from "react";
import ProjectsView from "@/components/admin/projects/ProjectsView";
import { adminData, supportClients } from "@/lib/server/views";
export const metadata = { title: "Projects" };
export default function Page() { return <Suspense fallback={<div aria-busy="true">Loading…</div>}><Content /></Suspense>; }
async function Content() {
  const data = await adminData("projects");

  return <ProjectsView initialProjects={data.projects} team={data.team} today={data.today} />;
}
