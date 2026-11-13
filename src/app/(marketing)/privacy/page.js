import LegalDoc from "@/components/site/LegalDoc";

export const metadata = {
  title: "Privacy policy",
  description: "What Klyvora collects when you use this site or work with us, how we use it, who we share it with and how to ask for a copy or deletion.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalDoc docKey="privacy" />;
}
