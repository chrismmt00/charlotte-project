import Button from "@/components/ui/Button";
import {
  PageIntro,
  Section,
  Price,
  FeatureGrid,
  FinalCta,
  FloatCard,
  Photo,
} from "@/components/marketing/Parts";
import {
  serviceById,
  money,
  quoteHref,
  ADDITIONAL_COSTS,
} from "@/lib/marketing/catalog";
import { pageMetadata } from "@/lib/marketing/seo";
const automation = serviceById("automation"),
  software = serviceById("software");
export const metadata = pageMetadata(
  "AI Automation & Custom Business Apps | Klyvora",
  "Practical AI automation, custom web applications, dashboards, and integrations for small businesses. Defined scope, human oversight, and clear starting prices.",
  "/ai-software",
);
export default function AiSoftwarePage() {
  return (
    <>
      <PageIntro
        eyebrow="AI & software"
        title="Practical tools. More room to focus."
        intro="Connect the work that happens between your website, your team, and the tools you already use. Start with one defined workflow, or scope a custom application around your business."
        photo="office"
        floats={[
          { label: "Automation", text: "Lead follow-ups", tone: "success" },
          { label: "Automation", text: "Customer inquiry routing" },
          { label: "Custom", text: "Business dashboards" },
        ]}
      >
        <ul className="mk-intro-chips">
          <li className="mk-chip">
            Automations from <strong>{money(automation.setup)}</strong>
          </li>
          <li className="mk-chip">
            Custom apps from <strong>{money(software.setup)}</strong>
          </li>
        </ul>
        <div className="mk-actions">
          <Button href="#automation">
            AI Automation <span aria-hidden="true">↓</span>
          </Button>
          <Button href="#custom-software" variant="secondary">
            Custom Software
          </Button>
        </div>
      </PageIntro>
      <Section id="automation">
        <div className="mk-split">
          <div>
            <p className="eyebrow mk-eyebrow">AI automation</p>
            <h2 className="mk-h2">Spend less time on repetitive work.</h2>
            <p className="mk-intro">
              From missed inquiries to follow-ups, everyday tasks can take
              attention away from running your business. Klyvora builds
              practical automations that connect your existing tools, follow
              defined rules, and keep your team involved when human judgment is
              needed.
            </p>
          </div>
          <div className="mk-split-media mk-reveal">
            <div className="mk-frame mk-frame-wide">
              <Photo name="laptop" sizes="(max-width: 1023px) 100vw, 46vw" />
            </div>
            <FloatCard
              label="Automation"
              text="Appointment reminders"
              tone="success"
              className="mk-float-pos-0"
            />
            <FloatCard
              label="Automation"
              text="Review request automation"
              className="mk-float-pos-1"
            />
          </div>
        </div>
        <div className="mk-two-col mt-14">
          <FeatureGrid items={automation.features} />
          <aside className="mk-price-card">
            <div>
              <Price service={automation} />
              <p>
                The starting price covers one clearly defined automation
                workflow. Complex AI agents, multi-system integrations, and
                high-volume workflows receive a custom quote.
              </p>
              <p>
                Managed workflows have ongoing hosting or software charges where
                applicable. Provider and usage costs are separate.
              </p>
              <div className="mk-actions mt-6">
                <Button href={quoteHref(automation)}>{automation.cta}</Button>
              </div>
            </div>
          </aside>
        </div>
      </Section>
      <Section id="custom-software" className="mk-platform">
        <div className="mk-split mk-split-reverse">
          <div>
            <p className="eyebrow mk-eyebrow">
              Custom software & AI applications
            </p>
            <h2 className="mk-h2">
              Software built around the way your business works.
            </h2>
            <p className="mk-intro">
              Some businesses need more than a standard website or management
              system. Klyvora develops custom web applications, dashboards,
              integrations, and AI-enabled tools for specialized business
              operations.
            </p>
            <p className="mk-body">
              Tell us what needs to work better. We’ll help define a practical
              solution with a clear development scope and price.
            </p>
          </div>
          <div className="mk-split-media mk-reveal">
            <div className="mk-frame mk-frame-wide">
              <Photo
                name="whiteboard"
                sizes="(max-width: 1023px) 100vw, 46vw"
              />
            </div>
          </div>
        </div>
        <div className="mk-two-col mt-14">
          <FeatureGrid items={software.features} />
          <aside className="mk-price-card">
            <div>
              <Price service={software} />
              <p>
                Every custom application receives a separate hosting and
                maintenance quote. Your agreement distinguishes client-specific
                intellectual property from reusable Klyvora platform components.
              </p>
              <p>
                Integrations, permissions, testing, and human approval steps are
                defined before development. New applications are launched only
                after the agreed validation.
              </p>
              <div className="mk-actions mt-6">
                <Button href={quoteHref(software)}>{software.cta}</Button>
              </div>
            </div>
          </aside>
        </div>
        <p className="mk-small mt-8">All prices in USD. {ADDITIONAL_COSTS}</p>
      </Section>
      <FinalCta photo="team" />
    </>
  );
}
