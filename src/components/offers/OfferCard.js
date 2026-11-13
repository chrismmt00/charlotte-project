import Link from "next/link";
import { money } from "@/lib/offers";

function Body({ o, blurb, cta, highlight }) {
  const required = o.monthlyRequired;
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="self-start text-[11px] tracking-[.2em] text-muted-2 border border-border-2 rounded-full px-2.5 py-1">
          {o.code === "AH" || o.code === "CA" ? "Custom" : o.code}
        </span>
        {o.featured ? (
          <span className="text-[11px] text-bg bg-accent-light rounded-full px-2.5 py-1 font-medium">Most popular</span>
        ) : null}
        {o.setupFrom ? (
          <span className="text-[11px] text-muted-2 border border-border-2 rounded-full px-2.5 py-1">Founding price</span>
        ) : null}
        {highlight ? (
          <span className="text-[11px] text-fg bg-border rounded-full px-2.5 py-1">You were looking at this</span>
        ) : null}
      </div>
      <h3 className="text-xl font-medium mt-0.5 mb-0">{o.name}</h3>
      <div className="flex items-baseline gap-2 flex-wrap">
        {o.setupFrom ? <span className="text-sm text-muted">from</span> : null}
        <span className="font-display text-[44px] leading-none">{money(o.setup)}</span>
        <span className="text-sm text-muted">setup</span>
      </div>
      <div className="text-sm text-muted-2">
        {required ? "then " : "optional "}
        <strong className="text-fg font-medium">{money(o.monthly)}/month</strong>
        {o.usage ? " + usage" : ""}
        {required ? " · required" : ""}
      </div>
      <p className="text-sm leading-[1.6] text-muted mt-1 mb-0">{blurb || o.summary}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-auto pt-2 text-sm text-accent-light inline-flex items-center gap-1.5 min-h-11 hover:text-fg"
        >
          {cta.label} <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </>
  );
}

// One offer: code chip, name, setup price, monthly (optional or required), one line.
export default function OfferCard({ offer: o, blurb, cta, highlight = false, className = "" }) {
  if (o.featured || highlight) {
    return (
      <div className={`flex-[1_1_260px] min-w-0 gradient-ring !rounded-card-lg flex ${className}`}>
        <article className="card-offer flex-1 min-w-0 bg-surface rounded-card p-7 box-border flex flex-col gap-3">
          <Body o={o} blurb={blurb} cta={cta} highlight={highlight} />
        </article>
      </div>
    );
  }
  return (
    <article
      className={`card-offer flex-[1_1_260px] min-w-0 bg-surface border border-border rounded-card p-7 box-border flex flex-col gap-3 ${className}`}
    >
      <Body o={o} blurb={blurb} cta={cta} />
    </article>
  );
}

// Dashed "Demo" frame that links to a live demo or the detail page.
export function DemoLink({ href, title, body }) {
  return (
    <Link
      href={href}
      aria-label={`${title}: open it`}
      className="demo-frame flex-[1_1_100%] min-w-0 flex flex-wrap items-center justify-between gap-4 border border-dashed border-border-2 rounded-card p-6 box-border text-fg transition-colors duration-200 hover:border-accent-light"
    >
      <span className="flex items-start gap-3.5 min-w-0">
        <span className="text-[11px] tracking-[.2em] uppercase text-bg bg-accent-light rounded-full px-2.5 py-1 font-medium flex-none">
          Demo
        </span>
        <span className="flex flex-col gap-1 min-w-0">
          <span className="text-[15px] font-medium">{title}</span>
          <span className="text-sm text-muted-2">{body}</span>
        </span>
      </span>
      <span className="text-sm text-accent-light inline-flex items-center gap-1.5 min-h-11">
        Open it <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
