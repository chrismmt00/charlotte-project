import { INVOICES } from "@/lib/admin/sample-billing";
import { readJson, bad, notFound } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session.
// GET   /api/admin/invoices/[id] -> 200 { invoice }   404 { error }
// PATCH /api/admin/invoices/[id] { status: "void" } -> 200 { invoice }   (a paid invoice is refunded in Stripe instead)
export async function GET(_request, ctx) {
  const { id } = await ctx.params;
  const invoice = INVOICES.find((i) => i.id === id);
  return invoice ? Response.json({ invoice }) : notFound("Invoice");
}

export async function PATCH(request, ctx) {
  const { id } = await ctx.params;
  const invoice = INVOICES.find((i) => i.id === id);
  if (!invoice) return notFound("Invoice");
  const { body, error } = await readJson(request);
  if (error) return error;
  if (body?.status !== "void") return bad('Only { status: "void" } is supported.');
  if (invoice.status === "Paid") return bad("A paid invoice is refunded in Stripe, not voided.");
  return Response.json({ invoice: { ...invoice, status: "Void" } });
}
