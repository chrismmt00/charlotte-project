// SAMPLE DATA for /admin/outreach and /admin/outreach/demo/[id] until the back end ships its routes.
// Every business and person is a bracketed placeholder. Claude drafts; a person approves every email
// and demo before anything is sent.
//
// GET /api/admin/outreach -> {
//   stats: { foundToday, dailyGoal, sentWeek, repliesWeek, contactsWeek, weeklyGoal: [65, 95] },
//   queue: Approval[], run: { ranAt, finishedAt, log: { t, text }[], brief }, prospects: Prospect[],
//   calls: Call[], scripts: Script[], partners: Partner[]
// }
//   Approval: { id, kind: "email"|"demo", prospectId, business, to, when, subject, body, attach, demoId? }
//   Prospect: { id, business, kind, area, site, offerCode, offer, phase, owner, last, lastWhen, next, found, why: string[],
//               activity: { who, text, when }[] (oldest first) }
//   Call: { id, prospectId, why, best, script }
//   Script: { id, title, length, lines: { k, t }[] }
//   Partner: { id, name, type, last, overdue, referrals, signed, owner }
// GET /api/admin/outreach/demos/[id] (read by the demo page) -> { demo: Demo }
//   Demo: { id, prospectId, business, status: "ready"|"building", url, offerCode, step, startedAt, tagline, hoursLine,
//           services: { n, p }[], sources: { k, v }[], to, note }

import { getOffer, money } from "@/lib/offers";

export const PHASES = [
  "Found",
  "Researched",
  "Email drafted",
  "Emailed",
  "Replied",
  "Demo in progress",
  "Demo ready for review",
  "Demo sent",
  "Call booked",
  "Became a lead",
  "Not a fit",
];

export const PHASE_TONE = {
  Found: "muted",
  Researched: "muted",
  "Email drafted": "accent",
  Emailed: "accent",
  Replied: "accent",
  "Demo in progress": "accent",
  "Demo ready for review": "warning",
  "Demo sent": "fg",
  "Call booked": "fg",
  "Became a lead": "success",
  "Not a fit": "muted",
};

export const OUTREACH_OWNERS = ["Claude", "Chris", "Geoffrey", "Demetrius"];

const wb = getOffer("WB");
const ai = getOffer("AI");

export const PROSPECTS = [
  {
    id: "pr_1", business: "Barbershop [A]", kind: "Barbershop", area: "[Neighborhood]", site: "None · Instagram only", offerCode: "WB",
    phase: "Email drafted", owner: "Claude", last: "Drafted intro email", lastWhen: "Today 8:04", next: "Chris approves the email", found: "Today",
    why: ["No website; booking happens by DM", "Google rating [x.x] with [n] reviews", "Posts hours changes on Instagram weekly"],
    activity: [
      { who: "Claude", text: "Found via Google Maps search “barbers [Neighborhood]”", when: "Today 8:01" },
      { who: "Claude", text: "Checked for a site, booking link and reviews", when: "Today 8:02" },
      { who: "Claude", text: "Drafted intro email with a Website + Booking demo offer", when: "Today 8:04" },
    ],
  },
  {
    id: "pr_2", business: "Taqueria [B]", kind: "Restaurant", area: "[Neighborhood]", site: "Delivery apps only", offerCode: "RC",
    phase: "Demo in progress", owner: "Geoffrey", last: "Building demo ordering page from their menu", lastWhen: "Yesterday", next: "Send demo link by Friday", found: "4d ago",
    why: ["On two delivery apps, no direct ordering", "Menu is a photo on Instagram", "Lunch line most days"],
    activity: [
      { who: "Claude", text: "Found via Google Maps search “tacos [Neighborhood]”", when: "4d ago" },
      { who: "Claude", text: "Drafted intro email", when: "4d ago" },
      { who: "Chris", text: "Approved and sent", when: "4d ago" },
      { who: "Claude", text: "Reply received: “send me something to look at”", when: "2d ago" },
      { who: "Geoffrey", text: "Started demo: ordering page with their menu", when: "Yesterday" },
    ],
  },
  {
    id: "pr_3", business: "Nail salon [C]", kind: "Salon", area: "[Neighborhood]", site: "Outdated · not mobile", offerCode: "BK",
    phase: "Emailed", owner: "Claude", last: "Intro email sent", lastWhen: "2d ago", next: "Follow up in 3 days if no reply", found: "3d ago",
    why: ["Site from [year], not mobile-friendly", "Books by phone and text", "Active on Instagram"],
    activity: [
      { who: "Claude", text: "Found via Instagram hashtag #[neighborhood]nails", when: "3d ago" },
      { who: "Claude", text: "Drafted intro email", when: "3d ago" },
      { who: "Chris", text: "Approved and sent", when: "2d ago" },
    ],
  },
  {
    id: "pr_4", business: "Detailing [D]", kind: "Auto detailing", area: "[Neighborhood]", site: "None", offerCode: "W1",
    phase: "Call booked", owner: "Chris", last: "Call booked for [date]", lastWhen: "Today", next: "Chris takes the call, then proposal", found: "1w ago",
    why: ["No website; Facebook page only", "Takes bookings by text", "Mobile service, wide service area"],
    activity: [
      { who: "Claude", text: "Found via Facebook search", when: "1w ago" },
      { who: "Chris", text: "Approved and sent intro email", when: "6d ago" },
      { who: "Claude", text: "Reply received, asked for a call", when: "3d ago" },
      { who: "Chris", text: "Booked a 30-minute call for [date]", when: "Today" },
    ],
  },
  {
    id: "pr_5", business: "Boutique [E]", kind: "Retail", area: "[Neighborhood]", site: "Marketplace only", offerCode: "EC",
    phase: "Demo sent", owner: "Demetrius", last: "Sent demo store link", lastWhen: "Yesterday", next: "Wait for feedback; follow up Monday", found: "1w ago",
    why: ["Sells on a marketplace that takes a cut", "Posts new stock on Instagram daily", "No checkout of their own"],
    activity: [
      { who: "Claude", text: "Found via marketplace shop search", when: "1w ago" },
      { who: "Chris", text: "Approved and sent intro email", when: "6d ago" },
      { who: "Claude", text: "Reply received", when: "4d ago" },
      { who: "Demetrius", text: "Built demo store with 6 of their products", when: "2d ago" },
      { who: "Demetrius", text: "Sent demo link", when: "Yesterday" },
    ],
  },
  {
    id: "pr_6", business: "Bakery [F]", kind: "Bakery", area: "[Neighborhood]", site: "Outdated", offerCode: "EC",
    phase: "Became a lead", owner: "Chris", last: "Converted to lead", lastWhen: "3d ago", next: "In Leads: proposal sent", found: "2w ago",
    why: ["Takes pre-orders by phone", "Site has no ordering", "Sells out weekends"],
    activity: [
      { who: "Claude", text: "Found via Google Maps", when: "2w ago" },
      { who: "Chris", text: "Approved and sent intro email", when: "2w ago" },
      { who: "Claude", text: "Reply received", when: "10d ago" },
      { who: "Chris", text: "Converted to lead", when: "3d ago" },
    ],
  },
  {
    id: "pr_7", business: "Gym [G]", kind: "Fitness", area: "[Neighborhood]", site: "Good site", offerCode: "AI",
    phase: "Researched", owner: "Claude", last: "Site is fine; missed-call text-back may fit", lastWhen: "Today 8:09", next: "Claude drafts an AI automation email", found: "Today",
    why: ["Good site already", "Reviews mention unanswered calls", "Trial sign-up is a phone call"],
    activity: [
      { who: "Claude", text: "Found via Google Maps", when: "Today 8:07" },
      { who: "Claude", text: "Researched: site is fine, calls go unanswered after 7pm", when: "Today 8:09" },
    ],
  },
  {
    id: "pr_8", business: "Cafe [H]", kind: "Cafe", area: "[Neighborhood]", site: "Good site", offerCode: null,
    phase: "Not a fit", owner: "Claude", last: "Already on a full POS bundle with ordering", lastWhen: "5d ago", next: "No action", found: "5d ago",
    why: ["Has ordering through a POS bundle", "Site is current"],
    activity: [
      { who: "Claude", text: "Found via Google Maps", when: "5d ago" },
      { who: "Claude", text: "Researched: already covered. Marked not a fit", when: "5d ago" },
    ],
  },
  {
    id: "pr_9", business: "Barbershop [I]", kind: "Barbershop", area: "[Neighborhood]", site: "None", offerCode: "WB",
    phase: "Found", owner: "Claude", last: "Found, not yet researched", lastWhen: "Today 8:11", next: "Claude researches tomorrow", found: "Today",
    why: ["No website found"],
    activity: [{ who: "Claude", text: "Found via Google Maps", when: "Today 8:11" }],
  },
  {
    id: "pr_10", business: "Food truck [J]", kind: "Food truck", area: "[Neighborhood]", site: "None · Instagram only", offerCode: "WB",
    phase: "Replied", owner: "Claude", last: "Reply received: interested in catering bookings", lastWhen: "Today", next: "Chris decides: demo or call", found: "1w ago",
    why: ["Catering requests by DM", "Location posted daily on Instagram"],
    activity: [
      { who: "Claude", text: "Found via Instagram", when: "1w ago" },
      { who: "Chris", text: "Approved and sent intro email", when: "5d ago" },
      { who: "Claude", text: "Reply received", when: "Today" },
    ],
  },
  {
    id: "pr_11", business: "Salon [K]", kind: "Salon", area: "[Neighborhood]", site: "None · books by text", offerCode: "WB",
    phase: "Demo ready for review", owner: "Claude", last: "Built demo: booking page with their services", lastWhen: "Today 8:20", next: "Chris reviews the demo, then it goes out", found: "6d ago",
    why: ["No website; books by text", "Price list is a photo on Instagram", "Replied: “what would it look like?”"],
    activity: [
      { who: "Claude", text: "Found via Instagram", when: "6d ago" },
      { who: "Chris", text: "Approved and sent intro email", when: "5d ago" },
      { who: "Claude", text: "Reply received: “what would it look like?”", when: "2d ago" },
      { who: "Chris", text: "Assigned the demo to Claude", when: "2d ago" },
      { who: "Claude", text: "Built a demo booking page with their 6 services and hours. Waiting for review.", when: "Today 8:20" },
    ],
  },
].map((p) => ({ ...p, offer: p.offerCode ? getOffer(p.offerCode).name : "None" }));

const SIGN = "\n\nIf it’s useful, reply with a good time and we’ll take it from there.\n\n[Your name]\nKlyvora · Charlotte, NC";

export const QUEUE = [
  {
    id: "ap_1", kind: "demo", prospectId: "pr_11", demoId: "dm_1", business: "Salon [K]", to: "[owner@example.com]", when: "Today 8:20",
    subject: "Demo ready: a booking page for [Salon K]",
    body: "Claude built a one-page demo with their six services, hours and a working booking flow using placeholder prices. Open it, change anything, then approve to send it with a short note.",
    attach: "[demo link] · built from their Instagram",
  },
  {
    id: "ap_2", kind: "email", prospectId: "pr_1", business: "Barbershop [A]", to: "[owner@example.com]", when: "Today 8:04",
    subject: "A booking page for [Barbershop A], no more DMs",
    body: `Hi [First name], we run Klyvora in Charlotte. Your shop has great reviews, but booking happens in your DMs. We build sites with booking and deposits for ${money(wb.setup)} setup, and we can show you a demo with your own services before you decide anything.${SIGN}`,
    attach: "Website + Booking demo",
  },
  {
    id: "ap_3", kind: "email", prospectId: "pr_7", business: "Gym [G]", to: "[owner@example.com]", when: "Today 8:12",
    subject: "Missed calls after 7pm at [Gym G]",
    body: `Hi [First name], a few of your reviews mention calls that don’t get answered in the evening. We set up a text-back that answers, books a trial and hands off to you. ${money(ai.setup)} setup, optional ${money(ai.monthly)}/month plus usage. Happy to show how it would read for your gym.${SIGN}`,
    attach: "Text-back example",
  },
  {
    id: "ap_4", kind: "email", prospectId: "pr_9", business: "Barbershop [I]", to: "[owner@example.com]", when: "Today 8:13",
    subject: "A site for [Barbershop I]",
    body: `Hi [First name], we build sites for Charlotte barbershops with booking and deposits built in. If you want, we’ll make a quick demo with your hours and services; no commitment.${SIGN}`,
    attach: "Website + Booking demo",
  },
];

export const RUN = {
  ranAt: "8:00",
  finishedAt: "8:21",
  summary: "31 seen · 4 new prospects · 1 not a fit · 3 emails drafted · 1 demo built",
  brief: "[NEIGHBORHOODS] · barbers, salons, restaurants, detailers, boutiques · no site, outdated site, or marketplace-only",
  steps: [
    "Reading the search brief and the exclusion list…",
    "Searching Google Maps and Instagram for 5 business types in [NEIGHBORHOODS]…",
    "Checking 31 businesses for a site, booking link and reviews…",
    "Drafting intro emails for the 3 best fits…",
    "Building the demo assigned to Claude…",
  ],
  log: [
    { t: "8:00", text: "Started with the search brief: [NEIGHBORHOODS], 5 business types." },
    { t: "8:01", text: "Searched Google Maps and Instagram. 31 businesses seen, 24 already tracked or excluded." },
    { t: "8:07", text: "4 new prospects added. 1 marked not a fit (already has ordering)." },
    { t: "8:13", text: "3 intro emails drafted and placed in the approval queue." },
    { t: "8:14", text: "Flagged Food truck [J]: reply received overnight. Needs a decision from Chris." },
    { t: "8:20", text: "Built the demo booking page for Salon [K], as assigned. Waiting for review." },
  ],
};

export const CALLS = [
  { id: "cl_1", prospectId: "pr_10", why: "Replied today: interested in catering bookings", best: "After 2pm (lunch rush ends)", script: "sc_1" },
  { id: "cl_2", prospectId: "pr_4", why: "Call booked for [date]; confirm the time", best: "Morning", script: "sc_1" },
  { id: "cl_3", prospectId: "pr_3", why: "Emailed 2d ago, no reply", best: "Tue–Sat 10–12", script: "sc_2" },
  { id: "cl_4", prospectId: "pr_5", why: "Demo sent yesterday; ask what they thought", best: "Afternoon", script: "sc_3" },
  { id: "cl_5", prospectId: "pr_2", why: "Geoffrey needs their real menu prices for the demo", best: "Before 11am", script: "sc_1" },
];

export const SCRIPTS = [
  {
    id: "sc_1", title: "Intro call (cold)", length: "45 seconds",
    lines: [
      { k: "Open:", t: "“Hi, is this [First name]? This is [Your name] with Klyvora, we build websites for Charlotte shops. Got 30 seconds?”" },
      { k: "Why them:", t: `“We were looking at [Business] online. You’ve got [x] reviews, but booking happens through DMs. We fix exactly that: a site with booking and deposits, ${money(wb.setup)} to build, and the monthly plan is optional.”` },
      { k: "Offer:", t: "“Before you decide anything, we can make a quick demo with your services and hours. Can we send it to the email on your Google listing?”" },
      { k: "Close:", t: "Confirm email, promise the demo in 2 business days, log the call here." },
    ],
  },
  {
    id: "sc_2", title: "Follow-up call (no reply)", length: "30 seconds",
    lines: [
      { k: "Open:", t: "“Hi [First name], [Your name] from Klyvora. We sent a note a few days ago about a booking page for [Business]; wanted to make sure it didn’t land in spam.”" },
      { k: "Ask:", t: "“Is the DM booking still eating your evenings, or did that sort itself out?”" },
      { k: "Exit:", t: "If no: “No problem, we’ll leave it there.” Mark not a fit. If maybe: offer the demo again." },
    ],
  },
  {
    id: "sc_3", title: "Demo follow-up", length: "2 minutes",
    lines: [
      { k: "Open:", t: "“Did you get a chance to open the demo? What did you think of the booking flow?”" },
      { k: "Listen:", t: "Write down exactly what they want changed; that becomes the proposal scope." },
      { k: "Money:", t: `“Build is ${money(wb.setup)}, half to start. The monthly is ${money(wb.monthly)} for hosting, the admin and support, and you can skip it and take the code.” (Restaurants: monthly required, say why: ordering and menu updates.)` },
      { k: "Close:", t: "“Want us to send the proposal so you can look at it tonight?” Convert to lead." },
    ],
  },
  {
    id: "sc_4", title: "Walk-in visit", length: "5 minutes",
    lines: [
      { k: "Timing:", t: "Mid-afternoon, never during a rush. Bring the tablet with the demo." },
      { k: "Open:", t: "“Hi, I’m [Your name], we build sites for shops in [Neighborhood]. Is the owner around for two minutes?”" },
      { k: "Show:", t: "Open their demo on the tablet. Let them tap through the booking." },
      { k: "Leave:", t: "A card and the demo link. Log the visit before you drive off." },
    ],
  },
];

export const PARTNER_TYPES = ["Printer", "Accountant", "Supplier", "Realtor", "Banker", "Other"];

export const PARTNERS = [
  { id: "pt_1", name: "[Print shop]", type: "Printer", last: "3d ago", overdue: false, referrals: 4, signed: 1, owner: "Chris" },
  { id: "pt_2", name: "[Bookkeeper]", type: "Accountant", last: "12d ago", overdue: false, referrals: 2, signed: 1, owner: "Chris" },
  { id: "pt_3", name: "[Barber supply]", type: "Supplier", last: "41d ago", overdue: true, referrals: 1, signed: 0, owner: "Geoffrey" },
  { id: "pt_4", name: "[Food distributor rep]", type: "Supplier", last: "9d ago", overdue: false, referrals: 3, signed: 0, owner: "Demetrius" },
  { id: "pt_5", name: "[Commercial realtor]", type: "Realtor", last: "33d ago", overdue: true, referrals: 0, signed: 0, owner: "Chris" },
];

export const STATS = { foundToday: 4, dailyGoal: 10, sentWeek: 14, repliesWeek: 4, contactsWeek: 48, weeklyGoal: [65, 95] };

// GET /api/admin/outreach
export function getOutreach() {
  return { stats: STATS, queue: QUEUE, run: RUN, prospects: PROSPECTS, calls: CALLS, scripts: SCRIPTS, partners: PARTNERS };
}

export const DEMOS = [
  {
    id: "dm_1",
    prospectId: "pr_11",
    approvalId: "ap_1",
    business: "Salon [K]",
    status: "ready",
    url: "[demo-salon-k.klyvora.site]",
    offerCode: "WB",
    to: "[owner@example.com]",
    step: 5,
    startedAt: "8:14",
    tagline: "Book your next appointment in thirty seconds.",
    hoursLine: "Tue–Sat 9–6 · [Street], Charlotte · walk-ins when open",
    services: [
      { n: "Haircut", p: "$[x]" },
      { n: "Color", p: "from $[x]" },
      { n: "Blowout", p: "$[x]" },
      { n: "Highlights", p: "from $[x]" },
      { n: "Treatment", p: "$[x]" },
      { n: "Kids", p: "$[x]" },
    ],
    sources: [
      { k: "Name and area", v: "Google Maps listing" },
      { k: "Hours", v: "Google Maps · Tue–Sat" },
      { k: "Services", v: "Instagram price-list photo (6 items)" },
      { k: "Photos", v: "2 from Instagram · credit shown" },
      { k: "Offer", v: `Website + Booking · ${money(wb.setup)} · optional ${money(wb.monthly)}/mo` },
    ],
  },
];

DEMOS.push({
  id: "dm_2",
  prospectId: "pr_10",
  approvalId: null,
  business: "Food truck [J]",
  status: "building",
  url: "[demo-food-truck-j.klyvora.site]",
  offerCode: "WB",
  to: "[owner@example.com]",
  step: 3,
  startedAt: "8:14",
  tagline: "",
  hoursLine: "",
  services: [],
  sources: [],
});

export const BUILD_STEPS = [
  { label: "Read the prospect record", note: "name, area, hours, offer" },
  { label: "Collect public material", note: "Google Maps listing, 2 Instagram photos, price-list photo" },
  { label: "Write the page", note: "headline, services, hours, booking flow" },
  { label: "Build and check", note: "mobile, contrast, links, no real payments" },
  { label: "Place in the queue", note: "bell + approval card" },
];

export function getDemo(id) {
  return DEMOS.find((d) => d.id === id) || null;
}
