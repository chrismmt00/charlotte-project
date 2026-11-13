import Link from "next/link";

// Admin density, matched to the design boards: 13px body, 16px panel radius, 1px border dividers,
// content on bg-deep. Page titles are the serif display face at clamp(32px, 4vw, 44px).

export function SamplePill() { return null; }

// Page header: eyebrow, serif H1, and on the right the Sample data pill plus any actions.
export function PageHead({ eyebrow, title, children, sample = true }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <div className="text-[11px] tracking-[.3em] uppercase text-muted-2 mb-2.5">{eyebrow}</div> : null}
        <h1 className="font-display font-normal text-[clamp(32px,4vw,44px)] leading-none m-0">{title}</h1>
      </div>
      {sample || children ? (
        <div className="flex flex-wrap items-center gap-2.5">
          {sample ? <SamplePill /> : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}

// Card with an optional header row. Padding 20px 24px, radius 16px.
export function Panel({ as: Tag = "section", title, titleId, action, className = "", children, ...rest }) {
  return (
    <Tag aria-labelledby={title ? titleId : undefined} className={`bg-surface border border-border rounded-admin px-6 py-5 min-w-0 box-border ${className}`} {...rest}>
      {title || action ? (
        <div className="flex items-center justify-between gap-3 mb-3">
          {title ? (
            <h2 id={titleId} className="text-[17px] font-medium m-0">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}

const TONES = {
  accent: "text-accent-light border-border-2",
  success: "text-success border-border-2",
  warning: "text-warning border-border-2",
  danger: "text-danger border-border-2",
  muted: "text-muted-2 border-border-2",
  fg: "text-fg border-border-2",
};

// Pill chip: 12px, 1px border-2, colour carries the meaning.
export function Chip({ tone = "muted", children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs rounded-full border bg-transparent px-2.5 py-1 ${TONES[tone] || TONES.muted} ${className}`}>
      {children}
    </span>
  );
}

// Lead / pipeline status → chip tone.
export const LEAD_STATUS_TONE = {
  New: "accent",
  Contacted: "muted",
  "Demo booked": "accent",
  "Proposal sent": "fg",
  Signed: "success",
  Lost: "muted",
};

export function Ring({ pct, label, size = 72 }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" role="img" aria-label={`${label}: ${p}% of target`} className="flex-none">
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke={p >= 100 ? "var(--success)" : "var(--accent)"}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c.toFixed(1)}
        strokeDashoffset={(c * (1 - p / 100)).toFixed(1)}
        transform="rotate(-90 44 44)"
        style={{ transition: "stroke-dashoffset .6s ease" }}
      />
      <text x="44" y="48" textAnchor="middle" fontSize="15" fontWeight="500" fill="var(--fg)">
        {p}%
      </text>
    </svg>
  );
}

export function Bar({ pct, tone = "accent", label }) {
  const p = Math.max(0, Math.min(100, pct));
  const color = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : tone === "danger" ? "bg-danger" : "bg-accent";
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} className="h-1 rounded-full bg-border overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${p}%` }} />
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="border border-dashed border-border-2 rounded-admin p-8 text-center flex flex-col items-center gap-2">
      <div className="text-[15px] font-medium">{title}</div>
      {children ? <p className="text-[13px] text-muted-2 m-0 max-w-[420px]">{children}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`rounded-lg bg-surface-2 animate-pulse ${className}`} />;
}

// Admin buttons are pills, 40px tall, 13px/500 (design boards: btn-primary, btn-secondary, btn-destructive).
export const btn =
  "inline-flex items-center justify-center gap-2 min-h-10 rounded-full text-[13px] font-medium cursor-pointer box-border transition-colors duration-150 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed";
export const btnPrimary = `${btn} px-[18px] bg-fg text-bg border-2 border-transparent hover:opacity-90`;
export const btnSecondary = `${btn} px-4 bg-transparent text-fg border border-border-2 hover:bg-surface-2`;
export const btnDanger = `${btn} px-[18px] bg-transparent text-danger border-2 border-danger/50 hover:bg-danger/10`;
export const btnGhost = `${btn} px-2 bg-transparent text-accent-light border-0 hover:text-fg`;

export function LinkArrow({ href, children }) {
  return (
    <Link href={href} className="text-[13px] text-accent-light hover:text-fg inline-flex items-center gap-1 min-h-9">
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}

export function money(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}
