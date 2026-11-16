"use client";

import { useState } from "react";
import { NOW, clock, svcMins, svcNames, svcPrice, tech } from "./data";
import { useDemo } from "./store";
import { Sheet } from "./ClientApp";
import { Icon, Status, Swatch, Toggle, money } from "./ui";

// ---------- Dates (the demo's "today" is Monday, November 16, 2026) ----------
export const TODAY = "2026-11-16";
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WD_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const LAST_DAY = "2027-02-28";

const ms = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const toIso = (t) => new Date(t).toISOString().slice(0, 10);
const addDays = (iso, n) => toIso(ms(iso) + n * 86400000);
const daysBetween = (a, b) => Math.round((ms(b) - ms(a)) / 86400000);
const weekday = (iso) => (new Date(ms(iso)).getUTCDay() + 6) % 7;
const monthOf = (iso) => Number(iso.slice(5, 7)) - 1;
const dayNum = (iso) => Number(iso.slice(8, 10));
const mondayOf = (iso) => addDays(iso, -weekday(iso));
const shiftMonth = (iso, n) => {
  const total = Number(iso.slice(0, 4)) * 12 + monthOf(iso) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
};
export const dayLabel = (iso) =>
  `${WD[weekday(iso)]}, ${MONTHS[monthOf(iso)]} ${dayNum(iso)}`;

// "9:30 AM" -> minutes after 9:00 AM, the demo's time unit.
const toMin = (t) => {
  const [hm, ap] = t.split(" ");
  let [h, m] = hm.split(":").map(Number);
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + m - 540;
};
// "Sat, Nov 21" from the client app -> ISO date.
const clientDayIso = (label) => {
  const [, mon, d] = label.match(/([A-Z][a-z]{2}) (\d+)/) || [];
  const m = MONTHS.indexOf(mon);
  if (m < 0) return null;
  return `${m < 6 ? 2027 : 2026}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};
const HOUR_TIMES = [
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
];
const short = (t) => t.replace(/ (AM|PM)$/, "");

// ---------- Sample bookings made in advance ----------
const NAMES = [
  "Keisha B.",
  "Sofia L.",
  "Brianna T.",
  "Amara J.",
  "Nia C.",
  "Rachel G.",
  "Imani S.",
  "Jordan E.",
  "Taylor M.",
  "Priya K.",
  "Aaliyah R.",
  "Morgan D.",
  "Erin H.",
  "Camila V.",
  "Zoe P.",
  "Hannah K.",
];
const POOL = {
  mia: [
    ["gelx", "art"],
    ["acrylic"],
    ["fill"],
    ["gel-mani"],
    ["gelx"],
    ["acrylic", "art"],
    ["removal", "gel-mani"],
  ],
  tina: [
    ["acrylic"],
    ["gelx"],
    ["fill"],
    ["gel-mani"],
    ["classic-mani"],
    ["removal", "gelx"],
  ],
  ana: [
    ["deluxe-pedi"],
    ["classic-pedi"],
    ["gel-mani", "classic-pedi"],
    ["deluxe-pedi"],
    ["classic-mani"],
  ],
  jess: [
    ["classic-mani"],
    ["gel-mani"],
    ["classic-pedi"],
    ["deluxe-pedi"],
    ["classic-mani", "classic-pedi"],
  ],
};
function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) =>
  [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

// Same bookings every time for a technician and day; the nearer the date, the fuller it is.
function generated(techId, date, hours) {
  const dist = daysBetween(TODAY, date);
  if (dist <= 0 || !hours.on) return [];
  const fill = dist <= 6 ? 0.78 : dist <= 20 ? 0.55 : dist <= 45 ? 0.32 : 0.16;
  const r = rng(hash(techId + date));
  const out = [];
  const end = toMin(hours.end);
  let t = toMin(hours.start);
  while (t + 30 <= end) {
    if (r() < fill) {
      const services = POOL[techId][Math.floor(r() * POOL[techId].length)];
      const mins = svcMins(services);
      if (t + mins > end) break;
      const ahead = 1 + Math.floor(r() * 26);
      out.push({
        id: `g-${techId}-${date}-${t}`,
        src: "future",
        start: t,
        client: NAMES[Math.floor(r() * NAMES.length)],
        services,
        bookedOn: dayLabel(addDays(TODAY, -ahead)),
        via: r() < 0.72 ? "Online" : "By phone",
        deposit: r() < 0.6 ? 20 : 0,
      });
      t = Math.ceil((t + mins + 10) / 15) * 15;
    } else t += 30 + Math.floor(r() * 3) * 15;
  }
  return out;
}

const usualHours = (state, techId, date) => state.hours[techId][weekday(date)];
const dayHours = (state, techId, date) =>
  state.dayHours?.[techId]?.[date] || usualHours(state, techId, date);
const timeOffOn = (state, techId, date) =>
  state.timeOff.find(
    (t) =>
      t.tech === techId &&
      t.from &&
      t.from <= date &&
      date <= t.to &&
      t.status !== "declined",
  );

const itemEnd = (x) => x.start + (x.mins ?? svcMins(x.services) + 10);

// Everything on this technician's plate today: booked appointments, assigned walk-ins and breaks.
export function todayItems(state, techId) {
  const appts = state.appts
    .filter((a) => a.tech === techId)
    .map((a) => ({ ...a, src: a.kind === "break" ? "break" : "appt" }));
  const walkins = state.queue
    .filter((q) => q.tech === techId)
    .map((q) => ({
      ...q,
      client: q.name,
      start: Math.max(q.arrived + 5, NOW),
      src: "walkin",
    }));
  return [...appts, ...walkins].sort((a, b) => a.start - b.start);
}
export function useDay(techId) {
  const { state } = useDemo();
  return todayItems(state, techId);
}

// The full agenda for any day: bookings made in advance, client-app bookings, breaks and blocks.
function agenda(state, techId, date) {
  if (date === TODAY) return todayItems(state, techId);
  const hours = usualHours(state, techId, date);
  const fromApp = state.me.upcoming
    .filter((u) => u.tech === techId && clientDayIso(u.day) === date)
    .map((u) => ({
      id: u.id,
      src: "future",
      start: toMin(u.time),
      client: state.me.full,
      services: u.services,
      bookedOn: u.id === "u1" ? "Mon, Nov 2" : "Today",
      via: "Client app",
      deposit: u.deposit,
      group: u.group,
      confirmed: u.confirmed,
    }));
  const blocks = (state.dayBlocks || [])
    .filter((b) => b.tech === techId && b.date === date)
    .map((b) => ({ ...b, src: "block" }));
  const taken = [
    ...fromApp.map((f) => [f.start, f.start + svcMins(f.services) + 10]),
    ...blocks.map((b) => [b.start, b.start + b.mins]),
  ];
  const gen = generated(techId, date, hours).filter(
    (g) =>
      !taken.some(
        ([a, b]) => g.start < b && g.start + svcMins(g.services) + 10 > a,
      ),
  );
  return [...fromApp, ...gen, ...blocks].sort((a, b) => a.start - b.start);
}

// ---------- Booking details for a future day ----------
function FutureSheet({ item, techId, date, onClose }) {
  const { state, dispatch } = useDemo();
  const client = state.clients.find((c) => c.name === item.client);
  return (
    <Sheet title={item.client} onClose={onClose}>
      <div className="bd-tags">
        <span className="bd-status bd-tone-plain">Booked</span>
        {item.deposit ? (
          <span className="bd-status bd-tone-mint">
            {money(item.deposit)} deposit paid
          </span>
        ) : null}
        {client?.vip ? (
          <span className="bd-status bd-tone-gold">VIP</span>
        ) : null}
        {item.group ? (
          <span className="bd-status bd-tone-lilac">{item.group}</span>
        ) : null}
      </div>
      <dl className="bd-dl bd-dl-tight">
        <div>
          <dt>When</dt>
          <dd>
            {dayLabel(date)} · {clock(item.start)}
          </dd>
        </div>
        <div>
          <dt>Services</dt>
          <dd>{svcNames(item.services)}</dd>
        </div>
        <div>
          <dt>Estimate</dt>
          <dd>
            {money(svcPrice(item.services, techId))} · {svcMins(item.services)}{" "}
            min
          </dd>
        </div>
        <div>
          <dt>Booked</dt>
          <dd>
            {item.bookedOn} · {item.via}
          </dd>
        </div>
      </dl>
      {client ? (
        <div className="bd-prefs">
          <p className="bd-mini">Preferences & prep notes</p>
          <p>
            <strong>{client.shape}</strong> shape ·{" "}
            {client.colors.map((c) => (
              <Swatch key={c} id={c} size={16} />
            ))}
          </p>
          {client.notes ? <p className="bd-sub">{client.notes}</p> : null}
        </div>
      ) : (
        <p className="bd-hint">
          New client. Preferences show here after they fill in their profile.
        </p>
      )}
      <button
        type="button"
        className="bd-btn bd-btn-soft bd-btn-block"
        onClick={() => {
          dispatch({
            type: "alert",
            kind: "booking",
            text: `${tech(techId).name} asked the front desk to move ${item.client}’s ${dayLabel(date)} ${clock(item.start)} booking.`,
            toast: "Sent to the front desk. They’ll contact the client.",
          });
          onClose();
        }}
      >
        Ask the front desk to move it
      </button>
    </Sheet>
  );
}

// ---------- Editing a day ----------
function DayEditor({ techId, date, items, hours, onDone }) {
  const { state, dispatch } = useDemo();
  const [panel, setPanel] = useState(hours.on ? null : "hours");
  const [kind, setKind] = useState("Break");
  const [reason, setReason] = useState("");
  const [mins, setMins] = useState(30);
  const isToday = date === TODAY;
  const startMin = toMin(hours.start);
  const endMin = toMin(hours.end);
  const first = isToday
    ? Math.max(startMin, Math.ceil((NOW + 5) / 15) * 15)
    : startMin;
  const slots = [];
  for (let t = first; t + 15 <= endMin; t += 15) slots.push(t);
  const busy = items
    .filter((x) => x.src !== "walkin" || x.status !== "done")
    .map((x) => [x.start, itemEnd(x)]);
  const freeSlot =
    slots.find((t) => !busy.some(([a, b]) => t < b && t + 30 > a)) ?? slots[0];
  const [start, setStart] = useState(freeSlot ?? first);
  const clash = busy.some(([a, b]) => start < b && start + mins > a);
  const [hStart, setHStart] = useState(hours.on ? hours.start : "9:30 AM");
  const [hEnd, setHEnd] = useState(hours.on ? hours.end : "6:00 PM");
  const bookings = items.filter((x) => x.src !== "break" && x.src !== "block");
  const lastEnd = bookings.length
    ? Math.max(...bookings.map(itemEnd)) - 10
    : null;
  const firstStart = bookings.length
    ? Math.min(...bookings.map((x) => x.start))
    : null;
  const cuts =
    bookings.length && (toMin(hStart) > firstStart || toMin(hEnd) < lastEnd);
  const [offReason, setOffReason] = useState("");
  const label = dayLabel(date);
  const override = !!state.dayHours?.[techId]?.[date];

  const tools = [
    ["break", "clock", "Add break"],
    ["block", "lock", "Block time"],
    ["hours", "calendar", hours.on ? "Change hours" : "Work this day"],
    ["off", "heart", "Request day off"],
  ].filter(([k]) => hours.on || k === "hours");

  return (
    <div className="bd-day-edit">
      <div className="bd-tech-tools" role="group" aria-label={`Edit ${label}`}>
        {tools.map(([k, icon, text]) => (
          <button
            key={k}
            type="button"
            className="bd-tool"
            aria-pressed={panel === k}
            onClick={() => {
              setPanel(panel === k ? null : k);
              if (k === "break" || k === "block")
                setKind(k === "break" ? "Break" : "Block");
            }}
          >
            <Icon name={icon} /> {text}
          </button>
        ))}
      </div>

      {(panel === "break" || panel === "block") && (
        <form
          className="bd-card bd-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (clash || !slots.length) return;
            const name =
              kind === "Break" ? "Break" : reason.trim() || "Blocked";
            if (isToday)
              dispatch({
                type: "block",
                tech: techId,
                start,
                mins,
                label: name,
                when: clock(start),
              });
            else
              dispatch({
                type: "dayBlock",
                tech: techId,
                date,
                start,
                mins,
                label: name,
                when: `${label} at ${clock(start)}`,
              });
            setReason("");
            setPanel(null);
            onDone?.();
          }}
        >
          <div className="bd-form-2">
            <label className="bd-field">
              <span>Starts</span>
              <select
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
              >
                {slots.map((m) => (
                  <option key={m} value={m}>
                    {clock(m)}
                  </option>
                ))}
              </select>
            </label>
            <label className="bd-field">
              <span>Length</span>
              <select
                value={mins}
                onChange={(e) => setMins(Number(e.target.value))}
              >
                {[15, 20, 30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? "s" : ""}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {kind === "Block" ? (
            <label className="bd-field">
              <span>Reason (only the owner sees it)</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Dentist, school pickup, training…"
              />
            </label>
          ) : null}
          <p className={`bd-hint${clash ? " bd-warn" : ""}`} aria-live="polite">
            {!slots.length
              ? "No time left to block today."
              : clash
                ? `That overlaps a client between ${clock(start)} and ${clock(start + mins)}. Pick another time.`
                : `${clock(start)} – ${clock(start + mins)} on ${label} comes off online booking${isToday ? " and the walk-in rotation" : ""}.`}
          </p>
          <button
            type="submit"
            className="bd-btn bd-btn-block"
            disabled={clash || !slots.length}
          >
            {kind === "Break" ? "Add break" : "Block this time"}
          </button>
        </form>
      )}

      {panel === "hours" && (
        <form
          className="bd-card bd-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (cuts) return;
            dispatch({
              type: "dayHours",
              tech: techId,
              date,
              label,
              hours: {
                day: WD[weekday(date)],
                on: true,
                start: hStart,
                end: hEnd,
              },
            });
            setPanel(null);
          }}
        >
          <p className="bd-sub">
            {hours.on
              ? `Only changes ${label}. Your usual ${WD_LONG[weekday(date)]} hours stay the same.`
              : `You don’t usually work ${WD_LONG[weekday(date)]}s. Open ${label} for bookings?`}
          </p>
          <div className="bd-form-2">
            <label className="bd-field">
              <span>Start</span>
              <select
                value={hStart}
                onChange={(e) => setHStart(e.target.value)}
              >
                {HOUR_TIMES.slice(0, 9).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="bd-field">
              <span>Finish</span>
              <select value={hEnd} onChange={(e) => setHEnd(e.target.value)}>
                {HOUR_TIMES.slice(8).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          {cuts ? (
            <p className="bd-hint bd-warn" aria-live="polite">
              You have clients from {clock(firstStart)} to {clock(lastEnd)}. Ask
              the front desk to move them first.
            </p>
          ) : null}
          <button type="submit" className="bd-btn bd-btn-block" disabled={cuts}>
            Save hours for {label}
          </button>
          {override ? (
            <button
              type="button"
              className="bd-btn bd-btn-ghost bd-btn-block"
              onClick={() => {
                dispatch({
                  type: "set",
                  key: "dayHours",
                  value: (d) => ({
                    ...d,
                    [techId]: Object.fromEntries(
                      Object.entries(d[techId] || {}).filter(
                        ([k]) => k !== date,
                      ),
                    ),
                  }),
                });
                dispatch({
                  type: "toast",
                  text: `${label} is back to your usual hours.`,
                });
                setPanel(null);
              }}
            >
              Back to usual hours
            </button>
          ) : null}
        </form>
      )}

      {panel === "off" && (
        <form
          className="bd-card bd-form"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({
              type: "timeOff",
              tech: techId,
              dates: label,
              from: date,
              to: date,
              reason: offReason.trim() || "Personal",
            });
            dispatch({
              type: "toast",
              text: `Day-off request for ${label} sent to the owner.`,
            });
            setPanel(null);
          }}
        >
          {bookings.length ? (
            <p className="bd-policy">
              <Icon name="heart" size={18} />
              <span>
                {bookings.length}{" "}
                {bookings.length === 1 ? "client is" : "clients are"} booked
                that day. If the owner approves, the front desk moves them to
                another tech or time.
              </span>
            </p>
          ) : null}
          <label className="bd-field">
            <span>Reason (optional)</span>
            <input
              value={offReason}
              onChange={(e) => setOffReason(e.target.value)}
              placeholder="Doctor’s appointment"
            />
          </label>
          <button type="submit" className="bd-btn bd-btn-block">
            Request {label} off
          </button>
        </form>
      )}
    </div>
  );
}

// ---------- The schedule tab ----------
export default function TechSchedule({ techId, TodayDetail }) {
  const { state, dispatch } = useDemo();
  const [view, setView] = useState("week");
  const [sel, setSel] = useState(TODAY);
  const [weekStart, setWeekStart] = useState(mondayOf(TODAY));
  const [month, setMonth] = useState(TODAY.slice(0, 8) + "01");
  const [open, setOpen] = useState(null);
  const [editKey, setEditKey] = useState(0);
  const [hours, setHours] = useState(state.hours[techId]);
  const [editing, setEditing] = useState(false);
  const [walkins, setWalkins] = useState(true);

  const pick = (iso) => {
    setSel(iso);
    setEditKey((k) => k + 1);
  };
  const counts = (iso) => {
    if (iso < TODAY) return { n: 0, past: true };
    const h = dayHours(state, techId, iso);
    const off = timeOffOn(state, techId, iso);
    const items = h.on ? agenda(state, techId, iso) : [];
    return {
      n: items.filter((x) => x.src !== "break" && x.src !== "block").length,
      blocks: items.some((x) => x.src === "block" || x.src === "break"),
      working: h.on,
      off,
    };
  };

  const items = agenda(state, techId, sel);
  const h = dayHours(state, techId, sel);
  const off = timeOffOn(state, techId, sel);
  const clients = items.filter((x) => x.src !== "break" && x.src !== "block");
  const breaks = items.length - clients.length;
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const gridStart = mondayOf(month);
  const grid = Array.from({ length: 42 }, (_, i) =>
    addDays(gridStart, i),
  ).filter((d, i) => i < 35 || monthOf(d) === monthOf(month));
  const removeBlock = (x) =>
    x.src === "block"
      ? dispatch({ type: "dayUnblock", id: x.id })
      : dispatch({ type: "unblock", id: x.id });
  const setDay = (i, patch) =>
    setHours(hours.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  const cell = (iso, compact) => {
    const c = counts(iso);
    const cls = [
      iso === sel ? "is-sel" : "",
      iso === TODAY ? "is-today" : "",
      c.past ? "is-past" : "",
      !c.past && !c.working ? "is-off" : "",
      c.off ? (c.off.status === "approved" ? "is-timeoff" : "is-pending") : "",
      compact && monthOf(iso) !== monthOf(month) ? "is-other" : "",
    ].join(" ");
    const desc = c.past
      ? "past"
      : c.off
        ? c.off.status === "approved"
          ? "time off"
          : "time off requested"
        : !c.working
          ? "day off"
          : `${c.n} ${c.n === 1 ? "client" : "clients"}`;
    return (
      <button
        key={iso}
        type="button"
        className={`bd-cal-day ${cls}`}
        disabled={c.past || iso > LAST_DAY}
        aria-pressed={iso === sel}
        onClick={() => pick(iso)}
      >
        {!compact ? (
          <span className="bd-cal-wd">{WD[weekday(iso)]} </span>
        ) : null}
        <strong>{dayNum(iso)}</strong>
        <span className="bd-sr">
          {" "}
          {compact ? `${WD_LONG[weekday(iso)]}, ` : ""}
          {MONTHS_LONG[monthOf(iso)]} {dayNum(iso)}, {desc}
        </span>
        <span className="bd-cal-dots" aria-hidden="true">
          {c.off ? (
            <i className="is-off" />
          ) : (
            Array.from({ length: Math.min(c.n, compact ? 3 : 4) }, (_, i) => (
              <i key={i} />
            ))
          )}
          {c.blocks && !c.off ? <i className="is-block" /> : null}
        </span>
      </button>
    );
  };

  return (
    <div className="bd-c-pad">
      <div className="bd-c-hello">
        <h3 className="bd-serif bd-c-h">My schedule</h3>
        <div
          className="bd-seg bd-seg-sm"
          role="group"
          aria-label="Calendar view"
        >
          <button
            type="button"
            aria-pressed={view === "week"}
            onClick={() => {
              setView("week");
              setWeekStart(mondayOf(sel));
            }}
          >
            Week
          </button>
          <button
            type="button"
            aria-pressed={view === "month"}
            onClick={() => {
              setView("month");
              setMonth(sel.slice(0, 8) + "01");
            }}
          >
            Month
          </button>
        </div>
      </div>

      <div className="bd-card bd-calbox">
        <div className="bd-cal-nav">
          <button
            type="button"
            className="bd-icon-btn"
            aria-label={view === "week" ? "Previous week" : "Previous month"}
            disabled={
              view === "week"
                ? weekStart <= mondayOf(TODAY)
                : month <= TODAY.slice(0, 8) + "01"
            }
            onClick={() =>
              view === "week"
                ? setWeekStart(addDays(weekStart, -7))
                : setMonth(shiftMonth(month, -1))
            }
          >
            <Icon name="back" size={16} />
          </button>
          <strong aria-live="polite">
            {view === "week"
              ? `${MONTHS[monthOf(days[0])]} ${dayNum(days[0])} – ${monthOf(days[6]) !== monthOf(days[0]) ? `${MONTHS[monthOf(days[6])]} ` : ""}${dayNum(days[6])}`
              : `${MONTHS_LONG[monthOf(month)]} ${month.slice(0, 4)}`}
          </strong>
          <button
            type="button"
            className="bd-icon-btn"
            aria-label={view === "week" ? "Next week" : "Next month"}
            disabled={
              view === "week"
                ? addDays(weekStart, 7) > LAST_DAY
                : month >= LAST_DAY.slice(0, 8) + "01"
            }
            onClick={() =>
              view === "week"
                ? setWeekStart(addDays(weekStart, 7))
                : setMonth(shiftMonth(month, 1))
            }
          >
            <Icon name="arrow" size={16} />
          </button>
        </div>
        {view === "week" ? (
          <div className="bd-cal-week">{days.map((d) => cell(d, false))}</div>
        ) : (
          <>
            <div className="bd-cal-month-head" aria-hidden="true">
              {WD.map((w) => (
                <span key={w}>{w.charAt(0)}</span>
              ))}
            </div>
            <div className="bd-cal-month">{grid.map((d) => cell(d, true))}</div>
          </>
        )}
        <p className="bd-cal-legend">
          <span>
            <i /> Client
          </span>
          <span>
            <i className="is-block" /> Break or blocked
          </span>
          <span>
            <i className="is-off" /> Time off
          </span>
        </p>
      </div>

      <div className="bd-day-head">
        <div>
          <p className="bd-eyebrow">
            {sel === TODAY ? "Today" : WD_LONG[weekday(sel)]}
          </p>
          <h4 className="bd-serif">
            {MONTHS_LONG[monthOf(sel)]} {dayNum(sel)}
          </h4>
        </div>
        {off ? (
          <span
            className={`bd-status bd-tone-${off.status === "approved" ? "mint" : "peach"}`}
          >
            {off.status === "approved" ? "Time off" : "Day off requested"}
          </span>
        ) : h.on ? (
          <span className="bd-status bd-tone-blush">
            {short(h.start)} – {h.end}
            {state.dayHours?.[techId]?.[sel] ? " · changed" : ""}
          </span>
        ) : (
          <span className="bd-status bd-tone-plain">Day off</span>
        )}
      </div>
      <p className="bd-hint">
        {h.on
          ? clients.length
            ? `${clients.length} ${clients.length === 1 ? "client" : "clients"}${breaks ? ` · ${breaks} ${breaks === 1 ? "break or block" : "breaks or blocks"}` : ""} · first at ${clock(clients[0].start)}`
            : "No clients booked yet. Open times show on the booking page."
          : `You don’t usually work ${WD_LONG[weekday(sel)]}s.`}
      </p>

      {h.on && items.length ? (
        <ol className="bd-timeline bd-agenda">
          {items.map((d) =>
            d.src === "break" || d.src === "block" ? (
              <li key={d.id} className="is-break">
                <span className="bd-tl-time">{clock(d.start)}</span>
                <span className="bd-tl-card bd-tl-break">
                  <span>
                    <strong>{d.label || "Break"}</strong>
                    <span className="bd-hint">
                      until {clock(d.start + d.mins)}
                    </span>
                  </span>
                  {sel > TODAY || d.start + d.mins > NOW ? (
                    <button
                      type="button"
                      className="bd-btn bd-btn-xs bd-btn-ghost"
                      onClick={() => removeBlock(d)}
                      aria-label={`Remove ${d.label || "break"} at ${clock(d.start)}`}
                    >
                      Remove
                    </button>
                  ) : null}
                </span>
              </li>
            ) : (
              <li key={d.id} className={`is-${d.status || "booked"}`}>
                <span className="bd-tl-time">
                  {d.src === "walkin" ? "Walk-in" : clock(d.start)}
                </span>
                <button
                  type="button"
                  className="bd-tl-card"
                  onClick={() => setOpen(d)}
                >
                  <span className="bd-tl-row">
                    <strong>{d.client}</strong>
                    {d.src === "future" ? (
                      d.deposit ? (
                        <span className="bd-status bd-tone-mint">
                          {money(d.deposit)} deposit
                        </span>
                      ) : (
                        <span className="bd-status bd-tone-plain">Booked</span>
                      )
                    ) : (
                      <Status status={d.status} />
                    )}
                  </span>
                  <span className="bd-sub">{svcNames(d.services)}</span>
                  {d.src === "future" ? (
                    <span className="bd-hint">
                      Booked {d.bookedOn} · {d.via}
                      {d.group ? ` · ${d.group}` : ""}
                    </span>
                  ) : null}
                </button>
              </li>
            ),
          )}
        </ol>
      ) : null}

      {!off ? (
        <DayEditor
          key={`${sel}-${editKey}-${h.on}`}
          techId={techId}
          date={sel}
          items={items}
          hours={h}
        />
      ) : null}

      <div className="bd-row-between bd-c-label">
        <span>Usual weekly hours</span>
        {!editing ? (
          <button
            type="button"
            className="bd-link"
            onClick={() => setEditing(true)}
          >
            Edit hours
          </button>
        ) : null}
      </div>
      <div className="bd-card bd-week">
        {hours.map((d, i) =>
          editing ? (
            <div key={d.day} className="bd-week-edit">
              <span>{d.day}</span>
              <button
                type="button"
                role="switch"
                aria-checked={d.on}
                aria-label={`Working on ${d.day}`}
                className="bd-switch"
                onClick={() => setDay(i, { on: !d.on })}
              >
                <span />
              </button>
              {d.on ? (
                <span className="bd-week-times">
                  <label className="bd-sr" htmlFor={`s-${techId}-${d.day}`}>
                    {d.day} start
                  </label>
                  <select
                    id={`s-${techId}-${d.day}`}
                    className="bd-select-sm"
                    value={d.start}
                    onChange={(e) => setDay(i, { start: e.target.value })}
                  >
                    {HOUR_TIMES.slice(0, 9).map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <label className="bd-sr" htmlFor={`e-${techId}-${d.day}`}>
                    {d.day} end
                  </label>
                  <select
                    id={`e-${techId}-${d.day}`}
                    className="bd-select-sm"
                    value={d.end}
                    onChange={(e) => setDay(i, { end: e.target.value })}
                  >
                    {HOUR_TIMES.slice(8).map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </span>
              ) : (
                <span className="bd-hint">Off</span>
              )}
            </div>
          ) : (
            <div key={d.day} className={d.on ? "" : "is-off"}>
              <span>{d.day}</span>
              <span>{d.on ? `${short(d.start)} – ${d.end}` : "Off"}</span>
            </div>
          ),
        )}
        {editing ? (
          <div className="bd-row-btns">
            <button
              type="button"
              className="bd-btn bd-btn-sm bd-btn-soft"
              onClick={() => {
                setHours(state.hours[techId]);
                setEditing(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bd-btn bd-btn-sm"
              onClick={() => {
                dispatch({ type: "hours", tech: techId, hours });
                setEditing(false);
              }}
            >
              Save hours
            </button>
          </div>
        ) : null}
      </div>
      <p className="bd-hint">
        Bookings already made stay put. New hours apply to open times.
      </p>
      <div className="bd-card">
        <Toggle
          on={walkins}
          onChange={() => setWalkins(!walkins)}
          label="Take walk-ins"
          hint="Keeps you in the rotation"
        />
      </div>

      <p className="bd-c-label">Time off</p>
      {state.timeOff.filter((x) => x.tech === techId).length ? (
        state.timeOff
          .filter((x) => x.tech === techId)
          .map((r) => (
            <div key={r.id} className="bd-card bd-past">
              <span>
                <strong>{r.dates}</strong>
                <span className="bd-sub">{r.reason}</span>
              </span>
              <span
                className={`bd-status bd-tone-${r.status === "approved" ? "mint" : r.status === "declined" ? "plain" : "peach"}`}
              >
                {r.status === "pending"
                  ? "Pending"
                  : r.status === "approved"
                    ? "Approved"
                    : "Declined"}
              </span>
            </div>
          ))
      ) : (
        <p className="bd-hint">
          No requests yet. Pick a day above and tap “Request day off”.
        </p>
      )}

      {open ? (
        open.src === "future" ? (
          <FutureSheet
            item={open}
            techId={techId}
            date={sel}
            onClose={() => setOpen(null)}
          />
        ) : (
          <TodayDetail
            item={open}
            techId={techId}
            onClose={() => setOpen(null)}
          />
        )
      ) : null}
    </div>
  );
}
