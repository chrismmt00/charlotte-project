import { markIcon } from "@/lib/og/share-image";

// Browser tab icon: the K brand mark.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return markIcon(512);
}
