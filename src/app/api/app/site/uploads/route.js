// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/site/uploads   Upload one photo (also used by the catalog "Add" dialog).
// Request:  multipart/form-data with one field "file" (image/*, at most 25 MB)
// 201:      { id: string, name: string, url: string | null }       url is the Cloudflare-served, resized image
// 413:      { error: "Too big (over 25 MB)" }
// 415:      { error: "That isn't an image" }
import { bad, delay, devFail, newId } from "@/lib/app/stub";

const MAX = 25 * 1024 * 1024;

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  let file = null;
  try {
    file = (await request.formData()).get("file");
  } catch {}
  if (!file || typeof file === "string") return bad("Choose a photo to upload.");
  if (file.size > MAX) return bad("Too big (over 25 MB)", 413);
  if (file.type && !file.type.startsWith("image/")) return bad("That isn't an image", 415);
  await delay(900);
  return Response.json({ id: newId("ph"), name: file.name, url: null }, { status: 201 });
}
