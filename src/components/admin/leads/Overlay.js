"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

// Shared by the leads and outreach screens: Dialog, Drawer, Toast, form field classes, icons, and the
// dev-only switch bar. Values are copied from the design boards' inline styles (AdminLeads, AdminLead,
// AdminOutreach, DemoReview). A later pass may merge these with the other admin areas' copies.

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Dialog form control: 40px, radius 12, border-2, bg surface-2, 13px.
export const fieldCls =
  "w-full min-h-10 rounded-[12px] border border-border-2 bg-surface-2 px-3 py-2.5 text-[13px] text-fg font-[inherit] min-w-0 box-border focus:border-fg aria-[invalid=true]:border-fg";
// Drawer / side-panel control: 44px, radius 14, 14px text.
export const drawerFieldCls =
  "w-full min-h-11 rounded-[14px] border border-border-2 bg-surface-2 px-3.5 py-2.5 text-sm text-fg font-[inherit] min-w-0 box-border focus:border-fg";
// Small pill select (table status, owner).
export const pillSelect =
  "min-h-9 rounded-full border border-border-2 bg-surface-2 px-3 text-[13px] font-[inherit] cursor-pointer max-w-full box-border";
export const labelCls = "text-xs text-muted-2";
// Filter chip: 36px pill, 13px.
export const chipBtn = (on) =>
  `inline-flex items-center gap-2 min-h-9 px-3.5 rounded-full border text-[13px] cursor-pointer transition-colors ${
    on ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2 hover:text-fg"
  }`;
// 36px pill buttons used inside cards (board: min-height 36px; padding 0 14px).
const btnSm = "inline-flex items-center justify-center gap-2 min-h-9 px-3.5 rounded-full text-[13px] font-medium cursor-pointer box-border whitespace-nowrap transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
export const btnSmSecondary = `${btnSm} bg-transparent text-fg border border-border-2 hover:bg-surface-2`;
export const btnSmPrimary = `${btnSm} bg-fg text-bg border border-fg hover:opacity-90`;
// Card used on the lead page and outreach tabs: radius 16, padding 18px 20px, gap 14.
export const cardCls = "bg-surface border border-border rounded-admin px-5 py-[18px] flex flex-col gap-3.5 min-w-0 box-border";
export const linkCls = "text-accent-light hover:text-fg";

export function Icon({ name, size = 16 }) {
  const P = {
    close: <path d="M6 6l12 12M18 6L6 18" />,
    check: <path d="M5 12l5 5 9-10" />,
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="M7 9l5-5 5 5" />
        <path d="M4 20h16" />
      </>
    ),
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </>
    ),
    note: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </>
    ),
    dots: (
      <>
        <circle cx="5" cy="12" r="1.2" />
        <circle cx="12" cy="12" r="1.2" />
        <circle cx="19" cy="12" r="1.2" />
      </>
    ),
    leads: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      </>
    ),
    send: <path d="M4 12l16-8-6 16-2.5-6.5z" />,
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
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
      {P[name]}
    </svg>
  );
}

// Segmented control. size: "lg" 40px (page header), "md" 36px, "sm" 32px.
export function Segmented({ label, value, onChange, options, size = "lg" }) {
  const h = size === "lg" ? "min-h-10 px-[18px]" : size === "md" ? "min-h-9 px-3.5" : "min-h-8 px-3.5";
  return (
    <div role="group" aria-label={label} className="inline-flex gap-1 p-1 border border-border-2 rounded-full self-start">
      {options.map(([k, l]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)} className={`${h} rounded-full border-0 text-[13px] ${size === "md" ? "font-normal" : "font-medium"} cursor-pointer ${value === k ? "bg-fg text-bg" : "bg-transparent text-muted-2 hover:text-fg"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

// ---------- Toast ----------
export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = useCallback((text, { tone = "success", ms = 2600 } = {}) => {
    clearTimeout(timer.current);
    setToast({ text, tone, key: Math.random() });
    timer.current = setTimeout(() => setToast(null), ms);
  }, []);
  return [toast, show];
}

export function Toast({ toast, raised = false }) {
  return (
    <div aria-live="polite" role="status" className={`fixed left-1/2 -translate-x-1/2 z-[500] pointer-events-none px-4 w-max max-w-full ${raised ? "bottom-[92px]" : "bottom-7"}`}>
      {toast ? (
        <div key={toast.key} className="flex items-center gap-2.5 px-[18px] py-3 rounded-full bg-fg text-bg text-[13px] font-medium shadow-[0_20px_50px_rgba(0,0,0,calc(.4*var(--shadow-k)))]">
          <Icon name={toast.tone === "error" ? "alert" : "check"} />
          <span>{toast.text}</span>
        </div>
      ) : null}
    </div>
  );
}

// ---------- focus trap shared by Dialog and Drawer ----------
function useTrap(ref, onClose) {
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
  }, [ref]);
  return (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closeRef.current?.();
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
}

const SIZE_W = { sm: 440, md: 560, lg: 760 };

// Render conditionally: mounting is "open". role="alertdialog" renders the compact confirm layout (no header row).
// Board spec: scrim blur 6px, radius 18px, header 20px 24px 0, body 18px 24px 8px, footer 16px 24px 20px with a top border.
export function Dialog({ eyebrow, title, size = "md", width, onClose, children, footer, busy = false, role = "dialog", describedBy, splitCancel = false }) {
  const ref = useRef(null);
  const titleId = useId();
  const close = () => {
    if (!busy) onClose?.();
  };
  const onKeyDown = useTrap(ref, close);
  const w = width || SIZE_W[size] || SIZE_W.md;
  const confirm = role === "alertdialog";
  return (
    <div className="fixed inset-0 z-[420] bg-[rgba(var(--scrim-rgb),.6)] backdrop-blur-[6px] flex items-center justify-center p-6" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        onKeyDown={onKeyDown}
        style={{ width: `min(${w}px, 100%)` }}
        className="max-h-[calc(100vh-48px)] overflow-y-auto bg-surface border border-border rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,calc(.5*var(--shadow-k)))] flex flex-col text-[13px] text-fg"
      >
        {confirm ? (
          <div className="px-6 pt-6 pb-2 flex flex-col gap-3">
            <h2 id={titleId} className="text-lg font-medium m-0">
              {title}
            </h2>
            {children}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start gap-3 px-6 pt-5">
              <div className="flex flex-col gap-1 min-w-0">
                {eyebrow ? <span className="text-[11px] tracking-[.3em] uppercase text-muted-2">{eyebrow}</span> : null}
                <h2 id={titleId} className="text-xl font-medium m-0 break-words">
                  {title}
                </h2>
              </div>
              <button type="button" aria-label="Close" onClick={close} className="w-10 h-10 flex-none rounded-full border border-border-2 bg-surface-2 text-fg hover:bg-surface inline-flex items-center justify-center cursor-pointer p-0">
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="px-6 pt-[18px] pb-2 flex flex-col gap-3.5">{children}</div>
          </>
        )}
        {footer ? <div className={`flex flex-wrap justify-end gap-2.5 px-6 pt-4 pb-5 border-t border-border ${splitCancel ? "[&>*:first-child]:mr-auto" : ""}`}>{footer}</div> : null}
      </div>
    </div>
  );
}

// Right-hand drawer (board: leads 440px, outreach 480px). Slides in on mount; no scrim tint, a transparent layer closes it.
export function Drawer({ eyebrow, title, subtitle, onClose, children, width = 440 }) {
  const ref = useRef(null);
  const titleId = useId();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const onKeyDown = useTrap(ref, onClose);
  return (
    <div className="fixed inset-0 z-[410]" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        style={{ width: `min(${width}px, 100vw)` }}
        className={`absolute right-0 top-0 bottom-0 bg-surface border-l border-border flex flex-col overflow-y-auto text-[13px] text-fg shadow-[-20px_0_60px_rgba(0,0,0,calc(.35*var(--shadow-k)))] transition-transform duration-200 motion-reduce:transition-none ${shown ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex justify-between items-start gap-3 px-6 pt-5">
          <div className="min-w-0 flex flex-col gap-1">
            {eyebrow ? <span className="text-[11px] tracking-[.3em] uppercase text-muted-2">{eyebrow}</span> : null}
            <h2 id={titleId} className="text-[22px] font-medium m-0 leading-[1.2] break-words">
              {title}
            </h2>
            {subtitle ? <div className="text-sm text-muted-2">{subtitle}</div> : null}
          </div>
          <button type="button" aria-label="Close" data-autofocus onClick={onClose} className="w-11 h-11 flex-none rounded-full border border-border-2 bg-surface-2 text-fg hover:bg-surface inline-flex items-center justify-center cursor-pointer p-0">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="px-6 pt-5 pb-7 flex flex-col gap-5">{children}</div>
      </div>
    </div>
  );
}

// Label + control wrapper (board: gap 6px, label 12px muted-2).
export function Row({ id, label, required, error, hint, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <span className="text-xs text-muted-2">{hint}</span> : null}
      {error ? (
        <span id={`${id}-err`} className="text-xs text-fg flex items-center gap-1.5">
          <span aria-hidden="true">•</span>
          {error}
        </span>
      ) : null}
    </div>
  );
}

// Inline alert (board "form-banner"): fg border, radius 12, padding 12px 14px.
export function Alert({ children }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 border border-fg rounded-[12px] px-3.5 py-3 text-[13px] leading-normal">
      <span className="mt-0.5">
        <Icon name="alert" />
      </span>
      <div>{children}</div>
    </div>
  );
}

// Dev-only switch bar. Renders nothing in production.
export function DevBar({ children }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div className="flex flex-wrap items-center gap-3 border border-dashed border-border-2 rounded-[10px] px-3 py-2 text-xs text-muted-2">
      <span className="uppercase tracking-[.2em] text-[11px]">Dev only</span>
      {children}
    </div>
  );
}

// Owner avatar. Plain (leads): 24px circle on surface-2 with initials. variant="owner" (outreach): Claude accent, Chris inverted, others border-2.
const INITIALS = { Chris: "CD", Geoffrey: "GE", Claude: "AI", Demetrius: "DE" };
export function Initial({ owner, variant = "plain" }) {
  if (variant === "owner") {
    const tone = owner === "Claude" ? "bg-accent text-bg" : owner === "Chris" ? "bg-fg text-bg" : "bg-border-2 text-fg";
    return (
      <span aria-hidden="true" className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-medium flex-none ${tone}`}>
        {(owner || "?").charAt(0)}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="w-6 h-6 rounded-full bg-surface-2 border border-border-2 inline-flex items-center justify-center text-[10px] font-medium text-fg flex-none">
      {INITIALS[owner] || (owner || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}
