import Button from "@/components/ui/Button";
import {
  PageIntro,
  Section,
  IndustryCards,
  Price,
  FeatureList,
  FaqSection,
  FinalCta,
  IndustryIcon,
  Photo,
} from "@/components/marketing/Parts";
import { SERVICE_PHOTOS } from "@/lib/marketing/photos";
import {
  CUSTOM_SERVICES,
  quoteHref,
  ADDITIONAL_COSTS,
  STANDARD_SCOPE,
} from "@/lib/marketing/catalog";
import { faqs } from "@/lib/marketing/faq";
import { pageMetadata } from "@/lib/marketing/seo";
export const metadata = pageMetadata(
  "Custom Website & Business Software Pricing | Klyvora",
  "Compare Klyvora’s setup and subscription pricing for industry solutions, custom websites, AI automation, and custom software. All prices in USD; final scope confirmed in writing.",
  "/pricing",
);
// [icon path, title, body] for the "what you pay for" cards.
const COVERS = [
  [
    "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6",
    "What the setup fee covers",
    "Design, configuration, initial onboarding, standard launch testing, and included equipment where specified.",
  ],
  [
    "M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5",
    "What the subscription covers",
    "Access to Klyvora’s hosted business platform, standard software updates, hosting, routine maintenance, and defined support.",
  ],
  ["M12 5v14M5 12h14", "Additional costs", ADDITIONAL_COSTS],
];

export default function PricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Pricing · USD"
        title="Simple pricing. Software built around your business."
        intro="Pay once for design and setup, then a monthly subscription for hosted business software where applicable. Choose your industry or service to see the starting price. Your final proposal will confirm the exact scope, equipment, and any additional integration costs."
        photo="cafeOwner"
        floats={[
          {
            label: "Setup",
            text: "Pay once for design and setup",
            tone: "success",
          },
          { label: "Monthly", text: "Hosted business software" },
        ]}
      >
        <div className="mk-actions">
          <Button href="#industry-pricing">
            Industry Solutions <span aria-hidden="true">↓</span>
          </Button>
          <Button href="#custom-pricing" variant="secondary">
            Custom Services
          </Button>
        </div>
      </PageIntro>
      <Section
        id="industry-pricing"
        eyebrow="01 / Website + connected software"
        title="Industry Solutions"
        intro="One custom website. One configured industry solution. An active monthly subscription for hosted business tools."
      >
        <IndustryCards pricing />
      </Section>
      <Section
        id="custom-pricing"
        className="mk-platform"
        eyebrow="02 / Defined projects"
        title="Custom Services"
      >
        <div className="mk-service-grid">
          {CUSTOM_SERVICES.map((s) => (
            <article key={s.id} className="mk-service-card mk-reveal">
              <div className="mk-service-media">
                <Photo
                  name={SERVICE_PHOTOS[s.id]}
                  alt=""
                  sizes="(max-width: 767px) 100vw, 33vw"
                />
                <span className="mk-card-badge mk-card-badge-icon">
                  <IndustryIcon id={s.id} size={18} />
                </span>
              </div>
              <h3>{s.name}</h3>
              <Price service={s} compact />
              <p>{s.summary}</p>
              <p className="mk-service-scope">
                {s.id === "websites"
                  ? "Up to five standard pages, a contact form, and two design revision rounds. No required Klyvora platform subscription."
                  : s.id === "automation"
                    ? "One clearly defined workflow. Complex agents and high-volume or multi-system work receive a custom quote."
                    : "Custom applications, dashboards, and integrations with separate hosting and maintenance terms."}
              </p>
              <div className="mk-service-action">
                <Button href={quoteHref(s)} variant="secondary">
                  {s.cta}
                </Button>
              </div>
            </article>
          ))}
        </div>
        <div className="mk-cover-grid">
          {COVERS.map(([icon, title, body]) => (
            <article key={title} className="mk-reveal">
              <span className="mk-benefit-icon" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={icon} />
                </svg>
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <details id="scope" className="mk-scope">
          <summary className="min-h-12 flex justify-between items-center cursor-pointer text-base py-3">
            Scope, revisions, and payment milestones{" "}
            <span aria-hidden="true">+</span>
          </summary>
          <div className="mk-two-col py-7">
            <div>
              <h3 className="mk-h3">A defined standard scope.</h3>
              <FeatureList items={STANDARD_SCOPE} />
              <p className="mk-small">
                Industry setup also includes one configured industry module, one
                tablet where specified, standard configuration, and one remote
                staff onboarding session. Your proposal defines initial content
                and data entry limits. Larger migrations, substantial
                development, and extra locations are separately quoted.
              </p>
            </div>
            <div className="mk-body">
              <h3 className="mk-h3">Two rounds of design feedback.</h3>
              <p>
                Round 1: one consolidated set of feedback on the initial design.
                Round 2: refinements within the approved direction. The final
                prelaunch review covers bugs, missing agreed content, and
                factual corrections.
              </p>
              <p>
                A complete redesign, additional pages, new functionality, or
                changes to the original scope are separate work. Additional
                revision rounds are quoted and approved before proceeding. The
                14-day postlaunch correction period covers defects relative to
                the approved scope.
              </p>
              <h3 className="mk-h3">Agreed milestones.</h3>
              <p>
                50% at kickoff, 30% after an agreed working demonstration, and
                20% at final approval and launch. Monthly subscriptions start on
                the agreed service activation date. Additional hardware
                purchases may require advance payment before ordering.
              </p>
            </div>
          </div>
        </details>
      </Section>
      <FaqSection
        items={faqs("setup", "monthly", "hardware", "fees", "data")}
      />
      <FinalCta />
    </>
  );
}
