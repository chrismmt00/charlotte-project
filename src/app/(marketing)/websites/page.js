import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  PageIntro,
  Section,
  Price,
  FeatureList,
  FeatureGrid,
  FaqSection,
  FinalCta,
  Photo,
} from "@/components/marketing/Parts";
import {
  serviceById,
  launchMetadata,
  quoteHref,
  STANDARD_SCOPE,
} from "@/lib/marketing/catalog";
import { SetupAmount } from "@/components/marketing/SetupPrice";
import { faqs } from "@/lib/marketing/faq";
import { pageMetadata } from "@/lib/marketing/seo";
const service = serviceById("websites");
export const metadata = pageMetadata(
  "Custom Business Websites | Klyvora Studio",
  launchMetadata(
    "Custom small business website design in Charlotte. Responsive design, up to five pages, a contact form, and basic SEO. Optional managed hosting and maintenance.",
  ),
  "/websites",
);
export default function WebsitesPage() {
  return (
    <>
      <PageIntro
        promotion
        eyebrow="Custom websites"
        title="A website that looks like your business, not everyone else’s."
        intro="Your website should make a strong first impression and help customers find what they need. Klyvora designs responsive, custom websites around your brand, services, and goals, with clear navigation, thoughtful design, and the information customers need to get in touch."
        photo="website"
        floats={[
          {
            label: "Included",
            text: "Custom responsive design",
            tone: "success",
          },
          { label: "Included", text: "Basic on-page SEO setup" },
          { label: "Included", text: "Mobile-friendly navigation" },
        ]}
      >
        <ul className="mk-intro-chips">
          <li className="mk-chip">
            Setup from <SetupAmount service={service} />
          </li>
          <li className="mk-chip">Up to five pages</li>
          <li className="mk-chip">No required subscription</li>
        </ul>
        <div className="mk-actions">
          <Button href={quoteHref(service)}>
            {service.cta} <span aria-hidden="true">↗</span>
          </Button>
          <Button href="#website-scope" variant="secondary">
            See the Scope
          </Button>
        </div>
      </PageIntro>
      <Section id="website-package">
        <div className="mk-two-col">
          <div>
            <p className="eyebrow mk-eyebrow">A strong foundation</p>
            <h2 className="mk-h2">
              Built for the customers you want to reach.
            </h2>
            <FeatureGrid items={service.features} />
          </div>
          <aside className="mk-price-card">
            <div>
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
            </div>
          </aside>
        </div>
      </Section>
      <Section id="website-scope" className="mk-platform">
        <div className="mk-split">
          <div className="mk-split-media mk-reveal">
            <div className="mk-frame mk-frame-tall">
              <Photo name="webDesign" sizes="(max-width: 1023px) 100vw, 46vw" />
            </div>
          </div>
          <div>
            <p className="eyebrow mk-eyebrow">Clear expectations</p>
            <h2 className="mk-h2">A focused scope, from design to launch.</h2>
            <FeatureList items={STANDARD_SCOPE} />
            <div className="mk-body">
              <p>
                The starting package assumes supplied branding, reasonable
                content requirements, and no substantial custom integrations.
                Content preparation, extra pages, and larger integrations are
                quoted separately.
              </p>
              <p>
                Booking systems, ecommerce backends, and a Klyvora platform
                subscription are separate services. Our industry solutions
                follow a different commercial model: custom website setup plus
                recurring software access.
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
        </div>
      </Section>
      <FaqSection
        items={faqs("design", "monthly", "revisions", "existing", "data")}
      />
      <FinalCta service={service} photo="laptop" />
    </>
  );
}
