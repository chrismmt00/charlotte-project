import PolicyNotice from "@/components/marketing/PolicyNotice";
import { pageMetadata } from "@/lib/marketing/seo";
export const metadata = pageMetadata(
  "Terms of Service | Klyvora Studio",
  "Klyvora Studio’s service terms for project scope, payments, subscriptions, revisions, cancellations, ownership, equipment, and business-data exports.",
  "/terms",
  true,
);
export default function TermsPage() {
  return <PolicyNotice docKey="terms" />;
}
