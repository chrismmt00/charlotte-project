import { PageIntro, Section } from "./Parts";
import { CONTACT } from "@/lib/site";

// A status notice, not a generated legal agreement. Drafts remain private in lib/legal.js.
export default function PolicyNotice({ title }) {
  return (
    <>
      <PageIntro
        eyebrow="Policy information"
        title={title}
        intro="The updated policy is awaiting review and approval."
      />
      <Section id="policy-status" className="!pt-7">
        <div className="mk-note max-w-3xl">
          <h2 className="mk-h3">Contact us for policy information.</h2>
          <p>
            An approved version is not yet available on this page. Please
            contact Klyvora Studio with questions about privacy, service
            agreements, or your business data.
          </p>
          <a href={CONTACT.emailHref} className="mk-email !px-0">
            {CONTACT.email}
          </a>
        </div>
      </Section>
    </>
  );
}
