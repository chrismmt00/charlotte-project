"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { portalApi } from "@/lib/portal/api";
import { CARD, CLIENT, NOTIFICATIONS, PEOPLE, PROJECT, TICKETS, checklist, offerFor } from "@/lib/portal/sample";

// Portal state shared by every /portal page so an approval on Project shows up on Invoices and Home.
// It starts from the sample (the shape GET /api/portal/project, /invoices and /tickets return);
// the back end swaps the initial state for those responses.

const Ctx = createContext(null);

function initial() {
  return {
    offerCode: PROJECT.offerCode,
    stage: PROJECT.stage,
    monthlyChosen: PROJECT.monthlyChosen,
    planCanceled: false,
    paidExtra: {},
    checklist: checklist(PROJECT.stage),
    tickets: TICKETS.map((t, i) => ({ ...t, expanded: i === 0 })),
    people: PEOPLE,
    notifications: NOTIFICATIONS,
    exportRequestedAt: null,
    card: CARD,
    // Dev-only switches (the panel renders outside production only).
    dev: { lists: "live", fail: false },
  };
}

export function PortalProvider({ children }) {
  const [state, setState] = useState(initial);
  const [toastMsg, setToastMsg] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const patch = useCallback((p) => setState((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) })), []);

  const toast = useCallback((msg) => {
    clearTimeout(timer.current);
    setToastMsg({ msg, key: Date.now() });
    timer.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const failRef = useRef(false);
  useEffect(() => {
    failRef.current = state.dev.fail;
  });
  const api = useCallback((path, opts = {}) => portalApi(path, { ...opts, fail: failRef.current }), []);

  // Dev stage switch: re-seed everything the stage drives.
  const setStage = useCallback(
    (stage) => patch({ stage, paidExtra: {}, planCanceled: false, checklist: checklist(stage) }),
    [patch]
  );
  const setDev = useCallback((d) => patch((s) => ({ dev: { ...s.dev, ...d } })), [patch]);

  // Retry for a list error: refetch the portal data. The stubs return the sample at its own stage,
  // so only the list status is updated here; the back end replaces this with real data.
  const retry = useCallback(async () => {
    setDev({ lists: "loading" });
    try {
      await Promise.all([
        api("/api/portal/project", { method: "GET" }),
        api("/api/portal/invoices", { method: "GET" }),
        api("/api/portal/tickets", { method: "GET" }),
      ]);
      setDev({ lists: "live" });
    } catch {
      setDev({ lists: "error" });
    }
  }, [api, setDev]);

  const offer = offerFor(state.offerCode);
  const live = state.stage === "accepted";
  const planStatus = !state.monthlyChosen ? "none" : state.planCanceled ? "ending" : live ? "active" : "pending";

  const value = useMemo(
    () => ({ ...state, client: CLIENT, project: PROJECT, offer, live, planStatus, patch, toast, api, setStage, setDev, retry }),
    [state, offer, live, planStatus, patch, toast, api, setStage, setDev, retry]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="fixed left-1/2 bottom-7 -translate-x-1/2 z-[500] pointer-events-none w-max max-w-[calc(100vw-32px)]">
        {toastMsg ? (
          <div key={toastMsg.key} className="flex items-center gap-2.5 px-[18px] py-3 rounded-full bg-fg text-bg text-[13px] font-medium shadow-[0_20px_50px_rgba(0,0,0,calc(.4*var(--shadow-k)))] motion-safe:animate-role-fade">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
              <path d="M5 12l5 5L20 7" />
            </svg>
            <span>{toastMsg.msg}</span>
          </div>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}

export function usePortal() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePortal must be used inside <PortalProvider> (the portal layout provides it).");
  return v;
}

// Plan copy shared by Project, Invoices and Account.
export function planStartLine(p) {
  if (!p.monthlyChosen || p.planCanceled) return "No monthly plan.";
  const m = `$${p.offer.monthly}/month`;
  return p.offer.monthlyRequired ? `The ${m} plan starts the same day.` : `The optional ${m} plan starts the same day.`;
}

// Status for a list: the dev switch can force loading / empty / error; otherwise empty when there is nothing.
export function listState(p, count) {
  if (p.dev.lists !== "live") return p.dev.lists;
  return count ? "live" : "empty";
}

export function planLine(p) {
  if (!p.monthlyChosen) return "No monthly plan";
  if (p.planCanceled) return "Monthly plan ending";
  const m = `$${p.offer.monthly}`;
  if (p.live) return `Monthly plan ${m} · active`;
  return p.offer.monthlyRequired ? `Monthly plan ${m}/month, required, from accepted launch` : `Optional ${m}/month from accepted launch`;
}
