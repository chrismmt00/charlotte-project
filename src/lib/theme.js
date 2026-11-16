"use client";

import { useSyncExternalStore } from "react";

// Theme lives on <html data-theme>. The inline script in the root layout sets it before first paint
// from localStorage, so pages stay statically prerendered and nothing flashes.
import { THEME_KEY } from "./theme-script";

const EVENT = "klyvora-theme-change";

function read() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function subscribe(cb) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function setTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => "light");
  return [theme, setTheme];
}
