import "server-only";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_VALUES,
  NUMBER_RULES,
  PROPOSAL_TEMPLATES,
  EMAIL_TEMPLATES,
  numberError,
} from "@/lib/admin/sample-settings";
import {
  body,
  name,
  email,
  text,
  money,
  cents,
  required,
  fail,
  audit,
  queue,
} from "./http";
import { catalog, offerDTO, day } from "./data";

const memberDTO = (u) => ({
  id: u.id,
  name: u.name || u.email,
  email: u.email,
  role: u.role === "owner" ? "Owner" : "Builder",
  active: u.active ? "Active" : "Removed",
  tfa: "Magic link",
  human: true,
  pending: !u.emailVerified,
});
export async function getSettings(user) {
  const [settings, people, offers, logs, templates] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "ui" } }),
    prisma.user.findMany({
      where: { role: { in: ["owner", "builder"] }, active: true },
    }),
    catalog(),
    prisma.auditLog.findMany({
      where: { entity: "Offer" },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.setting.findMany({ where: { key: { startsWith: "template:" } } }),
  ]);
  const values = Object.fromEntries(
    Object.entries(DEFAULT_VALUES).map(([k, v]) => [
      k,
      typeof v === "string" && v.startsWith("[") ? "" : v,
    ]),
  );
  const merge = (t) => {
    const saved = templates.find((x) => x.key === `template:${t.id}`);
    return { ...t, ...saved?.value, custom: !!saved };
  };
  return {
    me: { id: user.id, name: user.name || user.email, role: user.role },
    values: { ...values, ...settings?.value },
    team: people.map(memberDTO),
    catalog: offers.map((o) => ({ ...o, sub: o.bestFor || "", changed: "" })),
    history: logs.map((l) => ({
      id: l.id,
      what: `Price updated: ${l.entityId}`,
      who: l.userId,
      when: day(l.createdAt),
      note: l.meta.note || "",
      tone: "accent",
    })),
    proposalTemplates: PROPOSAL_TEMPLATES.map(merge),
    emailTemplates: EMAIL_TEMPLATES.map(merge),
    integrations: [
      {
        name: "Stripe",
        use: "Klyvora billing",
        status: process.env.STRIPE_SECRET_KEY ? "Key set" : "Not connected",
        tone: "accent",
      },
      {
        name: "Email",
        use: "Transactional delivery",
        status:
          process.env.SMTP_PASS || process.env.BREVO_API_KEY
            ? "Key set"
            : "Not connected",
        tone: "accent",
      },
      {
        name: "PostgreSQL",
        use: "Database",
        status: "Connected",
        tone: "success",
      },
      {
        name: "Cloudflare",
        use: "Images",
        status: process.env.CLOUDFLARE_IMAGES_API_TOKEN
          ? "Key set"
          : "Not connected",
        tone: "accent",
      },
    ],
    lastRun: { started: "Not run", found: 0, skipped: 0, errors: 0 },
  };
}
export async function settings(request, s, user) {
  const method = request.method,
    [, section, code] = s;
  if (user.role !== "owner")
    fail(403, "owner_only", "Only the owner can manage settings.");
  if (!section && method === "GET") return await getSettings(user);
  if (!section && method === "PATCH") {
    const b = await body(
      request,
      z
        .object({
          values: z.record(z.string(), z.union([text, z.boolean()])).optional(),
          template: z
            .object({
              id: name,
              subject: text.optional(),
              body: text,
              templateId: z.number().int().positive().optional(),
            })
            .optional(),
        })
        .refine((b) => b.values || b.template, "No changes supplied"),
    );
    if (b.template) {
      const t = b.template;
      if (t.id === "magic" && !t.body.includes("{{magic_link}}"))
        fail(422, "template", "Sign-in templates must include {{magic_link}}.");
      if (
        ![...PROPOSAL_TEMPLATES, ...EMAIL_TEMPLATES].some((x) => x.id === t.id)
      )
        fail(422, "template", "Unknown template.");
      await prisma.$transaction(async (db) => {
        await db.setting.upsert({
          where: { key: `template:${t.id}` },
          update: { value: t },
          create: { key: `template:${t.id}`, value: t },
        });
        await audit(db, user.id, "template.updated", "Setting", t.id);
      });
      return { template: { ...t, custom: true } };
    }
    for (const [k, v] of Object.entries(b.values)) {
      if (!(k in DEFAULT_VALUES)) fail(422, "setting", "Unknown setting.");
      if (k in NUMBER_RULES && numberError(k, v))
        fail(422, "setting", numberError(k, v));
    }
    await prisma.$transaction(async (db) => {
      const old = await db.setting.findUnique({ where: { key: "ui" } });
      await db.setting.upsert({
        where: { key: "ui" },
        update: { value: { ...old?.value, ...b.values } },
        create: { key: "ui", value: b.values },
      });
      const g = await db.setting.findUnique({ where: { key: "general" } });
      const targets = { ...g?.value };
      for (const [field, k] of Object.entries({
        signedTarget: "targets.signed",
        cashTarget: "targets.cash",
        mrrTarget: "targets.mrr",
      }))
        if (b.values[k] !== undefined)
          targets[field] = Number(String(b.values[k]).replaceAll(",", ""));
      await db.setting.upsert({
        where: { key: "general" },
        update: { value: targets },
        create: { key: "general", value: targets },
      });
      await audit(db, user.id, "settings.updated", "Setting", "ui", {
        keys: Object.keys(b.values),
      });
    });
    return { values: b.values };
  }
  if (section === "catalog" && method === "PATCH") {
    const b = await body(
      request,
      z.object({
        setup: z.coerce.number().pipe(money),
        monthly: z.coerce.number().pipe(money),
        note: text.min(3),
      }),
    );
    const offer = await prisma.$transaction(async (db) => {
      required(await db.offer.findUnique({ where: { code } }), "Offer");
      const o = await db.offer.update({
        where: { code },
        data: { setupCents: cents(b.setup), monthlyCents: cents(b.monthly) },
      });
      await audit(db, user.id, "offer.price_changed", "Offer", code, {
        note: b.note,
        setupCents: o.setupCents,
        monthlyCents: o.monthlyCents,
      });
      return o;
    });
    revalidateTag("offers", "max");
    return {
      offer: offerDTO(offer),
      history: {
        id: crypto.randomUUID(),
        what: `Price updated: ${offer.name}`,
        who: user.name || user.email,
        when: day(new Date()),
        note: b.note,
        tone: "success",
      },
    };
  }
  if (section === "team" && method === "POST") {
    const b = await body(
      request,
      z.discriminatedUnion("action", [
        z.object({
          action: z.literal("invite"),
          email,
          role: z.enum(["Owner", "Builder"]),
        }),
        z.object({
          action: z.literal("role"),
          id: name,
          role: z.enum(["Owner", "Builder"]),
        }),
        z.object({
          action: z.literal("remove"),
          id: name,
          reassignTo: text.optional(),
        }),
        z.object({ action: z.literal("rotate-key") }),
      ]),
    );
    if (b.action === "rotate-key")
      fail(
        409,
        "not_configured",
        "Agent API access is not enabled. No key has been rotated.",
      );
    return prisma.$transaction(async (db) => {
      // Serialize role changes so two owners cannot demote each other concurrently.
      await db.$queryRaw`SELECT pg_advisory_xact_lock(781409)`;
      let member;
      if (b.action === "invite") {
        const existing = await db.user.findUnique({
          where: { email: b.email },
        });
        if (existing)
          fail(409, "conflict", "This email already has an account.");
        member = await db.user.create({
          data: {
            email: b.email,
            name: b.email.split("@")[0],
            role: b.role.toLowerCase(),
          },
        });
        await queue(db, `team-invite:${member.id}`, "email", {
          to: b.email,
          subject: "Join Klyvora",
          text: `Your team account is ready. Request a secure sign-in link: ${process.env.NEXT_PUBLIC_APP_URL}/admin/signin`,
        });
      } else {
        const old = required(
          await db.user.findUnique({ where: { id: b.id } }),
          "Team member",
        );
        if (old.id === user.id && b.action === "remove")
          fail(409, "self_remove", "You cannot remove your own account.");
        if (
          old.role === "owner" &&
          (b.action === "remove" || b.role === "Builder") &&
          (await db.user.count({ where: { role: "owner", active: true } })) <= 1
        )
          fail(409, "last_owner", "Keep at least one active owner.");
        member = await db.user.update({
          where: { id: old.id },
          data:
            b.action === "remove"
              ? { active: false }
              : { role: b.role.toLowerCase() },
        });
        await db.session.deleteMany({ where: { userId: old.id } });
      }
      await audit(db, user.id, `team.${b.action}`, "User", member.id, {
        role: member.role,
      });
      return b.action === "remove"
        ? { ok: true }
        : { member: memberDTO(member) };
    });
  }
  return null;
}
