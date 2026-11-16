// Sample data for the daycare demo. The center, families, children, staff and numbers are
// invented placeholders. No real child data or photos are used: children appear as initials.

export const CENTER = {
  name: "Bright Burrow Childcare",
  short: "Bright Burrow",
  location: "South End",
  url: "brightburrow-care.com",
  phone: "(704) 555-0160",
};

// The demo runs on Monday, November 16 at 12:40 PM. Times are minutes after midnight.
export const NOW = 760;
export const TODAY = "Mon, Nov 16";
export function at(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export const ROOMS = [
  {
    id: "caterpillars",
    name: "Caterpillars",
    ages: "6 weeks – 12 months",
    capacity: 6,
    ratio: 4,
    tone: "mint",
    icon: "smile",
  },
  {
    id: "ladybugs",
    name: "Ladybugs",
    ages: "12 – 24 months",
    capacity: 8,
    ratio: 6,
    tone: "coral",
    icon: "heart",
  },
  {
    id: "bumblebees",
    name: "Bumblebees",
    ages: "2 years",
    capacity: 10,
    ratio: 8,
    tone: "sun",
    icon: "sun",
  },
  {
    id: "butterflies",
    name: "Butterflies",
    ages: "3 – 5 years",
    capacity: 14,
    ratio: 10,
    tone: "lilac",
    icon: "sparkle",
  },
];
export const room = (id) => ROOMS.find((r) => r.id === id);

export const STAFF = [
  {
    id: "rosa",
    name: "Ms. Rosa",
    full: "Rosa Alvarez",
    role: "Lead teacher",
    room: "butterflies",
    med: true,
    certs: [
      ["CPR & First Aid", "Mar 2027"],
      ["Medication administration", "Jun 2027"],
    ],
    hours: 31.5,
  },
  {
    id: "ben",
    name: "Mr. Ben",
    full: "Ben Okafor",
    role: "Assistant teacher",
    room: "butterflies",
    med: false,
    certs: [["CPR & First Aid", "Dec 4, 2026", "soon"]],
    hours: 28,
  },
  {
    id: "kim",
    name: "Ms. Kim",
    full: "Kim Nguyen",
    role: "Lead teacher",
    room: "ladybugs",
    med: true,
    certs: [
      ["CPR & First Aid", "Aug 2027"],
      ["Medication administration", "Feb 2027"],
    ],
    hours: 32,
  },
  {
    id: "andre",
    name: "Mr. Andre",
    full: "Andre Wallace",
    role: "Assistant teacher",
    room: "ladybugs",
    med: false,
    certs: [["CPR & First Aid", "May 2027"]],
    hours: 24,
  },
  {
    id: "grace",
    name: "Ms. Grace",
    full: "Grace Lee",
    role: "Lead teacher",
    room: "bumblebees",
    med: true,
    certs: [["CPR & First Aid", "Oct 2027"]],
    hours: 33,
  },
  {
    id: "dana",
    name: "Ms. Dana",
    full: "Dana Mills",
    role: "Infant lead",
    room: "caterpillars",
    med: true,
    certs: [
      ["CPR & First Aid", "Jan 2027"],
      ["Safe sleep training", "Nov 30, 2026", "soon"],
    ],
    hours: 34,
  },
  {
    id: "li",
    name: "Ms. Li",
    full: "Li Chen",
    role: "Infant teacher",
    room: "caterpillars",
    med: false,
    certs: [["CPR & First Aid", "Apr 2027"]],
    hours: 30,
  },
  {
    id: "priya",
    name: "Ms. Priya",
    full: "Priya Shah",
    role: "Front desk & enrollment",
    room: null,
    med: false,
    certs: [["CPR & First Aid", "Sep 2027"]],
    hours: 36,
  },
  {
    id: "joy",
    name: "Ms. Joy",
    full: "Joy Bennett",
    role: "Director",
    room: null,
    med: true,
    certs: [["Director credential", "2028"]],
    hours: 40,
  },
];
export const staff = (id) => STAFF.find((s) => s.id === id);

// Families. Danielle Carter is the parent signed in to the parent app.
export const FAMILIES = {
  carter: {
    name: "Carter family",
    guardians: [
      {
        name: "Danielle Carter",
        relation: "Parent",
        phone: "(704) 555-0131",
        app: true,
        pin: "2468",
      },
      {
        name: "James Carter",
        relation: "Parent",
        phone: "(704) 555-0148",
        app: true,
      },
    ],
    pickups: [
      {
        name: "Tasha Green",
        relation: "Aunt",
        phone: "(704) 555-0119",
        emergency: true,
      },
    ],
  },
  patel: {
    name: "Patel family",
    guardians: [
      {
        name: "Neha Patel",
        relation: "Parent",
        phone: "(704) 555-0175",
        app: true,
        pin: "1357",
      },
    ],
    pickups: [
      { name: "Raj Patel", relation: "Grandfather", phone: "(704) 555-0176" },
    ],
  },
  brooks: {
    name: "Brooks family",
    guardians: [
      {
        name: "Alicia Brooks",
        relation: "Parent",
        phone: "(704) 555-0190",
        app: true,
        pin: "8642",
      },
    ],
    pickups: [
      {
        name: "Denise Brooks",
        relation: "Grandmother",
        phone: "(704) 555-0191",
      },
    ],
    restriction:
      "Do not release to Marcus Brooks. Court order on file (updated Sep 2026).",
  },
  rivera: {
    name: "Rivera family",
    guardians: [
      {
        name: "Carlos Rivera",
        relation: "Parent",
        phone: "(704) 555-0153",
        app: true,
      },
    ],
    pickups: [],
  },
};

const c = (id, first, last, roomId, age, family, extra = {}) => ({
  id,
  first,
  name: `${first} ${last}.`,
  room: roomId,
  age,
  family,
  status: "in",
  inAt: 450 + ((id.length * 7) % 60),
  inBy: "Parent",
  allergies: [],
  photoOk: true,
  ...extra,
});

export const CHILDREN = [
  c("maya", "Maya", "C", "butterflies", "4 yrs", "carter", {
    inAt: 472,
    inBy: "Danielle Carter",
    allergies: ["Tree nuts"],
    care: "Carries an EpiPen in the front office.",
    comfort: "Stuffed bunny for rest time",
    meds: "EpiPen (epinephrine) authorized for emergencies, signed Aug 2026",
  }),
  c("eli", "Eli", "C", "ladybugs", "18 mos", "carter", {
    inAt: 472,
    inBy: "Danielle Carter",
    care: "Bottle of whole milk at nap.",
    comfort: "Blue blanket",
    napping: true,
  }),
  c("arjun", "Arjun", "P", "bumblebees", "2 yrs", "patel", {
    status: "expected",
    inAt: null,
    inBy: null,
    lateNote: "Doctor’s appointment. Arriving around 12:45 PM.",
    allergies: ["Dairy"],
  }),
  c("noah", "Noah", "B", "butterflies", "4 yrs", "brooks"),
  c("jayden", "Jayden", "T", "butterflies", "5 yrs", "rivera", {
    allergies: ["Seasonal allergies"],
  }),
  c("zoe", "Zoe", "R", "butterflies", "3 yrs", "rivera", { photoOk: false }),
  c("amir", "Amir", "K", "butterflies", "4 yrs", "rivera"),
  c("lily", "Lily", "M", "butterflies", "3 yrs", "rivera", {
    allergies: ["Egg"],
  }),
  c("ava", "Ava", "S", "butterflies", "5 yrs", "rivera"),
  c("lucas", "Lucas", "H", "butterflies", "4 yrs", "rivera", {
    status: "out",
    outAt: 735,
    outBy: "Mom (Erin H.)",
  }),
  c("theo", "Theo", "W", "butterflies", "3 yrs", "rivera", {
    status: "absent",
    inAt: null,
    absentNote: "Out sick (reported by parent at 7:10 AM).",
  }),
  c("mila", "Mila", "J", "ladybugs", "16 mos", "rivera", { napping: true }),
  c("owen", "Owen", "D", "ladybugs", "20 mos", "rivera", { napping: true }),
  c("ivy", "Ivy", "N", "ladybugs", "14 mos", "rivera", {
    napping: true,
    allergies: ["Strawberries"],
  }),
  c("leo", "Leo", "G", "ladybugs", "22 mos", "rivera"),
  c("nora", "Nora", "F", "bumblebees", "2 yrs", "rivera"),
  c("ezra", "Ezra", "L", "bumblebees", "2 yrs", "rivera"),
  c("ruby", "Ruby", "A", "bumblebees", "2 yrs", "rivera", { photoOk: false }),
  c("finn", "Finn", "O", "bumblebees", "2 yrs", "rivera"),
  c("hazel", "Hazel", "Q", "caterpillars", "8 mos", "rivera", {
    napping: true,
  }),
  c("kai", "Kai", "E", "caterpillars", "5 mos", "rivera"),
  c("june", "June", "V", "caterpillars", "10 mos", "rivera", { napping: true }),
];

// Activity log for today. Parents see their own children's entries.
const L = (id, child, time, kind, text, detail, by, extra = {}) => ({
  id,
  child,
  time,
  kind,
  text,
  detail,
  by,
  ...extra,
});
export const LOGS = [
  L(
    "l1",
    "maya",
    472,
    "in",
    "Checked in",
    "Dropped off by Danielle Carter",
    "Ms. Priya",
  ),
  L(
    "l2",
    "maya",
    540,
    "meal",
    "Breakfast",
    "Oatmeal with berries · ate most",
    "Ms. Rosa",
  ),
  L(
    "l3",
    "maya",
    585,
    "activity",
    "Circle time",
    "Letters M and A, and a counting song",
    "Ms. Rosa",
  ),
  L(
    "l4",
    "maya",
    630,
    "activity",
    "Outdoor play",
    "Playground and sandbox · 40 min",
    "Mr. Ben",
  ),
  L(
    "l5",
    "maya",
    635,
    "incident",
    "Small scrape",
    "Scraped knee on the playground. Cleaned and bandaged.",
    "Mr. Ben",
  ),
  L(
    "l6",
    "maya",
    675,
    "photo",
    "Leaf painting",
    "Art time: printing with fall leaves",
    "Ms. Rosa",
    { art: "leaves" },
  ),
  L(
    "l7",
    "maya",
    705,
    "meal",
    "Lunch",
    "Chicken, rice and green beans · ate all",
    "Ms. Rosa",
  ),
  L(
    "l8",
    "maya",
    735,
    "milestone",
    "Wrote first name",
    "Wrote M-A-Y-A on the art sheet without help",
    "Ms. Rosa",
  ),
  L("l9", "maya", 740, "mood", "Mood", "Happy and chatty", "Ms. Rosa"),
  L(
    "e1",
    "eli",
    472,
    "in",
    "Checked in",
    "Dropped off by Danielle Carter",
    "Ms. Priya",
  ),
  L(
    "e2",
    "eli",
    510,
    "meal",
    "Snack",
    "Banana and whole milk · ate all",
    "Ms. Kim",
  ),
  L("e3", "eli", 550, "diaper", "Diaper", "Wet", "Mr. Andre"),
  L(
    "e4",
    "eli",
    600,
    "activity",
    "Music & movement",
    "Shakers and bubbles",
    "Ms. Kim",
    { art: "music" },
  ),
  L("e5", "eli", 640, "diaper", "Diaper", "BM · normal", "Ms. Kim"),
  L("e6", "eli", 660, "meal", "Lunch", "Pasta and peas · ate some", "Ms. Kim"),
  L(
    "e7",
    "eli",
    700,
    "nap",
    "Nap started",
    "Fell asleep at 11:40 AM with blue blanket",
    "Mr. Andre",
    { open: true },
  ),
];

export const KINDS = {
  in: { label: "Check-in", icon: "door", tone: "mint" },
  out: { label: "Pickup", icon: "door", tone: "mint" },
  meal: { label: "Meal", icon: "meal", tone: "sun" },
  nap: { label: "Nap", icon: "moon", tone: "lilac" },
  diaper: { label: "Diaper", icon: "drop", tone: "sky" },
  potty: { label: "Bathroom", icon: "drop", tone: "sky" },
  activity: { label: "Activity", icon: "palette", tone: "coral" },
  mood: { label: "Mood", icon: "smile", tone: "sun" },
  photo: { label: "Photo", icon: "camera", tone: "coral" },
  milestone: { label: "Milestone", icon: "star", tone: "sun" },
  med: { label: "Medication", icon: "pill", tone: "sky" },
  incident: { label: "Incident", icon: "alert", tone: "coral" },
  note: { label: "Note", icon: "chat", tone: "plain" },
  room: { label: "Room change", icon: "pin", tone: "plain" },
};

// One guest pickup already set up by Danielle: Grandma Linda, today only, not yet verified.
export const GUESTS = [
  {
    id: "g1",
    children: ["maya"],
    name: "Linda Carter",
    relation: "Grandmother",
    phone: "(704) 555-0172",
    email: "",
    date: "Mon, Nov 16",
    from: 750,
    to: 810,
    type: "One-time",
    notes: "Taking Maya to a dentist appointment. Please send her rain jacket.",
    by: "Danielle Carter",
    status: "invited",
    code: null,
    photo: null,
    sample: false,
    tries: 0,
  },
];

export const PICKUP_LOG = [
  {
    id: "p1",
    child: "lucas",
    by: "Erin H.",
    relation: "Parent",
    time: 735,
    staff: "Ms. Priya",
    method: "Parent PIN",
  },
  {
    id: "p0",
    child: "noah",
    by: "Alicia Brooks",
    relation: "Parent",
    time: 1050,
    staff: "Ms. Joy",
    method: "Parent PIN",
    day: "Fri, Nov 13",
  },
];
export const FAILED = [
  {
    id: "x1",
    day: "Thu, Nov 12",
    time: 1015,
    child: "noah",
    who: "Adult not on the pickup list",
    what: "Asked for Noah B. Matched a custody restriction. Release refused, director and guardian notified.",
    staff: "Ms. Joy",
  },
];

export const MEDS = [
  {
    id: "m1",
    child: "jayden",
    med: "Children’s cetirizine, 5 mL",
    due: 750,
    auth: "Parent authorization on file (expires Jan 2027)",
    status: "due",
  },
  {
    id: "m2",
    child: "eli",
    med: "Diaper cream, as needed",
    due: null,
    auth: "Parent authorization on file",
    status: "prn",
  },
];

export const INCIDENTS = [
  {
    id: "i1",
    child: "maya",
    time: 635,
    where: "Playground",
    what: "Tripped near the sandbox and scraped her left knee. Cleaned with water, bandage applied. Back to playing within a few minutes.",
    staff: "Mr. Ben",
    witness: "Ms. Rosa",
    ack: false,
  },
];

export const THREADS = {
  teacher: {
    with: "Ms. Rosa · Butterflies",
    messages: [
      {
        from: "them",
        text: "Maya had a little scrape on the playground this morning. She was a champ! Report is in the app.",
        time: 640,
      },
      {
        from: "me",
        text: "Thanks for letting me know! Grandma Linda is picking her up for the dentist at 12:30.",
        time: 655,
      },
      {
        from: "them",
        text: "Got it. We’ll have her rain jacket ready.",
        time: 660,
      },
    ],
  },
  director: {
    with: "Ms. Joy · Director",
    messages: [
      {
        from: "them",
        text: "Hi Danielle, reminder that we’re closed Thanksgiving Thursday and Friday. Have a lovely holiday!",
        time: 545,
      },
    ],
  },
};

export const ANNOUNCEMENTS = [
  {
    id: "a1",
    kind: "Event",
    title: "Fall festival",
    text: "Friday, Nov 20 · 4:00–6:00 PM. Pumpkin painting and hot cider.",
    day: "Nov 20",
  },
  {
    id: "a2",
    kind: "Closure",
    title: "Closed for Thanksgiving",
    text: "Thursday and Friday, Nov 26–27. Back Monday, Nov 30.",
    day: "Nov 26",
  },
  {
    id: "a3",
    kind: "Event",
    title: "Picture day",
    text: "Thursday, Dec 3. Retakes Dec 10.",
    day: "Dec 3",
  },
];

export const PLANS = [
  { room: "caterpillars", monthly: 1480 },
  { room: "ladybugs", monthly: 1360 },
  { room: "bumblebees", monthly: 1240 },
  { room: "butterflies", monthly: 1120 },
];

export const INVOICES = [
  {
    id: "INV-1124",
    period: "December 2026",
    due: "Dec 1",
    lines: [
      ["Maya · Butterflies tuition", 1120],
      ["Eli · Ladybugs tuition", 1360],
      ["Sibling discount (10% on Maya)", -112],
      ["Fall festival T-shirt", 14],
    ],
    status: "open",
  },
  {
    id: "INV-1098",
    period: "November 2026",
    due: "Nov 1",
    lines: [
      ["Maya · Butterflies tuition", 1120],
      ["Eli · Ladybugs tuition", 1360],
      ["Sibling discount (10% on Maya)", -112],
    ],
    status: "paid",
    paidOn: "Oct 30 · Visa •• 4021",
  },
  {
    id: "INV-1071",
    period: "October 2026",
    due: "Oct 1",
    lines: [
      ["Maya · Butterflies tuition", 1120],
      ["Eli · Ladybugs tuition", 1360],
      ["Sibling discount (10% on Maya)", -112],
    ],
    status: "paid",
    paidOn: "Sep 29 · Visa •• 4021",
  },
];

export const APPLICATIONS = [
  {
    id: "ap1",
    child: "Sienna R.",
    age: "9 mos",
    room: "caterpillars",
    start: "Jan 4",
    parent: "Morgan R.",
    status: "New",
    docs: 2,
    docsNeeded: 5,
  },
  {
    id: "ap2",
    child: "Mateo V.",
    age: "3 yrs",
    room: "butterflies",
    start: "Dec 1",
    parent: "Ana V.",
    status: "Tour booked",
    docs: 4,
    docsNeeded: 5,
    tour: "Thu, Nov 19 · 10:00 AM",
  },
  {
    id: "ap3",
    child: "Harper L.",
    age: "15 mos",
    room: "ladybugs",
    start: "Jan 4",
    parent: "Chris L.",
    status: "Waitlist",
    docs: 5,
    docsNeeded: 5,
    spot: 2,
  },
  {
    id: "ap4",
    child: "Elijah W.",
    age: "2 yrs",
    room: "bumblebees",
    start: "Feb 1",
    parent: "Tanya W.",
    status: "Waitlist",
    docs: 3,
    docsNeeded: 5,
    spot: 1,
  },
  {
    id: "ap5",
    child: "Ella P.",
    age: "4 yrs",
    room: "butterflies",
    start: "Dec 1",
    parent: "Sam P.",
    status: "Approved",
    docs: 5,
    docsNeeded: 5,
  },
];

export const WEEK = [
  { day: "Tue", present: 20, enrolled: 22 },
  { day: "Wed", present: 21, enrolled: 22 },
  { day: "Thu", present: 19, enrolled: 22 },
  { day: "Fri", present: 18, enrolled: 22 },
  { day: "Mon", present: 19, enrolled: 22 },
];
export const ENROLLMENT_TREND = [
  ["Jun", 15],
  ["Jul", 16],
  ["Aug", 18],
  ["Sep", 20],
  ["Oct", 21],
  ["Nov", 22],
];
export const DOCUMENTS = [
  {
    id: "d1",
    what: "Immunization record",
    who: "Kai E.",
    status: "Expires Dec 1",
    tone: "peach",
  },
  {
    id: "d2",
    what: "Emergency contact form",
    who: "Ruby A.",
    status: "Missing",
    tone: "rose",
  },
  {
    id: "d3",
    what: "Medication authorization",
    who: "Jayden T.",
    status: "Valid to Jan 2027",
    tone: "mint",
  },
  {
    id: "d4",
    what: "CPR & First Aid",
    who: "Mr. Ben (staff)",
    status: "Expires Dec 4",
    tone: "peach",
  },
  {
    id: "d5",
    what: "Safe sleep training",
    who: "Ms. Dana (staff)",
    status: "Expires Nov 30",
    tone: "peach",
  },
  {
    id: "d6",
    what: "Photo permission",
    who: "Zoe R.",
    status: "Declined by parent",
    tone: "plain",
  },
  {
    id: "d7",
    what: "Custody order",
    who: "Noah B.",
    status: "On file · updated Sep 2026",
    tone: "mint",
  },
];
export const LOCATIONS = [
  {
    id: "south",
    name: "South End",
    enrolled: 22,
    capacity: 38,
    present: 19,
    staff: 9,
    collected: 28410,
    outstanding: 2382,
  },
  {
    id: "univ",
    name: "University",
    enrolled: 31,
    capacity: 42,
    present: 27,
    staff: 11,
    collected: 39880,
    outstanding: 4120,
  },
];

export const childOf = (list, id) => list.find((x) => x.id === id);
export const initials = (name) =>
  name
    .replace(/^(Ms\.|Mr\.)\s*/, "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
