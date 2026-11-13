// "Check my site" copy and scoring, shared by POST /api/site-check (builds findings) and the /check page (renders them).
// No "use client": this module is plain data and functions, safe on the server and in the browser.

export const SLOW_MS = 3000;

// The six checks, in the order the page shows them while checking.
export const CHECKS = [
  { id: "loads", label: "Loads" },
  { id: "redirects", label: "Redirects" },
  { id: "speed", label: "Speed" },
  { id: "mobile", label: "Works on a phone" },
  { id: "booking", label: "Takes bookings or orders" },
  { id: "call", label: "Click-to-call and map" },
];

// Verdict -> headline and the offer that would fix it (prices are read from src/lib/offers.js by code).
export const VERDICTS = {
  dead: { headline: "Your site isn’t loading.", fixCode: "W1", fixHref: "/services/websites" },
  redirect: { headline: "It sends people somewhere else.", fixCode: "W2", fixHref: "/services/websites" },
  slow: { headline: "It works, but it makes people wait.", fixCode: "W2", fixHref: "/services/websites" },
  mobile: { headline: "It wasn’t built for phones.", fixCode: "W2", fixHref: "/services/websites" },
  nobooking: { headline: "It loads, but nobody can book.", fixCode: "WB", fixHref: "/services/booking" },
  good: { headline: "Your site is in good shape.", fixCode: "AI", fixHref: "/services/ai" },
};

function seconds(ms) {
  return (Math.round(ms / 100) / 10).toFixed(1) + " s";
}

const NOT_CHECKED = {
  pass: false,
  result: "Not checked",
  why: "The page didn’t load, so this check couldn’t run.",
};

// raw: { reachable, status, loadMs, redirected, offsite, finalHost, mobileFriendly, hasBooking, hasPhoneLink, hasMapLink }
// Returns [{ id, label, pass, result, why }] in CHECKS order.
export function buildFindings(raw) {
  const label = Object.fromEntries(CHECKS.map((c) => [c.id, c.label]));
  const row = (id, r) => ({ id, label: label[id], ...r });
  if (!raw.reachable) {
    return [
      row("loads", {
        pass: false,
        result: raw.status ? `The server answered with an error (${raw.status})` : "No response",
        why: "The address doesn’t answer properly. Customers see an error or a parked page.",
      }),
      ...CHECKS.slice(1).map((c) => row(c.id, NOT_CHECKED)),
    ];
  }
  return [
    row("loads", {
      pass: true,
      result: `Responded in ${seconds(raw.loadMs)}`,
      why: "The address answers, so the rest of the checks can run.",
    }),
    row(
      "redirects",
      raw.offsite
        ? {
            pass: false,
            result: `Redirects to ${raw.finalHost}`,
            why: "Visitors land somewhere they didn’t type. Search engines and customers both lose trust.",
          }
        : {
            pass: true,
            result: raw.redirected ? "One clean redirect on the same site" : "Lands where you typed it",
            why: "http → https on your own domain is the one redirect you want.",
          }
    ),
    row(
      "speed",
      raw.loadMs > SLOW_MS
        ? { pass: false, result: `Page loaded in ${seconds(raw.loadMs)}`, why: "Most people leave a page that takes more than 3 seconds." }
        : { pass: true, result: `Page loaded in ${seconds(raw.loadMs)}`, why: "Under 3 seconds, before images and scripts." }
    ),
    row(
      "mobile",
      raw.mobileFriendly
        ? { pass: true, result: "Set up for phone screens", why: "Over half of local searches happen on a phone." }
        : {
            pass: false,
            result: "No mobile viewport tag",
            why: "Phones show a shrunken desktop page that people have to pinch and zoom.",
          }
    ),
    row(
      "booking",
      raw.hasBooking
        ? { pass: true, result: "Online booking or ordering found", why: "Customers can act without calling." }
        : { pass: false, result: "No way to book or order online", why: "Every booking or order still needs a call or a DM." }
    ),
    row(
      "call",
      raw.hasPhoneLink
        ? {
            pass: true,
            result: raw.hasMapLink ? "Phone number and map are tappable" : "Phone number is tappable",
            why: "One tap to call or get directions.",
          }
        : { pass: false, result: "No tappable phone number found", why: "On a phone, people have to copy the number by hand." }
    ),
  ];
}

// The most serious problem wins.
export function pickVerdict(raw) {
  if (!raw.reachable) return "dead";
  if (raw.offsite) return "redirect";
  if (raw.loadMs > SLOW_MS) return "slow";
  if (!raw.mobileFriendly) return "mobile";
  if (!raw.hasBooking) return "nobooking";
  return "good";
}

export function hostOf(url) {
  return String(url || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/[/?#].*$/, "")
    .toLowerCase();
}

// "yourbusiness.com" -> "https://yourbusiness.com". Returns null for anything that isn't a plain web address.
export function normalizeUrl(input) {
  const s = String(input || "").trim();
  if (!/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#].*)?$/i.test(s)) return null;
  return /^https?:\/\//i.test(s) ? s : "https://" + s;
}
