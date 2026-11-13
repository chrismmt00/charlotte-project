import "server-only";
import { z } from "zod";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  body,
  name,
  email,
  text,
  id,
  date,
  money,
  cents,
  required,
  fail,
  audit,
  csv,
} from "./http";
import { requireSigner } from "./access";
import { today } from "./data";
import { changePlan } from "./portal";
import { uploadImage } from "./files";

const dollars = (n) => `$${(n / 100).toFixed(2)}`;
const bookingDTO = (b) => ({
  ...b.data,
  id: b.id,
  time: b.startsAt
    ? new Date(b.startsAt).toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
      })
    : "",
  who: b.name,
  what: b.data.service || "",
  status: b.status,
  amount: dollars(b.amountCents),
  phone: b.data.phone || "",
});
const itemDTO = (i) => ({
  ...i.data,
  id: i.id,
  name: i.name,
  group: i.group,
  price: dollars(i.priceCents),
  visible: !i.hidden,
  desc: i.data.desc || "",
  meta: i.data.meta || "",
});
async function workspace(clientId) {
  return (
    (await prisma.workspace.findUnique({ where: { clientId } }))?.data || {}
  );
}
async function saveWorkspace(clientId, patch) {
  return prisma.$transaction(async (db) => {
    await db.$queryRaw`SELECT "id" FROM "Client" WHERE "id"=${clientId} FOR UPDATE`;
    const old =
      (await db.workspace.findUnique({ where: { clientId } }))?.data || {};
    return db.workspace.upsert({
      where: { clientId },
      update: { data: { ...old, ...patch } },
      create: { clientId, data: patch },
    });
  });
}
export async function businessSnapshot(user) {
  const c = user.contact.client,
    id = c.id;
  const [config, bookings, items, customers, sub] = await Promise.all([
    workspace(id),
    prisma.booking.findMany({
      where: { clientId: id },
      orderBy: { startsAt: "asc" },
    }),
    prisma.catalogItem.findMany({
      where: { clientId: id },
      orderBy: { position: "asc" },
    }),
    prisma.customer.findMany({ where: { clientId: id } }),
    prisma.subscription.findFirst({
      where: { clientId: id, status: { not: "canceled" } },
    }),
  ]);
  const rows = bookings.map(bookingDTO);
  const groups = [
    ...new Set([...(config.groups || []), ...items.map((i) => i.group)]),
  ];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCHours(12, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + i);
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      dow: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      num: String(d.getUTCDate()),
      label: key,
      rows: bookings
        .filter((b) => b.startsAt?.toISOString().slice(0, 10) === key)
        .map(bookingDTO),
    };
  });
  return {
    id,
    kind: c.kind,
    name: c.business,
    initials: c.business.slice(0, 2).toUpperCase(),
    owner: user.contact.name,
    offerCode: c.offerCode,
    domain: c.data.domain || "",
    liveUrl: c.data.liveUrl || "",
    badges: { bookings: bookings.filter((b) => b.status === "New").length },
    home: {
      stats: [
        {
          label: c.kind === "booking" ? "Bookings" : "Orders",
          value: String(rows.length),
          note: "Stored in your account",
          emptyNote: "Nothing yet",
          href: "/app/bookings",
        },
        {
          label: "Recorded total",
          value: dollars(bookings.reduce((n, b) => n + b.amountCents, 0)),
          note: "Your business account",
        },
      ],
      today: rows.slice(0, 10),
    },
    days,
    orders: rows,
    rules: Object.entries(config.rules || {}).map(([id, value]) => ({
      id,
      label: id,
      value,
      hint: "",
    })),
    catalog: { groups, items: items.map(itemDTO) },
    customers: customers.map((c) => ({
      ...c.data,
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      spent: dollars(c.spendCents),
      visits: c.data.visits || 0,
      last: c.data.last || "",
      optIn: !!c.data.optIn,
      note: c.data.note || "",
    })),
    payments: [],
    payouts: [],
    hours:
      config.hours ||
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
        day,
        open: "09:00",
        close: "17:00",
        closed: true,
      })),
    notice: config.notice || "",
    info: config.info || {
      name: c.business,
      tagline: "",
      phone: user.contact.phone,
      email: user.contact.email,
      address: "",
      instagram: "",
    },
    photos: config.photos || [],
    pages: config.pages || [],
    plan: {
      usage: {
        changesUsed: 0,
        changesCap: 1,
        changesPct: 0,
        hoursUsed: 0,
        hoursCap: 1,
        hoursPct: 0,
      },
      support: { used: 0, cap: 1 },
      changes: { used: 0, cap: 1 },
      price: (sub?.mrrCents || 0) / 100,
      noticePeriod: "30 days notice",
      nextChargeDate: "Managed in Stripe",
      endsOn: "Period end",
      card: { brand: "Managed in Stripe", last4: "", expires: "" },
      invoices: [],
      storage: { used: 0, cap: 1 },
      status: sub?.status || "none",
    },
  };
}
export async function business(request, s, user) {
  const [section, recordId, action] = s,
    method = request.method,
    c = user.contact.client,
    clientId = c.id;
  if (section === "export" && method === "GET") {
    requireSigner(user);
    const data = await businessSnapshot(user);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json",
        "content-disposition": "attachment; filename=klyvora-data.json",
        "cache-control": "private, no-store",
      },
    });
  }
  if (
    ["business", "site", "plan", "catalog", "customers"].includes(section) &&
    !recordId &&
    method === "GET"
  ) {
    const data = await businessSnapshot(user);
    if (section === "business") return data;
    if (section === "catalog") return data.catalog;
    if (section === "site")
      return {
        hours: data.hours,
        notice: data.notice,
        info: data.info,
        photos: data.photos,
        pages: data.pages,
      };
    if (section === "customers")
      return { rows: data.customers, totals: { total: data.customers.length } };
    return { offerCode: c.offerCode, ...data.plan };
  }
  if (section === "bookings") {
    if (!recordId && method === "GET") {
      const snap = await businessSnapshot(user);
      return { days: snap.days, rows: snap.orders };
    }
    if (recordId === "export" && method === "GET")
      return new Response(
        csv([
          ["Name", "Time", "Status"],
          ...(await prisma.booking.findMany({ where: { clientId } })).map(
            (b) => [b.name, b.startsAt?.toISOString(), b.status],
          ),
        ]),
        {
          headers: {
            "content-type": "text/csv",
            "content-disposition": "attachment; filename=bookings.csv",
          },
        },
      );
    if (!recordId && method === "POST") {
      const b = await body(
        request,
        z
          .object({
            name,
            phone: text.max(50).default(""),
            service: name,
            slot: date.optional(),
            startsAt: date.optional(),
            depositInPerson: z.boolean().default(false),
            day: z.number().int().min(0).max(6).optional(),
          })
          .refine((b) => b.slot || b.startsAt, "Choose a date and time"),
      );
      const booking = await prisma.booking.create({
        data: {
          clientId,
          name: b.name,
          startsAt: new Date(b.startsAt || b.slot),
          status: b.depositInPerson ? "Deposit paid" : "Confirmed",
          data: { phone: b.phone, service: b.service },
        },
      });
      return bookingDTO(booking);
    }
    if (
      ["rules", "ordering", "discount", "block"].includes(recordId) &&
      ["POST", "PUT"].includes(method)
    ) {
      if (recordId === "rules") {
        const b = await body(
          request,
          z.object({
            rules: z.record(
              z.string().max(100),
              z.union([text, z.boolean(), z.number().finite()]),
            ),
          }),
        );
        await saveWorkspace(clientId, { rules: b.rules });
        return { saved: true };
      }
      if (recordId === "ordering") {
        const b = await body(
          request,
          z.object({ paused: z.boolean(), resume: text.optional() }),
        );
        await saveWorkspace(clientId, { ordering: b });
        return { paused: b.paused };
      }
      if (recordId === "discount") {
        const b = await body(
          request,
          z
            .object({
              code: name,
              amount: z.enum(["10% off", "15% off", "$5 off"]),
              minimum: text.optional(),
              ends: date.optional(),
            })
            .passthrough(),
        );
        requireSigner(user);
        if (!c.stripeConnectedAccountId || c.connectStatus !== "connected")
          fail(
            409,
            "not_connected",
            "Connect your Stripe account before creating a discount.",
          );
        const percent = b.amount.includes("%");
        const value = Number(b.amount.replace(/[^0-9.]/g, ""));
        const opts = {
          stripeAccount: c.stripeConnectedAccountId,
          idempotencyKey: `discount:${clientId}:${b.code}`,
        };
        const coupon = await stripe().coupons.create(
          {
            duration: "once",
            ...(percent
              ? { percent_off: value }
              : {
                  amount_off: cents(value),
                  currency: process.env.STRIPE_CURRENCY || "usd",
                }),
            ...(b.ends
              ? { redeem_by: Math.floor(new Date(b.ends).getTime() / 1000) }
              : {}),
          },
          opts,
        );
        const minimum = b.minimum ? Number(b.minimum.replace(/[$,]/g, "")) : 0;
        if (!Number.isFinite(minimum) || minimum < 0)
          fail(422, "amount", "Enter a valid minimum order amount.");
        const promotion = await stripe().promotionCodes.create(
          {
            promotion: { type: "coupon", coupon: coupon.id },
            code: b.code,
            ...(minimum
              ? {
                  restrictions: {
                    minimum_amount: cents(minimum),
                    minimum_amount_currency:
                      process.env.STRIPE_CURRENCY || "usd",
                  },
                }
              : {}),
          },
          { ...opts, idempotencyKey: `promotion:${clientId}:${b.code}` },
        );
        await saveWorkspace(clientId, {
          discount: {
            code: b.code,
            couponId: coupon.id,
            promotionId: promotion.id,
            ...(percent
              ? { percentOff: value }
              : { amountCents: cents(value) }),
          },
        });
        await audit(prisma, user.id, "discount.created", "Client", clientId, {
          couponId: coupon.id,
          promotionId: promotion.id,
        });
        return { created: true, code: b.code };
      }
      const b = await body(
        request,
        z.object({
          day: z.union([z.number().int().min(0).max(6), date]),
          from: text.min(1),
          to: text.min(1),
          note: text.default(""),
        }),
      );
      const config = await workspace(clientId);
      await saveWorkspace(clientId, {
        blocks: [...(config.blocks || []), { ...b, id: crypto.randomUUID() }],
      });
      return { blocked: true };
    }
    const booking = required(
      await prisma.booking.findFirst({ where: { id: recordId, clientId } }),
      "Booking",
    );
    if (action === "cancel" && method === "POST") {
      const b = await body(
        request,
        z.object({ reason: text.optional(), refund: z.boolean().optional() }),
      );
      if (b.refund && booking.data.chargeId)
        fail(
          409,
          "refund_required",
          "Refund the payment from Payments before cancelling.",
        );
      return bookingDTO(
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "Canceled" },
        }),
      );
    }
    if (!action && method === "PATCH") {
      const b = await body(
        request,
        z.object({
          status: z
            .enum([
              "Confirmed",
              "No-show",
              "No show",
              "Done",
              "New",
              "Preparing",
              "Ready",
              "Picked up",
              "Shipped",
              "To ship",
            ])
            .optional(),
          action: z.enum(["status", "no-show", "reschedule"]).optional(),
          slot: date.optional(),
          startsAt: date.optional(),
          day: z.number().int().min(0).max(6).optional(),
        }),
      );
      let moved;
      if (b.action === "reschedule" && b.day !== undefined) {
        moved = new Date(booking.startsAt || Date.now());
        const week = new Date();
        week.setUTCDate(
          week.getUTCDate() - ((week.getUTCDay() + 6) % 7) + b.day,
        );
        moved.setUTCFullYear(
          week.getUTCFullYear(),
          week.getUTCMonth(),
          week.getUTCDate(),
        );
      }
      return bookingDTO(
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status:
              b.action === "no-show" ? "No-show" : b.status || booking.status,
            ...(moved ? { startsAt: moved } : {}),
            ...(b.slot || b.startsAt
              ? { startsAt: new Date(b.startsAt || b.slot) }
              : {}),
          },
        }),
      );
    }
  }
  if (section === "catalog") {
    if (recordId === "groups" && method === "POST") {
      const b = await body(request, z.object({ name }));
      const data = await workspace(clientId);
      await saveWorkspace(clientId, {
        groups: [...new Set([...(data.groups || []), b.name])],
      });
      return { name: b.name };
    }
    if (recordId === "order" && ["POST", "PUT"].includes(method)) {
      const b = await body(
        request,
        z
          .object({
            ids: z.array(id).max(1000).optional(),
            order: z.array(id).max(1000).optional(),
          })
          .refine((b) => b.ids || b.order, "Supply item IDs"),
      );
      if (
        (await prisma.catalogItem.count({
          where: { clientId, id: { in: b.ids || b.order } },
        })) !== (b.ids || b.order).length
      )
        fail(404, "not_found", "A catalog item was not found.");
      await prisma.$transaction(
        (b.ids || b.order).map((id, i) =>
          prisma.catalogItem.updateMany({
            where: { id, clientId },
            data: { position: i },
          }),
        ),
      );
      return { saved: true };
    }
    if (recordId === "items") {
      const schema = z.object({
        name,
        price: z.preprocess(
          (v) => (typeof v === "string" ? Number(v.replace(/[$,]/g, "")) : v),
          money,
        ),
        desc: text.default(""),
        meta: text.default(""),
        group: name,
        visible: z.boolean().default(true),
        photo: text.optional(),
      });
      const existing = action
        ? required(
            await prisma.catalogItem.findFirst({
              where: { id: action, clientId },
            }),
            "Catalog item",
          )
        : null;
      if (method === "DELETE" && existing) {
        await prisma.catalogItem.delete({ where: { id: existing.id } });
        return { deleted: true };
      }
      const b = await body(request, existing ? schema.partial() : schema);
      if (b.photo)
        required(
          await prisma.file.findFirst({ where: { id: b.photo, clientId } }),
          "Photo",
        );
      const data = {
        ...(b.name ? { name: b.name } : {}),
        ...(b.price !== undefined ? { priceCents: cents(b.price) } : {}),
        ...(b.group ? { group: b.group } : {}),
        ...(b.visible !== undefined ? { hidden: !b.visible } : {}),
        data: {
          ...existing?.data,
          desc: b.desc ?? existing?.data.desc ?? "",
          meta: b.meta ?? existing?.data.meta ?? "",
          photo: b.photo ?? existing?.data.photo ?? null,
        },
      };
      const item = existing
        ? await prisma.catalogItem.update({ where: { id: existing.id }, data })
        : await prisma.catalogItem.create({ data: { ...data, clientId } });
      return itemDTO(item);
    }
  }
  if (section === "site") {
    if (recordId === "uploads" && method === "POST") {
      const form = await request.formData();
      return uploadImage(form.get("file"), clientId);
    }
    if (recordId === "publish" && method === "POST") {
      const b = await body(
        request,
        z.object({
          hours: z
            .array(
              z.object({
                day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
                open: text.max(5),
                close: text.max(5),
                closed: z.boolean(),
              }),
            )
            .length(7),
          notice: text,
          info: z.object({
            name,
            tagline: text,
            phone: text,
            email: email.or(z.literal("")),
            address: text,
            instagram: text,
          }),
          pages: z
            .array(
              z.object({
                id,
                name: text.optional(),
                headline: text,
                intro: text,
                cta: text,
              }),
            )
            .max(100),
          photos: z.array(id).max(100),
        }),
      );
      const photos = await prisma.file.findMany({
        where: { id: { in: b.photos }, clientId, type: "image" },
      });
      if (photos.length !== b.photos.length)
        fail(422, "photos", "A selected photo is not owned by this business.");
      const photoData = b.photos.map((id) => {
        const f = photos.find((x) => x.id === id);
        return {
          id,
          name: f.name,
          url: `https://imagedelivery.net/${process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH}/${f.key.slice(7)}/public`,
        };
      });
      await saveWorkspace(clientId, {
        ...b,
        photos: photoData,
        publishedAt: new Date().toISOString(),
      });
      await audit(prisma, user.id, "site.published", "Client", clientId);
      return { published: true, liveInSeconds: 0 };
    }
  }
  if (section === "customers" && recordId === "export" && method === "GET")
    return new Response(
      csv([
        ["Name", "Email", "Phone"],
        ...(await prisma.customer.findMany({ where: { clientId } })).map(
          (c) => [c.name, c.email, c.phone],
        ),
      ]),
      {
        headers: {
          "content-type": "text/csv",
          "content-disposition": "attachment; filename=customers.csv",
        },
      },
    );
  if (section === "payments") {
    if (!c.stripeConnectedAccountId || c.connectStatus !== "connected") {
      if (method === "GET")
        return { rows: [], payouts: [], tiles: [], connected: false };
      fail(409, "not_connected", "Connect your own Stripe account first.");
    }
    const opts = { stripeAccount: c.stripeConnectedAccountId };
    if (method === "GET") {
      const charges = await stripe().charges.list({ limit: 100 }, opts);
      return {
        connected: true,
        rows: charges.data.map((p) => ({
          id: p.id,
          when: new Date(p.created * 1000).toISOString().slice(0, 10),
          who: p.billing_details?.name || "Customer",
          what: p.description || "Payment",
          amount: dollars(p.amount),
          status: p.refunded ? "Refunded" : p.paid ? "Paid" : "Pending",
          depositOnly: !!p.metadata.deposit,
        })),
        payouts: [],
        tiles: [],
      };
    }
    if (action === "refund" && method === "POST") {
      requireSigner(user);
      const b = await body(
        request,
        z.object({
          requestId: id,
          amount: z
            .union([
              z.literal("full"),
              money,
              z.string().regex(/^\d+(\.\d{1,2})?$/),
            ])
            .optional(),
          reason: text.optional(),
        }),
      );
      const operationId = `refund:${clientId}:${b.requestId}`;
      const previous = await prisma.auditLog.findUnique({
        where: { id: operationId },
      });
      if (previous) return { refunded: true, id: previous.meta.refundId };
      const charge = await stripe().charges.retrieve(recordId, opts);
      const amount =
        b.amount === "full" || b.amount === undefined
          ? charge.amount - charge.amount_refunded
          : cents(Number(b.amount));
      if (amount <= 0 || amount > charge.amount - charge.amount_refunded)
        fail(422, "amount", "The refund exceeds the available balance.");
      const key = createHash("sha256")
        .update(`${clientId}:${recordId}:${b.requestId}`)
        .digest("hex");
      const refund = await stripe().refunds.create(
        { charge: charge.id, amount, metadata: { reason: b.reason || "" } },
        { ...opts, idempotencyKey: `refund:${key}` },
      );
      await prisma.auditLog.upsert({
        where: { id: operationId },
        update: {},
        create: {
          id: operationId,
          userId: user.id,
          action: "client_payment.refunded",
          entity: "Charge",
          entityId: recordId,
          meta: { amountCents: amount, refundId: refund.id },
        },
      });
      return { refunded: true, id: refund.id };
    }
  }
  if (section === "plan" && method === "POST") {
    if (recordId === "cancel") {
      const b = await body(
        request,
        z
          .object({
            reason: text.optional(),
            acknowledged: z.boolean().optional(),
          })
          .passthrough(),
      );
      const result = await changePlan(user, true, b.reason);
      return { canceled: true, ...result };
    }
    if (recordId === "undo") {
      await body(request, z.object({}));
      await changePlan(user, false);
      return { canceled: false };
    }
    if (recordId === "data-export") {
      requireSigner(user);
      await body(request, z.object({}));
      return { requested: true, downloadUrl: "/api/app/export" };
    }
    if (recordId === "code-download") {
      requireSigner(user);
      await body(request, z.object({ email }));
      if (!c.data.repoUrl)
        fail(
          409,
          "handover_pending",
          "Your source repository has not been attached yet. Contact Klyvora for your handover.",
        );
      return {
        downloadUrl: c.data.repoUrl,
        filename: "site-code.zip",
        inviteSentTo: null,
      };
    }
  }
  return null;
}
