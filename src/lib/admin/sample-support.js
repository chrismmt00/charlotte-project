// SAMPLE DATA for /admin/support and /admin/support/[id] until the back end ships the routes.
// Every name is a bracketed placeholder. Shapes below are the contract the back end must return.
//
// Hours are decimals (0.5 = thirty minutes). Plan hour caps are set per proposal; the numbers below
// are PLACEHOLDERS the founders confirm ("[PLAN CAP]" in the proposal template). Money is not shown here;
// the API stores cents wherever a quote or overage is billed.
//
// GET /api/admin/tickets?status=Open|In progress|Waiting on client|Closed -> { tickets: TicketSummary[], clients: SupportClient[], today }
// TicketSummary: { id, num, client, clientId, subject, type, status, assigned, opened, source, hours (this ticket), quoteRequest }
// POST /api/admin/tickets { clientId, requester, type, source, subject, body, assigned, priority }
//   -> 201 { ticket }   (a client with no plan creates a quote request and a proposal draft: { ticket, proposalDraftId })
// GET /api/admin/tickets/[id] -> { ticket: Ticket, cap: { hours, usedByClient } }   404 { error } when unknown
// Ticket = TicketSummary + { planLabel, priority, requester, requesterEmail, site, replyDue, related[], watchers,
//   thread: [{ id, kind: "client" | "team" | "internal" | "event", who, when, text, file? }],
//   time: [{ id, on: "YYYY-MM-DD", what, who, hours }] }
// PATCH /api/admin/tickets/[id] { status?, assigned?, resolution?, rootCause?, askRating?, addToKb? } -> 200 { ticket }
// POST /api/admin/tickets/[id]/messages { kind: "reply" | "note", body, after?: status } -> 201 { message }
// POST /api/admin/tickets/[id]/time { hours, who, what } -> 201 { entry }
//
// SupportClient: { id, name, planLabel, plan: boolean (false = no monthly plan: quote path), startsAtLaunch, capHours (0 until the plan starts), usedHours }
// usedHours is the sum of time entries dated in the current month across the client's tickets.

import { SAMPLE_TODAY } from "@/lib/admin/sample-projects";

export { SAMPLE_TODAY };

export const TICKET_STATUSES = ["Open", "In progress", "Waiting on client", "Closed"];
export const TICKET_TYPES = ["Small change", "Bug", "Question", "Outage"];
export const TICKET_SOURCES = ["Text", "Phone call", "Email", "In person"];
export const ASSIGNEES = ["Demetrius", "Geoffrey", "Chris"];
export const PRIORITIES = [
  { value: "Normal", label: "Normal · reply within 1 business day" },
  { value: "High", label: "High · same day" },
  { value: "Outage", label: "Outage · now" },
];
export const CANNED = {
  "Looking into it now": "Thanks for flagging this. We are looking into it now and will update you by end of day.",
  "Fixed — please check": "This should be fixed now. Could you try once more and tell us if anything still looks off?",
  "Need more detail": "Could you send a screenshot or the exact steps? That will help us find it faster.",
  "Over plan hours — quote attached": "This one goes past the hours in your monthly plan. We have attached a short quote for the extra; reply “yes” and we will start.",
};

// Plan caps are placeholders until each proposal sets its own.
export const SUPPORT_CLIENTS = [
  { id: "bakery5", name: "Bakery [5]", planLabel: "Ecommerce store · $99 plan", plan: true, startsAtLaunch: false, capHours: 4 },
  { id: "detailing4", name: "Detailing [4]", planLabel: "Starter Website · $49 plan", plan: true, startsAtLaunch: false, capHours: 2 },
  { id: "foodtruck6", name: "Food truck [6]", planLabel: "Restaurant core + 1 kiosk · plan starts at launch", plan: true, startsAtLaunch: true, capHours: 0 },
  { id: "braids7", name: "Braids studio [7]", planLabel: "Website + Booking · plan starts at launch", plan: true, startsAtLaunch: true, capHours: 0 },
  { id: "studio9", name: "Studio [9]", planLabel: "Standard Website · no plan", plan: false, startsAtLaunch: false, capHours: 0 },
];

const ev = (id, when, text) => ({ id, kind: "event", who: "System", when, text });

export const TICKETS = [
  {
    id: "tk-041",
    num: "TK-041",
    clientId: "bakery5",
    client: "Bakery [5]",
    subject: "Update holiday hours and add 3 new products",
    type: "Small change",
    status: "Open",
    priority: "Normal",
    assigned: "Demetrius",
    opened: "2h ago",
    openedLong: "today 08:15",
    source: "portal",
    requester: "[Owner 5]",
    requesterEmail: "[owner5@example.com]",
    site: "[bakery5.com]",
    replyDue: "Tomorrow 08:15",
    related: [{ num: "TK-038", id: "tk-038", subject: "Swap hero photo", status: "closed" }],
    watchers: "Demetrius, Chris",
    thread: [
      {
        id: "m_41_1",
        kind: "client",
        who: "[Owner 5]",
        when: "today 08:15",
        text: "Hi, can you change our holiday hours (closed Thanksgiving, open until 2pm the day before) and add the three new pies to the store? Photos are in the portal folder.",
      },
      ev("m_41_2", "today 08:15", "Ticket opened from the portal · assigned to Demetrius · reply due tomorrow 08:15"),
    ],
    time: [{ id: "te_41_1", on: "2026-11-10", what: "Read request, check photos", who: "Demetrius", hours: 0.5 }],
  },
  {
    id: "tk-040",
    num: "TK-040",
    clientId: "detailing4",
    client: "Detailing [4]",
    subject: "Contact form emails going to spam",
    type: "Bug",
    status: "In progress",
    priority: "High",
    assigned: "Geoffrey",
    opened: "Yesterday",
    openedLong: "yesterday 16:42",
    source: "email",
    requester: "[Owner 4]",
    requesterEmail: "[owner4@example.com]",
    site: "[detailing4.com]",
    replyDue: "Today 16:42",
    related: [{ num: "TK-037", id: "tk-037", subject: "Add Google reviews to the home page", status: "closed" }],
    watchers: "Geoffrey, Chris",
    thread: [
      {
        id: "m_40_1",
        kind: "client",
        who: "[Owner 4]",
        when: "yesterday 16:42",
        text: "Hey, two customers said they filled the form and I never got it. Found three in spam today. Can you fix it before the weekend? Screenshot attached.",
        file: "spam-folder.png",
      },
      ev("m_40_2", "yesterday 16:42", "Ticket opened from the portal · assigned to Geoffrey · reply due today 16:42"),
      {
        id: "m_40_3",
        kind: "team",
        who: "Geoffrey",
        when: "yesterday 17:10",
        text: "On it. Looks like the form sends from a Gmail address through our server, so Gmail flags it. We will add SPF and DKIM for the domain and send from a hello@ address on it instead. Should be done tomorrow morning; nothing you need to do.",
      },
      {
        id: "m_40_4",
        kind: "internal",
        who: "Geoffrey",
        when: "yesterday 17:12",
        text: "Registrar login is in the client folder. DNS TTL is 1h so test after lunch. 0.5 h so far.",
      },
      ev("m_40_5", "yesterday 17:12", "Status → In progress · 0.5 h logged"),
      {
        id: "m_40_6",
        kind: "client",
        who: "[Owner 4]",
        when: "today 09:05",
        text: "Thank you! Yes please, the weekend is our busiest.",
      },
    ],
    time: [
      { id: "te_40_1", on: "2026-11-09", what: "Diagnosis, DNS check", who: "Geoffrey", hours: 0.5 },
      { id: "te_40_2", on: "2026-11-10", what: "SPF + DKIM records", who: "Geoffrey", hours: 1 },
    ],
  },
  {
    id: "tk-039",
    num: "TK-039",
    clientId: "bakery5",
    client: "Bakery [5]",
    subject: "Which payment methods show at checkout?",
    type: "Question",
    status: "Waiting on client",
    priority: "Normal",
    assigned: "Chris",
    opened: "2d ago",
    openedLong: "Nov 8 10:20",
    source: "text, logged by Chris",
    requester: "[Owner 5]",
    requesterEmail: "[owner5@example.com]",
    site: "[bakery5.com]",
    replyDue: "Paused while waiting",
    related: [],
    watchers: "Chris",
    thread: [
      {
        id: "m_39_1",
        kind: "client",
        who: "[Owner 5]",
        when: "Nov 8 10:20",
        text: "Texted Chris: can customers pay with Apple Pay and Cash App at checkout, or only cards?",
      },
      ev("m_39_2", "Nov 8 10:25", "Ticket logged by Chris from a text · assigned to Chris"),
      {
        id: "m_39_3",
        kind: "team",
        who: "Chris",
        when: "Nov 8 11:02",
        text: "Cards and Apple Pay are on today through your Stripe account. Cash App Pay is one switch in your Stripe settings. Do you want it on?",
      },
      ev("m_39_4", "Nov 8 11:02", "Status → Waiting on client"),
    ],
    time: [{ id: "te_39_1", on: "2026-11-08", what: "Checked Stripe settings", who: "Chris", hours: 0.3 }],
  },
  {
    id: "tk-038",
    num: "TK-038",
    clientId: "bakery5",
    client: "Bakery [5]",
    subject: "Swap hero photo",
    type: "Small change",
    status: "Closed",
    priority: "Normal",
    assigned: "Demetrius",
    opened: "4d ago",
    openedLong: "Nov 6 14:00",
    source: "portal",
    requester: "[Owner 5]",
    requesterEmail: "[owner5@example.com]",
    site: "[bakery5.com]",
    replyDue: "Closed",
    related: [],
    watchers: "Demetrius",
    thread: [
      { id: "m_38_1", kind: "client", who: "[Owner 5]", when: "Nov 6 14:00", text: "Can we use the new window photo on the home page instead?" },
      ev("m_38_2", "Nov 6 14:00", "Ticket opened from the portal · assigned to Demetrius"),
      { id: "m_38_3", kind: "team", who: "Demetrius", when: "Nov 6 15:10", text: "Done. The new photo is live on the home page." },
      ev("m_38_4", "Nov 6 15:10", "Closed · rating request sent"),
    ],
    time: [{ id: "te_38_1", on: "2026-11-06", what: "Crop, compress, swap", who: "Demetrius", hours: 0.5 }],
  },
  {
    id: "tk-037",
    num: "TK-037",
    clientId: "detailing4",
    client: "Detailing [4]",
    subject: "Add Google reviews to the home page",
    type: "Small change",
    status: "Closed",
    priority: "Normal",
    assigned: "Geoffrey",
    opened: "6d ago",
    openedLong: "Oct 30 11:00",
    source: "portal",
    requester: "[Owner 4]",
    requesterEmail: "[owner4@example.com]",
    site: "[detailing4.com]",
    replyDue: "Closed",
    related: [],
    watchers: "Geoffrey",
    thread: [
      { id: "m_37_1", kind: "client", who: "[Owner 4]", when: "Oct 30 11:00", text: "Could you show our Google reviews on the home page?" },
      ev("m_37_2", "Oct 30 11:00", "Ticket opened from the portal · assigned to Geoffrey"),
      { id: "m_37_3", kind: "team", who: "Geoffrey", when: "Oct 30 16:30", text: "Added a reviews strip under the hero. Let us know if you want it moved." },
      ev("m_37_4", "Oct 30 16:30", "Closed · rating request sent"),
    ],
    time: [{ id: "te_37_1", on: "2026-10-30", what: "Reviews strip", who: "Geoffrey", hours: 1 }],
  },
];

export function monthOf(iso) {
  return iso.slice(0, 7);
}

export function usedHoursFor(clientId, tickets = TICKETS, today = SAMPLE_TODAY) {
  const m = monthOf(today);
  return Math.round(tickets.filter((t) => t.clientId === clientId).reduce((a, t) => a + t.time.filter((e) => monthOf(e.on) === m).reduce((x, e) => x + e.hours, 0), 0) * 10) / 10;
}

export function getSupportClients(tickets = TICKETS) {
  return SUPPORT_CLIENTS.map((c) => ({ ...c, usedHours: usedHoursFor(c.id, tickets) }));
}

export function ticketHours(t) {
  return Math.round(t.time.reduce((a, e) => a + e.hours, 0) * 10) / 10;
}

export function getTicket(id) {
  return TICKETS.find((t) => t.id === id) || null;
}

export function getTicketsPayload() {
  return { tickets: TICKETS, clients: getSupportClients(), today: SAMPLE_TODAY };
}
