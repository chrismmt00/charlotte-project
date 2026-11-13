// Words that change with the kind of business using the client admin (/app).
// One app, three kinds: "booking" (salon, barber, services), "restaurant" (menu, online ordering,
// kiosks) and "store" (products). Source: the ClientShell / Client*.dc.html board scripts.

export const KINDS = ["booking", "restaurant", "store"];

export const KIND_LABEL = {
  booking: "Booking (salon, barber, services)",
  restaurant: "Restaurant (menu, ordering, kiosk)",
  store: "Store (products)",
};

// Sidebar and bottom-sheet navigation. `badge` comes from the business sample (open items).
export function navFor(kind) {
  return [
    { key: "overview", href: "/app", label: "Overview" },
    { key: "bookings", href: "/app/bookings", label: kind === "booking" ? "Bookings" : "Orders", badgeKey: "bookings" },
    {
      key: "catalog",
      href: "/app/catalog",
      label: kind === "booking" ? "Services and prices" : kind === "restaurant" ? "Menu" : "Products",
    },
    { key: "site", href: "/app/site", label: "Hours, info and photos" },
    { key: "customers", href: "/app/customers", label: "Customers" },
    { key: "payments", href: "/app/payments", label: "Payments" },
    { key: "plan", href: "/app/plan", label: "Plan and support" },
  ];
}

export const HOME_COPY = {
  booking: {
    todayTitle: "Today’s bookings",
    quick2: "Add or change a service",
    empty: ["Nothing booked today", "Open slots show on your booking page. Walk-ins can be added under Bookings."],
  },
  restaurant: {
    todayTitle: "Orders right now",
    quick2: "Change the menu or 86 an item",
    empty: ["No orders yet today", "Online ordering opens at your first opening hour. The kiosk is on."],
  },
  store: {
    todayTitle: "Orders to ship",
    quick2: "Add a product or change stock",
    empty: ["No orders this week", "Your store is live. Share the link or run a discount to get the first one."],
  },
};

export const BOOKINGS_COPY = {
  booking: {
    eyebrow: "Bookings · this week",
    title: "Bookings",
    primary: "Block time",
    secondary: "Add a booking",
    rulesTitle: "Booking rules",
    rulesSaved: "Rules saved; the booking page follows in a minute",
    empty: ["Nothing booked on this day", "Open slots are live on your booking page. Add a walk-in here."],
    reschedule: "Reschedule…",
    noShow: "Mark no-show",
    cancel: "Cancel booking…",
    footnote:
      "Online bookings land here with their deposit already paid to your Stripe account. Change hours or close a day under Hours, info and photos; the booking page updates right away.",
  },
  restaurant: {
    eyebrow: "Orders · today",
    title: "Orders",
    primary: "Pause online ordering",
    secondary: "Print today",
    listTitle: "Live orders",
    rulesTitle: "Ordering rules",
    rulesSaved: "Rules saved; checkout follows in a minute",
    empty: ["No orders yet", "Online ordering is on. Orders show here the second they are paid."],
    reschedule: "Print ticket",
    noShow: "Refund…",
    cancel: "Cancel order…",
    footnote:
      "Orders arrive from your site and your kiosk with payment already taken through your Stripe account. The kitchen screen (add-on) shows the same list.",
  },
  store: {
    eyebrow: "Orders · this week",
    title: "Orders",
    primary: "Create a discount",
    secondary: "Export CSV",
    listTitle: "Orders",
    rulesTitle: "Store rules",
    rulesSaved: "Rules saved; checkout follows in a minute",
    empty: ["No orders this week", "Your store is live. Share the link or create a discount to get the first one."],
    reschedule: "Print packing slip",
    noShow: "Refund…",
    cancel: "Cancel order…",
    footnote:
      "Payments go to your own Stripe account; Klyvora takes nothing per order. Shipping labels are bought in Stripe or your carrier’s site.",
  },
};

// Status → [next action label, next status]. A status with no entry has no next step.
export const NEXT_STEP = {
  booking: { "Deposit paid": ["Check in", "Done"], Confirmed: ["Check in", "Done"], "No deposit": ["Mark paid", "Deposit paid"], Done: ["Rebook", null] },
  restaurant: { New: ["Start", "Preparing"], Preparing: ["Ready", "Ready"], Ready: ["Picked up", "Picked up"] },
  store: { New: ["Pack", "To ship"], "To ship": ["Mark shipped", "Shipped"] },
};

// Status → text color class. Admin-only status colors are allowed in the client admin.
export const STATUS_TONE = {
  Confirmed: "text-success",
  "Deposit paid": "text-success",
  Paid: "text-success",
  "No deposit": "text-accent-light",
  New: "text-accent-light",
  "To ship": "text-accent-light",
  Preparing: "text-accent-light",
  Ready: "text-fg",
  Done: "text-muted-2",
  "Picked up": "text-muted-2",
  Shipped: "text-muted-2",
  "Paid out": "text-muted-2",
  "No-show": "text-warning",
  Refunded: "text-warning",
  Open: "text-muted-2",
};

export const CATALOG_COPY = {
  booking: {
    eyebrow: "Services and prices",
    title: "Services",
    add: "Add a service",
    col1: "Service",
    col2: "Length",
    col4: "Bookable online",
    groupsTitle: "Categories",
    groupWord: "category",
    placeholder: ["Cut and beard", "60 min"],
    empty: ["No services yet", "Add your first service and it is bookable the moment you switch it on."],
    tip: "Turn a service off and it disappears from the booking page right away; existing appointments keep it. Prices show on your site exactly as written here.",
  },
  restaurant: {
    eyebrow: "Menu",
    title: "Menu",
    add: "Add an item",
    col1: "Item",
    col2: "Section",
    col4: "Available",
    groupsTitle: "Menu sections",
    groupWord: "section",
    // The section is the group, so the table does not repeat it in a column.
    metaIsGroup: true,
    placeholder: ["Taco al pastor", "Tacos"],
    empty: ["Your menu is empty", "Add items by section. Photos are optional; prices show exactly as written."],
    tip: "Switch an item off to 86 it; the site and the kiosk hide it within a minute. Switch it back on when it’s restocked. Photos and modifiers are under the item’s Edit.",
  },
  store: {
    eyebrow: "Products",
    title: "Products",
    add: "Add a product",
    col1: "Product",
    col2: "Stock",
    col4: "Published",
    groupsTitle: "Collections",
    groupWord: "collection",
    placeholder: ["[Product name]", "12 in stock"],
    empty: ["No products yet", "Add a product with a photo and stock count; checkout runs on your Stripe account."],
    tip: "Stock counts down as orders come in. Unpublish a product to hide it without deleting it. Checkout runs on your Stripe account; Klyvora takes nothing per order.",
  },
};

export const CUSTOMERS_COPY = {
  booking: { verb: "book with you", colVisits: "Bookings", visitWord: "visit", noun: "visitors" },
  restaurant: { verb: "order from you", colVisits: "Orders", visitWord: "order", noun: "diners" },
  store: { verb: "buy from you", colVisits: "Orders", visitWord: "order", noun: "buyers" },
};

export const PAYMENTS_COPY = {
  booking: { takenLabel: "Deposits this week" },
  restaurant: { takenLabel: "Sales today" },
  store: { takenLabel: "Sales this week" },
};

export const PLAN_COPY = {
  booking: {
    exportWhat: "bookings and deposits",
    codeNote: "Everything built for you. Template parts are licensed.",
    careTitle: "Reminders and messaging",
    careText: "Texts use messaging credit, billed separately.",
    stopsLine: "Reminder texts, unless you add your own Twilio account",
  },
  restaurant: {
    exportWhat: "orders and menu",
    codeNote: "Ordering and kiosk code are licensed while the plan runs; your menu, data and content are yours.",
    careTitle: "Daily care for ordering and kiosk",
    careText: "Required on restaurant plans.",
    stopsLine: "Online ordering and kiosk care; the kiosk license ends",
  },
  store: {
    exportWhat: "orders and products",
    codeNote: "Everything built for you. Template parts are licensed.",
    careTitle: "Reminders and messaging",
    careText: "Texts use messaging credit, billed separately.",
    stopsLine: "Low-stock alerts and store monitoring",
  },
};

export function siteSectionName(kind) {
  return kind === "booking" ? "Services" : kind === "restaurant" ? "Menu" : "Shop";
}
