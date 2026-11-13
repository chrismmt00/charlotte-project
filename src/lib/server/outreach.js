import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  body,
  name,
  email,
  id,
  text,
  date,
  jsonObject,
  required,
  fail,
  audit,
  queue,
} from "./http";
import { metrics, today } from "./data";

export async function getOutreach() {
  const [prospects, approvals, partners, m] = await Promise.all([
    prisma.prospect.findMany(),
    prisma.approval.findMany({ where: { status: "pending" } }),
    prisma.partner.findMany(),
    metrics(),
  ]);
  return {
    stats: {
      foundToday: prospects.filter(
        (p) => p.createdAt.toISOString().slice(0, 10) === today(),
      ).length,
      dailyGoal: 10,
      sentWeek: 0,
      repliesWeek: 0,
      contactsWeek: m.contactsThisWeek,
      weeklyGoal: [65, 95],
    },
    queue: approvals.map((a) => ({
      ...a.data,
      id: a.id,
      prospectId: a.prospectId,
      kind: a.kind,
    })),
    run: {
      status: "idle",
      step: 0,
      started: "Not run",
      found: 0,
      skipped: 0,
      errors: 0,
      log: [],
    },
    prospects: prospects.map((p) => ({
      ...p.data,
      id: p.id,
      business: p.business,
      phase: p.phase,
      owner: p.owner,
      next: p.data.next || "",
      timeline: p.data.timeline || [],
    })),
    calls: [],
    scripts: [],
    partners: partners.map((p) => ({
      ...p.data,
      id: p.id,
      name: p.name,
      last: p.data.last || "Never",
      overdue: false,
      referrals: 0,
      signed: 0,
    })),
  };
}
export async function outreach(request, s, user) {
  const [section, recordId] = s,
    method = request.method;
  if (!section && method === "GET") return await getOutreach();
  if (section === "run" && method === "POST") {
    await body(request, z.object({}).passthrough());
    fail(
      503,
      "agent_not_configured",
      "Automated prospecting is not connected. You can still manage prospects and approve drafts here.",
    );
  }
  if (section === "prospects") {
    if (!recordId && method === "POST") {
      const b = await body(
        request,
        z.object({
          business: name,
          owner: text.default(""),
          data: jsonObject.default({}),
        }),
      );
      return { prospect: await prisma.prospect.create({ data: b }) };
    }
    const p = required(
      await prisma.prospect.findUnique({ where: { id: recordId } }),
      "Prospect",
    );
    if (method === "PATCH") {
      const b = await body(
        request,
        z
          .object({
            phase: z
              .enum([
                "Found",
                "Researched",
                "Email drafted",
                "Emailed",
                "Replied",
                "Demo in progress",
                "Demo ready for review",
                "Demo sent",
                "Call booked",
                "Became a lead",
                "Not a fit",
              ])
              .optional(),
            owner: text.optional(),
            next: text.optional(),
            demo: z.object({ builder: text, note: text.optional() }).optional(),
            lead: z.boolean().optional(),
          })
          .passthrough(),
      );
      const updated = await prisma.prospect.update({
        where: { id: p.id },
        data: {
          phase: b.phase || p.phase,
          owner: b.owner || p.owner,
          data: { ...p.data, next: b.next || p.data.next || "" },
        },
      });
      if (b.demo) {
        const demo = await prisma.demo.create({
          data: {
            prospectId: p.id,
            status: "building",
            data: { builder: b.demo.builder, note: b.demo.note || "" },
          },
        });
        return { prospect: { ...updated.data, ...updated }, demo };
      }
      return {
        prospect: {
          ...updated.data,
          id: updated.id,
          business: updated.business,
          owner: updated.owner,
          phase: updated.phase,
          next: updated.data.next,
        },
      };
    }
  }
  if (section === "approvals" && method === "POST") {
    const a = required(
      await prisma.approval.findUnique({ where: { id: recordId } }),
      "Approval",
    );
    const b = await body(
      request,
      z.object({
        action: z.enum(["approve", "edit", "reject"]),
        kind: z.enum(["email", "demo"]),
        prospectId: id.optional(),
        email: z
          .object({
            to: email,
            from: text.optional(),
            subject: name,
            body: text.min(1),
            attach: z.json().optional(),
            followUp: z.json().optional(),
          })
          .optional(),
        note: text.optional(),
      }),
    );
    const result = await prisma.$transaction(async (db) => {
      const claim = await db.approval.updateMany({
        where: { id: a.id, status: "pending" },
        data: {
          status:
            b.action === "approve"
              ? "approved"
              : b.action === "reject"
                ? "rejected"
                : "pending",
          approvedBy: b.action === "approve" ? user.id : null,
          data: b.email ? { ...a.data, email: b.email } : a.data,
        },
      });
      if (!claim.count)
        fail(409, "closed", "This approval has already been handled.");
      if (b.action === "approve") {
        const mail = b.email || a.data.email;
        if (a.kind === "email" && !mail)
          fail(422, "email", "An email draft is required.");
        if (mail)
          await queue(db, `outreach-approved:${a.id}`, "email", {
            to: email.parse(mail.to),
            subject: name.parse(mail.subject),
            text: text.min(1).parse(mail.body),
          });
        await audit(db, user.id, "outreach.approved", "Approval", a.id);
      }
      const phase =
        b.action === "approve"
          ? a.kind === "email"
            ? "Emailed"
            : "Demo sent"
          : undefined;
      if (phase)
        await db.prospect.update({
          where: { id: a.prospectId },
          data: { phase },
        });
      return {
        id: a.id,
        action: b.action,
        status:
          b.action === "approve"
            ? "queued"
            : b.action === "edit"
              ? "saved"
              : "rejected",
        prospect: { id: a.prospectId, phase, next: "" },
      };
    });
    return result;
  }
  if (section === "activities" && method === "POST") {
    const b = await body(
      request,
      z.object({
        prospectId: id.nullable().optional(),
        newProspect: z.object({ business: name, type: text }).optional(),
        kind: z.enum(["Call", "Visit", "Text / DM", "Email", "Event"]),
        outcome: text,
        at: date,
        notes: text.optional(),
        next: text.optional(),
        countsTowardWeek: z.boolean().optional(),
        callId: id.optional(),
      }),
    );
    if (b.prospectId)
      required(
        await prisma.prospect.findUnique({ where: { id: b.prospectId } }),
        "Prospect",
      );
    if (b.newProspect)
      await prisma.prospect.create({
        data: {
          business: b.newProspect.business,
          owner: user.name || user.email,
          data: { type: b.newProspect.type },
        },
      });
    const a = await prisma.activity.create({
      data: {
        userId: user.id,
        type: b.countsTowardWeek === false ? "note" : b.kind,
        body: b.notes || b.outcome,
        meta: { prospectId: b.prospectId || null },
        createdAt: new Date(b.at),
      },
    });
    return {
      activity: {
        id: a.id,
        who: user.name || user.email,
        text: a.body,
        when: today(),
      },
    };
  }
  if (section === "partners" && method === "POST") {
    const b = await body(
      request,
      z.object({
        name: name.optional(),
        type: text.optional(),
        owner: text.optional(),
        email: email.optional(),
        phone: text.optional(),
        partnerId: id.optional(),
        touch: z.boolean().optional(),
        note: text.optional(),
      }),
    );
    if (b.touch) {
      const p = required(
        await prisma.partner.findUnique({ where: { id: b.partnerId } }),
        "Partner",
      );
      await prisma.partner.update({
        where: { id: p.id },
        data: { data: { ...p.data, last: today(), note: b.note || "" } },
      });
      return { partner: { id: p.id, last: today(), overdue: false } };
    }
    if (!b.name) fail(422, "name", "Enter the partner name.");
    const p = await prisma.partner.create({ data: { name: b.name, data: b } });
    return {
      partner: {
        ...b,
        id: p.id,
        last: "Never",
        referrals: 0,
        signed: 0,
        overdue: false,
      },
    };
  }
  if (section === "demos") {
    const d = required(
      await prisma.demo.findUnique({ where: { id: recordId } }),
      "Demo",
    );
    if (method === "GET")
      return {
        demo: {
          ...d.data,
          id: d.id,
          prospectId: d.prospectId,
          status: d.status,
          services: d.data.services || [],
          sources: d.data.sources || [],
        },
      };
    if (method === "POST") {
      const b = await body(
        request,
        z.object({
          action: z.enum(["cancel", "handoff"]),
          to: text.optional(),
          note: text.optional(),
          name: text.optional(),
          tagline: text.optional(),
        }),
      );
      await prisma.demo.update({
        where: { id: d.id },
        data: {
          status: b.action === "cancel" ? "cancelled" : "building",
          data: { ...d.data, ...b },
        },
      });
      return {
        id: d.id,
        status: b.action === "cancel" ? "cancelled" : "handed",
        prospect: {
          phase: b.action === "cancel" ? "Replied" : "Demo in progress",
          owner: b.to,
        },
      };
    }
  }
  return null;
}
