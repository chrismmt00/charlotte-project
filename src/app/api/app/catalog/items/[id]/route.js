// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// PATCH /api/app/catalog/items/:id   Hide or show an item (booking page, site, kiosk follow within a minute), or rename it.
// Request:  { visible?: boolean, name?: string }
// 200:      { id: string, visible?: boolean, name?: string }
import { bad, delay, devFail, readJson } from "@/lib/app/stub";

export async function PATCH(request, { params }) {
  const failed = devFail(request);
  if (failed) return failed;
  const { id } = await params;
  const body = await readJson(request);
  if (!body) return bad("Nothing to change.");
  await delay(200);
  return Response.json({ id, visible: body.visible, name: body.name });
}
