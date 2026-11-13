import LegalDoc from "@/components/site/LegalDoc";

export const metadata = {
  title: "Terms of service",
  description:
    "Klyvora’s terms: written proposals, 50/30/20 milestone payments, an optional monthly plan except on restaurant plans, and you own the site, its code and your data on final payment.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalDoc docKey="terms" />;
}
