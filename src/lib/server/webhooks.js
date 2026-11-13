import "server-only";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { fail, audit } from "./http";

export async function stripeWebhook(request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    fail(
      503,
      "not_configured",
      "Stripe webhook verification is not configured.",
    );
  if (Number(request.headers.get("content-length") || 0) > 1000000)
    fail(413, "too_large", "Payload too large.");
  let event;
  try {
    const payload = await request.text();
    for (const secret of [
      process.env.STRIPE_WEBHOOK_SECRET,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    ].filter(Boolean)) {
      try {
        event = stripe().webhooks.constructEvent(
          payload,
          request.headers.get("stripe-signature"),
          secret,
        );
        break;
      } catch {}
    }
    if (!event) throw new Error("Signature mismatch");
  } catch {
    fail(400, "signature", "Invalid webhook signature.");
  }
  if (await prisma.webhookEvent.findUnique({ where: { id: event.id } }))
    return { received: true };
  const obj = event.data.object;
  // Re-read mutable provider objects so delayed events cannot roll an invoice or subscription backwards.
  const remote = event.type.startsWith("invoice.")
    ? await stripe().invoices.retrieve(obj.id)
    : event.type.startsWith("customer.subscription.") &&
        event.type !== "customer.subscription.deleted"
      ? await stripe().subscriptions.retrieve(obj.id)
      : obj;
  try {
    await prisma.$transaction(async (db) => {
      await db.webhookEvent.create({ data: { id: event.id } });
      if (event.type.startsWith("invoice.")) {
        const subId =
          typeof remote.subscription === "string"
            ? remote.subscription
            : remote.parent?.subscription_details?.subscription;
        const sub = subId
          ? await db.subscription.findUnique({ where: { stripeId: subId } })
          : null;
        let inv = await db.invoice.findFirst({
          where: {
            OR: [
              { stripeId: remote.id },
              ...(remote.metadata?.invoiceId
                ? [{ id: remote.metadata.invoiceId }]
                : []),
            ],
          },
        });
        if (!inv && sub)
          inv = await db.invoice.create({
            data: {
              stripeId: remote.id,
              clientId: sub.clientId,
              kind: "monthly",
              amountCents: remote.total,
              status: "Due",
              data: { memo: "Monthly plan" },
            },
          });
        if (inv) {
          await db.invoice.update({
            where: { id: inv.id },
            data: {
              stripeId: remote.id,
              amountCents: remote.total,
              paidCents: remote.amount_paid || 0,
              status:
                remote.status === "paid"
                  ? "Paid"
                  : remote.status === "void"
                    ? "Void"
                    : remote.status === "draft"
                      ? "Draft"
                      : "Due",
              paidAt: remote.status_transitions?.paid_at
                ? new Date(remote.status_transitions.paid_at * 1000)
                : null,
              dueAt: remote.due_date ? new Date(remote.due_date * 1000) : null,
              data: {
                ...inv.data,
                hostedUrl: remote.hosted_invoice_url,
                pdfUrl: remote.invoice_pdf,
              },
            },
          });
          await audit(db, null, event.type, "Invoice", inv.id, {
            stripeEventId: event.id,
          });
        }
      }
      if (event.type.startsWith("customer.subscription.")) {
        const sub = await db.subscription.findFirst({
          where: {
            OR: [
              { stripeId: remote.id },
              ...(remote.metadata?.subscriptionId
                ? [{ id: remote.metadata.subscriptionId }]
                : []),
            ],
          },
        });
        if (sub) {
          // Catalog changes never alter the recurring price on an existing subscription.
          await db.subscription.update({
            where: { id: sub.id },
            data: {
              stripeId: remote.id,
              status:
                event.type === "customer.subscription.deleted"
                  ? "canceled"
                  : remote.pause_collection
                    ? "paused"
                    : remote.status,
              startedAt: sub.startedAt || new Date(remote.created * 1000),
              canceledAt: remote.canceled_at
                ? new Date(remote.canceled_at * 1000)
                : null,
              data: {
                ...sub.data,
                cancelAtPeriodEnd: !!remote.cancel_at_period_end,
              },
            },
          });
          await audit(db, null, event.type, "Subscription", sub.id, {
            stripeEventId: event.id,
          });
        }
      }
      if (event.type === "account.updated")
        await db.client.updateMany({
          where: { stripeConnectedAccountId: obj.id },
          data: {
            connectStatus:
              obj.charges_enabled && obj.details_submitted
                ? "connected"
                : "pending",
          },
        });
    });
  } catch (e) {
    if (
      e.code !== "P2002" ||
      !(await prisma.webhookEvent.findUnique({ where: { id: event.id } }))
    )
      throw e;
  }
  return { received: true };
}
