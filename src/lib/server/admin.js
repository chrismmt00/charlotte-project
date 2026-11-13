import "server-only";
import { z } from "zod";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";
import {
  body,
  name,
  email,
  id,
  text,
  date,
  money,
  cents,
  jsonObject,
  required,
  fail,
  audit,
  queue,
  csv,
} from "./http";
import {
  leadDTO,
  clientDTO,
  clientInclude,
  projectDTO,
  proposalDTO,
  ticketDTO,
  catalog,
  metrics,
  today,
} from "./data";
import {
  proposalSchema,
  saveProposal,
  sendProposal,
  completeMilestone,
} from "./proposals";
import { connectClient } from "@/lib/stripe";
import { reports } from "./reports";

const statuses = z.enum([
  "New",
  "Contacted",
  "Demo booked",
  "Proposal sent",
  "Signed",
  "Lost",
]);
const leadSchema = z
  .object({
    name,
    business: name,
    email: email.or(z.literal("")).default(""),
    phone: text.max(50).default(""),
    siteUrl: text.default(""),
    source: text.default("Other"),
    offerCode: id.nullish(),
    offer: text.optional(),
    status: statuses.default("New"),
    score: z.number().int().min(0).max(5).default(0),
    tags: z.array(text.max(100)).max(30).default([]),
    owner: text.max(200).default(""),
    notes: text.default(""),
    message: text.optional(),
    runSiteCheck: z.boolean().optional(),
  })
  .refine((b) => !!b.email || !!b.phone, {
    message: "An email or phone is required",
    path: ["email"],
  });
export async function importLeads(records, mapping = {}, duplicates = "skip") {
  const result = { imported: 0, updated: 0, skipped: 0 };
  if (records.length > 5000)
    fail(413, "too_large", "Import at most 5,000 rows at once.");
  for (const row of records) {
    const get = (k) => String(row[mapping[k] || k] ?? "").trim();
    const parsed = leadSchema.safeParse({
      name: get("name") || get("business"),
      business: get("business"),
      email: get("email").toLowerCase(),
      phone: get("phone").replace(/[^\d+]/g, ""),
      notes: get("notes"),
      source: "Workbook import",
      offerCode: get("offer") || null,
    });
    if (!parsed.success) {
      result.skipped++;
      continue;
    }
    const b = parsed.data;
    const old = await prisma.lead.findFirst({
      where: {
        OR: [
          ...(b.email ? [{ email: b.email }] : []),
          ...(b.phone ? [{ phone: b.phone }] : []),
        ],
      },
    });
    if (old && duplicates !== "update") {
      result.skipped++;
      continue;
    }
    const { notes, runSiteCheck: _run, offer: _offer, ...rest } = b;
    if (old) {
      await prisma.lead.update({
        where: { id: old.id },
        data: { ...rest, message: notes },
      });
      result.updated++;
    } else {
      await prisma.lead.create({ data: { ...rest, message: notes } });
      result.imported++;
    }
  }
  return result;
}
export async function admin(request, s, user) {
  const method = request.method,
    [section, recordId, action, subId] = s;
  if (section === "metrics" && method === "GET") return await metrics();
  if (section === "tasks" && recordId && method === "PATCH") {
    const b = await body(request, z.object({ done: z.boolean() }));
    required(await prisma.task.findUnique({ where: { id: recordId } }), "Task");
    return {
      task: await prisma.task.update({
        where: { id: recordId },
        data: { done: b.done },
      }),
    };
  }
  if (section === "leads") {
    if (recordId === "import" && method === "POST") {
      const form = await request.formData();
      const file = form.get("file");
      if (!file || typeof file === "string" || file.size > 5 * 1024 * 1024)
        fail(422, "file", "Choose a CSV or XLSX file under 5 MB.");
      let rows;
      if (/\.csv$/i.test(file.name))
        rows = parse(await file.text(), {
          columns: true,
          bom: true,
          skip_empty_lines: true,
          max_record_size: 50000,
        });
      else if (/\.xlsx$/i.test(file.name)) {
        const { default: readXlsx } = await import("read-excel-file/node");
        const data = await readXlsx(Buffer.from(await file.arrayBuffer()));
        rows = data
          .slice(1)
          .map((r) =>
            Object.fromEntries(data[0].map((h, i) => [String(h), r[i]])),
          );
      } else fail(422, "file", "Only CSV and XLSX files are supported.");
      let mapping;
      try {
        mapping = z
          .record(z.string(), z.string())
          .parse(JSON.parse(form.get("mapping") || "{}"));
      } catch {
        fail(422, "mapping", "Invalid column mapping.");
      }
      const result = await importLeads(rows, mapping, form.get("duplicates"));
      await audit(prisma, user.id, "leads.imported", "Lead", "import", result);
      return { ...result, source: `Import · ${file.name}` };
    }
    if (!recordId && method === "GET")
      return {
        leads: (
          await prisma.lead.findMany({
            orderBy: { createdAt: "desc" },
            take: 1000,
          })
        ).map(leadDTO),
      };
    if (!recordId && method === "POST") {
      const b = await body(request, leadSchema);
      const { notes, offer: _offer, runSiteCheck: _run, ...rest } = b;
      const l = await prisma.lead.create({
        data: { ...rest, message: b.message || notes },
      });
      return { lead: leadDTO(l) };
    }
    const l = required(
      await prisma.lead.findUnique({
        where: { id: recordId },
        include: {
          activities: { orderBy: { createdAt: "desc" } },
          proposals: true,
        },
      }),
      "Lead",
    );
    if (!action && method === "GET") return { lead: leadDTO(l) };
    if (!action && method === "DELETE") {
      if (user.role !== "owner")
        fail(403, "forbidden", "Only the owner can delete leads.");
      if (
        l.proposals.length ||
        (await prisma.client.findUnique({ where: { leadId: l.id } }))
      )
        fail(
          409,
          "in_use",
          "Archive this lead instead; it has proposals or a client.",
        );
      await prisma.$transaction([
        prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "lead.deleted",
            entity: "Lead",
            entityId: l.id,
          },
        }),
        prisma.lead.delete({ where: { id: l.id } }),
      ]);
      return new Response(null, { status: 204 });
    }
    if (action === "activities" && method === "POST") {
      const b = await body(
        request,
        z.object({
          kind: z.enum(["call", "email", "note"]),
          body: text.default(""),
          at: date.optional(),
          outcome: text.optional(),
          minutes: z.coerce.number().min(0).max(1440).optional(),
          direction: text.optional(),
          subject: text.optional(),
          nextAction: z
            .object({ type: text, date: date, owner: text })
            .optional(),
        }),
      );
      const a = await prisma.activity.create({
        data: {
          leadId: l.id,
          userId: user.id,
          type: b.kind,
          body: b.body,
          meta: b,
          createdAt: b.at ? new Date(b.at) : new Date(),
        },
      });
      return {
        activity: {
          id: a.id,
          kind: a.type,
          title: b.subject || b.outcome || b.kind,
          body: a.body,
          meta: `${today()} · ${user.name || user.email}`,
        },
      };
    }
    if (!action && method === "PATCH") {
      const b = await body(
        request,
        z.object({
          status: statuses.optional(),
          owner: text.optional(),
          notes: text.optional(),
          name: name.optional(),
          business: name.optional(),
          email: email.optional(),
          phone: text.optional(),
          siteUrl: text.optional(),
          nextAction: z
            .object({
              type: text,
              date: date,
              time: text.optional(),
              owner: text,
              note: text.optional(),
              remind: z.boolean().optional(),
            })
            .nullable()
            .optional(),
          lostReason: text.optional(),
          lostNote: text.optional(),
          recheckIn90Days: z.boolean().optional(),
          convert: z
            .object({
              monthly: z.boolean(),
              sendDeposit: z.boolean(),
              invitePortal: z.boolean(),
            })
            .optional(),
        }),
      );
      if (b.convert)
        fail(
          409,
          "proposal_required",
          "Create and sign a proposal to convert this lead with the correct billing and ownership terms.",
        );
      const allowed = Object.fromEntries(
        ["status", "owner", "name", "business", "email", "phone", "siteUrl"]
          .filter((k) => b[k] !== undefined)
          .map((k) => [k, b[k]]),
      );
      const result = await prisma.$transaction(async (db) => {
        const updated = await db.lead.update({
          where: { id: l.id },
          data: {
            ...allowed,
            ...(b.notes !== undefined ? { message: b.notes } : {}),
            ...(b.nextAction !== undefined
              ? {
                  nextActionAt: b.nextAction
                    ? new Date(b.nextAction.date)
                    : null,
                }
              : {}),
            data: { ...l.data, ...b },
          },
        });
        await db.activity.create({
          data: {
            leadId: l.id,
            userId: user.id,
            type: "updated",
            body: b.status ? `Status: ${b.status}` : "Lead updated",
          },
        });
        return updated;
      });
      return { lead: leadDTO(result) };
    }
  }
  if (section === "clients") {
    if (!recordId && method === "GET")
      return {
        clients: (await prisma.client.findMany({ include: clientInclude })).map(
          clientDTO,
        ),
      };
    const c = required(
      await prisma.client.findUnique({
        where: { id: recordId },
        include: clientInclude,
      }),
      "Client",
    );
    if (!action && method === "GET") return { client: clientDTO(c) };
    if (!action && method === "PATCH") {
      const b = await body(
        request,
        z.object({
          business: name.optional(),
          legalName: text.optional(),
          address: text.optional(),
          domain: text.optional(),
          owner: text.optional(),
          stage: z
            .enum(["In build", "Demo review", "Live", "Paused"])
            .optional(),
          notes: text.optional(),
          template: z.boolean().optional(),
          offerCode: id.optional(),
          monthly: z.boolean().optional(),
        }),
      );
      if (
        (b.offerCode && b.offerCode !== c.offerCode) ||
        (b.monthly !== undefined && b.monthly !== c.monthly)
      )
        fail(
          409,
          "billing_change",
          "Use a new proposal or the subscription controls to change the offer or plan.",
        );
      const updated = await prisma.$transaction(async (db) => {
        const r = await db.client.update({
          where: { id: c.id },
          data: {
            business: b.business || c.business,
            owner: b.owner || c.owner,
            data: { ...c.data, ...b },
          },
        });
        await audit(db, user.id, "client.updated", "Client", c.id);
        return r;
      });
      return { client: clientDTO({ ...c, ...updated }) };
    }
    if (action === "contacts" && method === "POST") {
      const b = await body(
        request,
        z.object({
          name,
          email,
          phone: text.default(""),
          role: text.default("member"),
          gets: z.array(text).optional(),
          invite: z.boolean().default(false),
        }),
      );
      const contact = await prisma.$transaction(async (db) => {
        const u = await db.user.upsert({
          where: { email: b.email },
          update: {},
          create: { email: b.email, name: b.name },
        });
        const existing = await db.contact.findUnique({
          where: { userId: u.id },
        });
        if (existing)
          fail(409, "conflict", "This account already has client access.");
        const x = await db.contact.create({
          data: {
            userId: u.id,
            clientId: c.id,
            email: b.email,
            name: b.name,
            phone: b.phone,
            role: "member",
          },
        });
        await audit(db, user.id, "contact.created", "Contact", x.id);
        return x;
      });
      if (b.invite)
        await queue(prisma, `contact-invite:${contact.id}`, "email", {
          to: contact.email,
          subject: "Your Klyvora portal",
          text: `Your portal access is ready. Request a secure sign-in link: ${process.env.NEXT_PUBLIC_APP_URL}/portal/signin`,
        });
      return {
        contact: {
          ...contact,
          primary: false,
          access: b.invite ? "Invited" : "Active",
          gets: b.gets || [],
        },
      };
    }
    if (action === "invite" && method === "POST") {
      const b = await body(
        request,
        z.object({
          contactId: id.optional(),
          email: email.optional(),
          can: z.array(text).optional(),
        }),
      );
      const ct = c.contacts.find(
        (x) => x.id === b.contactId || x.email === b.email,
      );
      if (!ct)
        fail(
          422,
          "contact",
          "Add the contact to this client before inviting them.",
        );
      await queue(prisma, `portal-invite:${ct.id}:${today()}`, "email", {
        to: ct.email,
        subject: "Your Klyvora portal",
        text: `Request your secure sign-in link: ${process.env.NEXT_PUBLIC_APP_URL}/portal/signin`,
      });
      return { invite: { email: ct.email, expiresInDays: 7 } };
    }
    if (action === "stripe" && subId === "connect" && method === "POST") {
      const b = await body(
        request,
        z.object({ delivery: z.enum(["email", "link"]).default("link") }),
      );
      if (!["WB", "BK", "EC", "RC", "RK"].includes(c.offerCode))
        fail(409, "not_needed", "This offer does not take customer payments.");
      const result = await connectClient(c);
      const to = c.contacts.find((x) => x.role === "signer")?.email;
      if (b.delivery === "email" && to)
        await queue(prisma, `connect:${c.id}:${Date.now()}`, "email", {
          to,
          subject: "Connect your own Stripe account",
          text: `Finish Stripe onboarding: ${result.onboardingUrl}`,
        });
      await audit(prisma, user.id, "stripe.connect_started", "Client", c.id);
      return {
        connect: { ...result, sentTo: b.delivery === "email" ? to : null },
      };
    }
  }
  if (section === "proposals") {
    if (!recordId && method === "GET")
      return {
        proposals: (
          await prisma.proposal.findMany({ orderBy: { createdAt: "desc" } })
        ).map(proposalDTO),
      };
    if (!recordId && method === "POST")
      return {
        proposal: await saveProposal(user, await body(request, proposalSchema)),
      };
    const p = required(
      await prisma.proposal.findUnique({ where: { id: recordId } }),
      "Proposal",
    );
    if (action === "send" && method === "POST") {
      await body(
        request,
        z.object({ to: email.optional(), note: text.optional() }).passthrough(),
      );
      return { proposal: await sendProposal(user, p.id) };
    }
    if (!action && method === "GET") return { proposal: proposalDTO(p) };
    if (!action && method === "PATCH")
      return {
        proposal: await saveProposal(
          user,
          await body(request, proposalSchema.partial()),
          p.id,
        ),
      };
    if (!action && method === "DELETE") {
      if (p.status !== "Draft")
        fail(409, "closed", "Only drafts can be deleted.");
      await prisma.$transaction([
        prisma.proposal.delete({ where: { id: p.id } }),
        prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "proposal.deleted",
            entity: "Proposal",
            entityId: p.id,
          },
        }),
      ]);
      return new Response(null, { status: 204 });
    }
  }
  if (section === "projects") {
    if (!recordId && method === "GET")
      return {
        projects: (
          await prisma.project.findMany({
            include: {
              client: { include: { subscriptions: true } },
              milestones: { include: { invoice: true } },
              tasks: true,
            },
          })
        ).map(projectDTO),
        team: (
          await prisma.user.findMany({
            where: { active: true, role: { in: ["owner", "builder"] } },
          })
        ).map((u) => ({
          id: u.id,
          name: u.name || u.email,
          initials: (u.name || u.email).slice(0, 2).toUpperCase(),
        })),
        today: today(),
      };
    const p = required(
      await prisma.project.findUnique({
        where: { id: recordId },
        include: {
          client: true,
          milestones: { include: { invoice: true } },
          tasks: true,
        },
      }),
      "Project",
    );
    if (!action && method === "GET") return { project: projectDTO(p) };
    if (!action && method === "PATCH") {
      const b = await body(
        request,
        z.object({
          stage: z.enum(["kickoff", "demo", "launch"]).optional(),
          owner: text.optional(),
          next: text.optional(),
          name: name.optional(),
        }),
      );
      if (b.stage === "launch")
        fail(
          409,
          "approval_required",
          "Launch begins when the client approves the demo.",
        );
      if (
        b.stage === "demo" &&
        p.milestones.find((m) => m.position === 0)?.invoice?.status !== "Paid"
      )
        fail(
          409,
          "payment_required",
          "The kickoff invoice must be paid first.",
        );
      return {
        project: projectDTO(
          await prisma.project.update({
            where: { id: p.id },
            data: {
              status: b.stage || p.status,
              name: b.name || p.name,
              data: { ...p.data, ...b },
            },
            include: { client: true, milestones: true, tasks: true },
          }),
        ),
      };
    }
    if (action === "milestones" && s[4] === "complete" && method === "POST") {
      const b = await body(
        request,
        z.object({ signatureName: text.optional() }).passthrough(),
      );
      const position = ["kickoff", "demo", "launch"].indexOf(subId);
      if (position < 1) fail(422, "milestone", "Select demo or launch.");
      return await completeMilestone(user, p.id, position, b.signatureName);
    }
    if (action === "tasks" && ["POST", "PATCH", "DELETE"].includes(method)) {
      if (method !== "POST") {
        const patchSchema = z.object({
          title: name.optional(),
          status: z.enum(["To do", "Doing", "Review", "Done"]).optional(),
          who: text.optional(),
          milestone: z.enum(["kickoff", "demo", "launch"]).optional(),
          due: date.nullish(),
          est: z.coerce.number().min(0).max(1000).optional(),
          blocked: z.boolean().optional(),
          desc: text.optional(),
          checklist: z
            .array(z.object({ id, text, done: z.boolean() }))
            .optional(),
          notify: z.boolean().optional(),
        });
        const b = await body(
          request,
          z.object({
            taskId: id,
            patch: patchSchema.optional(),
            logTime: z
              .object({
                hours: z.coerce.number().positive().max(24),
                who: text,
                what: text,
              })
              .optional(),
          }),
        );
        const task = required(
          await prisma.task.findFirst({
            where: { id: b.taskId, projectId: p.id },
          }),
          "Task",
        );
        if (method === "DELETE") {
          await prisma.task.delete({ where: { id: task.id } });
          return { deleted: true };
        }
        const patch = b.patch || {};
        const data = { ...task.data, ...patch };
        if (b.logTime) {
          const entry = await prisma.timeEntry.create({
            data: {
              projectId: p.id,
              userId: user.id,
              minutes: Math.round(b.logTime.hours * 60),
              note: b.logTime.what,
            },
          });
          data.time = [
            ...(task.data.time || []),
            {
              id: entry.id,
              what: entry.note,
              who: b.logTime.who,
              minutes: entry.minutes,
            },
          ];
        }
        const updated = await prisma.task.update({
          where: { id: task.id },
          data: {
            ...(patch.title ? { title: patch.title } : {}),
            ...(patch.status ? { done: patch.status === "Done" } : {}),
            ...(patch.who ? { assignee: patch.who } : {}),
            ...(patch.due ? { dueAt: new Date(patch.due) } : {}),
            data,
          },
        });
        return {
          task: {
            ...updated.data,
            id: updated.id,
            title: updated.title,
            status: updated.done ? "Done" : updated.data.status || "To do",
            who: updated.assignee,
            time: (updated.data.time || []).map((t) => ({
              ...t,
              hours: t.minutes / 60,
            })),
          },
        };
      }
      const b = await body(
        request,
        z
          .object({
            id: id.optional(),
            title: name.optional(),
            status: z.enum(["To do", "Doing", "Review", "Done"]).optional(),
            who: text.optional(),
            due: date.nullish(),
            clientTask: z.boolean().optional(),
            action: z.enum(["create", "update", "delete"]).optional(),
            task: jsonObject.optional(),
          })
          .passthrough(),
      );
      const values = b.task ? { ...b, ...b.task } : b;
      if (values.action === "delete") {
        const result = await prisma.task.deleteMany({
          where: { id: values.id, projectId: p.id },
        });
        if (!result.count) fail(404, "not_found", "Task not found.");
        return { deleted: true };
      }
      const data = {
        ...(values.title ? { title: values.title } : {}),
        ...(values.status ? { done: values.status === "Done" } : {}),
        ...(values.who ? { assignee: values.who } : {}),
        ...(values.due ? { dueAt: new Date(values.due) } : {}),
        ...(values.clientTask !== undefined
          ? { clientTask: values.clientTask }
          : {}),
        data: {
          status: values.status || "To do",
          milestone: ["kickoff", "demo", "launch"].includes(values.milestone)
            ? values.milestone
            : "kickoff",
          estMinutes: Math.round((Number(values.est) || 0) * 60),
          desc: String(values.desc || "").slice(0, 10000),
          checklist: [],
          time: [],
        },
      };
      let task;
      if (values.id) {
        required(
          await prisma.task.findFirst({
            where: { id: values.id, projectId: p.id },
          }),
          "Task",
        );
        task = await prisma.task.update({ where: { id: values.id }, data });
      } else {
        if (!data.title) fail(422, "title", "Enter a task title.");
        task = await prisma.task.create({ data: { ...data, projectId: p.id } });
      }
      return {
        task: {
          id: task.id,
          title: task.title,
          status: task.done ? "Done" : "To do",
          who: task.assignee,
          due: task.dueAt?.toISOString().slice(0, 10),
          checklist: [],
          time: [],
          est: 0,
          desc: "",
          milestone: "kickoff",
        },
      };
    }
    if (action === "time" && method === "POST") {
      const b = await body(
        request,
        z.object({
          minutes: z.number().int().min(1).max(1440),
          note: text.default(""),
        }),
      );
      return {
        entry: await prisma.timeEntry.create({
          data: { ...b, userId: user.id, projectId: p.id },
        }),
      };
    }
  }
  if (section === "tickets") {
    if (!recordId && method === "GET")
      return {
        tickets: (
          await prisma.ticket.findMany({
            include: { client: true, messages: true },
            orderBy: { updatedAt: "desc" },
          })
        ).map(ticketDTO),
        today: today(),
      };
    const ticket = required(
      await prisma.ticket.findUnique({
        where: { id: recordId },
        include: { client: true, messages: true },
      }),
      "Ticket",
    );
    if (!action && method === "GET") return { ticket: ticketDTO(ticket) };
    if (!action && method === "PATCH") {
      const b = await body(
        request,
        z.object({
          status: z
            .enum([
              "Open",
              "Waiting on client",
              "WaitingOnClient",
              "Resolved",
              "Closed",
              "In progress",
            ])
            .optional(),
          priority: z
            .enum(["Low", "Normal", "High", "Urgent", "Outage"])
            .optional(),
          owner: text.optional(),
          assigned: text.optional(),
          resolution: text.optional(),
          rootCause: text.optional(),
          askRating: z.boolean().optional(),
          addToKb: z.boolean().optional(),
        }),
      );
      return {
        ticket: ticketDTO(
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              status:
                b.status === "Closed" ? "Resolved" : b.status || ticket.status,
              priority: b.priority || ticket.priority,
              data: {
                ...ticket.data,
                ...b,
                owner: b.assigned || b.owner || ticket.data.owner || "",
              },
            },
            include: { client: true, messages: true },
          }),
        ),
      };
    }
    if (action === "messages" && method === "POST") {
      const b = await body(
        request,
        z
          .object({
            body: text.min(1).optional(),
            text: text.min(1).optional(),
            internal: z.boolean().default(false),
            kind: z.enum(["reply", "note"]).optional(),
            after: z
              .enum([
                "Open",
                "In progress",
                "Waiting on client",
                "Closed",
                "Keep status",
              ])
              .optional(),
          })
          .refine((b) => b.body || b.text, "Enter a message"),
      );
      const m = await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          userId: user.id,
          who: user.name || "Klyvora",
          text: b.body || b.text,
          internal: b.internal || b.kind === "note",
        },
      });
      if (b.after && b.after !== "Keep status" && !m.internal) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: b.after === "Closed" ? "Resolved" : b.after },
        });
      }
      if (!m.internal) {
        const ct = await prisma.contact.findFirst({
          where: { clientId: ticket.clientId, role: "signer" },
        });
        if (ct)
          await queue(prisma, `ticket-message:${m.id}`, "email", {
            to: ct.email,
            subject: `Update: ${ticket.subject}`,
            text: m.text,
          });
      }
      return {
        message: {
          id: m.id,
          who: m.who,
          body: m.text,
          text: m.text,
          when: today(),
          internal: m.internal,
        },
      };
    }
    if (action === "time" && method === "POST") {
      const b = await body(
        request,
        z
          .object({
            minutes: z.coerce.number().int().min(1).max(1440).optional(),
            hours: z.coerce.number().positive().max(24).optional(),
            note: text.optional(),
            what: text.optional(),
            who: text.optional(),
          })
          .refine((b) => b.minutes || b.hours, "Enter time"),
      );
      const t = await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          minutes: { increment: b.minutes || Math.round(b.hours * 60) },
          data: {
            ...ticket.data,
            time: [
              ...(ticket.data.time || []),
              {
                id: crypto.randomUUID(),
                on: today(),
                minutes: b.minutes || Math.round(b.hours * 60),
                who: b.who || user.name || user.email,
                what: b.what || b.note || "Support",
              },
            ],
          },
        },
        include: { client: true, messages: true },
      });
      return { ticket: ticketDTO(t) };
    }
  }
  if (section === "reports") {
    const m = await metrics();
    const leads = await prisma.lead.findMany();
    if (recordId === "funnel")
      return {
        months: [
          {
            month: today().slice(0, 7),
            contacts: leads.filter((l) => l.status !== "New").length,
            demos: leads.filter((l) =>
              ["Demo booked", "Proposal sent", "Signed"].includes(l.status),
            ).length,
            closed: leads.filter((l) => l.status === "Signed").length,
          },
        ],
      };
    if (recordId === "revenue-by-offer")
      return {
        offers: await prisma.proposal
          .groupBy({
            by: ["offerCode"],
            where: { status: "Accepted" },
            _sum: { setupCents: true },
          })
          .then((rows) =>
            rows.map((r) => ({
              offerCode: r.offerCode,
              revenue: (r._sum.setupCents || 0) / 100,
            })),
          ),
      };
    if (recordId === "export")
      return new Response(
        csv([
          ["Signed", "Cash collected", "MRR"],
          [m.signed, m.cash, m.mrr],
        ]),
        {
          headers: {
            "content-type": "text/csv",
            "content-disposition": "attachment; filename=reports.csv",
          },
        },
      );
    return reports(Object.fromEntries(new URL(request.url).searchParams));
  }
  return null;
}
