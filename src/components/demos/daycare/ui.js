"use client";

import { useCallback } from "react";
import { Icon, PhoneFrame as KitPhoneFrame, ToastView } from "../kit";
import { KINDS, at, initials, room } from "./data";
import { useDaycare } from "./store";

export { Icon, Toggle, TabletFrame, BrowserFrame, Sheet, money } from "../kit";

// The daycare demo runs at 12:40 PM, so its phones show that time.
export function PhoneFrame(props) {
  return <KitPhoneFrame time="12:40" {...props} />;
}

// Children appear as coloured initials, never photos.
export function Kid({ child, size = 38 }) {
  const tone = room(child.room)?.tone || "sky";
  return (
    <span
      className={`dc-kid dc-tone-${tone}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials(child.name)}
    </span>
  );
}

export function Person({ name, size = 34, tone = "sky", photo }) {
  if (photo)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        className="dc-person dc-person-img"
        style={{ width: size, height: size }}
      />
    );
  return (
    <span
      className={`dc-person dc-tone-${tone}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function RoomTag({ id }) {
  const r = room(id);
  if (!r) return null;
  return (
    <span className={`dc-room dc-tone-${r.tone}`}>
      <Icon name={r.icon} size={13} /> {r.name}
    </span>
  );
}

const CHILD_STATUS = {
  in: ["Checked in", "mint"],
  out: ["Picked up", "plain"],
  absent: ["Absent", "plain"],
  expected: ["Arriving late", "sun"],
};
export function ChildStatus({ child }) {
  const [label, tone] = CHILD_STATUS[child.status] || CHILD_STATUS.in;
  return (
    <span className={`bd-status dc-tone-${tone}`}>
      {child.status === "in" && child.napping ? "Napping" : label}
      {child.status === "in" && child.inAt && !child.napping
        ? ` · ${at(child.inAt)}`
        : ""}
      {child.status === "out" && child.outAt ? ` · ${at(child.outAt)}` : ""}
    </span>
  );
}

export function KindIcon({ kind, size = 34 }) {
  const k = KINDS[kind] || KINDS.note;
  return (
    <span
      className={`dc-kind dc-tone-${k.tone}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon name={k.icon} size={size * 0.5} />
    </span>
  );
}

// Illustrated stand-ins for classroom photos, so the demo shows no real children.
export function ArtTile({ art = "leaves", label }) {
  const scenes = {
    leaves: (
      <>
        <rect width="160" height="110" fill="#fff4dc" />
        <rect
          x="18"
          y="14"
          width="124"
          height="82"
          rx="6"
          fill="#fff"
          stroke="#f0d9a8"
        />
        {[
          [52, 52, "#e8853d", -20],
          [86, 44, "#d9573b", 15],
          [112, 62, "#c9a227", 40],
          [70, 72, "#7aa35a", -45],
        ].map(([x, y, f, r]) => (
          <path
            key={x}
            transform={`translate(${x} ${y}) rotate(${r})`}
            d="M0-18C12-12 12 8 0 18-12 8-12-12 0-18zM0-18V18"
            fill={f}
            stroke="#fff"
            strokeWidth="1.5"
          />
        ))}
      </>
    ),
    music: (
      <>
        <rect width="160" height="110" fill="#e9f3fd" />
        {[
          [30, 70, "#ffcf5c"],
          [70, 54, "#ff8f73"],
          [110, 72, "#7fd1ae"],
        ].map(([x, y, f]) => (
          <g key={x}>
            <circle cx={x} cy={y} r="14" fill={f} />
            <rect
              x={x + 11}
              y={y - 38}
              width="4"
              height="38"
              rx="2"
              fill="#2b3a4f"
            />
          </g>
        ))}
        {[
          [46, 26],
          [96, 22],
          [132, 36],
        ].map(([x, y]) => (
          <circle
            key={x}
            cx={x}
            cy={y}
            r="7"
            fill="#fff"
            stroke="#b9d6f2"
            strokeWidth="2"
          />
        ))}
      </>
    ),
    blocks: (
      <>
        <rect width="160" height="110" fill="#f1ecfd" />
        <rect x="30" y="66" width="30" height="30" rx="4" fill="#7fb6e8" />
        <rect x="62" y="66" width="30" height="30" rx="4" fill="#ffcf5c" />
        <rect x="94" y="66" width="30" height="30" rx="4" fill="#ff8f73" />
        <rect x="46" y="34" width="30" height="30" rx="4" fill="#7fd1ae" />
        <rect x="78" y="34" width="30" height="30" rx="4" fill="#b9a7f0" />
        <path d="M62 30 77 10l15 20z" fill="#e8853d" />
      </>
    ),
    sandbox: (
      <>
        <rect width="160" height="110" fill="#e6f5ff" />
        <circle cx="128" cy="24" r="12" fill="#ffd54f" />
        <rect y="70" width="160" height="40" fill="#f5deb0" />
        <path d="M40 72c6-14 26-14 32 0z" fill="#e9c98d" />
        <rect x="96" y="56" width="16" height="20" rx="3" fill="#ff8f73" />
        <path
          d="M100 56c0-8 8-8 8 0"
          stroke="#2b3a4f"
          strokeWidth="2"
          fill="none"
        />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 160 110"
      className="dc-art"
      role="img"
      aria-label={label || "Classroom photo (illustration)"}
    >
      {scenes[art] || scenes.leaves}
    </svg>
  );
}

export function Toast() {
  const { state, dispatch } = useDaycare();
  const clear = useCallback(
    () => dispatch({ type: "toast", text: null }),
    [dispatch],
  );
  return <ToastView text={state.toast} onClear={clear} />;
}

// Illustrated stand-in for a classroom camera feed. No real video, no children's images.
const CAM_COLORS = {
  caterpillars: ["#ecf8f1", "#7fd1ae"],
  ladybugs: ["#fff1ec", "#ff9f80"],
  bumblebees: ["#fff4dc", "#ffcf5c"],
  butterflies: ["#f1ecfd", "#b9a7f0"],
};
export function CamScene({ roomId, label, className = "" }) {
  const [bg, accent] = CAM_COLORS[roomId] || ["#e6f5ff", "#7fb6e8"];
  return (
    <svg
      viewBox="0 0 160 90"
      className={`dc-cam-scene ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      <rect width="160" height="90" fill={bg} />
      <rect y="62" width="160" height="28" fill="#f3ead8" />
      <rect
        x="18"
        y="20"
        width="34"
        height="24"
        rx="3"
        fill="#fff"
        stroke={accent}
        strokeWidth="2"
      />
      <rect x="96" y="44" width="46" height="18" rx="3" fill={accent} />
      <rect x="100" y="62" width="4" height="12" fill="#c9b48a" />
      <rect x="134" y="62" width="4" height="12" fill="#c9b48a" />
      <circle cx="64" cy="56" r="6" fill="#ffd54f" />
      <circle cx="78" cy="60" r="5" fill="#ff8f73" />
      <rect
        x="62"
        y="16"
        width="20"
        height="14"
        rx="2"
        fill="#fff"
        opacity=".8"
      />
      <path d="M66 26l4-5 3 3 2-2 3 4z" fill={accent} />
    </svg>
  );
}

// A decorative QR stand-in for pickup passes and check-in.
export function FakeQr({ seed = "bright", size = 120 }) {
  let h = [...seed].reduce(
    (a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) | 0,
    9,
  );
  const cells = [];
  for (let i = 0; i < 121; i++) {
    h = (Math.imul(h, 1103515245) + 12345) | 0;
    const x = i % 11;
    const y = Math.floor(i / 11);
    const corner = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
    if (
      corner
        ? !(x % 10 === 1 || y % 10 === 1) ||
          (x === 1 && y === 1) ||
          (x === 9 && y === 1) ||
          (x === 1 && y === 9)
        : (h >>> 16) & 1
    )
      cells.push(<rect key={i} x={x} y={y} width="1" height="1" />);
  }
  return (
    <svg
      viewBox="-1 -1 13 13"
      width={size}
      height={size}
      className="dc-qr"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {cells}
    </svg>
  );
}
