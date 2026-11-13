// Pure estimator math. Every number comes from src/lib/offers.js; nothing here invents a price.
// Shared by the /quote estimator and the /check report ("What would fix it").

import { ADD_BOOKING_LATER, MILESTONES, OFFERS, RESTAURANT_ADD_ONS, getOffer, money } from "@/lib/offers";

// Offers with a "from" founding price (AH, CA) get a fixed quote instead, so the estimator leaves them out.
export const QUOTE_OFFERS = OFFERS.filter((o) => !o.setupFrom);

export const DEFAULT_OFFER_CODE = (OFFERS.find((o) => o.featured) || QUOTE_OFFERS[0]).code;

export const MAX_KIOSKS = 10;

export function quoteOffer(code) {
  const o = getOffer(code);
  return o && !o.setupFrom ? o : null;
}

// "$999 setup · optional $79/month" — the same line the pricing cards use.
export function priceLine(o) {
  return `${money(o.setup)} setup · ${o.monthlyRequired ? "" : "optional "}${money(o.monthly)}/month${o.usage ? " + usage" : ""}`;
}

const RESTAURANT_NOTES = {
  KIOSK: "Hardware billed separately, paid before we order it.",
  APP: "Ask us about timing.",
  STAFF: "Roles, schedules, clock-in.",
  KITCHEN: "Kitchen screen and ticket flow.",
  INVENTORY: "Counts and low-stock alerts.",
  LOYALTY: "Points, offers, win-back texts.",
};

// The add-ons a given offer can take. Offers without priced add-ons return [] and the step shows what is included.
export function addOnsFor(offer) {
  if (!offer) return [];
  if (offer.code === "W1" || offer.code === "W2") {
    return [
      {
        code: "BOOKING_LATER",
        name: "Online booking",
        note: "Deposits through your own Stripe, reminders by text and email.",
        setup: ADD_BOOKING_LATER.setup,
        monthly: ADD_BOOKING_LATER.monthly,
      },
    ];
  }
  if (offer.code === "RC" || offer.code === "RK") {
    return RESTAURANT_ADD_ONS.map((a) => ({
      code: a.code,
      name: a.code === "KIOSK" ? (offer.code === "RK" ? "Extra kiosks" : "Self-serve kiosks") : a.name,
      note: RESTAURANT_NOTES[a.code] || "",
      setup: a.setup,
      monthly: a.monthly,
      setupFrom: !!a.setupFrom,
      perDevice: a.code === "KIOSK",
    }));
  }
  return [];
}

export function addOnPriceLabel(a) {
  const per = a.perDevice ? " per device" : "";
  return `${a.setupFrom ? "from " : "+"}${money(a.setup)}${per} · +${money(a.monthly)}/month${per}`;
}

export function addOnsLede(offer) {
  if (!offer) return "";
  if (offer.code === "RC" || offer.code === "RK") {
    return "Restaurant add-ons from the menu. Kiosk hardware is paid in full before we order it.";
  }
  if (offer.code === "W1" || offer.code === "W2") return "Booking can be added now or later at the same price.";
  return "Most of what you need is already in the price.";
}

export function planNote(offer, planOn) {
  if (offer.monthlyRequired) return "Required on restaurant plans: ordering and kiosks need daily care.";
  if (planOn) return "Hosting, our admin and support. Turn it off to take the code and run it yourself.";
  return "Off: you take the code and run it yourself. No monthly.";
}

// picked: { [addOnCode]: true }, kiosks: quantity for the per-device add-on, plan: monthly plan switch.
export function computeEstimate(offer, { picked = {}, kiosks = 1, plan = true } = {}) {
  const planRequired = !!offer.monthlyRequired;
  const planOn = planRequired || plan !== false;
  let setup = offer.setup;
  let monthly = planOn ? offer.monthly : 0;
  let setupFrom = !!offer.setupFrom;
  const lines = [{ name: `${offer.name} · setup`, amount: money(offer.setup) }];
  if (planOn) {
    lines.push({
      name: `${offer.name} · monthly plan${planRequired ? " (required)" : ""}`,
      amount: `${money(offer.monthly)}/month${offer.usage ? " + usage" : ""}`,
    });
  }
  const addOns = [];
  for (const a of addOnsFor(offer)) {
    if (!picked[a.code]) continue;
    const quantity = a.perDevice ? Math.min(MAX_KIOSKS, Math.max(1, kiosks)) : 1;
    setup += a.setup * quantity;
    monthly += a.monthly * quantity;
    if (a.setupFrom) setupFrom = true;
    addOns.push({ code: a.code, name: a.name, quantity, setup: a.setup * quantity, monthly: a.monthly * quantity, setupFrom: !!a.setupFrom });
    lines.push({
      name: a.name + (a.perDevice ? ` × ${quantity}` : ""),
      amount: `${a.setupFrom ? "from " : ""}${money(a.setup * quantity)} · ${money(a.monthly * quantity)}/month`,
    });
  }
  const milestones = MILESTONES.map((m) => ({ percent: m.percent, when: m.when, amount: (setup * m.percent) / 100 }));
  return { planOn, planRequired, setup, monthly, setupFrom, usage: !!offer.usage, lines, addOns, milestones };
}

export function money2(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function setupTotalLabel(est) {
  return (est.setupFrom ? "from " : "") + money(est.setup);
}

export function monthlyTotalLabel(est) {
  return est.monthly ? money(est.monthly) : "$0";
}

export function monthlyTotalNote(est) {
  if (!est.monthly) return "Self-managed, no plan";
  if (!est.planOn) return "Add-ons only";
  return "From accepted launch" + (est.usage ? " · plus usage" : "");
}

export function runningTotal(est) {
  return `${setupTotalLabel(est)} setup · ${est.monthly ? money(est.monthly) + "/month" : "no monthly"}`;
}
