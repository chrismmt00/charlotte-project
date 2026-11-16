"use client";

// Building blocks shared by the industry demos on /demo/*: icons, device frames,
// switches, bottom sheets and the toast. Styles live in beauty/beauty-demo.css (bd-*),
// and each demo re-themes them through the --p-* colour tokens on its root.

import { useEffect, useId, useRef } from "react";

const ICONS = {
  shield:
    "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zm-3.5 9 2.5 2.5 4.5-5",
  smile:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
  meal: "M7 3v8m-3-8v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8h3m0-8v18",
  book: "M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zm0 0v15M8 7h7",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  music:
    "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  palette:
    "M12 3a9 9 0 0 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5s.8-1.5 2-1.5H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5zM7.5 11h.01M10 7h.01M15 7.5h.01",
  alert: "M12 3 2 20h20zM12 10v4m0 3h.01",
  id: "M3 6h18v12H3zM7 10.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM5.5 15c.5-1.5 4.5-1.5 5 0M13 10h5m-5 3h4",
  pill: "M10.5 20.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7zM7 10l7 7",
  video: "M3 7h12v10H3zm12 4 6-4v10l-6-4",
  pin: "M12 21s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  file: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6m-6 4h6",
  key: "M15 8a4 4 0 1 1-1.2 2.8L4 20.5V17h3v-3h3l1.6-1.6",
  x: "M6 6l12 12M18 6 6 18",
  sparkle:
    "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  calendar: "M5 6h14v14H5zM5 10h14M9 3v4m6-4v4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v5l3 2",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0",
  users:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm-6 9a6 6 0 0 1 12 0m1-9a3 3 0 1 0 0-6m2 15h3a5 5 0 0 0-4-5",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H3",
  box: "M4 8l8-4 8 4v8l-8 4-8-4zm0 0l8 4 8-4M12 12v8",
  gift: "M4 10h16v10H4zM3 7h18v3H3zm9 0v13M12 7c-2-4-6-3-5 0m5 0c2-4 6-3 5 0",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zm4 4h4",
  chat: "M4 5h16v11H9l-5 4z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  phone: "M8 3h8v18H8zM11 18h2",
  camera: "M4 8h4l2-3h4l2 3h4v11H4zm8 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  card: "M3 6h18v12H3zM3 10h18M7 15h3",
  tag: "M3 12V4h8l10 10-8 8zM7.5 7.5h.01",
  bulb: "M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  back: "M19 12H5m6-6-6 6 6 6",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2",
  door: "M6 3h10v18H6zM13 12h.01M16 5h3v16",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  download: "M12 4v11m-5-5 5 5 5-5M5 20h14",
  lock: "M6 11h12v9H6zm2 0V8a4 4 0 0 1 8 0v3",
  send: "M4 12 20 4l-5 16-3-7z",
};

export function Icon({ name, size = 18, className = "", strokeWidth = 1.7 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

export function Toggle({ on, onChange, label, hint }) {
  const id = useId();
  return (
    <div className="bd-toggle-row">
      <span>
        <span id={id} className="bd-toggle-label">
          {label}
        </span>
        {hint ? <span className="bd-hint">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={id}
        className="bd-switch"
        onClick={onChange}
      >
        <span />
      </button>
    </div>
  );
}

// A short message at the bottom of the screen that clears itself after a few seconds.
export function ToastView({ text, onClear }) {
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(onClear, 3800);
    return () => clearTimeout(t);
  }, [text, onClear]);
  return (
    <div className="bd-toast-wrap" aria-live="polite">
      {text ? (
        <div className="bd-toast">
          <Icon name="sparkle" size={16} />
          {text}
        </div>
      ) : null}
    </div>
  );
}

export function Sheet({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="bd-sheet-wrap">
      <button
        type="button"
        className="bd-sheet-scrim"
        aria-label="Close"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        className="bd-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <div className="bd-sheet-head">
          <h4 className="bd-serif">{title}</h4>
          <button
            type="button"
            className="bd-icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="plus" size={18} className="bd-rot45" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PhoneFrame({ label, children, footer, time = "2:10" }) {
  return (
    <div className="bd-phone" role="region" aria-label={label}>
      <div className="bd-phone-screen">
        <div className="bd-phone-status" aria-hidden="true">
          <span>{time}</span>
          <span className="bd-phone-notch" />
          <span className="bd-phone-icons">
            <i />
            <i />
            <b />
          </span>
        </div>
        <div className="bd-phone-body">{children}</div>
        {footer}
      </div>
    </div>
  );
}

export function TabletFrame({ label, children }) {
  return (
    <div className="bd-tablet" role="region" aria-label={label}>
      <div className="bd-tablet-screen">{children}</div>
    </div>
  );
}

export function BrowserFrame({ label, url, children }) {
  return (
    <div className="bd-browser" role="region" aria-label={label}>
      <div className="bd-browser-bar" aria-hidden="true">
        <span className="bd-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="bd-url">
          <Icon name="lock" size={12} /> {url}
        </span>
      </div>
      <div className="bd-browser-body">{children}</div>
    </div>
  );
}

export const money = (n) => `$${Number(n).toLocaleString("en-US")}`;
