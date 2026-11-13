import { SUBSCRIPTIONS, SUB_STATUSES, getSubscriptionsPayload } from "@/lib/admin/sample-billing";

// STUB until the back end ships this route. Needs an admin session. Stripe is the source of truth.
// GET /api/admin/subscriptions?status=Active|Starts at launch|Past due|Paused|Canceled -> 200 { subscriptions: Subscription[] }
// Shape: see the header of src/lib/admin/sample-billing.js. Prices change in Settings -> Catalog, never here.
export function GET(request) {
  const status = new URL(request.url).searchParams.get("status");
  const payload = getSubscriptionsPayload();
  if (status && SUB_STATUSES.includes(status)) payload.subscriptions = SUBSCRIPTIONS.filter((s) => s.status === status);
  return Response.json(payload);
}
