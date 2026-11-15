export function pageMetadata(title, description, path, noindex = false) {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
