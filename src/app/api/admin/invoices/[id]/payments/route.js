import { INVOICES } from "@/lib/admin/sample-billing";
import { readJson, bad, notFound } from "@/lib/admin/stub";

// STUB until the back end ships this route. Needs an admin session. Stripe is not called.
// POST /api/admin/invoices/[id]/payments
//   { kind: "manual", amount, method: "Cash"|"Check"|"Zelle"|"Cash App"|"Bank transfer"|"Other", receivedOn, reference?, note? }
//     -> 200 { invoice }  marks the Stripe invoice paid out of band and sends the receipt;
//        a smaller amount leaves the rest due (dollars in the UI, cents in the API)
//   { kind: "plan", count: 2|3|4, firstOn: "YYYY-MM-DD", every: "2 weeks"|"Month", autoCharge: boolean }
//     -> 200 { invoice }  no fee for splitting; the next milestone waits until this one is fully paid
//   400 { error } for a zero amount, an amount over the balance, or a paid or draft invoice
export async function POST(request, ctx) {
  const { id } = await ctx.params;
  const invoice = INVOICES.find((i) => i.id === id);
  if (!invoice) return notFound("Invoice");
  const { body, error } = await readJson(request);
  if (error) return error;
  if (invoice.status === "Paid" || invoice.status === "Draft" || invoice.amount == null) return bad("Only a sent, unpaid invoice takes a payment or a plan.");
  if (body?.kind === "plan") {
    if (![2, 3, 4].includes(Number(body.count))) return bad("Split into 2, 3 or 4 payments.");
    return Response.json({ invoice: { ...invoice, plan: { count: Number(body.count), firstOn: body.firstOn, every: body.every, autoCharge: !!body.autoCharge } } });
  }
  const amount = Number(body?.amount);
  if (!(amount > 0)) return bad("Enter an amount more than zero.");
  if (amount > invoice.amount - invoice.paid) return bad("That is more than the balance on this invoice.");
  return Response.json({ invoice: { ...invoice, paid: invoice.paid + amount, status: amount === invoice.amount - invoice.paid ? "Paid" : invoice.status } });
}
