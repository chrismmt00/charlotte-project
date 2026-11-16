import { markIcon } from "@/lib/og/share-image";

// iPhone/iPad home-screen icon. Apple rounds the corners, so the square is filled.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return markIcon(180, "#fafafa");
}
