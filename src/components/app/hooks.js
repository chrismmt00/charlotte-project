"use client";

import { useState } from "react";

// A request in flight: busy (submitting), error (failed). run() resolves { ok, data }.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn, failMessage) => {
    setBusy(true);
    setError("");
    try {
      const data = await fn();
      setBusy(false);
      return { ok: true, data };
    } catch (e) {
      setBusy(false);
      setError(failMessage || (e && e.message) || "Something went wrong. Try again.");
      return { ok: false };
    }
  };
  return { busy, error, run, setError };
}

// Status of a list: "live" | "loading" | "empty" | "error". In development a switch can force
// any of them; retry() goes through loading back to live like a real refetch.
export function useListStatus(initial = "live") {
  const [status, setStatus] = useState(initial);
  const retry = () => {
    setStatus("loading");
    setTimeout(() => setStatus("live"), 600);
  };
  return [status, setStatus, retry];
}
