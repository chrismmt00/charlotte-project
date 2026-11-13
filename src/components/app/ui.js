"use client";

import { STATUS_TONE } from "@/lib/app/kinds";
import { IS_DEV } from "./useBusiness";

// Client admin density: public density on purpose (owners use it on phones).
// 14px body, 24px card radius, 44px touch targets.

const ICONS = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12l5 5 9-10" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </>
  ),
  menu: <path d="M4 8h16M4 16h16" />,
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  help: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  up: <path d="M6 15l6-6 6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  grip: (
    <>
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  upload: (
    <>
      <path d="M12 20V9" />
      <path d="M7 14l5-5 5 5" />
      <path d="M5 4h14" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  signout: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 16l-4-4 4-4M6 12h10" />
    </>
  ),
};

export function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-none ${className}`}
    >
      {ICONS[name]}
    </svg>
  );
}

export function Spinner({ size = 16 }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin flex-none"
      style={{ width: size, height: size }}
    />
  );
}

// Buttons: pill shaped like the board, 44px minimum.
const btn =
  "inline-flex items-center justify-center gap-2 min-h-11 rounded-full text-sm font-medium cursor-pointer whitespace-nowrap box-border transition-[opacity,background-color,color] duration-150 disabled:cursor-not-allowed disabled:opacity-60";
export const btnPrimary = `btn-primary ${btn} px-[18px] bg-fg text-bg border-2 border-transparent hover:opacity-90`;
export const btnSecondary = `btn-secondary ${btn} px-4 bg-transparent text-fg border border-border-2 hover:bg-surface-2`;
export const btnDestructive = `btn-destructive ${btn} px-[18px] bg-transparent text-danger border-2 border-danger/50 hover:bg-danger/10`;
export const btnIcon =
  "inline-flex items-center justify-center w-11 h-11 flex-none rounded-full border border-border-2 bg-transparent text-fg cursor-pointer hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed";

// Form pieces.
export const inputCls =
  "min-h-11 w-full box-border rounded-input border border-border-2 bg-surface-2 text-fg px-3.5 text-sm font-[inherit] aria-[invalid=true]:border-danger disabled:opacity-50";
export const labelCls = "text-[13px] text-muted-2";

export function FormGroup({ id, label, hint, error, children, className = "" }) {
  return (
    <div className={`form-group flex flex-col gap-1.5 min-w-0 ${className}`}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {error ? <FieldError id={`${id}-err`}>{error}</FieldError> : null}
      {hint && !error ? (
        <span id={`${id}-hint`} className="text-xs text-muted-2">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function FieldError({ id, children }) {
  return (
    <span id={id} role="alert" className="text-[13px] text-danger flex items-center gap-1.5">
      <Icon name="alert" size={14} />
      {children}
    </span>
  );
}

export function Checkbox({ id, children, ...rest }) {
  return (
    <label htmlFor={id} className="checkbox-box flex gap-2.5 items-center min-h-11 px-3.5 py-2.5 rounded-input border border-border-2 cursor-pointer text-sm">
      <input id={id} type="checkbox" className="w-[18px] h-[18px] accent-[#4E85BF] flex-none" {...rest} />
      <span>{children}</span>
    </label>
  );
}

export function Switch({ on, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="relative inline-flex items-center justify-center w-14 h-11 flex-none bg-transparent border-0 p-0 cursor-pointer disabled:opacity-50"
    >
      <span aria-hidden="true" className={`relative block w-11 h-[26px] rounded-full border border-border-2 transition-colors ${on ? "bg-accent" : "bg-border"}`}>
        <span className={`absolute top-[2px] w-5 h-5 rounded-full bg-fg transition-[left] ${on ? "left-[21px]" : "left-[2px]"}`} />
      </span>
    </button>
  );
}

// Layout pieces.
export function Page({ className = "", children }) {
  return (
    <main id="app-main" tabIndex={-1} className={`${className} flex-1 min-w-0 outline-none`}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-16 flex flex-col gap-5 text-sm">{children}</div>
    </main>
  );
}

export function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4">
      <div className="min-w-0">
        {eyebrow ? <div className="text-[11px] tracking-[.3em] uppercase text-muted-2 mb-2.5">{eyebrow}</div> : null}
        <h1 className="font-display font-normal text-[clamp(32px,4vw,44px)] leading-none m-0">{title}</h1>
      </div>
      {children ? <div className="page-actions flex flex-wrap items-center gap-2.5">{children}</div> : null}
    </div>
  );
}

export function Card({ as: Tag = "section", className = "", children, ...rest }) {
  return (
    <Tag className={`bg-surface border border-border rounded-card min-w-0 box-border ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function CardTitle({ id, children, className = "" }) {
  return (
    <h2 id={id} className={`text-[17px] font-medium m-0 ${className}`}>
      {children}
    </h2>
  );
}

export function StatTile({ label, value, note, href, as }) {
  const Tag = as || (href ? "a" : "div");
  return (
    <Tag
      href={href}
      className="stat-tile bg-surface-2 border border-border rounded-card px-6 py-5 box-border flex flex-col gap-1.5 text-fg min-w-0 hover:border-border-2 transition-colors"
    >
      <span className="text-[13px] text-muted-2">{label}</span>
      <span className="flex items-baseline gap-2.5 flex-wrap">
        <span className="text-[32px] font-medium leading-none tabular-nums">{value}</span>
        {note ? <span className="text-[13px] text-muted-2">{note}</span> : null}
      </span>
    </Tag>
  );
}

export function StatusPill({ status, className = "" }) {
  return (
    <span className={`inline-flex items-center text-xs border border-border-2 rounded-full px-2.5 py-1 whitespace-nowrap ${STATUS_TONE[status] || "text-muted-2"} ${className}`}>
      {status}
    </span>
  );
}

export function EmptyState({ title, children, action, className = "" }) {
  return (
    <div className={`empty-state border border-dashed border-border-2 rounded-input px-5 py-8 text-center flex flex-col items-center gap-2 ${className}`}>
      <span className="text-base font-medium">{title}</span>
      {children ? <span className="text-[13px] text-muted-2 max-w-[420px] leading-relaxed">{children}</span> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ onRetry, children = "Couldn’t load this. Your site is still up; this is just the list." }) {
  return (
    <div role="alert" className="table-error border border-fg rounded-input p-[18px] flex flex-wrap gap-3 items-center justify-between text-sm">
      <span className="inline-flex items-center gap-2.5">
        <Icon name="alert" />
        {children}
      </span>
      <button type="button" className={btnSecondary} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function SkeletonRows({ rows = 4 }) {
  return (
    <ul className="skeleton-rows list-none m-0 px-4 pt-2 pb-4 flex flex-col gap-3.5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex gap-4 items-center">
          <span className="skel h-3 rounded-md bg-border motion-safe:animate-pulse w-14" />
          <span className="skel h-3 rounded-md bg-border motion-safe:animate-pulse flex-1" />
          <span className="skel h-3 rounded-md bg-border motion-safe:animate-pulse w-20" />
        </li>
      ))}
    </ul>
  );
}

export function Bar({ pct, label }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} className="h-1 rounded-full bg-border overflow-hidden mt-1">
      <div className="h-full bg-accent" style={{ width: `${p}%` }} />
    </div>
  );
}

export const srOnly = "sr-only";

// Dev only: preview the list states real sample data can't produce yet.
export function DevStateSwitch({ value, onChange, options = ["live", "empty", "loading", "error"], label = "Preview state" }) {
  if (!IS_DEV) return null;
  return (
    <div role="group" aria-label={`${label} (development only)`} className="flex flex-wrap items-center gap-1.5 text-xs text-muted-2 border border-dashed border-border-2 rounded-input px-3 py-2">
      <span className="mr-1">{label} · dev only</span>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`min-h-9 px-3 rounded-full border text-xs cursor-pointer ${value === o ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
