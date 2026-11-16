import Link from "next/link";
import Button from "@/components/ui/Button";
import Faq from "@/components/ui/Faq";
import { CONTACT } from "@/lib/site";
import {
  INDUSTRIES,
  CUSTOM_SERVICES,
  money,
  quoteHref,
  recurringLabel,
  PROCESS,
} from "@/lib/marketing/catalog";
import {
  PHOTOS,
  INDUSTRY_PHOTOS,
  photoUrl,
  photoSrcSet,
} from "@/lib/marketing/photos";

export function IndustryIcon({ id, size = 28 }) {
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
    websites: (
      <>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M3 8h18M8 21h8M12 18v3" />
      </>
    ),
    automation: (
      <>
        <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />
      </>
    ),
    software: (
      <>
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[id]}
    </svg>
  );
}

// Responsive photo from Unsplash's CDN. Decorative photos pass alt="".
export function Photo({
  name,
  sizes = "(max-width: 767px) 100vw, 50vw",
  priority = false,
  alt,
  className = "",
  position,
}) {
  const p = PHOTOS[name];
  if (!p) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Unsplash's CDN already resizes; srcset covers widths.
    <img
      className={`mk-photo ${className}`}
      src={photoUrl(name, 1280)}
      srcSet={photoSrcSet(name)}
      sizes={sizes}
      alt={alt ?? p.alt}
      width={1280}
      height={853}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      style={position ? { objectPosition: position } : undefined}
    />
  );
}

// Small illustrative UI card that floats over photos. Labels come from real catalog features.
export function FloatCard({ label, text, tone = "accent", className = "" }) {
  return (
    <div className={`mk-float ${className}`} aria-hidden="true">
      <span className={`mk-float-dot mk-float-${tone}`} />
      <span>
        <span className="mk-float-label">{label}</span>
        <span className="mk-float-text">{text}</span>
      </span>
    </div>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
  center = false,
}) {
  return (
    <section
      id={id}
      className={`mk-section ${center ? "mk-center" : ""} ${className}`}
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

export function PageIntro({
  eyebrow,
  title,
  intro,
  children,
  photo,
  photoAlt,
  floats = [],
  mosaic,
}) {
  const visual = mosaic ? (
    <div className="mk-mosaic">
      {mosaic.map((name, i) => (
        <div key={name} className={`mk-mosaic-cell mk-mosaic-${i}`}>
          <Photo
            name={name}
            alt=""
            priority={i < 2}
            sizes="(max-width: 767px) 50vw, 25vw"
          />
        </div>
      ))}
    </div>
  ) : photo ? (
    <div className="mk-intro-visual">
      <div className="mk-frame mk-frame-tall">
        <Photo
          name={photo}
          alt={photoAlt}
          priority
          sizes="(max-width: 1023px) 100vw, 46vw"
        />
      </div>
      {floats.map((f, i) => (
        <FloatCard key={f.text} {...f} className={`mk-float-pos-${i}`} />
      ))}
    </div>
  ) : null;
  return (
    <header className={`mk-page-intro ${visual ? "mk-page-intro-split" : ""}`}>
      <div className="mk-glow" aria-hidden="true" />
      <div className="container-site mk-page-intro-grid">
        <div className="mk-page-intro-copy">
          <p className="eyebrow mk-eyebrow">{eyebrow}</p>
          <h1 className="mk-h1">{title}</h1>
          <p className="mk-intro">{intro}</p>
          {children}
        </div>
        {visual}
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

function Check() {
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

export function FeatureList({ items }) {
  return (
    <ul className="mk-feature-list">
      {items.map((item) => (
        <li key={item}>
          <Check />
          {item}
        </li>
      ))}
    </ul>
  );
}

// Feature tiles for "what's included" sections.
export function FeatureGrid({ items }) {
  return (
    <ul className="mk-feature-grid">
      {items.map((item) => (
        <li key={item} className="mk-reveal">
          <Check />
          <span>{item}</span>
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
          className={`mk-industry-card mk-industry-${service.id} mk-reveal`}
        >
          <div className="mk-card-media">
            <Photo
              name={INDUSTRY_PHOTOS[service.id][0]}
              alt=""
              sizes="(max-width: 540px) 100vw, (max-width: 1050px) 50vw, 25vw"
            />
            <span className="mk-card-badge">
              <IndustryIcon id={service.id} size={18} />0{index + 1}
            </span>
          </div>
          <div className="mk-card-body">
            <h3>
              <Link href={service.href} className="mk-card-link">
                {service.name}
              </Link>
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
            <span className="mk-text-link" aria-hidden="true">
              {pricing ? "View Solution" : `Explore ${service.name}`}
              <span className="mk-arrow">↗</span>
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

// Scrolling strip of everything Klyvora builds. Duplicated once for a seamless loop.
export function OfferStrip() {
  const items = [
    ...INDUSTRIES.map((s) => [s.id, s.name]),
    ...CUSTOM_SERVICES.map((s) => [s.id, s.name]),
  ];
  const row = (hidden) =>
    items.map(([id, name]) => (
      <li key={`${id}${hidden ? "-b" : ""}`} aria-hidden={hidden || undefined}>
        <IndustryIcon id={id} size={18} />
        {name}
      </li>
    ));
  return (
    <div className="mk-strip">
      <ul aria-label="What Klyvora builds">
        {row(false)}
        {row(true)}
      </ul>
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
        <li key={title} className="mk-reveal">
          <span className="mk-step">0{i + 1}</span>
          <h3>{title}</h3>
          <p>{body}</p>
        </li>
      ))}
    </ol>
  );
}

export function FaqSection({ items }) {
  return (
    <section
      id="questions"
      className="mk-section"
      aria-labelledby="questions-title"
    >
      <div className="container-site mk-faq">
        <div>
          <p className="eyebrow mk-eyebrow">A few answers</p>
          <h2 id="questions-title" className="mk-h2">
            Good questions. Clear answers.
          </h2>
          <p className="mk-body">
            Still wondering about something?{" "}
            <a className="mk-inline-link" href={CONTACT.emailHref}>
              Ask us directly
            </a>
            .
          </p>
        </div>
        <Faq items={items} openFirst={false} />
      </div>
    </section>
  );
}

export function FinalCta({ service, photo }) {
  const pic =
    photo ||
    (service ? INDUSTRY_PHOTOS[service.id]?.[1] : null) ||
    "conversation";
  return (
    <section
      id="get-started"
      className="mk-final-wrap"
      aria-labelledby="get-started-title"
    >
      <div className="container-site">
        <div className="mk-final">
          <div className="mk-final-copy">
            <p className="eyebrow mk-eyebrow">Let’s connect</p>
            <h2 id="get-started-title" className="mk-h2">
              {service
                ? "Let’s shape the right setup for you."
                : "Ready for a simpler way to run your business?"}
            </h2>
            <p className="mk-intro">
              Tell us what you’re working with and what you’d like to improve.
              We’ll help you find a practical starting point.
            </p>
            <div className="mk-actions">
              <Button href={service ? quoteHref(service) : "/contact"}>
                {service ? service.cta : "Get Your Quote"}
                <span aria-hidden="true">↗</span>
              </Button>
              <a className="mk-email" href={CONTACT.emailHref}>
                {CONTACT.email}
              </a>
            </div>
          </div>
          <div className="mk-final-media">
            <Photo name={pic} alt="" sizes="(max-width: 767px) 100vw, 40vw" />
          </div>
        </div>
      </div>
    </section>
  );
}
