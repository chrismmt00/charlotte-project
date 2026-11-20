import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";
import { prisma } from "../src/lib/prisma.js";
import {
  INDUSTRIES,
  CUSTOM_SERVICES,
  PUBLIC_PAGES,
  money,
  setupPrice,
  LAUNCH_OFFER,
} from "../src/lib/marketing/catalog.js";
import { MARKETING_REDIRECTS } from "../src/lib/marketing/redirects.js";

assert.ok(
  ["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL).hostname,
  ),
  "Use local PostgreSQL only",
);
const base = "http://localhost:3441",
  tag = `marketing-test-${randomUUID()}`;
const email = `${tag}@example.invalid`;
const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
async function auditAccessibility(page, label) {
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
    return result.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    );
  });
  check(
    violations.length === 0,
    `${label} accessibility: ${violations.join("; ")}`,
  );
}
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3441",
  ],
  {
    env: {
      ...process.env,
      NODE_ENV: "production",
      AUTH_URL: base,
      NEXT_PUBLIC_APP_URL: base,
      AUTO_PROCESS_JOBS: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "",
  checks = 0,
  browser;
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (value) => {
    logs = (logs + value.toString()).slice(-6000);
  });
const check = (value, message) => {
  assert.ok(value, message);
  checks++;
};
const post = (payload, headers = {}) =>
  fetch(`${base}/api/quote`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": tag,
      ...headers,
    },
    body: JSON.stringify(payload),
  });
const valid = {
  name: "Marketing QA",
  business: tag,
  email,
  industry: "Beauty & Wellness",
  service: "beauty",
  phone: "",
  siteUrl: "https://example.invalid",
  equipment: "Existing check-in tablet and supported payment provider",
  message: "Please review our website and appointment workflow.",
  company_website: "",
};
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base + "/api/offers")).ok) break;
    } catch {}
    if (i === 59) throw new Error("Marketing server did not start");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    extraHTTPHeaders: { "x-forwarded-for": tag },
  });
  const page = await context.newPage(),
    errors = [],
    links = new Set(),
    titles = new Set(),
    descriptions = new Set();
  page.on("pageerror", (error) => errors.push(error.message));
  await mkdir("artifacts/marketing", { recursive: true });
  for (const route of [...PUBLIC_PAGES, "/privacy", "/terms", "/check"]) {
    const response = await page.goto(base + route);
    check(response.status() === 200, `${route} must return 200`);
    await page.locator("h1").waitFor();
    check((await page.locator("h1").count()) === 1, `${route} has one h1`);
    const title = await page.title(),
      description = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
    check(!titles.has(title), `${route} unique title`);
    titles.add(title);
    check(
      description && !descriptions.has(description),
      `${route} unique description`,
    );
    descriptions.add(description);
    check(
      (await page.locator('link[rel="canonical"]').getAttribute("href")) ===
        `https://klyvorastudio.com${route === "/" ? "" : route}` ||
        (route === "/" &&
          (await page.locator('link[rel="canonical"]').getAttribute("href")) ===
            "https://klyvorastudio.com/"),
      `${route} canonical`,
    );
    const text = await page.locator("body").innerText();
    check(
      !/\[Client name\]|\[DATE\]|\[PAGE CAP\]|LAWYER TO|Starter website|Website \+ booking|Restaurant core|Founding slots|Application error|not operational|planned solution|planned package|subject to workflow assessment|readiness verification|not ready for production|requirements assessment only/i.test(
        text,
      ),
      `${route} has no retired copy or placeholders`,
    );
    check(
      await page.locator("[aria-labelledby]").evaluateAll((nodes) =>
        nodes.every((node) =>
          node
            .getAttribute("aria-labelledby")
            .split(/\s+/)
            .every((id) => document.getElementById(id)),
        ),
      ),
      `${route} valid labelled regions`,
    );
    await auditAccessibility(page, route);
    for (const href of await page
      .locator("a[href]")
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href"))))
      if (href.startsWith("/") && !href.startsWith("/portal")) links.add(href);
    if (["/", "/pricing", "/solutions/daycare", "/contact"].includes(route))
      await page.screenshot({
        path: `artifacts/marketing/${route === "/" ? "home" : route.replaceAll("/", "-").slice(1)}-desktop.png`,
        fullPage: true,
      });
  }
  for (const href of links) {
    const url = new URL(href, base),
      response = await fetch(url);
    check(response.ok, `Internal link ${href}`);
    if (url.hash) {
      await page.goto(url.href);
      check(
        (await page.locator(`[id="${url.hash.slice(1)}"]`).count()) === 1,
        `Anchor ${href}`,
      );
    }
  }
  for (const [source, destination] of MARKETING_REDIRECTS) {
    const response = await fetch(base + source + "?ref=qa", {
      redirect: "manual",
    });
    check(response.status === 301, `${source} returns 301`);
    const target = new URL(response.headers.get("location"), base);
    const expected = new URL(destination, base);
    check(
      target.pathname === expected.pathname &&
        target.hash === expected.hash &&
        target.searchParams.get("ref") === "qa",
      `${source} goes to relevant destination with query preserved`,
    );
  }
  for (const route of [
    "/work",
    "/blog",
    "/work/template-placeholder",
    "/blog/template-placeholder",
  ])
    check((await fetch(base + route)).status === 404, `${route} returns 404`);
  // Next.js Cache Components can stream the shell before resolving unknown params.
  // The supported result is then 200 + not-found UI + noindex rather than a late status change.
  for (const route of ["/solutions/unknown", "/services/unknown"]) {
    const response = await fetch(base + route);
    const html = await response.text();
    check(
      response.status === 404 ||
        (response.status === 200 &&
          /noindex/.test(html) &&
          /That page/.test(html)),
      `${route} returns a non-indexable not-found response`,
    );
  }
  const sitemap = await (await fetch(base + "/sitemap.xml")).text();
  for (const route of PUBLIC_PAGES)
    check(
      sitemap.includes(
        `https://klyvorastudio.com${route === "/" ? "" : route}`,
      ),
      `Sitemap includes ${route}`,
    );
  check(
    !/\/services|\/founding|\/quote|\/blog|\/work|\/admin|\/portal|\/privacy|\/terms/.test(
      sitemap,
    ),
    "Sitemap excludes retired, empty, protected, and unapproved legal pages",
  );
  await page.goto(base + "/pricing");
  for (const service of INDUSTRIES) {
    const card = page.locator(`.mk-industry-${service.id}`);
    check(
      (await card.innerText()).includes(money(service.setup)) &&
        (await card.innerText()).includes(money(setupPrice(service))) &&
        (await card.innerText()).includes("first 10 customers") &&
        (await card.innerText()).includes(`${money(service.monthly)}/month`),
      `${service.id} pricing`,
    );
  }
  const expectedPrices = [
    [2000, 249],
    [999, 199],
    [999, 99],
    [999, 99],
    [999, 49],
    [499, 49],
    [2499, null],
  ];
  check(
    JSON.stringify(
      [...INDUSTRIES, ...CUSTOM_SERVICES].map((s) => [s.setup, s.monthly]),
    ) === JSON.stringify(expectedPrices),
    "Official prices match specification",
  );
  check(
    JSON.stringify(
      [...INDUSTRIES, ...CUSTOM_SERVICES].map((s) => setupPrice(s)),
    ) === JSON.stringify([1000, 499.5, 499.5, 499.5, 499.5, 249.5, 1249.5]),
    "Launch prices halve setup fees exactly, including cents",
  );
  check(
    money(499.5) === "$499.50" &&
      money(249.5) === "$249.50" &&
      money(1000) === "$1,000",
    "Launch prices preserve half-dollar precision",
  );
  check(
    [...INDUSTRIES, ...CUSTOM_SERVICES].every(
      (s) => setupPrice(s, { ...LAUNCH_OFFER, active: false }) === s.setup,
    ),
    "Disabling offer restores regular setup prices",
  );
  check(
    (await page.locator("#launch-offer").innerText()).includes(
      "proposal is signed",
    ) &&
      (await page.locator("#launch-offer").innerText()).includes(
        "kickoff payment",
      ),
    "Offer reservation requires signed proposal and kickoff payment",
  );
  for (const route of ["/privacy", "/terms"]) {
    await page.goto(base + route);
    check(
      (
        await page.locator('meta[name="robots"]').getAttribute("content")
      ).includes("noindex"),
      `${route} noindex`,
    );
  }
  await page.goto(base + "/contact?service=beauty");
  check(
    (await page.locator("#quote-service").inputValue()) === "beauty",
    "Service CTA preselection",
  );
  await page
    .getByRole("button", { name: "Start Project", exact: true })
    .click();
  check(
    (await page.locator("#quote-name").getAttribute("aria-invalid")) === "true",
    "Accessible required field validation",
  );
  check(
    await page
      .locator("#quote-name")
      .evaluate((n) => n === document.activeElement),
    "Focus moves to first invalid field",
  );
  await page.locator("#quote-name").fill(valid.name);
  await page.locator("#quote-business").fill(valid.business);
  await page.locator("#quote-email").fill(valid.email);
  await page.locator("#quote-industry").selectOption(valid.industry);
  await page.locator("#quote-siteUrl").fill(valid.siteUrl);
  await page.locator("#quote-equipment").fill(valid.equipment);
  await page.locator("#quote-message").fill(valid.message);
  await page.route("**/api/quote", (route) => route.abort(), { times: 1 });
  await page
    .getByRole("button", { name: "Start Project", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "couldn’t be sent" })
    .waitFor();
  check(
    (await page.locator("#quote-message").inputValue()) === valid.message,
    "Submission failure preserves input",
  );
  await page
    .getByRole("button", { name: "Start Project", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Thanks. Your inquiry is on its way." })
    .waitFor();
  const lead = await prisma.lead.findFirstOrThrow({ where: { email } });
  check(
    lead.business === tag &&
      lead.message.includes(valid.equipment) &&
      lead.message.includes("Beauty & Wellness") &&
      lead.message.includes("$999") &&
      lead.message.includes("$499.50") &&
      lead.message.includes("Offer requested, not reserved") &&
      lead.message.includes("$99/month"),
    "Lead persisted with selected service, published pricing, equipment, and project",
  );
  check(
    lead.offerCode === null,
    "New inquiry does not select a legacy billing package",
  );
  const jobs = await prisma.job.findMany({
    where: { key: { contains: lead.id } },
  });
  check(
    jobs.some((j) => j.key === `lead-confirmation:${lead.id}`),
    "Confirmation email queued",
  );
  if (process.env.LEAD_NOTIFICATION_EMAIL || process.env.OWNER_EMAIL)
    check(
      jobs.some((j) => j.key === `lead-notification:${lead.id}`),
      "Owner notification queued",
    );
  check(
    jobs.every((j) => j.status === "pending"),
    "Provider delivery disabled during tests",
  );
  for (const [field, value] of [
    ["business", ""],
    ["service", "legacy-invalid"],
    ["siteUrl", "javascript:alert(1)"],
    ["email", "invalid"],
  ])
    check(
      (await post({ ...valid, [field]: value })).status === 422,
      `Server validates ${field}`,
    );
  check(
    (await post(valid, { origin: "https://untrusted.invalid" })).status === 403,
    "Cross-origin submission rejected",
  );
  check(
    (await post({ ...valid, company_website: "bot-filled" })).status === 201,
    "Honeypot appears successful",
  );
  check(
    (await prisma.lead.count({ where: { email } })) === 1,
    "Honeypot creates no lead",
  );
  for (let i = 0; i < 5; i++)
    await post(
      { ...valid, company_website: "bot-filled" },
      { "x-forwarded-for": tag + "-rate" },
    );
  check(
    (
      await post(
        { ...valid, company_website: "bot-filled" },
        { "x-forwarded-for": tag + "-rate" },
      )
    ).status === 429,
    "Lead rate limit retained",
  );
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of PUBLIC_PAGES) {
      await page.goto(base + route);
      check(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${route} no horizontal overflow at ${width}px`,
      );
      if (
        width === 375 &&
        ["/", "/pricing", "/contact", "/solutions/beauty"].includes(route)
      ) {
        await auditAccessibility(page, `${route} mobile`);
        await page.screenshot({
          path: `artifacts/marketing/${route === "/" ? "home" : route.replaceAll("/", "-").slice(1)}-mobile.png`,
          fullPage: true,
        });
      }
    }
    if (width === 375) {
      await page.goto(base + "/");
      await page.getByRole("button", { name: "Open menu" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      await page.keyboard.press("Shift+Tab");
      check(
        await dialog.evaluate((n) => n.contains(document.activeElement)),
        "Mobile menu traps keyboard focus",
      );
      await page.keyboard.press("Escape");
      check((await dialog.count()) === 0, "Escape closes mobile navigation");
      check(
        await page
          .getByRole("button", { name: "Open menu" })
          .evaluate((n) => n === document.activeElement),
        "Focus returns to menu control",
      );
    }
  }
  await page.goto(base + "/");
  check(
    (await page.locator("html").getAttribute("data-theme")) === "light",
    "Light theme is the default",
  );
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  check(
    (await page.locator("html").getAttribute("data-theme")) === "dark",
    "Dark theme works",
  );
  await page.screenshot({
    path: "artifacts/marketing/home-dark.png",
    fullPage: true,
  });
  await auditAccessibility(page, "Home dark theme");
  check(errors.length === 0, "No browser runtime errors: " + errors.join("; "));
  for (const route of ["/admin", "/portal", "/app"])
    check(
      [307, 308].includes(
        (await fetch(base + route, { redirect: "manual" })).status,
      ),
      `${route} remains protected`,
    );
  console.log(
    `Marketing verification passed: ${checks} checks. Desktop/mobile screenshots: artifacts/marketing.`,
  );
} catch (error) {
  console.error(error.message);
  console.error(logs.replace(/(?:postgres|https?):\/\/[^\s]+/g, "[URL]"));
  process.exitCode = 1;
} finally {
  await browser?.close();
  const leads = await prisma.lead.findMany({
    where: { email },
    select: { id: true },
  });
  for (const { id } of leads) {
    await prisma.job.deleteMany({ where: { key: { contains: id } } });
    await prisma.activity.deleteMany({ where: { leadId: id } });
    await prisma.lead.delete({ where: { id } });
  }
  await prisma.rateLimit.deleteMany({
    where: {
      key: {
        in: [tag, tag + "-rate"].map((ip) =>
          createHash("sha256").update(`leads:${ip}`).digest("hex"),
        ),
      },
    },
  });
  server.kill();
  await prisma.$disconnect();
}
