import { SUBSCRIPTIONS } from "@/lib/admin/sample-billing";
import { readJson, bad, notFound } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session. Stripe is not called.
// PATCH /api/admin/subscriptions/[id] { action: "retry" | "pause" | "resume" | "card-link" } -> 200 { subscription }
//   retry only works on a Past due plan; card-link emails the client a Stripe card-update link.
export async function PATCH(request, ctx) {
  const { id } = await ctx.params;
  const sub = SUBSCRIPTIONS.find((s) => s.id === id);
  if (!sub) return notFound("Subscription");
  const { body, error } = await readJson(request);
  if (error) return error;
  if (!["retry", "pause", "resume", "card-link"].includes(body?.action)) return bad("Unknown action.");
  if (body.action === "retry" && sub.status !== "Past due") return bad("Only a past-due plan can be retried.");
  return Response.json({ subscription: sub });
}
