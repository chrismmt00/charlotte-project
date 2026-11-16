import PolicyNotice from "@/components/marketing/PolicyNotice";
import { pageMetadata } from "@/lib/marketing/seo";
export const metadata = pageMetadata(
  "Privacy Policy | Klyvora Studio",
  "How Klyvora Studio handles website inquiries, client information, account access, service providers, privacy requests, and data retention.",
  "/privacy",
  true,
);
export default function PrivacyPage() {
  return <PolicyNotice docKey="privacy" />;
}
