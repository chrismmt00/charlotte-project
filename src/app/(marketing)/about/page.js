import {
  PageIntro,
  Section,
  FinalCta,
  Photo,
} from "@/components/marketing/Parts";
import { pageMetadata } from "@/lib/marketing/seo";
export const metadata = pageMetadata(
  "About Klyvora Studio | Charlotte Web Design & Software",
  "Klyvora Studio is a Charlotte-based custom website and software company helping independent businesses connect their online presence and daily operations.",
  "/about",
);
const VALUES = [
  [
    "Understand",
    "Understand how the business works before deciding what to build.",
  ],
  ["Build", "Build what the business needs, around its brand and its day."],
  ["Keep it practical", "Keep the technology practical, supported, and clear."],
];
export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="Klyvora Studio · Charlotte, NC"
        title="Built for the businesses doing the everyday work."
        intro="Klyvora Studio is a Charlotte-based web design and software company focused on helping independent businesses operate more efficiently."
      />
      <section
        aria-label="Charlotte, North Carolina"
        className="px-6 max-sm:px-4"
      >
        <figure className="container-site mk-banner m-0 mk-reveal">
          <Photo
            name="charlotte"
            priority
            sizes="(max-width: 1240px) 100vw, 1200px"
          />
          <figcaption>Charlotte, North Carolina</figcaption>
        </figure>
      </section>
      <Section id="our-approach">
        <div className="mk-two-col">
          <h2 className="mk-h2">
            Thoughtful design.
            <br />
            Practical software.
            <br />
            <em>Straightforward pricing.</em>
          </h2>
          <div className="mk-body">
            <p>
              We combine custom design with reusable business software so owners
              can spend less time managing disconnected systems and more time
              running their businesses.
            </p>
            <p>
              Our approach is simple: understand how the business works, build
              what it needs, and keep the technology practical.
            </p>
            <p>
              Every website is designed around its business. Industry software
              is configured on our shared platform, with guided setup, a defined
              scope, and support through an active subscription.
            </p>
          </div>
        </div>
        <div className="mk-values">
          {VALUES.map(([title, body], i) => (
            <article key={title} className="mk-reveal">
              <span className="mk-step">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </Section>
      <FinalCta photo="meeting" />
    </>
  );
}
