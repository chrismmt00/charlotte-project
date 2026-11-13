"use client";

import { useEffect, useId, useRef } from "react";
import { Icon, btnSecondary } from "./ui";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Modal behaviour shared by dialogs and the phone bottom sheet: focus moves in on open,
// Escape closes, Tab stays inside, scroll is locked, focus returns to whatever opened it.
export function useModal(ref, onClose) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const prev = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const items = () => Array.from(node.querySelectorAll(FOCUSABLE));
    const first = node.querySelector("[data-autofocus]") || items().find((el) => !el.hasAttribute("data-close")) || items()[0] || node;
    first.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      } else if (e.key === "Tab") {
        const list = items();
        if (!list.length) {
          e.preventDefault();
          return;
        }
        const a = list[0];
        const z = list[list.length - 1];
        if (!node.contains(document.activeElement)) {
          e.preventDefault();
          a.focus();
        } else if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      const back = prev && prev.isConnected ? prev : document.getElementById("app-main");
      back?.focus?.();
    };
  }, [ref]);
}

const SIZES = { small: "modal-small max-w-[440px]", medium: "modal-medium max-w-[560px]", large: "modal-large max-w-[760px]" };

// Props: title, eyebrow, size (small 440 | medium 560 | large 760), onClose, onSubmit (wraps body and
// footer in a form so Enter submits), footer (buttons), busy (blocks closing while a request runs).
export default function Dialog({ title, eyebrow, size = "small", onClose, onSubmit, footer, busy = false, children }) {
  const id = useId();
  const ref = useRef(null);
  const close = () => {
    if (!busy) onClose();
  };
  useModal(ref, close);
  const Body = onSubmit ? "form" : "div";
  return (
    <div
      className="scrim fixed inset-0 z-[400] bg-[rgba(var(--scrim-rgb),.6)] backdrop-blur-[6px] flex items-center justify-center p-4 sm:p-6 box-border"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-h`}
        tabIndex={-1}
        className={`${SIZES[size]} w-full bg-surface border border-border rounded-card shadow-[0_30px_80px_rgba(0,0,0,calc(.5*var(--shadow-k)))] box-border flex flex-col max-h-[calc(100dvh-32px)] overflow-y-auto`}
      >
        <div className="flex justify-between items-start gap-3 px-6 pt-5">
          <div className="flex flex-col gap-1 min-w-0">
            {eyebrow ? <span className="text-[11px] tracking-[.3em] uppercase text-muted-2">{eyebrow}</span> : null}
            <h2 id={`${id}-h`} className="text-[22px] font-medium m-0">
              {title}
            </h2>
          </div>
          <button
            type="button"
            data-close=""
            aria-label="Close"
            onClick={close}
            className="w-11 h-11 flex-none rounded-full border border-border-2 bg-surface-2 text-fg inline-flex items-center justify-center cursor-pointer p-0"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <Body {...(onSubmit ? { onSubmit, noValidate: true } : {})} className="flex flex-col min-h-0">
          <div data-dialog-body="" className="px-6 pt-[18px] pb-2 flex flex-col gap-3.5 text-sm leading-relaxed">
            {children}
          </div>
          {footer ? <div className="flex flex-wrap justify-end gap-2.5 px-6 pt-4 pb-5 border-t border-border mt-3">{footer}</div> : null}
        </Body>
      </div>
    </div>
  );
}

export function CancelButton({ onClick, disabled, children = "Cancel" }) {
  return (
    <button type="button" className={btnSecondary} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
