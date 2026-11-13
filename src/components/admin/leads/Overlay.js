"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

// Shared by the leads and outreach screens: Dialog, Drawer, Toast, form field classes, icons, and the
// dev-only switch bar. A later pass may merge these with the other admin areas' copies.

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const fieldCls =
  "w-full min-h-10 rounded-[10px] border border-border-2 bg-surface-2 px-3 py-2 text-[13px] text-fg font-[inherit] min-w-0 box-border focus:border-fg aria-[invalid=true]:border-fg";
export const labelCls = "text-[12px] text-muted-2";
export const chipBtn = (on) =>
  `inline-flex items-center gap-2 min-h-9 px-3.5 rounded-full border text-[13px] cursor-pointer transition-colors ${
    on ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2 hover:text-fg"
  }`;

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

const SIZES = { sm: "max-w-[440px]", md: "max-w-[560px]", lg: "max-w-[760px]" };

// Render conditionally: mounting is "open". role="alertdialog" for confirms.
export function Dialog({ eyebrow, title, size = "md", onClose, children, footer, busy = false, role = "dialog", describedBy, as: Form }) {
  const ref = useRef(null);
  const titleId = useId();
  const close = () => {
    if (!busy) onClose?.();
  };
  const onKeyDown = useTrap(ref, close);
  const Wrap = Form || "div";
  return (
    <div className="fixed inset-0 z-[420] bg-[rgba(var(--scrim-rgb),.6)] flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        onKeyDown={onKeyDown}
        className={`w-full ${SIZES[size] || SIZES.md} max-h-[calc(100vh-32px)] overflow-y-auto bg-surface border border-border rounded-admin shadow-[0_30px_80px_rgba(0,0,0,calc(.5*var(--shadow-k)))] flex flex-col text-[13px] text-fg`}
      >
        <div className="flex justify-between items-start gap-3 px-6 pt-5">
          <div className="flex flex-col gap-1 min-w-0">
            {eyebrow ? <span className="text-[11px] tracking-[.3em] uppercase text-muted-2">{eyebrow}</span> : null}
            <h2 id={titleId} className="text-[20px] font-medium m-0 break-words">
              {title}
            </h2>
          </div>
          <button type="button" aria-label="Close" onClick={close} className="w-10 h-10 flex-none rounded-[10px] border-0 bg-transparent text-muted-2 hover:text-fg hover:bg-surface-2 inline-flex items-center justify-center cursor-pointer">
            <Icon name="close" size={18} />
          </button>
        </div>
        <Wrap className="contents">
          <div className="px-6 py-5 flex flex-col gap-4">{children}</div>
          {footer ? <div className="px-6 pb-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
        </Wrap>
      </div>
    </div>
  );
}

// Right-hand drawer, 480px. Slides in on mount.
export function Drawer({ eyebrow, title, subtitle, onClose, children, footer }) {
  const ref = useRef(null);
  const titleId = useId();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const onKeyDown = useTrap(ref, onClose);
  return (
    <div className="fixed inset-0 z-[410] bg-[rgba(var(--scrim-rgb),.6)]" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className={`absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-surface border-l border-border flex flex-col text-[13px] text-fg shadow-[0_0_80px_rgba(0,0,0,calc(.5*var(--shadow-k)))] transition-transform duration-200 motion-reduce:transition-none ${shown ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex justify-between items-start gap-3 px-6 pt-5 pb-4 border-b border-border">
          <div className="min-w-0 flex flex-col gap-1">
            {eyebrow ? <span className="text-[11px] tracking-[.3em] uppercase text-muted-2">{eyebrow}</span> : null}
            <h2 id={titleId} className="text-[20px] font-medium m-0 break-words">
              {title}
            </h2>
            {subtitle ? <div className="text-muted-2">{subtitle}</div> : null}
          </div>
          <button type="button" aria-label="Close" data-autofocus onClick={onClose} className="w-10 h-10 flex-none rounded-[10px] border-0 bg-transparent text-muted-2 hover:text-fg hover:bg-surface-2 inline-flex items-center justify-center cursor-pointer">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">{children}</div>
        {footer ? <div className="px-6 py-4 border-t border-border flex flex-wrap gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

// Label + control wrapper.
export function Row({ id, label, required, error, hint, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <span className="text-[12px] text-muted-2">{hint}</span> : null}
      {error ? (
        <span id={`${id}-err`} className="text-[12px] text-fg flex items-center gap-1.5">
          <Icon name="alert" size={13} />
          {error}
        </span>
      ) : null}
    </div>
  );
}

// Inline alert: fg border, icon and text (errors on forms).
export function Alert({ children }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 border border-fg rounded-[10px] px-3.5 py-3 text-[13px]">
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
    <div className="flex flex-wrap items-center gap-3 border border-dashed border-border-2 rounded-[10px] px-3 py-2 text-[12px] text-muted-2 mb-4">
      <span className="uppercase tracking-[.2em] text-[11px]">Dev only</span>
      {children}
    </div>
  );
}

export function Initial({ owner }) {
  const label = owner === "Claude" ? "AI" : (owner || "?").charAt(0);
  const tone = owner === "Claude" ? "bg-accent text-white" : owner === "Chris" ? "bg-fg text-bg" : "bg-border-2 text-fg";
  return (
    <span aria-hidden="true" className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-medium flex-none ${tone}`}>
      {label}
    </span>
  );
}
