import "server-only";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

let client;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error("Stripe is not configured");
  return (client ||= new Stripe(process.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2,
    timeout: 15000,
  }));
}
export async function customer(clientId) {
  const c = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { contacts: true },
  });
  if (c.stripeCustomerId) return c.stripeCustomerId;
  const result = await stripe().customers.create(
    {
      name: c.business,
      email:
        c.contacts.find((x) => x.role === "signer")?.email ||
        c.contacts[0]?.email,
      metadata: { clientId },
    },
    { idempotencyKey: `client:${clientId}` },
  );
  await prisma.client.update({
    where: { id: clientId },
    data: { stripeCustomerId: result.id },
  });
  return result.id;
}
export async function issueInvoice(id) {
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id } });
  if (inv.status === "Paid" || inv.status === "Void") return inv;
  const customerId = await customer(inv.clientId);
  let remote = inv.stripeId
    ? await stripe().invoices.retrieve(inv.stripeId)
    : await stripe().invoices.create(
        {
          customer: customerId,
          collection_method: "send_invoice",
          days_until_due: inv.dueAt
            ? Math.max(1, Math.ceil((inv.dueAt - new Date()) / 86400000))
            : 7,
          auto_advance: false,
          metadata: { invoiceId: id, clientId: inv.clientId, kind: inv.kind },
        },
        { idempotencyKey: `invoice:${id}` },
      );
  if (!inv.stripeId)
    await prisma.invoice.update({
      where: { id },
      data: { stripeId: remote.id },
    });
  if (remote.status === "draft") {
    if (!remote.lines.data.some((l) => l.metadata?.invoiceId === id)) {
      await stripe().invoiceItems.create(
        {
          customer: customerId,
          invoice: remote.id,
          amount: inv.amountCents,
          currency: process.env.STRIPE_CURRENCY || "usd",
          description: inv.data.memo || "Klyvora project payment",
          metadata: { invoiceId: id },
        },
        { idempotencyKey: `invoice-line:${id}` },
      );
    }
    remote = await stripe().invoices.finalizeInvoice(
      remote.id,
      {},
      { idempotencyKey: `invoice-finalize:${id}` },
    );
  }
  if (remote.status === "open")
    remote = await stripe().invoices.sendInvoice(
      remote.id,
      {},
      { idempotencyKey: `invoice-send:${id}` },
    );
  return prisma.invoice.update({
    where: { id },
    data: {
      stripeId: remote.id,
      status: remote.status === "paid" ? "Paid" : "Due",
      paidCents: remote.amount_paid || 0,
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
}
export async function startSubscription(id) {
  const sub = await prisma.subscription.findUniqueOrThrow({ where: { id } });
  if (sub.stripeId) return sub;
  const customerId = await customer(sub.clientId);
  const product = await stripe().products.create(
    {
      name: `Klyvora ${sub.offerCode} monthly plan`,
      metadata: { subscriptionId: id },
    },
    { idempotencyKey: `sub-product:${id}` },
  );
  const price = await stripe().prices.create(
    {
      product: product.id,
      unit_amount: sub.mrrCents,
      currency: process.env.STRIPE_CURRENCY || "usd",
      recurring: { interval: "month" },
    },
    { idempotencyKey: `sub-price:${id}` },
  );
  const remote = await stripe().subscriptions.create(
    {
      customer: customerId,
      items: [{ price: price.id }],
      collection_method: "send_invoice",
      days_until_due: 7,
      metadata: {
        subscriptionId: id,
        clientId: sub.clientId,
        offerCode: sub.offerCode,
      },
    },
    { idempotencyKey: `subscription:${id}` },
  );
  // Webhooks are authoritative for active MRR; creating a subscription is not a paid invoice.
  return prisma.subscription.update({
    where: { id },
    data: { stripeId: remote.id, status: remote.status, startedAt: new Date() },
  });
}
export async function connectClient(c) {
  let accountId = c.stripeConnectedAccountId;
  if (!accountId) {
    const account = await stripe().accounts.create(
      { type: "standard", metadata: { clientId: c.id } },
      { idempotencyKey: `connect:${c.id}` },
    );
    accountId = account.id;
    await prisma.client.update({
      where: { id: c.id },
      data: { stripeConnectedAccountId: accountId, connectStatus: "pending" },
    });
  }
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const link = await stripe().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${base}/app/payments?connect=refresh`,
    return_url: `${base}/app/payments?connect=return`,
  });
  return {
    status: "pending",
    accountId,
    onboardingUrl: link.url,
    applicationFeePercent: 0,
  };
}

export async function billingPortal(clientId, returnPath) {
  const key = "stripe.billingPortalConfiguration";
  let config = (await prisma.setting.findUnique({ where: { key } }))?.value?.id;
  if (!config) {
    const created = await stripe().billingPortal.configurations.create(
      {
        features: {
          payment_method_update: { enabled: true },
          invoice_history: { enabled: true },
          customer_update: {
            enabled: true,
            allowed_updates: ["email", "address", "phone", "name"],
          },
          subscription_cancel: { enabled: false },
          subscription_update: { enabled: false },
        },
        metadata: { project: "klyvora" },
      },
      { idempotencyKey: "klyvora-billing-portal" },
    );
    config = created.id;
    await prisma.setting.upsert({
      where: { key },
      update: { value: { id: config } },
      create: { key, value: { id: config } },
    });
  }
  return stripe().billingPortal.sessions.create({
    customer: await customer(clientId),
    configuration: config,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}${returnPath}`,
  });
}
