export const FAQ = {
  setup: {
    q: "Why is the setup price lower than traditional custom software?",
    a: "Klyvora builds and maintains reusable business software instead of developing every system from scratch. Your website is customized, while the underlying platform is shared and continually improved.",
  },
  monthly: {
    q: "Do I need to pay monthly?",
    a: "Industry Solutions require an active software subscription. Standalone website clients can choose an optional managed hosting plan. Custom software and AI services have their own hosting and maintenance terms.",
  },
  hardware: {
    q: "Can I use my current tablets or equipment?",
    a: "Yes, when the equipment is compatible. We’ll review what you already have before recommending replacements or additional devices. Any adjustment for using your own equipment is agreed in your proposal; hardware credits are not automatic.",
  },
  design: {
    q: "Is my website custom-designed?",
    a: "Yes. We design the customer-facing website around your brand within the agreed project scope. The business management software behind it uses Klyvora’s shared platform.",
  },
  revisions: {
    q: "How many revisions are included?",
    a: "Two consolidated design revision rounds are included. A final prelaunch review covers bugs, missing agreed content, and factual corrections. Additional pages, a new design direction, or new features are separately quoted. After launch, a 14-day correction period covers defects relative to the approved scope.",
  },
  data: {
    q: "Who owns my business data?",
    a: "Your domain, branding, content, customer records, and business data remain yours. Client-specific website deliverables transfer according to your agreement. Klyvora retains its reusable software platform and modules. Your agreement defines data exports and when hosted access ends after cancellation; hosted functionality requires an active subscription.",
  },
  fees: {
    q: "Are there additional fees?",
    a: "Payment processing, additional hardware, third-party services, messaging usage, specialized integrations, and larger installations may incur additional costs. We disclose them in your proposal.",
  },
  expand: {
    q: "Can I add more locations or equipment later?",
    a: "Yes, subject to the capabilities of your industry solution and hardware compatibility. Additional requirements receive an updated quote.",
  },
  existing: {
    q: "Can you work with my existing website?",
    a: "We can review your existing website and determine whether a redesign, integration, or custom configuration is the best option. Compatibility and scope are assessed before quoting.",
  },
};
export const faqs = (...keys) => keys.map((key) => FAQ[key]);
