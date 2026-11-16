import { SITE_NAME } from "@/lib/site";

// Web app manifest: name, colours and icons used when the site is saved to a home screen.
export default function manifest() {
  return {
    name: SITE_NAME,
    short_name: "Klyvora",
    description:
      "Custom websites and connected business software for small businesses.",
    start_url: "/",
    display: "browser",
    background_color: "#fafafa",
    theme_color: "#fafafa",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
