import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  PageIntro,
  Section,
  Price,
  FeatureList,
  FeatureGrid,
  FloatCard,
  HardwareNote,
  FaqSection,
  FinalCta,
  Photo,
} from "@/components/marketing/Parts";
import {
  INDUSTRIES,
  money,
  quoteHref,
  ADDITIONAL_COSTS,
  launchMetadata,
} from "@/lib/marketing/catalog";
import { SetupAmount } from "@/components/marketing/SetupPrice";
import { INDUSTRY_PHOTOS } from "@/lib/marketing/photos";
import { pageMetadata } from "@/lib/marketing/seo";
import { faqs } from "@/lib/marketing/faq";
export function generateStaticParams() {
  return INDUSTRIES.map((s) => ({ industry: s.id }));
}
async function getService(params) {
  const { industry } = await params;
  const service = INDUSTRIES.find((s) => s.id === industry);
  if (!service) notFound();
  return service;
}
export async function generateMetadata({ params }) {
  const s = await getService(params);
  return pageMetadata(
    s.seo,
    launchMetadata(
      `${s.summary} Custom website design, software setup, and onboarding for your business. Explore setup and monthly subscription pricing.`,
    ),
    s.href,
  );
}
export default async function IndustryPage({ params }) {
  const s = await getService(params);
  const [heroPhoto, , detailPhoto] = INDUSTRY_PHOTOS[s.id];
  return (
    <>
      <PageIntro
        promotion
        eyebrow={s.name}
        title={s.title}
        intro={s.description}
        photo={heroPhoto}
        floats={[
          { label: "Included", text: s.features[1], tone: "success" },
          { label: "Included", text: s.features[3] },
        ]}
      >
        <ul className="mk-intro-chips">
          <li className="mk-chip">
            Setup from <SetupAmount service={s} />
          </li>
          <li className="mk-chip">
            <strong>{money(s.monthly)}</strong>/month software
          </li>
          {s.tablet && <li className="mk-chip">Tablet included</li>}
        </ul>
        <div className="mk-actions">
          <Button href={quoteHref(s)}>
            {s.cta} <span aria-hidden="true">↗</span>
          </Button>
          {s.demo ? (
            <Button href={s.demo} variant="secondary">
              Try the Live Demo
            </Button>
          ) : (
            <Button href="#included" variant="secondary">
              See What’s Included
            </Button>
          )}
        </div>
      </PageIntro>
      <Section id="package">
        <div className="mk-two-col">
          <div>
            <p className="eyebrow mk-eyebrow">Designed for your day</p>
            <h2 className="mk-h2">A practical fit for your business.</h2>
            <p className="mk-body">{s.fit}</p>
            <FeatureList items={s.outcomes} />
          </div>
          <aside className="mk-price-card">
            <div>
              <p className="eyebrow mk-eyebrow">Your starting point</p>
              <Price service={s} />
              <p>
                {s.tablet
                  ? "Includes one preselected compatible standard tablet, a basic stand, and initial configuration."
                  : "Initial store setup included. No physical tablet is included by default."}
              </p>
              <div className="mk-actions mt-6">
                <Button href={quoteHref(s)}>{s.cta}</Button>
              </div>
              <p className="mk-small mt-4">
                USD · One location · Defined standard scope · Monthly
                subscription required
              </p>
            </div>
          </aside>
        </div>
      </Section>
      <Section
        id="included"
        className="mk-platform"
        eyebrow="Included in your project"
        title="The tools that belong together."
        intro="We design your website, configure your business tools, and set up access for your team as part of your project. Setup, testing, and guided onboarding are included, with the features and integrations confirmed in your written proposal."
      >
        <FeatureGrid items={s.features} />
        <div className="mk-note mk-note-callout mt-8">
          <h3 className="mk-h3">
            {s.id === "daycare"
              ? "Staff-led safety. Clearly defined access."
              : "The right setup matters."}
          </h3>
          <p>{s.caution}</p>
          {s.dataCare && <p>{s.dataCare}</p>}
        </div>
      </Section>
      <Section id="hardware">
        <div className="mk-split mk-split-reverse">
          <div>
            <p className="eyebrow mk-eyebrow">Equipment & connections</p>
            <h2 className="mk-h2">Start with what works for you.</h2>
            <p className="mk-intro">
              We review your current equipment before recommending anything new.
              The following hardware and integrations are assessed and quoted
              separately.
            </p>
            <FeatureList items={s.hardware} />
          </div>
          <div className="mk-split-media mk-reveal">
            <div className="mk-frame mk-frame-tall">
              <Photo
                name={detailPhoto}
                sizes="(max-width: 1023px) 100vw, 46vw"
              />
            </div>
          </div>
        </div>
        <div className="mk-two-col mt-16 mb-10">
          <h3 className="mk-h3">Compatibility comes first.</h3>
          <div className="mk-body">
            <p>
              Supported tablets, computers, displays, printers, and payment
              devices can be reused when integrations permit. We verify
              compatibility before committing to a connection.
            </p>
            <p>
              Your proposal confirms equipment ownership, warranty coverage,
              replacements, network needs, installation responsibilities, and
              third-party charges. Basic remote device configuration can be
              included; complex onsite installation is separately quoted.
            </p>
          </div>
        </div>
        <HardwareNote />
        <p className="mk-small mt-6">{ADDITIONAL_COSTS}</p>
      </Section>
      <Section id="setup" className="!pt-0">
        <div className="mk-note">
          <h2 className="mk-h3">A defined setup. A clear agreement.</h2>
          <p>
            Standard industry setup covers one location, up to five website
            pages, one configured industry module, one tablet where specified,
            standard configuration, one remote onboarding session, and two
            consolidated design revision rounds. Initial content and data entry
            limits are set in your proposal. Larger migrations, new features,
            and multiple locations need a separate quote.
          </p>
          <Link href="/pricing#scope" className="mk-text-link">
            Review scope, revisions, and payment milestones{" "}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Section>
      <FaqSection
        items={faqs("setup", "monthly", "hardware", "data", "expand")}
      />
      <FinalCta service={s} />
    </>
  );
}
