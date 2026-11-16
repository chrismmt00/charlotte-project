import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  Section,
  IndustryCards,
  IndustryIcon,
  FinalCta,
  FloatCard,
  OfferStrip,
  Photo,
  Process,
} from "@/components/marketing/Parts";
import { CUSTOM_SERVICES, money } from "@/lib/marketing/catalog";
import { SERVICE_PHOTOS } from "@/lib/marketing/photos";
import { pageMetadata } from "@/lib/marketing/seo";
import { CONTACT, SITE_URL } from "@/lib/site";

export const metadata = pageMetadata(
  "Custom Websites & Business Software | Klyvora Studio",
  "Custom website design and connected business software for small businesses in Charlotte and beyond. Explore industry solutions, transparent pricing, and practical automation.",
  "/",
);

const HERO_POINTS = [
  "Custom design",
  "Straightforward setup",
  "Ongoing software support",
];

const BENEFITS = [
  [
    "websites",
    "Custom Frontend",
    "A website designed around your identity, products, and services.",
  ],
  [
    "software",
    "Business Management",
    "Relevant tools for bookings, orders, staff, customers, and everyday operations.",
  ],
  [
    "automation",
    "Ongoing Improvements",
    "Platform updates and maintenance included with your active software subscription.",
  ],
];

function Tick() {
  return (
    <span className="mk-check" aria-hidden="true">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 12 5 5 9-10" />
      </svg>
    </span>
  );
}

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
        <div className="mk-glow" aria-hidden="true" />
        <div className="container-site mk-hero-grid">
          <div>
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
              business tools built for your industry. From bookings and orders
              to customers and daily operations, we bring the important parts
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
            <ul className="mk-hero-points">
              {HERO_POINTS.map((t) => (
                <li key={t}>
                  <Tick />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="mk-hero-visual">
            <div className="mk-frame mk-hero-main">
              <Photo
                name="owner"
                position="22% center"
                priority
                sizes="(max-width: 1023px) 100vw, 44vw"
              />
            </div>
            <div className="mk-hero-inset">
              <Photo name="cafeOwner" priority sizes="220px" />
            </div>
            <FloatCard
              label="Orders"
              text="Online ordering for pickup"
              tone="success"
              className="mk-float-pos-0"
            />
            <FloatCard
              label="Bookings"
              text="Appointment reminders"
              className="mk-float-pos-1"
            />
            <FloatCard
              label="Customers"
              text="Customer and sales records"
              className="mk-float-pos-2"
            />
          </div>
        </div>
        <div className="container-site mk-hero-foot">
          <span>Websites, ordering, booking, and operations, connected.</span>
          <Link href="/about">
            Based in Charlotte, NC <span aria-hidden="true">&nbsp;↗</span>
          </Link>
        </div>
      </header>
      <OfferStrip />
      <Section
        id="solutions"
        eyebrow="Your industry. Your way of working."
        title="Built around your business."
        intro="Different businesses need different tools. Choose your industry and get a website and management system configured for the way you work."
      >
        <IndustryCards />
      </Section>
      <Section id="platform" className="mk-platform">
        <div className="mk-split">
          <div className="mk-split-media mk-reveal">
            <div className="mk-frame mk-frame-tall">
              <Photo name="tablet" sizes="(max-width: 1023px) 100vw, 46vw" />
            </div>
            <FloatCard
              label="Dashboard"
              text="Tablet-friendly staff and owner dashboard"
              className="mk-float-pos-0"
            />
            <FloatCard
              label="Team"
              text="Employee accounts and permissions"
              tone="success"
              className="mk-float-pos-1"
            />
          </div>
          <div className="mk-platform-head">
            <p className="eyebrow mk-eyebrow">One connected platform</p>
            <h2 className="mk-h2">
              Your website and business tools, <em>working together.</em>
            </h2>
            <p>
              Your website is what customers see. Klyvora’s management platform
              helps you handle what happens behind the scenes.
            </p>
            <p>
              Manage the tools your business needs from one place, with features
              and workflows tailored to your industry.
            </p>
            <div className="mk-benefits">
              {BENEFITS.map(([icon, title, body]) => (
                <article key={title} className="mk-reveal">
                  <span className="mk-benefit-icon">
                    <IndustryIcon id={icon} size={20} />
                  </span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </Section>
      <Section
        id="custom-services"
        eyebrow="A different starting point"
        title="Need something different?"
      >
        <div className="mk-service-grid">
          {CUSTOM_SERVICES.map((s) => (
            <article className="mk-service-card mk-reveal" key={s.id}>
              <div className="mk-service-media">
                <Photo
                  name={SERVICE_PHOTOS[s.id]}
                  alt=""
                  sizes="(max-width: 767px) 100vw, 33vw"
                />
                <span className="mk-card-badge">
                  <IndustryIcon id={s.id} size={16} />
                  From {money(s.setup)}
                </span>
              </div>
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
        className="mk-platform"
        eyebrow="A clear path forward"
        title="From first conversation to launch."
      >
        <Process />
      </Section>
      <FinalCta photo="apron" />
    </>
  );
}
