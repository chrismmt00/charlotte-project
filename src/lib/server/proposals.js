import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  fail,
  required,
  name,
  email,
  text,
  id,
  money,
  cents,
  audit,
  queue,
} from "./http";
import { proposalDTO, publicProposalDTO } from "./data";

export const proposalSchema = z.object({
  leadId: z.preprocess((v) => (v === "" ? null : v), id.nullish()),
  clientId: z.preprocess((v) => (v === "" ? null : v), id.nullish()),
  name,
  business: name.optional(),
  email: email.or(z.literal("")).optional(),
  offerCode: id,
  addOns: z.record(z.string(), z.number().int().min(0).max(10)).default({}),
  monthly: z.boolean().default(true),
  quote: z.preprocess(
    (v) => (v === "" ? null : typeof v === "string" ? Number(v) : v),
    money.nullish(),
  ),
  scopeOff: z.array(z.number().int().nonnegative()).max(100).default([]),
  extras: text.default(""),
  caps: z
    .object({
      pages: text,
      rounds: text,
      integrations: text,
      hosting: text,
      support: text,
      changes: text,
    })
    .partial()
    .default({}),
  termsTemplate: text.default("standard"),
  validDays: z.coerce.number().int().min(1).max(90).default(14),
  earliestStart: text.default(""),
  headline: text.optional(),
});
export async function priceProposal(db, b) {
  const offer = required(
    await db.offer.findFirst({
      where: { code: b.offerCode, active: true, addOnOf: null },
    }),
    "Offer",
  );
  if (offer.monthlyRequired && !b.monthly)
    fail(422, "plan_required", "The monthly plan is required for restaurants.");
  const base =
    offer.setupFrom && b.quote != null ? cents(b.quote) : offer.setupCents;
  if (base < offer.setupCents)
    fail(422, "price", "The quote cannot be below the catalog price.");
  let setup = base,
    monthly = offer.monthlyCents;
  const lines = [
    {
      code: offer.code,
      name: offer.name,
      setupCents: base,
      monthlyCents: monthly,
    },
  ];
  for (const [code, quantity] of Object.entries(b.addOns)) {
    if (!quantity) continue;
    let add;
    if (
      ["BOOKING", "BOOKING_LATER"].includes(code) &&
      ["W1", "W2"].includes(offer.code)
    )
      add = {
        code,
        name: "Online booking",
        setupCents: 50000,
        monthlyCents: 3000,
      };
    else
      add = await db.offer.findFirst({
        where: { code, active: true, addOnOf: { contains: offer.code } },
      });
    if (!add || (!add.addOnOf && !["BOOKING", "BOOKING_LATER"].includes(code)))
      fail(422, "add_on", "This add-on is not available for this offer.");
    if (code !== "KIOSK" && quantity !== 1)
      fail(422, "quantity", "Only kiosk add-ons allow multiple devices.");
    setup += add.setupCents * quantity;
    // Optional monthly switches off the whole service plan, including non-restaurant add-ons.
    const recurring = add.monthlyCents * quantity;
    monthly += recurring;
    lines.push({
      code,
      name: add.name,
      quantity,
      setupCents: add.setupCents * quantity,
      monthlyCents: recurring,
    });
  }
  if (setup > 100000000 || monthly > 100000000)
    fail(422, "price", "Proposal totals must be under $1,000,000.");
  return { offer, setup, monthly, lines };
}
const TERMS =
  "Setup is billed 50% at kickoff, 30% at an approved working demo and 20% at accepted launch. Monthly billing begins at launch only when a plan is chosen; restaurant plans are required. The client owns their site, custom code, domain, branding, content, data, customer list and payment account on final payment. Klyvora reusable templates and platform code remain licensed. Hardware, installation, third-party services and AI/messaging usage are separate. Klyvora takes no commission on client sales.";
export async function saveProposal(user, input, existingId) {
  return prisma.$transaction(async (db) => {
    if (existingId)
      await db.$queryRaw`SELECT "id" FROM "Proposal" WHERE "id"=${existingId} FOR UPDATE`;
    const existing = existingId
      ? required(
          await db.proposal.findUnique({ where: { id: existingId } }),
          "Proposal",
        )
      : null;
    if (existing && existing.status !== "Draft")
      fail(
        409,
        "closed",
        "Only draft proposals can be edited. Duplicate it to revise a sent proposal.",
      );
    const b = proposalSchema.parse(
      existing ? { ...proposalDTO(existing), ...input } : input,
    );
    const price = await priceProposal(db, b);
    const lead = b.leadId
      ? required(await db.lead.findUnique({ where: { id: b.leadId } }), "Lead")
      : null;
    const c = b.clientId
      ? required(
          await db.client.findUnique({
            where: { id: b.clientId },
            include: { contacts: true },
          }),
          "Client",
        )
      : null;
    const address = b.email || lead?.email || c?.contacts[0]?.email;
    if (!address)
      fail(
        422,
        "email_required",
        "Select a lead/client with an email or provide the recipient email.",
      );
    const { quote: _quote, ...data } = b;
    const record = {
      name: b.name,
      business: b.business || lead?.business || c?.business || b.name,
      email: address,
      leadId: b.leadId || null,
      clientId: b.clientId || null,
      offerCode: b.offerCode,
      setupCents: price.setup,
      monthlyCents: price.monthly,
      monthly: b.monthly,
      items: {
        lines: price.lines,
        scope: (price.offer.data.includes || []).filter(
          (_s, i) => !b.scopeOff.includes(i),
        ),
      },
      terms: TERMS,
      data: { ...data, contactName: lead?.name || c?.contacts[0]?.name || "" },
    };
    const p = existing
      ? await db.proposal.update({
          where: { id: existingId },
          data: { ...record, version: { increment: 1 } },
        })
      : await db.proposal.create({
          data: { ...record, token: randomBytes(32).toString("base64url") },
        });
    await audit(
      db,
      user.id,
      existing ? "proposal.updated" : "proposal.created",
      "Proposal",
      p.id,
    );
    return proposalDTO(p);
  });
}
export async function sendProposal(user, id) {
  return prisma.$transaction(async (db) => {
    await db.$queryRaw`SELECT "id" FROM "Proposal" WHERE "id"=${id} FOR UPDATE`;
    const p = required(
      await db.proposal.findUnique({ where: { id } }),
      "Proposal",
    );
    if (!["Draft", "Sent", "Viewed"].includes(p.status))
      fail(409, "closed", "This proposal is closed.");
    if (
      ["pages", "rounds", "integrations", "hosting", "support", "changes"].some(
        (k) => !p.data.caps?.[k]?.trim() || /\[[^\]]+\]/.test(p.data.caps[k]),
      )
    ) {
      fail(
        422,
        "scope_required",
        "Complete the page, revision, integration, hosting, support and change limits before sending.",
      );
    }
    const result = await db.proposal.update({
      where: { id },
      data: {
        status: "Sent",
        data: { ...p.data, sendCount: (p.data.sendCount || 0) + 1 },
        validUntil: new Date(Date.now() + (p.data.validDays || 14) * 86400000),
      },
    });
    if (p.leadId)
      await db.lead.update({
        where: { id: p.leadId },
        data: { status: "Proposal sent" },
      });
    await queue(
      db,
      `proposal-sent:${id}:${p.version}:${(p.data.sendCount || 0) + 1}`,
      "email",
      {
        to: p.email,
        subject: "Your Klyvora proposal",
        text: `Your proposal is ready: ${process.env.NEXT_PUBLIC_APP_URL}/p/${p.token}\n\nReview the scope, ownership terms, and milestone payments before signing.`,
        params: {
          proposal_link: `${process.env.NEXT_PUBLIC_APP_URL}/p/${p.token}`,
          business: p.business,
          first_name: p.data.contactName || p.business,
          offer: p.offerCode,
        },
      },
    );
    await audit(db, user.id, "proposal.sent", "Proposal", id);
    return proposalDTO(result);
  });
}
export async function acceptProposal(token, b, address) {
  return prisma.$transaction(
    async (db) => {
      // Lock the proposal: concurrent accepts must never create two clients, projects or invoices.
      await db.$queryRaw`SELECT "id" FROM "Proposal" WHERE "token"=${token} FOR UPDATE`;
      const p = required(
        await db.proposal.findFirst({
          where: { token, status: { not: "Draft" } },
          include: { lead: true },
        }),
        "Proposal",
      );
      if (p.status === "Accepted") return { status: "Accepted" };
      if (
        !["Sent", "Viewed"].includes(p.status) ||
        !p.validUntil ||
        p.validUntil < new Date()
      )
        fail(409, "closed", "This proposal is no longer open.");
      const offer = required(
        await db.offer.findUnique({ where: { code: p.offerCode } }),
        "Offer",
      );
      if (offer.monthlyRequired && !b.monthly)
        fail(
          422,
          "plan_required",
          "The monthly plan is required for restaurants.",
        );
      let c = p.clientId
        ? await db.client.findUnique({ where: { id: p.clientId } })
        : p.leadId
          ? await db.client.findUnique({ where: { leadId: p.leadId } })
          : null;
      if (!c)
        c = await db.client.create({
          data: {
            leadId: p.leadId,
            business: p.business,
            offerCode: p.offerCode,
            monthly: b.monthly,
            kind: ["RC", "RK"].includes(p.offerCode)
              ? "restaurant"
              : p.offerCode === "EC"
                ? "store"
                : "booking",
          },
        });
      const u = await db.user.upsert({
        where: { email: p.email },
        update: {},
        create: { email: p.email, name: p.data.contactName || b.signatureName },
      });
      const contact = await db.contact.findUnique({ where: { userId: u.id } });
      if (contact && contact.clientId !== c.id)
        fail(
          409,
          "account_conflict",
          "This email already belongs to another client. Ask Klyvora to set up access.",
        );
      if (!contact)
        await db.contact.create({
          data: {
            userId: u.id,
            clientId: c.id,
            name: p.data.contactName || b.signatureName,
            email: p.email,
            role: "signer",
          },
        });
      const a = Math.round(p.setupCents * 0.5),
        d = Math.round(p.setupCents * 0.3);
      const project = await db.project.create({
        data: {
          clientId: c.id,
          proposalId: p.id,
          name: p.name,
          offerCode: p.offerCode,
          setupCents: p.setupCents,
          milestones: {
            create: [
              {
                name: "Kickoff",
                percent: 50,
                position: 0,
                amountCents: a,
                acceptedAt: new Date(),
              },
              {
                name: "Working demo",
                percent: 30,
                position: 1,
                amountCents: d,
              },
              {
                name: "Accepted launch",
                percent: 20,
                position: 2,
                amountCents: p.setupCents - a - d,
              },
            ],
          },
          tasks: {
            create: [
              "Logo and brand assets",
              "Business hours and contact details",
              "Photos and page content",
            ].map((title) => ({ title, clientTask: true, assignee: "Client" })),
          },
        },
        include: { milestones: true },
      });
      const kickoff = project.milestones.find((m) => m.position === 0);
      const inv = await db.invoice.create({
        data: {
          clientId: c.id,
          projectId: project.id,
          milestoneId: kickoff.id,
          amountCents: a,
          data: { memo: "Kickoff · 50%" },
        },
      });
      await queue(db, `invoice:${inv.id}`, "invoice", { id: inv.id });
      const monthly = b.monthly
        ? p.items.lines.reduce((n, l) => n + l.monthlyCents, 0)
        : 0;
      // The sent snapshot always retains its catalog monthly price even if the client toggles it.
      const recurring = b.monthly ? p.monthlyCents || offer.monthlyCents : 0;
      if (b.monthly)
        await db.subscription.create({
          data: {
            clientId: c.id,
            projectId: project.id,
            offerCode: p.offerCode,
            mrrCents: monthly || recurring,
          },
        });
      await db.proposal.update({
        where: { id: p.id },
        data: {
          status: "Accepted",
          clientId: c.id,
          monthly: b.monthly,
          monthlyCents: recurring,
          signatureName: b.signatureName,
          signatureIp: address,
          acceptedAt: new Date(),
          signedVersion: p.version,
        },
      });
      if (p.leadId)
        await db.lead.update({
          where: { id: p.leadId },
          data: { status: "Signed" },
        });
      await audit(db, u.id, "proposal.accepted", "Proposal", p.id, {
        version: p.version,
        projectId: project.id,
      });
      await queue(db, `proposal-accepted:${p.id}`, "email", {
        to: p.email,
        subject: "Your Klyvora project is ready",
        text: `Your proposal is signed. Your kickoff invoice will arrive separately. Sign in to follow the project: ${process.env.NEXT_PUBLIC_APP_URL}/portal`,
      });
      return { status: "Accepted" };
    },
    { timeout: 15000 },
  );
}
export async function publicProposal(token) {
  const p = required(
    await prisma.proposal.findFirst({
      where: { token, status: { not: "Draft" } },
      include: { lead: true },
    }),
    "Proposal",
  );
  if (p.status === "Sent")
    await prisma.proposal.updateMany({
      where: { id: p.id, status: "Sent" },
      data: { status: "Viewed" },
    });
  return publicProposalDTO(p);
}
export async function completeMilestone(
  user,
  projectId,
  position,
  signatureName,
) {
  return prisma.$transaction(async (db) => {
    await db.$queryRaw`SELECT "id" FROM "Project" WHERE "id"=${projectId} FOR UPDATE`;
    const p = required(
      await db.project.findUnique({
        where: { id: projectId },
        include: {
          milestones: {
            orderBy: { position: "asc" },
            include: { invoice: true },
          },
        },
      }),
      "Project",
    );
    if (user.contact && p.clientId !== user.contact.clientId)
      fail(404, "not_found", "Project not found.");
    const m = p.milestones[position];
    if (!m) fail(404, "not_found", "Milestone not found.");
    if (
      !m.acceptedAt &&
      p.milestones
        .slice(0, position)
        .some((x) => !x.invoice || x.invoice.status !== "Paid")
    )
      fail(
        409,
        "payment_required",
        "Previous milestone invoices must be paid first.",
      );
    if (
      !m.acceptedAt &&
      position > 0 &&
      p.status !== ["kickoff", "demo", "launch"][position]
    )
      fail(409, "wrong_stage", "The project is not ready for this approval.");
    const invoice =
      m.invoice ||
      (await db.invoice.create({
        data: {
          projectId: p.id,
          clientId: p.clientId,
          milestoneId: m.id,
          amountCents: m.amountCents,
          data: { memo: `${m.name} · ${m.percent}%` },
        },
      }));
    if (!m.acceptedAt) {
      await db.milestone.update({
        where: { id: m.id },
        data: { acceptedAt: new Date() },
      });
      await db.project.update({
        where: { id: p.id },
        data: {
          status: position === 2 ? "accepted" : "launch",
          data: {
            ...p.data,
            ...(signatureName
              ? {
                  launchSignature: signatureName,
                  launchedAt: new Date().toISOString(),
                }
              : {}),
          },
        },
      });
      await db.client.update({
        where: { id: p.clientId },
        data: { stage: position === 2 ? "accepted" : "launch" },
      });
      await queue(db, `invoice:${invoice.id}`, "invoice", { id: invoice.id });
      if (position === 2) {
        const sub = await db.subscription.findUnique({
          where: { projectId: p.id },
        });
        if (sub)
          await queue(db, `subscription:${sub.id}`, "subscription", {
            id: sub.id,
          });
      }
      await audit(db, user.id, "milestone.accepted", "Milestone", m.id, {
        signatureName: signatureName || null,
      });
    }
    return {
      invoice: {
        id: invoice.id,
        percent: m.percent,
        amount: invoice.amountCents / 100,
      },
      planStarted:
        position === 2 &&
        !!(await db.subscription.findUnique({ where: { projectId: p.id } })),
    };
  });
}
