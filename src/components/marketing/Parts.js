import Link from "next/link";
import Button from "@/components/ui/Button";
import Faq from "@/components/ui/Faq";
import { CONTACT } from "@/lib/site";
import {
  INDUSTRIES,
  money,
  quoteHref,
  recurringLabel,
  PROCESS,
} from "@/lib/marketing/catalog";

export function IndustryIcon({ id }) {
  const paths = {
    restaurants: (
      <>
        <path d="M7 3v7m-3-7v4a3 3 0 0 0 6 0V3M7 10v11M19 3c-3 3-4 6-4 10h4m0-10v18" />
      </>
    ),
    daycare: (
      <>
        <path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-7h6v7" />
        <path d="M10 8h4" />
      </>
    ),
    beauty: (
      <>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="m8.5 7.5 12 13m-12-4 12-13M12 12l2-2" />
      </>
    ),
    ecommerce: (
      <>
        <path d="M4 7h16l1 14H3L4 7Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2m-8 4h.01M16 12h.01" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[id]}
    </svg>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
}) {
  return (
    <section
      id={id}
      className={`mk-section ${className}`}
      aria-labelledby={id && title ? `${id}-title` : undefined}
    >
      <div className="container-site">
        {eyebrow && <p className="eyebrow mk-eyebrow">{eyebrow}</p>}
        {title && (
          <h2 id={id ? `${id}-title` : undefined} className="mk-h2">
            {title}
          </h2>
        )}
        {intro && <p className="mk-intro">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function PageIntro({ eyebrow, title, intro, children }) {
  return (
    <header className="mk-page-intro">
      <div className="container-site">
        <p className="eyebrow mk-eyebrow">{eyebrow}</p>
        <h1 className="mk-h1">{title}</h1>
        <p className="mk-intro">{intro}</p>
        {children}
      </div>
    </header>
  );
}

export function Price({ service, compact = false }) {
  return (
    <div className={`mk-price ${compact ? "mk-price-compact" : ""}`}>
      <span className="mk-price-label">
        {service.kind === "industry" ? "Starting setup" : "Starting from"}
      </span>
      <div>
        <strong>{money(service.setup)}</strong>
        <span>
          {service.kind === "industry" ? " one time" : " project setup"}
        </span>
      </div>
      <p>{recurringLabel(service)}</p>
    </div>
  );
}

export function FeatureList({ items }) {
  return (
    <ul className="mk-feature-list">
      {items.map((item) => (
        <li key={item}>
          <span aria-hidden="true">✓</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function IndustryCards({ detailed = false, pricing = false }) {
  return (
    <div className="mk-industry-grid">
      {INDUSTRIES.map((service, index) => (
        <article
          key={service.id}
          className={`mk-industry-card mk-industry-${service.id}`}
        >
          <div className="mk-card-top">
            <span className="mk-icon">
              <IndustryIcon id={service.id} />
            </span>
            <span className="mk-card-number" aria-hidden="true">
              0{index + 1}
            </span>
          </div>
          <h3>
            <Link href={service.href}>{service.name}</Link>
          </h3>
          <p className="mk-card-copy">{service.summary}</p>
          {detailed || pricing ? (
            <>
              <Price service={service} compact />
              <FeatureList items={service.outcomes} />
              {pricing && (
                <p className="mk-small">
                  {service.tablet
                    ? "Includes one compatible standard tablet and basic stand."
                    : "No physical tablet included."}
                </p>
              )}
            </>
          ) : (
            <p className="mk-card-price">
              Starting at <strong>{money(service.setup)}</strong> +{" "}
              <strong>{money(service.monthly)}/month</strong>
            </p>
          )}
          <Link className="mk-text-link" href={service.href}>
            {pricing ? "View Solution" : `Explore ${service.name}`}
            <span aria-hidden="true">↗</span>
          </Link>
        </article>
      ))}
    </div>
  );
}

export function HardwareNote() {
  return (
    <div className="mk-note mk-hardware">
      <div>
        <p className="eyebrow mk-eyebrow">Already equipped?</p>
        <h2 className="mk-h3">Use the equipment you already have.</h2>
      </div>
      <div>
        <p>
          Already have tablets, computers, or business hardware? We’ll review
          compatibility before recommending new equipment.
        </p>
        <p>
          Supported devices can be connected during setup. Additional hardware
          and specialized integrations are quoted only when needed.
        </p>
      </div>
    </div>
  );
}

export function Process() {
  return (
    <ol className="mk-process">
      {PROCESS.map(([title, body], i) => (
        <li key={title}>
          <span className="eyebrow">0{i + 1}</span>
          <h3>{title}</h3>
          <p>{body}</p>
        </li>
      ))}
    </ol>
  );
}

export function FaqSection({ items }) {
  return (
    <Section
      id="questions"
      eyebrow="A few answers"
      title="Good questions. Clear answers."
    >
      <Faq items={items} openFirst={false} />
    </Section>
  );
}

export function FinalCta({ service }) {
  return (
    <Section
      id="get-started"
      className="mk-final"
      eyebrow="Let’s connect"
      title={
        service
          ? "Let’s shape the right setup for you."
          : "Ready for a simpler way to run your business?"
      }
      intro="Tell us what you’re working with and what you’d like to improve. We’ll help you find a practical starting point."
    >
      <div className="mk-actions">
        <Button href={service ? quoteHref(service) : "/contact"}>
          {service ? service.cta : "Get Your Quote"}
          <span aria-hidden="true">↗</span>
        </Button>
        <a className="mk-email" href={CONTACT.emailHref}>
          {CONTACT.email}
        </a>
      </div>
    </Section>
  );
}
