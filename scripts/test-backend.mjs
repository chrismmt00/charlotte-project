import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { prisma } from "../src/lib/prisma.js";

// This test creates and removes isolated fixtures only in the local database.
assert.ok(
  ["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL).hostname,
  ),
  "Tests require local PostgreSQL",
);
const tag = `backend-test-${randomUUID()}`;
const eventId = `evt_${tag}`;
const base = "http://localhost:3438";
const ownerToken = randomUUID(),
  contactToken = randomUUID(),
  foreignToken = randomUUID();
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3438",
  ],
  {
    env: {
      ...process.env,
      NODE_ENV: "production",
      AUTH_URL: base,
      AUTO_PROCESS_JOBS: "false",
      NEXT_PUBLIC_APP_URL: base,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverLog = "";
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (d) => {
    serverLog = (serverLog + d.toString()).slice(-30000);
  });
let checks = 0,
  leadId,
  proposalId,
  clientId,
  foreignId,
  projectId,
  ownerId;
const userIds = [],
  invoiceIds = [];
async function request(
  path,
  { method = "GET", body, token, status = 200, headers = {} } = {},
) {
  const r = await fetch(base + path, {
    method,
    redirect: "manual",
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { cookie: `authjs.session-token=${token}` } : {}),
      "x-forwarded-for": tag,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await r.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }
  assert.equal(
    r.status,
    status,
    `${method} ${path}: expected ${status}, got ${r.status}; ${typeof data === "object" ? JSON.stringify(data) : raw.slice(0, 200)}`,
  );
  checks++;
  return data;
}
async function session(userId, token) {
  await prisma.session.create({
    data: {
      userId,
      sessionToken: token,
      expires: new Date(Date.now() + 3600000),
    },
  });
}
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base + "/api/offers")).ok) break;
    } catch {}
    if (i === 59) throw new Error("Test server did not start");
    await new Promise((r) => setTimeout(r, 500));
  }
  const owner = await prisma.user.create({
    data: {
      email: `${tag}@example.invalid`,
      name: "Backend Test Owner",
      role: "owner",
    },
  });
  ownerId = owner.id;
  userIds.push(owner.id);
  await session(owner.id, ownerToken);
  const rawToken = randomUUID();
  await prisma.verificationToken.create({
    data: {
      identifier: owner.email,
      token: createHash("sha256")
        .update(rawToken + process.env.AUTH_SECRET)
        .digest("hex"),
      expires: new Date(Date.now() + 60000),
    },
  });
  const callback = `/api/auth/callback/nodemailer?token=${rawToken}&email=${encodeURIComponent(owner.email)}&callbackUrl=${encodeURIComponent(base + "/admin")}`;
  await request(callback, { status: 302 });
  assert.equal(await prisma.session.count({ where: { userId: owner.id } }), 2);
  await request(callback, { status: 302 });
  assert.equal(await prisma.session.count({ where: { userId: owner.id } }), 2);
  for (const route of [
    "leads",
    "clients",
    "proposals",
    "projects",
    "invoices",
    "subscriptions",
    "tickets",
    "metrics",
    "settings",
    "outreach",
    "reports",
  ])
    await request(`/api/admin/${route}`, { status: 401 });
  await request("/api/portal/project", { status: 401 });
  await request("/api/app/business", { status: 401 });
  const offer = await request("/api/offers");
  assert.equal(offer.offers.filter((o) => !o.addOnOf).length, 10);
  await request("/api/leads", { method: "POST", body: {}, status: 422 });
  const captured = await request("/api/leads", {
    method: "POST",
    body: {
      name: "Test Contact",
      business: tag,
      email: `${tag}-client@example.invalid`,
      message: "Please quote a website for this test business.",
      source: "Backend test",
    },
    status: 201,
  });
  leadId = captured.id;
  assert.ok(await prisma.lead.findUnique({ where: { id: leadId } }));
  await request("/api/admin/leads", { token: ownerToken });
  await request(`/api/admin/leads/${leadId}`, {
    method: "PATCH",
    body: { status: "Contacted" },
    token: ownerToken,
  });
  await request(`/api/admin/leads/${leadId}/activities`, {
    method: "POST",
    body: { kind: "note", body: "Test follow-up" },
    token: ownerToken,
  });
  await request("/api/admin/proposals", {
    method: "POST",
    token: ownerToken,
    body: {
      name: "Invalid restaurant proposal",
      leadId,
      offerCode: "RC",
      monthly: false,
    },
    status: 422,
  });
  const made = await request("/api/admin/proposals", {
    method: "POST",
    token: ownerToken,
    body: {
      name: tag,
      leadId,
      offerCode: "WB",
      monthly: true,
      caps: {
        pages: "5 pages",
        rounds: "2 rounds",
        integrations: "1 integration",
        hosting: "1 GB",
        support: "1 hour per month",
        changes: "2 minor changes per month",
      },
    },
  });
  proposalId = made.proposal.id;
  await request(`/api/p/${made.proposal.token}`, { status: 404 });
  await request(`/api/admin/proposals/${proposalId}/send`, {
    method: "POST",
    body: {},
    token: ownerToken,
  });
  const sent = await request(`/api/p/${made.proposal.token}`);
  assert.ok(sent.proposal.terms);
  assert.equal(sent.proposal.setup, 999);
  await request(`/api/p/${made.proposal.token}/accept`, {
    method: "POST",
    body: { signatureName: "x", monthly: true },
    status: 422,
  });
  await Promise.all(
    [1, 2].map(() =>
      request(`/api/p/${made.proposal.token}/accept`, {
        method: "POST",
        body: { signatureName: "Test Contact", monthly: true },
      }),
    ),
  );
  const accepted = await prisma.proposal.findUnique({
    where: { id: proposalId },
  });
  clientId = accepted.clientId;
  assert.equal(await prisma.project.count({ where: { proposalId } }), 1);
  const project = await prisma.project.findUnique({
    where: { proposalId },
    include: { milestones: true },
  });
  projectId = project.id;
  assert.equal(
    project.milestones.reduce((n, m) => n + m.amountCents, 0),
    99900,
  );
  const contact = await prisma.contact.findFirst({ where: { clientId } });
  userIds.push(contact.userId);
  await session(contact.userId, contactToken);
  const foreign = await prisma.client.create({
    data: { business: tag + "-foreign", offerCode: "W1" },
  });
  foreignId = foreign.id;
  const stranger = await prisma.user.create({
    data: { email: `${tag}-foreign@example.invalid`, name: "Other Client" },
  });
  userIds.push(stranger.id);
  await prisma.contact.create({
    data: {
      clientId: foreignId,
      userId: stranger.id,
      name: "Other Client",
      email: stranger.email,
      role: "signer",
    },
  });
  await session(stranger.id, foreignToken);
  await request("/api/admin/leads", { token: contactToken, status: 403 });
  const invoices = await prisma.invoice.findMany({ where: { clientId } });
  invoiceIds.push(...invoices.map((i) => i.id));
  assert.equal(invoices.length, 1);
  await request(`/api/portal/invoices/${invoices[0].id}/pay`, {
    method: "POST",
    body: { method: "card" },
    token: foreignToken,
    status: 404,
  });
  await request(`/api/portal/invoices/${invoices[0].id}/pay`, {
    method: "POST",
    body: { method: "card" },
    token: contactToken,
    status: 409,
  });
  await request("/api/portal/project/approve-demo", {
    method: "POST",
    body: {},
    token: contactToken,
    status: 409,
  });
  await request(`/api/admin/invoices/${invoices[0].id}/payments`, {
    method: "POST",
    body: { kind: "manual", amount: 499.5, method: "Bank transfer" },
    token: ownerToken,
  });
  await request(`/api/admin/projects/${projectId}`, {
    method: "PATCH",
    body: { stage: "demo" },
    token: ownerToken,
  });
  const demo = await request("/api/portal/project/approve-demo", {
    method: "POST",
    body: {},
    token: contactToken,
  });
  invoiceIds.push(demo.invoice.id);
  assert.equal(demo.invoice.amount, 299.7);
  await request(`/api/admin/invoices/${demo.invoice.id}/payments`, {
    method: "POST",
    body: { kind: "manual", amount: 299.7, method: "Bank transfer" },
    token: ownerToken,
  });
  const launch = await request("/api/portal/project/sign-off", {
    method: "POST",
    body: { signatureName: "Test Contact" },
    token: contactToken,
  });
  invoiceIds.push(launch.invoice.id);
  assert.equal(launch.invoice.amount, 199.8);
  const snap = await request("/api/portal/project", { token: contactToken });
  assert.equal(snap.project.stage, "accepted");
  assert.equal(snap.invoices.length, 3);
  assert.equal(
    snap.invoices.find((i) => i.id === launch.invoice.id).status,
    "not-yet",
  );
  const support = await request("/api/portal/tickets", {
    method: "POST",
    body: { subject: tag + " support", message: "Please help with this test." },
    token: contactToken,
  });
  await request(`/api/admin/tickets/${support.ticket.id}/messages`, {
    method: "POST",
    body: { body: "Private internal note", internal: true },
    token: ownerToken,
  });
  const tickets = await request("/api/portal/tickets", { token: contactToken });
  assert.ok(!JSON.stringify(tickets).includes("Private internal note"));
  await request("/api/portal/tickets", {
    method: "POST",
    body: { ticketId: support.ticket.id, message: "Cross-client attempt" },
    token: foreignToken,
    status: 404,
  });
  const task = await request(`/api/admin/projects/${projectId}/tasks`, {
    method: "POST",
    body: { title: "Test task", who: "Owner" },
    token: ownerToken,
  });
  await request(`/api/admin/projects/${projectId}/tasks`, {
    method: "PATCH",
    body: { taskId: task.task.id, patch: { status: "Done" } },
    token: ownerToken,
  });
  await request("/api/app/catalog/items", {
    method: "POST",
    body: {
      name: "Test service",
      price: "25.50",
      group: "General",
      visible: true,
    },
    token: contactToken,
  });
  const catalog = await request("/api/app/catalog", { token: contactToken });
  assert.equal(catalog.items.length, 1);
  assert.equal(catalog.items[0].price, "$25.50");
  const otherCatalog = await request("/api/app/catalog", {
    token: foreignToken,
  });
  assert.equal(otherCatalog.items.length, 0);
  await request("/api/admin/settings", { token: contactToken, status: 403 });
  await request("/api/admin/reports", { token: ownerToken });
  const m = await request("/api/admin/metrics", { token: ownerToken });
  assert.ok(m.signed >= 999);
  assert.ok(m.cash >= 799.2);
  assert.equal(
    (await prisma.subscription.findUnique({ where: { projectId } })).status,
    "pending",
  );
  await request("/api/admin/leads", {
    method: "POST",
    body: {},
    token: ownerToken,
    headers: { origin: "https://unrelated.example" },
    status: 403,
  });
  await request("/api/site-check", {
    method: "POST",
    body: { url: "http://127.0.0.1" },
    status: 400,
  });
  await request("/api/site-check", {
    method: "POST",
    body: { url: "http://[::ffff:127.0.0.1]" },
    status: 400,
  });
  await request("/api/stripe/webhook", {
    method: "POST",
    body: {},
    status: 400,
  });
  const { default: Stripe } = await import("stripe");
  const event = {
    id: eventId,
    object: "event",
    created: Math.floor(Date.now() / 1000),
    type: "test.integration",
    data: { object: { id: "local-only" } },
  };
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload: JSON.stringify(event),
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  for (let i = 0; i < 2; i++)
    await request("/api/stripe/webhook", {
      method: "POST",
      body: event,
      headers: { "stripe-signature": signature },
    });
  assert.equal(await prisma.webhookEvent.count({ where: { id: eventId } }), 1);
  if (process.argv.includes("--browser")) {
    const { chromium } = await import("@playwright/test");
    const browser = await chromium.launch({
      channel: "msedge",
      headless: true,
    });
    try {
      const context = await browser.newContext();
      await context.addCookies([
        { name: "authjs.session-token", value: ownerToken, url: base },
      ]);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      for (const route of [
        "/admin",
        "/admin/leads",
        "/admin/clients",
        "/admin/proposals",
        "/admin/projects",
        "/admin/invoices",
        "/admin/subscriptions",
        "/admin/support",
        "/admin/settings",
        "/admin/reports",
        "/admin/outreach",
        `/admin/leads/${leadId}`,
        `/admin/clients/${clientId}`,
        `/admin/support/${support.ticket.id}`,
      ]) {
        await page.goto(base + route);
        await page.waitForTimeout(600);
        assert.ok(
          !/Something went wrong|Application error/i.test(
            await page.locator("body").innerText(),
          ),
          route,
        );
        assert.equal(errors.length, 0, route + ": " + errors.join("; "));
        checks++;
      }
      await context.addCookies([
        { name: "authjs.session-token", value: contactToken, url: base },
      ]);
      for (const route of [
        "/portal",
        "/portal/project",
        "/portal/invoices",
        "/portal/support",
        "/portal/account",
        "/app",
        "/app/bookings",
        "/app/catalog",
        "/app/customers",
        "/app/payments",
        "/app/site",
        "/app/plan",
      ]) {
        await page.goto(base + route);
        await page.waitForTimeout(700);
        assert.equal(errors.length, 0, route + ": " + errors.join("; "));
        assert.ok(
          !(await page.locator("body").innerText()).includes("could not load"),
          route,
        );
        checks++;
      }
      await context.clearCookies();
      await page.goto(base + `/p/${made.proposal.token}`);
      await page.waitForTimeout(700);
      assert.equal(errors.length, 0);
      checks++;
      await page.goto(base + "/contact");
      await page.waitForTimeout(400);
      assert.equal(errors.length, 0);
      checks++;
    } finally {
      await browser.close();
    }
  }
  console.log(
    `PASS: ${checks} backend and browser checks; local fixtures cleaned up.`,
  );
} catch (e) {
  console.error("FAIL:", e.message);
  if (serverLog.includes("Backend request failed"))
    console.error(
      serverLog
        .split("\n")
        .filter((l) => l.includes("Backend request failed"))
        .join("\n"),
    );
  process.exitCode = 1;
} finally {
  if (proposalId && !clientId)
    clientId = (await prisma.proposal.findUnique({ where: { id: proposalId } }))
      ?.clientId;
  const clients = [clientId, foreignId].filter(Boolean);
  const projects = await prisma.project.findMany({
    where: { clientId: { in: clients } },
    select: { id: true },
  });
  const projectIds = projects.map((p) => p.id);
  const invs = await prisma.invoice.findMany({
    where: { clientId: { in: clients } },
    select: { id: true },
  });
  invoiceIds.push(...invs.map((i) => i.id));
  const subs = await prisma.subscription.findMany({
    where: { clientId: { in: clients } },
    select: { id: true },
  });
  await prisma.job.deleteMany({
    where: {
      OR: [
        ...invoiceIds.map((id) => ({ payload: { path: ["id"], equals: id } })),
        ...subs.map((s) => ({ payload: { path: ["id"], equals: s.id } })),
        { payload: { path: ["to"], string_contains: tag } },
        { payload: { path: ["subject"], string_contains: tag } },
        ...(leadId ? [{ key: { contains: leadId } }] : []),
        ...(proposalId ? [{ key: { contains: proposalId } }] : []),
      ],
    },
  });
  await prisma.invoice.deleteMany({ where: { clientId: { in: clients } } });
  await prisma.subscription.deleteMany({
    where: { clientId: { in: clients } },
  });
  await prisma.timeEntry.deleteMany({
    where: { projectId: { in: projectIds } },
  });
  await prisma.task.deleteMany({ where: { projectId: { in: projectIds } } });
  await prisma.milestone.deleteMany({
    where: { projectId: { in: projectIds } },
  });
  await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
  if (proposalId)
    await prisma.proposal.deleteMany({ where: { id: proposalId } });
  await prisma.ticketMessage.deleteMany({
    where: { ticket: { clientId: { in: clients } } },
  });
  await prisma.ticket.deleteMany({ where: { clientId: { in: clients } } });
  for (const model of [
    "contact",
    "catalogItem",
    "customer",
    "booking",
    "file",
    "workspace",
  ])
    await prisma[model].deleteMany({ where: { clientId: { in: clients } } });
  await prisma.client.deleteMany({ where: { id: { in: clients } } });
  if (leadId) await prisma.lead.deleteMany({ where: { id: leadId } });
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        {
          entityId: {
            in: [
              ...invoiceIds,
              ...projectIds,
              ...(proposalId ? [proposalId] : []),
            ],
          },
        },
      ],
    },
  });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.webhookEvent.deleteMany({ where: { id: eventId } });
  server.kill();
  await Promise.race([
    once(server, "exit"),
    new Promise((r) => setTimeout(r, 2000)),
  ]);
  await prisma.$disconnect();
}
