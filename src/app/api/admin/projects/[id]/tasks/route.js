import { getProject } from "@/lib/admin/sample-projects";
import { readJson, bad, notFound } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session. Nothing is stored.
// POST   /api/admin/projects/[id]/tasks
//   { title, who, milestone: "kickoff"|"demo"|"launch", due: "YYYY-MM-DD", est: number, notes?, needsClient?: boolean }
//   -> 201 { task: Task }    400 { error } when the title is empty
// PATCH  /api/admin/projects/[id]/tasks
//   { taskId, patch: { status?, who?, due?, milestone?, desc?, blocked?, checklist? } }  -> 200 { taskId }
//   { taskId, logTime: { hours, who, what } }                                            -> 200 { taskId, entry }
//   (build hours are informational; the project is fixed price. Plan hours are logged on tickets.)
// DELETE /api/admin/projects/[id]/tasks { taskId } -> 200 { taskId }
export async function POST(request, ctx) {
  const { id } = await ctx.params;
  if (!getProject(id)) return notFound("Project");
  const { body, error } = await readJson(request);
  if (error) return error;
  const title = String(body?.title || "").trim();
  if (!title) return bad("Give the task a title.");
  const task = {
    id: `tk_${Date.now().toString(36)}`,
    title,
    status: "To do",
    who: body.who || "Geoffrey",
    milestone: body.milestone || "demo",
    due: body.due || null,
    est: Number(body.est) || 0,
    desc: body.notes || "",
    blocked: !!body.needsClient,
    checklist: [],
    time: [],
  };
  return Response.json({ task }, { status: 201 });
}

export async function PATCH(request, ctx) {
  const { id } = await ctx.params;
  if (!getProject(id)) return notFound("Project");
  const { body, error } = await readJson(request);
  if (error) return error;
  if (!body?.taskId) return bad("taskId is required.");
  if (body.logTime) {
    const hours = Number(body.logTime.hours);
    if (!(hours > 0)) return bad("Hours must be more than zero.");
    return Response.json({ taskId: body.taskId, entry: { id: `te_${Date.now().toString(36)}`, ...body.logTime, hours } });
  }
  return Response.json({ taskId: body.taskId });
}

export async function DELETE(request, ctx) {
  const { id } = await ctx.params;
  if (!getProject(id)) return notFound("Project");
  const { body, error } = await readJson(request);
  if (error) return error;
  if (!body?.taskId) return bad("taskId is required.");
  return Response.json({ taskId: body.taskId });
}
