import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  Section,
  IndustryCards,
  FinalCta,
  Process,
} from "@/components/marketing/Parts";
import { CUSTOM_SERVICES, money } from "@/lib/marketing/catalog";
import { pageMetadata } from "@/lib/marketing/seo";
import { CONTACT, SITE_URL } from "@/lib/site";

export const metadata = pageMetadata(
  "Custom Websites & Business Software | Klyvora Studio",
  "Custom website design and connected business software for small businesses in Charlotte and beyond. Explore industry solutions, transparent pricing, and practical automation.",
  "/",
);

export default function Home() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Klyvora Studio",
    url: SITE_URL,
    email: CONTACT.email,
    description:
      "Charlotte-based custom website design and business software company.",
    areaServed: { "@type": "City", name: "Charlotte, North Carolina" },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organization).replace(/</g, "\\u003c"),
        }}
      />
      <header className="mk-hero">
        <div className="container-site mk-hero-content">
          <p className="eyebrow mk-eyebrow">
            Custom websites + business software
          </p>
          <h1 className="mk-h1">
            A custom website.
            <br />
            <em>One system</em> to run
            <br className="hidden sm:block" /> your business.
          </h1>
          <p className="mk-intro">
            Klyvora designs websites around your brand and connects them to
            business tools built for your industry. From bookings and orders to
            customers and daily operations, we bring the important parts
            together.
          </p>
          <div className="mk-actions">
            <Button href="/solutions">
              Explore Industry Solutions <span aria-hidden="true">↗</span>
            </Button>
            <Button href="/pricing" variant="secondary">
              See Pricing
            </Button>
          </div>
          <div className="mk-hero-foot">
            <span>
              Custom design. Straightforward setup. Ongoing software support.
            </span>
            <Link href="/about">
              Based in Charlotte, NC <span aria-hidden="true">&nbsp;↗</span>
            </Link>
          </div>
        </div>
      </header>
      <Section
        id="solutions"
        eyebrow="Your industry. Your way of working."
        title="Built around your business."
        intro="Different businesses need different tools. Choose your industry and get a website and management system configured for the way you work."
      >
        <IndustryCards />
      </Section>
      <Section id="platform" className="mk-platform">
        <div className="mk-platform-head">
          <div>
            <p className="eyebrow mk-eyebrow">One connected platform</p>
            <h2 className="mk-h2">
              Your website and business tools, working together.
            </h2>
          </div>
          <div>
            <p>
              Your website is what customers see. Klyvora’s management platform
              helps you handle what happens behind the scenes.
            </p>
            <p>
              Manage the tools your business needs from one place, with features
              and workflows tailored to your industry.
            </p>
          </div>
        </div>
        <div className="mk-benefits">
          {[
            [
              "Custom Frontend",
              "A website designed around your identity, products, and services.",
            ],
            [
              "Business Management",
              "Relevant tools for bookings, orders, staff, customers, and everyday operations.",
            ],
            [
              "Ongoing Improvements",
              "Platform updates and maintenance included with your active software subscription.",
            ],
          ].map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </Section>
      <Section
        id="custom-services"
        eyebrow="A different starting point"
        title="Need something different?"
      >
        <div className="mk-service-grid">
          {CUSTOM_SERVICES.map((s) => (
            <article className="mk-service-card" key={s.id}>
              <h3>{s.id === "software" ? "Custom Software" : s.name}</h3>
              <p>
                {s.summary} Starting at {money(s.setup)}.
              </p>
              <Link className="mk-text-link" href={s.href}>
                {s.id === "websites"
                  ? "Explore Custom Websites"
                  : s.id === "automation"
                    ? "Explore AI Automation"
                    : "Explore Custom Software"}
                <span aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
      </Section>
      <Section
        id="process"
        eyebrow="A clear path forward"
        title="From first conversation to launch."
      >
        <Process />
      </Section>
      <FinalCta />
    </>
  );
}
