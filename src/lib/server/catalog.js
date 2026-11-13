import "server-only";
import { cacheTag, cacheLife } from "next/cache";
import { catalog } from "./data";
export async function getCatalog() {
  "use cache";
  cacheTag("offers");
  cacheLife({ stale: 0, revalidate: 60, expire: 300 });
  return catalog();
}
