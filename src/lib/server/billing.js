import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe, billingPortal } from "@/lib/stripe";
import {
  body,
  id,
  text,
  email,
  date,
  money,
  cents,
  required,
  fail,
  audit,
  queue,
} from "./http";
import { invoiceDTO, subscriptionDTO, today } from "./data";

export async function billing(request, s, user) {
  const [section, recordId, action] = s,
    method = request.method;
  if (section === "invoices") {
    if (!recordId && method === "GET")
      return {
        invoices: (
          await prisma.invoice.findMany({
            include: { client: { include: { contacts: true } } },
            orderBy: { createdAt: "desc" },
          })
        ).map(invoiceDTO),
        today: today(),
      };
    if (!recordId && method === "POST") {
      const b = await body(
        request,
        z.object({
          clientId: id,
          kind: z.enum(["hardware", "add-on", "custom"]),
          lines: z
            .array(
              z.object({
                description: text.min(1),
                qty: z.coerce.number().int().min(1).max(10000),
                unit: z.coerce.number().pipe(money),
              }),
            )
            .min(1)
            .max(100),
          due: date.optional(),
          memo: text.default(""),
          methods: z.array(text).optional(),
          sendNow: z.boolean().default(false),
        }),
      );
      required(
        await prisma.client.findUnique({ where: { id: b.clientId } }),
        "Client",
      );
      const total = b.lines.reduce((n, l) => n + l.qty * cents(l.unit), 0);
      if (total <= 0 || total > 100000000)
        fail(422, "amount", "Enter a positive invoice total under $1,000,000.");
      const inv = await prisma.$transaction(async (db) => {
        const r = await db.invoice.create({
          data: {
            clientId: b.clientId,
            kind: b.kind,
            amountCents: total,
            dueAt: b.due ? new Date(b.due) : null,
            data: {
              memo: b.memo,
              lines: b.lines.map((l) => ({
                description: l.description,
                quantity: l.qty,
                unitCents: cents(l.unit),
              })),
            },
          },
        });
        await audit(db, user.id, "invoice.created", "Invoice", r.id, {
          amountCents: total,
        });
        if (b.sendNow)
          await queue(db, `invoice:${r.id}`, "invoice", { id: r.id });
        return r;
      });
      return { invoice: invoiceDTO(inv) };
    }
    const inv = required(
      await prisma.invoice.findUnique({
        where: { id: recordId },
        include: { client: { include: { contacts: true } } },
      }),
      "Invoice",
    );
    if (!action && method === "GET") return { invoice: invoiceDTO(inv) };
    if (action === "send" && method === "POST") {
      await body(
        request,
        z.object({
          to: email.optional(),
          template: text.optional(),
          copyMe: z.boolean().optional(),
        }),
      );
      if (["Paid", "Void"].includes(inv.status))
        fail(409, "closed", "This invoice is closed.");
      // Every send attempt is explicit and audited. The worker is repeat-safe on provider retries.
      await queue(prisma, `invoice:${inv.id}`, "invoice", { id: inv.id });
      await audit(prisma, user.id, "invoice.send_queued", "Invoice", inv.id);
      return {
        invoice: invoiceDTO(inv),
        kind: inv.stripeId ? "reminder" : "invoice",
        queued: true,
      };
    }
    if (!action && method === "PATCH") {
      await body(request, z.object({ status: z.literal("void") }));
      if (inv.status === "Paid")
        fail(409, "paid", "Paid invoices cannot be voided.");
      if (inv.stripeId)
        await stripe().invoices.voidInvoice(
          inv.stripeId,
          {},
          { idempotencyKey: `void:${inv.id}` },
        );
      const updated = await prisma.$transaction(async (db) => {
        const r = await db.invoice.update({
          where: { id: inv.id },
          data: { status: "Void" },
        });
        await audit(db, user.id, "invoice.voided", "Invoice", inv.id);
        return r;
      });
      return { invoice: invoiceDTO({ ...inv, ...updated }) };
    }
    if (action === "payments" && method === "POST") {
      if (user.role !== "owner")
        fail(403, "forbidden", "Only the owner can record manual payments.");
      const b = await body(
        request,
        z.object({
          kind: z.enum(["manual", "plan"]),
          amount: money.optional(),
          method: text.optional(),
          receivedOn: date.optional(),
          reference: text.optional(),
          note: text.optional(),
          count: z.number().int().min(2).max(4).optional(),
          firstOn: date.optional(),
          every: z.enum(["2 weeks", "Month"]).optional(),
          autoCharge: z.boolean().optional(),
        }),
      );
      if (b.kind === "plan")
        fail(
          409,
          "not_supported",
          "Installment schedules need a separate agreed payment plan; automatic charges are not enabled.",
        );
      if (!b.amount) fail(422, "amount", "Enter a payment amount.");
      const amount = cents(b.amount);
      // Full out-of-band reconciliation only. Partial Stripe payments must be entered in Stripe first.
      if (inv.stripeId && amount !== inv.amountCents - inv.paidCents)
        fail(
          409,
          "stripe_partial",
          "Record partial payments in Stripe, then let the webhook reconcile them.",
        );
      if (inv.stripeId)
        await stripe().invoices.pay(
          inv.stripeId,
          { paid_out_of_band: true },
          { idempotencyKey: `manual-paid:${inv.id}` },
        );
      const updated = await prisma.$transaction(async (db) => {
        await db.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id"=${inv.id} FOR UPDATE`;
        const current = await db.invoice.findUniqueOrThrow({
          where: { id: inv.id },
        });
        if (
          ["Paid", "Void"].includes(current.status) ||
          amount > current.amountCents - current.paidCents
        )
          fail(409, "amount", "The payment exceeds the current balance.");
        const total = current.paidCents + amount;
        const r = await db.invoice.update({
          where: { id: inv.id },
          data: {
            paidCents: total,
            status: total === current.amountCents ? "Paid" : "Due",
            paidAt: total === current.amountCents ? new Date() : null,
          },
        });
        await audit(db, user.id, "invoice.manual_payment", "Invoice", inv.id, {
          amountCents: amount,
          method: b.method || "Other",
          reference: b.reference || "",
        });
        return r;
      });
      return { invoice: invoiceDTO({ ...inv, ...updated }) };
    }
  }
  if (section === "subscriptions") {
    if (!recordId && method === "GET")
      return {
        subscriptions: (
          await prisma.subscription.findMany({ include: { client: true } })
        ).map(subscriptionDTO),
      };
    const sub = required(
      await prisma.subscription.findUnique({
        where: { id: recordId },
        include: { client: true },
      }),
      "Subscription",
    );
    if (action === "cancel" && method === "POST") {
      const b = await body(
        request,
        z.object({
          when: z.enum(["period-end", "now"]),
          reason: text.default(""),
          handoverPack: z.boolean().optional(),
          acknowledgedRequired: z.boolean().optional(),
        }),
      );
      if (["RC", "RK"].includes(sub.offerCode) && !b.acknowledgedRequired)
        fail(
          422,
          "plan_required",
          "Acknowledge the restaurant service impact first.",
        );
      if (sub.stripeId) {
        if (b.when === "now")
          await stripe().subscriptions.cancel(
            sub.stripeId,
            {},
            { idempotencyKey: `cancel:${sub.id}` },
          );
        else
          await stripe().subscriptions.update(sub.stripeId, {
            cancel_at_period_end: true,
          });
      }
      const updated = await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          ...(b.when === "now" || !sub.stripeId
            ? { status: "canceled", canceledAt: new Date() }
            : {}),
          data: {
            ...sub.data,
            cancelAtPeriodEnd: b.when === "period-end",
            reason: b.reason,
          },
        },
      });
      await audit(
        prisma,
        user.id,
        "subscription.cancel_requested",
        "Subscription",
        sub.id,
      );
      return { subscription: subscriptionDTO({ ...sub, ...updated }) };
    }
    if (!action && method === "PATCH") {
      const b = await body(
        request,
        z.object({ action: z.enum(["retry", "pause", "resume", "card-link"]) }),
      );
      if (b.action === "card-link") {
        const portal = await billingPortal(sub.clientId, "/portal/account");
        return { subscription: subscriptionDTO(sub), url: portal.url };
      }
      if (!sub.stripeId)
        fail(409, "not_live", "This subscription starts at accepted launch.");
      if (b.action === "retry") {
        const remote = await stripe().subscriptions.retrieve(sub.stripeId);
        if (typeof remote.latest_invoice === "string")
          await stripe().invoices.pay(remote.latest_invoice);
      } else
        await stripe().subscriptions.update(sub.stripeId, {
          pause_collection: b.action === "pause" ? { behavior: "void" } : "",
          ...(b.action === "resume" ? { cancel_at_period_end: false } : {}),
        });
      await audit(
        prisma,
        user.id,
        `subscription.${b.action}`,
        "Subscription",
        sub.id,
      );
      return { subscription: subscriptionDTO(sub) };
    }
  }
  return null;
}
