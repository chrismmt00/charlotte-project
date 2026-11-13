// Proposal pricing and fixed terms, shared by the admin builder (/admin/proposals) and the public page (/p/[token]).
// Prices come only from src/lib/offers.js. The back end freezes these numbers on the proposal when it is sent.
import { ADD_BOOKING_LATER, BILLED_SEPARATELY, MILESTONES, RESTAURANT_ADD_ONS, getOffer } from "@/lib/offers";

export const RESTAURANT_CODES = ["RC", "RK"];
export const isRestaurant = (code) => RESTAURANT_CODES.includes(code);

// Offers whose site takes payments, so the client connects their own Stripe account.
export const NEEDS_CONNECT = ["WB", "BK", "EC", "RC", "RK"];

// Dollars with cents only when needed: $999, $299.70.
export function usd(n) {
  const v = Math.round(Number(n) * 100) / 100;
  const cents = Math.round(v * 100) % 100 !== 0;
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
}

export const MILESTONE_LABELS = ["Kickoff", "Working demo", "Launch"];
export const MILESTONE_TRIGGERS = ["Signed proposal", "Client approves the demo in the portal", "Client accepts launch"];

// 50 / 30 / 20 from MILESTONES. The last share takes the rounding remainder so the parts add up to the total.
export function splitMilestones(total) {
  const cents = Math.round(total * 100);
  let used = 0;
  return MILESTONES.map((m, i) => {
    const part = i === MILESTONES.length - 1 ? cents - used : Math.round((cents * m.percent) / 100);
    used += part;
    return { label: MILESTONE_LABELS[i], percent: m.percent, when: m.when, amount: part / 100 };
  });
}

// Add-ons a proposal can carry for an offer. Restaurant modules for RC/RK; "booking later" for the two plain sites.
export function addOnsFor(code) {
  if (isRestaurant(code)) {
    return RESTAURANT_ADD_ONS.map((a) => ({
      code: a.code,
      name: code === "RK" && a.code === "KIOSK" ? "Extra kiosk" : a.name,
      setup: a.setup,
      setupFrom: !!a.setupFrom,
      monthly: a.monthly,
      perDevice: a.code === "KIOSK",
      help: a.code === "KIOSK" ? (code === "RK" ? "One kiosk is already in RK; each extra device" : "Per device") : a.setupFrom ? "Assumes the shared mobile foundation exists" : "",
    }));
  }
  if (code === "W1" || code === "W2") {
    return [
      {
        code: "BOOKING",
        name: "Booking added later",
        setup: ADD_BOOKING_LATER.setup,
        monthly: ADD_BOOKING_LATER.monthly,
        perDevice: false,
        help: code === "W2" ? "The monthly moves to $79" : "Starter + booking is the Website + Booking bundle",
      },
    ];
  }
  return [];
}

// selected: { [addOnCode]: qty }. quote: build price for "from" offers (AH, CA), never below the catalog price.
export function computeTotals({ offerCode, addOns = {}, monthly = true, quote = null }) {
  const offer = getOffer(offerCode);
  if (!offer) return null;
  const base = offer.setupFrom && quote ? Math.max(offer.setup, Number(quote) || offer.setup) : offer.setup;
  const lines = [{ label: offer.name, setup: base, monthly: offer.monthly, from: !!offer.setupFrom && !quote }];
  for (const a of addOnsFor(offerCode)) {
    const qty = Number(addOns[a.code] || 0);
    if (qty > 0) lines.push({ label: qty > 1 ? `${a.name} × ${qty}` : a.name, setup: a.setup * qty, monthly: a.monthly * qty, from: a.setupFrom });
  }
  const required = !!offer.monthlyRequired;
  const monthlyOn = required || !!monthly;
  const build = lines.reduce((t, l) => t + l.setup, 0);
  const monthlyAmount = lines.reduce((t, l) => t + l.monthly, 0);
  return {
    offer,
    lines,
    build,
    buildFrom: lines.some((l) => l.from),
    schedule: splitMilestones(build),
    monthlyOn,
    monthlyRequired: required,
    monthlyAmount,
    usage: !!offer.usage,
  };
}

export function monthlyNote(offer) {
  if (!offer) return "";
  if (offer.monthlyRequired) return "Required for restaurants: ordering, kiosks and kitchen operations need daily maintenance on our platform.";
  return "Optional. Hosting, their admin and support. Untick it if they take the code and self-host; the client can also switch it on the proposal page.";
}

// Every proposal caps these. Values stay as placeholders until the founders set them per offer.
export const SCOPE_CAPS = [
  { key: "pages", label: "Pages" },
  { key: "rounds", label: "Design rounds" },
  { key: "integrations", label: "Integrations" },
  { key: "hosting", label: "Hosting" },
  { key: "support", label: "Support hours a month" },
  { key: "changes", label: "Minor changes a month" },
];

export function defaultCaps(code) {
  return {
    pages: code === "W1" || code === "WB" ? "Landing page or up to 5 pages" : "[PAGE CAP]",
    rounds: "[ROUNDS]",
    integrations: "[INTEGRATIONS CAP]",
    hosting: "[HOSTING CAP]",
    support: "[SUPPORT HOURS]",
    changes: "[MINOR CHANGES]",
  };
}

// Fixed ownership text from docs/PROJECT-BRIEF.md "Ownership". Edited in the template, never per proposal.
export const OWNERSHIP_TERMS = [
  {
    title: "The site, the code, the data",
    body: "Everything we build for you, the site, its code and its data, transfers to you on final payment. That includes the workflow and integrations of an AI harness and any separately quoted feature.",
  },
  {
    title: "What stays ours",
    body: "Only Klyvora templates and platform. A site built on a Klyvora template uses it under license; the template itself is not sold. The restaurant platform, booking engine, kiosk application and client admin are licensed to you while the monthly plan is active.",
  },
  {
    title: "Always yours",
    body: "Your domain, branding, content, data, customer list and Stripe account. Cancel the monthly and you keep the site, the code (except licensed templates and platform) and all of your data, with a full export.",
  },
  {
    title: "No cut of your sales",
    body: "Customer checkout runs through your own Stripe account. Klyvora takes $0 of your sales.",
  },
];

export { BILLED_SEPARATELY };

export const PROPOSAL_STATUSES = ["Draft", "Sent", "Viewed", "Accepted", "Declined", "Expired"];
export const PROPOSAL_TONE = { Draft: "muted", Sent: "accent", Viewed: "fg", Accepted: "success", Declined: "muted", Expired: "warning" };
