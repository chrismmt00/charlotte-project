"use client";

import { useEffect, useId, useRef } from "react";

// Admin dialog: role="dialog" aria-modal, focus moves in on open, Escape and the scrim close,
// Tab stays inside, focus returns to the trigger on close. Radius 16px (admin).
// Render it conditionally ({open ? <Dialog .../> : null}); mounting is "open".
// Sizes: sm 440, md 560, lg 760.

const SIZES = { sm: "max-w-[440px]", md: "max-w-[560px]", lg: "max-w-[760px]" };
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CloseIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function Dialog({ eyebrow, title, size = "md", onClose, children, footer, busy = false }) {
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
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
    const firstEl = items[0];
    const lastEl = items[items.length - 1];
    if (e.shiftKey && document.activeElement === firstEl) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[420] bg-[rgba(var(--scrim-rgb),.6)] backdrop-blur-[6px] flex items-center justify-center p-6 box-border" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className={`w-full ${SIZES[size] || SIZES.md} max-h-[calc(100vh-48px)] overflow-y-auto bg-surface border border-border rounded-admin shadow-[0_30px_80px_rgba(0,0,0,calc(.5*var(--shadow-k)))] box-border flex flex-col text-[13px] text-fg`}
      >
        <div className="flex justify-between items-start gap-3 pt-5 px-6">
          <div className="flex flex-col gap-1 min-w-0">
            {eyebrow ? <span className="text-[11px] tracking-[.3em] uppercase text-muted-2">{eyebrow}</span> : null}
            <h2 id={titleId} className="text-[20px] font-medium m-0 break-words">
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="w-10 h-10 flex-none p-0 rounded-full border border-border-2 bg-surface-2 text-fg hover:bg-border inline-flex items-center justify-center cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="px-6 pt-[18px] pb-2 flex flex-col gap-3.5">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2.5 px-6 pt-4 pb-5 border-t border-border">{footer}</div> : null}
      </div>
    </div>
  );
}
