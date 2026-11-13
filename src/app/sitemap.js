import { SITE_URL } from "@/lib/site";
import { SERVICE_GROUPS } from "@/lib/offers";

// Public pages only. Admin, portal and client admin are private and excluded in robots.js.
export default function sitemap() {
  const pages = [
    ["", 1],
    ["/services", 0.9],
    ...SERVICE_GROUPS.map((g) => [`/services/${g.slug}`, 0.8]),
    ["/pricing", 0.9],
    ["/quote", 0.7],
    ["/check", 0.7],
    ["/contact", 0.8],
    ["/about", 0.6],
    ["/founding", 0.6],
    ["/work", 0.5],
    ["/blog", 0.4],
    ["/privacy", 0.2],
    ["/terms", 0.2],
  ];
  return pages.map(([path, priority]) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
