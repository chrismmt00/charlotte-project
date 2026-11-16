"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import {
  APPOINTMENTS,
  QUEUE,
  TECHS,
  CLIENTS,
  ME,
  INVENTORY,
  FEATURE_REQUESTS,
  SERVICES,
  NOW,
  svc,
  svcMins,
  tech,
} from "./data";

// One shared store for the whole demo, so a walk-in checked in on the kiosk shows up in the
// owner's queue and the technician's day, and a technician's request reaches the owner.

let seq = 100;
const uid = (p) => `${p}${++seq}`;

const initial = {
  queue: QUEUE,
  appts: APPOINTMENTS,
  rotation: TECHS.map((t) => t.id),
  rules: { skills: true, prefs: true, breaks: true, value: false },
  waitAdjust: 0,
  clockedIn: { mia: true, tina: true, ana: true, jess: true },
  perms: {
    mia: { price: true, phones: true, payments: true },
    tina: { price: false, phones: true, payments: true },
    ana: { price: false, phones: false, payments: false },
    jess: { price: false, phones: false, payments: false },
  },
  onBreak: {},
  hours: Object.fromEntries(
    TECHS.map((t) => [
      t.id,
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
        day,
        on:
          t.id === "ana"
            ? !["Sat", "Sun"].includes(day)
            : t.id === "jess"
              ? !["Sun", "Mon"].includes(day)
              : !["Wed", "Sun"].includes(day),
        start: day === "Sat" ? "9:00 AM" : "9:30 AM",
        end: day === "Sat" ? "5:00 PM" : "6:00 PM",
      })),
    ]),
  ),
  alerts: [
    {
      id: "al1",
      kind: "timeoff",
      text: "Tina asked for Sat, Nov 28 off (family event).",
      from: "tina",
    },
    {
      id: "al2",
      kind: "stock",
      text: "Gel top coat is below its reorder level (3 of 6).",
    },
  ],
  timeOff: [
    {
      id: "t1",
      tech: "tina",
      dates: "Sat, Nov 28",
      from: "2026-11-28",
      to: "2026-11-28",
      reason: "Family event",
      status: "pending",
    },
    {
      id: "t2",
      tech: "jess",
      dates: "Dec 23 – Dec 26",
      from: "2026-12-23",
      to: "2026-12-26",
      reason: "Holiday travel",
      status: "approved",
    },
  ],
  // Breaks, blocked time and one-day hour changes on future dates (today's live in appts).
  dayBlocks: [
    {
      id: "db1",
      tech: "mia",
      date: "2026-11-24",
      start: 30,
      mins: 90,
      label: "Gel-X education class",
    },
  ],
  dayHours: {},
  designs: [
    {
      id: "d1",
      client: "Amara J.",
      design: "bloom",
      text: "Flower accents on two nails, nude base, almond.",
      status: "approved",
      estimate: 15,
    },
  ],
  me: ME,
  clients: CLIENTS,
  services: SERVICES,
  techPrices: { mia: 5 },
  inventory: INVENTORY,
  requests: FEATURE_REQUESTS,
  announcements: [
    {
      id: "n1",
      from: "Owner",
      text: "Holiday gift cards are live. Mention them at checkout. 🎁",
      at: "9:02 AM",
    },
    {
      id: "n2",
      from: "Owner",
      text: "Bridal party at 3:30 PM: Mia, Tina and Jess. Prosecco is in the back fridge.",
      at: "8:40 AM",
    },
  ],
  notes: [
    {
      id: "s1",
      from: "Ana",
      text: "Spa chair 2 jets are weak. Using chair 1 for pedicures today.",
      at: "10:15 AM",
    },
  ],
  toast: null,
};

const busy = (state, techId) =>
  state.queue.some(
    (q) => q.tech === techId && ["assigned", "service"].includes(q.status),
  ) || state.appts.some((a) => a.tech === techId && a.status === "service");

const canDo = (t, ids) =>
  ids.every((id) => {
    const cat = svc(id)?.cat;
    if (cat === "Pedicures") return t.skills.includes("Pedicures");
    if (cat === "Enhancements")
      return t.skills.includes("Acrylic") || t.skills.includes("Gel-X");
    return true;
  });

// Who the rotation would hand this walk-in to right now, or null if nobody fits yet.
export function pickTech(state, item) {
  if (state.rules.prefs && item.pref && item.pref !== "any") {
    return busy(state, item.pref) ||
      (state.rules.breaks && state.onBreak[item.pref])
      ? null
      : item.pref;
  }
  for (const id of state.rotation) {
    const t = tech(id);
    if (!state.clockedIn[id]) continue;
    if (state.rules.breaks && state.onBreak[id]) continue;
    if (busy(state, id)) continue;
    if (state.rules.skills && !canDo(t, item.services)) continue;
    return id;
  }
  return null;
}

// Rough wait: the minutes of service ahead of you, shared across about three free technicians, plus the owner’s adjustment.
export function waitFor(state, id) {
  const waiting = state.queue.filter((q) => q.status === "waiting");
  const idx = waiting.findIndex((q) => q.id === id);
  const ahead = waiting.slice(0, idx < 0 ? waiting.length : idx);
  const mins = ahead.reduce((t, q) => t + svcMins(q.services), 0);
  const raw = 5 + mins / 3 + state.waitAdjust;
  return Math.max(5, Math.round(raw / 5) * 5);
}

function reducer(state, a) {
  switch (a.type) {
    case "checkIn": {
      const item = {
        id: uid("w"),
        name: a.name,
        services: a.services,
        pref: a.pref,
        arrived: NOW,
        status: "waiting",
        texts: a.texts,
        isNew: true,
      };
      return {
        ...state,
        queue: [...state.queue, item],
        alerts: [
          {
            id: uid("al"),
            kind: "walkin",
            text: `${a.name} checked in on the kiosk.`,
          },
          ...state.alerts,
        ],
      };
    }
    case "queuePatch":
      return {
        ...state,
        queue: state.queue.map((q) =>
          q.id === a.id ? { ...q, ...a.patch } : q,
        ),
      };
    case "perm":
      return {
        ...state,
        perms: {
          ...state.perms,
          [a.tech]: {
            ...state.perms[a.tech],
            [a.key]: !state.perms[a.tech][a.key],
          },
        },
      };
    case "queueStatus": {
      const queue = state.queue.map((q) =>
        q.id === a.id ? { ...q, status: a.status } : q,
      );
      return { ...state, queue };
    }
    case "assignNext": {
      // Hand the first walk-in who can be matched to the next technician in the rotation.
      const waiting = state.queue.filter(
        (q) => q.status === "waiting" && (!a.id || q.id === a.id),
      );
      if (!waiting.length) return { ...state, toast: "Nobody is waiting." };
      let next = null;
      let who = null;
      for (const q of waiting) {
        who = pickTech(state, q);
        if (who) {
          next = q;
          break;
        }
      }
      if (!next) {
        const first = waiting[0];
        return {
          ...state,
          toast:
            first.pref && first.pref !== "any" && waiting.length === 1
              ? `${first.name} is waiting for ${tech(first.pref).name}, who’s still with a client.`
              : "Every matching technician is busy right now. Wait times are updating.",
        };
      }
      return {
        ...state,
        queue: state.queue.map((q) =>
          q.id === next.id
            ? {
                ...q,
                status: "assigned",
                tech: who,
                station: tech(who).station,
              }
            : q,
        ),
        rotation: [...state.rotation.filter((r) => r !== who), who],
        toast: `${next.name} → ${tech(who).name} at ${tech(who).station}. We texted them that they’re next.`,
      };
    }
    case "leave":
      return {
        ...state,
        queue: state.queue.filter((q) => q.id !== a.id),
        toast: "Removed from the queue. Wait times updated.",
      };
    case "outside":
      return {
        ...state,
        queue: state.queue.map((q) =>
          q.id === a.id ? { ...q, outside: !q.outside } : q,
        ),
      };
    case "waitAdjust":
      return {
        ...state,
        waitAdjust: Math.max(-10, Math.min(30, state.waitAdjust + a.by)),
      };
    case "rotate": {
      const r = [...state.rotation];
      const i = r.indexOf(a.id);
      const j = i + a.by;
      if (j < 0 || j >= r.length) return state;
      [r[i], r[j]] = [r[j], r[i]];
      return { ...state, rotation: r };
    }
    case "rule":
      return {
        ...state,
        rules: { ...state.rules, [a.key]: !state.rules[a.key] },
      };
    case "appt": {
      const appts = state.appts.map((x) =>
        x.id === a.id ? { ...x, ...a.patch } : x,
      );
      return { ...state, appts };
    }
    case "alert":
      return {
        ...state,
        alerts: [
          { id: uid("al"), kind: a.kind, text: a.text, from: a.from },
          ...state.alerts,
        ],
        toast: a.toast ?? state.toast,
      };
    case "dismiss":
      return { ...state, alerts: state.alerts.filter((x) => x.id !== a.id) };
    case "timeOff":
      return {
        ...state,
        timeOff: [
          {
            id: uid("t"),
            tech: a.tech,
            dates: a.dates,
            from: a.from,
            to: a.to,
            reason: a.reason,
            status: "pending",
          },
          ...state.timeOff,
        ],
        alerts: [
          {
            id: uid("al"),
            kind: "timeoff",
            text: `${tech(a.tech).name} asked for ${a.dates} off.`,
            from: a.tech,
          },
          ...state.alerts,
        ],
      };
    case "decide":
      return {
        ...state,
        timeOff: state.timeOff.map((t) =>
          t.id === a.id ? { ...t, status: a.status } : t,
        ),
        alerts: state.alerts.filter(
          (x) =>
            x.kind !== "timeoff" ||
            x.from !== state.timeOff.find((t) => t.id === a.id)?.tech,
        ),
        toast:
          a.status === "approved"
            ? "Approved. Those dates are blocked off on the schedule."
            : "Declined. A note was sent to the technician’s app.",
      };
    case "clock":
      return {
        ...state,
        clockedIn: { ...state.clockedIn, [a.tech]: !state.clockedIn[a.tech] },
      };
    case "breakToggle":
      return {
        ...state,
        onBreak: { ...state.onBreak, [a.tech]: !state.onBreak[a.tech] },
      };
    case "design":
      return {
        ...state,
        designs: [
          {
            id: uid("d"),
            client: a.client,
            design: a.design,
            photo: a.photo,
            text: a.text,
            status: "pending",
          },
          ...state.designs,
        ],
        alerts: [
          {
            id: uid("al"),
            kind: "design",
            text: `${a.client} sent a custom design request.`,
          },
          ...state.alerts,
        ],
      };
    case "estimate":
      return {
        ...state,
        designs: state.designs.map((d) =>
          d.id === a.id
            ? { ...d, status: "quoted", estimate: a.price, mins: a.mins }
            : d,
        ),
        toast: "Estimate sent. The client can approve it in the app.",
      };
    case "approveDesign":
      return {
        ...state,
        designs: state.designs.map((d) =>
          d.id === a.id ? { ...d, status: "approved" } : d,
        ),
      };
    case "me":
      return { ...state, me: { ...state.me, ...a.patch } };
    case "set":
      return {
        ...state,
        [a.key]:
          typeof a.value === "function" ? a.value(state[a.key]) : a.value,
      };
    case "block":
      return {
        ...state,
        appts: [
          ...state.appts,
          {
            id: uid("b"),
            kind: "break",
            tech: a.tech,
            start: a.start,
            mins: a.mins,
            label: a.label,
          },
        ],
        alerts: [
          {
            id: uid("al"),
            kind: "block",
            text: `${tech(a.tech).name} added ${a.label === "Break" ? "a break" : `blocked time (${a.label})`} at ${a.when}. Online booking skips it.`,
          },
          ...state.alerts,
        ],
        toast: `${a.label === "Break" ? "Break" : "Time blocked"} at ${a.when}. Online booking won’t offer it.`,
      };
    case "unblock":
      return {
        ...state,
        appts: state.appts.filter((x) => x.id !== a.id),
        toast: "Removed. That time is bookable again.",
      };
    case "hours":
      return {
        ...state,
        hours: { ...state.hours, [a.tech]: a.hours },
        alerts: [
          {
            id: uid("al"),
            kind: "hours",
            text: `${tech(a.tech).name} updated their weekly hours.`,
          },
          ...state.alerts,
        ],
        toast: "Hours saved. The owner can see the change.",
      };
    case "dayBlock":
      return {
        ...state,
        dayBlocks: [
          ...state.dayBlocks,
          {
            id: uid("db"),
            tech: a.tech,
            date: a.date,
            start: a.start,
            mins: a.mins,
            label: a.label,
          },
        ],
        alerts: [
          {
            id: uid("al"),
            kind: "block",
            text: `${tech(a.tech).name} added ${a.label === "Break" ? "a break" : `blocked time (${a.label})`} on ${a.when}. Online booking skips it.`,
          },
          ...state.alerts,
        ],
        toast: `${a.label === "Break" ? "Break" : "Time blocked"} on ${a.when}. Online booking won’t offer it.`,
      };
    case "dayUnblock":
      return {
        ...state,
        dayBlocks: state.dayBlocks.filter((x) => x.id !== a.id),
        toast: "Removed. That time is bookable again.",
      };
    case "dayHours":
      return {
        ...state,
        dayHours: {
          ...state.dayHours,
          [a.tech]: { ...state.dayHours[a.tech], [a.date]: a.hours },
        },
        alerts: [
          {
            id: uid("al"),
            kind: "hours",
            text: `${tech(a.tech).name} changed their hours for ${a.label} to ${a.hours.start} – ${a.hours.end}.`,
          },
          ...state.alerts,
        ],
        toast: `Hours for ${a.label} saved. Online booking now follows them.`,
      };
    case "note":
      return {
        ...state,
        notes: [
          { id: uid("s"), from: a.from, text: a.text, at: "Just now" },
          ...state.notes,
        ],
      };
    case "toast":
      return { ...state, toast: a.text };
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useDemo = () => useContext(Ctx);
