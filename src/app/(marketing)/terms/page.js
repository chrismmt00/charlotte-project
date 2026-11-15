import PolicyNotice from "@/components/marketing/PolicyNotice";
import { pageMetadata } from "@/lib/marketing/seo";
export const metadata = pageMetadata(
  "Service Terms Information | Klyvora Studio",
  "Contact Klyvora Studio about service agreements while the updated terms await approval.",
  "/terms",
  true,
);
export default function TermsPage() {
  return <PolicyNotice title="Terms of service" />;
}
