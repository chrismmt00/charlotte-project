"use client";

import { useState } from "react";
import {
  CENTER,
  DOCUMENTS,
  ENROLLMENT_TREND,
  FAMILIES,
  LOCATIONS,
  PLANS,
  ROOMS,
  STAFF,
  WEEK,
  at,
  childOf,
  room,
} from "./data";
import { useDaycare } from "./store";
import {
  BrowserFrame,
  CamScene,
  ChildStatus,
  Icon,
  Kid,
  KindIcon,
  Person,
  RoomTag,
  Toggle,
  money,
} from "./ui";
import "./owner.css";

const NAV = [
  ["dash", "home", "Dashboard"],
  ["attend", "list", "Attendance"],
  ["pickups", "shield", "Pickups"],
  ["enroll", "file", "Enrollment"],
  ["families", "heart", "Families"],
  ["rooms", "sun", "Classrooms"],
  ["staff", "users", "Staff"],
  ["billing", "card", "Billing"],
  ["msgs", "chat", "Messages"],
  ["reports", "chart", "Reports"],
  ["comply", "lock", "Compliance"],
  ["cams", "video", "Cameras"],
  ["settings", "gear", "Settings"],
  ["req", "bulb", "Requests"],
];

const ALERT_ICON = {
  guest: "key",
  med: "pill",
  cert: "id",
  late: "clock",
  in: "door",
  out: "door",
  refused: "alert",
  incident: "alert",
};
const ALERT_GO = {
  guest: "pickups",
  med: "staff",
  cert: "staff",
  late: "attend",
  in: "attend",
  out: "pickups",
  refused: "pickups",
  incident: "families",
};

const GUEST_STATUS = {
  invited: ["Waiting for guest", "sun"],
  verified: ["Verified · pass issued", "mint"],
  used: ["Used", "plain"],
  revoked: ["Revoked", "rose"],
  expired: ["Expired", "plain"],
};

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

function Kpi({ label, value, hint }) {
  return (
    <div className="bd-kpi">
      <span>{label}</span>
      <strong className="bd-serif">{value}</strong>
      {hint ? <span className="bd-hint">{hint}</span> : null}
    </div>
  );
}

function Tone({ tone, children }) {
  return <span className={`bd-status dc-tone-${tone}`}>{children}</span>;
}

function Bars({ data, fmt = (v) => v, label }) {
  const max = Math.max(...data.map((d) => d[1]));
  return (
    <div
      className="bd-bars bd-bars-lg"
      role="img"
      aria-label={`${label}: ${data.map(([k, v]) => `${k} ${fmt(v)}`).join(", ")}`}
    >
      {data.map(([k, v]) => (
        <div key={k} className="bd-bar-col">
          <span className="bd-bar-val">{fmt(v)}</span>
          <span className="bd-bar" style={{ height: `${(v / max) * 100}%` }} />
          <span className="bd-bar-label">{k}</span>
        </div>
      ))}
    </div>
  );
}

function HBars({ data, fmt = (v) => v, max }) {
  const top = max ?? Math.max(...data.map((d) => d[1]));
  return (
    <ul className="bd-hbars">
      {data.map(([k, v]) => (
        <li key={k}>
          <span>{k}</span>
          <span className="bd-hbar-track">
            <span
              className="bd-hbar"
              style={{ width: `${Math.min(100, (v / top) * 100)}%` }}
            />
          </span>
          <span className="bd-hbar-val">{fmt(v)}</span>
        </li>
      ))}
    </ul>
  );
}

function downloadCsv(name, rows) {
  const csv = rows
    .map((r) =>
      r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `bright-burrow-demo-${name}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Staff on duty in a room right now (clocked in and not on a break).
const onDuty = (state, roomId) =>
  STAFF.filter(
    (s) => s.room === roomId && state.clockedIn[s.id] && !state.onBreak[s.id],
  );
const presentIn = (state, roomId) =>
  state.children.filter((c) => c.room === roomId && c.status === "in");
const capOf = (state, r) => state.capacity?.[r.id] ?? r.capacity;

function ratioText(state, r) {
  const kids = presentIn(state, r.id).length;
  const team = onDuty(state, r.id).length;
  const ok = kids <= team * r.ratio;
  return {
    kids,
    team,
    ok,
    text: ok
      ? `Within your 1:${r.ratio} limit`
      : `Over your 1:${r.ratio} limit · add staff`,
  };
}

function attendanceRows(state) {
  return [
    [
      "Child",
      "Room",
      "Status",
      "In",
      "Dropped off by",
      "Out",
      "Picked up by",
      "Notes",
    ],
    ...state.children.map((c) => [
      c.name,
      room(c.room).name,
      c.status,
      c.inAt ? at(c.inAt) : "",
      c.inBy || "",
      c.outAt ? at(c.outAt) : "",
      c.outBy || "",
      c.lateNote || c.absentNote || "",
    ]),
  ];
}

// ---------- 1. Dashboard ----------
function Dashboard({ go, loc }) {
  const { state, dispatch } = useDaycare();
  const enrolled = state.children.length;
  const cap = ROOMS.reduce((t, r) => t + capOf(state, r), 0);
  const present = state.children.filter((c) => c.status === "in").length;
  const staffOn = STAFF.filter(
    (s) => state.clockedIn[s.id] && !state.onBreak[s.id],
  ).length;
  const guestsToday = state.guests.filter(
    (g) =>
      g.date === "Mon, Nov 16" && ["invited", "verified"].includes(g.status),
  );
  const recent = [...state.logs].sort((a, b) => b.time - a.time).slice(0, 7);
  const open = state.invoices
    .filter((i) => i.status === "open")
    .reduce((t, i) => t + i.lines.reduce((s, [, v]) => s + v, 0), 0);
  const L = LOCATIONS.find((l) => l.id === "south");
  if (loc !== "south") {
    const list =
      loc === "all" ? LOCATIONS : LOCATIONS.filter((l) => l.id === loc);
    const sum = (k) => list.reduce((t, l) => t + l[k], 0);
    return (
      <>
        <Head
          title={loc === "all" ? "All locations" : "University"}
          sub="Monday, November 16 · 12:40 PM · summary view"
        />
        <div className="bd-kpis">
          <Kpi
            label="Enrolled"
            value={sum("enrolled")}
            hint={`of ${sum("capacity")} spots`}
          />
          <Kpi label="Present now" value={sum("present")} />
          <Kpi label="Staff on duty" value={sum("staff")} />
          <Kpi
            label="Tuition collected"
            value={money(sum("collected"))}
            hint={`${money(sum("outstanding"))} outstanding`}
          />
        </div>
        <Panel title="By location">
          <div
            className="bd-table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Scrollable table"
          >
            <table className="bd-table">
              <thead>
                <tr>
                  <th scope="col">Location</th>
                  <th scope="col">Enrolled</th>
                  <th scope="col">Present</th>
                  <th scope="col">Staff</th>
                  <th scope="col">Collected</th>
                  <th scope="col">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {list.map((l) => (
                  <tr key={l.id}>
                    <th scope="row">{l.name}</th>
                    <td>
                      {l.enrolled} / {l.capacity}
                    </td>
                    <td>{l.present}</td>
                    <td>{l.staff}</td>
                    <td>{money(l.collected)}</td>
                    <td>{money(l.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="bd-hint">
            Each location keeps its own staff accounts, classrooms, enrollment
            limits and policies. Switch to South End to see live details.
          </p>
        </Panel>
      </>
    );
  }
  return (
    <>
      <Head
        title="Good afternoon, Joy"
        sub="Monday, November 16 · 12:40 PM · South End"
      >
        <button
          type="button"
          className="bd-btn bd-btn-sm"
          onClick={() => go("pickups")}
        >
          <Icon name="shield" size={16} /> Review pickups
        </button>
      </Head>
      <div className="bd-kpis">
        <Kpi
          label="Enrolled"
          value={`${enrolled} / ${cap}`}
          hint={`${cap - enrolled} open spots`}
        />
        <Kpi
          label="Present now"
          value={present}
          hint={`${state.children.filter((c) => c.status === "expected").length} arriving late`}
        />
        <Kpi
          label="Staff on duty"
          value={staffOn}
          hint={`${STAFF.length - staffOn} off or on break`}
        />
        <Kpi
          label="Guest pickups today"
          value={guestsToday.length}
          hint={
            guestsToday.some((g) => g.status === "invited")
              ? "Waiting for verification"
              : "All verified"
          }
        />
      </div>
      <div className="bd-a-grid">
        <Panel title="Needs your attention" className="bd-span2">
          {state.alerts.length ? (
            <ul className="bd-alerts">
              {state.alerts.slice(0, 6).map((al) => (
                <li
                  key={al.id}
                  className={
                    al.kind === "refused" || al.kind === "incident"
                      ? "is-walkin"
                      : ""
                  }
                >
                  <span
                    className="bd-alert-icon dc-tone-sky"
                    aria-hidden="true"
                  >
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
                      Dismiss
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="bd-sub">All caught up.</p>
          )}
        </Panel>
        <Panel title="Money this month">
          <ul className="bd-plain-list">
            <li className="bd-row-between">
              <span>Tuition collected</span>
              <strong>{money(L.collected)}</strong>
            </li>
            <li className="bd-row-between">
              <span>Outstanding</span>
              <strong>{money(L.outstanding)}</strong>
            </li>
            <li className="bd-row-between">
              <span>Carter family · Dec invoice</span>
              <strong>{open ? money(open) : "Paid"}</strong>
            </li>
          </ul>
          <button
            type="button"
            className="bd-link"
            onClick={() => go("billing")}
          >
            Open billing →
          </button>
        </Panel>
      </div>
      <div className="dc-o-rooms">
        {ROOMS.map((r) => {
          const x = ratioText(state, r);
          return (
            <button
              key={r.id}
              type="button"
              className="dc-o-room"
              onClick={() => go("rooms")}
            >
              <RoomTag id={r.id} />
              <strong className="bd-serif">
                {x.kids} <span>/ {capOf(state, r)}</span>
              </strong>
              <span className="bd-hint">
                {x.team} staff on duty · {r.ages}
              </span>
              <span className={`bd-status dc-tone-${x.ok ? "mint" : "rose"}`}>
                <Icon name={x.ok ? "check" : "alert"} size={12} /> {x.text}
              </span>
            </button>
          );
        })}
      </div>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Upcoming pickups">
          <ul className="bd-plain-list">
            {guestsToday.map((g) => (
              <li key={g.id} className="bd-row-between">
                <span>
                  <strong>
                    {g.children
                      .map((id) => childOf(state.children, id).name)
                      .join(", ")}{" "}
                    · {at(g.from)}–{at(g.to)}
                  </strong>
                  <span className="bd-hint">
                    Guest: {g.name} ({g.relation})
                  </span>
                </span>
                <Tone tone={GUEST_STATUS[g.status][1]}>
                  {GUEST_STATUS[g.status][0]}
                </Tone>
              </li>
            ))}
            <li className="bd-row-between">
              <span>
                <strong>Zoe R. · 3:00 PM</strong>
                <span className="bd-hint">
                  Early pickup noted by parent (dentist)
                </span>
              </span>
              <Tone tone="plain">Parent</Tone>
            </li>
            <li className="bd-row-between">
              <span>
                <strong>Butterflies & Bumblebees · from 4:30 PM</strong>
                <span className="bd-hint">Regular pickups, 14 children</span>
              </span>
              <Tone tone="plain">Scheduled</Tone>
            </li>
          </ul>
        </Panel>
        <Panel title="Latest activity">
          <ul className="dc-o-feed">
            {recent.map((l) => {
              const kid = childOf(state.children, l.child);
              return (
                <li key={l.id}>
                  <KindIcon kind={l.kind} size={30} />
                  <span>
                    <strong>
                      {kid?.name} · {l.text}
                    </strong>
                    <span className="bd-hint">
                      {at(l.time)} · {l.by}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </>
  );
}

// ---------- 2. Attendance ----------
function Attendance() {
  const { state } = useDaycare();
  return (
    <>
      <Head
        title="Attendance"
        sub={`${state.children.filter((c) => c.status === "in").length} children here now · updated by check-in and pickup`}
      >
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-soft"
          onClick={() => downloadCsv("attendance", attendanceRows(state))}
        >
          <Icon name="download" size={15} /> Export CSV
        </button>
      </Head>
      {ROOMS.map((r) => (
        <Panel
          key={r.id}
          title={`${r.name} · ${presentIn(state, r.id).length} present`}
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
                  <th scope="col">Child</th>
                  <th scope="col">Status</th>
                  <th scope="col">In</th>
                  <th scope="col">Out</th>
                  <th scope="col">Notes</th>
                </tr>
              </thead>
              <tbody>
                {state.children
                  .filter((c) => c.room === r.id)
                  .map((c) => (
                    <tr key={c.id}>
                      <th scope="row">
                        <span className="bd-row-gap">
                          <Kid child={c} size={26} /> {c.name}
                        </span>
                      </th>
                      <td>
                        <ChildStatus child={c} />
                      </td>
                      <td>{c.inAt ? `${at(c.inAt)} · ${c.inBy}` : "—"}</td>
                      <td>{c.outAt ? `${at(c.outAt)} · ${c.outBy}` : "—"}</td>
                      <td>
                        {c.lateNote ||
                          c.absentNote ||
                          (c.allergies.length
                            ? `Allergy: ${c.allergies.join(", ")}`
                            : "")}
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

// ---------- 3. Pickups ----------
function Pickups() {
  const { state, dispatch } = useDaycare();
  const [sel, setSel] = useState(state.guests[0]?.id);
  const rules = state.pickupRules ?? {
    photoId: true,
    twoStaff: true,
    notifyBoth: true,
    expiry: "window",
    attempts: "3",
  };
  const setRule = (k, v) =>
    dispatch({
      type: "set",
      key: "pickupRules",
      value: (p) => ({ ...(p ?? rules), [k]: v }),
    });
  const g = state.guests.find((x) => x.id === sel);
  return (
    <>
      <Head
        title="Secure pickups"
        sub="Guest authorizations, verification, release history and refusals"
      />
      <div className="dc-o-guests">
        <Panel title="Guest authorizations">
          <ul className="bd-client-list">
            {state.guests.map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  aria-pressed={sel === x.id}
                  onClick={() => setSel(x.id)}
                >
                  <Person name={x.name} photo={x.photo} size={34} tone="sun" />
                  <span>
                    <strong>{x.name}</strong>
                    <span className="bd-hint">
                      {x.children
                        .map((id) => childOf(state.children, id).first)
                        .join(", ")}{" "}
                      · {x.date}
                    </span>
                    <span
                      className={`bd-status dc-tone-${GUEST_STATUS[x.status][1]}`}
                    >
                      {GUEST_STATUS[x.status][0]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        {g ? (
          <Panel className="dc-o-guest">
            <div className="bd-row-between">
              <span className="bd-row-gap">
                <Person
                  name={g.legalName || g.name}
                  photo={g.photo}
                  size={56}
                  tone="sun"
                />
                <span>
                  <h4 className="bd-serif">{g.legalName || g.name}</h4>
                  <span className="bd-hint">
                    {g.relation} · authorized by {g.by}
                  </span>
                </span>
              </span>
              <Tone tone={GUEST_STATUS[g.status][1]}>
                {GUEST_STATUS[g.status][0]}
              </Tone>
            </div>
            <dl className="bd-dl bd-dl-tight">
              <div>
                <dt>Child</dt>
                <dd>
                  {g.children
                    .map((id) => childOf(state.children, id).name)
                    .join(", ")}
                </dd>
              </div>
              <div>
                <dt>Window</dt>
                <dd>
                  {g.date} · {at(g.from)}–{at(g.to)} · {g.type}
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{g.phone}</dd>
              </div>
              <div>
                <dt>Form</dt>
                <dd>
                  {g.status === "invited"
                    ? "Not submitted yet"
                    : `Submitted · ID: ${g.idType || "Driver’s license"} ending ${g.idLast4 || "••••"}`}
                </dd>
              </div>
              <div>
                <dt>Photo</dt>
                <dd>
                  {g.photo || g.sample
                    ? "On file for staff comparison"
                    : "Not submitted yet"}
                </dd>
              </div>
              <div>
                <dt>Instructions</dt>
                <dd>{g.notes || "—"}</dd>
              </div>
              <div>
                <dt>Code</dt>
                <dd>
                  {g.code
                    ? `Issued · ${g.tries} failed ${g.tries === 1 ? "try" : "tries"}`
                    : "Not issued"}
                </dd>
              </div>
            </dl>
            <p className="bd-hint">
              A code never releases a child on its own. Staff compare the person
              with the photo and a photo ID before approving.
            </p>
            {["invited", "verified"].includes(g.status) ? (
              <button
                type="button"
                className="bd-btn bd-btn-sm bd-btn-ghost"
                onClick={() =>
                  dispatch({ type: "revokeGuest", id: g.id, by: "Ms. Joy" })
                }
              >
                <Icon name="x" size={15} /> Revoke authorization
              </button>
            ) : null}
          </Panel>
        ) : null}
      </div>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Authorized pickup contacts">
          <ul className="bd-plain-list">
            {Object.entries(FAMILIES).map(([id, f]) => (
              <li key={id}>
                <strong>{f.name}</strong>
                <span className="bd-hint">
                  {[
                    ...f.guardians.map((x) => `${x.name} (${x.relation})`),
                    ...f.pickups.map((x) => `${x.name} (${x.relation})`),
                  ].join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Custody restrictions">
          {Object.entries(FAMILIES)
            .filter(([, f]) => f.restriction)
            .map(([id, f]) => (
              <p key={id} className="dc-o-flag">
                <Icon name="alert" size={16} />
                <span>
                  <strong>
                    {state.children
                      .filter((c) => c.family === id)
                      .map((c) => c.name)
                      .join(", ")}
                  </strong>{" "}
                  {f.restriction}
                </span>
              </p>
            ))}
          <p className="bd-hint">
            Restrictions override ordinary app permissions and show on the front
            desk before any release.
          </p>
        </Panel>
      </div>
      <Panel title="Pickup history">
        <div
          className="bd-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <table className="bd-table">
            <thead>
              <tr>
                <th scope="col">Child</th>
                <th scope="col">Picked up by</th>
                <th scope="col">When</th>
                <th scope="col">Released by</th>
                <th scope="col">Method</th>
              </tr>
            </thead>
            <tbody>
              {state.pickupLog.map((p) => (
                <tr key={p.id}>
                  <th scope="row">{childOf(state.children, p.child)?.name}</th>
                  <td>
                    {p.by} · {p.relation}
                  </td>
                  <td>
                    {p.day || "Today"} · {at(p.time)}
                  </td>
                  <td>{p.staff}</td>
                  <td>{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Refused and failed attempts">
          <ul className="bd-plain-list">
            {state.failed.map((f) => (
              <li key={f.id}>
                <strong>
                  {f.day} · {at(f.time)} · {f.who}
                </strong>
                <span className="bd-hint">
                  {f.what} {f.staff ? `Logged by ${f.staff}.` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Verification rules">
          <Toggle
            on={rules.photoId}
            onChange={() => setRule("photoId", !rules.photoId)}
            label="Photo ID for every guest pickup"
          />
          <Toggle
            on={rules.twoStaff}
            onChange={() => setRule("twoStaff", !rules.twoStaff)}
            label="Two staff for unexpected pickups"
            hint="Someone not on the list"
          />
          <Toggle
            on={rules.notifyBoth}
            onChange={() => setRule("notifyBoth", !rules.notifyBoth)}
            label="Notify every guardian on release"
          />
          <div className="bd-form-2">
            <label className="bd-field">
              <span>Guest codes expire</span>
              <select
                value={rules.expiry}
                onChange={(e) => setRule("expiry", e.target.value)}
              >
                <option value="window">At the end of the pickup window</option>
                <option value="day">At the end of the day</option>
                <option value="use">After one use</option>
              </select>
            </label>
            <label className="bd-field">
              <span>Code attempts before lock</span>
              <select
                value={rules.attempts}
                onChange={(e) => setRule("attempts", e.target.value)}
              >
                <option value="3">3 tries</option>
                <option value="5">5 tries</option>
              </select>
            </label>
          </div>
        </Panel>
      </div>
    </>
  );
}

// ---------- 4. Enrollment ----------
function Enrollment() {
  const { state, dispatch } = useDaycare();
  const STAGES = ["New", "Tour booked", "Approved", "Waitlist", "Declined"];
  const tone = {
    New: "sky",
    "Tour booked": "lilac",
    Approved: "mint",
    Waitlist: "sun",
    Declined: "plain",
  };
  const patch = (id, p, toast) => {
    dispatch({
      type: "set",
      key: "applications",
      value: (l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)),
    });
    if (toast) dispatch({ type: "toast", text: toast });
  };
  const form = state.enrollForm ?? {
    allergies: true,
    immunizations: true,
    emergency: true,
    photo: true,
    medication: false,
    custody: true,
  };
  const flip = (k) =>
    dispatch({
      type: "set",
      key: "enrollForm",
      value: (p) => ({ ...(p ?? form), [k]: !(p ?? form)[k] }),
    });
  return (
    <>
      <Head
        title="Enrollment"
        sub="Applications, waitlists, start dates and documents"
      />
      <div className="bd-kpis">
        {ROOMS.map((r) => {
          const n = state.children.filter((c) => c.room === r.id).length;
          return (
            <Kpi
              key={r.id}
              label={r.name}
              value={`${Math.max(0, capOf(state, r) - n)} open`}
              hint={`${n} of ${capOf(state, r)} enrolled`}
            />
          );
        })}
      </div>
      {STAGES.map((st) => {
        const list = state.applications.filter((a) => a.status === st);
        if (!list.length) return null;
        return (
          <Panel key={st} title={`${st} · ${list.length}`}>
            <ul className="dc-o-apps">
              {list
                .sort((a, b) => (a.spot ?? 0) - (b.spot ?? 0))
                .map((a) => (
                  <li key={a.id}>
                    <span>
                      <strong>
                        {a.child} · {a.age}
                      </strong>
                      <span className="bd-hint">
                        Parent: {a.parent} · wants {room(a.room).name} from{" "}
                        {a.start}
                        {a.tour ? ` · tour ${a.tour}` : ""}
                        {a.spot
                          ? ` · #${a.spot} on the ${room(a.room).name} waitlist`
                          : ""}
                      </span>
                      <span className="dc-o-docs">
                        <span
                          className="bd-meter"
                          role="img"
                          aria-label={`${a.docs} of ${a.docsNeeded} documents`}
                        >
                          <span
                            style={{
                              width: `${(a.docs / a.docsNeeded) * 100}%`,
                            }}
                          />
                        </span>
                        <span className="bd-hint">
                          {a.docs}/{a.docsNeeded} documents
                        </span>
                      </span>
                    </span>
                    <span className="dc-o-app-actions">
                      <Tone tone={tone[a.status]}>{a.status}</Tone>
                      <label className="bd-sr" htmlFor={`room-${a.id}`}>
                        Classroom for {a.child}
                      </label>
                      <select
                        id={`room-${a.id}`}
                        className="bd-select-sm"
                        value={a.room}
                        onChange={(e) => patch(a.id, { room: e.target.value })}
                      >
                        {ROOMS.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <label className="bd-sr" htmlFor={`start-${a.id}`}>
                        Start date for {a.child}
                      </label>
                      <select
                        id={`start-${a.id}`}
                        className="bd-select-sm"
                        value={a.start}
                        onChange={(e) => patch(a.id, { start: e.target.value })}
                      >
                        {["Dec 1", "Jan 4", "Feb 1", "Mar 1"].map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                      {a.status !== "Approved" ? (
                        <button
                          type="button"
                          className="bd-btn bd-btn-xs"
                          onClick={() =>
                            patch(
                              a.id,
                              { status: "Approved", spot: null },
                              `${a.child} approved for ${room(a.room).name} from ${a.start}. Welcome packet sent.`,
                            )
                          }
                        >
                          Approve
                        </button>
                      ) : null}
                      {a.status !== "Waitlist" && a.status !== "Approved" ? (
                        <button
                          type="button"
                          className="bd-btn bd-btn-xs bd-btn-soft"
                          onClick={() =>
                            patch(
                              a.id,
                              {
                                status: "Waitlist",
                                spot:
                                  state.applications.filter(
                                    (x) =>
                                      x.status === "Waitlist" &&
                                      x.room === a.room,
                                  ).length + 1,
                              },
                              `${a.child} added to the waitlist.`,
                            )
                          }
                        >
                          Waitlist
                        </button>
                      ) : null}
                      {a.status !== "Declined" ? (
                        <button
                          type="button"
                          className="bd-btn bd-btn-xs bd-btn-ghost"
                          onClick={() =>
                            patch(
                              a.id,
                              { status: "Declined", spot: null },
                              `${a.child}’s application was declined. A note was sent.`,
                            )
                          }
                        >
                          Decline
                        </button>
                      ) : null}
                    </span>
                  </li>
                ))}
            </ul>
          </Panel>
        );
      })}
      <Panel title="Enrollment form builder">
        <p className="bd-sub">
          Choose what families fill in and upload when they apply online.
        </p>
        <div className="dc-o-two">
          {[
            ["allergies", "Allergies and dietary needs"],
            ["immunizations", "Immunization record upload"],
            ["emergency", "Emergency contacts"],
            ["photo", "Photo sharing permission"],
            ["medication", "Medication authorization"],
            ["custody", "Custody documents, if any"],
          ].map(([k, label]) => (
            <Toggle
              key={k}
              on={form[k]}
              onChange={() => flip(k)}
              label={label}
            />
          ))}
        </div>
        <button
          type="button"
          className="bd-btn bd-btn-sm"
          onClick={() =>
            dispatch({
              type: "toast",
              text: "Enrollment form published to your website.",
            })
          }
        >
          Publish form
        </button>
      </Panel>
    </>
  );
}

// ---------- 5. Families ----------
function Families() {
  const { state } = useDaycare();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState("maya");
  const list = state.children.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()),
  );
  const c = childOf(state.children, sel);
  const f = c ? FAMILIES[c.family] : null;
  const isCarter = c?.family === "carter";
  const history = [
    "Fri, Nov 13 · 7:55 AM – 5:10 PM",
    "Thu, Nov 12 · 8:02 AM – 5:25 PM",
    "Wed, Nov 11 · 7:48 AM – 4:50 PM",
    "Tue, Nov 10 · Absent (reported)",
  ];
  return (
    <>
      <Head
        title="Children & families"
        sub="Visible to staff according to their permissions"
      />
      <div className="bd-clients">
        <Panel>
          <label className="bd-field">
            <span className="bd-sr">Search children</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search children"
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
                  <Kid child={x} size={32} />
                  <span>
                    <strong>{x.name}</strong>
                    <span className="bd-hint">
                      {room(x.room).name} · {x.age}
                      {FAMILIES[x.family]?.restriction ? " · custody flag" : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        {c && f ? (
          <Panel className="bd-profile">
            <div className="bd-row-between">
              <span className="bd-row-gap">
                <Kid child={c} size={52} />
                <span>
                  <h4 className="bd-serif">{c.name}</h4>
                  <span className="bd-hint">
                    {c.age} · {f.name}
                  </span>
                </span>
              </span>
              <span className="bd-row-gap">
                <RoomTag id={c.room} />
                <ChildStatus child={c} />
              </span>
            </div>
            {f.restriction ? (
              <p className="dc-o-flag">
                <Icon name="alert" size={16} /> <span>{f.restriction}</span>
              </p>
            ) : null}
            <dl className="bd-dl bd-dl-tight">
              <div>
                <dt>Guardians</dt>
                <dd>
                  {f.guardians
                    .map((g) => `${g.name} (${g.relation}) ${g.phone}`)
                    .join(" · ")}
                </dd>
              </div>
              <div>
                <dt>Pickups</dt>
                <dd>
                  {f.pickups.length
                    ? f.pickups
                        .map(
                          (p) =>
                            `${p.name} (${p.relation})${p.emergency ? ", emergency contact" : ""}`,
                        )
                        .join(" · ")
                    : "Guardians only"}
                </dd>
              </div>
              <div>
                <dt>Allergies</dt>
                <dd>
                  {c.allergies.length
                    ? c.allergies.join(", ")
                    : "None recorded"}
                </dd>
              </div>
              <div>
                <dt>Care notes</dt>
                <dd>{c.care || "—"}</dd>
              </div>
              <div>
                <dt>Medication</dt>
                <dd>
                  {c.meds ||
                    state.meds
                      .filter((m) => m.child === c.id)
                      .map((m) => `${m.med} (${m.auth})`)
                      .join("; ") ||
                    "None authorized"}
                </dd>
              </div>
              <div>
                <dt>Comfort</dt>
                <dd>{c.comfort || "—"}</dd>
              </div>
              <div>
                <dt>Photos</dt>
                <dd>
                  {c.photoOk
                    ? "Family allows photo sharing"
                    : "No photos (family declined)"}
                </dd>
              </div>
            </dl>
            <div className="dc-o-two">
              <div>
                <p className="bd-mini">Attendance history</p>
                <ul className="bd-plain-list">
                  {history.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="bd-mini">Documents</p>
                <ul className="bd-plain-list">
                  <li className="bd-row-between">
                    Enrollment agreement <Tone tone="mint">Signed</Tone>
                  </li>
                  <li className="bd-row-between">
                    Immunization record <Tone tone="mint">Valid</Tone>
                  </li>
                  <li className="bd-row-between">
                    Emergency form{" "}
                    <Tone tone={c.id === "ruby" ? "rose" : "mint"}>
                      {c.id === "ruby" ? "Missing" : "On file"}
                    </Tone>
                  </li>
                </ul>
              </div>
            </div>
            <p className="bd-mini">Communication log</p>
            <ul className="bd-plain-list">
              {(isCarter
                ? [
                    ...state.threads.teacher.messages.map((m) => ({
                      ...m,
                      who: m.from === "me" ? "Danielle Carter" : "Ms. Rosa",
                    })),
                    ...state.threads.director.messages.map((m) => ({
                      ...m,
                      who: m.from === "me" ? "Danielle Carter" : "Ms. Joy",
                    })),
                  ]
                : [
                    {
                      who: "Classroom",
                      text: "Weekly classroom newsletter delivered and read.",
                      time: 545,
                    },
                  ]
              ).map((m, i) => (
                <li key={i}>
                  <strong>
                    {m.who} · {at(m.time)}
                  </strong>
                  <span className="bd-hint">{m.text}</span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </>
  );
}

// ---------- 6. Classrooms ----------
function Classrooms() {
  const { state, dispatch } = useDaycare();
  const [mv, setMv] = useState({ child: "leo", room: "bumblebees" });
  const SCHED = [
    "8:30 Breakfast",
    "9:30 Circle time",
    "10:15 Outdoor play",
    "11:30 Lunch",
    "12:15 Rest",
    "3:00 Snack",
    "3:30 Centers",
  ];
  const setCap = (id, by) =>
    dispatch({
      type: "set",
      key: "capacity",
      value: (p) => ({
        ...(p ?? {}),
        [id]: Math.max(1, (p?.[id] ?? room(id).capacity) + by),
      }),
    });
  return (
    <>
      <Head
        title="Classrooms"
        sub="Age groups, capacity, teachers and your ratio limits"
      />
      <div className="dc-o-roomcards">
        {ROOMS.map((r) => {
          const x = ratioText(state, r);
          return (
            <Panel key={r.id}>
              <div className="bd-row-between">
                <RoomTag id={r.id} />
                <span className={`bd-status dc-tone-${x.ok ? "mint" : "rose"}`}>
                  {x.text}
                </span>
              </div>
              <p className="bd-sub">
                {r.ages} · {x.kids} present · {x.team} on duty
              </p>
              <div className="bd-row-between">
                <span className="bd-sub">Capacity</span>
                <span className="bd-stepper bd-stepper-sm">
                  <button
                    type="button"
                    aria-label={`Lower ${r.name} capacity`}
                    onClick={() => setCap(r.id, -1)}
                  >
                    <Icon name="minus" size={14} />
                  </button>
                  <span>{capOf(state, r)} children</span>
                  <button
                    type="button"
                    aria-label={`Raise ${r.name} capacity`}
                    onClick={() => setCap(r.id, 1)}
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </span>
              </div>
              <p className="bd-mini">Teachers</p>
              <ul className="dc-o-chips">
                {STAFF.filter((s) => s.room === r.id).map((s) => (
                  <li key={s.id}>
                    <Person name={s.full} size={24} /> {s.name}
                  </li>
                ))}
              </ul>
              <p className="bd-mini">Today</p>
              <p className="bd-hint">
                {(r.id === "caterpillars"
                  ? [
                      "On demand feeding and naps",
                      "10:00 Tummy time",
                      "3:00 Stroller walk",
                    ]
                  : SCHED
                ).join(" · ")}
              </p>
            </Panel>
          );
        })}
      </div>
      <Panel title="Room transfer">
        <form
          className="bd-inline-form dc-o-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            const c = childOf(state.children, mv.child);
            dispatch({ type: "child", id: mv.child, patch: { room: mv.room } });
            dispatch({
              type: "toast",
              text: `${c.name} moved to ${room(mv.room).name}. Teachers and family notified.`,
            });
          }}
        >
          <label className="bd-field">
            <span>Child</span>
            <select
              value={mv.child}
              onChange={(e) => setMv({ ...mv, child: e.target.value })}
            >
              {state.children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {room(c.room).name}
                </option>
              ))}
            </select>
          </label>
          <label className="bd-field">
            <span>Move to</span>
            <select
              value={mv.room}
              onChange={(e) => setMv({ ...mv, room: e.target.value })}
            >
              {ROOMS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="bd-btn bd-btn-sm">
            Move
          </button>
        </form>
      </Panel>
    </>
  );
}

// ---------- 7. Staff ----------
function Staff() {
  const { state, dispatch } = useDaycare();
  const [invite, setInvite] = useState("");
  const [note, setNote] = useState("");
  const PERMS = [
    ["pickup", "Pickup info"],
    ["med", "Record medication"],
    ["msg", "Message families"],
    ["bill", "See billing"],
  ];
  const perms =
    state.perms ??
    Object.fromEntries(
      STAFF.map((s) => [
        s.id,
        {
          pickup: true,
          med: s.med,
          msg: s.role !== "Infant teacher",
          bill: ["joy", "priya"].includes(s.id),
        },
      ]),
    );
  const flip = (id, k) =>
    dispatch({
      type: "set",
      key: "perms",
      value: (p) => ({
        ...(p ?? perms),
        [id]: { ...(p ?? perms)[id], [k]: !(p ?? perms)[id][k] },
      }),
    });
  const decide = (id, status) => {
    dispatch({
      type: "set",
      key: "timeOff",
      value: (l) => l.map((t) => (t.id === id ? { ...t, status } : t)),
    });
    dispatch({
      type: "toast",
      text:
        status === "approved"
          ? "Approved. Coverage needed: Ladybugs, Fri Nov 20."
          : "Declined. A note was sent.",
    });
  };
  return (
    <>
      <Head
        title="Staff"
        sub="Accounts, roles, schedules, certifications and permissions"
      />
      <Panel title="Time-off requests">
        <ul className="bd-plain-list">
          {state.timeOff.map((t) => {
            const s = STAFF.find((x) => x.id === t.staff);
            return (
              <li key={t.id} className="bd-row-between">
                <span>
                  <strong>
                    {s.name} · {t.dates}
                  </strong>
                  <span className="bd-hint">{t.reason}</span>
                </span>
                {t.status === "pending" ? (
                  <span className="bd-row-gap">
                    <button
                      type="button"
                      className="bd-btn bd-btn-xs"
                      onClick={() => decide(t.id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="bd-btn bd-btn-xs bd-btn-ghost"
                      onClick={() => decide(t.id, "declined")}
                    >
                      Decline
                    </button>
                  </span>
                ) : (
                  <Tone tone={t.status === "approved" ? "mint" : "plain"}>
                    {t.status === "approved" ? "Approved" : "Declined"}
                  </Tone>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
      <Panel title="Team">
        <div
          className="bd-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <table className="bd-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Room</th>
                <th scope="col">Now</th>
                <th scope="col">Hours</th>
                <th scope="col">Certifications</th>
                {PERMS.map(([k, l]) => (
                  <th key={k} scope="col">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAFF.map((s) => (
                <tr key={s.id}>
                  <th scope="row">
                    <span className="bd-row-gap">
                      <Person name={s.full} size={26} />
                      <span>
                        {s.full}
                        <span className="bd-hint">{s.role}</span>
                      </span>
                    </span>
                  </th>
                  <td>{s.room ? room(s.room).name : "Office"}</td>
                  <td>
                    <Tone
                      tone={
                        !state.clockedIn[s.id]
                          ? "plain"
                          : state.onBreak[s.id]
                            ? "sun"
                            : "mint"
                      }
                    >
                      {!state.clockedIn[s.id]
                        ? "Off"
                        : state.onBreak[s.id]
                          ? "Break"
                          : "On duty"}
                    </Tone>
                  </td>
                  <td>{s.hours} h</td>
                  <td>
                    {s.certs.map(([n, d, soon]) => (
                      <span key={n} className="bd-hint">
                        {n}:{" "}
                        {soon ? (
                          <strong className="dc-o-soon">expires {d}</strong>
                        ) : (
                          d
                        )}
                      </span>
                    ))}
                  </td>
                  {PERMS.map(([k, l]) => (
                    <td key={k}>
                      <input
                        type="checkbox"
                        className="dc-o-check"
                        checked={!!perms[s.id][k]}
                        onChange={() => flip(s.id, k)}
                        aria-label={`${l} for ${s.full}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Add an employee">
          <form
            className="bd-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!invite.trim()) return;
              dispatch({
                type: "toast",
                text: `Invite sent to ${invite.trim()}. They’ll set up their own sign-in with 2-step verification.`,
              });
              setInvite("");
            }}
          >
            <label className="bd-field">
              <span>Email or mobile</span>
              <input
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                placeholder="newteacher@example.com"
              />
            </label>
            <label className="bd-field">
              <span>Role</span>
              <select defaultValue="Assistant teacher">
                <option>Assistant teacher</option>
                <option>Lead teacher</option>
                <option>Front desk</option>
                <option>Floater</option>
              </select>
            </label>
            <button type="submit" className="bd-btn bd-btn-sm">
              Send invite
            </button>
          </form>
        </Panel>
        <Panel title="Staff announcement">
          <form
            className="bd-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!note.trim()) return;
              dispatch({
                type: "toast",
                text: "Announcement posted to every teacher’s app.",
              });
              setNote("");
            }}
          >
            <label className="bd-field">
              <span>Message to staff</span>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Fire drill Wednesday at 10:00 AM."
              />
            </label>
            <button type="submit" className="bd-btn bd-btn-sm">
              <Icon name="send" size={15} /> Post
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}

// ---------- 8. Billing ----------
function Billing() {
  const { state, dispatch } = useDaycare();
  const [cycle, setCycle] = useState("monthly");
  const [sibling, setSibling] = useState("10");
  const carterOpen = state.invoices.find((i) => i.status === "open");
  const total = (inv) => inv.lines.reduce((t, [, v]) => t + v, 0);
  const balances = [
    ...(carterOpen
      ? [
          {
            id: "carter",
            fam: "Carter family",
            amt: total(carterOpen),
            due: carterOpen.due,
            tone: "sun",
            status: "Due Dec 1",
          },
        ]
      : [
          {
            id: "carter",
            fam: "Carter family",
            amt: 0,
            due: "",
            tone: "mint",
            status: "Paid",
          },
        ]),
    {
      id: "brooks",
      fam: "Brooks family",
      amt: 1120,
      due: "Dec 1",
      tone: "sun",
      status: "Due Dec 1",
    },
    {
      id: "rivera",
      fam: "Rivera family",
      amt: 1262,
      due: "Nov 1",
      tone: "rose",
      status: "15 days late",
    },
    {
      id: "patel",
      fam: "Patel family",
      amt: 0,
      due: "",
      tone: "mint",
      status: "Autopay",
    },
  ];
  const fmt = (m) =>
    cycle === "weekly"
      ? `${money(Math.round((m * 12) / 52))}/wk`
      : `${money(m)}/mo`;
  return (
    <>
      <Head
        title="Tuition & billing"
        sub="Through your connected payment provider · demo, no money moves"
      />
      <div className="bd-kpis">
        <Kpi label="Collected (Nov)" value={money(28410)} />
        <Kpi
          label="Outstanding"
          value={money(balances.reduce((t, b) => t + b.amt, 0))}
          hint={`${balances.filter((b) => b.amt).length} families`}
        />
        <Kpi label="On autopay" value="64%" hint="14 of 22 children" />
        <Kpi label="Late fees (Nov)" value={money(50)} />
      </div>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel
          title="Tuition plans"
          action={
            <span
              className="bd-seg bd-seg-sm"
              role="group"
              aria-label="Billing cycle"
            >
              <button
                type="button"
                aria-pressed={cycle === "monthly"}
                onClick={() => setCycle("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                aria-pressed={cycle === "weekly"}
                onClick={() => setCycle("weekly")}
              >
                Weekly
              </button>
            </span>
          }
        >
          <ul className="bd-plain-list">
            {PLANS.map((p) => (
              <li key={p.room} className="bd-row-between">
                <RoomTag id={p.room} />
                <strong>{fmt(p.monthly)}</strong>
              </li>
            ))}
            <li className="bd-row-between">
              <span>Enrollment fee (one time)</span>
              <strong>{money(150)}</strong>
            </li>
          </ul>
          <div className="bd-form-2">
            <label className="bd-field">
              <span>Sibling discount</span>
              <select
                value={sibling}
                onChange={(e) => setSibling(e.target.value)}
              >
                {["0", "5", "10", "15"].map((v) => (
                  <option key={v} value={v}>
                    {v}% off the older child
                  </option>
                ))}
              </select>
            </label>
            <label className="bd-field">
              <span>Late payment</span>
              <select defaultValue="25">
                <option value="0">No late fee</option>
                <option value="25">$25 after 5 days</option>
                <option value="50">$50 after 10 days</option>
              </select>
            </label>
          </div>
        </Panel>
        <Panel title="Balances">
          <ul className="bd-plain-list">
            {balances.map((b) => (
              <li key={b.id} className="bd-row-between">
                <span>
                  <strong>
                    {b.fam} · {money(b.amt)}
                  </strong>
                  <Tone tone={b.tone}>{b.status}</Tone>
                </span>
                {b.amt ? (
                  <span className="bd-row-gap">
                    <button
                      type="button"
                      className="bd-btn bd-btn-xs bd-btn-soft"
                      onClick={() =>
                        b.id === "carter"
                          ? dispatch({
                              type: "notice",
                              text: `Reminder: your December invoice of ${money(b.amt)} is due Dec 1.`,
                              toast: "Reminder sent to the Carter family.",
                            })
                          : dispatch({
                              type: "toast",
                              text: `Reminder sent to the ${b.fam}.`,
                            })
                      }
                    >
                      Remind
                    </button>
                    <button
                      type="button"
                      className="bd-btn bd-btn-xs bd-btn-ghost"
                      onClick={() => {
                        if (b.id === "carter")
                          dispatch({
                            type: "set",
                            key: "invoices",
                            value: (l) =>
                              l.map((i) =>
                                i.status === "open"
                                  ? {
                                      ...i,
                                      status: "paid",
                                      paidOn:
                                        "Nov 16 · recorded at the front desk",
                                    }
                                  : i,
                              ),
                          });
                        dispatch({
                          type: "toast",
                          text: `Payment of ${money(b.amt)} recorded for the ${b.fam}. Receipt sent.`,
                        });
                      }}
                    >
                      Record payment
                    </button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Invoices & receipts">
        <div
          className="bd-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <table className="bd-table">
            <thead>
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col">Family</th>
                <th scope="col">Period</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.invoices.map((i) => (
                <tr key={i.id}>
                  <th scope="row">{i.id}</th>
                  <td>Carter family</td>
                  <td>{i.period}</td>
                  <td>{money(total(i))}</td>
                  <td>
                    <Tone tone={i.status === "paid" ? "mint" : "sun"}>
                      {i.status === "paid"
                        ? `Paid ${i.paidOn}`
                        : `Due ${i.due}`}
                    </Tone>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-soft"
          onClick={() =>
            downloadCsv("payments", [
              ["Invoice", "Period", "Amount", "Status"],
              ...state.invoices.map((i) => [
                i.id,
                i.period,
                total(i),
                i.status,
              ]),
            ])
          }
        >
          <Icon name="download" size={15} /> Payment report
        </button>
      </Panel>
    </>
  );
}

// ---------- 9. Messages ----------
function Messages() {
  const { state, dispatch } = useDaycare();
  const [to, setTo] = useState("all");
  const [kind, setKind] = useState("Announcement");
  const [when, setWhen] = useState("now");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [draft, setDraft] = useState(false);
  const sent = state.sentMsgs ?? [
    {
      id: "s1",
      title: "Fall festival reminder",
      to: "Everyone",
      sent: 42,
      delivered: 42,
      read: 37,
    },
    {
      id: "s2",
      title: "Butterflies: bring a leaf for art",
      to: "Butterflies",
      sent: 18,
      delivered: 18,
      read: 15,
    },
  ];
  const reachesCarter = ["all", "butterflies", "ladybugs", "carter"].includes(
    to,
  );
  const label =
    to === "all"
      ? "Everyone"
      : to === "carter"
        ? "Carter family"
        : room(to)?.name;
  return (
    <>
      <Head
        title="Family messages"
        sub="Announcements, closures, events and emergencies"
      />
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="New message">
          <form
            className="bd-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              dispatch({
                type: "set",
                key: "announcements",
                value: (l) => [
                  {
                    id: `a${l.length + 10}`,
                    kind: kind === "Announcement" ? "News" : kind,
                    title: title.trim(),
                    text: body.trim(),
                    day: when === "now" ? "Today" : "Tomorrow",
                  },
                  ...l,
                ],
              });
              dispatch({
                type: "set",
                key: "sentMsgs",
                value: (l) => [
                  {
                    id: `s${(l ?? sent).length + 1}`,
                    title: title.trim(),
                    to: label,
                    sent: to === "all" ? 42 : to === "carter" ? 2 : 16,
                    delivered: 0,
                    read: 0,
                    scheduled: when !== "now",
                  },
                  ...(l ?? sent),
                ],
              });
              if (when === "now" && reachesCarter)
                dispatch({
                  type: "notice",
                  text: `${kind === "Emergency" ? "Emergency: " : ""}${title.trim()}${body.trim() ? ` — ${body.trim()}` : ""}`,
                });
              dispatch({
                type: "toast",
                text:
                  when === "now"
                    ? `${kind} sent to ${label}.`
                    : `${kind} scheduled for tomorrow at 7:00 AM.`,
              });
              setTitle("");
              setBody("");
              setDraft(false);
            }}
          >
            <div className="bd-form-2">
              <label className="bd-field">
                <span>Send to</span>
                <select value={to} onChange={(e) => setTo(e.target.value)}>
                  <option value="all">Everyone</option>
                  {ROOMS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} families
                    </option>
                  ))}
                  <option value="carter">Carter family only</option>
                </select>
              </label>
              <label className="bd-field">
                <span>Type</span>
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  {["Announcement", "Closure", "Event", "Emergency"].map(
                    (k) => (
                      <option key={k}>{k}</option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <label className="bd-field">
              <span>Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Early closing Friday"
              />
            </label>
            <label className="bd-field">
              <span>Message</span>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
            {draft ? (
              <p className="bd-hint dc-o-ai">
                AI draft built from your calendar and announcements. Review and
                edit before sending.
              </p>
            ) : null}
            <label className="bd-field">
              <span>When</span>
              <select value={when} onChange={(e) => setWhen(e.target.value)}>
                <option value="now">Send now</option>
                <option value="later">Tomorrow at 7:00 AM</option>
              </select>
            </label>
            <div className="bd-row-gap dc-o-wrap">
              <button
                type="button"
                className="bd-btn bd-btn-sm bd-btn-soft"
                onClick={() => {
                  const ev = state.announcements;
                  setTitle("This week at Bright Burrow");
                  setBody(
                    `Hi families! A few dates to remember: ${ev.map((a) => `${a.title} (${a.text.split(".")[0]})`).join("; ")}. Thank you for a wonderful week!`,
                  );
                  setDraft(true);
                }}
              >
                <Icon name="sparkle" size={15} /> Draft with AI
              </button>
              <button type="submit" className="bd-btn bd-btn-sm">
                <Icon name="send" size={15} />{" "}
                {when === "now" ? "Send" : "Schedule"}
              </button>
            </div>
          </form>
        </Panel>
        <Panel title="Delivery">
          <ul className="bd-plain-list">
            {sent.map((m) => (
              <li key={m.id}>
                <strong>{m.title}</strong>
                <span className="bd-hint">
                  {m.to} ·{" "}
                  {m.scheduled
                    ? "Scheduled"
                    : `${m.sent} sent · ${m.delivered || m.sent} delivered · ${m.read} read`}
                </span>
              </li>
            ))}
          </ul>
          <p className="bd-mini">On the family calendar</p>
          <ul className="bd-plain-list">
            {state.announcements.map((a) => (
              <li key={a.id} className="bd-row-between">
                <span>
                  <strong>{a.title}</strong>
                  <span className="bd-hint">{a.text}</span>
                </span>
                <Tone
                  tone={
                    a.kind === "Closure"
                      ? "coral"
                      : a.kind === "Emergency"
                        ? "rose"
                        : "sky"
                  }
                >
                  {a.kind}
                </Tone>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

// ---------- 10. Reports ----------
function Reports() {
  const { state } = useDaycare();
  const [summary, setSummary] = useState(null);
  const L = LOCATIONS.find((l) => l.id === "south");
  const avg = Math.round(
    (WEEK.reduce((t, w) => t + w.present / w.enrolled, 0) / WEEK.length) * 100,
  );
  const cap = ROOMS.map((r) => [
    r.name,
    Math.round(
      (state.children.filter((c) => c.room === r.id).length / capOf(state, r)) *
        100,
    ),
  ]);
  const fullest = [...cap].sort((a, b) => b[1] - a[1])[0];
  const hours = STAFF.reduce((t, s) => t + s.hours, 0);
  return (
    <>
      <Head title="Reports" sub="South End · sample numbers">
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-soft"
          onClick={() => downloadCsv("attendance", attendanceRows(state))}
        >
          <Icon name="download" size={15} /> Attendance
        </button>
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-soft"
          onClick={() =>
            downloadCsv("enrollment", [
              ["Child", "Room", "Age"],
              ...state.children.map((c) => [c.name, room(c.room).name, c.age]),
            ])
          }
        >
          <Icon name="download" size={15} /> Enrollment
        </button>
      </Head>
      <div className="bd-kpis">
        <Kpi
          label="Active enrollments"
          value={state.children.length}
          hint="+1 since October"
        />
        <Kpi label="Avg. attendance" value={`${avg}%`} hint="last 5 days" />
        <Kpi
          label="Tuition collected"
          value={money(L.collected)}
          hint={`${money(L.outstanding)} outstanding`}
        />
        <Kpi label="Staff hours" value={`${hours} h`} hint="this week" />
      </div>
      <Panel
        title="Summary"
        action={
          <button
            type="button"
            className="bd-btn bd-btn-xs bd-btn-soft"
            onClick={() =>
              setSummary(
                `Enrollment grew from ${ENROLLMENT_TREND[0][1]} in ${ENROLLMENT_TREND[0][0]} to ${ENROLLMENT_TREND.at(-1)[1]} in ${ENROLLMENT_TREND.at(-1)[0]}. Attendance averaged ${avg}% over the last 5 days. ${fullest[0]} is the fullest room at ${fullest[1]}% of capacity. ${money(L.outstanding)} in tuition is outstanding. ${state.incidents.length} incident report${state.incidents.length === 1 ? "" : "s"} this week, ${state.incidents.filter((i) => !i.ack).length} not yet acknowledged by family.`,
              )
            }
          >
            <Icon name="sparkle" size={14} /> AI: summarize trends
          </button>
        }
      >
        {summary ? (
          <p className="dc-o-ai">
            {summary}{" "}
            <span className="bd-hint">
              Drafted only from the numbers on this page. Review before sharing.
            </span>
          </p>
        ) : (
          <p className="bd-sub">
            Get a plain-English summary of the figures below.
          </p>
        )}
      </Panel>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Enrollment trend">
          <Bars data={ENROLLMENT_TREND} label="Enrolled children by month" />
        </Panel>
        <Panel title="Daily attendance">
          <Bars
            data={WEEK.map((w) => [w.day, w.present])}
            label="Children present by day"
          />
        </Panel>
        <Panel title="Capacity used by room">
          <HBars data={cap} fmt={(v) => `${v}%`} max={100} />
        </Panel>
        <Panel title="Engagement & safety">
          <ul className="bd-plain-list">
            <li className="bd-row-between">
              <span>Daily reports opened by families</span>
              <strong>91%</strong>
            </li>
            <li className="bd-row-between">
              <span>Messages answered within 2 hours</span>
              <strong>86%</strong>
            </li>
            <li className="bd-row-between">
              <span>Incident reports this week</span>
              <strong>{state.incidents.length}</strong>
            </li>
            <li className="bd-row-between">
              <span>Waitlist</span>
              <strong>
                {
                  state.applications.filter((a) => a.status === "Waitlist")
                    .length
                }{" "}
                families
              </strong>
            </li>
            <li className="bd-row-between">
              <span>Staff coverage gaps today</span>
              <strong>
                {ROOMS.filter((r) => !ratioText(state, r).ok).length}
              </strong>
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}

// ---------- 11. Compliance ----------
function Compliance() {
  const { state, dispatch } = useDaycare();
  const [gaps, setGaps] = useState(null);
  const [keep, setKeep] = useState("3y");
  const audit = [
    ...state.pickupLog
      .slice(0, 3)
      .map(
        (p) =>
          `${p.staff} approved release of ${childOf(state.children, p.child)?.name} to ${p.by} · ${p.day || "Today"} ${at(p.time)}`,
      ),
    "Ms. Joy viewed Noah B.’s custody order · Today 8:14 AM",
    "Ms. Priya updated Kai E.’s emergency contacts · Fri 4:40 PM",
    "Ms. Rosa downloaded the Butterflies attendance report · Fri 5:02 PM",
  ];
  return (
    <>
      <Head
        title="Documents & compliance"
        sub="Records, expirations, retention and access logs"
      >
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-soft"
          onClick={() =>
            dispatch({
              type: "toast",
              text: "Encrypted export prepared. Download link sent to the director’s email (demo).",
            })
          }
        >
          <Icon name="lock" size={15} /> Secure export
        </button>
      </Head>
      <Panel
        title="Documents"
        action={
          <button
            type="button"
            className="bd-btn bd-btn-xs bd-btn-soft"
            onClick={() =>
              setGaps([
                ...DOCUMENTS.filter(
                  (d) => d.tone === "rose" || d.tone === "peach",
                ).map(
                  (d) => `${d.what} for ${d.who}: ${d.status.toLowerCase()}`,
                ),
                ...state.children
                  .filter((c) => c.allergies.length && !c.care)
                  .map(
                    (c) =>
                      `${c.name} has an allergy (${c.allergies.join(", ")}) but no care plan on file`,
                  ),
              ])
            }
          >
            <Icon name="sparkle" size={14} /> Find missing records
          </button>
        }
      >
        {gaps ? (
          <div className="dc-o-ai">
            <p>
              <strong>{gaps.length} items need attention</strong>{" "}
              <span className="bd-hint">
                Found by checking your records. Review each one.
              </span>
            </p>
            <ul className="bd-plain-list">
              {gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div
          className="bd-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <table className="bd-table">
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">For</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {DOCUMENTS.map((d) => (
                <tr key={d.id}>
                  <th scope="row">{d.what}</th>
                  <td>{d.who}</td>
                  <td>
                    <Tone tone={d.tone === "peach" ? "sun" : d.tone}>
                      {d.status}
                    </Tone>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Retention">
          <label className="bd-field">
            <span>Keep records of former families for</span>
            <select value={keep} onChange={(e) => setKeep(e.target.value)}>
              <option value="1y">1 year after leaving</option>
              <option value="3y">3 years after leaving</option>
              <option value="5y">5 years after leaving</option>
            </select>
          </label>
          <p className="bd-hint">
            Guest verification photos are deleted 30 days after the pickup
            window. Set your periods to match the rules that apply to your
            center.
          </p>
        </Panel>
        <Panel title="Audit log">
          <ul className="bd-plain-list">
            {audit.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

// ---------- 12. Cameras ----------
function Cameras() {
  const { state, dispatch } = useDaycare();
  const cams = state.cameras;
  const [p, setP] = useState({ director: true, teachers: true });
  const [keep, setKeep] = useState("14");
  const setRoom = (id) =>
    dispatch({
      type: "camera",
      patch: { rooms: { ...cams.rooms, [id]: !cams.rooms[id] } },
    });
  return (
    <>
      <Head title="Cameras" sub="For compatible existing camera systems" />
      <p className="dc-o-banner">
        <Icon name="alert" size={18} />
        <span>
          Camera features need a separate security, privacy, compatibility and
          legal review before setup. These are sample illustrations, not live
          video.
        </span>
      </p>
      <div className="dc-o-cams">
        {ROOMS.map((r) => (
          <figure key={r.id} className="dc-o-cam">
            <CamScene roomId={r.id} />
            <figcaption>
              <span>
                <strong>{r.name}</strong> · Sample feed
              </span>
              <span
                className={`bd-status dc-tone-${cams.parents && cams.rooms[r.id] ? "sky" : "mint"}`}
              >
                {cams.parents && cams.rooms[r.id]
                  ? "Parents can view"
                  : "Staff only"}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="bd-a-grid bd-a-grid-2">
        <Panel title="Who can view">
          <Toggle
            on={p.director}
            onChange={() => setP({ ...p, director: !p.director })}
            label="Director"
            hint="All approved rooms"
          />
          <Toggle
            on={p.teachers}
            onChange={() => setP({ ...p, teachers: !p.teachers })}
            label="Teachers"
            hint="Their own classroom only"
          />
          <Toggle
            on={cams.parents}
            onChange={() =>
              dispatch({
                type: "camera",
                patch: { parents: !cams.parents },
                toast: cams.parents
                  ? "Parent viewing turned off. The parent app no longer shows feeds."
                  : "Parent viewing on. Parents see their own child’s room while the child is checked in.",
              })
            }
            label="Parents"
            hint="Off by default. Only where permitted."
          />
          <p className="bd-hint">
            Bathrooms and diaper-changing areas can never be viewed.
          </p>
        </Panel>
        <Panel title="Rooms open to parents">
          {ROOMS.map((r) => (
            <Toggle
              key={r.id}
              on={cams.rooms[r.id]}
              onChange={() => setRoom(r.id)}
              label={r.name}
              hint={
                cams.parents
                  ? "Parents of children in this room"
                  : "Applies once parent viewing is on"
              }
            />
          ))}
          <p className="bd-hint">
            Parent viewing hours: {at(cams.from)} – {at(cams.to)}. Feeds only
            open while the parent’s child is checked in.
          </p>
        </Panel>
        <Panel title="Storage & access log" className="bd-span2">
          <label className="bd-field">
            <span>Keep recordings for</span>
            <select value={keep} onChange={(e) => setKeep(e.target.value)}>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </label>
          <ul className="bd-plain-list">
            {state.camLog.map((l) => (
              <li key={l.id}>
                {l.who} {l.what} · {l.when}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

// ---------- 13. Settings ----------
function Settings() {
  const { dispatch } = useDaycare();
  const [s, setS] = useState({
    pin: true,
    qr: true,
    health: true,
    guardianAuth: true,
    coParent: true,
    photos: false,
    push: true,
    email: true,
    sms: false,
    twoStep: true,
    confirm: true,
  });
  const flip = (k) => setS({ ...s, [k]: !s[k] });
  return (
    <>
      <Head
        title="Center settings"
        sub="Applies to check-in, pickups, family access and staff accounts"
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
        <Panel title="Hours & closures">
          <ul className="bd-plain-list">
            <li className="bd-row-between">
              <strong>Mon – Fri</strong>{" "}
              <span className="bd-sub">7:00 AM – 6:00 PM</span>
            </li>
            <li className="bd-row-between">
              <strong>Thanksgiving</strong>{" "}
              <span className="bd-sub">Closed Nov 26–27</span>
            </li>
            <li className="bd-row-between">
              <strong>Winter break</strong>{" "}
              <span className="bd-sub">Closed Dec 24 – Jan 1</span>
            </li>
          </ul>
        </Panel>
        <Panel title="Check-in & checkout">
          <Toggle
            on={s.pin}
            onChange={() => flip("pin")}
            label="Guardian PIN at the tablet"
          />
          <Toggle
            on={s.qr}
            onChange={() => flip("qr")}
            label="QR pass from the parent app"
          />
          <Toggle
            on={s.health}
            onChange={() => flip("health")}
            label="Ask about health changes at drop-off"
          />
        </Panel>
        <Panel title="Guardian permissions">
          <Toggle
            on={s.guardianAuth}
            onChange={() => flip("guardianAuth")}
            label="Guardians can add guest pickups"
            hint="Verified parents only, never custody-restricted adults"
          />
          <Toggle
            on={s.coParent}
            onChange={() => flip("coParent")}
            label="Both guardians see the daily report"
          />
          <Toggle
            on={s.photos}
            onChange={() => flip("photos")}
            label="Share photos by default"
            hint="Off until each family opts in"
          />
        </Panel>
        <Panel title="Notifications">
          <Toggle
            on={s.push}
            onChange={() => flip("push")}
            label="App notifications"
          />
          <Toggle
            on={s.email}
            onChange={() => flip("email")}
            label="Email summaries"
          />
          <Toggle
            on={s.sms}
            onChange={() => flip("sms")}
            label="Text messages"
            hint="Message charges may apply"
          />
        </Panel>
        <Panel title="Security" className="bd-span2">
          <Toggle
            on={s.twoStep}
            onChange={() => flip("twoStep")}
            label="2-step sign-in for all staff"
          />
          <Toggle
            on={s.confirm}
            onChange={() => flip("confirm")}
            label="Re-confirm identity for sensitive actions"
            hint="Releasing a child, changing custody notes, exporting records"
          />
          <p className="bd-mini">Recent sign-ins</p>
          <ul className="bd-plain-list">
            <li>Ms. Joy · Today 7:31 AM · office computer</li>
            <li>Ms. Priya · Today 6:58 AM · front desk tablet</li>
            <li>
              Mr. Andre · Sun 9:12 PM · new phone · confirmed by text code
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}

// ---------- 14. Requests ----------
function Requests() {
  const { state, dispatch } = useDaycare();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState("");
  const list = state.requests ?? [
    {
      id: "r1",
      title: "Bus arrival and departure tracking",
      status: "In progress",
      body: "Log the after-school van drop-off with driver name and time.",
      reply: "Building the driver check-in screen. Preview next week.",
    },
    {
      id: "r2",
      title: "Two-person approval for unexpected pickups",
      status: "Shipped",
      body: "Require a second staff member to confirm.",
      reply: "Live now. Turn it on in Pickups → Verification rules.",
    },
  ];
  const tone = {
    Submitted: "sun",
    Reviewing: "lilac",
    "In progress": "sky",
    Shipped: "mint",
  };
  return (
    <>
      <Head title="Feature requests" sub="Your system grows with your center" />
      <Panel title="Made for how you work">
        <ul className="bd-custom-list">
          {[
            "Specialized pickup procedures",
            "Classroom-specific reports",
            "Special learning programs",
            "Custom parent forms",
            "Transportation tracking",
            "After-school programs",
            "Custom billing",
            "Special care schedules",
            "Custom staff permissions",
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
                    id: `r${(l ?? list).length + 1}`,
                    title: title.trim(),
                    body: body.trim() || "No details yet.",
                    status: "Submitted",
                    reply:
                      "Thanks! We’ll review this and reply within 2 business days.",
                    file,
                  },
                  ...(l ?? list),
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
                placeholder="Field trip permission slips"
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
            {list.map((r) => (
              <li key={r.id}>
                <span className="bd-row-between">
                  <strong>{r.title}</strong>
                  <Tone tone={tone[r.status]}>{r.status}</Tone>
                </span>
                <span className="bd-sub">{r.body}</span>
                {r.file ? (
                  <span className="bd-hint">Attached: {r.file}</span>
                ) : null}
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
  const { state } = useDaycare();
  const [view, setView] = useState("dash");
  const [loc, setLoc] = useState("south");
  const go = (v) => {
    setView(v);
    if (typeof document !== "undefined")
      document.querySelector(".bd.dc .bd-a-main")?.scrollTo({ top: 0 });
  };
  const counts = {
    dash: state.alerts.length,
    pickups: state.guests.filter((g) => g.status === "invited").length,
    enroll: state.applications.filter((a) => a.status === "New").length,
    staff: state.timeOff.filter((t) => t.status === "pending").length,
  };
  const remote = loc !== "south" && view !== "dash";
  return (
    <BrowserFrame label="Owner dashboard" url={`${CENTER.url}/admin`}>
      <div className="bd-admin">
        <nav className="bd-a-side" aria-label="Owner dashboard">
          <div className="bd-a-brand">
            <span className="dc-logo">B</span>
            <span className="bd-serif">{CENTER.short}</span>
          </div>
          <label className="dc-o-loc">
            <span className="bd-sr">Location</span>
            <Icon name="pin" size={15} />
            <select
              className="bd-select-sm"
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
            >
              {LOCATIONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
              <option value="all">All locations</option>
            </select>
          </label>
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
          {remote ? (
            <p className="dc-o-banner">
              <Icon name="pin" size={16} />
              <span>
                Showing South End details. Other locations keep their own
                records; switch the location to South End to edit live data, or
                open Dashboard for{" "}
                {loc === "all" ? "consolidated totals" : "University’s summary"}
                .
              </span>
            </p>
          ) : null}
          {view === "dash" && <Dashboard go={go} loc={loc} />}
          {view === "attend" && <Attendance />}
          {view === "pickups" && <Pickups />}
          {view === "enroll" && <Enrollment />}
          {view === "families" && <Families />}
          {view === "rooms" && <Classrooms />}
          {view === "staff" && <Staff />}
          {view === "billing" && <Billing />}
          {view === "msgs" && <Messages />}
          {view === "reports" && <Reports />}
          {view === "comply" && <Compliance />}
          {view === "cams" && <Cameras />}
          {view === "settings" && <Settings />}
          {view === "req" && <Requests />}
        </div>
      </div>
    </BrowserFrame>
  );
}
