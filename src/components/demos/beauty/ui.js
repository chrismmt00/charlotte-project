"use client";

import { useEffect, useId } from "react";
import { STATUSES, SWATCHES, tech } from "./data";
import { useDemo } from "./store";

const ICONS = {
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

export function Avatar({ id, name, size = 36 }) {
  const t = id ? tech(id) : null;
  const label = t ? t.name : name || "?";
  return (
    <span
      className={`bd-avatar bd-tone-${t?.tone || "blush"}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {label.charAt(0)}
    </span>
  );
}

export function Status({ status }) {
  const s = STATUSES[status] || STATUSES.booked;
  return <span className={`bd-status bd-tone-${s.tone}`}>{s.label}</span>;
}

export function Swatch({ id, size = 22 }) {
  const s = SWATCHES[id];
  return (
    <span
      className="bd-swatch"
      style={{ width: size, height: size, background: s.c }}
      title={s.name}
    />
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

// A hand of five almond nails, drawn so the demo needs no extra photos.
const DESIGNS = {
  bloom: {
    name: "Nude bloom",
    base: ["#f2c9c2", "#e9b3ab"],
    accent: [1, 3],
    deco: "flower",
  },
  french: {
    name: "Milky french",
    base: ["#f8eee9", "#efdcd4"],
    tip: "#ffffff",
  },
  chrome: { name: "Pearl chrome", base: ["#fbf6fb", "#cdbfd9"], shine: true },
  cherry: {
    name: "Cherry hearts",
    base: ["#c8324e", "#9c1f37"],
    accent: [2],
    deco: "heart",
  },
  aura: { name: "Lilac aura", base: ["#e6dbf7", "#b9a2e0"], aura: true },
};
export const DESIGN_KEYS = Object.keys(DESIGNS);
export const designName = (k) => DESIGNS[k]?.name || "Custom design";

export function NailArt({ design = "bloom", className = "", label }) {
  const d = DESIGNS[design] || DESIGNS.bloom;
  const gid = useId().replace(/[:«»]/g, "");
  const heights = [52, 62, 66, 62, 50];
  return (
    <svg
      viewBox="0 0 230 110"
      className={`bd-nailart ${className}`}
      role="img"
      aria-label={label || `${d.name} nail design`}
    >
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={d.base[0]} />
          <stop offset="1" stopColor={d.base[1]} />
        </linearGradient>
        <radialGradient id={`a${gid}`} cx=".5" cy=".55" r=".5">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {heights.map((h, i) => {
        const x = 12 + i * 43;
        const y = 104 - h;
        const w = 34;
        const path = `M${x + w / 2} ${y} C${x + w + 2} ${y + h * 0.18}, ${x + w} ${y + h * 0.55}, ${x + w} ${y + h * 0.78} Q${x + w} ${y + h} ${x + w / 2} ${y + h} Q${x} ${y + h} ${x} ${y + h * 0.78} C${x} ${y + h * 0.55}, ${x - 2} ${y + h * 0.18}, ${x + w / 2} ${y} Z`;
        const accent = d.accent?.includes(i);
        const cx = x + w / 2;
        const cy = y + h * 0.58;
        return (
          <g key={i}>
            <path
              d={path}
              fill={`url(#g${gid})`}
              stroke="rgba(74,32,48,.18)"
              strokeWidth="1"
            />
            {d.tip ? (
              <path
                d={`M${x + w / 2} ${y} C${x + w + 2} ${y + h * 0.18}, ${x + w} ${y + h * 0.3}, ${x + w - 1} ${y + h * 0.36} Q${x + w / 2} ${y + h * 0.24} ${x + 1} ${y + h * 0.36} C${x} ${y + h * 0.3}, ${x - 2} ${y + h * 0.18}, ${x + w / 2} ${y} Z`}
                fill={d.tip}
              />
            ) : null}
            {d.aura ? (
              <ellipse cx={cx} cy={cy} rx="11" ry="14" fill={`url(#a${gid})`} />
            ) : null}
            {d.shine ? (
              <path
                d={`M${x + 9} ${y + h * 0.3} q2 -10 9 -15`}
                stroke="#fff"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                opacity=".9"
              />
            ) : null}
            {accent && d.deco === "flower" ? (
              <g transform={`translate(${cx} ${cy})`}>
                {[0, 72, 144, 216, 288].map((r) => (
                  <ellipse
                    key={r}
                    rx="4"
                    ry="7"
                    cy="-6"
                    fill="#ffffff"
                    transform={`rotate(${r})`}
                  />
                ))}
                <circle r="3.4" fill="#e7b54c" />
              </g>
            ) : null}
            {accent && d.deco === "heart" ? (
              <path
                transform={`translate(${cx - 8} ${cy - 8})`}
                d="M8 15S1 10.6 1 5.6A3.6 3.6 0 0 1 8 3.4a3.6 3.6 0 0 1 7 2.2C15 10.6 8 15 8 15z"
                fill="#ffe3ea"
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function Sparkles({ className = "" }) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={`bd-sparkles ${className}`}
      aria-hidden="true"
    >
      <path d="M30 6l3 11 11 3-11 3-3 11-3-11-11-3 11-3z" />
      <path d="M48 36l1.6 5.4L55 43l-5.4 1.6L48 50l-1.6-5.4L41 43l5.4-1.6z" />
      <path d="M12 38l1.2 3.8L17 43l-3.8 1.2L12 48l-1.2-3.8L7 43l3.8-1.2z" />
    </svg>
  );
}

// Shared toast for the whole demo. Clears itself after a few seconds.
export function Toast() {
  const { state, dispatch } = useDemo();
  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: "toast", text: null }), 3800);
    return () => clearTimeout(t);
  }, [state.toast, dispatch]);
  return (
    <div className="bd-toast-wrap" aria-live="polite">
      {state.toast ? (
        <div className="bd-toast">
          <Icon name="sparkle" size={16} />
          {state.toast}
        </div>
      ) : null}
    </div>
  );
}

export function PhoneFrame({ label, children, footer }) {
  return (
    <div className="bd-phone" role="region" aria-label={label}>
      <div className="bd-phone-screen">
        <div className="bd-phone-status" aria-hidden="true">
          <span>2:10</span>
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
