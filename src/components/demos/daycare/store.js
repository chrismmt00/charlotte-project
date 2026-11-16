"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import {
  ANNOUNCEMENTS,
  APPLICATIONS,
  CHILDREN,
  FAILED,
  GUESTS,
  INCIDENTS,
  INVOICES,
  LOGS,
  MEDS,
  NOW,
  PICKUP_LOG,
  STAFF,
  THREADS,
  at,
  childOf,
} from "./data";

// One store for the whole daycare demo, so a check-in at the front desk shows in the parent
// app and the teacher's roster, a guest authorization flows to the guest's phone and the front
// desk, and a teacher's activity log lands in the parent's daily report.

let seq = 100;
const uid = (p) => `${p}${++seq}`;

const initial = {
  children: CHILDREN,
  logs: LOGS,
  guests: GUESTS,
  pickupLog: PICKUP_LOG,
  failed: FAILED,
  meds: MEDS,
  incidents: INCIDENTS,
  threads: THREADS,
  announcements: ANNOUNCEMENTS,
  invoices: INVOICES,
  applications: APPLICATIONS,
  autopay: false,
  clockedIn: Object.fromEntries(STAFF.map((s) => [s.id, s.id !== "li"])),
  onBreak: { li: true },
  roomOf: {}, // temporary room changes, e.g. { butterflies: "Playground" }
  timeOff: [
    {
      id: "t1",
      staff: "andre",
      dates: "Fri, Nov 20",
      reason: "Family wedding",
      status: "pending",
    },
  ],
  // Notifications on the parent's phone (newest first).
  notices: [
    {
      id: "n1",
      text: "Maya and Eli were checked in by Danielle Carter at 7:52 AM.",
      time: 472,
    },
    {
      id: "n2",
      text: "Incident report for Maya: small scrape on the playground. Please review.",
      time: 640,
    },
    { id: "n3", text: "New photo of Maya from art time.", time: 676 },
  ],
  alerts: [
    {
      id: "al1",
      kind: "guest",
      text: "Guest pickup for Maya C. (Linda Carter, grandmother) is waiting for guest verification.",
    },
    {
      id: "al2",
      kind: "med",
      text: "Jayden T. is due for medication at 12:30 PM (Butterflies).",
    },
    {
      id: "al3",
      kind: "cert",
      text: "Mr. Ben’s CPR & First Aid certification expires Dec 4.",
    },
    {
      id: "al4",
      kind: "late",
      text: "Arjun P. is arriving late (doctor’s appointment), expected 12:45 PM.",
    },
  ],
  photoOk: { maya: true, eli: true },
  // Camera access. Parent viewing is off until the owner turns it on, then only for the
  // rooms the owner opens, during viewing hours, while the parent's child is checked in.
  cameras: {
    parents: false,
    rooms: {
      caterpillars: true,
      ladybugs: true,
      bumblebees: true,
      butterflies: true,
    },
    from: 450,
    to: 1050,
  },
  camLog: [
    {
      id: "c1",
      who: "Ms. Joy",
      what: "viewed Butterflies",
      when: "Today 10:02 AM",
    },
    {
      id: "c2",
      who: "Ms. Kim",
      what: "viewed Ladybugs",
      when: "Today 9:15 AM",
    },
    {
      id: "c3",
      who: "Ms. Joy",
      what: "exported 2 min of Playground (incident review)",
      when: "Thu 3:40 PM",
    },
  ],
  toast: null,
};

const notice = (state, text) => [
  { id: uid("n"), text, time: NOW },
  ...state.notices,
];
const alert = (state, kind, text) => [
  { id: uid("al"), kind, text },
  ...state.alerts,
];

function reducer(state, a) {
  switch (a.type) {
    case "checkIn": {
      const names = a.ids
        .map((id) => childOf(state.children, id).first)
        .join(" and ");
      return {
        ...state,
        children: state.children.map((c) =>
          a.ids.includes(c.id)
            ? { ...c, status: "in", inAt: NOW, inBy: a.adult, lateNote: null }
            : c,
        ),
        logs: [
          ...state.logs,
          ...a.ids.map((id) => ({
            id: uid("l"),
            child: id,
            time: NOW,
            kind: "in",
            text: "Checked in",
            detail: `Dropped off by ${a.adult}${a.note ? ` · ${a.note}` : ""}`,
            by: "Front desk tablet",
          })),
        ],
        notices: a.ids.some((id) => ["maya", "eli"].includes(id))
          ? notice(state, `${names} checked in by ${a.adult} at ${at(NOW)}.`)
          : state.notices,
        alerts: alert(
          state,
          "in",
          `${names} checked in at ${at(NOW)} by ${a.adult}. Teachers were alerted.`,
        ),
        toast: `${names} checked in. Teachers alerted and guardians notified.`,
      };
    }
    case "release": {
      const kid = childOf(state.children, a.child);
      const mine = ["maya", "eli"].includes(a.child);
      return {
        ...state,
        children: state.children.map((c) =>
          c.id === a.child
            ? { ...c, status: "out", outAt: NOW, outBy: a.by }
            : c,
        ),
        logs: [
          ...state.logs,
          {
            id: uid("l"),
            child: a.child,
            time: NOW,
            kind: "out",
            text: "Picked up",
            detail: `By ${a.by} (${a.relation}) · released by ${a.staff}`,
            by: a.staff,
          },
        ],
        pickupLog: [
          {
            id: uid("p"),
            child: a.child,
            by: a.by,
            relation: a.relation,
            time: NOW,
            staff: a.staff,
            method: a.method,
          },
          ...state.pickupLog,
        ],
        guests: a.guest
          ? state.guests.map((g) =>
              g.id === a.guest
                ? {
                    ...g,
                    status: g.type === "One-time" ? "used" : g.status,
                    usedAt: NOW,
                  }
                : g,
            )
          : state.guests,
        notices: mine
          ? notice(
              state,
              `${kid.first} was picked up by ${a.by} (${a.relation}) at ${at(NOW)}. Released by ${a.staff}.`,
            )
          : state.notices,
        alerts: alert(
          state,
          "out",
          `${kid.name} picked up by ${a.by} at ${at(NOW)}, released by ${a.staff}.`,
        ),
        toast: `${kid.first} released to ${a.by}. Guardians notified.`,
      };
    }
    case "refuse":
      return {
        ...state,
        failed: [
          {
            id: uid("x"),
            day: "Today",
            time: NOW,
            child: a.child,
            who: a.who,
            what: a.what,
            staff: a.staff,
          },
          ...state.failed,
        ],
        guests: a.guest
          ? state.guests.map((g) =>
              g.id === a.guest ? { ...g, tries: g.tries + 1 } : g,
            )
          : state.guests,
        alerts: alert(
          state,
          "refused",
          `Pickup refused for ${childOf(state.children, a.child).name}: ${a.what}`,
        ),
        notices: ["maya", "eli"].includes(a.child)
          ? notice(
              state,
              `A pickup attempt for ${childOf(state.children, a.child).first} could not be verified. ${childOf(state.children, a.child).first} is safe with staff. The director will call you.`,
            )
          : state.notices,
        toast:
          "Release refused and logged. The child stays with staff and the director was notified.",
      };
    case "guestArrived":
      return {
        ...state,
        notices: notice(
          state,
          `An authorized guest has arrived for ${a.childName}: ${a.name} is at the front desk.`,
        ),
        alerts: alert(
          state,
          "guest",
          `${a.name} entered a valid pickup code (${a.childName}). Waiting for staff verification.`,
        ),
      };
    case "badCode":
      return {
        ...state,
        failed: [
          {
            id: uid("x"),
            day: "Today",
            time: NOW,
            child: null,
            who: "Front desk tablet",
            what: `Invalid pickup code entered (${a.code}).`,
            staff: "System",
          },
          ...state.failed,
        ],
        alerts: a.locked
          ? alert(
              state,
              "refused",
              "Pickup code entry locked on the front desk tablet after 3 failed tries.",
            )
          : state.alerts,
      };
    case "addGuest": {
      const g = {
        id: uid("g"),
        status: "invited",
        code: null,
        photo: null,
        tries: 0,
        by: "Danielle Carter",
        ...a.guest,
      };
      return {
        ...state,
        guests: [g, ...state.guests],
        notices: notice(
          state,
          `A new pickup authorization was added: ${g.name} (${g.relation}) for ${g.date}.`,
        ),
        alerts: alert(
          state,
          "guest",
          `Danielle Carter authorized ${g.name} (${g.relation}) to pick up on ${g.date}. Waiting for guest verification.`,
        ),
        toast: `Invite sent to ${g.name}. They’ll verify their identity before getting a pickup pass.`,
      };
    }
    case "verifyGuest":
      return {
        ...state,
        guests: state.guests.map((g) =>
          g.id === a.id
            ? { ...g, ...a.patch, status: "verified", code: a.code }
            : g,
        ),
        notices: notice(
          state,
          `${a.patch.legalName || "Your guest"} completed verification and received a pickup pass.`,
        ),
        alerts: alert(
          state,
          "guest",
          `${a.patch.legalName} submitted a verification form and photo. Staff will compare it at pickup.`,
        ),
        toast: "Verified. Pickup pass issued.",
      };
    case "revokeGuest": {
      const g = state.guests.find((x) => x.id === a.id);
      return {
        ...state,
        guests: state.guests.map((x) =>
          x.id === a.id ? { ...x, status: "revoked" } : x,
        ),
        notices: notice(
          state,
          `Your pickup authorization for ${g.name} has been revoked.`,
        ),
        alerts: alert(
          state,
          "guest",
          `${a.by || "Danielle Carter"} revoked the pickup authorization for ${g.name}.`,
        ),
        toast: `${g.name}’s pickup pass no longer works.`,
      };
    }
    case "log": {
      const entries = a.ids.map((id) => ({
        id: uid("l"),
        child: id,
        time: NOW,
        by: a.by,
        ...a.entry,
      }));
      const mine = a.ids.filter((id) => ["maya", "eli"].includes(id));
      return {
        ...state,
        logs: [...state.logs, ...entries],
        notices: mine.length
          ? notice(
              state,
              `New ${a.entry.text.toLowerCase()} update for ${mine.map((id) => childOf(state.children, id).first).join(" and ")}.`,
            )
          : state.notices,
        toast:
          a.toast ??
          `Logged for ${a.ids.length} ${a.ids.length === 1 ? "child" : "children"}. Each child’s history was updated.`,
      };
    }
    case "endNap":
      return {
        ...state,
        children: state.children.map((c) =>
          a.ids.includes(c.id) ? { ...c, napping: false } : c,
        ),
        logs: [
          ...state.logs.map((l) =>
            l.kind === "nap" && l.open && a.ids.includes(l.child)
              ? {
                  ...l,
                  open: false,
                  detail: `${l.detail.split(" with")[0]} · slept ${Math.max(5, NOW - l.time)} min`,
                }
              : l,
          ),
        ],
        toast: "Nap end recorded.",
      };
    case "startNap":
      return {
        ...state,
        children: state.children.map((c) =>
          a.ids.includes(c.id) ? { ...c, napping: true } : c,
        ),
        logs: [
          ...state.logs,
          ...a.ids.map((id) => ({
            id: uid("l"),
            child: id,
            time: NOW,
            kind: "nap",
            text: "Nap started",
            detail: `Fell asleep at ${at(NOW)}`,
            by: a.by,
            open: true,
          })),
        ],
        toast: "Nap start recorded.",
      };
    case "giveMed":
      return {
        ...state,
        meds: state.meds.map((m) =>
          m.id === a.id
            ? { ...m, status: "given", givenAt: NOW, givenBy: a.by }
            : m,
        ),
        logs: [
          ...state.logs,
          {
            id: uid("l"),
            child: a.child,
            time: NOW,
            kind: "med",
            text: "Medication given",
            detail: `${a.med} · by ${a.by}`,
            by: a.by,
          },
        ],
        alerts: state.alerts.filter((x) => x.kind !== "med"),
        toast: "Dose recorded with time and staff name.",
      };
    case "incident":
      return {
        ...state,
        incidents: [
          { id: uid("i"), ack: false, ...a.incident },
          ...state.incidents,
        ],
        logs: [
          ...state.logs,
          {
            id: uid("l"),
            child: a.incident.child,
            time: a.incident.time,
            kind: "incident",
            text: "Incident report",
            detail: a.incident.what,
            by: a.incident.staff,
          },
        ],
        notices: ["maya", "eli"].includes(a.incident.child)
          ? notice(
              state,
              `Incident report for ${childOf(state.children, a.incident.child).first}. Please review and acknowledge.`,
            )
          : state.notices,
        alerts: alert(
          state,
          "incident",
          `Incident report filed for ${childOf(state.children, a.incident.child).name} by ${a.incident.staff}.`,
        ),
        toast: "Report sent to the director and the child’s guardians.",
      };
    case "ack":
      return {
        ...state,
        incidents: state.incidents.map((i) =>
          i.id === a.id ? { ...i, ack: true } : i,
        ),
        alerts: alert(
          state,
          "incident",
          "Danielle Carter acknowledged Maya’s incident report.",
        ),
        toast: "Thanks. The center can see you’ve read it.",
      };
    case "message": {
      const t = state.threads[a.thread];
      return {
        ...state,
        threads: {
          ...state.threads,
          [a.thread]: {
            ...t,
            messages: [
              ...t.messages,
              { from: a.from, text: a.text, time: NOW },
            ],
          },
        },
        toast: a.toast ?? state.toast,
      };
    }
    case "camView":
      return {
        ...state,
        camLog: [
          {
            id: uid("c"),
            who: a.who,
            what: `viewed ${a.room} (parent live view)`,
            when: `Today ${at(NOW)}`,
          },
          ...state.camLog,
        ],
      };
    case "camera":
      return {
        ...state,
        cameras: { ...state.cameras, ...a.patch },
        toast: a.toast ?? state.toast,
      };
    case "notice":
      return {
        ...state,
        notices: notice(state, a.text),
        toast: a.toast ?? state.toast,
      };
    case "alert":
      return {
        ...state,
        alerts: alert(state, a.kind, a.text),
        toast: a.toast ?? state.toast,
      };
    case "dismiss":
      return { ...state, alerts: state.alerts.filter((x) => x.id !== a.id) };
    case "child":
      return {
        ...state,
        children: state.children.map((c) =>
          c.id === a.id ? { ...c, ...a.patch } : c,
        ),
      };
    case "set":
      return {
        ...state,
        [a.key]:
          typeof a.value === "function" ? a.value(state[a.key]) : a.value,
      };
    case "toast":
      return { ...state, toast: a.text };
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function DaycareProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useDaycare = () => useContext(Ctx);
