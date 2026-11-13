import SubscriptionsView from "@/components/admin/billing/SubscriptionsView";
import { SUBSCRIPTIONS } from "@/lib/admin/sample-billing";

export const metadata = { title: "Subscriptions" };

// Reads GET /api/admin/subscriptions once the back end ships it; sample data until then.
// Stripe is the source of truth. Money is whole dollars here, cents in the API.
export default function SubscriptionsPage() {
  return <SubscriptionsView initialSubs={SUBSCRIPTIONS} />;
}
