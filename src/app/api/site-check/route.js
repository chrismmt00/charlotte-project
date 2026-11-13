// STUB for the "Check my site" tool until the back-end session ships the real checker.
//
// Contract (keep it when replacing this file):
//   POST { url }
//   200 { url, finalUrl, status, redirected, loadMs, mobileFriendly, hasBooking, verdict, findings[] }
//         verdict: "dead" | "redirect" | "slow" | "mobile" | "nobooking" | "good"
//         findings: [{ id, label, pass, result, why }] for ids loads, redirects, speed, mobile, booking, call
//         An unreachable site is still a 200: verdict "dead", status 0 (or the error status), finalUrl/loadMs/mobileFriendly/hasBooking null.
//   400 { error: { code: "bad_json" | "invalid_url" | "blocked_url", message } }
//
// What this stub really does: fetches the page server-side (8 s total budget, up to 5 redirects, each hop re-validated),
// times it, and reads the HTML for a viewport meta tag, booking/ordering words or widget hosts, and tel:/map links.
//
// What the back end should replace (search for "BACKEND:"):
//   - Rate-limit by IP (this endpoint makes outbound requests on demand).
//   - Pin the DNS answer for the connection (custom undici dispatcher with a checked `lookup`) to close the
//     DNS-rebinding gap between our lookup and fetch's own lookup.
//   - Real measurements with a headless browser: time to first byte and full load, rendered text size, tap-target sizes,
//     phone screenshots for the emailed report, parked-page and bot-challenge detection.
//   - A public-suffix list for "same site" when judging redirects (this uses the last two host labels).

import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { buildFindings, normalizeUrl, pickVerdict } from "@/components/check/report";

const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 1_500_000;

const BLOCKED = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
]) {
  BLOCKED.addSubnet(net, prefix, "ipv4");
}
for (const [net, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["100::", 64],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
]) {
  BLOCKED.addSubnet(net, prefix, "ipv6");
}

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".intranet", ".lan", ".home.arpa", ".corp"];

const BOOKING_WORDS =
  /\b(book (now|online|today|an appointment|a table|your (visit|appointment|table))|schedule (now|online|an appointment|a visit)|make a reservation|reserve (now|online|a table)|order (now|online|ahead|pickup|delivery|here)|start (your|an) order|add to cart|add to bag|checkout)\b/i;
const BOOKING_HOSTS =
  /(calendly\.com|acuityscheduling\.com|squarespacescheduling\.com|squareup\.com\/appointments|book\.squareup\.com|square\.site|booksy\.com|vagaro\.com|setmore\.com|schedulicity\.com|fresha\.com|mindbodyonline\.com|styleseat\.com|glossgenius\.com|janeapp\.com|simplybook\.|opentable\.com|resy\.com|tock\.com|toasttab\.com|chownow\.com|order\.online|clover\.com\/online-ordering|cdn\.shopify\.com|ecwid\.com|doordash\.com|ubereats\.com|grubhub\.com|wix-bookings)/i;
const PHONE_LINK = /href\s*=\s*["']?\s*tel:/i;
const MAP_LINK = /(google\.[a-z.]+\/maps|maps\.google\.|goo\.gl\/maps|maps\.app\.goo\.gl|maps\.apple\.com)/i;

function bad(code, message) {
  return Response.json({ error: { code, message } }, { status: 400 });
}

function isBlockedAddress(address) {
  const family = isIP(address);
  if (family === 4) return BLOCKED.check(address, "ipv4");
  if (family === 6) {
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
    if (mapped) return BLOCKED.check(mapped[1], "ipv4");
    return BLOCKED.check(address, "ipv6");
  }
  return true;
}

// -> { ok: true } | { blocked: true, message } | { unreachable: true }
async function checkTarget(urlString) {
  let u;
  try {
    u = new URL(urlString);
  } catch {
    return { blocked: true, message: "That isn’t a web address we can check." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { blocked: true, message: "Only http and https addresses can be checked." };
  if (u.username || u.password) return { blocked: true, message: "Addresses with a username or password can’t be checked." };
  if (u.port && u.port !== "80" && u.port !== "443") return { blocked: true, message: "We only check sites on the standard web ports." };
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || !host.includes(".") || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    return { blocked: true, message: "We only check public websites." };
  }
  if (isIP(host)) {
    return isBlockedAddress(host) ? { blocked: true, message: "We only check public websites." } : { ok: true };
  }
  let answers;
  try {
    // BACKEND: pin this answer for the actual connection (DNS rebinding).
    answers = await lookup(host, { all: true, verbatim: true });
  } catch {
    return { unreachable: true };
  }
  if (!answers.length) return { unreachable: true };
  if (answers.some((a) => isBlockedAddress(a.address))) return { blocked: true, message: "We only check public websites." };
  return { ok: true };
}

async function readHtml(res) {
  const type = res.headers.get("content-type") || "";
  if (!res.body) return "";
  if (type && !/html|xml/i.test(type)) {
    await res.body.cancel().catch(() => {});
    return "";
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    html += decoder.decode(value, { stream: true });
    if (bytes > MAX_HTML_BYTES) {
      await reader.cancel().catch(() => {});
      break;
    }
  }
  return html;
}

// Crude "same site": the last two labels, ignoring www. BACKEND: use a public-suffix list.
function siteOf(host) {
  return host.replace(/^www\./, "").split(".").slice(-2).join(".");
}

function hasMobileViewport(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  return tags.some((t) => /name\s*=\s*["']?viewport/i.test(t) && /width\s*=\s*device-width/i.test(t));
}

export async function POST(request) {
  // BACKEND: rate-limit by IP here.
  let body;
  try {
    body = await request.json();
  } catch {
    return bad("bad_json", "Send JSON.");
  }
  const url = normalizeUrl(body?.url);
  if (!url) return bad("invalid_url", "Enter an address like yourbusiness.com.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = performance.now();
  let current = url;
  let hops = 0;
  let res = null;
  let html = "";
  try {
    for (;;) {
      const target = await checkTarget(current);
      if (target.blocked) return bad("blocked_url", target.message);
      if (target.unreachable) break;
      res = await fetch(current, {
        method: "GET",
        redirect: "manual", // followed by hand so every hop is re-validated against private addresses
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; KlyvoraSiteCheck/0.1; +https://klyvora.ai/check)",
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        },
      });
      const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (!location) break;
      await res.body?.cancel().catch(() => {});
      if (hops >= MAX_REDIRECTS) {
        res = null; // a redirect loop reads as "not loading"
        break;
      }
      current = new URL(location, current).toString();
      hops += 1;
    }
    if (res && res.status < 400) html = await readHtml(res);
  } catch {
    res = null; // timeout, refused connection, TLS error
  } finally {
    clearTimeout(timer);
  }
  const loadMs = Math.round(performance.now() - started);

  // BACKEND: 401/403/429 are often bot walls, not dead sites; a headless browser can tell them apart.
  const reachable = !!res && res.status < 400;
  const startHost = new URL(url).hostname.toLowerCase();
  const finalHost = new URL(current).hostname.toLowerCase();
  const raw = {
    reachable,
    status: res ? res.status : 0,
    loadMs,
    redirected: hops > 0,
    offsite: reachable && siteOf(startHost) !== siteOf(finalHost),
    finalHost,
    mobileFriendly: reachable && hasMobileViewport(html),
    hasBooking: reachable && (BOOKING_WORDS.test(html) || BOOKING_HOSTS.test(html)),
    hasPhoneLink: reachable && PHONE_LINK.test(html),
    hasMapLink: reachable && MAP_LINK.test(html),
  };

  return Response.json({
    url,
    finalUrl: reachable ? current : null,
    status: raw.status,
    redirected: raw.redirected,
    loadMs: reachable ? loadMs : null,
    mobileFriendly: reachable ? raw.mobileFriendly : null,
    hasBooking: reachable ? raw.hasBooking : null,
    verdict: pickVerdict(raw),
    findings: buildFindings(raw),
  });
}
