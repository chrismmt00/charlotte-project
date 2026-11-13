// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// PUT /api/app/catalog/order   Save the order of items inside one group (drag, or the up and down buttons).
// Request:  { group: string, ids: string[] }      item ids in their new order
// 200:      { group: string, ids: string[] }
import { bad, delay, devFail, readJson } from "@/lib/app/stub";

export async function PUT(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const body = await readJson(request);
  if (!body || !Array.isArray(body.ids)) return bad("Send the new order.");
  await delay(200);
  return Response.json({ group: body.group, ids: body.ids });
}
