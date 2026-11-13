// Portal building blocks. Public density: 14–15px body, 24px cards, 44px touch targets.
// Status colors (success / warning / danger) are allowed here; the public site never uses them.

export const btnPrimary =
  "inline-flex items-center justify-center gap-2.5 min-h-11 px-5 rounded-full border-2 border-transparent bg-fg text-bg text-sm font-medium cursor-pointer box-border transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-px hover:shadow-[0_10px_30px_rgba(78,133,191,.25)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-full border border-border-2 bg-transparent text-fg text-sm font-medium cursor-pointer box-border transition-colors duration-200 hover:border-fg disabled:cursor-not-allowed disabled:opacity-60";
export const btnDanger =
  "inline-flex items-center justify-center gap-2.5 min-h-11 px-5 rounded-full border-2 border-transparent bg-danger text-bg text-sm font-medium cursor-pointer box-border disabled:cursor-not-allowed disabled:opacity-60";
export const linkBtn =
  "inline-flex items-center gap-1.5 min-h-11 bg-transparent border-0 p-0 text-accent-light text-sm cursor-pointer hover:text-fg";
export const inputCls =
  "min-h-12 w-full box-border rounded-input border bg-surface-2 text-fg px-4 text-[15px] font-[inherit] placeholder:text-muted disabled:opacity-70";
export const labelCls = "text-[13px] text-muted-2";

const PATHS = {
  check: <path d="M5 12l5 5L20 7" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 20h16" />
    </>
  ),
};

export function Icon({ name, size = 16, className = "", strokeWidth = 1.8 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={`flex-none ${className}`}>
      {PATHS[name]}
    </svg>
  );
}

export function Spinner() {
  return <span aria-hidden="true" className="inline-block w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin" />;
}

const TONES = {
  success: "text-success border-border-2",
  warning: "text-warning border-warning",
  danger: "text-danger border-danger",
  accent: "text-accent-light border-border-2",
  muted: "text-muted-2 border-border-2",
  fg: "text-fg border-border-2",
};

export function Chip({ tone = "muted", children, className = "" }) {
  return <span className={`inline-flex items-center text-xs border rounded-full px-2.5 py-1 whitespace-nowrap ${TONES[tone] || TONES.muted} ${className}`}>{children}</span>;
}

export function SamplePill() {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-2 border border-border-2 rounded-full px-3 py-1.5 self-start sm:self-auto">
      <span aria-hidden="true" className="w-[7px] h-[7px] rounded-full bg-accent-light inline-block" />
      Sample data
    </span>
  );
}

export function PageHead({ eyebrow, title, lede }) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4">
      <div className="min-w-0">
        {eyebrow ? <div className="eyebrow mb-2.5">{eyebrow}</div> : null}
        <h1 className="font-display font-normal text-[clamp(32px,4vw,48px)] leading-none m-0">{title}</h1>
        {lede ? <p className="text-[15px] text-muted-2 mt-3 mb-0">{lede}</p> : null}
      </div>
      <SamplePill />
    </div>
  );
}

export function Card({ as: Tag = "section", titleId, title, action, flush = false, className = "", children, ...rest }) {
  return (
    <Tag aria-labelledby={title ? titleId : undefined} className={`bg-surface border border-border rounded-card box-border flex flex-col min-w-0 ${flush ? "overflow-hidden" : "px-5 sm:px-6 pt-5 pb-6 gap-3.5"} ${className}`} {...rest}>
      {title || action ? (
        <div className={`flex flex-wrap justify-between items-center gap-3 ${flush ? "px-5 sm:px-6 pt-5 pb-3" : ""}`}>
          {title ? (
            <h2 id={titleId} className="text-[17px] font-medium m-0">
              {title}
            </h2>
          ) : null}
          {action}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}

// Card inside the animated gradient ring (stage and project summary).
export function RingCard({ titleId, className = "", children }) {
  return (
    <section aria-labelledby={titleId} className="gradient-ring rounded-card-lg!">
      <div className={`bg-surface rounded-card p-5 sm:p-7 box-border flex flex-col ${className}`}>{children}</div>
    </section>
  );
}

export function Alert({ children, className = "" }) {
  return (
    <div role="alert" className={`flex gap-2.5 items-start px-3.5 py-3 rounded-input border border-danger bg-danger/10 text-sm leading-normal ${className}`}>
      <span className="text-danger mt-0.5 flex-none">
        <Icon name="alert" />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function FieldError({ id, children }) {
  return (
    <span id={id} className="text-[13px] text-danger flex items-center gap-1.5">
      <Icon name="alert" size={14} />
      {children}
    </span>
  );
}

// The non-live states every list has: loading (skeleton), empty (dashed card, one action), error (fg border, retry).
export function ListStatus({ status, rows = 3, label, empty, onRetry }) {
  if (status === "loading") {
    return (
      <div aria-busy="true" className="flex flex-col">
        <span className="sr-only">Loading {label}…</span>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} aria-hidden="true" className="flex items-center justify-between gap-4 min-h-14 border-t border-border">
            <div className="flex flex-col gap-2 flex-1">
              <span className="block h-3 w-2/5 rounded-md bg-surface-2 animate-pulse" />
              <span className="block h-3 w-3/5 rounded-md bg-surface-2 animate-pulse" />
            </div>
            <span className="block h-6 w-16 rounded-full bg-surface-2 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }
  if (status === "empty") {
    return (
      <div className="border border-dashed border-border-2 rounded-card p-6 flex flex-col items-center gap-3 text-center">
        <p className="m-0 text-sm text-muted-2">{empty?.text}</p>
        {empty?.action}
      </div>
    );
  }
  if (status === "error") {
    return (
      <div role="alert" className="border border-fg rounded-card p-5 flex flex-wrap items-center gap-3">
        <Icon name="alert" size={18} />
        <p className="m-0 text-sm flex-1 min-w-[180px]">We couldn’t load {label}. Your data is safe; this is on our side.</p>
        <button type="button" onClick={onRetry} className={btnSecondary}>
          Try again
        </button>
      </div>
    );
  }
  return null;
}

// Two-column row used in the "Your site" and plan lists.
export function KeyRow({ k, children }) {
  return (
    <li className="flex justify-between items-center gap-3 min-h-11 border-t border-border text-sm py-1.5">
      <span className="text-muted-2">{k}</span>
      <span className="text-right min-w-0">{children}</span>
    </li>
  );
}
