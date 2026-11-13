// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// POST /api/app/catalog/groups   Add a category (services), menu section (restaurants) or collection (stores).
// Request:  { name: string (required) }
// 201:      { id: string, name: string }
import { bad, delay, devFail, newId, readJson } from "@/lib/app/stub";

export async function POST(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const body = await readJson(request);
  if (!body || !String(body.name || "").trim()) return bad("Give it a name.");
  await delay(250);
  return Response.json({ id: newId("grp"), name: String(body.name).trim() }, { status: 201 });
}
