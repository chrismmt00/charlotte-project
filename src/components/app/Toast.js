"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Icon } from "./ui";

// Toasts: bottom centre, aria-live polite, 2600ms (6000ms when there is an undo action).
const ToastCtx = createContext(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }) {
  const [t, setT] = useState(null);
  const timer = useRef(null);
  const seq = useRef(0);

  const show = useCallback((message, opts = {}) => {
    clearTimeout(timer.current);
    seq.current += 1;
    setT({ id: seq.current, message, action: opts.action });
    timer.current = setTimeout(() => setT(null), opts.ms ?? (opts.action ? 6000 : 2600));
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-7 z-[500] flex justify-center px-4 pointer-events-none">
        {t ? (
          <div
            key={t.id}
            className="toast-success pointer-events-auto flex items-center gap-2.5 px-[18px] py-3 rounded-full bg-fg text-bg text-[13px] font-medium shadow-[0_20px_50px_rgba(0,0,0,calc(.4*var(--shadow-k)))] max-w-full"
          >
            <Icon name="check" size={16} />
            <span className="min-w-0">{t.message}</span>
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  clearTimeout(timer.current);
                  setT(null);
                  t.action.onClick();
                }}
                className="min-h-11 px-3 -my-2 -mr-3 underline bg-transparent border-0 text-bg cursor-pointer text-[13px] font-medium"
              >
                {t.action.label}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </ToastCtx.Provider>
  );
}
