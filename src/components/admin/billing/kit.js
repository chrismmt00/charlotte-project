"use client";

// Shared overlay, form and list-state pieces for the delivery and billing screens
// (projects/, billing/, support/). Every size here is read off the design boards' inline styles
// (AdminProjects, AdminInvoices, AdminSubscriptions, AdminTickets, AdminTicket).
// A later pass merges these with the other admin areas' copies.

import { useCallback, useEffect, useRef, useState } from "react";

/* ---------- Icons ---------- */

const PATHS = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  clip: <path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" />,
  dollar: <path d="M12 3v18M16.5 7.5c-.8-1.2-2.4-2-4.5-2-2.5 0-4 1.2-4 3s1.5 2.6 4 3 4 1.2 4 3-1.5 3-4 3c-2.2 0-3.8-.9-4.7-2.2" />,
};

export function Icon({ name, size = 16, className = "" }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`flex-none ${className}`}>
      {PATHS[name]}
    </svg>
  );
}

/* ---------- Form classes (board: 40px tall, 12px radius, surface-2, 13px) ---------- */

export const labelClass = "text-xs text-muted-2";
export const inputClass = "w-full min-w-0 min-h-10 box-border bg-surface-2 border border-border-2 rounded-xl px-3 text-[13px] text-fg font-[inherit] focus:border-muted-2";
export const textareaClass = `${inputClass} py-2.5 leading-[1.5] resize-y min-h-0`;
export const checkClass = "w-4 h-4 accent-[var(--accent)] flex-none m-0";
export const checkLabelClass = "flex items-center gap-2.5 text-muted-2 cursor-pointer";
export const linkInline = "bg-transparent border-0 p-0 text-accent-light cursor-pointer font-[inherit] text-[13px] hover:text-fg";

// Small pill buttons for tables, drawers and the ticket header (board: 36px, 0 14px, 13px/500, 1px border-2).
const btnSmBase =
  "inline-flex items-center justify-center gap-2 min-h-9 px-3.5 rounded-full text-[13px] font-medium cursor-pointer box-border bg-transparent border whitespace-nowrap transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
export const btnSm = `${btnSmBase} text-fg border-border-2 hover:bg-surface-2`;
export const btnSmDanger = `${btnSmBase} text-danger border-danger/50 hover:bg-danger/10`;
export const btnSmPrimary = `${btnSmBase} bg-fg text-bg border-fg hover:opacity-90`;
// Extra small: "Mark complete" and "Log time" chips (board: 30px, 0 10px, 12px).
export const btnXs = "inline-flex items-center justify-center gap-2 min-h-[30px] px-2.5 rounded-full text-xs font-medium cursor-pointer box-border bg-transparent border border-border-2 text-fg whitespace-nowrap hover:bg-surface-2";

export function FieldRow({ id, label, children, className = "", error }) {
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="m-0 text-xs text-danger flex items-center gap-1.5">
          <Icon name="alert" size={13} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Boxed note: 10px 12px, 12px radius, 1px border. The "fg" and "warning" tones only change the border (board).
export function Note({ tone = "muted", children, id }) {
  const t = tone === "warning" ? "border-warning" : tone === "danger" ? "border-danger" : tone === "fg" || tone === "accent" ? "border-fg" : "border-border";
  return (
    <p id={id} role="note" className={`m-0 px-3 py-2.5 border rounded-xl leading-[1.5] ${tone === "fg" || tone === "accent" ? "text-fg" : "text-muted-2"} ${t}`}>
      {children}
    </p>
  );
}

/* ---------- API + submit state ---------- */

// Dev-only switch: when on, every mutation fails so the "failed" form state can be checked.
let failSaves = false;
export function setFailSaves(v) {
  failSaves = v;
}

export async function api(url, { method = "GET", body } = {}) {
  if (failSaves && method !== "GET") {
    await new Promise((r) => setTimeout(r, 500));
    throw new Error("The save failed (dev switch). Nothing changed; try again.");
  }
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw new Error(data?.error?.message || `The server said ${res.status}. Nothing changed; try again.`);
  return data;
}

// Five form states: idle, invalid (caller sets errors), submitting, success (caller closes + toasts), failed.
export function useSubmit() {
  const [state, setState] = useState({ status: "idle", error: "" });
  const run = useCallback(async (fn) => {
    setState({ status: "submitting", error: "" });
    try {
      const out = await fn();
      setState({ status: "success", error: "" });
      return out;
    } catch (e) {
      setState({ status: "failed", error: e?.message || "Something went wrong. Try again." });
      return undefined;
    }
  }, []);
  return { ...state, submitting: state.status === "submitting", run };
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 text-[13px] text-fg border border-danger rounded-xl px-3 py-2.5 leading-[1.5]">
      <Icon name="alert" className="text-danger mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

/* ---------- Toast ---------- */

export function useToast() {
  const [message, setMessage] = useState("");
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = useCallback((m, ms = 2600) => {
    clearTimeout(timer.current);
    setMessage(m);
    timer.current = setTimeout(() => setMessage(""), ms);
  }, []);
  return [message, show];
}

// Board: fixed, bottom 28px, centered, fg pill, 12px 18px, 13px/500, shadow 0 20px 50px.
export function Toast({ message }) {
  return (
    <div aria-live="polite" role="status" className="fixed left-1/2 bottom-7 -translate-x-1/2 z-[500] pointer-events-none">
      {message ? (
        <div className="pointer-events-auto flex items-center gap-2.5 px-[18px] py-3 rounded-full bg-fg text-bg text-[13px] font-medium whitespace-nowrap shadow-[0_20px_50px_rgba(0,0,0,calc(.4*var(--shadow-k)))] transition-[opacity,translate] duration-[250ms] starting:opacity-0 starting:translate-y-2 motion-reduce:transition-none">
          <Icon name="check" />
          <span>{message}</span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Dialog + Drawer ---------- */

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function useOverlay(onClose) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    const prev = document.activeElement;
    const node = ref.current;
    const first = node?.querySelector("[data-autofocus]") || node?.querySelector(FOCUSABLE);
    (first || node)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      if (prev && typeof prev.focus === "function" && document.contains(prev)) prev.focus();
    };
  }, []);
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closeRef.current?.();
      return;
    }
    if (e.key !== "Tab" || !ref.current) return;
    const els = Array.from(ref.current.querySelectorAll(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
    if (!els.length) {
      e.preventDefault();
      return;
    }
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  return [ref, onKeyDown];
}

const WIDTHS = { sm: 440, md: 560, lg: 720 };
const eyebrowClass = "text-[11px] tracking-[.3em] uppercase text-muted-2";

function CloseButton({ onClose, label = "Close" }) {
  return (
    <button type="button" aria-label={label} onClick={onClose} className="w-10 h-10 flex-none rounded-full border border-border-2 bg-surface-2 text-fg inline-flex items-center justify-center cursor-pointer p-0">
      <Icon name="close" size={18} />
    </button>
  );
}

// Centered dialog. Board: scrim 60% + 6px blur, radius 18px, header 20px 24px 0 (eyebrow, 20px/500 title, round close),
// body 18px 24px 8px with 14px gaps, footer 16px 24px 20px under a top border. Without an eyebrow it is the compact
// kind (18px title inside the body, no close button; Escape and the scrim close it).
// Render it conditionally ({open && <Modal/>}) so focus moves in on mount and back on unmount.
export function Modal({ id, eyebrow, title, describedBy, onClose, size = "md", w, alert = false, tight = false, footer, children }) {
  const [ref, onKeyDown] = useOverlay(onClose);
  const titleId = `${id}-title`;
  return (
    <div className="fixed inset-0 z-[400] bg-[rgba(var(--scrim-rgb),.6)] backdrop-blur-[6px] flex items-center justify-center p-6 box-border" onClick={onClose}>
      <div
        ref={ref}
        role={alert ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        style={{ width: `min(${w || WIDTHS[size]}px, 100%)` }}
        className="flex flex-col max-h-[calc(100vh-48px)] overflow-y-auto bg-surface border border-border rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,calc(.5*var(--shadow-k)))] box-border outline-none text-[13px] transition-[opacity,translate] duration-200 starting:opacity-0 starting:translate-y-3 motion-reduce:transition-none"
      >
        {eyebrow ? (
          <div className="flex items-start justify-between gap-3 px-6 pt-5">
            <div className="flex flex-col gap-1 min-w-0">
              <span className={eyebrowClass}>{eyebrow}</span>
              <h2 id={titleId} className="text-xl font-medium m-0">
                {title}
              </h2>
            </div>
            <CloseButton onClose={onClose} />
          </div>
        ) : null}
        <div className={`px-6 pb-2 flex flex-col ${eyebrow ? "pt-[18px] gap-3.5" : tight ? "pt-6 gap-3" : "pt-6 gap-3.5"}`}>
          {eyebrow ? null : (
            <h2 id={titleId} className="text-lg font-medium m-0">
              {title}
            </h2>
          )}
          {children}
        </div>
        {footer ? <div className="flex flex-wrap justify-end gap-2.5 px-6 pt-4 pb-5 mt-auto border-t border-border">{footer}</div> : null}
      </div>
    </div>
  );
}

// Right-hand drawer, min(520px, 100vw), no dimming. Header 20px 24px 0; body 20px 24px 28px with 18px gaps;
// the action row sits at the end of the body under a top border (board).
export function Drawer({ id, eyebrow, title, titleSize = "text-[22px]", meta, onClose, footer, bodyClass = "pt-5 gap-[18px]", closeLabel, children }) {
  const [ref, onKeyDown] = useOverlay(onClose);
  const titleId = `${id}-title`;
  return (
    <div className="fixed inset-0 z-[300]" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-y-0 right-0 w-[min(520px,100vw)] box-border flex flex-col overflow-y-auto bg-surface border-l border-border shadow-[-20px_0_60px_rgba(0,0,0,calc(.35*var(--shadow-k)))] outline-none text-[13px] transition-transform duration-200 starting:translate-x-full motion-reduce:transition-none"
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-5">
          <div className="flex flex-col gap-1.5 min-w-0">
            {eyebrow ? <span className={eyebrowClass}>{eyebrow}</span> : null}
            <h2 id={titleId} className={`${titleSize} font-medium m-0 leading-[1.2]`}>
              {title}
            </h2>
            {meta ? <span className="flex flex-wrap items-center gap-2 text-[13px]">{meta}</span> : null}
          </div>
          <CloseButton onClose={onClose} label={closeLabel} />
        </div>
        <div className={`px-6 pb-7 flex flex-col ${bodyClass}`}>
          {children}
          {footer ? <div className="flex flex-wrap gap-2 pt-1.5 border-t border-border">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- List states ---------- */

const SHIMMER_CSS = `@keyframes klyvora-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.klyvora-skel{display:block;height:12px;border-radius:6px;background:linear-gradient(90deg,var(--surface-2) 25%,var(--border) 50%,var(--surface-2) 75%);background-size:200% 100%;animation:klyvora-shimmer 1.4s linear infinite}
@media (prefers-reduced-motion:reduce){.klyvora-skel{animation:none}}`;

// Board loading card: bordered, rows of 16px 20px on a column grid, shimmer cells.
export function ListSkeleton({ label, rows = 6, cols = "1fr 1.6fr 2fr 1fr 1fr 1fr .9fr" }) {
  const n = cols.split(" ").length;
  const widths = ["70%", "52%", "74%", "60%", "55%", "80%", "100%"];
  return (
    <div aria-busy="true" aria-label={label} className="border border-border rounded-admin overflow-hidden bg-surface">
      <style>{SHIMMER_CSS}</style>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} style={{ gridTemplateColumns: cols }} className="grid gap-4 items-center px-5 py-4 border-t border-border first:border-t-0">
          {Array.from({ length: n }, (_, c) => {
            const last = c === n - 1;
            const pill = c === n - 2;
            const w = last ? "100%" : pill ? "80%" : `${45 + ((r * 23 + c * 17) % 35)}%`;
            return <span key={c} aria-hidden="true" className="klyvora-skel" style={{ width: w || widths[c % widths.length], ...(last ? { height: 32, borderRadius: 999 } : pill ? { height: 24, borderRadius: 999 } : null) }} />;
          })}
        </div>
      ))}
    </div>
  );
}

// Board error card: fg border, 16px radius, 40px 24px, icon, 18px title, retry button.
export function ListError({ title, children, onRetry, retrying }) {
  return (
    <div role="alert" className="border border-fg rounded-admin bg-surface px-6 py-10 flex flex-col items-center text-center gap-3">
      <Icon name="alert" size={28} />
      <h2 className="text-lg font-medium m-0">{title}</h2>
      <p className="m-0 text-[13px] text-muted-2 max-w-[440px] leading-[1.6]">{children}</p>
      <button type="button" onClick={onRetry} disabled={retrying} className="inline-flex items-center justify-center gap-2 min-h-10 px-[18px] rounded-full text-[13px] font-medium cursor-pointer box-border bg-fg text-bg border-2 border-transparent hover:opacity-90 disabled:opacity-60">
        {retrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}

// Board empty card: dashed border-2, 16px radius, 56px 24px, optional round icon, 20px title, one or two actions.
export function EmptyCard({ icon, title, children, actions }) {
  return (
    <div className="border border-dashed border-border-2 rounded-admin bg-surface px-6 py-14 flex flex-col items-center text-center gap-3">
      {icon ? (
        <span aria-hidden="true" className="w-12 h-12 rounded-full border border-border-2 inline-flex items-center justify-center text-muted-2">
          <Icon name={icon} size={20} />
        </span>
      ) : null}
      <h2 className="text-xl font-medium m-0">{title}</h2>
      <p className="m-0 text-[13px] text-muted-2 max-w-[440px] leading-[1.6]">{children}</p>
      {actions ? <div className="flex flex-wrap justify-center gap-2.5 mt-1.5">{actions}</div> : null}
    </div>
  );
}

// Retry: re-reads the stub; success returns the list to live, a failure stays on the error card.
export function useListState(url) {
  const [state, setState] = useState("live");
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    try {
      await api(url);
      setState("live");
    } catch {
      setState("error");
    } finally {
      setRetrying(false);
    }
  };
  return { state, setState, retry, retrying };
}

// Dev-only preview of list states and failed saves. Never rendered in production.
export function DevStates({ value, onChange }) {
  const [fail, setFail] = useState(false);
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div role="group" aria-label="Preview states (development only)" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-2 border border-dashed border-border-2 rounded-xl px-3 py-2">
      <span>Dev preview:</span>
      {["live", "loading", "empty", "error"].map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={value === s}
          onClick={() => onChange(s)}
          className={`min-h-8 px-2.5 rounded-full border cursor-pointer ${value === s ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2"}`}
        >
          {s}
        </button>
      ))}
      <label className="inline-flex items-center gap-1.5 ml-2 cursor-pointer min-h-8">
        <input
          type="checkbox"
          className={checkClass}
          checked={fail}
          onChange={(e) => {
            setFail(e.target.checked);
            setFailSaves(e.target.checked);
          }}
        />
        Make saves fail
      </label>
    </div>
  );
}

/* ---------- Filters, KPI tiles, segmented control ---------- */

// Board filter bar: 6px gaps, 36px pills, 0 14px, count in 12px muted.
export function FilterChips({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-2 min-h-9 px-3.5 rounded-full text-[13px] border cursor-pointer ${on ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2 hover:text-fg"}`}
          >
            {o.label}
            {o.count != null ? <span className={`text-xs tabular-nums ${on ? "text-bg/70" : "text-muted"}`}>{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

// Board segmented control: pill track (4px padding, 1px border-2), 36px pill buttons.
export function Segmented({ label, options, value, onChange, small = false }) {
  return (
    <div role="group" aria-label={label} className="inline-flex gap-1 p-1 border border-border-2 rounded-full">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`${small ? "min-h-8 px-3.5" : "min-h-9 px-4"} rounded-full border-0 text-[13px] font-medium cursor-pointer ${on ? "bg-fg text-bg" : "bg-transparent text-muted-2 hover:text-fg"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Board stat tile: surface-2, 1px border, 16px radius, 13px label, 32px/500 value with a 13px note beside it.
export function KpiGrid({ label, children }) {
  return (
    <section aria-label={label}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">{children}</div>
    </section>
  );
}

export function Kpi({ label, value, note, tone, noteTone, compact = false }) {
  const color = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "";
  const noteColor = noteTone === "danger" ? "text-danger" : "text-muted";
  return (
    <div className={`bg-surface-2 border border-border rounded-admin box-border flex flex-col gap-1.5 min-w-0 ${compact ? "px-5 py-[18px]" : "px-6 py-5"}`}>
      <span className="text-[13px] text-muted-2">{label}</span>
      <span className="flex items-baseline gap-2.5 flex-wrap">
        <span className={`text-[32px] font-medium leading-none tabular-nums ${color}`}>{value}</span>
        {note ? <span className={`text-[13px] ${noteColor}`}>{note}</span> : null}
      </span>
    </div>
  );
}

export function StatusDot({ tone }) {
  const c = { success: "bg-success", warning: "bg-warning", danger: "bg-danger", accent: "bg-accent", "accent-light": "bg-accent-light", muted: "bg-muted-2", fg: "bg-fg" }[tone] || "bg-muted-2";
  return <span aria-hidden="true" className={`inline-block w-2 h-2 rounded-full flex-none ${c}`} />;
}

/* ---------- Tables ---------- */

// Board table: card (surface, 1px border, 16px radius, clipped) > horizontal scroller > 13px table.
// th 14px 16px (projects: 12px 16px) on a surface-2 row, td 12px 16px, first cell 20px left, last 20px right.
export function TableBox({ children, footer }) {
  return (
    <div className="bg-surface border border-border rounded-admin overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}

export const tableClass = "w-full border-collapse text-[13px]";
export const theadRowClass = "bg-surface-2";
export const thClass = "text-left font-medium text-[13px] text-muted-2 px-4 py-3.5 whitespace-nowrap first:pl-5 last:pr-5";
export const thSmClass = "text-left font-medium text-[13px] text-muted-2 px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5";
export const tdClass = "px-4 py-3 first:pl-5 last:pr-5";
export const trClass = "border-t border-border [&:hover>td]:bg-[rgba(var(--fg-rgb),.03)]";
export const trSelectedClass = "border-t border-border bg-surface-2 shadow-[inset_3px_0_0_var(--accent-light)]";
export const emptyRowClass = "m-0 px-5 py-8 text-[13px] text-muted text-center";

/* ---------- Dates ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function shortDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}
export function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}
export function addMonths(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, d));
  return dt.toISOString().slice(0, 10);
}
export function daysBetween(a, b) {
  const p = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((p(b) - p(a)) / 86400000);
}
export function hours(n) {
  return `${Math.round(n * 10) / 10}`;
}

/* ---------- Links ---------- */

// Client pages exist for the clients in sample-clients.js; others link to the Clients list until they do.
const CLIENT_PAGES = { "Food truck [6]": "cl_6", "Braids studio [7]": "cl_7", "Studio [9]": "cl_9" };
export function clientLink(name) {
  return CLIENT_PAGES[name] ? `/admin/clients/${CLIENT_PAGES[name]}` : "/admin/clients";
}

export function splitEven(total, n) {
  const base = Math.floor(total / n);
  const rem = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}
