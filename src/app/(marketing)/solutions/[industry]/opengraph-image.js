import { notFound } from "next/navigation";
import { shareImage } from "@/lib/og/share-image";
import { industryShare } from "@/lib/og/pages";
import { INDUSTRIES } from "@/lib/marketing/catalog";

export const alt = "Klyvora industry solution";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return INDUSTRIES.map((s) => ({ industry: s.id }));
}

export default async function Image({ params }) {
  const { industry } = await params;
  const s = INDUSTRIES.find((x) => x.id === industry);
  if (!s) notFound();
  return shareImage(industryShare(s));
}
