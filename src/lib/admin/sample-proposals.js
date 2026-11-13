// SAMPLE DATA for /admin/proposals and the public page /p/[token] until the back end ships its routes.
// Businesses match src/lib/admin/sample.js LEADS (Proposal sent, Signed, Lost) and sample-clients.js.
//
// GET  /api/admin/proposals -> { proposals: Proposal[] }
//   Proposal: { id, token, name, leadId, clientId, business, contactName, email, offerCode,
//     addOns: { [code]: qty }, monthly, quote, scopeOff: number[], extras, caps: { pages, rounds, integrations, hosting, support, changes },
//     termsTemplate, validDays, earliestStart, status, created, sentNote, headline, views, declinedReason, signatureName }
//   status: "Draft" | "Sent" | "Viewed" | "Accepted" | "Declined" | "Expired"
// GET  /api/p/[token] -> { proposal: PublicProposal }   404 when the token is unknown
//   PublicProposal: { id, token, state: "draft"|"open"|"signed"|"expired"|"declined", business, contactFirst, email, offerCode,
//     headline, preparedBy, validUntil, earliestStart, timeline, scope: string[], extras, caps, addOns, monthly, signedAt, signatureName }
//
// Sample public links: /p/pr9-taqueria (open, restaurant: monthly locked on), /p/pr7-nailsalon (open, viewed),
// /p/pr6-bakery (open), /p/pr8-barbershop (draft preview), /p/pr5-foodtruck (signed), /p/pr3-lashstudio (expired),
// /p/pr1-cafe (declined). /p/pr4-braids and /p/pr2-studio are signed too.
import { getOffer } from "@/lib/offers";
import { defaultCaps } from "@/components/proposal/model";

function p(fields) {
  const offer = getOffer(fields.offerCode);
  return {
    clientId: null,
    leadId: null,
    addOns: {},
    monthly: true,
    quote: null,
    scopeOff: [],
    extras: "",
    caps: defaultCaps(fields.offerCode),
    termsTemplate: offer.monthlyRequired ? "restaurant" : fields.offerCode === "EC" ? "ecommerce" : fields.offerCode === "CA" ? "custom" : "standard",
    validDays: 14,
    earliestStart: "2026-11-17",
    created: "[date] · Chris",
    views: 0,
    declinedReason: "",
    signatureName: "",
    name: `${offer.name} for ${fields.business}`,
    ...fields,
  };
}

export const PROPOSALS = [
  p({ id: "PR-0009", token: "pr9-taqueria", leadId: "ld_2", business: "Taqueria [2]", contactName: "[Owner 2]", email: "[owner2@example.com]", offerCode: "RC", status: "Sent", sentNote: "sent today · not opened · expires in 14d", headline: "Your menu and ordering, on your own site." }),
  p({ id: "PR-0008", token: "pr8-barbershop", leadId: "ld_1", business: "Barbershop [1]", contactName: "[Owner 1]", email: "[owner1@example.com]", offerCode: "WB", status: "Draft", sentNote: "not sent", headline: "A booking page that works while you cut hair.", extras: "Set up the Google Business link" }),
  p({ id: "PR-0007", token: "pr7-nailsalon", leadId: "ld_3", business: "Nail salon [3]", contactName: "[Owner 3]", email: "[owner3@example.com]", offerCode: "BK", status: "Viewed", views: 3, sentNote: "sent 2d ago · opened 3× · expires in 12d", headline: "Booking on the site you already have." }),
  p({ id: "PR-0006", token: "pr6-bakery", leadId: "ld_5", business: "Bakery [5]", contactName: "[Owner 5]", email: "[owner5@example.com]", offerCode: "EC", status: "Sent", sentNote: "sent 3d ago · not opened · expires in 11d", headline: "A store for what you already sell." }),
  p({ id: "PR-0005", token: "pr5-foodtruck", leadId: "ld_6", clientId: "cl_6", business: "Food truck [6]", contactName: "[Owner 6]", email: "[owner6@example.com]", offerCode: "RK", status: "Accepted", views: 4, sentNote: "signed [date]", headline: "Ordering and a kiosk for the lunch line.", signatureName: "[Owner 6]" }),
  p({ id: "PR-0004", token: "pr4-braids", leadId: "ld_7", clientId: "cl_7", business: "Braids studio [7]", contactName: "[Owner 7]", email: "[owner7@example.com]", offerCode: "WB", status: "Accepted", views: 2, sentNote: "signed [date]", headline: "Bookings and deposits on your own site.", signatureName: "[Owner 7]" }),
  p({ id: "PR-0003", token: "pr3-lashstudio", leadId: "ld_9", business: "Lash studio [9]", contactName: "[Owner 9]", email: "[owner9@example.com]", offerCode: "WB", status: "Expired", sentNote: "expired [date] · no reply", headline: "Bookings and deposits on your own site." }),
  p({ id: "PR-0002", token: "pr2-studio", clientId: "cl_9", business: "Studio [9]", contactName: "[Owner 9]", email: "[owner9@example.com]", offerCode: "W2", monthly: false, status: "Accepted", views: 2, sentNote: "signed [date] · self-managed", headline: "A full site, built around how clients find you.", signatureName: "[Owner 9]" }),
  p({ id: "PR-0001", token: "pr1-cafe", leadId: "ld_10", business: "Cafe [10]", contactName: "[Owner 10]", email: "[owner10@example.com]", offerCode: "AI", status: "Declined", sentNote: "declined [date] · “not now”", headline: "Missed calls answered with a text.", declinedReason: "not now" }),
];

export function getProposal(id) {
  return PROPOSALS.find((x) => x.id === id) || null;
}

const STATE = { Draft: "draft", Sent: "open", Viewed: "open", Accepted: "signed", Expired: "expired", Declined: "declined" };

export function publicProposal(token) {
  const x = PROPOSALS.find((pr) => pr.token === token);
  if (!x) return null;
  const offer = getOffer(x.offerCode);
  return {
    id: x.id,
    token: x.token,
    state: STATE[x.status],
    business: x.business,
    contactFirst: "[First name]",
    contactName: x.contactName,
    email: x.email,
    offerCode: x.offerCode,
    headline: x.headline,
    preparedBy: "Chris",
    validUntil: "[date]",
    earliestStart: x.earliestStart,
    timeline: "[TIMELINE]",
    scope: offer.includes.filter((_, i) => !x.scopeOff.includes(i)),
    extras: x.extras,
    caps: x.caps,
    addOns: x.addOns,
    quote: x.quote,
    monthly: offer.monthlyRequired ? true : x.monthly,
    signedAt: x.status === "Accepted" ? "[date]" : null,
    signatureName: x.signatureName,
    declinedAt: x.status === "Declined" ? "[date]" : null,
    expiredAt: x.status === "Expired" ? "[date]" : null,
  };
}
