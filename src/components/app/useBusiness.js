"use client";
import { createContext, useContext, useEffect, useState } from "react";
const Context = createContext(null);
export const IS_DEV = false;
export function BusinessProvider({ children }) {
  const [business, setBusiness] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/app/business").then(read),
      fetch("/api/app/payments").then(read),
    ])
      .then(([biz, payments]) => {
        if (alive) {
          setBusiness({
            ...biz,
            payments: payments.rows,
            payouts: payments.payouts,
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
  if (failed)
    return (
      <div role="alert" className="p-8">
        We could not load your business.{" "}
        <button className="underline" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </button>
      </div>
    );
  if (!business)
    return (
      <div aria-busy="true" className="p-8">
        Loading your business…
      </div>
    );
  return <Context.Provider value={business}>{children}</Context.Provider>;
}
async function read(res) {
  if (!res.ok) throw new Error("Could not load business");
  return res.json();
}
export function useBusiness() {
  const b = useContext(Context);
  if (!b) throw new Error("Business provider is required");
  return b;
}
export function useKind() {
  return useBusiness().kind;
}
export function setDevKind() {}
export function setFailNext() {}
export function useFailNext() {
  return false;
}
export function consumeFailNext() {
  return false;
}
