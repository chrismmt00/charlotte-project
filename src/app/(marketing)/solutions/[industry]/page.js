import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  PageIntro,
  Section,
  Price,
  FeatureList,
  HardwareNote,
  FaqSection,
  FinalCta,
} from "@/components/marketing/Parts";
import {
  INDUSTRIES,
  quoteHref,
  ADDITIONAL_COSTS,
} from "@/lib/marketing/catalog";
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
    `${s.summary} Custom website design, software setup, and onboarding for your business. Explore setup and monthly subscription pricing.`,
    s.href,
  );
}
export default async function IndustryPage({ params }) {
  const s = await getService(params);
  return (
    <>
      <PageIntro eyebrow={s.name} title={s.title} intro={s.description} />
      <Section id="package" className="!pt-7">
        <div className="mk-two-col">
          <div>
            <p className="eyebrow mk-eyebrow">Designed for your day</p>
            <h2 className="mk-h2">A practical fit for your business.</h2>
            <p className="mk-body">{s.fit}</p>
            <FeatureList items={s.outcomes} />
          </div>
          <aside className="mk-note">
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
              USD · One location · Defined standard scope · Monthly subscription
              required
            </p>
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
        <div className="mk-two-col">
          <FeatureList
            items={s.features.slice(0, Math.ceil(s.features.length / 2))}
          />
          <FeatureList
            items={s.features.slice(Math.ceil(s.features.length / 2))}
          />
        </div>
        <div className="mk-note mt-8">
          <h3 className="mk-h3">
            {s.id === "daycare"
              ? "Staff-led safety. Clearly defined access."
              : "The right setup matters."}
          </h3>
          <p>{s.caution}</p>
          {s.dataCare && <p>{s.dataCare}</p>}
        </div>
      </Section>
      <Section
        id="hardware"
        eyebrow="Equipment & connections"
        title="Start with what works for you."
        intro="We review your current equipment before recommending anything new. The following hardware and integrations are assessed and quoted separately."
      >
        <div className="mk-two-col">
          <FeatureList items={s.hardware} />
          <div className="mk-body">
            <h3 className="mk-h3">Compatibility comes first.</h3>
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
