import { getProject } from "@/lib/admin/sample-projects";
import { readJson, bad, notFound } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session.
// GET   /api/admin/projects/[id] -> 200 { project: Project }   404 { error: { code, message } }
// PATCH /api/admin/projects/[id] { owner? } -> 200 { project }
export async function GET(_request, ctx) {
  const { id } = await ctx.params;
  const project = getProject(id);
  return project ? Response.json({ project }) : notFound("Project");
}

export async function PATCH(request, ctx) {
  const { id } = await ctx.params;
  const project = getProject(id);
  if (!project) return notFound("Project");
  const { body, error } = await readJson(request);
  if (error) return error;
  if (body?.owner && !["Chris", "Geoffrey", "Demetrius"].includes(body.owner)) return bad("Owner must be Chris, Geoffrey or Demetrius.");
  return Response.json({ project: { ...project, ...(body?.owner ? { owner: body.owner } : {}) } });
}
