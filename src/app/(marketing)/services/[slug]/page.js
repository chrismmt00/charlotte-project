import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import Section, { Eyebrow } from "@/components/ui/Section";
import Faq from "@/components/ui/Faq";
import { CheckIcon } from "@/components/ui/Bits";
import ServiceDemo from "@/components/offers/ServiceDemo";
import { OFFER_DETAILS, SERVICES, SERVICE_ORDER } from "@/lib/services";
import { RESTAURANT_ADD_ONS, getOffer, money } from "@/lib/offers";

export function generateStaticParams() {
  return SERVICE_ORDER.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const s = SERVICES[slug];
  if (!s) return {};
  return {
    title: s.label,
    description: s.lede,
    alternates: { canonical: `/services/${slug}` },
  };
}

function monthlyBits(o) {
  const m = `${money(o.monthly)}/month`;
  if (o.monthlyRequired) return ["then", m, "· required"];
  return ["optional", m, o.usage ? "+ usage" : ""];
}

function PriceCard({ code, featured }) {
  const o = getOffer(code);
  const d = OFFER_DETAILS[code];
  const [lead, m, tail] = monthlyBits(o);
  const inner = (
    <article className="card-offer flex-1 min-w-0 bg-surface rounded-card p-[30px] box-border flex flex-col gap-3.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] tracking-[.2em] text-muted-2 border border-border-2 rounded-full px-2.5 py-1">{d.code}</span>
        {d.badge ? <span className="text-[11px] text-bg bg-accent-light rounded-full px-2.5 py-1 font-medium">{d.badge}</span> : null}
      </div>
      <h3 className="text-[21px] font-medium m-0">{o.name}</h3>
      <div className="flex items-baseline gap-2 flex-wrap">
        {o.setupFrom ? <span className="text-sm text-muted">from</span> : null}
        <span className="font-display text-[52px] leading-none">{money(o.setup)}</span>
        <span className="text-sm text-muted">setup</span>
      </div>
      <div className="text-sm text-muted-2">
        {lead} <strong className="text-fg font-medium">{m}</strong> {tail}
      </div>
      <p className="text-sm leading-[1.65] text-muted m-0">{d.bestFor}</p>
      <ul className="list-none p-0 m-0 flex flex-col gap-2.5 text-sm text-fg">
        {d.includes.map((t) => (
          <li key={t} className="flex gap-2.5 items-start">
            <CheckIcon size={18} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
      {d.founding ? <p className="text-[13px] text-muted-2 m-0">{d.founding}</p> : null}
      <Button href={`/contact?offer=${code}`} variant={featured ? "primary" : "secondary"} className="mt-auto w-full !px-6 !py-3.5">
        {d.cta}
      </Button>
    </article>
  );
  if (featured) {
    return <div className="flex-[1_1_340px] min-w-0 gradient-ring !rounded-card-lg flex">{inner}</div>;
  }
  return <div className="flex-[1_1_340px] min-w-0 border border-border rounded-card flex">{inner}</div>;
}

// Every slug is prerendered at build. The Suspense boundary lets a client navigation between services
// show the placeholder instantly while the next service's content streams in.
export default function ServicePage({ params }) {
  return (
    <Suspense fallback={<ServiceFallback />}>
      <ServiceContent params={params} />
    </Suspense>
  );
}

function ServiceFallback() {
  return (
    <header className="px-4 sm:px-6 pt-[150px] pb-6" aria-busy="true">
      <div className="container-site flex flex-col gap-6">
        <div className="h-4 w-40 rounded-full bg-surface" />
        <div className="h-[clamp(52px,8vw,112px)] max-w-[820px] rounded-card bg-surface" />
        <div className="h-5 max-w-[560px] rounded-full bg-surface" />
      </div>
    </header>
  );
}

async function ServiceContent({ params }) {
  const { slug } = await params;
  const s = SERVICES[slug];
  if (!s) notFound();
  const offers = s.offers.map(getOffer);

  return (
    <>
      <header className="px-4 sm:px-6 pt-[150px] pb-6">
        <div className="container-site">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted-2 mb-7">
            <Link href="/services" className="hover:text-fg min-h-11 inline-flex items-center">
              Services
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-fg">
              {s.label}
            </span>
          </nav>
          <h1 className="display-page m-0 mb-6 max-w-[980px]">{s.title}</h1>
          <p className="text-[15px] sm:text-base leading-[1.7] text-muted-2 max-w-[640px] m-0">{s.lede}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-7 text-sm text-muted-2">
            {offers.map((o) => {
              const [lead, m, tail] = monthlyBits(o);
              return (
                <span key={o.code}>
                  <strong className="text-fg font-medium">{o.name}</strong> · {o.setupFrom ? "from " : ""}
                  {money(o.setup)} setup · {lead} {m} {tail}
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3.5 mt-9">
            <Button href={`/contact?offer=${s.featured}`}>{s.cta}</Button>
            <Button href="/pricing" variant="secondary">
              See all prices
            </Button>
          </div>
        </div>
      </header>

      <nav aria-label="Services" className="px-4 sm:px-6 mt-10">
        <div className="container-site flex flex-wrap gap-2">
          {SERVICE_ORDER.map((k) => {
            const cur = k === slug;
            return (
              <Link
                key={k}
                href={`/services/${k}`}
                aria-current={cur ? "page" : undefined}
                className={`text-[13px] border rounded-full px-4 py-2.5 min-h-11 box-border inline-flex items-center transition-colors duration-200 ${
                  cur ? "text-bg bg-fg border-fg" : "text-muted-2 border-border hover:text-fg hover:border-border-2"
                }`}
              >
                {SERVICES[k].label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Section id="features" eyebrow="What you get" title={s.featuresTitle}>
        <ul className="list-none p-0 m-0 flex flex-wrap gap-[18px] mt-6">
          {s.features.map(([t, d], i) => (
            <li key={t} className="flex-[1_1_250px] min-w-0 border-t border-border pt-7 flex flex-col gap-2">
              <Eyebrow accent>{String(i + 1).padStart(2, "0")}</Eyebrow>
              <h3 className="text-xl font-medium m-0">{t}</h3>
              <p className="text-sm text-muted leading-[1.65] m-0">{d}</p>
            </li>
          ))}
        </ul>
      </Section>

      <section aria-labelledby="demo-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site flex flex-wrap gap-12 items-start">
          <div className="flex-[1_1_360px] min-w-0">
            <Eyebrow className="mb-[18px]">See it working</Eyebrow>
            <h2 id="demo-h" className="display-2 m-0 mb-3.5">
              {s.demoTitle}
            </h2>
            <p className="text-[15px] leading-[1.7] text-muted-2 m-0 mb-8 max-w-[460px]">{s.demoText}</p>
            <Eyebrow className="mb-3">Built for</Eyebrow>
            <ul className="list-none p-0 m-0 flex flex-wrap gap-2">
              {s.who.map((w) => (
                <li key={w} className="text-[13px] text-muted-2 border border-border rounded-full px-3.5 py-2">
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <div id="demo" className="flex-[1_1_440px] min-w-0 scroll-mt-[100px] border border-dashed border-border-2 rounded-tile p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2">
                <span className="text-[11px] tracking-[.2em] uppercase text-bg bg-accent-light rounded-full px-2.5 py-1 font-medium">Demo</span>
                <span className="text-[13px] text-muted-2">{s.demoTag}</span>
              </span>
              <span className="text-xs text-muted-2">Working example · takes no money</span>
            </div>
            <ServiceDemo kind={s.demo} />
          </div>
        </div>
      </section>

      <Section
        id="pricing"
        eyebrow="Pricing"
        title="What it costs"
        lede="Setup once; the monthly plan is optional on everything but restaurants. Setup is paid 50% at kickoff, 30% at a working demo and 20% at launch."
      >
        <div className="flex flex-wrap gap-5 items-stretch">
          {s.offers.map((c) => (
            <PriceCard key={c} code={c} featured={c === s.featured && s.offers.length > 1} />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-4">
          {s.notes.map(([t, d]) => (
            <div key={t} className="flex-[1_1_300px] min-w-0 flex gap-3 items-start bg-[rgba(var(--surface-rgb),.5)] border border-border rounded-card p-5">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-accent-light flex-none mt-0.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5" />
                <path d="M12 8h.01" />
              </svg>
              <span className="text-sm leading-[1.6] text-muted-2">
                <strong className="text-fg font-medium block mb-0.5">{t}</strong>
                {d}
              </span>
            </div>
          ))}
        </div>
        {s.addOns ? (
          <div className="mt-12">
            <h3 className="text-xl font-medium m-0 mb-2">Restaurant add-ons</h3>
            <p className="text-sm text-muted-2 m-0 mb-5">Add any of these to Restaurant core. The mobile-friendly web ordering is already included.</p>
            <div className="overflow-x-auto border border-border rounded-card" tabIndex={0} role="region" aria-label="Restaurant add-on prices">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <caption className="sr-only">Restaurant add-on prices</caption>
                <thead>
                  <tr className="text-left">
                    <th scope="col" className="p-4 font-medium">Add-on</th>
                    <th scope="col" className="p-4 font-medium">Setup</th>
                    <th scope="col" className="p-4 font-medium">Monthly</th>
                  </tr>
                </thead>
                <tbody>
                  {RESTAURANT_ADD_ONS.map((a) => (
                    <tr key={a.code} className="border-t border-border">
                      <td className="p-4 text-fg">{a.name}</td>
                      <td className="p-4 text-muted-2">
                        {a.setupFrom ? "from " : ""}
                        {money(a.setup)}
                        {a.setupNote ? ` ${a.setupNote}` : ""}
                      </td>
                      <td className="p-4 text-muted-2">
                        {money(a.monthly)}
                        {a.monthlyNote ? ` ${a.monthlyNote}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        <p className="text-[13px] text-muted-2 leading-[1.6] mt-6 mb-0 max-w-[820px]">
          The monthly plan covers hosting, our admin, support from a local person and small changes, with limits written into your proposal. It is optional on everything but restaurants. Billed separately: hardware, onsite installation and travel, payment processing, delivery services, third-party subscriptions, and AI or messaging usage.
        </p>
      </Section>

      {s.pilot ? (
        <section aria-labelledby="pilot-h" className="px-4 sm:px-6 pt-[110px] pb-10">
          <div className="container-site border border-border rounded-tile px-6 sm:px-11 py-12 bg-[radial-gradient(90%_120%_at_80%_8%,rgba(137,170,204,.22),transparent_55%),var(--bg-deep)] flex flex-wrap gap-8 items-center justify-between">
            <div className="flex-[1_1_420px] min-w-0">
              <Eyebrow accent className="mb-3.5">
                Restaurant pilot
              </Eyebrow>
              <h2 id="pilot-h" className="display-2 m-0 mb-3">
                Run it in your restaurant first.
              </h2>
              <p className="text-[15px] leading-[1.7] text-muted-2 m-0">
                We&apos;re setting up the platform with [NUMBER] Charlotte restaurants before a wider launch. Pilot terms: [PILOT TERMS].
              </p>
            </div>
            <Button href="/contact?offer=RC">Ask about the pilot</Button>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="faq-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site flex flex-wrap gap-x-16 gap-y-10 items-start">
          <div className="flex-[1_1_320px] min-w-0">
            <Eyebrow className="mb-[18px]">Questions</Eyebrow>
            <h2 id="faq-h" className="display-2 m-0">
              Straight answers
            </h2>
          </div>
          <div className="flex-[2_1_520px] min-w-0">
            <Faq items={s.faq.map(([q, a]) => ({ q, a }))} />
          </div>
        </div>
      </section>

      <section aria-labelledby="cta-h" className="px-4 sm:px-6 pt-[110px] pb-20">
        <div className="container-site text-center flex flex-col items-center gap-4">
          <h2 id="cta-h" className="display-2 italic m-0">
            {s.ctaTitle}
          </h2>
          <p className="text-[15px] leading-[1.7] text-muted-2 max-w-[520px] m-0">
            A free 30-minute call, then a fixed-price proposal in plain English. We reply within a day.
          </p>
          <Button href={`/contact?offer=${s.featured}`} className="mt-4">
            {s.cta}
          </Button>
        </div>
      </section>
    </>
  );
}
