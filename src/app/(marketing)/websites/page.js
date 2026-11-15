import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  PageIntro,
  Section,
  Price,
  FeatureList,
  FaqSection,
  FinalCta,
} from "@/components/marketing/Parts";
import {
  serviceById,
  quoteHref,
  STANDARD_SCOPE,
} from "@/lib/marketing/catalog";
import { faqs } from "@/lib/marketing/faq";
import { pageMetadata } from "@/lib/marketing/seo";
const service = serviceById("websites");
export const metadata = pageMetadata(
  `Custom Business Websites Starting at $${service.setup} | Klyvora`,
  "Custom small business website design in Charlotte. Responsive design, up to five pages, a contact form, and basic SEO. Optional managed hosting and maintenance.",
  "/websites",
);
export default function WebsitesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Custom websites"
        title="A website that looks like your business, not everyone else’s."
        intro="Your website should make a strong first impression and help customers find what they need. Klyvora designs responsive, custom websites around your brand, services, and goals, with clear navigation, thoughtful design, and the information customers need to get in touch."
      />
      <Section id="website-package" className="!pt-7">
        <div className="mk-two-col">
          <div>
            <p className="eyebrow mk-eyebrow">A strong foundation</p>
            <h2 className="mk-h2">
              Built for the customers you want to reach.
            </h2>
            <FeatureList items={service.features} />
          </div>
          <aside className="mk-note">
            <Price service={service} />
            <p>
              A one-time design project. You can choose to launch without a
              recurring Klyvora software subscription.
            </p>
            <div className="mk-actions mt-6">
              <Button href={quoteHref(service)}>{service.cta}</Button>
            </div>
            <p className="mk-small mt-4">
              USD · Supplied branding · Reasonable content requirements ·
              Defined design scope
            </p>
          </aside>
        </div>
      </Section>
      <Section
        id="website-scope"
        className="mk-platform"
        eyebrow="Clear expectations"
        title="A focused scope, from design to launch."
      >
        <div className="mk-two-col">
          <FeatureList items={STANDARD_SCOPE} />
          <div className="mk-body">
            <p>
              The starting package assumes supplied branding, reasonable content
              requirements, and no substantial custom integrations. Content
              preparation, extra pages, and larger integrations are quoted
              separately.
            </p>
            <p>
              Booking systems, ecommerce backends, and a Klyvora platform
              subscription are separate services. Our industry solutions follow
              a different commercial model: custom website setup plus recurring
              software access.
            </p>
            <Link className="mk-text-link" href="/solutions">
              Compare Industry Solutions <span aria-hidden="true">→</span>
            </Link>
            <Link className="mk-text-link" href="/pricing#scope">
              Review revisions and payment milestones{" "}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </Section>
      <FaqSection
        items={faqs("design", "monthly", "revisions", "existing", "data")}
      />
      <FinalCta service={service} />
    </>
  );
}
