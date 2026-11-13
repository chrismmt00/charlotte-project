import { INVOICES } from "@/lib/admin/sample-billing";
import { readJson, bad, notFound } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session. No email is sent and Stripe is not called.
// POST /api/admin/invoices/[id]/send { to, template, copyMe }
//   -> 200 { invoice, kind: "invoice" | "reminder" }   a draft becomes Due; Due or Overdue gets a reminder
//   400 { error } for a bad address, a paid invoice, or a hardware draft with no quote amount yet
export async function POST(request, ctx) {
  const { id } = await ctx.params;
  const invoice = INVOICES.find((i) => i.id === id);
  if (!invoice) return notFound("Invoice");
  const { body, error } = await readJson(request);
  if (error) return error;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body?.to || ""))) return bad("Enter a valid email address.");
  if (invoice.status === "Paid") return bad("This invoice is already paid.");
  if (invoice.status === "Draft" && invoice.amount == null) return bad("Add the vendor quote amount before sending.");
  const draft = invoice.status === "Draft";
  return Response.json({ invoice: { ...invoice, status: draft ? "Due" : invoice.status }, kind: draft ? "invoice" : "reminder" });
}
