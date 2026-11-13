"use client";

// Kit for the clients and proposals screens, matched to the design boards (AdminClient, AdminProposals):
// dialog (radius 18, scrim blur 6), toast, form fields (40px, radius 12, surface-2), 36px pill buttons, cards, tables.
// A later pass will merge this with the other areas' dialogs.
import { useCallback, useEffect, useId, useRef, useState } from "react";

const SIZES = { sm: "max-w-[460px]", stripe: "max-w-[520px]", md: "max-w-[560px]", lg: "max-w-[680px]" };
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Icon({ children, size = 16, className = "" }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`flex-none ${className}`}>
      {children}
    </svg>
  );
}
export const CloseIcon = () => (
  <Icon size={18}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const CheckMark = ({ size = 16 }) => (
  <Icon size={size}>
    <path d="M5 12l5 5 9-10" />
  </Icon>
);
export const AlertIcon = ({ size = 16 }) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.5" />
  </Icon>
);

// 36px pill buttons used inside tables, card headers and the client header (boards: min-height 36, padding 0 14).
const b36 = "inline-flex items-center justify-center gap-2 min-h-9 rounded-full text-[13px] font-medium cursor-pointer box-border whitespace-nowrap transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
export const btnS = `${b36} px-3.5 bg-transparent text-fg border border-border-2 hover:bg-surface-2`;
export const btnSPrimary = `${b36} px-[18px] bg-fg text-bg border-2 border-transparent hover:opacity-90`;
export const btnSDanger = `${b36} px-3.5 bg-transparent text-danger border border-danger/50 hover:bg-danger/10`;
// Text link button in a card header ("All contacts", "Edit"): accent, no chrome.
export const linkBtn = "bg-transparent border-0 p-0 text-[13px] text-accent-light hover:text-fg cursor-pointer";

// Card: surface, 1px border, radius 16, padding 18px 20px, gap 14, title 15px/500. flush = table card (no padding).
export function Card({ title, titleId, sub, action, flush = false, className = "", children, as: Tag = "section", ...rest }) {
  const head =
    title || action ? (
      <div className={`flex flex-wrap items-center justify-between gap-2.5 ${flush ? "px-5 py-4" : ""}`}>
        {title ? (
          <h2 id={titleId} className="text-[15px] font-medium m-0">
            {title}
            {sub ? <span className="text-[13px] text-muted font-normal"> {sub}</span> : null}
          </h2>
        ) : (
          <span />
        )}
        {action}
      </div>
    ) : null;
  return (
    <Tag aria-labelledby={title ? titleId : undefined} className={`bg-surface border border-border rounded-admin box-border flex flex-col min-w-0 ${flush ? "overflow-hidden" : "px-5 py-[18px] gap-3.5"} ${className}`} {...rest}>
      {head}
      {children}
    </Tag>
  );
}

// Table: th 13px/500 muted-2, padding 12px 16px (first cell pl 20, last pr 20), rows border-top, hover tint.
export const thCls = "text-left font-medium text-[13px] text-muted-2 px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5";
export const tdCls = "px-4 py-3 first:pl-5 last:pr-5";
// Same, for a table inside a padded card (no extra first/last cell padding).
export const thIn = "text-left font-medium text-[13px] text-muted-2 px-4 py-3 whitespace-nowrap";
export const tdIn = "px-4 py-3";
export const trCls = "border-t border-border [&:hover>td]:bg-[rgba(var(--fg-rgb),.03)]";

// Page title block for the detail and builder pages: breadcrumb is separate; this is eyebrow with the sample chip inline, serif H1.
export function TitleBlock({ eyebrow, title, children }) {
  return (
    <div className="flex flex-col gap-2.5 min-w-0">
      <div className="text-[11px] tracking-[.3em] uppercase text-muted-2 flex flex-wrap items-center gap-2.5">
        {eyebrow}

      </div>
      <h1 className="font-display font-normal text-[clamp(32px,4vw,44px)] leading-none m-0 break-words">{title}</h1>
      {children}
    </div>
  );
}

// Dialog: role="dialog" aria-modal, focus in on open, Escape and scrim close, Tab trapped, focus back to the trigger.
// Render it conditionally; mounting is "open". alert = role="alertdialog" for confirms (title sits in the body, no X).
export function Dialog({ eyebrow, title, size = "md", onClose, children, footer, busy = false, alert = false, describedBy }) {
  const ref = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const trigger = document.activeElement;
    const node = ref.current;
    const first = node?.querySelector("[data-autofocus]") || node?.querySelector(FOCUSABLE);
    first?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (trigger && typeof trigger.focus === "function" && document.contains(trigger)) trigger.focus();
    };
  }, []);
  const close = () => {
    if (!busy) closeRef.current?.();
  };
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) return;
    const a = items[0];
    const z = items[items.length - 1];
    if (e.shiftKey && document.activeElement === a) {
      e.preventDefault();
      z.focus();
    } else if (!e.shiftKey && document.activeElement === z) {
      e.preventDefault();
      a.focus();
    }
  };
  return (
    <div className="fixed inset-0 z-[420] bg-[rgba(var(--scrim-rgb),.6)] backdrop-blur-[6px] flex items-center justify-center p-6 box-border" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={ref}
        role={alert ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        onKeyDown={onKeyDown}
        className={`w-full ${SIZES[size] || SIZES.md} max-h-[calc(100vh-48px)] overflow-y-auto bg-surface border border-border rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,calc(.5*var(--shadow-k)))] box-border flex flex-col text-[13px] text-fg`}
      >
        {alert ? (
          <div className="px-6 pt-6 pb-2 flex flex-col gap-3">
            <h2 id={titleId} className="text-[18px] font-medium m-0">
              {title}
            </h2>
            {children}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start gap-3 px-6 pt-5">
              <div className="flex flex-col gap-1 min-w-0">
                {eyebrow ? <span className="text-[11px] tracking-[.3em] uppercase text-muted-2">{eyebrow}</span> : null}
                <h2 id={titleId} className="text-[20px] font-medium m-0 break-words">
                  {title}
                </h2>
              </div>
              <button type="button" aria-label="Close" onClick={close} className="w-10 h-10 flex-none rounded-full border border-border-2 bg-surface-2 text-fg inline-flex items-center justify-center cursor-pointer p-0">
                <CloseIcon />
              </button>
            </div>
            <div className="px-6 pt-[18px] pb-2 flex flex-col gap-3.5">{children}</div>
          </>
        )}
        {footer ? <div className="flex flex-wrap justify-end gap-2.5 px-6 pt-4 pb-5 border-t border-border mt-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = useCallback((text, { tone = "success", ms = 2600 } = {}) => {
    clearTimeout(timer.current);
    setToast({ text, tone, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), ms);
  }, []);
  return [toast, show];
}

export function Toast({ toast }) {
  return (
    <div aria-live="polite" role="status" className="fixed left-1/2 -translate-x-1/2 bottom-7 z-[500] pointer-events-none px-4 w-max max-w-full">
      {toast ? (
        <div key={toast.key} className="flex items-center gap-2.5 px-[18px] py-3 rounded-full bg-fg text-bg text-[13px] font-medium whitespace-nowrap shadow-[0_20px_50px_rgba(0,0,0,calc(.4*var(--shadow-k)))]">
          {toast.tone === "error" ? <AlertIcon /> : <CheckMark />}
          <span>{toast.text}</span>
        </div>
      ) : null}
    </div>
  );
}

// Inputs: 40px, radius 12, border-2, surface-2, padding 0 12, 13px. Textareas add py-2.5 and drop the min height.
export const inputCls =
  "w-full min-w-0 min-h-10 box-border rounded-xl bg-surface-2 border border-border-2 px-3 text-[13px] text-fg font-[inherit] disabled:opacity-60 aria-[invalid=true]:border-danger";
export const textareaCls = `${inputCls} !min-h-0 py-2.5 leading-normal resize-y`;
export const selectCls = `${inputCls} cursor-pointer`;
// A bordered group (fieldset, "They can" list): radius 12, padding 12 14.
export const groupCls = "border border-border rounded-xl px-3.5 py-3 m-0 flex flex-col gap-2";

export function FieldRow({ id, label, error, hint, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <label htmlFor={id} className="text-xs text-muted-2">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <span id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-err`} className="text-xs text-danger flex items-center gap-1.5">
          <AlertIcon size={14} />
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function CheckRow({ checked, onChange, disabled, children, className = "", align = "center" }) {
  return (
    <label className={`flex ${align === "start" ? "items-start" : "items-center"} gap-2.5 text-[13px] cursor-pointer ${disabled ? "text-muted-2 cursor-default" : ""} ${className}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className={`w-4 h-4 flex-none m-0 accent-[var(--accent)] ${align === "start" ? "mt-0.5" : ""}`} />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

export function FailBanner({ children }) {
  return (
    <div role="alert" className="flex gap-2.5 items-start rounded-xl border border-danger/40 bg-danger/10 text-danger px-3.5 py-2.5 text-[13px]">
      <AlertIcon />
      <span>{children}</span>
    </div>
  );
}

// JSON request that throws on a non-2xx answer.
export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw new Error(data?.error?.message || String(res.status));
  return data;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Filter chips: 36px, 13px, radius full, count 12px muted tabular.
export function FilterChip({ on, onClick, label, count }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-9 px-3.5 rounded-full border text-[13px] inline-flex items-center gap-2 cursor-pointer box-border ${on ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2 hover:text-fg"}`}
    >
      {label} <span className={`text-xs tabular-nums ${on ? "text-bg/70" : "text-muted"}`}>{count}</span>
    </button>
  );
}

// Dev-only switch to force a list state (live, loading, empty, error). Renders nothing in production.
export function DevStateSwitch({ value, onChange, options }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <label className="inline-flex items-center gap-2 text-[11px] text-muted-2 border border-dashed border-border-2 rounded-full px-2.5 py-1">
      Dev state
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-fg text-[11px] border-0">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

// Skeleton bar from the boards: 12px, radius 6, surface-2 to border gradient.
export function Skel({ className = "" }) {
  return <div aria-hidden="true" className={`rounded-md bg-[linear-gradient(90deg,var(--surface-2)_25%,var(--border)_50%,var(--surface-2)_75%)] bg-[length:200%_100%] animate-pulse ${className}`} />;
}

// List state cards (boards: error = fg border, 40px 24px; empty = dashed border-2, 56px 24px).
export function ErrorCard({ title, children, onRetry }) {
  return (
    <div role="alert" className="border border-fg rounded-admin bg-surface px-6 py-10 flex flex-col items-center text-center gap-3">
      <AlertIcon size={28} />
      <h2 className="text-[18px] font-medium m-0">{title}</h2>
      <p className="m-0 text-[13px] text-muted-2 max-w-[420px] leading-[1.6]">{children}</p>
      <button type="button" onClick={onRetry} className="inline-flex items-center justify-center min-h-10 px-[18px] rounded-full bg-fg text-bg border-2 border-transparent text-[13px] font-medium cursor-pointer">
        Retry
      </button>
    </div>
  );
}

export function EmptyCard({ icon, title, children, actions }) {
  return (
    <div className="border border-dashed border-border-2 rounded-admin bg-surface px-6 py-14 flex flex-col items-center text-center gap-3">
      {icon ? (
        <span aria-hidden="true" className="w-12 h-12 rounded-full border border-border-2 inline-flex items-center justify-center text-muted-2">
          {icon}
        </span>
      ) : null}
      <h2 className="text-[20px] font-medium m-0">{title}</h2>
      <p className="m-0 text-[13px] text-muted-2 max-w-[460px] leading-[1.6]">{children}</p>
      {actions ? <div className="flex flex-wrap justify-center gap-2.5 mt-1.5">{actions}</div> : null}
    </div>
  );
}
