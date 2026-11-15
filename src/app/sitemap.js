import { SITE_URL } from "@/lib/site";
import { PUBLIC_PAGES } from "@/lib/marketing/catalog";
import { CASES } from "@/lib/cases";
import { POSTS } from "@/lib/posts";
export default function sitemap() {
  const paths = [
    ...PUBLIC_PAGES,
    ...(CASES.length ? ["/work", ...CASES.map((c) => `/work/${c.slug}`)] : []),
    ...(POSTS.length ? ["/blog", ...POSTS.map((p) => `/blog/${p.slug}`)] : []),
  ];
  return paths.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority:
      path === "/"
        ? 1
        : path === "/pricing" || path === "/solutions"
          ? 0.9
          : 0.7,
  }));
}
