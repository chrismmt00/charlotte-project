import { shareImage } from "@/lib/og/share-image";
import { SHARE } from "@/lib/og/pages";

export const alt = SHARE.pricing.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return shareImage(SHARE.pricing);
}
