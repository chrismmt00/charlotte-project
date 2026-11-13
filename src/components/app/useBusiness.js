"use client";

import { useSyncExternalStore } from "react";
import { CURRENT_BUSINESS_KIND, getBusiness } from "@/lib/app/sample";
import { KINDS } from "@/lib/app/kinds";

// The signed-in owner's business. Until auth ships it is the sample "current business"
// (CURRENT_BUSINESS_KIND); in development a kind switch in the shell overrides it so every
// kind's words and catalog shape can be checked. Production always uses the real business.

export const IS_DEV = process.env.NODE_ENV !== "production";

const KIND_KEY = "klyvora-app-kind";
const EVENT = "klyvora-app-dev";

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function readKind() {
  if (!IS_DEV) return CURRENT_BUSINESS_KIND;
  try {
    const k = localStorage.getItem(KIND_KEY);
    return KINDS.includes(k) ? k : CURRENT_BUSINESS_KIND;
  } catch {
    return CURRENT_BUSINESS_KIND;
  }
}

export function setDevKind(kind) {
  try {
    localStorage.setItem(KIND_KEY, kind);
  } catch {}
  emit();
}

export function useKind() {
  return useSyncExternalStore(subscribe, readKind, () => CURRENT_BUSINESS_KIND);
}

export function useBusiness() {
  return getBusiness(useKind());
}

// Dev only: make the next request to a /api/app stub fail, to see every form's failed state.
let failNext = false;

export function setFailNext(v) {
  failNext = !!v;
  emit();
}

export function consumeFailNext() {
  if (!IS_DEV || !failNext) return false;
  failNext = false;
  emit();
  return true;
}

export function useFailNext() {
  return useSyncExternalStore(
    subscribe,
    () => failNext,
    () => false
  );
}
