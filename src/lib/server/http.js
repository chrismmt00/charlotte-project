import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
export function fail(status, code, message) {
  throw new ApiError(status, code, message);
}
export function required(value, label = "Record") {
  if (!value) fail(404, "not_found", `${label} not found.`);
  return value;
}
export async function body(request, schema) {
  if (Number(request.headers.get("content-length") || 0) > 1_000_000)
    fail(413, "too_large", "Request is too large.");
  let json;
  try {
    const text = await request.text();
    if (text.length > 1_000_000)
      fail(413, "too_large", "Request is too large.");
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    if (e instanceof ApiError) throw e;
    fail(400, "bad_json", "Send a JSON object.");
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const fields = Object.fromEntries(
      result.error.issues.map((i) => [i.path.join("."), i.message]),
    );
    throw new ApiError(422, "invalid", "Fix the highlighted fields.", fields);
  }
  return result.data;
}
export function errorResponse(e) {
  if (e instanceof ApiError)
    return Response.json(
      {
        error: {
          code: e.code,
          message: e.message,
          ...(e.fields ? { fields: e.fields } : {}),
        },
        ...(e.fields ? { fields: e.fields } : {}),
      },
      { status: e.status },
    );
  if (e?.code === "P2025")
    return Response.json(
      { error: { code: "not_found", message: "Record not found." } },
      { status: 404 },
    );
  if (e?.code === "P2002")
    return Response.json(
      { error: { code: "conflict", message: "This record already exists." } },
      { status: 409 },
    );
  // Provider exceptions and Prisma errors can contain credentials or personal data. Do not log them.
  console.error("Backend request failed", {
    type: e?.constructor?.name,
    code: /^[A-Z0-9_]+$/.test(e?.code || "") ? e.code : undefined,
  });
  return Response.json(
    {
      error: {
        code: "unavailable",
        message: "This action could not be completed. Please try again.",
      },
    },
    { status: 503 },
  );
}
export function checkOrigin(request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  const expected = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (
    origin &&
    origin !== new URL(request.url).origin &&
    (!expected || origin !== new URL(expected).origin)
  )
    fail(403, "origin", "Request origin is not allowed.");
}
export function ip(request) {
  return (
    (process.env.VERCEL
      ? request.headers.get("x-vercel-forwarded-for")
      : request.headers.get("x-forwarded-for")
    )
      ?.split(",")[0]
      ?.trim() || "local"
  );
}
export async function rateLimit(
  request,
  bucket,
  limit = 10,
  windowMs = 60_000,
) {
  const now = new Date();
  const key = createHash("sha256")
    .update(`${bucket}:${ip(request)}`)
    .digest("hex");
  const expires = new Date(now.getTime() + windowMs);
  const rows = await prisma.$queryRaw`
    INSERT INTO "RateLimit" ("key","count","expiresAt") VALUES (${key},1,${expires})
    ON CONFLICT ("key") DO UPDATE SET
    "count" = CASE WHEN "RateLimit"."expiresAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
    "expiresAt" = CASE WHEN "RateLimit"."expiresAt" < ${now} THEN ${expires} ELSE "RateLimit"."expiresAt" END
    RETURNING "count"`;
  if (rows[0].count > limit)
    fail(429, "rate_limited", "Too many requests. Try again shortly.");
}
export const text = z.string().trim().max(10000);
export const name = text.min(1).max(200);
export const email = z.string().trim().toLowerCase().email().max(254);
export const id = z.string().min(1).max(200);
export const jsonObject = z.record(z.string().max(100), z.json());
export const date = z
  .string()
  .refine((s) => Number.isFinite(Date.parse(s)), "Enter a valid date");
export const money = z
  .number()
  .finite()
  .nonnegative()
  .max(1_000_000)
  .refine(
    (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.00001,
    "Use at most two decimal places",
  );
export const cents = (n) => Math.round(n * 100);
export const audit = (db, userId, action, entity, entityId, meta = {}) =>
  db.auditLog.create({
    data: { userId: userId || null, action, entity, entityId, meta },
  });
export const queue = (db, key, type, payload) => {
  const prefix = key.split(":")[0];
  const template = {
    "lead-confirmation": "lead-confirmation",
    "lead-notification": "lead-received",
    "proposal-sent": "proposal",
    "proposal-accepted": "proposal-accepted",
    "ticket-message": "ticket-update",
    support: "ticket-update",
    launch: "launch",
    review: "review",
  }[prefix];
  return db.job.upsert({
    where: { key },
    update: {},
    create: {
      key,
      type,
      payload:
        type === "email" && template ? { ...payload, template } : payload,
    },
  });
};
export const csv = (rows) =>
  rows
    .map((row) =>
      row
        .map(
          (v) =>
            '"' +
            String(v ?? "")
              .replace(/^[=+@\-\t\r]/, "'$&")
              .replaceAll('"', '""') +
            '"',
        )
        .join(","),
    )
    .join("\r\n");
