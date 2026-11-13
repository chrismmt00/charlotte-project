import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Section";
import { CheckIcon } from "@/components/ui/Bits";
import { caseSlugs, getCase, nextCase } from "@/lib/cases";
import { getOffer, money, setupLabel } from "@/lib/offers";

export function generateStaticParams() {
  return caseSlugs();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) return { title: "Case study not found", robots: { index: false } };
  return {
    title: `${c.client} case study`,
    description: c.summary,
    alternates: { canonical: `/work/${c.slug}` },
  };
}

const MEDIA_BG = [
  "bg-[conic-gradient(from_210deg_at_70%_65%,rgba(78,133,191,.3),var(--bg-deep)_42%),var(--bg-deep)]",
  "bg-[radial-gradient(90%_120%_at_80%_8%,rgba(137,170,204,.32),transparent_55%),var(--bg-deep)]",
];

function Part({ num, id, title, note, children }) {
  return (
    <div className="container-site flex flex-wrap gap-x-16 gap-y-6">
      <div className="flex-[1_1_260px] min-w-0">
        <Eyebrow accent as="span">
          {num}
        </Eyebrow>
        <h2 id={id} className="font-display font-normal text-[clamp(32px,4vw,44px)] leading-[1.1] m-0 mt-2.5">
          {title}
        </h2>
        {note ? <p className="text-sm text-muted mt-2.5 mb-0 leading-[1.6]">{note}</p> : null}
      </div>
      {children}
    </div>
  );
}

function priceLine(o) {
  const monthly = `${money(o.monthly)}/month${o.usage ? " + usage" : ""}`;
  const plan = o.monthlyRequired ? " (required on restaurant plans)" : " (optional)";
  const hw = o.slug === "restaurants" ? " · kiosk hardware billed separately" : "";
  return `${setupLabel(o)} setup · ${monthly}${plan}${hw}`;
}

// Prerendered from generateStaticParams. The Suspense boundary keeps params (URL data) out of the static shell.
export default function CasePage({ params }) {
  return (
    <Suspense fallback={<CaseFallback />}>
      <CaseContent params={params} />
    </Suspense>
  );
}

function CaseFallback() {
  return (
    <header className="px-4 sm:px-6 pt-[150px] pb-10" aria-busy="true">
      <div className="container-site flex flex-col gap-6">
        <div className="h-4 w-40 rounded-full bg-surface" />
        <div className="h-[clamp(44px,7vw,96px)] max-w-[820px] rounded-card bg-surface" />
        <div className="h-5 max-w-[560px] rounded-full bg-surface" />
      </div>
    </header>
  );
}

async function CaseContent({ params }) {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) notFound();
  const offer = getOffer(c.offerCode);
  const next = nextCase(c.slug);
  const chips = [
    offer ? `${offer.name} · ${setupLabel(offer)} setup · ${money(offer.monthly)}/month` : null,
    ...(c.addOns || []),
    `${c.weeks} weeks from kickoff to launch`,
  ].filter(Boolean);

  return (
    <>
      <header className="relative px-4 sm:px-6 pt-[150px] pb-12 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(55%_80%_at_70%_0%,rgba(78,133,191,.22),transparent_70%)]" />
        <div className="relative container-site flex flex-col gap-[22px]">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <ol className="list-none p-0 m-0 flex flex-wrap items-center gap-2.5 text-[13px] text-muted-2">
              <li>
                <Link href="/work" className="min-h-11 inline-flex items-center hover:text-fg">
                  Work
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-fg">
                {c.client}
              </li>
            </ol>
          </nav>
          <div className="flex flex-wrap gap-2 eyebrow">
            <span className="text-accent-light">{c.service}</span>
            <span>· {c.area}, Charlotte</span>
            <span>· launched {c.launched}</span>
          </div>
          <h1 className="font-display italic font-normal text-[clamp(44px,7vw,96px)] leading-[.95] tracking-[-.02em] m-0 max-w-[1000px]">
            {c.client}: {c.headline}.
          </h1>
          <ul className="list-none p-0 m-0 flex flex-wrap gap-2.5">
            {chips.map((t) => (
              <li key={t} className="chip text-[13px] text-muted-2 border border-border-2 rounded-full px-3.5 py-2">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <section aria-label="Screenshots" className="px-4 sm:px-6 pb-10">
        <div className="container-site grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4">
          {c.media.map((m, i) => (
            // Swap these for next/image screenshots once the case is real.
            <span
              key={m.label}
              role="img"
              aria-label={m.label}
              className={`aspect-[16/10] rounded-tile border border-border ${MEDIA_BG[i % MEDIA_BG.length]} flex items-end p-[18px]`}
            >
              <span aria-hidden="true" className="text-[11px] text-muted-2 bg-[rgba(var(--bg-rgb),.7)] rounded-full px-2.5 py-1">
                {m.label}
              </span>
            </span>
          ))}
        </div>
      </section>

      <section aria-labelledby="c1" className="section-problem px-4 sm:px-6 pt-[70px] pb-5">
        <Part num="01" id="c1" title="The problem">
          <div className="flex-[2_1_520px] min-w-0 flex flex-col gap-4">
            {c.problem.map((p) => (
              <p key={p} className="text-base leading-[1.75] text-muted-2 m-0 max-w-[720px]">
                {p}
              </p>
            ))}
          </div>
        </Part>
      </section>

      <section aria-labelledby="c2" className="section-built px-4 sm:px-6 pt-[50px] pb-5">
        <Part num="02" id="c2" title="What we built">
          <div className="flex-[2_1_520px] min-w-0 flex flex-col gap-4">
            <p className="text-base leading-[1.75] text-muted-2 m-0 max-w-[720px]">{c.built}</p>
            <ul className="list-none m-0 p-0 grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-2.5">
              {c.pieces.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm text-muted-2">
                  <span className="mt-[3px]">
                    <CheckIcon size={16} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </Part>
      </section>

      <section aria-labelledby="c3" className="section-result px-4 sm:px-6 pt-[50px] pb-5">
        <Part
          num="03"
          id="c3"
          title="The result"
          note="Measured in the owner’s numbers, before and after. Nothing here is ours to invent; every figure comes from them."
        >
          <dl className="flex-[2_1_520px] min-w-0 m-0 grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
            {c.metrics.map((m) => (
              <div key={m.label} className="stat bg-surface border border-border rounded-card px-6 py-[22px] flex flex-col gap-1.5">
                <dt className="text-[13px] text-muted-2">{m.label}</dt>
                <dd className="m-0 font-display text-[44px] leading-none break-words">{m.value}</dd>
                <dd className="m-0 text-[13px] text-muted-2">{m.period}</dd>
              </div>
            ))}
          </dl>
        </Part>
      </section>

      <section aria-labelledby="c4" className="section-quote px-4 sm:px-6 pt-[50px] pb-[70px]">
        <Part num="04" id="c4" title="In their words">
          <figure className="flex-[2_1_520px] min-w-0 m-0 border-l-2 border-accent-light py-1.5 pl-7 flex flex-col gap-3.5">
            <blockquote className="m-0 font-display italic text-[clamp(24px,3vw,34px)] leading-[1.25]">“{c.quote}”</blockquote>
            <figcaption className="text-sm text-muted-2 flex items-center gap-3">
              <span aria-hidden="true" className="w-10 h-10 rounded-full bg-surface border border-border-2 inline-flex items-center justify-center text-[13px] text-fg flex-none">
                {c.owner.replace(/^\[/, "").charAt(0)}
              </span>
              {c.owner}, owner of {c.client}
            </figcaption>
          </figure>
        </Part>
      </section>

      {offer ? (
        <section aria-labelledby="offer-h" className="px-4 sm:px-6 pb-[70px]">
          <div className="container-site gradient-ring !rounded-card-lg">
            <div className="bg-surface rounded-card p-6 sm:p-9 flex flex-wrap justify-between items-center gap-5">
              <div className="flex flex-col gap-1.5 min-w-0">
                <Eyebrow as="span">The offer they used</Eyebrow>
                <h2 id="offer-h" className="text-[22px] font-medium m-0">
                  {offer.name}
                </h2>
                <span className="text-sm text-muted-2">{priceLine(offer)}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button href={`/services/${c.serviceSlug}`}>See the {c.service.toLowerCase()} offer</Button>
                <Button href="/quote" variant="secondary" className="!px-6">
                  Build an estimate
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <nav aria-label="More work" className="px-4 sm:px-6 pb-[110px]">
        <div className="container-site flex flex-wrap justify-between items-center gap-3 border-t border-border pt-6">
          <Link href="/work" className="text-sm text-accent-light min-h-11 inline-flex items-center hover:text-fg">
            <span aria-hidden="true">←&nbsp;</span>All case studies
          </Link>
          {next ? (
            <Link href={`/work/${next.slug}`} className="text-sm text-accent-light min-h-11 inline-flex items-center hover:text-fg">
              Next: {next.client}
              <span aria-hidden="true">&nbsp;→</span>
            </Link>
          ) : null}
        </div>
      </nav>
    </>
  );
}
