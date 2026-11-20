// Public commercial catalog, in USD. Existing signed offers and billing stay in offers.js / the database.
// Services are commissioned projects: design, configuration, testing, and access are delivered within the agreed scope.
// Internal implementation and launch checks are tracked in docs/MARKETING-OVERHAUL.md, not advertised as product status.
export const INDUSTRIES = [
  {
    id: "restaurants",
    name: "Restaurants & Cafes",
    setup: 2000,
    monthly: 249,
    title:
      "Your website, online orders, and restaurant operations in one place.",
    seo: "Restaurant Websites & Ordering Systems | Klyvora Studio",
    summary: "Online ordering, digital menus, kiosks, and order management.",
    description:
      "Give customers an easier way to order directly from your restaurant while keeping your menu, incoming orders, and staff tools connected. Bring your online ordering experience and day-to-day restaurant management together, with support for compatible tablets and additional hardware as your business grows.",
    outcomes: [
      "Take pickup orders directly",
      "Keep your menu and availability current",
      "Give staff one place to manage orders",
    ],
    features: [
      "Custom-designed restaurant website",
      "Digital menu with pricing and item options",
      "Online ordering for pickup",
      "Centralized order management",
      "Menu and availability controls",
      "Tablet-friendly staff and owner dashboard",
      "Self-service kiosk software",
      "Basic kitchen order workflow",
      "Employee accounts and permissions",
      "Customer and sales records",
      "Basic reporting",
      "Initial software and device configuration",
    ],
    hardware: [
      "Additional ordering tablets",
      "Table-mounted ordering devices",
      "Kitchen display screens",
      "Kitchen ticket and receipt printers",
      "Back-office computers",
      "Compatible payment terminals",
      "Equipment mounts and installation",
      "Supported existing POS integrations",
      "Additional locations",
    ],
    tablet: true,
    fit: "Designed for cafés, takeout restaurants, food trucks, and counter-service businesses. Full-service POS replacement, complex table service, and specialized payment terminals require a separate assessment.",
    caution:
      "One included tablet is configured for the agreed kiosk or staff role. Simultaneous physical stations need additional equipment. Proprietary POS hardware compatibility must be verified.",
    cta: "Discuss Your Restaurant Setup",
  },
  {
    id: "daycare",
    name: "Daycare & Childcare",
    setup: 999,
    monthly: 199,
    title: "Keep your childcare center organized and parents connected.",
    seo: "Daycare Management & Parent Portals | Klyvora Studio",
    summary:
      "Parent communication, activity tracking, attendance, and pickup workflows.",
    description:
      "Bring daily activities, family communication, attendance, and childcare operations into one carefully configured platform. Give parents a convenient way to stay informed and provide teachers and administrators with tools designed around their responsibilities.",
    outcomes: [
      "Keep families informed",
      "Organize classroom and attendance records",
      "Define staff-confirmed pickup workflows",
    ],
    features: [
      "Custom-designed daycare website",
      "Private parent and guardian portal",
      "Child profiles and classroom records",
      "Attendance and check-in/check-out records",
      "Authorized pickup verification workflow",
      "Daily activity updates",
      "Meals and nap records",
      "Parent-teacher communication",
      "Photo sharing with appropriate permissions",
      "Staff accounts and management",
      "Basic tuition and payment records",
      "Administration dashboard",
      "Initial system configuration",
    ],
    hardware: [
      "Security cameras, subject to separate assessment",
      "Additional classroom tablets",
      "Reception displays",
      "Door-access hardware",
      "Additional check-in stations",
      "Compatible camera integrations",
      "Multi-location management",
    ],
    tablet: true,
    demo: "/demo/daycare",
    fit: "For childcare centers that want a professional website, clearer family communication, and better organized daily records. We shape the setup around your classrooms, staff responsibilities, and parent communication needs.",
    caution:
      "A PIN or QR code alone must never authorize release of a child. Pickup requires verified authorization, staff confirmation, appropriate identity checks, applicable custody restrictions, and an auditable handoff. Software does not replace staff supervision or guarantee child safety.",
    dataCare:
      "Child records, photos, guardian information, and messages need appropriate access permissions and retention policies. These are defined during your project, with review under applicable privacy and childcare requirements. Camera access, video retention, and door-access integrations are assessed and quoted separately.",
    cta: "Explore Childcare Solutions",
  },
  {
    id: "beauty",
    name: "Beauty & Wellness",
    setup: 999,
    monthly: 99,
    title: "Make booking easier and keep your day running smoothly.",
    seo: "Salon Booking Websites & Management | Klyvora Studio",
    summary:
      "Online booking, walk-ins, staff scheduling, and customer management.",
    description:
      "Give customers a professional website where they can book services, choose available staff, and manage appointments. Behind the scenes, keep scheduling, walk-ins, customer information, and team activity organized in one place.",
    outcomes: [
      "Make appointments easier to book",
      "Coordinate staff and walk-ins",
      "Keep customer information together",
    ],
    features: [
      "Custom-designed website",
      "Online appointment booking",
      "Services, prices, and durations",
      "Employee selection and schedules",
      "Deposits through a supported payment provider",
      "Customer profiles and client booking portal",
      "Appointment reminders",
      "Walk-in check-in and queue",
      "Technician assignments and rotation",
      "Basic employee earnings and tip records",
      "Business management dashboard",
      "Initial setup and configuration",
    ],
    hardware: [
      "Additional check-in tablets",
      "Checkout devices",
      "Waiting-room displays",
      "Receipt printers",
      "Extra workstations",
      "Compatible existing payment equipment",
    ],
    tablet: true,
    demo: "/demo/beauty",
    fit: "For nail salons, barbershops, hair salons, lash studios, beauty studios, spas, and wellness businesses that want a website with their own identity and better daily coordination.",
    caution:
      "We configure your services, staff schedules, booking rules, and supported payment provider around your business. Your proposal confirms the setup and any messaging or processing charges.",
    cta: "Build Your Salon System",
  },
  {
    id: "ecommerce",
    name: "Ecommerce & Retail",
    setup: 999,
    monthly: 99,
    title: "A storefront built for your brand. Tools to manage every order.",
    seo: "Custom Ecommerce Websites & Store Management | Klyvora Studio",
    summary: "Custom online stores, checkout, inventory, and order management.",
    description:
      "Sell products through a custom-designed online store with an easy way to manage inventory, customer orders, and business operations. Keep the shopping experience and the tools behind it connected without managing a collection of unrelated systems.",
    outcomes: [
      "Create a storefront with your own identity",
      "Keep orders and stock organized",
      "Offer supported shipping or pickup",
    ],
    features: [
      "Custom ecommerce website",
      "Product catalog",
      "Product options and variations",
      "Shopping cart",
      "Secure checkout through a supported provider",
      "Order management",
      "Basic inventory tracking",
      "Customer accounts and records",
      "Basic shipping or pickup configuration",
      "Sales dashboard",
      "Mobile-friendly storefront",
      "Initial store setup",
    ],
    hardware: [
      "Retail checkout tablets",
      "Barcode scanners",
      "Receipt printers",
      "Physical inventory stations",
      "Additional retail locations",
      "Specialized shipping integrations",
      "Existing inventory or POS integrations",
    ],
    tablet: false,
    fit: "For independent brands and retailers that value custom presentation and guided store setup. Product entry, variations, shipping rules, and any migration are defined in the proposal.",
    caution:
      "We configure checkout, inventory, and shipping or pickup rules around your store and supported payment provider. No physical tablet is included by default.",
    cta: "Launch Your Online Store",
  },
].map((item) => ({
  ...item,
  href: `/solutions/${item.id}`,
  kind: "industry",
  monthlyRequired: true,
}));

export const CUSTOM_SERVICES = [
  {
    id: "websites",
    name: "Custom Websites",
    setup: 999,
    monthly: 49,
    href: "/websites",
    summary: "A professional website built around your business.",
    cta: "Start Website Project",
    features: [
      "Custom responsive design",
      "Up to five standard pages",
      "Mobile-friendly navigation",
      "Contact form",
      "Business information and service sections",
      "Basic on-page SEO setup",
      "Basic performance optimization",
      "Domain connection assistance",
      "Two consolidated design revision rounds",
      "Launch testing",
    ],
  },
  {
    id: "automation",
    name: "AI Automation",
    setup: 499,
    monthly: 49,
    href: "/ai-software#automation",
    summary:
      "Practical automations that reduce repetitive administrative work.",
    cta: "Discuss an Automation",
    features: [
      "Lead follow-ups",
      "Customer inquiry routing",
      "Missed-call follow-up where supported",
      "Appointment reminders",
      "Customer support assistance",
      "Email workflows",
      "Review request automation",
      "Business workflow integrations",
    ],
  },
  {
    id: "software",
    name: "Custom Software & AI Apps",
    setup: 2499,
    monthly: null,
    href: "/ai-software#custom-software",
    summary:
      "Dedicated applications and integrations for specialized workflows.",
    cta: "Discuss a Custom Project",
    features: [
      "Custom web applications",
      "Business dashboards",
      "Internal management tools",
      "Proprietary customer portals",
      "Advanced API integrations",
      "Custom AI agents",
      "Workflow automation systems",
      "Software extensions",
    ],
  },
].map((item) => ({ ...item, kind: "custom", setupFrom: true }));

export const SERVICES = [...INDUSTRIES, ...CUSTOM_SERVICES];
export const serviceById = (id) =>
  SERVICES.find((service) => service.id === id);
export const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

// Marketing offer only. Base rates, signed proposals, subscriptions, and billing are unchanged.
// Customer eligibility is confirmed in the proposal; no unverified remaining-spots count is exposed.
// Disable after the first ten qualifying customers have claimed the offer.
export const LAUNCH_OFFER = {
  active: true,
  discountPercent: 50,
  customerLimit: 10,
};
export const setupPrice = (service, offer = LAUNCH_OFFER) =>
  offer.active
    ? Math.round(service.setup * 100 * (1 - offer.discountPercent / 100)) / 100
    : service.setup;
export const launchHeadline = () =>
  `${LAUNCH_OFFER.discountPercent}% off setup for our first ${LAUNCH_OFFER.customerLimit} customers.`;
export const launchQualifier = () =>
  `Launch offer · first ${LAUNCH_OFFER.customerLimit} customers · setup fees only.`;
export const launchDetails = () =>
  `To celebrate our launch, our first ${LAUNCH_OFFER.customerLimit} customers across all services receive ${LAUNCH_OFFER.discountPercent}% off the agreed one-time setup fee. Monthly subscriptions, usage charges, and separately quoted hardware or third-party costs are not discounted. We confirm eligibility, scope, and the discounted setup fee in your written proposal. Your spot is reserved when the proposal is signed and the kickoff payment is received. Submitting an inquiry alone does not reserve a spot. Payment milestones apply to the discounted setup fee.`;
export const launchMetadata = (description) =>
  LAUNCH_OFFER.active
    ? `${description} Launch offer: ${LAUNCH_OFFER.discountPercent}% off setup for the first ${LAUNCH_OFFER.customerLimit} customers. Monthly fees unchanged.`
    : description;
export const quoteHref = (service) => `/contact?service=${service.id}`;
export function recurringLabel(service) {
  if (service.kind === "industry")
    return `${money(service.monthly)}/month software subscription`;
  if (service.id === "websites")
    return `Optional managed hosting and maintenance from ${money(service.monthly)}/month`;
  if (service.id === "automation")
    return `Managed plans from ${money(service.monthly)}/month + usage`;
  return "Hosting and maintenance quoted by scope";
}
export const ADDITIONAL_COSTS =
  "Additional hardware, specialized integrations, payment processing, messaging usage, third-party subscriptions, additional locations, and onsite installation may cost extra. We’ll confirm any additional charges before work begins.";
export const STANDARD_SCOPE = [
  "One business or brand, one location, and one main domain",
  "Up to five standard website pages and one primary design direction",
  "Responsive desktop and mobile layouts",
  "Basic SEO metadata and a standard contact form",
  "Two consolidated design revision rounds",
  "Standard launch testing and a 14-day correction period for defects relative to the approved scope",
];
export const PROCESS = [
  [
    "Tell us what you need",
    "Share your business, existing website, and the tools or equipment you currently use.",
  ],
  [
    "Get a clear proposal",
    "We define your website, software configuration, compatible hardware, pricing, and project scope.",
  ],
  [
    "We build and configure",
    "Klyvora designs your website, connects the required software, and tests the agreed workflow.",
  ],
  [
    "Launch with support",
    "We help you get started and maintain the hosted software through your subscription.",
  ],
];
export const PUBLIC_PAGES = [
  "/",
  "/solutions",
  ...INDUSTRIES.map((s) => s.href),
  "/websites",
  "/ai-software",
  "/pricing",
  "/contact",
  "/about",
  ...INDUSTRIES.filter((s) => s.demo).map((s) => s.demo),
];
