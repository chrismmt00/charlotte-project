// Sample data for the nail salon demo. Everything here is invented for the demo:
// the salon, people, prices and numbers are placeholders a real salon replaces with its own.

export const SALON = {
  name: "Lumi Nail Studio",
  short: "Lumi",
  url: "lumi-nails.com",
  phone: "(704) 555-0142",
};

// Demo clock: the demo always runs on "today" at 2:10 PM so it renders the same everywhere.
export const NOW = 310; // minutes after 9:00 AM

export function clock(min) {
  const total = 9 * 60 + min;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export const CATEGORIES = ["Manicures", "Pedicures", "Enhancements", "Extras"];

export const SERVICES = [
  {
    id: "gel-mani",
    name: "Gel Manicure",
    cat: "Manicures",
    mins: 45,
    price: 40,
    blurb: "Shape, cuticle care and long-wear gel colour.",
  },
  {
    id: "classic-mani",
    name: "Classic Manicure",
    cat: "Manicures",
    mins: 30,
    price: 25,
    blurb: "Shape, cuticle care and regular polish.",
  },
  {
    id: "deluxe-pedi",
    name: "Deluxe Spa Pedicure",
    cat: "Pedicures",
    mins: 60,
    price: 55,
    blurb: "Soak, scrub, mask, hot towels and polish.",
  },
  {
    id: "classic-pedi",
    name: "Classic Pedicure",
    cat: "Pedicures",
    mins: 40,
    price: 35,
    blurb: "Soak, shape, cuticle care and polish.",
  },
  {
    id: "acrylic",
    name: "Acrylic Full Set",
    cat: "Enhancements",
    mins: 75,
    price: 60,
    senior: 5,
    blurb: "Full set with your choice of shape and length.",
  },
  {
    id: "gelx",
    name: "Gel-X Extensions",
    cat: "Enhancements",
    mins: 75,
    price: 65,
    senior: 5,
    blurb: "Soft gel extensions, lightweight and natural.",
  },
  {
    id: "fill",
    name: "Acrylic Fill",
    cat: "Enhancements",
    mins: 45,
    price: 40,
    blurb: "Rebalance and refresh your set.",
  },
  {
    id: "art",
    name: "Nail Art",
    cat: "Extras",
    mins: 20,
    price: 15,
    from: true,
    blurb: "Hand-painted details, chrome or charms.",
  },
  {
    id: "removal",
    name: "Gel or Acrylic Removal",
    cat: "Extras",
    mins: 15,
    price: 10,
    blurb: "Gentle soak-off before your new service.",
  },
];

export const UPGRADES = [
  { id: "chrome", name: "Chrome finish", price: 10 },
  { id: "french", name: "French tips", price: 8 },
  { id: "paraffin", name: "Paraffin wax treatment", price: 8 },
  { id: "charms", name: "Charms (per nail)", price: 3 },
];

export const svc = (id) => SERVICES.find((s) => s.id === id);
export const svcNames = (ids) => ids.map((id) => svc(id)?.name).join(" + ");
export const svcMins = (ids) =>
  ids.reduce((t, id) => t + (svc(id)?.mins || 0), 0);
export const svcPrice = (ids, techId) =>
  ids.reduce((t, id) => {
    const s = svc(id);
    if (!s) return t;
    return t + s.price + (s.senior && tech(techId)?.senior ? s.senior : 0);
  }, 0);

export const TECHS = [
  {
    id: "mia",
    name: "Mia",
    role: "Lead technician",
    tone: "rose",
    senior: true,
    skills: ["Nail art", "Gel-X", "Acrylic"],
    station: "Station 1",
    commission: 55,
  },
  {
    id: "tina",
    name: "Tina",
    role: "Nail technician",
    tone: "lilac",
    skills: ["Acrylic", "Gel-X", "Manicures"],
    station: "Station 2",
    commission: 50,
  },
  {
    id: "ana",
    name: "Ana",
    role: "Pedicure specialist",
    tone: "peach",
    skills: ["Pedicures", "Manicures"],
    station: "Spa chair 1",
    commission: 50,
  },
  {
    id: "jess",
    name: "Jess",
    role: "Nail technician",
    tone: "mint",
    skills: ["Manicures", "Pedicures"],
    station: "Station 3",
    commission: 45,
  },
];

export const tech = (id) => TECHS.find((t) => t.id === id);

export const STATUSES = {
  waiting: { label: "Waiting", tone: "peach" },
  assigned: { label: "Assigned", tone: "lilac" },
  service: { label: "In service", tone: "rose" },
  checkout: { label: "Ready for checkout", tone: "gold" },
  done: { label: "Completed", tone: "mint" },
  booked: { label: "Booked", tone: "plain" },
  break: { label: "Break", tone: "plain" },
};
export const NEXT_STATUS = {
  waiting: "assigned",
  assigned: "service",
  booked: "service",
  service: "checkout",
  checkout: "done",
};

// Today's appointments. `start` is minutes after 9:00 AM.
export const APPOINTMENTS = [
  {
    id: "a1",
    start: 30,
    client: "Brianna T.",
    services: ["deluxe-pedi"],
    tech: "ana",
    status: "done",
    paid: 66,
  },
  {
    id: "a2",
    start: 60,
    client: "Sofia L.",
    services: ["gel-mani"],
    tech: "mia",
    status: "done",
    paid: 48,
  },
  {
    id: "a3",
    start: 75,
    client: "Nia C.",
    services: ["acrylic"],
    tech: "tina",
    status: "done",
    paid: 72,
  },
  {
    id: "a4",
    start: 120,
    client: "Keisha B.",
    services: ["acrylic", "art"],
    tech: "mia",
    status: "done",
    paid: 98,
  },
  {
    id: "a5",
    start: 150,
    client: "Rachel G.",
    services: ["classic-mani", "classic-pedi"],
    tech: "jess",
    status: "done",
    paid: 70,
  },
  { id: "b1", start: 225, kind: "break", tech: "mia", mins: 30 },
  {
    id: "a6",
    start: 255,
    client: "Amara J.",
    services: ["gelx", "art"],
    tech: "mia",
    status: "service",
    design: "bloom",
    note: "Wants the flower design from the photo on two accent nails.",
  },
  {
    id: "a7",
    start: 270,
    client: "Lauren P.",
    services: ["gel-mani"],
    tech: "tina",
    status: "service",
    firstVisit: true,
  },
  {
    id: "a8",
    start: 390,
    client: "Hannah K.",
    services: ["gel-mani"],
    tech: "mia",
    status: "booked",
    group: "Hannah’s bridal party · 3 guests",
    deposit: 30,
  },
  {
    id: "a9",
    start: 390,
    client: "Hannah’s guest",
    services: ["gel-mani"],
    tech: "tina",
    status: "booked",
    group: "Hannah’s bridal party · 3 guests",
  },
  {
    id: "a10",
    start: 390,
    client: "Hannah’s guest",
    services: ["classic-mani"],
    tech: "jess",
    status: "booked",
    group: "Hannah’s bridal party · 3 guests",
  },
  {
    id: "a11",
    start: 480,
    client: "Jordan E.",
    services: ["fill"],
    tech: "mia",
    status: "booked",
    deposit: 20,
  },
  {
    id: "a12",
    start: 390,
    client: "Imani S.",
    services: ["deluxe-pedi"],
    tech: "ana",
    status: "booked",
    deposit: 20,
  },
  { id: "b2", start: 240, kind: "break", tech: "jess", mins: 20 },
];

// Walk-ins already in the queue when the demo opens.
export const QUEUE = [
  {
    id: "w1",
    name: "Destiny M.",
    services: ["deluxe-pedi"],
    pref: "ana",
    arrived: 280,
    status: "service",
    tech: "ana",
    station: "Spa chair 1",
  },
  {
    id: "w2",
    name: "Kayla R.",
    services: ["removal", "gel-mani"],
    pref: "any",
    arrived: 298,
    status: "waiting",
    texts: true,
  },
  {
    id: "w3",
    name: "Gabby O.",
    services: ["classic-pedi"],
    pref: "jess",
    arrived: 304,
    status: "waiting",
    outside: true,
    texts: true,
  },
];

// The signed-in client in the client app.
export const ME = {
  name: "Jasmine",
  full: "Jasmine W.",
  points: 340,
  goal: 500,
  prefs: {
    shape: "Almond",
    length: "Medium",
    colors: ["nude", "milk", "chrome"],
    notes: "Sensitive cuticles. Prefers a soft file and no metal pusher.",
  },
  upcoming: [
    {
      id: "u1",
      day: "Sat, Nov 21",
      time: "11:00 AM",
      services: ["gelx", "art"],
      tech: "mia",
      deposit: 20,
      confirmed: false,
    },
  ],
  history: [
    {
      id: "h1",
      day: "Oct 24",
      services: ["gelx", "art"],
      tech: "mia",
      total: 98,
      reviewed: true,
    },
    { id: "h2", day: "Sep 30", services: ["gel-mani"], tech: "mia", total: 52 },
    {
      id: "h3",
      day: "Sep 2",
      services: ["deluxe-pedi"],
      tech: "ana",
      total: 66,
    },
  ],
};

export const SHAPES = [
  "Square",
  "Squoval",
  "Round",
  "Almond",
  "Coffin",
  "Stiletto",
];
export const LENGTHS = ["Short", "Medium", "Long", "Extra long"];
export const SWATCHES = {
  nude: { name: "Nude pink", c: "#e9b8b0" },
  milk: { name: "Milky white", c: "#f6efe9" },
  chrome: {
    name: "Pearl chrome",
    c: "linear-gradient(135deg,#f5f0f5,#d8cfe0 45%,#fff 60%,#cbbfd6)",
  },
  cherry: { name: "Cherry red", c: "#b3203b" },
  lilac: { name: "Soft lilac", c: "#c9b6e4" },
  sage: { name: "Sage", c: "#a9c2a4" },
  mocha: { name: "Mocha", c: "#8a5a4a" },
  black: { name: "Classic black", c: "#231a1f" },
};

export const CLIENTS = [
  {
    id: "c1",
    name: "Jasmine W.",
    phone: "(704) 555-0181",
    visits: 14,
    spend: 1120,
    last: "Oct 24",
    next: "Sat, Nov 21",
    vip: true,
    shape: "Almond",
    colors: ["nude", "milk", "chrome"],
    notes: "Sensitive cuticles. Soft file only.",
    cancels: 0,
    noShows: 0,
    contact: "Text",
  },
  {
    id: "c2",
    name: "Amara J.",
    phone: "(704) 555-0123",
    visits: 6,
    spend: 512,
    last: "Today",
    next: "—",
    shape: "Coffin",
    colors: ["lilac", "chrome"],
    notes: "Loves floral accents.",
    cancels: 1,
    noShows: 0,
    contact: "Text",
  },
  {
    id: "c3",
    name: "Keisha B.",
    phone: "(704) 555-0167",
    visits: 22,
    spend: 1980,
    last: "Today",
    next: "Dec 6",
    vip: true,
    shape: "Coffin",
    colors: ["black", "cherry"],
    notes: "Long length, always adds art.",
    cancels: 0,
    noShows: 0,
    contact: "Email",
  },
  {
    id: "c4",
    name: "Lauren P.",
    phone: "(704) 555-0109",
    visits: 1,
    spend: 0,
    last: "Today",
    next: "—",
    shape: "Round",
    colors: ["nude"],
    notes: "First visit.",
    cancels: 0,
    noShows: 0,
    contact: "Text",
  },
  {
    id: "c5",
    name: "Hannah K.",
    phone: "(704) 555-0155",
    visits: 4,
    spend: 260,
    last: "Aug 30",
    next: "Today 3:30 PM",
    shape: "Almond",
    colors: ["milk"],
    notes: "Wedding Nov 22. Bridal party of 3.",
    cancels: 0,
    noShows: 0,
    contact: "Email",
  },
  {
    id: "c6",
    name: "Brianna T.",
    phone: "(704) 555-0138",
    visits: 9,
    spend: 610,
    last: "Today",
    next: "Dec 14",
    shape: "Square",
    colors: ["sage"],
    notes: "",
    cancels: 2,
    noShows: 1,
    contact: "Text",
  },
  {
    id: "c7",
    name: "Sofia L.",
    phone: "(704) 555-0116",
    visits: 11,
    spend: 640,
    last: "Today",
    next: "Dec 8",
    shape: "Squoval",
    colors: ["cherry"],
    notes: "",
    cancels: 0,
    noShows: 0,
    contact: "Text",
  },
];

export const WEEK = [
  { day: "Tue", sales: 1120, appts: 18, walkins: 6 },
  { day: "Wed", sales: 980, appts: 15, walkins: 7 },
  { day: "Thu", sales: 1340, appts: 21, walkins: 5 },
  { day: "Fri", sales: 1890, appts: 27, walkins: 9 },
  { day: "Sat", sales: 2460, appts: 34, walkins: 12 },
  { day: "Sun", sales: 1210, appts: 16, walkins: 8 },
  { day: "Mon", sales: 1284, appts: 14, walkins: 5 },
];

export const POPULAR = [
  ["Gel Manicure", 48],
  ["Deluxe Spa Pedicure", 31],
  ["Gel-X Extensions", 24],
  ["Acrylic Full Set", 19],
  ["Nail Art", 17],
];

export const TECH_REVENUE = [
  { id: "mia", revenue: 3120, services: 46, tips: 512, rebook: 72 },
  { id: "tina", revenue: 2640, services: 41, tips: 398, rebook: 64 },
  { id: "ana", revenue: 2210, services: 38, tips: 344, rebook: 58 },
  { id: "jess", revenue: 1314, services: 29, tips: 196, rebook: 49 },
];

export const MIA_EARNINGS = {
  days: [
    { day: "Tue", earned: 142, tips: 38 },
    { day: "Wed", earned: 98, tips: 22 },
    { day: "Thu", earned: 176, tips: 41 },
    { day: "Fri", earned: 214, tips: 58 },
    { day: "Sat", earned: 268, tips: 74 },
    { day: "Sun", earned: 0, tips: 0 },
    { day: "Mon", earned: 81, tips: 24 },
  ],
  done: [
    {
      time: "10:00 AM",
      client: "Sofia L.",
      service: "Gel Manicure",
      price: 40,
      tip: 8,
    },
    {
      time: "11:00 AM",
      client: "Keisha B.",
      service: "Acrylic Full Set + Nail Art",
      price: 80,
      tip: 18,
    },
  ],
};

export const INVENTORY = [
  {
    id: "i1",
    name: "Gel top coat",
    kind: "Supply",
    qty: 3,
    par: 6,
    unit: "bottles",
  },
  {
    id: "i2",
    name: "Acetone, 1 gal",
    kind: "Supply",
    qty: 2,
    par: 3,
    unit: "jugs",
  },
  {
    id: "i3",
    name: "Nail files, 100/180",
    kind: "Supply",
    qty: 140,
    par: 100,
    unit: "files",
  },
  {
    id: "i4",
    name: "Pedicure liners",
    kind: "Supply",
    qty: 22,
    par: 50,
    unit: "liners",
  },
  {
    id: "i5",
    name: "Gel-X tips, almond M",
    kind: "Supply",
    qty: 4,
    par: 4,
    unit: "boxes",
  },
  {
    id: "i6",
    name: "Cuticle oil pen",
    kind: "Retail",
    qty: 18,
    par: 10,
    unit: "pens",
    price: 12,
  },
  {
    id: "i7",
    name: "Shea hand cream",
    kind: "Retail",
    qty: 5,
    par: 8,
    unit: "tubes",
    price: 18,
  },
  {
    id: "i8",
    name: "Glass nail file",
    kind: "Retail",
    qty: 11,
    par: 6,
    unit: "files",
    price: 15,
  },
];

export const FEATURE_REQUESTS = [
  {
    id: "f1",
    title: "Chair assignment on the waiting-room screen",
    status: "Shipped",
    body: "Show which station each walk-in should go to when they’re called.",
    reply: "Live now. Station names come from Team → Stations.",
  },
  {
    id: "f2",
    title: "Bridal party package",
    status: "In progress",
    body: "One booking link for a bride and up to 6 guests with a group deposit.",
    reply: "Building the group deposit step. Preview link coming Friday.",
  },
];

export const RECEIPTS = [
  {
    id: "r1",
    client: "Keisha B.",
    items: [
      ["Acrylic Full Set (Mia)", 65],
      ["Nail Art", 15],
    ],
    tip: 18,
    method: "Card •• 4242",
  },
  {
    id: "r2",
    client: "Sofia L.",
    items: [["Gel Manicure", 40]],
    tip: 8,
    method: "Card •• 1881",
  },
  {
    id: "r3",
    client: "Brianna T.",
    items: [["Deluxe Spa Pedicure", 55]],
    tip: 11,
    method: "Tap to pay",
  },
];
