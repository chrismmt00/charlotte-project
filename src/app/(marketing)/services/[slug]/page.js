import { notFound, permanentRedirect } from "next/navigation";
import { MARKETING_REDIRECTS } from "@/lib/marketing/redirects";
const routes = MARKETING_REDIRECTS.filter(([source]) =>
  source.startsWith("/services/"),
);
export function generateStaticParams() {
  return routes.map(([source]) => ({ slug: source.split("/").pop() }));
}
export default async function RetiredServicePage({ params }) {
  const { slug } = await params;
  const route = routes.find(([source]) => source === `/services/${slug}`);
  if (!route) notFound();
  permanentRedirect(route[1]);
}
