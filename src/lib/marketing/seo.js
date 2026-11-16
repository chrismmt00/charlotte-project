import { SITE_NAME } from "@/lib/site";

// Page metadata for the public site. A page's openGraph/twitter objects replace the
// root layout's rather than merging, so the shared fields are repeated here. The
// share image itself comes from the opengraph-image.js file in each page's folder.
export function pageMetadata(title, description, path, noindex = false) {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
