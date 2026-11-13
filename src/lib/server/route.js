import "server-only";
import { z, ZodError } from "zod";
import { after } from "next/server";
import { cacheTag, cacheLife } from "next/cache";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  body,
  email,
  name,
  text,
  id,
  errorResponse,
  ApiError,
  fail,
  checkOrigin,
  rateLimit,
  ip,
  audit,
  queue,
} from "./http";
import { requireUser } from "./access";
import { catalog } from "./data";
import { admin } from "./admin";
import { billing } from "./billing";
import { settings } from "./settings";
import { publicProposal, acceptProposal, priceProposal } from "./proposals";
import { stripeWebhook } from "./webhooks";
import { runJobs } from "./jobs";
import { portal } from "./portal";
import { business } from "./business";
import { outreach } from "./outreach";

async function cachedCatalog() {
  "use cache";
  cacheTag("offers");
  cacheLife({ stale: 0, revalidate: 60, expire: 300 });
  return catalog();
}
export async function dispatch(request) {
  try {
    const s = new URL(request.url).pathname
      .slice(5)
      .split("/")
      .filter(Boolean)
      .map(decodeURIComponent);
    const method = request.method;
    if (s[0] === "stripe" && s[1] === "webhook" && method === "POST")
      return Response.json(await stripeWebhook(request));
    checkOrigin(request);
    let data;
    if (s[0] === "jobs" && ["GET", "POST"].includes(method)) {
      if (
        !process.env.CRON_SECRET ||
        request.headers.get("authorization") !==
          `Bearer ${process.env.CRON_SECRET}`
      )
        fail(401, "unauthenticated", "Not authorized.");
      data = { jobs: await runJobs() };
    } else if (s[0] === "health" && method === "GET") {
      await prisma.$queryRaw`SELECT 1`;
      data = { status: "ok", service: "klyvora", backend: true };
    } else if (s[0] === "offers" && method === "GET")
      data = { offers: await cachedCatalog() };
    else if (s[0] === "leads" && method === "POST") {
      await rateLimit(request, "leads", 5, 600000);
      const b = await body(
        request,
        z.object({
          name,
          business: text.default(""),
          email,
          phone: text.max(50).default(""),
          siteUrl: text.max(2048).default(""),
          message: text.min(10),
          source: text.max(100).default("Website"),
          offerCode: id.nullish(),
          company_website: text.optional(),
          estimate: z.json().optional(),
          quote: z
            .object({
              offerCode: id,
              monthlyPlan: z.boolean(),
              addOns: z
                .array(
                  z.object({
                    code: id,
                    quantity: z.number().int().min(1).max(10),
                  }),
                )
                .max(10),
            })
            .optional(),
          report: z
            .object({
              url: text.max(2048),
              finalUrl: text.max(2048).nullable().optional(),
              status: z.number().int().min(0).max(599),
              verdict: text.max(50).optional(),
              loadMs: z.number().nonnegative().nullable().optional(),
              redirected: z.boolean().optional(),
              mobileFriendly: z.boolean().nullable().optional(),
              hasBooking: z.boolean().nullable().optional(),
              findings: z
                .array(
                  z.object({
                    id: text.max(50),
                    label: text.max(200),
                    pass: z.boolean(),
                    result: text.max(1000),
                    why: text.max(1000),
                  }),
                )
                .max(20)
                .optional(),
            })
            .optional(),
          meta: z.object({ firstSite: z.boolean() }).optional(),
        }),
      );
      if (b.company_website)
        return Response.json({ id: "received" }, { status: 201 });
      if (
        b.offerCode &&
        !(await prisma.offer.findUnique({ where: { code: b.offerCode } }))
      )
        fail(422, "offer", "Unknown offer.");
      let quote;
      if (b.quote) {
        if (b.quote.offerCode !== b.offerCode)
          fail(422, "offer", "The selected offer does not match the estimate.");
        const addOns = Object.fromEntries(
          b.quote.addOns.map((a) => [a.code, a.quantity]),
        );
        const price = await priceProposal(prisma, {
          offerCode: b.offerCode,
          monthly: b.quote.monthlyPlan,
          addOns,
        });
        quote = {
          offerCode: b.offerCode,
          monthlyPlan: b.quote.monthlyPlan,
          setupCents: price.setup,
          monthlyCents: b.quote.monthlyPlan ? price.monthly : 0,
          addOns,
        };
      }
      const l = await prisma.$transaction(async (db) => {
        const l = await db.lead.create({
          data: {
            name: b.name,
            business: b.business || b.name,
            email: b.email,
            phone: b.phone,
            siteUrl: b.siteUrl,
            message: b.message,
            source: b.source,
            offerCode: b.offerCode || null,
            data: {
              ...(quote ? { quote } : {}),
              ...(b.report
                ? { siteCheck: { ...b.report, clientReported: true } }
                : {}),
              ...(b.meta ? { firstSite: b.meta.firstSite } : {}),
            },
          },
        });
        await db.activity.create({
          data: {
            leadId: l.id,
            type: "created",
            body: "Website inquiry received",
          },
        });
        await queue(db, `lead-confirmation:${l.id}`, "email", {
          to: l.email,
          subject: "We received your Klyvora request",
          text: `Thanks for getting in touch, ${l.name}. We received your request and will reply shortly.`,
        });
        const to =
          process.env.LEAD_NOTIFICATION_EMAIL || process.env.OWNER_EMAIL;
        if (to)
          await queue(db, `lead-notification:${l.id}`, "email", {
            to,
            subject: `New inquiry: ${l.business}`,
            text: `A new inquiry is waiting in your lead inbox: ${process.env.NEXT_PUBLIC_APP_URL}/admin/leads/${l.id}`,
          });
        return l;
      });
      data = { id: l.id };
    } else if (s[0] === "auth" && ["admin", "portal"].includes(s[1])) {
      await rateLimit(request, `login:${s[1]}`, 5, 600000);
      if (method !== "POST") fail(405, "method", "Method not allowed.");
      if (!["link", "signin", "reset", "invite", "code"].includes(s[2]))
        fail(404, "not_found", "Unknown endpoint.");
      if (["code", "invite"].includes(s[2]))
        fail(410, "magic_link", "Use a secure email sign-in link instead.");
      const b = await body(
        request,
        z.object({ email, next: text.optional() }).passthrough(),
      );
      const u = await prisma.user.findUnique({
        where: { email: b.email },
        include: { contact: true },
      });
      if (
        u?.active &&
        (s[1] === "admin" ? ["owner", "builder"].includes(u.role) : !!u.contact)
      ) {
        await signIn("nodemailer", {
          email: b.email,
          redirect: false,
          redirectTo: s[1] === "admin" ? "/admin" : "/portal",
        });
      }
      data = { sent: true };
    } else if (s[0] === "p") {
      await rateLimit(request, "proposal", 60);
      if (!s[1]) fail(404, "not_found", "Proposal not found.");
      if (!s[2] && method === "GET")
        data = { proposal: await publicProposal(s[1]) };
      else if (s[2] === "accept" && method === "POST")
        data = await acceptProposal(
          s[1],
          await body(
            request,
            z.object({ signatureName: name.min(3), monthly: z.boolean() }),
          ),
          ip(request),
        );
      else if (s[2] === "decline" && method === "POST") {
        const b = await body(request, z.object({ reason: text.default("") }));
        const p = await prisma.proposal.findFirst({
          where: {
            token: s[1],
            status: { in: ["Sent", "Viewed"] },
            validUntil: { gt: new Date() },
          },
        });
        if (!p) fail(409, "closed", "This proposal is no longer open.");
        await prisma.$transaction(async (db) => {
          const r = await db.proposal.updateMany({
            where: { id: p.id, status: { in: ["Sent", "Viewed"] } },
            data: {
              status: "Declined",
              data: { ...p.data, declinedReason: b.reason },
            },
          });
          if (!r.count) fail(409, "closed", "This proposal is already closed.");
          await audit(db, null, "proposal.declined", "Proposal", p.id);
        });
        data = { status: "Declined" };
      }
    } else if (s[0] === "admin") {
      const user = await requireUser("admin", s[1] === "settings");
      data =
        s[1] === "settings"
          ? await settings(request, s.slice(1), user)
          : s[1] === "outreach"
            ? await outreach(request, s.slice(2), user)
            : ["invoices", "subscriptions"].includes(s[1])
              ? await billing(request, s.slice(1), user)
              : await admin(request, s.slice(1), user);
    } else if (s[0] === "portal")
      data = await portal(request, s.slice(1), await requireUser("portal"));
    else if (s[0] === "app")
      data = await business(request, s.slice(1), await requireUser("portal"));
    if (data == null)
      fail(405, "method", "This endpoint or method is not supported.");
    if (
      !["GET", "HEAD"].includes(method) &&
      s[0] !== "jobs" &&
      process.env.AUTO_PROCESS_JOBS !== "false"
    ) {
      after(async () => {
        await runJobs(2);
      });
    }
    if (data instanceof Response) return data;
    return Response.json(data, {
      status: s[0] === "leads" && method === "POST" ? 201 : 200,
      headers: {
        "cache-control":
          s[0] === "offers"
            ? "public, max-age=0, must-revalidate"
            : "private, no-store",
      },
    });
  } catch (e) {
    if (e instanceof ZodError)
      e = new ApiError(
        422,
        "invalid",
        "Fix the highlighted fields.",
        Object.fromEntries(e.issues.map((i) => [i.path.join("."), i.message])),
      );
    return errorResponse(e);
  }
}
export const GET = dispatch,
  POST = dispatch,
  PUT = dispatch,
  PATCH = dispatch,
  DELETE = dispatch;
