# Privacy and Terms copy review — November 16, 2026

Scope: content only, requested by the owner after the public-page redesign. Existing policy-page header, container, card, colors, and typography are retained. No marketing CSS, navigation, layout, authentication, billing, or client software logic is changed.

The owner instructed that no mailing address should be displayed for now, confirmed there is no personal-information selling, advertising sharing, or added analytics/ad tracking, and asked Klyvora to draft reasonable cancellation/refund and retention policies. The text uses the known trading name Klyvora Studio without inventing an LLC or legal entity. After receiving the local preview and being informed of the original legal-review requirement, the owner explicitly requested production publication of this wording on November 16, 2026. That authorization does not establish independent legal review. Both pages retain their existing `noindex` metadata and sitemap exclusion; no indexing or design changes are included in this release.

## Proposed business policies

- Project cancellation before work: refund prepaid fees less approved, documented, nonrecoverable equipment or third-party costs.
- Cancellation after work starts: charge completed work using agreed milestone values/rates and approved committed costs, provide an itemized accounting, and refund any unused balance within 14 business days. An entire deposit is not automatically earned. Do not hold an undisputed refund over a separate dispute.
- Monthly services: cancel by email before renewal, effective at the end of the paid period unless an earlier end is agreed. No routine prorated refund for a used period; correct billing errors, duplicate charges, or paid services not provided. Supplier return limits/restocking costs must be disclosed before equipment purchase.
- Klyvora recurring-fee changes: at least 30 days’ advance notice, respecting fixed-term agreements. Third-party/usage prices follow the agreed provider arrangement.
- Data export: one standard supported export without an export fee if requested within 30 days after hosted services end. Custom migrations/conversions require a separate quote. Hosted access ends on the effective service end date.
- Non-client inquiries: retain for 12 months after last meaningful contact.
- Signed agreements, invoices, payment/accounting/dispute records: up to seven years after the relationship ends or relevant transaction, with exceptions for unresolved claims or required preservation.
- Operational client data and project files: schedule deletion from active systems within 90 days after service ends, subject to an overriding written agreement or legitimate preservation requirements.
- Routine diagnostic/security records: generally no more than 90 days, with incident/investigation exceptions. Backup copies expire under the provider’s configured cycle; no unsupported fixed backup-deletion guarantee is made.

## Outstanding legal and operational review

1. Confirm the legal person/entity operating under Klyvora Studio and whether applicable business notices require further identifying/contact information. No entity type, registration, or street address was invented.
2. Have the revised Privacy and Terms reviewed by a qualified human legal reviewer, as required by the original brief. In particular, review renewal/cancellation notices, refunds, existing-contract priority, governing law/disputes, required regional privacy rights, and whether more specific provider/location disclosures are needed. No arbitration clause, arbitrary liability cap, blanket nonrefundable deposit, or rights waiver was invented.
3. Adopt the proposed refund, retention, export, fee-notice, and deletion rules operationally. Establish manual reminders or a reviewed process for inquiry expiry, post-cancellation export requests, deletion, identity checks, preservation exceptions, and refunds. This copy task does not add automated retention or refund jobs. Inventory provider logs, mailboxes, file stores, and database/backups so the commitments can be honored. Verify whether longer accounting retention is needed for particular records.
4. Align new written proposals and subscription agreements with these policies. Existing signed agreements are not silently rewritten. Check hardware ownership and warranty/return terms for each purchase rather than using an invented universal rule.
5. Verify the service-provider list and locations against current production arrangements. Source confirms Vercel/Neon/Brevo-or-SMTP/Stripe/Cloudflare integration and Unsplash image requests. Private file uploads are separately feature-gated; the notice does not promise that unconfigured storage is operational. No full-card storage or advertising analytics was found in application code. Providers may maintain their own records under their applicable policies.
6. Confirm that customer-data processing and AI-provider use are covered in project agreements. The no-public-model-training statement is a standard-service commitment; do not connect a provider/workflow that violates it without a separately agreed arrangement.
7. Childcare operational services require separate review of data roles, guardian permissions, notices, access, retention, security, and applicable children’s-data requirements. The general marketing policy is not a complete operational childcare privacy notice or proof of compliance.

## Verification

`npm run build:local` passed. The two policy pages passed 29 checks across 1440px and 375px layouts, including readable rendered content, expected metadata, no unresolved drafting placeholders, no horizontal overflow, axe accessibility checks, and no browser runtime errors. Desktop and mobile screenshots were visually reviewed. Stylesheets and the rest of the public-page redesign were left unchanged.

## Reference guidance

- [FTC: Protecting Personal Information — A Guide for Business](https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business). Used for the approach of inventorying actual data flows and providers, limiting retention to a business purpose, and verifying access/disposal practices. The specific periods above are proposed Klyvora policies, not claims about universal statutory deadlines.
- [FTC: Children’s Online Privacy Protection Rule — Six-Step Compliance Plan](https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business). Used to flag separate review of any applicable children’s-data collection, notices, permissions, and deletion requirements. No claim that a general policy establishes childcare compliance is made.
