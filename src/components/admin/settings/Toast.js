"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Bottom-centre toast, aria-live="polite", 2600ms by default.
// const [toast, showToast] = useToast(); ... <Toast toast={toast} />

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

export default function Toast({ toast, raised = false }) {
  return (
    <div aria-live="polite" role="status" className={`fixed left-1/2 -translate-x-1/2 z-[500] pointer-events-none px-4 w-max max-w-full ${raised ? "bottom-[92px]" : "bottom-7"}`}>
      {toast ? (
        <div key={toast.key} className="flex items-center gap-2.5 px-[18px] py-3 rounded-full bg-fg text-bg text-[13px] font-medium shadow-[0_20px_50px_rgba(0,0,0,calc(.4*var(--shadow-k)))]">
          {toast.tone === "error" ? (
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-none">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16h.01" />
            </svg>
          ) : (
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
              <path d="M5 12l5 5 9-10" />
            </svg>
          )}
          <span>{toast.text}</span>
        </div>
      ) : null}
    </div>
  );
}
