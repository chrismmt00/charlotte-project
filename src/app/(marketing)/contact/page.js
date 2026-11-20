import { Suspense } from "react";
import { PageIntro, Section, Photo } from "@/components/marketing/Parts";
import ContactForm from "@/components/site/ContactForm";
import { CONTACT } from "@/lib/site";
import { pageMetadata } from "@/lib/marketing/seo";
import { launchMetadata } from "@/lib/marketing/catalog";
export const metadata = pageMetadata(
  "Start a Website or Software Project | Klyvora Studio",
  launchMetadata(
    "Tell Klyvora Studio about your business, website, existing equipment, and project. Request a quote for a website, industry software, or automation.",
  ),
  "/contact",
);
export default function ContactPage() {
  return (
    <>
      <PageIntro
        promotion
        eyebrow="Start Project"
        title="Tell us about your business."
        intro="Whether you need a custom website, business management software, or an automation, tell us what you’re trying to improve. We’ll help define the right solution and next steps."
      />
      <Section id="inquiry" className="mk-contact !pt-5">
        <div className="mk-contact-grid">
          <aside className="mk-contact-aside">
            <h2 className="mk-h3">A conversation is a good place to start.</h2>
            <p className="mk-body">
              Share what’s working, what takes too much time, and what you’d
              like to connect. We’ll review your requirements and follow up
              about the right next step.
            </p>
            <div className="mk-frame">
              <Photo
                name="conversation"
                sizes="(max-width: 767px) 100vw, 34vw"
              />
            </div>
            <a className="mk-email !px-0" href={CONTACT.emailHref}>
              {CONTACT.email}
            </a>
            <p className="mk-small">{CONTACT.city}</p>
            <div className="mk-note">
              <p>
                <strong>What happens next?</strong>
              </p>
              <p>
                We review your inquiry, clarify the details, and prepare a
                written proposal with scope and pricing before work begins.
              </p>
              <p>
                Please don’t include passwords, payment details, or private
                child, staff, or customer records.
              </p>
            </div>
          </aside>
          <div className="mk-contact-form">
            <Suspense fallback={<p role="status">Loading inquiry form…</p>}>
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </Section>
    </>
  );
}
