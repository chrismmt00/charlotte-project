import {
  PageIntro,
  Section,
  IndustryCards,
  HardwareNote,
  FinalCta,
  Photo,
} from "@/components/marketing/Parts";
import Button from "@/components/ui/Button";
import { pageMetadata } from "@/lib/marketing/seo";
export const metadata = pageMetadata(
  "Industry Business Software Solutions | Klyvora Studio",
  "Compare websites and business software for restaurants, childcare centers, salons, and online stores. Clear setup pricing, subscriptions, and hardware guidance.",
  "/solutions",
);
export default function SolutionsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Industry solutions"
        title="Business software built for your industry."
        intro="From appointment-based businesses to restaurants and online stores, Klyvora connects a custom website to the tools you need to manage daily operations. Choose your industry to see what’s included."
        mosaic={["cafe", "daycare", "nails", "packing"]}
      >
        <div className="mk-actions">
          <Button href="#compare">
            Find Your Fit <span aria-hidden="true">↓</span>
          </Button>
          <Button href="/pricing" variant="secondary">
            See Pricing
          </Button>
        </div>
      </PageIntro>
      <Section id="compare" title="Find your fit.">
        <IndustryCards detailed />
        <p className="mk-small mt-6">
          All prices in USD. Industry Solutions require an active monthly
          subscription. Your project includes website design, software setup,
          and onboarding. Your written proposal confirms the scope and costs.
        </p>
      </Section>
      <Section id="shared-platform" className="mk-platform">
        <div className="mk-split">
          <div className="mk-split-media mk-reveal">
            <div className="mk-frame mk-frame-wide">
              <Photo name="kitchen" sizes="(max-width: 1023px) 100vw, 46vw" />
            </div>
          </div>
          <div>
            <h2 className="mk-h2">
              Custom on the outside.
              <br />
              <em>Connected behind the scenes.</em>
            </h2>
            <div className="mk-body">
              <p>
                Your website is individually designed. The tools behind it use
                Klyvora’s shared, maintained software platform, configured for
                your industry.
              </p>
              <p>
                Reusing the software keeps initial development fees more
                affordable. Your subscription covers hosted platform access,
                standard updates, routine maintenance, and defined support.
              </p>
            </div>
          </div>
        </div>
      </Section>
      <Section id="equipment">
        <HardwareNote />
      </Section>
      <FinalCta />
    </>
  );
}
