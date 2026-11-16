"use client";

import { useCallback, useId } from "react";
import { Icon, ToastView } from "../kit";

export {
  Icon,
  Toggle,
  PhoneFrame,
  TabletFrame,
  BrowserFrame,
  money,
} from "../kit";
import { STATUSES, SWATCHES, tech } from "./data";
import { useDemo } from "./store";

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
  const clear = useCallback(
    () => dispatch({ type: "toast", text: null }),
    [dispatch],
  );
  return <ToastView text={state.toast} onClear={clear} />;
}
