"use client";

import { useEffect, useId, useRef } from "react";
import { Icon } from "./ui";

const SIZES = { small: "max-w-[440px]", medium: "max-w-[560px]", large: "max-w-[740px]" };
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Portal dialog: role=dialog + aria-modal, focus moves in, Tab stays inside, Escape and the scrim close,
// focus returns to the trigger. Render it only while open: {open ? <Dialog …/> : null}.
// Put data-autofocus on the element that should take focus first (defaults to the first field, then the close button).
export default function Dialog({ eyebrow, title, onClose, size = "medium", footer, children, busy = false }) {
  const titleId = useId();
  const box = useRef(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);

  useEffect(() => {
    closeRef.current = onClose;
    busyRef.current = busy;
  });

  useEffect(() => {
    const trigger = document.activeElement;
    const el = box.current;
    const first = el.querySelector("[data-autofocus]") || el.querySelector("input:not([type=hidden]):not([disabled]), textarea, select") || el.querySelector(FOCUSABLE);
    (first || el).focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (trigger && typeof trigger.focus === "function" && document.contains(trigger)) trigger.focus();
    };
  }, []);

  const close = () => {
    if (!busyRef.current) closeRef.current();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(box.current.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement);
    if (!items.length) return;
    const firstEl = items[0];
    const lastEl = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === box.current)) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-[rgba(var(--scrim-rgb),.6)] backdrop-blur-[6px] flex items-end sm:items-center justify-center p-3 sm:p-6 box-border" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`w-full ${SIZES[size] || SIZES.medium} bg-surface border border-border rounded-card shadow-[0_30px_80px_rgba(0,0,0,calc(.5*var(--shadow-k)))] box-border flex flex-col max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-48px)] overflow-y-auto outline-none text-fg`}
      >
        <div className="flex justify-between items-start gap-3 px-5 sm:px-6 pt-5">
          <div className="flex flex-col gap-1 min-w-0">
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h2 id={titleId} className="text-[22px] font-medium m-0 leading-tight">
              {title}
            </h2>
          </div>
          <button type="button" aria-label="Close" onClick={close} disabled={busy} className="w-11 h-11 flex-none rounded-full border border-border-2 bg-surface-2 text-fg inline-flex items-center justify-center cursor-pointer p-0 disabled:opacity-60">
            <Icon name="close" size={18} strokeWidth={1.6} />
          </button>
        </div>
        <div className="px-5 sm:px-6 pt-[18px] pb-2 flex flex-col gap-3.5 text-sm leading-[1.6]">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2.5 px-5 sm:px-6 pt-4 pb-5 mt-2 border-t border-border">{footer}</div> : null}
      </div>
    </div>
  );
}
