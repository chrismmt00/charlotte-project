// Sample data for the client admin (/app): one sample business per kind, shaped as the back end
// should return it. Names, amounts and dates stay bracketed placeholders, exactly like the board.
// Prices never live here: the plan comes from `offerCode`, looked up in src/lib/offers.js.
//
// The back end replaces this file with:
//   GET /api/app/business            → Business (below, without the per-screen arrays)
//   GET /api/app/bookings?day=<iso>  → { days: Day[], rows: Row[] }      (orders for restaurant/store)
//   GET /api/app/catalog             → { groups: string[], items: Item[] }
//   GET /api/app/site                → { hours: Hour[], notice, info, photos: Photo[], pages: Page[] }
//   GET /api/app/customers?q=        → { totals, rows: Customer[] }
//   GET /api/app/payments            → { tiles, rows: Payment[], payouts: Payout[] }
//   GET /api/app/plan                → { offerCode, usage, invoices: Invoice[], card }
//
// Business: { id, kind: "booking"|"restaurant"|"store", name, initials, owner, offerCode, domain,
//   liveUrl, badges: { bookings }, home: { stats[], today: Row[] }, ... }
// Row: { id, time, who, what, status, amount?, phone? }

export const CURRENT_BUSINESS_KIND = "booking";

const BOOKING_POOL = [
  ["Cut · 45 min", "Deposit paid"],
  ["Cut and beard · 60 min", "Confirmed"],
  ["Kids cut · 30 min", "Deposit paid"],
  ["Lineup · 20 min", "No deposit"],
  ["Cut · 45 min", "Confirmed"],
  ["Hot towel shave · 30 min", "Deposit paid"],
  ["Color · 90 min", "Deposit paid"],
];
const TIMES = ["9:00", "10:00", "11:30", "1:00", "2:00", "3:00", "4:30"];

function dayRows(day, n) {
  return Array.from({ length: n }, (_, i) => {
    const [what, status] = BOOKING_POOL[(i + day) % BOOKING_POOL.length];
    return { id: `bk_${day}_${i}`, time: TIMES[i], who: "[Client]", what, status, phone: "+1" };
  });
}

// Thursday ([4]) is "today" and matches the board row for row.
const THURSDAY = [
  { id: "bk_3_0", time: "9:00", who: "[Client]", what: "Cut · 45 min · booked online", status: "Deposit paid", phone: "+1" },
  { id: "bk_3_1", time: "10:00", who: "[Client]", what: "Cut and beard · 60 min", status: "Confirmed", phone: "+1" },
  { id: "bk_3_2", time: "11:30", who: "[Client]", what: "Kids cut · 30 min", status: "Deposit paid", phone: "+1" },
  { id: "bk_3_3", time: "1:00", who: "[Client]", what: "Lineup · 20 min · walk-in added by you", status: "No deposit", phone: "+1" },
  { id: "bk_3_4", time: "3:00", who: "[Client]", what: "Cut · 45 min", status: "Done", phone: "+1" },
];

export const BOOKING_TODAY = 3;

export const BOOKING_DAYS = [
  { dow: "Mon", num: "[1]", label: "Monday [date]", rows: dayRows(0, 3) },
  { dow: "Tue", num: "[2]", label: "Tuesday [date]", rows: dayRows(1, 5) },
  { dow: "Wed", num: "[3]", label: "Wednesday [date]", rows: dayRows(2, 4) },
  { dow: "Thu", num: "[4]", label: "Thursday [date]", rows: THURSDAY },
  { dow: "Fri", num: "[5]", label: "Friday [date]", rows: dayRows(4, 6) },
  { dow: "Sat", num: "[6]", label: "Saturday [date]", rows: dayRows(5, 7) },
  { dow: "Sun", num: "[7]", label: "Sunday [date]", rows: [], closed: true },
];

export const BOOKING_SERVICES = ["Cut · 45 min", "Cut and beard · 60 min", "Kids cut · 30 min", "Lineup · 20 min"];
export const BOOKING_SLOTS = ["Today 2:00", "Today 2:45", "Today 4:00", "Tomorrow 9:00"];

const CUSTOMERS = [
  { id: "cu_a", name: "[Customer A]", phone: "(704) 555-01[xx]", visits: 7, last: "2 days ago", spent: "$[x]", optIn: true, note: "Prefers a #2 on the sides" },
  { id: "cu_b", name: "[Customer B]", phone: "(704) 555-02[xx]", visits: 3, last: "Last week", spent: "$[x]", optIn: true, note: "" },
  { id: "cu_c", name: "[Customer C]", phone: "(980) 555-03[xx]", visits: 1, last: "[Date]", spent: "$[x]", optIn: false, note: "" },
  { id: "cu_d", name: "[Customer D]", phone: "(704) 555-04[xx]", visits: 12, last: "Yesterday", spent: "$[x]", optIn: true, note: "[Note]" },
  { id: "cu_e", name: "[Customer E]", phone: "(704) 555-05[xx]", visits: 2, last: "3 weeks ago", spent: "$[x]", optIn: false, note: "" },
  { id: "cu_f", name: "[Customer F]", phone: "(980) 555-06[xx]", visits: 5, last: "Today", spent: "$[x]", optIn: true, note: "" },
];

const HOURS = [
  { day: "Mon", open: "09:00", close: "18:00", closed: false },
  { day: "Tue", open: "09:00", close: "18:00", closed: false },
  { day: "Wed", open: "09:00", close: "18:00", closed: false },
  { day: "Thu", open: "09:00", close: "19:00", closed: false },
  { day: "Fri", open: "09:00", close: "19:00", closed: false },
  { day: "Sat", open: "08:00", close: "16:00", closed: false },
  { day: "Sun", open: "", close: "", closed: true },
];

const INFO = {
  name: "[Business name]",
  tagline: "[What you do, in a sentence]",
  phone: "[Phone]",
  email: "[Email]",
  address: "[Street], Charlotte, NC [ZIP]",
  instagram: "@[handle]",
};

const PHOTOS = ["Hero", "[Photo 2]", "[Photo 3]", "[Photo 4]", "[Photo 5]", "[Photo 6]"].map((label, i) => ({
  id: `ph_${i}`,
  label,
  tint: i % 3,
}));

function pages(sectionName, kind) {
  return [
    {
      id: "home",
      name: "Home",
      note: "Headline, intro, photos",
      headline: "[Business name], [neighborhood]’s [what you do].",
      intro:
        kind === "booking"
          ? "Walk-ins welcome, bookings preferred. Pick a time, pay a small deposit, get a reminder the day before."
          : kind === "restaurant"
            ? "[Two or three sentences about the food and how to order.]"
            : "[Two or three sentences about what you sell.]",
      cta: kind === "booking" ? "Book now" : kind === "restaurant" ? "Order online" : "Shop now",
    },
    { id: "section", name: sectionName, note: "Pulled from your list; intro text editable", headline: `${sectionName} · [headline]`, intro: `[Two or three sentences about ${sectionName.toLowerCase()}.]`, cta: "See all" },
    { id: "about", name: "About", note: "Your story and team", headline: "About · [headline]", intro: "[Two or three sentences about your story.]", cta: "Get in touch" },
    { id: "contact", name: "Contact", note: "Hours, map, form", headline: "Contact · [headline]", intro: "[Two or three sentences about how to reach you.]", cta: "Send" },
  ];
}

const PAYOUTS = [
  { id: "po_1", date: "[date]", amount: "$[x]", to: "[bank ••1234]", status: "Scheduled" },
  { id: "po_2", date: "[date]", amount: "$[x]", to: "[bank ••1234]", status: "Paid out" },
  { id: "po_3", date: "[date]", amount: "$[x]", to: "[bank ••1234]", status: "Paid out" },
];

const PLAN_SHARED = {
  usage: { changesUsed: 2, changesCap: "[cap]", changesPct: 40, hoursUsed: "[x]", hoursCap: "[cap]", hoursPct: 25 },
  nextChargeDate: "[date]",
  card: { brand: "[Card]", last4: "[••••]", expires: "[MM/YY]" },
  // Monthly invoices only; the amount is the offer's monthly price from offers.js.
  invoices: [
    { id: "inv_3", number: "[INV-0003]", period: "[Month]", status: "Paid" },
    { id: "inv_2", number: "[INV-0002]", period: "[Month]", status: "Paid" },
    { id: "inv_1", number: "[INV-0001]", period: "[Month]", status: "Paid" },
  ],
  noticePeriod: "[NOTICE PERIOD]",
  endsOn: "[date + notice]",
};

export const BUSINESSES = {
  booking: {
    id: "biz_booking",
    kind: "booking",
    name: "[Business name]",
    initials: "[B]",
    owner: "[First name]",
    offerCode: "WB",
    domain: "[yourbusiness.com]",
    // STUB: the client's live domain. Until there is one, the matching service page.
    liveUrl: "/services/booking",
    badges: { bookings: 3 },
    home: {
      stats: [
        { label: "Bookings this week", value: "14", note: "2 open slots today", emptyNote: "nothing yet", href: "/app/bookings" },
        { label: "Deposits collected", value: "$[x]", note: "to your Stripe account" },
      ],
      today: [
        { id: "t1", time: "9:00", who: "[Client]", what: "Cut · 45 min", status: "Deposit paid", amount: "$[x]" },
        { id: "t2", time: "10:00", who: "[Client]", what: "Cut and beard · 60 min", status: "Confirmed", amount: "$[x]" },
        { id: "t3", time: "11:30", who: "[Client]", what: "Kids cut · 30 min", status: "Deposit paid", amount: "$[x]" },
        { id: "t4", time: "2:00", who: "Open", what: "Nothing booked yet", status: "Open", amount: "" },
      ],
    },
    rules: [
      { id: "r-dep", label: "Deposit per booking", value: "$[x]", hint: "Charged when they book, through your Stripe account" },
      { id: "r-rem", label: "Reminders", value: "Text 24h and 2h before", hint: "Email always; texts use messaging credit" },
      { id: "r-buf", label: "Gap between appointments", value: "10 min", hint: "Applied to online bookings only" },
      { id: "r-cancel", label: "Cancellation window", value: "24 hours", hint: "Inside the window you keep the deposit" },
    ],
    catalog: {
      groups: ["Cuts", "Beard", "Kids", "Color"],
      items: [
        { id: "it_1", group: "Cuts", name: "Cut", desc: "Classic cut with lineup", meta: "45 min", price: "$[x]", visible: true },
        { id: "it_4", group: "Cuts", name: "Lineup", desc: "Edge-up only", meta: "20 min", price: "$[x]", visible: true },
        { id: "it_2", group: "Beard", name: "Cut and beard", desc: "Cut plus beard shape-up", meta: "60 min", price: "$[x]", visible: true },
        { id: "it_6", group: "Beard", name: "Hot towel shave", desc: "Straight razor", meta: "30 min", price: "$[x]", visible: true },
        { id: "it_3", group: "Kids", name: "Kids cut", desc: "Under 12", meta: "30 min", price: "$[x]", visible: true },
        { id: "it_5", group: "Color", name: "Color", desc: "Consultation required", meta: "90 min", price: "from $[x]", visible: true },
      ],
    },
    customers: CUSTOMERS,
    payments: [
      { id: "pay_1", when: "Today 9:02", who: "[Customer A]", what: "Deposit · Cut 10:00", amount: "$[x]", status: "Paid", depositOnly: true },
      { id: "pay_2", when: "Today 8:40", who: "[Customer D]", what: "Deposit · Cut and beard", amount: "$[x]", status: "Paid", depositOnly: true },
      { id: "pay_3", when: "Yesterday", who: "[Customer B]", what: "Deposit · Kids cut", amount: "$[x]", status: "Paid out", depositOnly: true },
      { id: "pay_4", when: "Yesterday", who: "[Customer F]", what: "Deposit · Color", amount: "$[x]", status: "Paid out", depositOnly: true },
      { id: "pay_5", when: "[Date]", who: "[Customer C]", what: "Deposit · Cut", amount: "$[x]", status: "Refunded", depositOnly: true },
      { id: "pay_6", when: "[Date]", who: "[Customer E]", what: "Deposit · Lineup", amount: "$[x]", status: "Paid out", depositOnly: true },
    ],
  },

  restaurant: {
    id: "biz_restaurant",
    kind: "restaurant",
    name: "[Business name]",
    initials: "[B]",
    owner: "[First name]",
    offerCode: "RC",
    domain: "[yourbusiness.com]",
    liveUrl: "/services/restaurants",
    badges: { bookings: 2 },
    home: {
      stats: [
        { label: "Orders today", value: "23", note: "2 waiting in the kitchen", emptyNote: "nothing yet", href: "/app/bookings" },
        { label: "Sales today", value: "$[x]", note: "to your Stripe account" },
      ],
      today: [
        { id: "t1", time: "12:04", who: "Order #118 · pickup", what: "2 tacos al pastor, 1 horchata", status: "Preparing", amount: "$[x]" },
        { id: "t2", time: "12:06", who: "Order #119 · kiosk", what: "Burrito bowl, chips", status: "New", amount: "$[x]" },
        { id: "t3", time: "11:52", who: "Order #117 · pickup", what: "Family pack", status: "Ready", amount: "$[x]" },
        { id: "t4", time: "11:40", who: "Order #116 · pickup", what: "3 tacos, 1 agua fresca", status: "Ready", amount: "$[x]" },
      ],
    },
    orders: [
      { id: "or_119", time: "12:06", who: "Order #119 · kiosk", what: "Burrito bowl, chips, agua fresca", status: "New", amount: "$[x]", phone: "+1" },
      { id: "or_118", time: "12:04", who: "Order #118 · pickup", what: "2 tacos al pastor, 1 horchata", status: "Preparing", amount: "$[x]", phone: "+1" },
      { id: "or_117", time: "11:52", who: "Order #117 · pickup", what: "Family pack", status: "Ready", amount: "$[x]", phone: "+1" },
      { id: "or_116", time: "11:40", who: "Order #116 · pickup", what: "3 tacos, 1 agua fresca", status: "Picked up", amount: "$[x]", phone: "+1" },
      { id: "or_115", time: "11:31", who: "Order #115 · kiosk", what: "Quesadilla, chips", status: "Picked up", amount: "$[x]", phone: "+1" },
    ],
    rules: [
      { id: "r-prep", label: "Pickup time quoted", value: "15 min", hint: "Shown at checkout; raise it when the kitchen is slammed" },
      { id: "r-min", label: "Minimum order", value: "$[x]", hint: "Online only" },
      { id: "r-tip", label: "Tip options", value: "15 · 18 · 20%", hint: "Kiosk and online" },
      { id: "r-close", label: "Stop online orders", value: "20 min before close", hint: "Kiosk keeps running until you lock it" },
    ],
    catalog: {
      groups: ["Tacos", "Burritos and bowls", "Sides", "Drinks", "Family packs"],
      items: [
        { id: "it_1", group: "Tacos", name: "Taco al pastor", desc: "Pork, pineapple, onion, cilantro", meta: "Tacos", price: "$[x]", visible: true },
        { id: "it_2", group: "Tacos", name: "Carne asada taco", desc: "Grilled steak", meta: "Tacos", price: "$[x]", visible: true },
        { id: "it_3", group: "Burritos and bowls", name: "Burrito bowl", desc: "Rice, beans, protein, salsa", meta: "Burritos and bowls", price: "$[x]", visible: true },
        { id: "it_4", group: "Sides", name: "Chips and salsa", desc: "House salsa", meta: "Sides", price: "$[x]", visible: true },
        { id: "it_5", group: "Drinks", name: "Horchata", desc: "16 oz", meta: "Drinks", price: "$[x]", visible: true },
        { id: "it_6", group: "Family packs", name: "Family pack", desc: "12 tacos, rice, beans", meta: "Family packs", price: "$[x]", visible: true },
      ],
    },
    customers: CUSTOMERS,
    payments: [
      { id: "pay_1", when: "12:06", who: "Kiosk", what: "Order #119", amount: "$[x]", status: "Paid" },
      { id: "pay_2", when: "12:04", who: "[Customer]", what: "Order #118 · pickup", amount: "$[x]", status: "Paid" },
      { id: "pay_3", when: "11:52", who: "[Customer]", what: "Order #117 · pickup", amount: "$[x]", status: "Paid" },
      { id: "pay_4", when: "Yesterday", who: "[Customer]", what: "Order #112", amount: "$[x]", status: "Paid out" },
      { id: "pay_5", when: "Yesterday", who: "Kiosk", what: "Order #109", amount: "$[x]", status: "Refunded" },
      { id: "pay_6", when: "[Date]", who: "[Customer]", what: "Order #101", amount: "$[x]", status: "Paid out" },
    ],
  },

  store: {
    id: "biz_store",
    kind: "store",
    name: "[Business name]",
    initials: "[B]",
    owner: "[First name]",
    offerCode: "EC",
    domain: "[yourbusiness.com]",
    liveUrl: "/services/ecommerce",
    badges: { bookings: 3 },
    home: {
      stats: [
        { label: "Orders this week", value: "9", note: "3 not yet shipped", emptyNote: "nothing yet", href: "/app/bookings" },
        { label: "Sales this week", value: "$[x]", note: "to your Stripe account" },
      ],
      today: [
        { id: "t1", time: "Today", who: "Order #1042", what: "[Product] × 2", status: "New", amount: "$[x]" },
        { id: "t2", time: "Yesterday", who: "Order #1041", what: "[Product] × 1", status: "Shipped", amount: "$[x]" },
        { id: "t3", time: "Yesterday", who: "Order #1040", what: "[Product] × 3", status: "New", amount: "$[x]" },
        { id: "t4", time: "2d ago", who: "Order #1039", what: "[Product] × 1", status: "Shipped", amount: "$[x]" },
      ],
    },
    orders: [
      { id: "or_1042", time: "Today", who: "Order #1042 · [Customer]", what: "[Product] × 2 · ship to [City]", status: "To ship", amount: "$[x]", phone: "+1" },
      { id: "or_1043", time: "Today", who: "Order #1043 · [Customer]", what: "[Product] × 1 · local pickup", status: "New", amount: "$[x]", phone: "+1" },
      { id: "or_1041", time: "Yesterday", who: "Order #1041 · [Customer]", what: "[Product] × 1", status: "Shipped", amount: "$[x]", phone: "+1" },
      { id: "or_1040", time: "Yesterday", who: "Order #1040 · [Customer]", what: "[Product] × 3", status: "To ship", amount: "$[x]", phone: "+1" },
      { id: "or_1039", time: "2d ago", who: "Order #1039 · [Customer]", what: "[Product] × 1", status: "Shipped", amount: "$[x]", phone: "+1" },
    ],
    rules: [
      { id: "r-ship", label: "Flat shipping", value: "$[x]", hint: "Or free over $[x]" },
      { id: "r-pick", label: "Local pickup", value: "On · [address]", hint: "Shown as an option at checkout" },
      { id: "r-tax", label: "Sales tax", value: "Automatic via Stripe Tax", hint: "Set your nexus in Stripe" },
      { id: "r-stock", label: "Low-stock alert", value: "3 left", hint: "Emails you when a product drops below" },
    ],
    catalog: {
      groups: ["New arrivals", "Tops", "Accessories", "Sale"],
      items: [
        { id: "it_1", group: "New arrivals", name: "[Product 1]", desc: "Short description", meta: "12 in stock", price: "$[x]", visible: true },
        { id: "it_2", group: "New arrivals", name: "[Product 2]", desc: "Short description", meta: "3 in stock · low", price: "$[x]", visible: true },
        { id: "it_3", group: "Tops", name: "[Product 3]", desc: "Short description", meta: "Sold out", price: "$[x]", visible: true },
        { id: "it_4", group: "Tops", name: "[Product 4]", desc: "Short description", meta: "20 in stock", price: "$[x]", visible: true },
        { id: "it_5", group: "Accessories", name: "[Product 5]", desc: "Short description", meta: "8 in stock", price: "$[x]", visible: true },
        { id: "it_6", group: "Accessories", name: "[Gift card]", desc: "$[x] to $[x]", meta: "Unlimited", price: "any", visible: true },
      ],
    },
    customers: CUSTOMERS,
    payments: [
      { id: "pay_1", when: "Today", who: "[Customer]", what: "Order #1042", amount: "$[x]", status: "Paid" },
      { id: "pay_2", when: "Today", who: "[Customer]", what: "Order #1043", amount: "$[x]", status: "Paid" },
      { id: "pay_3", when: "Yesterday", who: "[Customer]", what: "Order #1041", amount: "$[x]", status: "Paid out" },
      { id: "pay_4", when: "Yesterday", who: "[Customer]", what: "Order #1040", amount: "$[x]", status: "Paid out" },
      { id: "pay_5", when: "[Date]", who: "[Customer]", what: "Order #1038", amount: "$[x]", status: "Refunded" },
      { id: "pay_6", when: "[Date]", who: "[Customer]", what: "Order #1037", amount: "$[x]", status: "Paid out" },
    ],
  },
};

// Shared by every kind on the sample.
for (const k of Object.keys(BUSINESSES)) {
  const b = BUSINESSES[k];
  b.hours = HOURS;
  b.info = INFO;
  b.photos = PHOTOS;
  b.pages = pages(k === "booking" ? "Services" : k === "restaurant" ? "Menu" : "Shop", k);
  b.payouts = PAYOUTS;
  b.home.messages = 1;
  b.plan = PLAN_SHARED;
}

export function getBusiness(kind) {
  return BUSINESSES[kind] || BUSINESSES[CURRENT_BUSINESS_KIND];
}
