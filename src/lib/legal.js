// Privacy and Terms copy for /privacy and /terms.
// DRAFT: structure and known facts only. Every bracketed value, and the final wording, goes through a lawyer before launch.
// Business rules come from docs/PROJECT-BRIEF.md ("Pricing" and "Ownership", Nov 5, 2026).
import { CONTACT } from "@/lib/site";

export const LEGAL_UPDATED = "[DATE]";

export const LEGAL_DOCS = {
  privacy: {
    href: "/privacy",
    label: "Privacy",
    title: "Privacy policy",
    sections: [
      ["who", "Who we are", [`Klyvora is a software company based in Charlotte, NC. You can reach us at ${CONTACT.email} or [MAILING ADDRESS].`]],
      [
        "collect",
        "What we collect",
        [
          "When you fill out a form on this site: your name, business name, email, phone number, current website and your message. The founding-customer application also asks whether this would be your first website or online store.",
          "When you browse the site: [ANALYTICS TOOL AND WHAT IT RECORDS, IF ANY].",
          "The site remembers your light or dark theme choice in your own browser. That setting is not sent to us.",
        ],
      ],
      [
        "use",
        "How we use it",
        ["To reply to you, prepare proposals, send invoices and support your project.", "[CONFIRM: we do not sell personal information.]"],
      ],
      [
        "share",
        "Who we share it with",
        [
          "Service providers that run the business: Stripe for payments, Brevo for email, Vercel for hosting, Neon for our database and Cloudflare for images and video.",
          "[What each provider receives and where it is stored.]",
        ],
      ],
      ["keep", "How long we keep it", ["[RETENTION PERIOD FOR LEADS, CLIENTS AND INVOICES.]"]],
      [
        "choices",
        "Your choices",
        [
          `Ask us for a copy of your data, a correction or deletion at ${CONTACT.email}.`,
          "Every marketing email has an unsubscribe link, and we honor opt-outs.",
        ],
      ],
      ["changes", "Changes to this policy", ["[HOW WE ANNOUNCE CHANGES.]"]],
    ],
  },
  terms: {
    href: "/terms",
    label: "Terms",
    title: "Terms of service",
    sections: [
      ["who", "Who we are", ["Klyvora is a software company based in Charlotte, NC. [LEGAL ENTITY NAME AND REGISTRATION.]"]],
      [
        "scope",
        "Proposals and scope",
        [
          "Every project starts with a written proposal that sets the scope, price and milestones, and caps pages, design rounds, integrations, hosting, support hours and minor changes.",
          "Substantial new functionality gets a separate quote.",
        ],
      ],
      [
        "pay",
        "Payment",
        [
          "Setup is paid 50% at kickoff, 30% at a working demo you approve and 20% at acceptance of the launch.",
          "Hardware is paid in full before we order it.",
        ],
      ],
      [
        "monthly",
        "The monthly plan",
        [
          "The monthly plan is optional on every offer except the restaurant plans, Restaurant core (RC) and Restaurant core + 1 kiosk (RK), where it is required because online ordering, kiosks and kitchen operations need daily maintenance.",
          "The plan pays for hosting, Klyvora’s client admin (where you run bookings, menus or catalog, site edits, customers and payments), support and small changes, within the caps in your proposal. Where you take a plan, monthly billing starts when you accept the launch.",
          "If you skip the plan, you take the code at final payment and run it yourself. AI and messaging usage is billed whether or not you take a plan.",
        ],
      ],
      [
        "own",
        "Ownership",
        [
          "You always own your domain, branding, content, data, customer list and Stripe account.",
          "Everything built for you transfers to you on final payment: the site, its code and its data. That covers package sites, custom web applications, the client-specific workflow and integrations of an AI harness, and separately quoted features.",
          "Klyvora templates are the one exception. A site built on a Klyvora template uses that template under license; the template itself is not sold and remains Klyvora’s.",
          "The restaurant platform, the booking engine, the kiosk application and the client admin are Klyvora’s and are licensed to you while your monthly plan is active.",
          "[LAWYER TO CONFIRM: Klyvora’s general tools, and improvements to them made during client projects, remain Klyvora’s.]",
        ],
      ],
      [
        "sales",
        "Your sales",
        [
          "We take no cut of your sales. Checkout runs through your own Stripe account, which you control. Stripe charges its processing fee to you directly.",
        ],
      ],
      [
        "separate",
        "Billed separately",
        ["Hardware, onsite installation and travel, payment processing, delivery services, third-party subscriptions, and AI or messaging usage."],
      ],
      [
        "cancel",
        "Cancellation",
        [
          "[NOTICE PERIOD.] If you cancel the monthly plan, you keep the site, its code (except licensed templates and platform) and all of your data, and we provide a full export.",
          "Cancelling stops hosting, the client admin, support and small changes. Template licenses continue.",
          "[CANCELLATION TERMS FOR RESTAURANT PLANS, WHERE THE PLAN IS REQUIRED WHILE THE RESTAURANT PLATFORM IS IN USE.]",
        ],
      ],
      ["liability", "Warranties, liability and disputes", ["[LAWYER TO DRAFT: warranties, limitation of liability, governing law and disputes.]"]],
    ],
  },
};
