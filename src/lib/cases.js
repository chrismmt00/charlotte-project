// Case studies for /work and /work/[slug].
// CASES is empty on purpose: no client has launched yet, and nothing here may be invented.
// Add a real entry only with the owner's approval of every figure and quote.
// The back end (CMS, phase 4) will replace this with the CaseStudy model and must keep the same shape.
//
// Shape:
// {
//   slug, client, service,           // service: a label from SERVICE_FILTERS below
//   serviceSlug,                     // /services/<serviceSlug>
//   area, launched,                  // "[Neighborhood]", "[Month year]"
//   headline,                        // the one-line result, in the owner's words
//   summary,                         // one sentence for the card on /work
//   offerCode,                       // a code from src/lib/offers.js; prices are read from there
//   addOns: [],                      // add-on names, e.g. "Kitchen operations add-on"
//   weeks,                           // weeks from kickoff to launch
//   media: [{ label }],              // screenshot or photo captions (swap for real images)
//   problem: [], built, pieces: [],  // paragraphs and the list of what was built
//   metrics: [{ label, value, period }],
//   quote, owner,
// }

export const CASES = [];

export const SERVICE_FILTERS = ["Websites", "Online booking", "Ecommerce", "Restaurants", "AI automation"];

// TEMPLATE ONLY. Never listed on /work and never served in production.
// generateStaticParams uses its slug so the route builds while CASES is empty (Cache Components
// needs at least one param), and `next dev` renders it so the founders can review the layout.
export const CASE_TEMPLATE = {
  slug: "template-placeholder",
  client: "[Client name]",
  service: "Restaurants",
  serviceSlug: "restaurants",
  area: "[Neighborhood]",
  launched: "[Month year]",
  headline: "[the one-line result, in the owner’s words]",
  summary: "[Result in the owner’s numbers, e.g. orders per week before → after]",
  offerCode: "RK",
  addOns: ["[Add-on used, if any]"],
  weeks: "[n]",
  media: [{ label: "[Screenshot · the main page · 1600×1000]" }, { label: "[Photo · the system in use · 1600×1000]" }],
  problem: [
    "[What was costing the owner time or money before. Two or three sentences in plain words.]",
    "[One concrete detail the owner told us, with their permission.]",
  ],
  built: "[The offer used and what it included. Which parts were our platform and which were made for them.]",
  pieces: ["[Piece 1]", "[Piece 2]", "[Piece 3]", "[Piece 4]"],
  metrics: [
    { label: "[Metric 1]", value: "[before → after]", period: "[period]" },
    { label: "[Metric 2]", value: "[before → after]", period: "[period]" },
    { label: "[Metric 3]", value: "[before → after]", period: "[period]" },
  ],
  quote: "[A quote from the owner, in their words, approved by them.]",
  owner: "[Owner name]",
};

const SHOW_TEMPLATE = process.env.NODE_ENV === "development";

export function getCase(slug) {
  const found = CASES.find((c) => c.slug === slug);
  if (found) return found;
  if (SHOW_TEMPLATE && slug === CASE_TEMPLATE.slug) return CASE_TEMPLATE;
  return null;
}

export function caseSlugs() {
  return CASES.length ? CASES.map((c) => ({ slug: c.slug })) : [{ slug: CASE_TEMPLATE.slug }];
}

export function nextCase(slug) {
  if (CASES.length < 2) return null;
  const i = CASES.findIndex((c) => c.slug === slug);
  return i === -1 ? null : CASES[(i + 1) % CASES.length];
}
