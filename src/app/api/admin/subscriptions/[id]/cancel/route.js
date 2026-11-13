import { SUBSCRIPTIONS } from "@/lib/admin/sample-billing";
import { readJson, bad, notFound } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session. Stripe is not called, no email is sent.
// POST /api/admin/subscriptions/[id]/cancel
//   { when: "period-end" | "now", reason, handoverPack: boolean, acknowledgedRequired?: boolean }
//   -> 200 { subscription, endsOn }   "now" prorates a refund in Stripe
//   400 { error } when the plan is required (restaurants: ordering, kiosks and menu updates run on it)
//       and acknowledgedRequired is not true, or when the plan is already canceled
export async function POST(request, ctx) {
  const { id } = await ctx.params;
  const sub = SUBSCRIPTIONS.find((s) => s.id === id);
  if (!sub) return notFound("Subscription");
  const { body, error } = await readJson(request);
  if (error) return error;
  if (sub.status === "Canceled") return bad("This plan is already canceled.");
  if (sub.required && !body?.acknowledgedRequired) return bad("This plan is required while the restaurant is live. Confirm the owner knows ordering and menu updates stop.");
  if (!["period-end", "now"].includes(body?.when)) return bad("Choose when the plan ends.");
  return Response.json({ subscription: sub, endsOn: body.when === "now" ? "now" : sub.next });
}
