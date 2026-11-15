import Button from "@/components/ui/Button";
import {
  PageIntro,
  Section,
  Price,
  FeatureList,
  FinalCta,
} from "@/components/marketing/Parts";
import {
  serviceById,
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
      />
      <Section
        id="automation"
        eyebrow="AI automation"
        title="Spend less time on repetitive work."
        intro="From missed inquiries to follow-ups, everyday tasks can take attention away from running your business. Klyvora builds practical automations that connect your existing tools, follow defined rules, and keep your team involved when human judgment is needed."
      >
        <div className="mk-two-col">
          <FeatureList items={automation.features} />
          <aside className="mk-note">
            <Price service={automation} />
            <p>
              The starting price covers one clearly defined automation workflow.
              Complex AI agents, multi-system integrations, and high-volume
              workflows receive a custom quote.
            </p>
            <p>
              Managed workflows have ongoing hosting or software charges where
              applicable. Provider and usage costs are separate.
            </p>
            <div className="mk-actions mt-6">
              <Button href={quoteHref(automation)}>{automation.cta}</Button>
            </div>
          </aside>
        </div>
      </Section>
      <Section
        id="custom-software"
        className="mk-platform"
        eyebrow="Custom software & AI applications"
        title="Software built around the way your business works."
        intro="Some businesses need more than a standard website or management system. Klyvora develops custom web applications, dashboards, integrations, and AI-enabled tools for specialized business operations."
      >
        <div className="mk-two-col">
          <div>
            <FeatureList items={software.features} />
            <p className="mk-body">
              Tell us what needs to work better. We’ll help define a practical
              solution with a clear development scope and price.
            </p>
          </div>
          <aside className="mk-note">
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
          </aside>
        </div>
        <p className="mk-small mt-8">All prices in USD. {ADDITIONAL_COSTS}</p>
      </Section>
      <FinalCta />
    </>
  );
}
