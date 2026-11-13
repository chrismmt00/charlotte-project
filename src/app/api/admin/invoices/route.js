import { INVOICES, INVOICE_STATUSES, NEXT_INVOICE_NUMBER, getInvoicesPayload } from "@/lib/admin/sample-billing";
import { readJson, bad } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session. Nothing is stored and Stripe is not called.
// GET  /api/admin/invoices?status=Draft|Due|Overdue|Paid -> 200 { invoices: Invoice[], today }
// POST /api/admin/invoices
//   { clientId, kind: "milestone"|"hardware"|"add-on"|"custom", lines: [{ description, qty, unit }],
//     due, memo?, methods, sendNow: boolean }       (unit is dollars in the UI, cents in the API)
//   -> 201 { invoice: Invoice }   400 { error } when there are no lines or a zero total on a non-hardware invoice
export function GET(request) {
  const status = new URL(request.url).searchParams.get("status");
  const payload = getInvoicesPayload();
  if (status && INVOICE_STATUSES.includes(status)) payload.invoices = INVOICES.filter((i) => i.status === status);
  return Response.json(payload);
}

export async function POST(request) {
  const { body, error } = await readJson(request);
  if (error) return error;
  const lines = Array.isArray(body?.lines) ? body.lines.filter((l) => String(l.description || "").trim()) : [];
  if (!body?.clientId || !lines.length) return bad("Pick a client and add at least one line.");
  const total = lines.reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.unit) || 0), 0);
  if (body.kind !== "hardware" && !(total > 0)) return bad("The total must be more than zero.");
  const number = `INV-${String(NEXT_INVOICE_NUMBER).padStart(4, "0")}`;
  return Response.json({ invoice: { id: `inv_${number.slice(4)}`, number, status: body.sendNow ? "Due" : "Draft", amount: total || null, lines } }, { status: 201 });
}
