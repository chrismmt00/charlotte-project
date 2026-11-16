// Owner-authorized policy wording. Outstanding legal and operational review
// items are documented in docs/LEGAL-COPY-REVIEW.md; no independent legal review is asserted.
import { CONTACT } from "@/lib/site";

export const LEGAL_UPDATED = "November 16, 2026";

export const LEGAL_DOCS = {
  privacy: {
    href: "/privacy",
    label: "Privacy",
    title: "Privacy policy",
    intro:
      "How Klyvora Studio collects, uses, and handles information when you visit our website, contact us, or use our services.",
    sections: [
      [
        "who",
        "Who we are and what this policy covers",
        [
          `Klyvora Studio ("Klyvora," "we," "us," or "our") is a custom website design and business software company based in Charlotte, North Carolina. For privacy questions or requests, contact ${CONTACT.email}.`,
          "This policy covers our marketing website, business inquiries, client relationships, and information we handle to operate and support our services. A client’s own website or business may have a separate privacy notice. Where we process customer, employee, or other business records on a client’s behalf, the client’s instructions and our written service agreement also apply.",
        ],
      ],
      [
        "collect",
        "Information we collect",
        [
          "Information you provide may include your name, business name, email address, phone number, industry, service interests, current website, existing hardware or software, project description, and messages you send us. During a project, this may also include business content, files, approvals, support requests, and contact details for authorized team members.",
          "For client accounts and billing, we handle information such as account permissions, sign-in records, proposals, invoices, payment status, and payment-provider references. Payment details entered into a supported payment provider’s checkout are handled by that provider. Our application stores payment references and transaction records rather than full payment-card numbers or card security codes.",
          "Our website and infrastructure providers may receive technical information such as your IP address, browser and device details, requested pages or files, timestamps, and error or security logs. We use security-related request information to help detect misuse and limit automated submissions.",
          "Client business records depend on the services commissioned and the agreed scope. Do not send passwords, full card details, private child records, or other sensitive customer or employee information through our general inquiry form.",
        ],
      ],
      [
        "use",
        "How we use information",
        [
          "We use information to respond to inquiries, prepare proposals, manage projects, configure agreed services, provide account access, process billing, communicate updates, and deliver support. We also use it to maintain the website, troubleshoot problems, prevent fraud or abuse, keep business records, and meet applicable obligations.",
          "We do not sell personal information, share it for targeted advertising, or use advertising-tracking tools on this website. Submitting an inquiry does not sign you up for a marketing mailing list. We may send messages about your inquiry, project, account, or billing; these service communications are separate from optional marketing.",
        ],
      ],
      [
        "cookies",
        "Cookies, browser storage, and website images",
        [
          "Protected account areas use cookies and related technologies for sign-in, session security, and essential account functions. The website also uses browser storage to remember your light or dark appearance preference and session-level display settings. Blocking essential cookies can prevent account features from working; clearing browser storage resets saved display preferences.",
          "This website does not use added advertising pixels or visitor-analytics tracking. Pages may load photographs from Unsplash and media or images from Cloudflare. Those providers receive the connection information needed to deliver the requested content, which can include your IP address and browser information. External websites and providers have their own privacy policies.",
        ],
      ],
      [
        "providers",
        "Service providers and other disclosures",
        [
          "We use providers to host the website and application, store business records, send email, process payments, and deliver images or other files. Our service stack includes Vercel for hosting, Neon for database storage, Brevo or the configured email provider for communications, Stripe for supported payments and billing, and Cloudflare for supported media or file services. A provider receives information relevant to its role, such as contact details for email delivery or payment information for checkout.",
          "A commissioned integration or automation may connect to additional providers selected for that project. The permitted data, provider connections, and access permissions are defined in the agreed scope. We do not use client business records to train public AI models as part of our standard services. Any additional AI-related data use must be separately agreed; relevant providers’ processing and retention terms also need to be considered before information is connected.",
          "We may disclose information when required by law or a valid legal process, to address fraud or security incidents, or to protect rights and safety. If a business transaction changes who operates Klyvora or the relevant services, any transfer of personal information must remain subject to applicable obligations and appropriate notice.",
        ],
      ],
      [
        "retention",
        "How long we keep information",
        [
          "If an inquiry does not become a client project, our standard retention period is 12 months after the last meaningful contact. Active client information is kept while needed to provide the agreed services. We retain signed agreements, invoices, payment records, and related accounting or dispute records for up to seven years after the relationship ends or the relevant transaction, unless a longer period is required for an unresolved claim or legal obligation.",
          "After hosted services end, clients may request an export of their business data within 30 days. Unless the agreement specifies otherwise, operational client data and project files are scheduled for deletion from active systems within 90 days after service ends, subject to the records we need to retain for accounting, security, disputes, or applicable obligations. Copies in backups expire under the relevant provider’s configured retention cycle and are restricted to recovery or other necessary purposes.",
          "Routine diagnostic and security records are generally kept for no more than 90 days, unless an incident or investigation requires longer retention. Specific project agreements may require different periods for particular data. Contact us if you need the retention arrangements for a specific record or service.",
        ],
      ],
      [
        "choices",
        "Your choices and privacy requests",
        [
          `You may contact ${CONTACT.email} to ask about information we hold about you, request a correction, request a copy, or ask for deletion. Depending on applicable law and our role in handling the information, additional rights may apply. We may need to verify your identity or authority before acting, and some records may need to be retained for legitimate legal, accounting, security, or dispute-related reasons.`,
          "If your information is held within a client business’s account, contact that business first. We may need its instructions or authorization to change or disclose records it controls. If you have received optional marketing communications, you can use the unsubscribe method provided or contact us; necessary account and service messages may still be sent.",
        ],
      ],
      [
        "security",
        "Security and processing locations",
        [
          "We use authenticated access and account permissions for protected areas, together with safeguards appropriate to the services and information involved. No website, network, or storage system can guarantee absolute security. Protect your sign-in links and account access, limit authorized users, and tell us promptly if you suspect unauthorized access.",
          "Klyvora is based in the United States. Storage and processing locations depend on the providers and services used. Any project-specific requirements for data location, sensitive records, or additional security controls must be identified before the relevant information is connected.",
        ],
      ],
      [
        "children",
        "Children’s information and childcare projects",
        [
          "Our marketing website and general inquiry form are intended for adult business owners and authorized representatives, not children. Children should not submit personal information through these forms. If you believe a child has provided information through our marketing website, contact us so we can review and address it.",
          "A childcare project requires a separate review of the center’s responsibilities, authorized guardian and staff access, appropriate notices and permissions, child and photo records, retention, and any camera or security integration. This general website policy does not by itself establish the permissions or safeguards for a childcare center’s operational records. The required arrangements must be documented before those records are used in the service.",
        ],
      ],
      [
        "changes",
        "Updates and contact",
        [
          "We may update this policy as our services or information practices change. The updated version will show a revised date. If a change materially affects how we handle personal information, we will provide additional notice or seek permission where required. A posted update does not override a signed agreement or remove rights that apply by law.",
          `For questions or privacy requests, email ${CONTACT.email}.`,
        ],
      ],
    ],
  },
  terms: {
    href: "/terms",
    label: "Terms",
    title: "Terms of service",
    intro:
      "Clear expectations for your website project, business software, subscription, and ongoing support.",
    sections: [
      [
        "scope",
        "About these terms and your project agreement",
        [
          `Klyvora Studio ("Klyvora," "we," "us," or "our") provides custom website design, industry-specific business software, automation, and custom application services. Questions about these terms or a project can be sent to ${CONTACT.email}.`,
          "These terms explain our general service policies and use of our website. Purchasing a service requires an agreed written proposal or service agreement covering the specific scope, deliverables, fees, equipment, schedule, support, and responsibilities. Requesting a quote does not purchase a service or create a subscription. If a signed agreement expressly differs from these general policies, that agreement controls for the relevant project, subject to applicable law.",
        ],
      ],
      [
        "delivery",
        "Scope, delivery, and client responsibilities",
        [
          "Starting prices assume one business or brand, one main domain, one location, and a defined standard scope. Standard website packages cover up to five standard pages, one primary design direction, responsive layouts, basic SEO metadata, a standard contact form, and launch testing. Industry setup also covers the configured module, specified equipment, agreed initial data entry, and one remote onboarding session where included in the proposal.",
          "You are responsible for providing accurate business information, content and assets you are entitled to use, authorized access to relevant systems, and timely consolidated feedback. You remain responsible for your products, services, prices, business decisions, customer communications, and permissions to process information you supply.",
          "Design, software configuration, team access, testing, and onboarding are delivered through your project. Timelines depend on the agreed scope, client materials and approvals, supplier availability, and integration requirements. We will discuss material changes rather than assume an unlimited scope or an unapproved delivery date.",
        ],
      ],
      [
        "revisions",
        "Revisions, changes, and launch corrections",
        [
          "Standard website and industry setup packages include two consolidated design revision rounds. The first covers one organized set of feedback on the initial design. The second refines the agreed direction. A revision is an adjustment within that direction; a complete redesign, extra pages, new features, substantial migration, or other scope changes are separately quoted and approved before additional work proceeds.",
          "A final prelaunch review covers bugs, missing agreed content, and factual corrections. After launch, a 14-day correction period covers defects or errors relative to the approved scope. It does not include unlimited redesigns or new change requests and does not limit any remedies that cannot lawfully be excluded.",
        ],
      ],
      [
        "payment",
        "Pricing, payments, and additional charges",
        [
          "Prices are in US dollars. The written proposal confirms the final scope and costs. Unless otherwise agreed, project payments are 50% at kickoff, 30% after an agreed working demonstration, and 20% at final approval and launch. The monthly subscription begins on the agreed service activation date. Additional equipment may require advance payment before ordering.",
          "Additional hardware, extra locations, specialized integrations, onsite installation, payment processing, messaging or AI usage, third-party subscriptions, and applicable taxes may be additional. The proposal identifies relevant charges or the basis on which usage is billed. New work outside the agreed scope requires approval; advertised starting prices do not authorize unlimited development or usage.",
        ],
      ],
      [
        "subscriptions",
        "Subscriptions, hosting, and support",
        [
          "Industry Solutions require an active monthly subscription for access to Klyvora’s hosted business platform. The subscription covers the agreed platform access, hosting, standard software updates, routine maintenance, and defined support. It does not include unlimited custom development or every future feature.",
          "Standalone custom websites can be delivered without a Klyvora software subscription. Managed hosting and maintenance are optional for those websites. Automation and custom applications have their own agreed hosting, maintenance, provider, and usage terms.",
          "Subscriptions renew for the billing period stated in the agreement until cancelled. We will give at least 30 days’ notice of a change to Klyvora’s recurring service fee; agreed fixed-term pricing remains subject to that contract. Third-party or usage-based charges follow the applicable provider and agreed billing arrangement.",
        ],
      ],
      [
        "cancel",
        "Cancellation and project refunds",
        [
          `You may request cancellation by emailing ${CONTACT.email} from an authorized business contact. For a monthly subscription, a request received before the next renewal stops that renewal and takes effect at the end of the current paid billing period, unless you request and we agree to an earlier end. We will confirm the effective date. Amounts for a used monthly period are not normally prorated, but billing errors, duplicate charges, and paid services that were not provided will be reviewed and corrected as appropriate.`,
          "If you cancel a project before work starts, prepaid project fees are refundable apart from documented third-party or equipment costs you approved that cannot be recovered. If work has started, you pay for work completed and approved costs already committed. Completed-work charges are based on the agreed milestone amounts or rates, with reasonable documentation for partial work. We do not automatically treat an entire deposit as earned simply because it was paid.",
          "We provide an itemized final accounting and return any prepaid amount exceeding completed work and approved, nonrecoverable costs within 14 business days of cancellation. A disputed amount will be explained and addressed with you; any undisputed refund should not be held while a separate amount is reviewed. Equipment returns depend on supplier terms and any nonreturnable items or restocking charges disclosed before purchase. This policy does not remove rights available under applicable law.",
        ],
      ],
      [
        "ownership",
        "Your business, your deliverables, and our platform",
        [
          "You retain ownership of your domain, branding, supplied content, customer records, and business data. Transfer of paid client-specific website deliverables follows the signed agreement. Third-party materials remain subject to their licenses.",
          "Klyvora retains ownership of its reusable software platform, shared backend, industry modules, general tools, and proprietary components. An active subscription grants access to the agreed hosted tools; it does not transfer ownership of that platform. Custom software agreements identify which client-specific work transfers and which reusable components remain Klyvora’s.",
          "You authorize us to use the content and access you provide only as needed to perform the agreed services. Portfolio use, testimonials, or publication of private business information require separate permission. Cancelling a subscription does not transfer proprietary platform code or mean a separately transferred website will retain hosted Klyvora functionality.",
        ],
      ],
      [
        "data-export",
        "Data exports and the end of hosted access",
        [
          "Hosted platform access ends on the effective service end date. You can request one standard export of your business data within 30 days after that date without an additional export fee. We will arrange delivery in the supported standard format and verify the requesting person’s authority. Custom conversions, migrations, or third-party setup are separately quoted.",
          "Unless the agreement specifies otherwise, operational data is scheduled for deletion from active systems within 90 days after services end, subject to records retained for accounting, security, disputes, or applicable obligations. Backup copies expire under the provider’s configured retention cycle. Request an export before the 30-day window closes; continued hosted access, a perpetual backup, and continued software functionality are not included after cancellation. Our Privacy Policy explains the general retention periods for other records.",
        ],
      ],
      [
        "equipment",
        "Equipment and integrations",
        [
          "Restaurants, childcare, and beauty packages include one preselected compatible standard tablet and basic stand where specified. One tablet serves the agreed role; multiple simultaneous physical stations require additional equipment. Ecommerce does not include a tablet by default.",
          "Existing equipment may be reused after compatibility review. Compatibility with every tablet, printer, camera, payment terminal, or proprietary POS system is not guaranteed. There is no automatic hardware credit or discount for using your own devices. Your proposal records any agreed adjustment and confirms equipment ownership, warranty coverage, replacement responsibility, networking, installation, and third-party charges. Complex onsite work is separately quoted.",
        ],
      ],
      [
        "responsible-use",
        "Accounts, data, and responsible use",
        [
          "Use the services only for lawful, authorized business activity. Keep account access and sign-in links secure, use appropriate staff permissions, and tell us promptly about suspected misuse. Do not attempt to bypass access controls, access another business’s records, interfere with the service, or submit content you are not entitled to use.",
          "You are responsible for identifying required notices, permissions, retention rules, and industry obligations for information used in your business. We will address the agreed technical responsibilities in the service scope. Sensitive or regulated information, including child records and security-system access, requires an appropriate written arrangement before it is introduced into the system.",
          "For childcare workflows, a PIN or QR code alone must not authorize a child’s release. Verified authorization, staff confirmation, appropriate identity checks, applicable custody restrictions, and an auditable handoff are required. Software does not replace staff supervision or guarantee child safety.",
        ],
      ],
      [
        "providers-ai",
        "Third-party services and AI-assisted workflows",
        [
          "Payment providers, email or messaging services, hardware suppliers, hosting services, and other integrations have their own terms, fees, and availability. We configure supported connections within the agreed scope but do not control a provider’s independent service, pricing, or policy changes.",
          "Automation follows the agreed rules, permissions, and escalation process. AI-generated output can be incomplete or inaccurate and needs appropriate human review. It should not independently authorize sensitive decisions, professional advice, payments, or child-release decisions. The scope identifies when a person must review or approve an action and which information may be sent to connected providers.",
        ],
      ],
      [
        "availability",
        "Service interruptions and unresolved issues",
        [
          "We maintain the hosted services within the agreed plan, but do not promise uninterrupted access or guaranteed revenue, search rankings, growth, or other business outcomes. Maintenance, supplier outages, network issues, or security incidents may affect availability. Contact us promptly so we can investigate problems against the agreed scope and support terms.",
          "We may need to restrict access to address serious misuse, a security risk, or unpaid agreed charges. Where practical, we will explain the issue and give reasonable notice and an opportunity to resolve it; urgent security or unlawful activity may require immediate action. The signed agreement addresses any additional warranties, remedies, liability limits, and dispute procedures. Nothing here excludes a right or responsibility that cannot lawfully be excluded.",
        ],
      ],
      [
        "changes",
        "Changes and contact",
        [
          "We may update these general terms with a revised date. Material changes affecting an active service will be communicated before they apply, and a website update does not by itself rewrite a signed project agreement or create new charges for approved work.",
          `For project questions, cancellations, billing concerns, or data-export requests, contact ${CONTACT.email}.`,
        ],
      ],
    ],
  },
};
