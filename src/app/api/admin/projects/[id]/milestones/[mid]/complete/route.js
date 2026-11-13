import { getProject, MILESTONE_IDS } from "@/lib/admin/sample-projects";
import { readJson, bad, notFound } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session. Nothing is stored or sent.
// POST /api/admin/projects/[id]/milestones/[mid]/complete   mid = "demo" | "launch"
//   { link?, note? } (the demo link and note the client sees in the portal)
//   -> 200 { milestone, invoice: { number, percent, amountCents } | null, monthlyStarted: boolean }
//   demo   (demo accepted): sends the 30% invoice.
//   launch (launched):      sends the 20% invoice and starts the monthly plan when the client chose one
//                           (restaurants always have one).
//   400 for "kickoff" (it completes when its invoice is paid) or a milestone that is not the current one.
export async function POST(request, ctx) {
  const { id, mid } = await ctx.params;
  const project = getProject(id);
  if (!project) return notFound("Project");
  if (!MILESTONE_IDS.includes(mid)) return notFound("Milestone");
  if (mid === "kickoff") return bad("Kickoff completes when its invoice is paid.");
  const m = project.milestones.find((x) => x.id === mid);
  if (m.status !== "current") return bad("Only the current milestone can be completed.");
  const { error } = await readJson(request);
  if (error) return error;
  return Response.json({
    milestone: { ...m, status: "done" },
    invoice: { number: m.invoice || "INV-[next]", percent: m.percent, amountCents: m.amount * 100 },
    monthlyStarted: mid === "launch" && (project.monthlyChosen || project.monthlyRequired),
  });
}
