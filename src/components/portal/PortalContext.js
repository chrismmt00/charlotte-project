"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { portalApi } from "@/lib/portal/api";
const Ctx = createContext(null);
export function PortalProvider({ children }) {
  const [state, setState] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState("");
  const timer = useRef(null);
  useEffect(() => {
    let alive = true;
    portalApi("/api/portal/project", { method: "GET" })
      .then((data) => {
        if (alive) {
          setState({
            ...data,
            stage: data.project.stage,
            monthlyChosen: data.project.monthlyChosen,
            offerCode: data.project.offerCode,
            planCanceled: data.plan.status === "ending",
            paidExtra: {},
            exportRequestedAt: null,
            dev: { lists: "live", fail: false },
          });
          setFailed(false);
        }
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [attempt]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const patch = useCallback(
    (p) => setState((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) })),
    [],
  );
  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);
  const toast = useCallback((text) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(""), 4000);
  }, []);
  const api = useCallback(async (path, options) => {
    return portalApi(path, options);
  }, []);
  if (failed)
    return (
      <div role="alert" className="m-8 p-6 border border-border rounded-card">
        We could not load your portal.{" "}
        <button onClick={retry} className="underline">
          Try again
        </button>
      </div>
    );
  if (!state)
    return (
      <div aria-busy="true" className="p-8">
        Loading your portal…
      </div>
    );
  const value = {
    ...state,
    live: state.stage === "accepted",
    planStatus: state.plan.status,
    patch,
    retry,
    toast,
    api,
    setStage: () => {},
    setDev: () => {},
  };
  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500]"
      >
        {message ? (
          <div className="rounded-full bg-fg text-bg px-5 py-3">{message}</div>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}
export function usePortal() {
  const p = useContext(Ctx);
  if (!p) throw new Error("Portal provider is required");
  return p;
}
export function planStartLine(p) {
  if (!p.monthlyChosen || p.planCanceled) return "No monthly plan.";
  return `${p.offer.monthlyRequired ? "The" : "The optional"} $${p.offer.monthly}/month plan begins at accepted launch.`;
}
export function planLine(p) {
  if (!p.monthlyChosen) return "No monthly plan";
  if (p.planCanceled) return "Monthly plan ending";
  return `$${p.offer.monthly}/month · ${p.planStatus}`;
}
export function listState(p, count) {
  return count ? "live" : "empty";
}
