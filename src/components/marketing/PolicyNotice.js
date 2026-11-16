import { PageIntro, Section } from "./Parts";
import { LEGAL_DOCS, LEGAL_UPDATED } from "@/lib/legal";
import { CONTACT } from "@/lib/site";

// Retain the existing policy page shell, typography, and card styling; content lives in lib/legal.js.
export default function PolicyNotice({ docKey }) {
  const doc = LEGAL_DOCS[docKey];
  return (
    <>
      <PageIntro
        eyebrow="Policy information"
        title={doc.title}
        intro={doc.intro}
      />
      <Section id="policy-content" className="!pt-7">
        <div className="mk-note max-w-3xl">
          <p>Last updated: {LEGAL_UPDATED}</p>
          {doc.sections.map(([id, title, paragraphs]) => (
            <section
              key={id}
              id={`${docKey}-${id}`}
              aria-labelledby={`${docKey}-${id}-heading`}
              className="mb-8 last:mb-0"
            >
              <h2 id={`${docKey}-${id}-heading`} className="mk-h3">
                {title}
              </h2>
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
          <a href={CONTACT.emailHref} className="mk-email !px-0">
            {CONTACT.email}
          </a>
        </div>
      </Section>
    </>
  );
}
