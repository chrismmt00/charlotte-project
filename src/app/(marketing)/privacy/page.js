import PolicyNotice from "@/components/marketing/PolicyNotice";
import { pageMetadata } from "@/lib/marketing/seo";
export const metadata = pageMetadata(
  "Privacy Information | Klyvora Studio",
  "Contact Klyvora Studio for privacy information while the updated policy awaits approval.",
  "/privacy",
  true,
);
export default function PrivacyPage() {
  return <PolicyNotice title="Privacy policy" />;
}
