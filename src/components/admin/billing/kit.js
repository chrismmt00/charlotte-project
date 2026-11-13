"use client";

// Shared overlay and list-state pieces for the delivery and billing screens
// (projects/, billing/, support/). A later pass merges these with the other admin areas' copies.

import { useCallback, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/admin/ui";

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
  ext: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  clip: <path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" />,
  trash: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
    </>
  ),
};

export function Icon({ name, size = 16, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-none ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}

/* ---------- Form classes (admin density) ---------- */

export const labelClass = "text-[12px] text-muted-2";
export const inputClass =
  "w-full min-w-0 min-h-10 box-border bg-surface-2 border border-border-2 rounded-[10px] px-3 text-[13px] text-fg font-[inherit] focus:border-muted-2";
export const textareaClass = `${inputClass} py-2.5 leading-[1.55] resize-y`;
export const checkClass = "w-4 h-4 accent-[var(--accent)] flex-none";

export function FieldRow({ id, label, children, className = "", error }) {
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="m-0 text-[12px] text-danger flex items-center gap-1.5">
          <Icon name="alert" size={13} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Note({ tone = "muted", children, id }) {
  const t =
    tone === "warning"
      ? "border-warning/40 bg-warning/10"
      : tone === "danger"
        ? "border-danger/40 bg-danger/10"
        : tone === "accent"
          ? "border-[rgba(78,133,191,.45)] bg-[rgba(78,133,191,.08)]"
          : "border-border-2 bg-surface-2";
  return (
    <p id={id} role="note" className={`m-0 text-[13px] leading-[1.55] text-fg border rounded-[10px] px-3 py-2.5 ${t}`}>
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
    <div role="alert" className="flex items-start gap-2 text-[13px] text-fg border border-danger/50 bg-danger/10 rounded-[10px] px-3 py-2.5">
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

export function Toast({ message }) {
  return (
    <div aria-live="polite" role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[700] px-4 w-full max-w-[520px] pointer-events-none flex justify-center">
      {message ? (
        <div className="pointer-events-auto inline-flex items-center gap-2.5 bg-fg text-bg rounded-full px-4 py-2.5 text-[13px] font-medium shadow-[0_12px_32px_rgba(0,0,0,calc(.45*var(--shadow-k)))] transition-[opacity,translate] duration-200 starting:opacity-0 starting:translate-y-2 motion-reduce:transition-none">
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

const SIZES = { sm: "max-w-[440px]", md: "max-w-[560px]", lg: "max-w-[740px]" };

// Centered dialog. Render it conditionally ({open && <Modal/>}) so focus moves in on mount and back on unmount.
export function Modal({ id, eyebrow, title, describedBy, onClose, size = "md", alert = false, footer, children }) {
  const [ref, onKeyDown] = useOverlay(onClose);
  const titleId = `${id}-title`;
  return (
    <div className="fixed inset-0 z-[600] bg-[rgba(var(--scrim-rgb),.6)] flex items-end sm:items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div
        ref={ref}
        role={alert ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${SIZES[size]} max-h-[92vh] flex flex-col bg-surface border border-border rounded-admin shadow-[0_24px_60px_rgba(0,0,0,calc(.5*var(--shadow-k)))] outline-none transition-[opacity,translate] duration-200 starting:opacity-0 starting:translate-y-3 motion-reduce:transition-none`}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            {eyebrow ? <div className="text-[12px] text-muted-2 mb-1 truncate">{eyebrow}</div> : null}
            <h2 id={titleId} className="text-[17px] font-medium m-0 leading-snug">
              {title}
            </h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="w-9 h-9 -mr-1.5 -mt-1 rounded-[10px] inline-flex items-center justify-center text-muted-2 hover:text-fg hover:bg-surface-2 cursor-pointer bg-transparent border-0 flex-none">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="px-5 pb-5 overflow-y-auto flex flex-col gap-4 text-[13px]">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2 px-5 py-4 border-t border-border">{footer}</div> : null}
      </div>
    </div>
  );
}

// Right-hand drawer, 480px, full width on phones.
export function Drawer({ id, eyebrow, title, meta, onClose, footer, children }) {
  const [ref, onKeyDown] = useOverlay(onClose);
  const titleId = `${id}-title`;
  return (
    <div className="fixed inset-0 z-[550] bg-[rgba(var(--scrim-rgb),.35)]" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-y-0 right-0 w-full sm:w-[480px] flex flex-col bg-surface border-l border-border shadow-[-24px_0_60px_rgba(0,0,0,calc(.4*var(--shadow-k)))] outline-none transition-transform duration-200 starting:translate-x-full motion-reduce:transition-none"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border">
          <div className="min-w-0">
            {eyebrow ? <div className="text-[12px] text-muted-2 mb-1 truncate">{eyebrow}</div> : null}
            <h2 id={titleId} className="text-[18px] font-medium m-0 leading-snug">
              {title}
            </h2>
            {meta ? <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted-2">{meta}</div> : null}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="w-9 h-9 -mr-1.5 rounded-[10px] inline-flex items-center justify-center text-muted-2 hover:text-fg hover:bg-surface-2 cursor-pointer bg-transparent border-0 flex-none">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 text-[13px]">{children}</div>
        {footer ? <div className="flex flex-wrap gap-2 px-5 py-4 border-t border-border">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------- List states ---------- */

export function ListSkeleton({ label, rows = 6 }) {
  return (
    <div aria-busy="true" aria-label={label} className="bg-surface border border-border rounded-admin p-5 flex flex-col gap-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full flex-none" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className={`h-3 ${["w-1/2", "w-2/3", "w-3/5", "w-3/4", "w-1/2", "w-2/3"][i % 6]}`} />
            <Skeleton className={`h-2.5 ${["w-3/4", "w-1/2", "w-2/3", "w-3/5", "w-4/5", "w-1/2"][i % 6]}`} />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ListError({ title, children, onRetry, retrying }) {
  return (
    <div role="alert" className="bg-surface border border-fg rounded-admin p-8 flex flex-col items-center text-center gap-2">
      <Icon name="alert" size={22} />
      <h2 className="text-[15px] font-medium m-0">{title}</h2>
      <p className="text-[13px] text-muted-2 m-0 max-w-[460px]">{children}</p>
      <button type="button" onClick={onRetry} disabled={retrying} className="mt-2 inline-flex items-center justify-center min-h-9 px-3.5 rounded-[10px] text-[13px] font-medium bg-fg text-bg border border-transparent cursor-pointer disabled:opacity-60">
        {retrying ? "Retrying…" : "Retry"}
      </button>
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
    <div role="group" aria-label="Preview states (development only)" className="flex flex-wrap items-center gap-1.5 mb-4 text-[12px] text-muted-2 border border-dashed border-border-2 rounded-[10px] px-3 py-2">
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

export function FilterChips({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2 mb-4">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full text-[13px] border cursor-pointer transition-colors ${on ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2 hover:text-fg"}`}
          >
            {o.label}
            {o.count != null ? <span className={on ? "opacity-70" : "text-muted-2"}>{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="inline-flex p-0.5 rounded-[11px] border border-border-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`min-h-8 px-3 rounded-[9px] text-[13px] font-medium cursor-pointer border-0 ${on ? "bg-fg text-bg" : "bg-transparent text-muted-2 hover:text-fg"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Kpi({ label, value, note, tone }) {
  const color = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-fg";
  return (
    <div className="bg-surface border border-border rounded-admin p-4 sm:p-5 flex flex-col gap-1.5 min-w-0">
      <span className="text-[12px] text-muted-2">{label}</span>
      <span className={`text-[24px] sm:text-[26px] font-medium leading-none ${color}`}>{value}</span>
      {note ? <span className="text-[12px] text-muted-2">{note}</span> : null}
    </div>
  );
}

export function StatusDot({ tone }) {
  const c = { success: "bg-success", warning: "bg-warning", danger: "bg-danger", accent: "bg-accent", "accent-light": "bg-accent-light", muted: "bg-muted-2", fg: "bg-fg" }[tone] || "bg-muted-2";
  return <span aria-hidden="true" className={`inline-block w-2 h-2 rounded-full flex-none ${c}`} />;
}

// Table wrapper: wide tables scroll inside the box, never the page.
export function TableBox({ children, className = "" }) {
  return <div className={`bg-surface border border-border rounded-admin overflow-x-auto ${className}`}>{children}</div>;
}

export const thClass = "text-left text-[12px] font-medium text-muted-2 px-4 py-3 border-b border-border whitespace-nowrap";
export const tdClass = "px-4 py-3 border-b border-border align-middle text-[13px]";

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
