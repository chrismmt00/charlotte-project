import { CATALOG, parseWhole } from "@/lib/admin/sample-settings";

// STUB until the back end ships this route. Owner only. Signed proposals and running plans keep their price;
// new proposals, the public Pricing page and the estimator read the new one. Every change is logged to the price history.
// Whether the monthly plan is required is not editable here: it is required only for the restaurant offers (RC, RK).
//
// PATCH /api/admin/settings/catalog/[code]   { setup: number|string, monthly: number|string, note: string }
//   200 -> { offer: { code, name, setup, monthly, monthlyRequired, changed }, history: { id, what, who, when, note, tone } }
//   400 -> { error: { code: "invalid", message, fields: { setup?, monthly?, note? } } }
//   404 -> { error: { code: "not_found", message } }
export async function PATCH(request, { params }) {
  const { code } = await params;
  const offer = CATALOG.find((o) => o.code === code);
  if (!offer) return Response.json({ error: { code: "not_found", message: "No such offer." } }, { status: 404 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Send JSON." } }, { status: 400 });
  }
  const fields = {};
  const setup = parseWhole(body?.setup);
  const monthly = parseWhole(body?.monthly);
  if (!Number.isInteger(setup)) fields.setup = "Whole dollars, 0 or more.";
  if (!Number.isInteger(monthly)) fields.monthly = "Whole dollars, 0 or more.";
  const note = String(body?.note || "").trim();
  if (!note) fields.note = "A note is required; it shows in the price history.";
  if (Object.keys(fields).length) {
    return Response.json({ error: { code: "invalid", message: "Some fields need a fix.", fields } }, { status: 400 });
  }
  const dollars = (n) => "$" + n.toLocaleString("en-US");
  return Response.json({
    offer: { code, name: offer.name, setup, monthly, monthlyRequired: offer.monthlyRequired, changed: "Just now · Chris" },
    history: {
      id: `h_${Date.now().toString(36)}`,
      what: `${offer.name} · ${dollars(setup)} / ${dollars(monthly)}${offer.monthlyRequired ? " · monthly required" : ""}`,
      who: "Chris",
      when: "Just now",
      note,
      tone: "success",
    },
  });
}
