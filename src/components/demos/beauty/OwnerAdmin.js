"use client";

import { useState } from "react";
import {
  NOW,
  POPULAR,
  RECEIPTS,
  SALON,
  TECHS,
  TECH_REVENUE,
  WEEK,
  clock,
  svcMins,
  svcNames,
  svcPrice,
  tech,
} from "./data";
import { useDemo, waitFor } from "./store";
import {
  Avatar,
  BrowserFrame,
  Icon,
  NailArt,
  Status,
  Swatch,
  Toggle,
  money,
} from "./ui";

const NAV = [
  ["dash", "home", "Dashboard"],
  ["cal", "calendar", "Calendar"],
  ["walk", "list", "Walk-ins"],
  ["svc", "sparkle", "Services"],
  ["team", "users", "Team"],
  ["clients", "heart", "Clients"],
  ["pay", "card", "Payments"],
  ["reports", "chart", "Reports"],
  ["stock", "box", "Inventory"],
  ["mkt", "gift", "Marketing"],
  ["settings", "gear", "Settings"],
  ["req", "bulb", "Requests"],
];

function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`bd-panel ${className}`}>
      {title ? (
        <div className="bd-panel-head">
          <h4>{title}</h4>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function Head({ title, sub, children }) {
  return (
    <div className="bd-a-head">
      <div>
        <h3 className="bd-serif">{title}</h3>
        {sub ? <p className="bd-sub">{sub}</p> : null}
      </div>
      {children ? <div className="bd-a-head-actions">{children}</div> : null}
    </div>
  );
}

function techNow(state, id) {
  if (!state.clockedIn[id]) return ["Clocked out", "plain", null];
  if (state.onBreak[id]) return ["On break", "peach", null];
  const q = state.queue.find(
    (x) => x.tech === id && ["assigned", "service"].includes(x.status),
  );
  if (q)
    return [
      q.status === "assigned" ? "Walk-in assigned" : "With walk-in",
      "lilac",
      q.name,
    ];
  const a = state.appts.find((x) => x.tech === id && x.status === "service");
  if (a) return ["With client", "rose", a.client];
  return ["Available", "mint", null];
}

const ALERT_ICON = {
  timeoff: "calendar",
  stock: "box",
  walkin: "sparkle",
  help: "bell",
  delay: "clock",
  design: "camera",
  booking: "calendar",
  cancel: "calendar",
  review: "star",
  private: "chat",
  arrived: "door",
  price: "tag",
  waitlist: "list",
  block: "clock",
  hours: "calendar",
};
const ALERT_GO = {
  timeoff: "team",
  stock: "stock",
  walkin: "walk",
  design: "clients",
  booking: "cal",
  cancel: "cal",
  waitlist: "cal",
  price: "pay",
  block: "cal",
  hours: "team",
};

function Dashboard({ go }) {
  const { state, dispatch } = useDemo();
  const appts = state.appts.filter((a) => a.kind !== "break");
  const sales =
    appts
      .filter((a) => a.status === "done")
      .reduce((t, a) => t + (a.paid || 0), 0) + 0;
  const waiting = state.queue.filter((q) => q.status === "waiting");
  const upcoming = appts
    .filter((a) => a.status === "booked")
    .sort((a, b) => a.start - b.start)
    .slice(0, 4);
  return (
    <>
      <Head
        title={
          <>
            Good afternoon{" "}
            <span className="bd-flower" aria-hidden="true">
              ✿
            </span>
          </>
        }
        sub="Monday, November 16 · 2:10 PM"
      >
        <button
          type="button"
          className="bd-btn bd-btn-sm"
          onClick={() => go("walk")}
        >
          <Icon name="list" size={16} /> Open queue
        </button>
      </Head>
      <div className="bd-kpis">
        <div className="bd-kpi">
          <span>Sales so far</span>
          <strong className="bd-serif">{money(sales)}</strong>
          <span className="bd-hint">
            plus{" "}
            {money(
              appts.filter((a) => a.deposit).reduce((t, a) => t + a.deposit, 0),
            )}{" "}
            in deposits
          </span>
        </div>
        <div className="bd-kpi">
          <span>Appointments</span>
          <strong className="bd-serif">{appts.length}</strong>
          <span className="bd-hint">
            {appts.filter((a) => a.status === "done").length} completed
          </span>
        </div>
        <div className="bd-kpi">
          <span>Walk-ins</span>
          <strong className="bd-serif">{state.queue.length + 2}</strong>
          <span className="bd-hint">{waiting.length} waiting now</span>
        </div>
        <div className="bd-kpi">
          <span>Open capacity</span>
          <strong className="bd-serif">5.5 hrs</strong>
          <span className="bd-hint">6 bookable slots left</span>
        </div>
      </div>
      <div className="bd-a-grid">
        <Panel title="Needs your attention" className="bd-span2">
          {state.alerts.length ? (
            <ul className="bd-alerts">
              {state.alerts.slice(0, 6).map((al) => (
                <li key={al.id} className={`is-${al.kind}`}>
                  <span className="bd-alert-icon" aria-hidden="true">
                    <Icon name={ALERT_ICON[al.kind] || "bell"} size={16} />
                  </span>
                  <span>{al.text}</span>
                  <span className="bd-alert-btns">
                    {ALERT_GO[al.kind] ? (
                      <button
                        type="button"
                        className="bd-btn bd-btn-xs bd-btn-soft"
                        onClick={() => go(ALERT_GO[al.kind])}
                      >
                        Review
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="bd-btn bd-btn-xs bd-btn-ghost"
                      onClick={() => dispatch({ type: "dismiss", id: al.id })}
                    >
                      {al.kind === "help" ? "On my way" : "Dismiss"}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="bd-sub">All caught up. ✨</p>
          )}
        </Panel>
        <Panel title="Team right now">
          <ul className="bd-team-now">
            {TECHS.map((t) => {
              const [label, tone, who] = techNow(state, t.id);
              return (
                <li key={t.id}>
                  <Avatar id={t.id} size={34} />
                  <span>
                    <strong>{t.name}</strong>
                    <span className="bd-hint">
                      {who ? `${who} · ${t.station}` : t.station}
                    </span>
                  </span>
                  <span className={`bd-status bd-tone-${tone}`}>{label}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel
          title={`Walk-in queue · ${waiting.length} waiting`}
          action={
            <button
              type="button"
              className="bd-btn bd-btn-xs"
              onClick={() => dispatch({ type: "assignNext" })}
              disabled={!waiting.length}
            >
              Assign next
            </button>
          }
        >
          <ul className="bd-mini-queue">
            {state.queue
              .filter((q) => q.status !== "done")
              .map((q) => (
                <li key={q.id} className={q.isNew ? "is-new" : ""}>
                  <span>
                    <strong>{q.name}</strong>
                    <span className="bd-hint">
                      {svcNames(q.services)}
                      {q.status === "waiting"
                        ? ` · ~${waitFor(state, q.id)} min`
                        : q.tech
                          ? ` · ${tech(q.tech).name}`
                          : ""}
                    </span>
                  </span>
                  <Status status={q.status} />
                </li>
              ))}
          </ul>
        </Panel>
        <Panel
          title="Coming up"
          className="bd-span2"
          action={
            <button type="button" className="bd-link" onClick={() => go("cal")}>
              Calendar →
            </button>
          }
        >
          <ul className="bd-upnext">
            {upcoming.map((a) => (
              <li key={a.id}>
                <span className="bd-upnext-time">{clock(a.start)}</span>
                <span>
                  <strong>{a.client}</strong>
                  <span className="bd-hint">
                    {svcNames(a.services)} · {tech(a.tech).name}
                    {a.group ? ` · ${a.group}` : ""}
                  </span>
                </span>
                {a.deposit ? (
                  <span className="bd-status bd-tone-mint">
                    {money(a.deposit)} deposit
                  </span>
                ) : (
                  <span className="bd-status bd-tone-plain">Group deposit</span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

const PPM = 1.05; // calendar pixels per minute
function Calendar() {
  const { state, dispatch } = useDemo();
  const [sel, setSel] = useState(null);
  const [quote, setQuote] = useState({});
  const blocks = [
    ...state.appts,
    ...state.queue
      .filter((q) => q.tech)
      .map((q) => ({
        ...q,
        client: q.name,
        start: Math.max(q.arrived + 5, NOW),
        walkin: true,
      })),
  ];
  const pending = state.designs.filter((d) => d.status === "pending");
  const s = sel && blocks.find((b) => b.id === sel);
  return (
    <>
      <Head
        title="Calendar"
        sub="Today · 4 technicians · 10 min cleanup between services"
      >
        <div className="bd-seg bd-seg-sm" role="group" aria-label="Day">
          <button type="button" aria-pressed="true">
            Today
          </button>
          <button
            type="button"
            aria-pressed="false"
            onClick={() =>
              dispatch({ type: "toast", text: "Demo shows today only." })
            }
          >
            Tomorrow
          </button>
        </div>
      </Head>
      {pending.length ? (
        <Panel title="Design requests waiting for a quote">
          {pending.map((d) => (
            <div key={d.id} className="bd-dquote">
              {d.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.photo}
                  alt={`${d.client}'s inspiration upload`}
                  className="bd-dreq-photo"
                />
              ) : (
                <NailArt design={d.design} className="bd-dreq-art" />
              )}
              <span>
                <strong>{d.client}</strong>
                <span className="bd-sub">{d.text}</span>
              </span>
              <form
                className="bd-inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  dispatch({
                    type: "estimate",
                    id: d.id,
                    price: Number(quote[d.id] || 25),
                    mins: 30,
                  });
                }}
              >
                <label className="bd-field">
                  <span>Extra for design</span>
                  <input
                    inputMode="numeric"
                    value={quote[d.id] ?? "25"}
                    onChange={(e) =>
                      setQuote({
                        ...quote,
                        [d.id]: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </label>
                <button type="submit" className="bd-btn bd-btn-sm">
                  Send estimate
                </button>
              </form>
            </div>
          ))}
        </Panel>
      ) : null}
      <div className="bd-cal-wrap">
        <div className="bd-cal" style={{ height: 540 * PPM + 40 }}>
          <div className="bd-cal-hours" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} style={{ top: 40 + i * 60 * PPM }}>
                {clock(i * 60).replace(":00", "")}
              </span>
            ))}
          </div>
          {TECHS.map((t) => (
            <div key={t.id} className="bd-cal-col">
              <div className="bd-cal-colhead">
                <Avatar id={t.id} size={24} /> {t.name}
              </div>
              {blocks
                .filter((b) => b.tech === t.id)
                .map((b) => {
                  const mins =
                    b.kind === "break" ? b.mins : svcMins(b.services) + 10;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`bd-cal-block is-${b.kind === "break" ? (b.label && b.label !== "Break" ? "blocked" : "break") : b.status}${mins * PPM < 32 ? " is-short" : ""}${sel === b.id ? " is-sel" : ""}`}
                      style={{
                        top: 40 + b.start * PPM,
                        height: mins * PPM - 3,
                      }}
                      onClick={() => setSel(b.id)}
                    >
                      <strong>
                        {b.kind === "break" ? b.label || "Break" : b.client}
                      </strong>
                      {b.kind !== "break" ? (
                        <span>{svcNames(b.services)}</span>
                      ) : null}
                    </button>
                  );
                })}
              {blocks.some(
                (b) =>
                  b.tech === t.id &&
                  b.start < 530 &&
                  b.start +
                    (b.kind === "break" ? b.mins : svcMins(b.services) + 10) >
                    480,
              ) ? null : (
                <span
                  className="bd-cal-open"
                  style={{ top: 40 + 480 * PPM, height: 50 * PPM }}
                >
                  Open
                </span>
              )}
            </div>
          ))}
          <span
            className="bd-cal-now"
            style={{ top: 40 + NOW * PPM }}
            aria-hidden="true"
          />
        </div>
        <aside className="bd-cal-side" aria-live="polite">
          {s ? (
            <>
              <p className="bd-eyebrow">
                {s.kind === "break"
                  ? `${clock(s.start)} – ${clock(s.start + s.mins)}`
                  : s.walkin
                    ? "Walk-in"
                    : clock(s.start)}
              </p>
              <h4 className="bd-serif">
                {s.kind === "break"
                  ? `${tech(s.tech).name} · ${s.label || "Break"}`
                  : s.client}
              </h4>
              {s.kind !== "break" ? (
                <>
                  <p className="bd-sub">{svcNames(s.services)}</p>
                  <p className="bd-sub">
                    {tech(s.tech).name} · {svcMins(s.services)} min + 10 min
                    cleanup
                  </p>
                  <p>
                    <Status status={s.status} />
                  </p>
                  <p className="bd-sub">
                    Estimated {money(svcPrice(s.services, s.tech))}
                  </p>
                  {s.group ? <p className="bd-hint">{s.group}</p> : null}
                </>
              ) : (
                <p className="bd-sub">
                  {s.mins} minutes, added from the technician app. Online
                  booking skips it.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="bd-eyebrow">Tip</p>
              <p className="bd-sub">
                Tap any booking to see the details. Walk-ins appear here once
                they’re assigned.
              </p>
              <ul className="bd-legend">
                {["booked", "service", "checkout", "done"].map((k) => (
                  <li key={k}>
                    <span className={`bd-cal-key is-${k}`} aria-hidden="true" />
                    <Status status={k} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </>
  );
}

function WalkIns() {
  const { state, dispatch } = useDemo();
  const RULES = [
    [
      "skills",
      "Match technician skills",
      "Pedicures go to pedicure-trained techs",
    ],
    [
      "prefs",
      "Honour requested technicians",
      "Clients wait for the tech they asked for",
    ],
    ["breaks", "Skip techs on break", ""],
    [
      "value",
      "Count turns by ticket value",
      "A full set counts as more than a polish change",
    ],
  ];
  return (
    <>
      <Head
        title="Walk-ins & rotation"
        sub="Live queue from the check-in tablet and QR code"
      >
        <span className="bd-wait-adjust">
          Wait estimates{" "}
          {state.waitAdjust
            ? `${state.waitAdjust > 0 ? "+" : ""}${state.waitAdjust} min`
            : "as calculated"}
          <button
            type="button"
            className="bd-icon-btn"
            aria-label="Lower wait estimates by 5 minutes"
            onClick={() => dispatch({ type: "waitAdjust", by: -5 })}
          >
            <Icon name="minus" size={16} />
          </button>
          <button
            type="button"
            className="bd-icon-btn"
            aria-label="Raise wait estimates by 5 minutes"
            onClick={() => dispatch({ type: "waitAdjust", by: 5 })}
          >
            <Icon name="plus" size={16} />
          </button>
        </span>
      </Head>
      <Panel
        title="Queue"
        action={
          <button
            type="button"
            className="bd-btn bd-btn-sm"
            onClick={() => dispatch({ type: "assignNext" })}
          >
            <Icon name="sparkle" size={15} /> Assign next by rotation
          </button>
        }
      >
        <div
          className="bd-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <table className="bd-table">
            <thead>
              <tr>
                <th scope="col">Guest</th>
                <th scope="col">Services</th>
                <th scope="col">Asked for</th>
                <th scope="col">Arrived</th>
                <th scope="col">Wait</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="bd-sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {state.queue.map((q) => (
                <tr key={q.id} className={q.isNew ? "is-new" : ""}>
                  <td>
                    <strong>{q.name}</strong>
                    {q.outside ? (
                      <span className="bd-hint"> · stepped out</span>
                    ) : null}
                    {q.texts ? (
                      <span className="bd-hint"> · texts on</span>
                    ) : null}
                  </td>
                  <td>{svcNames(q.services)}</td>
                  <td>{q.pref === "any" ? "Anyone" : tech(q.pref).name}</td>
                  <td>{q.isNew ? "Just now" : clock(q.arrived)}</td>
                  <td>
                    {q.status === "waiting"
                      ? `~${waitFor(state, q.id)} min`
                      : q.tech
                        ? `${tech(q.tech).name} · ${q.station}`
                        : "—"}
                  </td>
                  <td>
                    <label className="bd-sr" htmlFor={`st-${q.id}`}>
                      Status for {q.name}
                    </label>
                    <select
                      id={`st-${q.id}`}
                      className="bd-select-sm"
                      value={q.status}
                      onChange={(e) =>
                        dispatch({
                          type: "queueStatus",
                          id: q.id,
                          status: e.target.value,
                        })
                      }
                    >
                      {[
                        "waiting",
                        "assigned",
                        "service",
                        "checkout",
                        "done",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {
                            {
                              waiting: "Waiting",
                              assigned: "Assigned",
                              service: "In service",
                              checkout: "Ready for checkout",
                              done: "Completed",
                            }[s]
                          }
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="bd-td-actions">
                    {q.status === "waiting" ? (
                      <>
                        <button
                          type="button"
                          className="bd-btn bd-btn-xs"
                          onClick={() =>
                            dispatch({ type: "assignNext", id: q.id })
                          }
                        >
                          Assign
                        </button>
                        <button
                          type="button"
                          className="bd-btn bd-btn-xs bd-btn-soft"
                          onClick={() =>
                            dispatch({
                              type: "toast",
                              text: `Texted ${q.name}: “You’re next at Lumi! Head back in. 💅”`,
                            })
                          }
                        >
                          Text
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="bd-btn bd-btn-xs bd-btn-ghost"
                      onClick={() => dispatch({ type: "leave", id: q.id })}
                    >
                      Left
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Rotation order">
          <ol className="bd-rotation">
            {state.rotation.map((id, i) => (
              <li key={id}>
                <span className="bd-rot-num">{i + 1}</span>
                <Avatar id={id} size={30} />
                <span>
                  <strong>{tech(id).name}</strong>
                  <span className="bd-hint">{techNow(state, id)[0]}</span>
                </span>
                <span className="bd-rot-btns">
                  <button
                    type="button"
                    className="bd-icon-btn"
                    aria-label={`Move ${tech(id).name} up`}
                    disabled={i === 0}
                    onClick={() => dispatch({ type: "rotate", id, by: -1 })}
                  >
                    <Icon name="back" size={14} className="bd-rot90" />
                  </button>
                  <button
                    type="button"
                    className="bd-icon-btn"
                    aria-label={`Move ${tech(id).name} down`}
                    disabled={i === state.rotation.length - 1}
                    onClick={() => dispatch({ type: "rotate", id, by: 1 })}
                  >
                    <Icon name="arrow" size={14} className="bd-rot90" />
                  </button>
                </span>
              </li>
            ))}
          </ol>
          <p className="bd-hint">
            Whoever takes a walk-in moves to the back of the line.
          </p>
        </Panel>
        <Panel title="Rotation rules">
          {RULES.map(([k, label, hint]) => (
            <Toggle
              key={k}
              on={state.rules[k]}
              onChange={() => dispatch({ type: "rule", key: k })}
              label={label}
              hint={hint}
            />
          ))}
        </Panel>
      </div>
    </>
  );
}

function Services() {
  const { state, dispatch } = useDemo();
  const [form, setForm] = useState({ name: "", price: "", mins: "30" });
  const setSvc = (id, patch) =>
    dispatch({
      type: "set",
      key: "services",
      value: (l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  return (
    <>
      <Head
        title="Services & pricing"
        sub="What clients see on your booking page and the kiosk"
      />
      <Panel title="Menu">
        <div
          className="bd-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <table className="bd-table">
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">Duration</th>
                <th scope="col">Price</th>
                <th scope="col">Mia (senior)</th>
                <th scope="col">Cleanup</th>
                <th scope="col">
                  <span className="bd-sr">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {state.services.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    <span className="bd-hint"> · {s.cat}</span>
                  </td>
                  <td>
                    <label className="bd-sr" htmlFor={`m-${s.id}`}>
                      Minutes for {s.name}
                    </label>
                    <select
                      id={`m-${s.id}`}
                      className="bd-select-sm"
                      value={s.mins}
                      onChange={(e) =>
                        setSvc(s.id, { mins: Number(e.target.value) })
                      }
                    >
                      {[15, 20, 30, 40, 45, 60, 75, 90].map((m) => (
                        <option key={m} value={m}>
                          {m} min
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label className="bd-money">
                      <span className="bd-sr">Price for {s.name}</span>$
                      <input
                        inputMode="numeric"
                        value={s.price}
                        onChange={(e) =>
                          setSvc(s.id, {
                            price:
                              Number(e.target.value.replace(/\D/g, "")) || 0,
                          })
                        }
                      />
                    </label>
                  </td>
                  <td>{s.senior ? money(s.price + s.senior) : "Same"}</td>
                  <td>10 min</td>
                  <td>
                    <button
                      type="button"
                      className="bd-btn bd-btn-xs bd-btn-ghost"
                      onClick={() =>
                        dispatch({
                          type: "set",
                          key: "services",
                          value: (l) => l.filter((x) => x.id !== s.id),
                        })
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Add a service">
          <form
            className="bd-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name.trim()) return;
              dispatch({
                type: "set",
                key: "services",
                value: (l) => [
                  ...l,
                  {
                    id: `n${l.length}`,
                    name: form.name.trim(),
                    cat: "Extras",
                    mins: Number(form.mins),
                    price: Number(form.price) || 0,
                  },
                ],
              });
              dispatch({
                type: "toast",
                text: `${form.name.trim()} is live on your booking page.`,
              });
              setForm({ name: "", price: "", mins: "30" });
            }}
          >
            <label className="bd-field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Hot stone add-on"
              />
            </label>
            <div className="bd-form-2">
              <label className="bd-field">
                <span>Price</span>
                <input
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="15"
                />
              </label>
              <label className="bd-field">
                <span>Minutes</span>
                <select
                  value={form.mins}
                  onChange={(e) => setForm({ ...form, mins: e.target.value })}
                >
                  {[15, 20, 30, 45, 60].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="bd-btn bd-btn-sm">
              Add service
            </button>
          </form>
        </Panel>
        <Panel title="Packages">
          <ul className="bd-plain-list">
            <li>
              <strong>Bridal party</strong>
              <span className="bd-hint">
                Gel manicure for the bride + up to 6 guests · $30 group deposit
              </span>
            </li>
            <li>
              <strong>Mani + pedi date</strong>
              <span className="bd-hint">
                Gel manicure + deluxe pedicure · $85 (save $10)
              </span>
            </li>
            <li>
              <strong>Birthday glam</strong>
              <span className="bd-hint">
                Any full set + nail art + a little sparkle 🎂
              </span>
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}

function hoursSummary(hours) {
  const on = hours.filter((h) => h.on);
  if (!on.length) return "Not scheduled this week";
  return `${on.map((h) => h.day).join(", ")} · from ${on[0].start}`;
}

function Team({ go }) {
  const { state, dispatch } = useDemo();
  const [invite, setInvite] = useState("");
  const PERMS = [
    ["price", "Change prices"],
    ["phones", "See client phone numbers"],
    ["payments", "Take payments"],
  ];
  return (
    <>
      <Head title="Team" sub="Accounts, permissions, schedules and time off">
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-soft"
          onClick={() => go("walk")}
        >
          Rotation rules
        </button>
      </Head>
      <Panel title="Time-off requests">
        <ul className="bd-plain-list">
          {state.timeOff.map((r) => (
            <li key={r.id} className="bd-row-between">
              <span className="bd-row-gap">
                <Avatar id={r.tech} size={30} />
                <span>
                  <strong>
                    {tech(r.tech).name} · {r.dates}
                  </strong>
                  <span className="bd-hint">{r.reason}</span>
                </span>
              </span>
              {r.status === "pending" ? (
                <span className="bd-row-gap">
                  <button
                    type="button"
                    className="bd-btn bd-btn-xs"
                    onClick={() =>
                      dispatch({ type: "decide", id: r.id, status: "approved" })
                    }
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="bd-btn bd-btn-xs bd-btn-ghost"
                    onClick={() =>
                      dispatch({ type: "decide", id: r.id, status: "declined" })
                    }
                  >
                    Decline
                  </button>
                </span>
              ) : (
                <span
                  className={`bd-status bd-tone-${r.status === "approved" ? "mint" : "plain"}`}
                >
                  {r.status === "approved" ? "Approved" : "Declined"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Panel>
      <div className="bd-staff">
        {TECHS.map((t) => (
          <Panel key={t.id} className="bd-staff-card">
            <div className="bd-row-gap">
              <Avatar id={t.id} size={44} />
              <span>
                <strong>{t.name}</strong>
                <span className="bd-hint">
                  {t.role} · {t.station}
                </span>
              </span>
            </div>
            <p className="bd-sub">
              {t.commission}% commission · {t.skills.join(", ")}
            </p>
            <p className="bd-hint">{hoursSummary(state.hours[t.id])}</p>
            {PERMS.map(([k, label]) => (
              <Toggle
                key={k}
                on={state.perms[t.id][k]}
                onChange={() => dispatch({ type: "perm", tech: t.id, key: k })}
                label={label}
              />
            ))}
          </Panel>
        ))}
      </div>
      <Panel title="Add a team member">
        <form
          className="bd-inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!invite.trim()) return;
            dispatch({
              type: "toast",
              text: `Invite sent to ${invite.trim()}. They’ll set up their own login.`,
            });
            setInvite("");
          }}
        >
          <label className="bd-field">
            <span>Email or mobile</span>
            <input
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              placeholder="newtech@example.com"
            />
          </label>
          <button type="submit" className="bd-btn bd-btn-sm">
            Send invite
          </button>
        </form>
      </Panel>
    </>
  );
}

function Clients() {
  const { state, dispatch } = useDemo();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState("c1");
  const list = state.clients.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()),
  );
  const c = state.clients.find((x) => x.id === sel);
  const pending = state.designs.filter((d) => d.status === "pending");
  return (
    <>
      <Head title="Clients" sub={`${state.clients.length} sample profiles`}>
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-soft"
          onClick={() => exportCsv("clients", state)}
        >
          <Icon name="download" size={15} /> Export list
        </button>
      </Head>
      {pending.length ? (
        <p className="bd-banner">
          <Icon name="camera" size={16} /> {pending.length} design{" "}
          {pending.length === 1 ? "request needs" : "requests need"} a quote.
          You’ll find them on the Calendar.
        </p>
      ) : null}
      <div className="bd-clients">
        <Panel>
          <label className="bd-field">
            <span className="bd-sr">Search clients</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clients"
            />
          </label>
          <ul className="bd-client-list">
            {list.map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  aria-pressed={sel === x.id}
                  onClick={() => setSel(x.id)}
                >
                  <Avatar name={x.name} size={32} />
                  <span>
                    <strong>
                      {x.name}{" "}
                      {x.vip ? <span className="bd-vip">VIP</span> : null}
                    </strong>
                    <span className="bd-hint">Last visit {x.last}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        {c ? (
          <Panel className="bd-profile">
            <div className="bd-row-between">
              <span className="bd-row-gap">
                <Avatar name={c.name} size={48} />
                <span>
                  <h4 className="bd-serif">{c.name}</h4>
                  <span className="bd-hint">
                    {c.phone} · prefers {c.contact.toLowerCase()}
                  </span>
                </span>
              </span>
              <Toggle
                on={!!c.vip}
                onChange={() =>
                  dispatch({
                    type: "set",
                    key: "clients",
                    value: (l) =>
                      l.map((x) => (x.id === c.id ? { ...x, vip: !x.vip } : x)),
                  })
                }
                label="VIP"
              />
            </div>
            <div className="bd-kpis bd-kpis-4">
              <div className="bd-kpi">
                <span>Visits</span>
                <strong className="bd-serif">{c.visits}</strong>
              </div>
              <div className="bd-kpi">
                <span>Lifetime spend</span>
                <strong className="bd-serif">{money(c.spend)}</strong>
              </div>
              <div className="bd-kpi">
                <span>Cancellations</span>
                <strong className="bd-serif">{c.cancels}</strong>
              </div>
              <div className="bd-kpi">
                <span>No-shows</span>
                <strong className="bd-serif">{c.noShows}</strong>
              </div>
            </div>
            <dl className="bd-dl bd-dl-tight">
              <div>
                <dt>Next visit</dt>
                <dd>{c.next}</dd>
              </div>
              <div>
                <dt>Shape</dt>
                <dd>{c.shape}</dd>
              </div>
              <div>
                <dt>Colours</dt>
                <dd className="bd-row-gap">
                  {c.colors.map((k) => (
                    <Swatch key={k} id={k} size={18} />
                  ))}
                </dd>
              </div>
              <div>
                <dt>Notes</dt>
                <dd>{c.notes || "—"}</dd>
              </div>
            </dl>
            <p className="bd-mini">Recent activity</p>
            <ul className="bd-plain-list">
              <li>
                <strong>{c.last}</strong>
                <span className="bd-hint">Visit completed · paid in full</span>
              </li>
              <li>
                <strong>Oct 2</strong>
                <span className="bd-hint">
                  {c.cancels
                    ? "Cancelled with 2 days’ notice · deposit refunded"
                    : "Booked online · deposit paid"}
                </span>
              </li>
            </ul>
          </Panel>
        ) : null}
      </div>
    </>
  );
}

function Payments() {
  const { state, dispatch } = useDemo();
  const [tip, setTip] = useState({});
  const [receipt, setReceipt] = useState(null);
  const ready = [
    ...state.appts
      .filter((a) => a.status === "checkout")
      .map((a) => ({ ...a, src: "appt" })),
    ...state.queue
      .filter((q) => q.status === "checkout")
      .map((q) => ({ ...q, client: q.name, src: "walkin" })),
  ];
  const charge = (r) => {
    const base = r.override ?? svcPrice(r.services, r.tech);
    const t = Math.round(base * (tip[r.id] ?? 0.2));
    if (r.src === "appt")
      dispatch({
        type: "appt",
        id: r.id,
        patch: { status: "done", paid: base + t },
      });
    else dispatch({ type: "queueStatus", id: r.id, status: "done" });
    dispatch({
      type: "toast",
      text: `Charged ${money(base + t)} including a ${money(t)} tip for ${tech(r.tech).name}. Receipt texted.`,
    });
  };
  return (
    <>
      <Head
        title="Payments"
        sub="Through your connected payment provider · demo, no money moves"
      />
      <div className="bd-kpis">
        <div className="bd-kpi">
          <span>Deposits held</span>
          <strong className="bd-serif">{money(90)}</strong>
          <span className="bd-hint">4 upcoming bookings</span>
        </div>
        <div className="bd-kpi">
          <span>Tips today</span>
          <strong className="bd-serif">{money(37)}</strong>
          <span className="bd-hint">split by technician</span>
        </div>
        <div className="bd-kpi">
          <span>Outstanding</span>
          <strong className="bd-serif">{money(42)}</strong>
          <span className="bd-hint">2 open balances</span>
        </div>
        <div className="bd-kpi">
          <span>Gift card sales</span>
          <strong className="bd-serif">{money(150)}</strong>
          <span className="bd-hint">this week</span>
        </div>
      </div>
      <Panel title="Ready for checkout">
        {ready.length ? (
          ready.map((r) => {
            const base = r.override ?? svcPrice(r.services, r.tech);
            return (
              <div key={r.id} className="bd-checkout">
                <span>
                  <strong>{r.client}</strong>
                  <span className="bd-hint">
                    {svcNames(r.services)} · {tech(r.tech).name} · {money(base)}
                  </span>
                </span>
                <span
                  className="bd-seg bd-seg-sm"
                  role="group"
                  aria-label={`Tip for ${r.client}`}
                >
                  {[0.18, 0.2, 0.25].map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={(tip[r.id] ?? 0.2) === p}
                      onClick={() => setTip({ ...tip, [r.id]: p })}
                    >
                      {Math.round(p * 100)}%
                    </button>
                  ))}
                </span>
                <button
                  type="button"
                  className="bd-btn bd-btn-sm"
                  onClick={() => charge(r)}
                >
                  Charge {money(base + Math.round(base * (tip[r.id] ?? 0.2)))}
                </button>
              </div>
            );
          })
        ) : (
          <p className="bd-sub">
            Nobody’s at the desk yet. In the technician app, finish a service to
            send it here.
          </p>
        )}
      </Panel>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Open balances">
          <ul className="bd-plain-list">
            {[
              ["Brianna T.", 12, "Nail art added after checkout · Nov 2"],
              ["Hannah K.", 30, "Bridal party group deposit due"],
            ].map(([n, amt, why]) => (
              <li key={n} className="bd-row-between">
                <span>
                  <strong>
                    {n} · {money(amt)}
                  </strong>
                  <span className="bd-hint">{why}</span>
                </span>
                <button
                  type="button"
                  className="bd-btn bd-btn-xs bd-btn-soft"
                  onClick={() =>
                    dispatch({
                      type: "toast",
                      text: `Payment link texted to ${n}.`,
                    })
                  }
                >
                  Send pay link
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent receipts">
          <ul className="bd-plain-list">
            {RECEIPTS.map((r) => (
              <li key={r.id} className="bd-row-between">
                <span>
                  <strong>{r.client}</strong>
                  <span className="bd-hint">
                    {money(r.items.reduce((t, [, p]) => t + p, 0) + r.tip)} ·{" "}
                    {r.method}
                  </span>
                </span>
                <button
                  type="button"
                  className="bd-btn bd-btn-xs bd-btn-ghost"
                  onClick={() => setReceipt(r)}
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      {receipt ? (
        <div className="bd-modal-wrap">
          <div
            className="bd-receipt"
            role="dialog"
            aria-modal="true"
            aria-label={`Receipt for ${receipt.client}`}
          >
            <p className="bd-serif bd-receipt-brand">{SALON.name}</p>
            <p className="bd-hint">Nov 16 · {receipt.method}</p>
            {receipt.items.map(([n, p]) => (
              <p key={n} className="bd-row-between">
                <span>{n}</span>
                <span>{money(p)}</span>
              </p>
            ))}
            <p className="bd-row-between">
              <span>Tip</span>
              <span>{money(receipt.tip)}</span>
            </p>
            <p className="bd-row-between bd-receipt-total">
              <span>Total</span>
              <span>
                {money(
                  receipt.items.reduce((t, [, p]) => t + p, 0) + receipt.tip,
                )}
              </span>
            </p>
            <p className="bd-hint">
              Thank you, {receipt.client.split(" ")[0]}! 💗
            </p>
            <button
              type="button"
              className="bd-btn bd-btn-sm bd-btn-block"
              onClick={() => setReceipt(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Bars({ data, fmt, label }) {
  const max = Math.max(...data.map((d) => d[1]));
  return (
    <div
      className="bd-bars bd-bars-lg"
      role="img"
      aria-label={`${label}: ${data.map(([k, v]) => `${k} ${fmt(v)}`).join(", ")}`}
    >
      {data.map(([k, v]) => (
        <div key={k} className="bd-bar-col" data-tip={`${k}: ${fmt(v)}`}>
          <span className="bd-bar-val">{fmt(v)}</span>
          <span className="bd-bar" style={{ height: `${(v / max) * 100}%` }} />
          <span className="bd-bar-label">{k}</span>
        </div>
      ))}
    </div>
  );
}

function exportCsv(kind, state) {
  const rows =
    kind === "clients"
      ? [
          [
            "Name",
            "Phone",
            "Visits",
            "Lifetime spend",
            "Last visit",
            "Contact preference",
          ],
          ...state.clients.map((c) => [
            c.name,
            c.phone,
            c.visits,
            c.spend,
            c.last,
            c.contact,
          ]),
        ]
      : kind === "appts"
        ? [
            ["Time", "Client", "Services", "Technician", "Status"],
            ...state.appts
              .filter((a) => a.kind !== "break")
              .map((a) => [
                clock(a.start),
                a.client,
                svcNames(a.services),
                tech(a.tech).name,
                a.status,
              ]),
          ]
        : [
            ["Day", "Sales", "Appointments", "Walk-ins"],
            ...WEEK.map((w) => [w.day, w.sales, w.appts, w.walkins]),
          ];
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `lumi-demo-${kind}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Reports() {
  const { state } = useDemo();
  const total = WEEK.reduce((t, w) => t + w.sales, 0);
  const appts = WEEK.reduce((t, w) => t + w.appts, 0);
  const walk = WEEK.reduce((t, w) => t + w.walkins, 0);
  const maxPop = POPULAR[0][1];
  return (
    <>
      <Head title="Reports" sub="Last 7 days · sample numbers">
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-soft"
          onClick={() => exportCsv("sales", state)}
        >
          <Icon name="download" size={15} /> Sales report
        </button>
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-soft"
          onClick={() => exportCsv("appts", state)}
        >
          <Icon name="download" size={15} /> Appointments
        </button>
      </Head>
      <div className="bd-kpis">
        <div className="bd-kpi">
          <span>Sales</span>
          <strong className="bd-serif">{money(total)}</strong>
        </div>
        <div className="bd-kpi">
          <span>Appointments</span>
          <strong className="bd-serif">{appts}</strong>
        </div>
        <div className="bd-kpi">
          <span>Walk-ins</span>
          <strong className="bd-serif">{walk}</strong>
        </div>
        <div className="bd-kpi">
          <span>Cancellations</span>
          <strong className="bd-serif">6</strong>
          <span className="bd-hint">3.4% · 1 no-show</span>
        </div>
      </div>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Daily sales">
          <Bars
            data={WEEK.map((w) => [w.day, w.sales])}
            fmt={money}
            label="Daily sales"
          />
        </Panel>
        <Panel title="Most popular services">
          <ul className="bd-hbars">
            {POPULAR.map(([n, v]) => (
              <li key={n}>
                <span>{n}</span>
                <span className="bd-hbar-track">
                  <span
                    className="bd-hbar"
                    style={{ width: `${(v / maxPop) * 100}%` }}
                  />
                </span>
                <span className="bd-hbar-val">{v}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Technician performance">
        <div
          className="bd-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <table className="bd-table">
            <thead>
              <tr>
                <th scope="col">Technician</th>
                <th scope="col">Revenue</th>
                <th scope="col">Services</th>
                <th scope="col">Tips</th>
                <th scope="col">Rebook rate</th>
              </tr>
            </thead>
            <tbody>
              {TECH_REVENUE.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="bd-row-gap">
                      <Avatar id={r.id} size={26} /> {tech(r.id).name}
                    </span>
                  </td>
                  <td>{money(r.revenue)}</td>
                  <td>{r.services}</td>
                  <td>{money(r.tips)}</td>
                  <td>{r.rebook}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Appointments vs walk-ins">
        <div
          className="bd-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <table className="bd-table">
            <thead>
              <tr>
                <th scope="col">Day</th>
                {WEEK.map((w) => (
                  <th key={w.day} scope="col">
                    {w.day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Booked</th>
                {WEEK.map((w) => (
                  <td key={w.day}>{w.appts}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Walk-in</th>
                {WEEK.map((w) => (
                  <td key={w.day}>{w.walkins}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Inventory() {
  const { state, dispatch } = useDemo();
  const set = (id, by) =>
    dispatch({
      type: "set",
      key: "inventory",
      value: (l) =>
        l.map((i) =>
          i.id === id ? { ...i, qty: Math.max(0, i.qty + by) } : i,
        ),
    });
  const low = state.inventory.filter((i) => i.qty < i.par);
  return (
    <>
      <Head title="Inventory" sub="Salon supplies and retail products" />
      {low.length ? (
        <p className="bd-banner">
          <Icon name="bell" size={16} /> {low.length} items are below their
          reorder level: {low.map((i) => i.name).join(", ")}.
        </p>
      ) : null}
      {["Supply", "Retail"].map((kind) => (
        <Panel
          key={kind}
          title={kind === "Supply" ? "Supplies" : "Retail products"}
        >
          <div
            className="bd-table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Scrollable table"
          >
            <table className="bd-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">In stock</th>
                  <th scope="col">Reorder at</th>
                  {kind === "Retail" ? <th scope="col">Price</th> : null}
                  <th scope="col">
                    <span className="bd-sr">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.inventory
                  .filter((i) => i.kind === kind)
                  .map((i) => (
                    <tr key={i.id}>
                      <td>
                        <strong>{i.name}</strong>
                      </td>
                      <td>
                        <span className="bd-stepper bd-stepper-sm">
                          <button
                            type="button"
                            aria-label={`One less ${i.name}`}
                            onClick={() => set(i.id, -1)}
                          >
                            <Icon name="minus" size={14} />
                          </button>
                          <span>
                            {i.qty} {i.unit}
                          </span>
                          <button
                            type="button"
                            aria-label={`One more ${i.name}`}
                            onClick={() => set(i.id, 1)}
                          >
                            <Icon name="plus" size={14} />
                          </button>
                        </span>
                      </td>
                      <td>{i.par}</td>
                      {kind === "Retail" ? <td>{money(i.price)}</td> : null}
                      <td>
                        {i.qty < i.par ? (
                          <button
                            type="button"
                            className="bd-btn bd-btn-xs"
                            onClick={() => {
                              set(i.id, i.par * 2 - i.qty);
                              dispatch({
                                type: "toast",
                                text: `Reorder logged for ${i.name}.`,
                              });
                            }}
                          >
                            Low · reorder
                          </button>
                        ) : (
                          <span className="bd-status bd-tone-mint">
                            Stocked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}
    </>
  );
}

function Marketing() {
  const { dispatch } = useDemo();
  const [loyalty, setLoyalty] = useState(true);
  const [promos, setPromos] = useState({
    HOLIDAY15: true,
    FIRSTVISIT: true,
    BFF: false,
  });
  const [remind, setRemind] = useState({ gel: true, fill: true, pedi: false });
  const [gift, setGift] = useState(50);
  const [msg, setMsg] = useState(
    "We miss you at Lumi! 💕 Book this week and get 15% off any gel service. Code HOLIDAY15",
  );
  return (
    <>
      <Head
        title="Marketing & loyalty"
        sub="Bring clients back, the friendly way"
      />
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Loyalty rewards">
          <Toggle
            on={loyalty}
            onChange={() => setLoyalty(!loyalty)}
            label="Rewards program"
            hint="1 point per $1 · 500 points = free nail art"
          />
          <p className="bd-sub">128 members · 23 rewards redeemed this month</p>
        </Panel>
        <Panel title="Gift cards">
          <div
            className="bd-wrapchips"
            role="group"
            aria-label="Gift card amount"
          >
            {[25, 50, 75, 100].map((n) => (
              <button
                key={n}
                type="button"
                className="bd-chip"
                aria-pressed={gift === n}
                onClick={() => setGift(n)}
              >
                {money(n)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="bd-btn bd-btn-sm"
            onClick={() =>
              dispatch({
                type: "toast",
                text: `${money(gift)} gift card issued: LUMI-${4200 + gift}. Emailed to the buyer.`,
              })
            }
          >
            <Icon name="gift" size={15} /> Issue {money(gift)} gift card
          </button>
        </Panel>
        <Panel title="Promotions">
          {[
            ["HOLIDAY15", "15% off gel services through Dec 31"],
            ["FIRSTVISIT", "$10 off a first visit"],
            ["BFF", "Bring a friend, both get $5 off"],
          ].map(([code, d]) => (
            <Toggle
              key={code}
              on={promos[code]}
              onChange={() => setPromos({ ...promos, [code]: !promos[code] })}
              label={code}
              hint={d}
            />
          ))}
        </Panel>
        <Panel title="Rebooking reminders">
          <Toggle
            on={remind.gel}
            onChange={() => setRemind({ ...remind, gel: !remind.gel })}
            label="Gel manicures"
            hint="Text 3 weeks after the visit"
          />
          <Toggle
            on={remind.fill}
            onChange={() => setRemind({ ...remind, fill: !remind.fill })}
            label="Acrylic & Gel-X"
            hint="Text 2–3 weeks after for a fill"
          />
          <Toggle
            on={remind.pedi}
            onChange={() => setRemind({ ...remind, pedi: !remind.pedi })}
            label="Pedicures"
            hint="Email 5 weeks after the visit"
          />
        </Panel>
      </div>
      <Panel title="Follow-up campaign">
        <div className="bd-campaign">
          <div className="bd-form">
            <label className="bd-field">
              <span>Who gets it</span>
              <select defaultValue="60">
                <option value="60">Not seen in 60 days (38 clients)</option>
                <option value="vip">VIP clients (12)</option>
                <option value="new">First-time visitors this month (9)</option>
              </select>
            </label>
            <label className="bd-field">
              <span>Message</span>
              <textarea
                rows={3}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
              />
            </label>
            <p className="bd-hint">
              Only goes to clients who opted in, by their chosen channel: 27 by
              text, 11 by email.
            </p>
            <button
              type="button"
              className="bd-btn bd-btn-sm"
              onClick={() =>
                dispatch({
                  type: "toast",
                  text: "Campaign scheduled for tomorrow at 10:00 AM (demo).",
                })
              }
            >
              <Icon name="send" size={15} /> Schedule
            </button>
          </div>
          <div className="bd-sms bd-sms-preview" aria-label="Message preview">
            <p className="bd-sms-in">{msg}</p>
            <p className="bd-hint">Reply STOP to opt out</p>
          </div>
        </div>
      </Panel>
    </>
  );
}

function Settings() {
  const { dispatch } = useDemo();
  const [s, setS] = useState({
    online: true,
    groups: true,
    r24: true,
    r2: true,
    review: true,
    confirmLinks: true,
  });
  const flip = (k) => setS({ ...s, [k]: !s[k] });
  const hours = [
    ["Mon", "9:30 AM – 7:00 PM"],
    ["Tue – Fri", "9:30 AM – 7:30 PM"],
    ["Sat", "9:00 AM – 6:00 PM"],
    ["Sun", "11:00 AM – 5:00 PM"],
  ];
  return (
    <>
      <Head
        title="Salon settings"
        sub="Changes apply to booking, the kiosk and reminders"
      >
        <button
          type="button"
          className="bd-btn bd-btn-sm"
          onClick={() => dispatch({ type: "toast", text: "Settings saved." })}
        >
          Save changes
        </button>
      </Head>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Business hours">
          <ul className="bd-plain-list">
            {hours.map(([d, h]) => (
              <li key={d} className="bd-row-between">
                <strong>{d}</strong>
                <span className="bd-sub">{h}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Online booking">
          <Toggle
            on={s.online}
            onChange={() => flip("online")}
            label="Accept online bookings"
          />
          <Toggle
            on={s.groups}
            onChange={() => flip("groups")}
            label="Allow group bookings"
            hint="Up to 6 guests"
          />
          <div className="bd-form-2">
            <label className="bd-field">
              <span>Minimum notice</span>
              <select defaultValue="2">
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="24">1 day</option>
              </select>
            </label>
            <label className="bd-field">
              <span>Book up to</span>
              <select defaultValue="60">
                <option value="30">30 days ahead</option>
                <option value="60">60 days ahead</option>
                <option value="90">90 days ahead</option>
              </select>
            </label>
          </div>
        </Panel>
        <Panel title="Breaks & cleanup">
          <div className="bd-form-2">
            <label className="bd-field">
              <span>Cleanup between clients</span>
              <select defaultValue="10">
                <option value="5">5 min</option>
                <option value="10">10 min</option>
                <option value="15">15 min</option>
              </select>
            </label>
            <label className="bd-field">
              <span>Default break</span>
              <select defaultValue="30">
                <option value="20">20 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
              </select>
            </label>
          </div>
        </Panel>
        <Panel title="Deposits & cancellations">
          <div className="bd-form-2">
            <label className="bd-field">
              <span>Deposit per person</span>
              <select defaultValue="20">
                <option value="0">No deposit</option>
                <option value="10">$10</option>
                <option value="20">$20</option>
                <option value="pct">25% of service</option>
              </select>
            </label>
            <label className="bd-field">
              <span>Free cancellation until</span>
              <select defaultValue="24">
                <option value="12">12 hours before</option>
                <option value="24">24 hours before</option>
                <option value="48">48 hours before</option>
              </select>
            </label>
          </div>
          <p className="bd-hint">
            Clients see this policy before they pay a deposit.
          </p>
        </Panel>
        <Panel title="Client messages" className="bd-span2">
          <Toggle
            on={s.r24}
            onChange={() => flip("r24")}
            label="Reminder 24 hours before"
          />
          <Toggle
            on={s.r2}
            onChange={() => flip("r2")}
            label="Reminder 2 hours before"
          />
          <Toggle
            on={s.confirmLinks}
            onChange={() => flip("confirmLinks")}
            label="Confirm, reschedule or cancel by link"
          />
          <Toggle
            on={s.review}
            onChange={() => flip("review")}
            label="Ask for a review after each visit"
            hint="Unhappy ratings go privately to you first"
          />
        </Panel>
      </div>
    </>
  );
}

function Requests() {
  const { state, dispatch } = useDemo();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState("");
  const tone = {
    Submitted: "peach",
    Reviewing: "lilac",
    "In progress": "rose",
    Shipped: "mint",
  };
  return (
    <>
      <Head title="Feature requests" sub="Your system grows with your salon" />
      <Panel title="Made for how you work">
        <ul className="bd-custom-list">
          {[
            "Custom technician rotation rules",
            "Station and chair assignments",
            "Personal commission structures",
            "VIP client treatment",
            "Special service packages",
            "Approvals for complex nail designs",
            "Your own staff workflows",
          ].map((x) => (
            <li key={x}>
              <Icon name="sparkle" size={14} /> {x}
            </li>
          ))}
        </ul>
      </Panel>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Ask for something new">
          <form
            className="bd-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              dispatch({
                type: "set",
                key: "requests",
                value: (l) => [
                  {
                    id: `f${l.length + 1}`,
                    title: title.trim(),
                    body: body || "No details yet.",
                    status: "Submitted",
                    reply:
                      "Thanks! We’ll review this and reply within 2 business days.",
                    file,
                  },
                  ...l,
                ],
              });
              dispatch({
                type: "toast",
                text: "Request sent to the Klyvora team.",
              });
              setTitle("");
              setBody("");
              setFile("");
            }}
          >
            <label className="bd-field">
              <span>What would help?</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Let VIPs book 90 days ahead"
              />
            </label>
            <label className="bd-field">
              <span>Explain the problem or change</span>
              <textarea
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
            <label className="bd-upload bd-upload-sm">
              <input
                type="file"
                accept="image/*"
                className="bd-sr"
                onChange={(e) => setFile(e.target.files?.[0]?.name || "")}
              />
              <Icon name="camera" size={18} />
              <span>{file || "Attach a screenshot or example"}</span>
            </label>
            <button type="submit" className="bd-btn bd-btn-sm">
              Submit request
            </button>
          </form>
        </Panel>
        <Panel title="Your requests">
          <ul className="bd-req-list">
            {state.requests.map((r) => (
              <li key={r.id}>
                <span className="bd-row-between">
                  <strong>{r.title}</strong>
                  <span className={`bd-status bd-tone-${tone[r.status]}`}>
                    {r.status}
                  </span>
                </span>
                <span className="bd-sub">{r.body}</span>
                {r.file ? <span className="bd-hint">📎 {r.file}</span> : null}
                <span className="bd-reply">
                  <span className="bd-hint">Klyvora team</span>
                  {r.reply}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

export default function OwnerAdmin() {
  const { state } = useDemo();
  const [view, setView] = useState("dash");
  const go = (v) => {
    setView(v);
    if (typeof document !== "undefined")
      document.querySelector(".bd-a-main")?.scrollTo({ top: 0 });
  };
  const counts = {
    dash: state.alerts.length,
    walk: state.queue.filter((q) => q.status === "waiting").length,
    team: state.timeOff.filter((t) => t.status === "pending").length,
  };
  return (
    <BrowserFrame label="Owner dashboard" url={`${SALON.url}/admin`}>
      <div className="bd-admin">
        <nav className="bd-a-side" aria-label="Owner dashboard">
          <div className="bd-a-brand">
            <span className="bd-logo-mark">L</span>
            <span className="bd-serif">{SALON.short}</span>
          </div>
          {NAV.map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              aria-current={view === id ? "page" : undefined}
              onClick={() => go(id)}
            >
              <Icon name={icon} size={17} />
              <span>{label}</span>
              {counts[id] ? (
                <span className="bd-count">{counts[id]}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="bd-a-main">
          {view === "dash" && <Dashboard go={go} />}
          {view === "cal" && <Calendar />}
          {view === "walk" && <WalkIns />}
          {view === "svc" && <Services />}
          {view === "team" && <Team go={go} />}
          {view === "clients" && <Clients />}
          {view === "pay" && <Payments />}
          {view === "reports" && <Reports />}
          {view === "stock" && <Inventory />}
          {view === "mkt" && <Marketing />}
          {view === "settings" && <Settings />}
          {view === "req" && <Requests />}
        </div>
      </div>
    </BrowserFrame>
  );
}
