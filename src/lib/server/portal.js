import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe, billingPortal } from "@/lib/stripe";
import {
  body,
  name,
  email,
  id,
  text,
  required,
  fail,
  audit,
  queue,
} from "./http";
import { requireSigner } from "./access";
import { portalSnapshot, today } from "./data";
import { completeMilestone } from "./proposals";
import { uploadPrivate, downloadPrivate } from "./files";

export async function changePlan(user, end, reason = "") {
  requireSigner(user);
  const c = user.contact.client;
  if (end && ["RC", "RK"].includes(c.offerCode))
    fail(
      403,
      "plan_required",
      "Restaurant plans are required. Contact Klyvora to discuss service changes.",
    );
  const subscriptions = await prisma.subscription.findMany({
    where: { clientId: c.id, status: { not: "canceled" } },
  });
  for (const sub of subscriptions) {
    if (sub.stripeId)
      await stripe().subscriptions.update(sub.stripeId, {
        cancel_at_period_end: end,
      });
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { data: { ...sub.data, cancelAtPeriodEnd: end, reason } },
    });
  }
  await audit(
    prisma,
    user.id,
    end ? "plan.cancel_requested" : "plan.cancel_undone",
    "Client",
    c.id,
  );
  return {
    endsOn: end
      ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
      : null,
  };
}
export async function portal(request, s, user) {
  const [section, recordId, action] = s,
    method = request.method,
    clientId = user.contact.clientId;
  if (section === "project") {
    const p = await prisma.project.findFirst({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });
    if (!recordId && method === "GET") return await portalSnapshot(user);
    required(p, "Project");
    if (recordId === "approve-demo" && method === "POST") {
      requireSigner(user);
      await body(request, z.object({ note: text.optional() }));
      return completeMilestone(user, p.id, 1);
    }
    if (recordId === "sign-off" && method === "POST") {
      requireSigner(user);
      const b = await body(
        request,
        z.object({ signatureName: name.min(3), title: text.optional() }),
      );
      return completeMilestone(user, p.id, 2, b.signatureName);
    }
    if (recordId === "upload" && method === "POST") {
      const form = await request.formData();
      const itemId = String(form.get("itemId") || "");
      required(
        await prisma.task.findFirst({
          where: { id: itemId, projectId: p.id, clientTask: true },
        }),
        "Checklist item",
      );
      const files = [...form.getAll("files"), ...form.getAll("files[]")];
      if (!files.length || files.length > 10)
        fail(422, "files", "Choose between one and ten files.");
      for (const f of files) await uploadPrivate(f, clientId, p.id);
      await prisma.task.update({ where: { id: itemId }, data: { done: true } });
      return { received: files.length };
    }
  }
  if (section === "tickets") {
    if (method === "GET") {
      const snapshot = await portalSnapshot(user);
      return { tickets: snapshot.tickets, hours: snapshot.hours };
    }
    if (method === "POST") {
      const b = await body(
        request,
        z.object({
          ticketId: id.optional(),
          subject: name.optional(),
          message: text.min(1),
        }),
      );
      let ticket;
      if (b.ticketId)
        ticket = required(
          await prisma.ticket.findFirst({
            where: { id: b.ticketId, clientId },
          }),
          "Ticket",
        );
      else {
        if (!b.subject) fail(422, "subject_required", "Enter a subject.");
        ticket = await prisma.ticket.create({
          data: { clientId, subject: b.subject },
        });
      }
      const m = await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          userId: user.id,
          who: user.contact.name,
          text: b.message,
        },
      });
      if (process.env.OWNER_EMAIL)
        await queue(prisma, `support:${m.id}`, "email", {
          to: process.env.OWNER_EMAIL,
          subject: `Support: ${ticket.subject}`,
          text: `A client posted a support message. Open the ticket: ${process.env.NEXT_PUBLIC_APP_URL}/admin/support/${ticket.id}`,
        });
      const msg = { who: "You", when: today(), text: m.text };
      return b.ticketId
        ? { message: msg }
        : {
            ticket: {
              id: ticket.id,
              subject: ticket.subject,
              status: "open",
              when: today(),
              messages: [msg],
            },
          };
    }
  }
  if (section === "invoices") {
    if (!recordId && method === "GET") {
      const snap = await portalSnapshot(user);
      return { invoices: snap.invoices, card: snap.card, plan: snap.plan };
    }
    const invoice = required(
      await prisma.invoice.findFirst({ where: { id: recordId, clientId } }),
      "Invoice",
    );
    if (action === "pay" && method === "POST") {
      requireSigner(user);
      await body(request, z.object({ method: z.enum(["card", "other"]) }));
      // This is a Klyvora service invoice, so payment stays on Klyvora's own Stripe account.
      if (!invoice.stripeId)
        fail(
          409,
          "pending",
          "The invoice is being prepared. Try again shortly.",
        );
      const remote = await stripe().invoices.retrieve(invoice.stripeId);
      if (remote.status === "paid") return { paid: true };
      if (!remote.hosted_invoice_url)
        fail(409, "not_payable", "This invoice is not ready for payment.");
      return { checkoutUrl: remote.hosted_invoice_url, paid: false };
    }
    if (action === "receipt" && method === "GET") {
      if (invoice.status !== "Paid" || !invoice.stripeId)
        fail(409, "not_paid", "A receipt is available after payment.");
      const remote = await stripe().invoices.retrieve(invoice.stripeId);
      const url = remote.invoice_pdf || remote.hosted_invoice_url;
      if (!url) fail(404, "not_found", "Receipt not available.");
      return Response.redirect(url, 302);
    }
  }
  if (section === "files" && recordId && method === "GET")
    return Response.redirect(await downloadPrivate(recordId, clientId), 302);
  if (section === "account") {
    if (!recordId && method === "GET") {
      const snap = await portalSnapshot(user);
      return { people: snap.people, notifications: snap.notifications };
    }
    if (recordId === "notifications" && method === "POST") {
      const b = await body(
        request,
        z.object({
          key: z.enum(["milestone", "invoice", "ticket", "text"]),
          on: z.boolean(),
        }),
      );
      await prisma.contact.update({
        where: { id: user.contact.id },
        data: {
          notifications: { ...user.contact.notifications, [b.key]: b.on },
        },
      });
      return { saved: true };
    }
    if (recordId === "card" && method === "POST") {
      requireSigner(user);
      await body(request, z.object({}));
      const session = await billingPortal(clientId, "/portal/account");
      return { setupUrl: session.url };
    }
    if (recordId === "plan" && method === "POST") {
      const b = await body(
        request,
        z.object({ action: z.enum(["end", "keep"]), reason: text.optional() }),
      );
      return changePlan(user, b.action === "end", b.reason);
    }
    if (recordId === "invite" && method === "POST") {
      requireSigner(user);
      const b = await body(request, z.object({ email }));
      const contact = await prisma.$transaction(async (db) => {
        const u = await db.user.upsert({
          where: { email: b.email },
          update: {},
          create: { email: b.email, name: b.email.split("@")[0] },
        });
        if (await db.contact.findUnique({ where: { userId: u.id } }))
          fail(409, "conflict", "This email already has client access.");
        return db.contact.create({
          data: {
            clientId,
            userId: u.id,
            email: b.email,
            name: b.email.split("@")[0],
            role: "member",
          },
        });
      });
      await queue(prisma, `portal-member:${contact.id}`, "email", {
        to: b.email,
        subject: "Your Klyvora portal access",
        text: `Request a secure sign-in link at ${process.env.NEXT_PUBLIC_APP_URL}/portal/signin`,
      });
      await audit(
        prisma,
        user.id,
        "portal.contact_invited",
        "Contact",
        contact.id,
      );
      return {
        person: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          role: "invited",
        },
      };
    }
    if (recordId === "export" && method === "POST") {
      requireSigner(user);
      await body(request, z.object({}));
      // Immediate authenticated JSON export, avoiding a false promise that an unconfigured email worker sent a file.
      return {
        requestedAt: new Date().toISOString(),
        downloadUrl: "/api/app/export",
      };
    }
  }
  return null;
}
