// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/catalog/items   Add a service, menu item or product.
// Request:  { name: string (required), price?: string, desc?: string, meta?: string, group: string, visible: boolean, photo?: string (upload id) }
// 201:      { id: string, name, desc, meta, price, group, visible }
// 400:      { error: string }
import { bad, delay, devFail, newId, readJson } from "@/lib/app/stub";

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const body = await readJson(request);
  if (!body || !String(body.name || "").trim()) return bad("Give it a name; it shows on your site.");
  await delay(400);
  return Response.json(
    { id: newId("it"), name: String(body.name).trim(), desc: body.desc || "", meta: body.meta || "", price: body.price || "$[x]", group: body.group, visible: !!body.visible },
    { status: 201 }
  );
}
