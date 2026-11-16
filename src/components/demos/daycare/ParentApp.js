"use client";

import { useState } from "react";
import { FAMILIES, KINDS, NOW, STAFF, TODAY, at, room } from "./data";
import { useDaycare } from "./store";
import {
  ArtTile,
  CamScene,
  ChildStatus,
  FakeQr,
  Icon,
  Kid,
  KindIcon,
  Person,
  PhoneFrame,
  RoomTag,
  Sheet,
  Toggle,
  money,
} from "./ui";
import "./parent.css";

const MINE = ["maya", "eli"];
const ME = "Danielle Carter";
const teachersOf = (roomId) => STAFF.filter((s) => s.room === roomId);
const invoiceTotal = (inv) => inv.lines.reduce((t, [, v]) => t + v, 0);

function KidSwitch({ kid, setKid, kids }) {
  return (
    <div className="dc-p-switch" role="group" aria-label="Child">
      {kids.map((c) => (
        <button
          key={c.id}
          type="button"
          aria-pressed={kid === c.id}
          onClick={() => setKid(c.id)}
        >
          <Kid child={c} size={30} />
          {c.first}
        </button>
      ))}
    </div>
  );
}

function Notices({ onClose }) {
  const { state } = useDaycare();
  return (
    <Sheet title="Notifications" onClose={onClose}>
      <ul className="dc-p-notices">
        {state.notices.map((n) => (
          <li key={n.id}>
            <Icon name="bell" size={16} />
            <span>
              {n.text}
              <span className="bd-hint">{at(n.time)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

function NoticeForm({ kind, kids, onClose }) {
  const { dispatch } = useDaycare();
  const [who, setWho] = useState(kids.map((k) => k.id));
  const [when, setWhen] = useState(
    kind === "absent"
      ? "Tue, Nov 17"
      : kind === "vacation"
        ? "Dec 21 – Dec 24"
        : "Today",
  );
  const [time, setTime] = useState(kind === "late" ? "10:00 AM" : "3:00 PM");
  const [note, setNote] = useState("");
  const titles = {
    absent: "Report an absence",
    late: "Running late",
    early: "Early pickup",
    vacation: "Vacation notice",
  };
  return (
    <Sheet title={titles[kind]} onClose={onClose}>
      <div className="bd-wrapchips" role="group" aria-label="Which children">
        {kids.map((k) => (
          <button
            key={k.id}
            type="button"
            className="bd-chip"
            aria-pressed={who.includes(k.id)}
            onClick={() =>
              setWho((w) =>
                w.includes(k.id) ? w.filter((x) => x !== k.id) : [...w, k.id],
              )
            }
          >
            {k.first}
          </button>
        ))}
      </div>
      <div className="bd-form-2 dc-p-gap">
        <label className="bd-field">
          <span>{kind === "vacation" ? "Dates" : "Day"}</span>
          <select value={when} onChange={(e) => setWhen(e.target.value)}>
            {(kind === "vacation"
              ? ["Dec 21 – Dec 24", "Dec 28 – Dec 31", "Jan 4 – Jan 8"]
              : ["Today", "Tue, Nov 17", "Wed, Nov 18", "Thu, Nov 19"]
            ).map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        {kind === "late" || kind === "early" ? (
          <label className="bd-field">
            <span>{kind === "late" ? "Arriving around" : "Pickup at"}</span>
            <select value={time} onChange={(e) => setTime(e.target.value)}>
              {[
                "9:30 AM",
                "10:00 AM",
                "11:00 AM",
                "1:00 PM",
                "2:00 PM",
                "3:00 PM",
                "4:00 PM",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <label className="bd-field dc-p-gap">
        <span>Note for the teacher (optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            kind === "absent"
              ? "Mild cold, keeping home to rest"
              : "Anything we should know"
          }
        />
      </label>
      <button
        type="button"
        className="bd-btn bd-btn-block dc-p-gap"
        disabled={!who.length}
        onClick={() => {
          const names = kids
            .filter((k) => who.includes(k.id))
            .map((k) => k.first)
            .join(" and ");
          const what = {
            absent: `will be absent ${when}`,
            late: `is arriving late ${when.toLowerCase()} around ${time}`,
            early: `will be picked up early ${when.toLowerCase()} at ${time}`,
            vacation: `will be on vacation ${when}`,
          }[kind];
          dispatch({
            type: "alert",
            kind: "late",
            text: `${ME}: ${names} ${what}.${note ? ` “${note}”` : ""}`,
            toast: "Sent. The teachers and front desk can see it.",
          });
          onClose();
        }}
      >
        Send to the center
      </button>
    </Sheet>
  );
}

// ---------- Classroom camera ----------
// Parents only see their own child's room, when the owner allows it, during viewing hours,
// while the child is checked in. Every view is logged for the center.
function camAccess(state, child) {
  const cams = state.cameras;
  const r = room(child.room);
  if (!cams.parents)
    return { ok: false, why: "Your center hasn’t turned on parent viewing." };
  if (!cams.rooms[child.room])
    return {
      ok: false,
      why: `${r.name} isn’t open for parent viewing right now.`,
    };
  if (NOW < cams.from || NOW > cams.to)
    return {
      ok: false,
      why: `Viewing is open ${at(cams.from)} – ${at(cams.to)}.`,
    };
  if (child.status !== "in")
    return {
      ok: false,
      why: `Live view opens while ${child.first} is checked in.`,
    };
  return { ok: true };
}

function LiveCard({ child }) {
  const { state, dispatch } = useDaycare();
  const [open, setOpen] = useState(false);
  const r = room(child.room);
  const access = camAccess(state, child);
  return (
    <>
      <div className={`bd-card dc-p-cam${access.ok ? "" : " is-off"}`}>
        <div className="dc-p-cam-thumb">
          <CamScene roomId={child.room} />
          {access.ok ? (
            <span className="dc-p-live">
              <span aria-hidden="true" /> Live
            </span>
          ) : (
            <span className="dc-p-cam-lock" aria-hidden="true">
              <Icon name="lock" size={20} />
            </span>
          )}
        </div>
        <div className="dc-p-cam-text">
          <strong>{r.name} camera</strong>
          <span className="bd-hint">
            {access.ok ? `Watch ${child.first}’s classroom` : access.why}
          </span>
        </div>
        {access.ok ? (
          <button
            type="button"
            className="bd-btn bd-btn-sm"
            onClick={() => {
              dispatch({
                type: "camView",
                who: "Danielle Carter",
                room: r.name,
              });
              setOpen(true);
            }}
          >
            Watch
          </button>
        ) : null}
      </div>
      {open ? (
        <Sheet title={`${r.name} · Live`} onClose={() => setOpen(false)}>
          <div className="dc-p-feed-view">
            <CamScene
              roomId={child.room}
              label={`${r.name} classroom, sample feed (illustration, not real video)`}
            />
            <span className="dc-p-live">
              <span aria-hidden="true" /> Live · {at(NOW)}
            </span>
          </div>
          <p className="bd-hint">
            Sample feed. In a real setup this is the center’s own camera system.
          </p>
          <ul className="dc-p-camrules">
            <li>
              <Icon name="shield" size={15} /> Only {r.name}, while{" "}
              {child.first} is checked in
            </li>
            <li>
              <Icon name="lock" size={15} /> Bathrooms and changing areas are
              never shown
            </li>
            <li>
              <Icon name="file" size={15} /> Viewing is logged. Please don’t
              record or share.
            </li>
            <li>
              <Icon name="clock" size={15} /> Open {at(state.cameras.from)} –{" "}
              {at(state.cameras.to)}
            </li>
          </ul>
        </Sheet>
      ) : null}
    </>
  );
}

// ---------- Home ----------
function Home({ kid, setKid, go }) {
  const { state, dispatch } = useDaycare();
  const [bell, setBell] = useState(false);
  const [form, setForm] = useState(null);
  const [incident, setIncident] = useState(null);
  const kids = state.children.filter((c) => MINE.includes(c.id));
  const c = kids.find((k) => k.id === kid);
  const last = [...state.logs]
    .filter((l) => l.child === kid)
    .sort((a, b) => b.time - a.time)[0];
  const openIncidents = state.incidents.filter(
    (i) => MINE.includes(i.child) && !i.ack,
  );
  const guests = state.guests.filter(
    (g) => g.by === ME && g.date === TODAY && !["revoked"].includes(g.status),
  );
  return (
    <div className="bd-c-pad">
      <div className="bd-c-hello">
        <div>
          <p className="bd-eyebrow">Bright Burrow</p>
          <h3 className="bd-serif bd-c-h">Hi Danielle</h3>
        </div>
        <button
          type="button"
          className="bd-icon-btn is-dot"
          aria-label={`Notifications (${state.notices.length})`}
          onClick={() => setBell(true)}
        >
          <Icon name="bell" size={20} />
        </button>
      </div>
      <KidSwitch kid={kid} setKid={setKid} kids={kids} />

      <div className={`bd-card dc-p-child dc-p-child-${room(c.room).tone}`}>
        <div className="dc-p-child-top">
          <Kid child={c} size={56} />
          <span>
            <strong className="bd-serif">{c.first}</strong>
            <RoomTag id={c.room} />
            <span className="bd-hint">
              with{" "}
              {teachersOf(c.room)
                .map((t) => t.name)
                .join(" & ")}
            </span>
          </span>
        </div>
        <ChildStatus child={c} />
        <p className="dc-p-status">
          {c.status === "out"
            ? `Picked up by ${c.outBy} at ${at(c.outAt)}.`
            : c.napping
              ? "Napping right now."
              : c.status === "in"
                ? `Checked in at ${at(c.inAt)} by ${c.inBy}.`
                : "Not checked in yet."}
        </p>
        {last ? (
          <button type="button" className="dc-p-last" onClick={() => go("day")}>
            <KindIcon kind={last.kind} size={30} />
            <span>
              <strong>{last.text}</strong>
              <span className="bd-hint">
                {at(last.time)} · {last.detail}
              </span>
            </span>
            <Icon name="arrow" size={16} />
          </button>
        ) : null}
      </div>

      <LiveCard child={c} />

      {openIncidents.map((i) => (
        <div key={i.id} className="bd-card dc-p-incident">
          <span
            className="dc-kind dc-tone-coral"
            aria-hidden="true"
            style={{ width: 34, height: 34 }}
          >
            <Icon name="alert" size={17} />
          </span>
          <span>
            <strong>
              Incident report for{" "}
              {state.children.find((k) => k.id === i.child).first}
            </strong>
            <span className="bd-hint">
              {at(i.time)} · {i.where} · please review
            </span>
          </span>
          <button
            type="button"
            className="bd-btn bd-btn-sm"
            onClick={() => setIncident(i)}
          >
            Review
          </button>
        </div>
      ))}

      {guests.map((g) => (
        <button
          key={g.id}
          type="button"
          className="bd-card dc-p-guestcard"
          onClick={() => go("pickup")}
        >
          <Person name={g.name} size={36} tone="sun" photo={g.photo} />
          <span>
            <strong>
              {g.name} · {at(g.from)}–{at(g.to)}
            </strong>
            <span className="bd-hint">
              {g.status === "invited"
                ? "Waiting for them to verify"
                : g.status === "verified"
                  ? "Verified · pickup pass ready"
                  : g.status === "used"
                    ? "Picked up"
                    : g.status}
            </span>
          </span>
          <Icon name="arrow" size={16} />
        </button>
      ))}

      <p className="bd-c-label">Let the center know</p>
      <div className="bd-tech-tools">
        <button
          type="button"
          className="bd-tool"
          onClick={() => setForm("late")}
        >
          <Icon name="clock" /> Running late
        </button>
        <button
          type="button"
          className="bd-tool"
          onClick={() => setForm("early")}
        >
          <Icon name="door" /> Early pickup
        </button>
        <button
          type="button"
          className="bd-tool"
          onClick={() => setForm("absent")}
        >
          <Icon name="moon" /> Absence
        </button>
        <button
          type="button"
          className="bd-tool"
          onClick={() => setForm("vacation")}
        >
          <Icon name="sun" /> Vacation
        </button>
      </div>

      <p className="bd-c-label">News & events</p>
      {state.announcements.slice(0, 3).map((a) => (
        <div key={a.id} className="bd-card dc-p-news">
          <span
            className={`bd-status dc-tone-${a.kind === "Closure" ? "coral" : a.kind === "Emergency" ? "rose" : "sky"}`}
          >
            {a.kind}
          </span>
          <strong>{a.title}</strong>
          <span className="bd-sub">{a.text}</span>
        </div>
      ))}

      {bell ? <Notices onClose={() => setBell(false)} /> : null}
      {form ? (
        <NoticeForm kind={form} kids={kids} onClose={() => setForm(null)} />
      ) : null}
      {incident ? (
        <Sheet title="Incident report" onClose={() => setIncident(null)}>
          <dl className="bd-dl bd-dl-tight">
            <div>
              <dt>Child</dt>
              <dd>
                {state.children.find((k) => k.id === incident.child).name}
              </dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>
                {TODAY} · {at(incident.time)}
              </dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>{incident.where}</dd>
            </div>
            <div>
              <dt>Staff</dt>
              <dd>
                {incident.staff}
                {incident.witness ? `, witnessed by ${incident.witness}` : ""}
              </dd>
            </div>
          </dl>
          <p className="dc-p-report">{incident.what}</p>
          <button
            type="button"
            className="bd-btn bd-btn-block"
            onClick={() => {
              dispatch({ type: "ack", id: incident.id });
              setIncident(null);
            }}
          >
            I’ve read this report
          </button>
          <button
            type="button"
            className="bd-btn bd-btn-ghost bd-btn-block dc-p-gap"
            onClick={() => {
              setIncident(null);
              go("messages");
            }}
          >
            Message the teacher
          </button>
        </Sheet>
      ) : null}
    </div>
  );
}

// ---------- Daily report ----------
const HISTORY = {
  "Fri, Nov 13": {
    maya: "Painted pumpkins, ate most of lunch, rested 1 hr 10 min. Happy all day.",
    eli: "Napped 1 hr 45 min, ate all of lunch, 4 diapers. Loved bubble time.",
  },
  "Thu, Nov 12": {
    maya: "Library visit, ate all of lunch, rested 55 min. Shared toys nicely.",
    eli: "Napped 2 hrs, ate some lunch, 5 diapers. Practised walking up the ramp.",
  },
};

function Day({ kid, setKid }) {
  const { state } = useDaycare();
  const [day, setDay] = useState(TODAY);
  const kids = state.children.filter((c) => MINE.includes(c.id));
  const c = kids.find((k) => k.id === kid);
  const logs = state.logs
    .filter((l) => l.child === kid)
    .sort((a, b) => a.time - b.time);
  const meals = logs.filter((l) => l.kind === "meal");
  const nap = logs.filter((l) => l.kind === "nap").slice(-1)[0];
  const diapers = logs.filter(
    (l) => l.kind === "diaper" || l.kind === "potty",
  ).length;
  const mood = logs.filter((l) => l.kind === "mood").slice(-1)[0];
  return (
    <div className="bd-c-pad">
      <h3 className="bd-serif bd-c-h">{c.first}’s day</h3>
      <KidSwitch kid={kid} setKid={setKid} kids={kids} />
      <div className="bd-scrollchips" role="group" aria-label="Day">
        {[TODAY, ...Object.keys(HISTORY)].map((d) => (
          <button
            key={d}
            type="button"
            className="bd-chip"
            aria-pressed={day === d}
            onClick={() => setDay(d)}
          >
            {d === TODAY ? "Today" : d}
          </button>
        ))}
      </div>
      {day !== TODAY ? (
        <div className="bd-card dc-p-summary">
          <p className="bd-eyebrow">End-of-day summary · {day}</p>
          <p>{HISTORY[day][kid]}</p>
          <span className="bd-hint">
            Sent by {teachersOf(c.room)[0].name} at 4:45 PM
          </span>
        </div>
      ) : (
        <>
          <div className="dc-p-tiles">
            <div className="dc-tone-sun">
              <Icon name="meal" size={18} />
              <strong>{meals.length}</strong>
              <span>meals & snacks</span>
            </div>
            <div className="dc-tone-lilac">
              <Icon name="moon" size={18} />
              <strong>
                {nap
                  ? nap.open
                    ? "Now"
                    : nap.detail.match(/(\d+) min/)?.[1]
                      ? `${nap.detail.match(/(\d+) min/)[1]}m`
                      : "Done"
                  : "—"}
              </strong>
              <span>{nap?.open ? `asleep since ${at(nap.time)}` : "nap"}</span>
            </div>
            <div className="dc-tone-sky">
              <Icon name="drop" size={18} />
              <strong>{diapers}</strong>
              <span>{c.room === "butterflies" ? "bathroom" : "diapers"}</span>
            </div>
            <div className="dc-tone-mint">
              <Icon name="smile" size={18} />
              <strong>{mood ? mood.detail.split(" ")[0] : "—"}</strong>
              <span>mood</span>
            </div>
          </div>
          <ol className="dc-p-feed">
            {[...logs].reverse().map((l) => (
              <li key={l.id} className={`is-${l.kind}`}>
                <KindIcon kind={l.kind} size={34} />
                <div>
                  <span className="dc-p-feed-top">
                    <strong>{l.text}</strong>
                    <span className="bd-hint">{at(l.time)}</span>
                  </span>
                  <span className="bd-sub">{l.detail}</span>
                  {l.kind === "photo" || l.art ? (
                    l.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.photo} alt={l.text} className="dc-art" />
                    ) : (
                      <ArtTile
                        art={l.art || "leaves"}
                        label={`${l.text} (illustration standing in for a classroom photo)`}
                      />
                    )
                  ) : null}
                  <span className="bd-hint">
                    {KINDS[l.kind]?.label} · {l.by}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          {logs.some((l) => l.text === "End-of-day summary") ? null : (
            <p className="bd-hint">
              The end-of-day summary arrives after pickup, written by{" "}
              {teachersOf(c.room)[0].name}.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ---------- Messages ----------
function Messages() {
  const { state, dispatch } = useDaycare();
  const [open, setOpen] = useState(null);
  const [text, setText] = useState("");
  const [prefs, setPrefs] = useState({
    activity: true,
    photos: true,
    news: true,
    email: false,
  });
  if (open) {
    const t = state.threads[open];
    return (
      <div className="bd-c-pad dc-p-thread">
        <div className="bd-c-booktop">
          <button
            type="button"
            className="bd-icon-btn"
            aria-label="Back to messages"
            onClick={() => setOpen(null)}
          >
            <Icon name="back" size={18} />
          </button>
          <h3 className="bd-serif bd-c-h">{t.with.split(" · ")[0]}</h3>
        </div>
        <div className="bd-sms">
          {t.messages.map((m, i) => (
            <p key={i} className={m.from === "me" ? "bd-sms-out" : "bd-sms-in"}>
              {m.text}
            </p>
          ))}
        </div>
        <form
          className="bd-inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            dispatch({
              type: "message",
              thread: open,
              from: "me",
              text: text.trim(),
              toast: "Sent.",
            });
            setText("");
          }}
        >
          <label className="bd-field">
            <span className="bd-sr">Message</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message"
            />
          </label>
          <button type="submit" className="bd-btn bd-btn-sm" aria-label="Send">
            <Icon name="send" size={16} />
          </button>
        </form>
      </div>
    );
  }
  return (
    <div className="bd-c-pad">
      <h3 className="bd-serif bd-c-h">Messages</h3>
      {Object.entries(state.threads).map(([id, t]) => (
        <button
          key={id}
          type="button"
          className="bd-card dc-p-threadrow"
          onClick={() => setOpen(id)}
        >
          <Person
            name={t.with.split(" · ")[0]}
            size={40}
            tone={id === "teacher" ? "lilac" : "sun"}
          />
          <span>
            <strong>{t.with}</strong>
            <span className="bd-hint">
              {t.messages[t.messages.length - 1].text}
            </span>
          </span>
        </button>
      ))}
      <p className="bd-c-label">Notify me about</p>
      <div className="bd-card">
        <Toggle
          on
          onChange={() =>
            dispatch({
              type: "toast",
              text: "Check-in, pickup and emergency alerts are always on.",
            })
          }
          label="Check-in, pickup & emergencies"
          hint="Always on for safety"
        />
        <Toggle
          on={prefs.activity}
          onChange={() => setPrefs({ ...prefs, activity: !prefs.activity })}
          label="Meals, naps & activities"
        />
        <Toggle
          on={prefs.photos}
          onChange={() => setPrefs({ ...prefs, photos: !prefs.photos })}
          label="New photos"
        />
        <Toggle
          on={prefs.news}
          onChange={() => setPrefs({ ...prefs, news: !prefs.news })}
          label="Announcements & events"
        />
        <Toggle
          on={prefs.email}
          onChange={() => setPrefs({ ...prefs, email: !prefs.email })}
          label="Also send by email"
        />
      </div>
    </div>
  );
}

// ---------- Pickup ----------
const STATUS = {
  invited: ["Waiting for them to verify", "sun"],
  verified: ["Verified · pass ready", "mint"],
  used: ["Used", "plain"],
  revoked: ["Revoked", "rose"],
  expired: ["Expired", "plain"],
};

function AuthorizeForm({ onClose, goTo }) {
  const { dispatch } = useDaycare();
  const [f, setF] = useState({
    children: ["maya"],
    name: "",
    relation: "Grandparent",
    phone: "",
    email: "",
    date: "Tue, Nov 17",
    from: 900,
    to: 1050,
    type: "One-time",
    notes: "",
  });
  const set = (patch) => setF({ ...f, ...patch });
  const times = [750, 810, 840, 900, 930, 960, 990, 1020, 1050, 1080];
  const ok =
    f.children.length &&
    f.name.trim().split(" ").length >= 2 &&
    f.phone.replace(/\D/g, "").length >= 10 &&
    f.to > f.from;
  return (
    <Sheet title="Authorize someone else" onClose={onClose}>
      <p className="bd-sub">
        They’ll get a secure invite to verify who they are before they get a
        pickup pass.
      </p>
      <p className="bd-mini">Who are they picking up?</p>
      <div className="bd-wrapchips" role="group" aria-label="Children">
        {[
          ["maya", "Maya"],
          ["eli", "Eli"],
        ].map(([id, n]) => (
          <button
            key={id}
            type="button"
            className="bd-chip"
            aria-pressed={f.children.includes(id)}
            onClick={() =>
              set({
                children: f.children.includes(id)
                  ? f.children.filter((x) => x !== id)
                  : [...f.children, id],
              })
            }
          >
            {n}
          </button>
        ))}
      </div>
      <div className="dc-p-form">
        <label className="bd-field">
          <span>Full name</span>
          <input
            value={f.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="First and last name"
            autoComplete="off"
          />
        </label>
        <div className="bd-form-2">
          <label className="bd-field">
            <span>Relationship</span>
            <select
              value={f.relation}
              onChange={(e) => set({ relation: e.target.value })}
            >
              {[
                "Grandparent",
                "Aunt or uncle",
                "Family friend",
                "Babysitter",
                "Neighbor",
                "Other caregiver",
              ].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="bd-field">
            <span>Mobile</span>
            <input
              value={f.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="(704) 555-0100"
              inputMode="tel"
              autoComplete="off"
            />
          </label>
        </div>
        <label className="bd-field">
          <span>Email (optional)</span>
          <input
            value={f.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="name@example.com"
            inputMode="email"
            autoComplete="off"
          />
        </label>
        <div className="bd-seg bd-seg-sm" role="group" aria-label="How often">
          {["One-time", "Recurring"].map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={f.type === t}
              onClick={() => set({ type: t })}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="bd-form-2">
          <label className="bd-field">
            <span>{f.type === "One-time" ? "Date" : "Starting"}</span>
            <select
              value={f.date}
              onChange={(e) => set({ date: e.target.value })}
            >
              {[TODAY, "Tue, Nov 17", "Wed, Nov 18", "Fri, Nov 20"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="bd-field">
            <span>Between</span>
            <select
              value={f.from}
              onChange={(e) => set({ from: Number(e.target.value) })}
            >
              {times.slice(0, -1).map((t) => (
                <option key={t} value={t}>
                  {at(t)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="bd-field">
          <span>And</span>
          <select
            value={f.to}
            onChange={(e) => set({ to: Number(e.target.value) })}
          >
            {times.slice(1).map((t) => (
              <option key={t} value={t}>
                {at(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="bd-field">
          <span>Instructions for staff (optional)</span>
          <input
            value={f.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Car seat is in their car"
          />
        </label>
      </div>
      <p className="bd-policy">
        <Icon name="shield" size={18} />
        <span>
          A code alone never releases your child. Staff compare the person with
          their photo and check ID. You can revoke this any time.
        </span>
      </p>
      <button
        type="button"
        className="bd-btn bd-btn-block dc-p-gap"
        disabled={!ok}
        onClick={() => {
          dispatch({
            type: "addGuest",
            guest: {
              children: f.children,
              name: f.name.trim(),
              relation: f.relation,
              phone: f.phone,
              email: f.email,
              date: f.date,
              from: f.from,
              to: f.to,
              type: f.type,
              notes: f.notes,
            },
          });
          onClose();
          goTo("guest");
        }}
      >
        Send secure invite
      </button>
      {!ok ? (
        <p className="bd-hint">
          Add their full name, a 10-digit mobile number and a valid time window.
        </p>
      ) : null}
    </Sheet>
  );
}

function Pickup({ goTo }) {
  const { state, dispatch } = useDaycare();
  const [add, setAdd] = useState(false);
  const [qr, setQr] = useState(false);
  const fam = FAMILIES.carter;
  const mine = state.guests.filter((g) => g.by === ME);
  const history = state.pickupLog.filter((p) => MINE.includes(p.child));
  return (
    <div className="bd-c-pad">
      <div className="bd-c-hello">
        <h3 className="bd-serif bd-c-h">Pickup</h3>
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-soft"
          onClick={() => setQr(true)}
        >
          <Icon name="qr" size={16} /> My pass
        </button>
      </div>
      <button
        type="button"
        className="bd-btn bd-btn-block"
        onClick={() => setAdd(true)}
      >
        <Icon name="plus" size={18} /> Authorize someone else
      </button>

      <p className="bd-c-label">Guest pickups</p>
      {mine.length ? (
        mine.map((g) => {
          const [label, tone] = STATUS[g.status] || STATUS.invited;
          return (
            <div key={g.id} className="bd-card dc-p-guest">
              <div className="dc-p-guest-top">
                <Person name={g.name} size={40} tone="sun" photo={g.photo} />
                <span>
                  <strong>{g.name}</strong>
                  <span className="bd-hint">
                    {g.relation} ·{" "}
                    {g.children
                      .map(
                        (id) => state.children.find((k) => k.id === id).first,
                      )
                      .join(" & ")}
                  </span>
                  <span className="bd-hint">
                    {g.date} · {at(g.from)} – {at(g.to)} · {g.type}
                  </span>
                </span>
                <span className={`bd-status dc-tone-${tone}`}>{label}</span>
              </div>
              {["invited", "verified"].includes(g.status) ? (
                <div className="bd-row-btns">
                  {g.status === "invited" ? (
                    <button
                      type="button"
                      className="bd-btn bd-btn-sm bd-btn-soft"
                      onClick={() => goTo("guest")}
                    >
                      See their invite
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="bd-btn bd-btn-sm bd-btn-ghost"
                    onClick={() => dispatch({ type: "revokeGuest", id: g.id })}
                  >
                    Revoke
                  </button>
                </div>
              ) : null}
            </div>
          );
        })
      ) : (
        <p className="bd-sub">No guest pickups yet.</p>
      )}

      <p className="bd-c-label">Always allowed</p>
      <div className="bd-card">
        <ul className="bd-plain-list">
          {[
            ...fam.guardians.map((g) => ({ ...g, you: g.name === ME })),
            ...fam.pickups,
          ].map((p) => (
            <li key={p.name} className="bd-row-between">
              <span className="bd-row-gap">
                <Person name={p.name} size={32} tone={p.you ? "sky" : "mint"} />
                <span>
                  <strong>
                    {p.name}
                    {p.you ? " (you)" : ""}
                  </strong>
                  <span className="bd-hint">
                    {p.relation}
                    {p.emergency ? " · emergency contact" : ""}
                  </span>
                </span>
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="bd-link"
          onClick={() =>
            dispatch({
              type: "alert",
              kind: "guest",
              text: `${ME} asked to add a permanent pickup contact. Director approval needed.`,
              toast:
                "Request sent. The director approves new permanent contacts.",
            })
          }
        >
          + Request a permanent contact
        </button>
      </div>

      <p className="bd-c-label">Pickup history</p>
      <div className="bd-card">
        {history.length ? (
          <ul className="bd-plain-list">
            {history.map((p) => (
              <li key={p.id}>
                <strong>
                  {state.children.find((k) => k.id === p.child).first} ·{" "}
                  {p.day || "Today"} {at(p.time)}
                </strong>
                <span className="bd-hint">
                  Picked up by {p.by} ({p.relation}) · released by {p.staff} ·{" "}
                  {p.method}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="bd-hint">
            No pickups yet today. Earlier pickups show here.
          </p>
        )}
      </div>

      {add ? <AuthorizeForm onClose={() => setAdd(false)} goTo={goTo} /> : null}
      {qr ? (
        <Sheet title="My pickup pass" onClose={() => setQr(false)}>
          <div className="dc-p-pass">
            <FakeQr seed="danielle" size={170} />
            <strong>Danielle Carter</strong>
            <span className="bd-hint">
              Scan at the front desk tablet. Staff still confirm every pickup.
            </span>
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}

// ---------- More: child info, tuition, calendar, forms, progress ----------
function More({ kid, setKid }) {
  const { state, dispatch } = useDaycare();
  const [section, setSection] = useState("info");
  const [pay, setPay] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [signed, setSigned] = useState({ trip: false });
  const [sig, setSig] = useState("");
  const [agree, setAgree] = useState(false);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState("");
  const kids = state.children.filter((c) => MINE.includes(c.id));
  const c = kids.find((k) => k.id === kid);
  const open = state.invoices.filter((i) => i.status === "open");
  const balance = open.reduce((t, i) => t + invoiceTotal(i), 0);
  const milestones = state.logs.filter(
    (l) => MINE.includes(l.child) && l.kind === "milestone",
  );
  const tabs = [
    ["info", "Child info"],
    ["tuition", "Tuition"],
    ["calendar", "Calendar"],
    ["forms", "Forms"],
    ["progress", "Progress"],
  ];
  return (
    <div className="bd-c-pad">
      <h3 className="bd-serif bd-c-h">Family</h3>
      <div className="bd-scrollchips" role="group" aria-label="Section">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="bd-chip"
            aria-pressed={section === id}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "info" && (
        <>
          <KidSwitch kid={kid} setKid={setKid} kids={kids} />
          <div className="bd-card">
            <dl className="bd-dl bd-dl-tight">
              <div>
                <dt>Allergies</dt>
                <dd>
                  {c.allergies.length
                    ? c.allergies.join(", ")
                    : "None reported"}
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
                    (c.id === "eli"
                      ? "Diaper cream as needed (authorized)"
                      : "None")}
                </dd>
              </div>
              <div>
                <dt>Comfort & routine</dt>
                <dd>{c.comfort || "—"}</dd>
              </div>
              <div>
                <dt>Emergency</dt>
                <dd>Tasha Green (aunt) · (704) 555-0119</dd>
              </div>
            </dl>
            {edit ? (
              <>
                <label className="bd-field">
                  <span>What should change?</span>
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="New allergy, routine change, updated phone…"
                  />
                </label>
                <button
                  type="button"
                  className="bd-btn bd-btn-sm dc-p-gap"
                  onClick={() => {
                    dispatch({
                      type: "alert",
                      kind: "doc",
                      text: `${ME} requested a change to ${c.first}’s info: “${draft || "updated routine"}”`,
                      toast:
                        "Sent. The center reviews changes before they appear.",
                    });
                    setEdit(false);
                    setDraft("");
                  }}
                >
                  Send for review
                </button>
              </>
            ) : (
              <button
                type="button"
                className="bd-btn bd-btn-sm bd-btn-soft"
                onClick={() => setEdit(true)}
              >
                Request a change
              </button>
            )}
          </div>
          <div className="bd-card">
            <Toggle
              on={c.photoOk}
              onChange={() =>
                dispatch({
                  type: "child",
                  id: c.id,
                  patch: { photoOk: !c.photoOk },
                })
              }
              label={`Share photos of ${c.first}`}
              hint="Off means staff can’t post photos that include them"
            />
          </div>
        </>
      )}

      {section === "tuition" && (
        <>
          <div className="bd-card dc-p-balance">
            <span className="bd-hint">Balance due Dec 1</span>
            <strong className="bd-serif">{money(balance)}</strong>
            {balance ? (
              <button
                type="button"
                className="bd-btn bd-btn-block"
                onClick={() => setPay(open[0])}
              >
                Pay now
              </button>
            ) : (
              <span className="bd-status dc-tone-mint">
                All paid · thank you!
              </span>
            )}
            <Toggle
              on={state.autopay}
              onChange={() =>
                dispatch({ type: "set", key: "autopay", value: !state.autopay })
              }
              label="Autopay on the 1st"
              hint="Visa •• 4021 · reminder 3 days before"
            />
          </div>
          <p className="bd-c-label">Invoices & receipts</p>
          {state.invoices.map((i) => (
            <div key={i.id} className="bd-card bd-past">
              <span>
                <strong>{i.period}</strong>
                <span className="bd-sub">
                  {money(invoiceTotal(i))} ·{" "}
                  {i.status === "paid" ? `Paid ${i.paidOn}` : `Due ${i.due}`}
                </span>
              </span>
              <button
                type="button"
                className="bd-btn bd-btn-xs bd-btn-ghost"
                onClick={() => setReceipt(i)}
              >
                {i.status === "paid" ? "Receipt" : "Invoice"}
              </button>
            </div>
          ))}
        </>
      )}

      {section === "calendar" && (
        <>
          {state.announcements.map((a) => (
            <div key={a.id} className="bd-card dc-p-cal">
              <span className="dc-p-date">
                <span>{a.day.split(" ")[0]}</span>
                <strong>{a.day.split(" ")[1]}</strong>
              </span>
              <span>
                <strong>{a.title}</strong>
                <span className="bd-sub">{a.text}</span>
              </span>
            </div>
          ))}
        </>
      )}

      {section === "forms" && (
        <>
          <div className="bd-card">
            <p className="bd-eyebrow">Permission slip</p>
            <strong>Pumpkin patch field trip · Thu, Nov 19</strong>
            <p className="bd-sub">
              Butterflies walk to the community garden pumpkin patch, 9:30–11:30
              AM, with 3 staff.
            </p>
            {signed.trip ? (
              <span className="bd-status dc-tone-mint">
                Signed by {sig} · today
              </span>
            ) : (
              <>
                <label className="bd-check">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  <span>Maya may go on this trip</span>
                </label>
                <label className="bd-field dc-p-gap">
                  <span>Type your full name to sign</span>
                  <input
                    value={sig}
                    onChange={(e) => setSig(e.target.value)}
                    placeholder="Danielle Carter"
                    className="dc-p-sig"
                  />
                </label>
                <button
                  type="button"
                  className="bd-btn bd-btn-sm dc-p-gap"
                  disabled={!agree || sig.trim().length < 5}
                  onClick={() => {
                    setSigned({ trip: true });
                    dispatch({
                      type: "alert",
                      kind: "doc",
                      text: `${ME} signed the pumpkin patch permission slip for Maya.`,
                      toast: "Signed. A copy is in your documents.",
                    });
                  }}
                >
                  Sign
                </button>
              </>
            )}
          </div>
          <div className="bd-card bd-past">
            <span>
              <strong>2027 re-enrollment packet</strong>
              <span className="bd-sub">3 of 5 sections done</span>
            </span>
            <span className="bd-status dc-tone-sun">In progress</span>
          </div>
          <div className="bd-card bd-past">
            <span>
              <strong>Incident reports</strong>
              <span className="bd-sub">
                {state.incidents.filter((i) => MINE.includes(i.child)).length}{" "}
                this month ·{" "}
                {
                  state.incidents.filter(
                    (i) => MINE.includes(i.child) && !i.ack,
                  ).length
                }{" "}
                to review
              </span>
            </span>
            <span className="bd-status dc-tone-sky">On file</span>
          </div>
        </>
      )}

      {section === "progress" && (
        <>
          {[
            ["Language", 80, "Names letters in her name, tells short stories"],
            ["Fine motor", 70, "Writes first name, cuts along a line"],
            ["Social", 85, "Takes turns, comforts friends"],
          ].map(([area, v, note]) => (
            <div key={area} className="bd-card">
              <span className="bd-row-between">
                <strong>{area}</strong>
                <span className="bd-hint">Maya · fall check-in</span>
              </span>
              <div
                className="bd-meter"
                role="img"
                aria-label={`${area}: ${v}% of fall goals met`}
              >
                <span style={{ width: `${v}%` }} />
              </div>
              <span className="bd-sub">{note}</span>
            </div>
          ))}
          <p className="bd-c-label">Milestones</p>
          {milestones.map((m) => (
            <div key={m.id} className="bd-card bd-past">
              <span>
                <strong>{m.text}</strong>
                <span className="bd-sub">
                  {state.children.find((k) => k.id === m.child).first} ·{" "}
                  {m.detail}
                </span>
              </span>
            </div>
          ))}
        </>
      )}

      {pay ? (
        <Sheet title="Pay tuition" onClose={() => setPay(null)}>
          <dl className="bd-dl bd-dl-tight">
            {pay.lines.map(([n, v]) => (
              <div key={n}>
                <dt>{n}</dt>
                <dd>{money(v)}</dd>
              </div>
            ))}
            <div>
              <dt>
                <strong>Total</strong>
              </dt>
              <dd>
                <strong>{money(invoiceTotal(pay))}</strong>
              </dd>
            </div>
          </dl>
          <p className="bd-sub">
            Paying with Visa •• 4021 through the center’s payment provider.
          </p>
          <button
            type="button"
            className="bd-btn bd-btn-block"
            onClick={() => {
              dispatch({
                type: "set",
                key: "invoices",
                value: (l) =>
                  l.map((i) =>
                    i.id === pay.id
                      ? { ...i, status: "paid", paidOn: "Today · Visa •• 4021" }
                      : i,
                  ),
              });
              dispatch({
                type: "alert",
                kind: "pay",
                text: `${ME} paid ${money(invoiceTotal(pay))} for ${pay.period}.`,
                toast: "Paid! Receipt saved. (Demo: no money moved.)",
              });
              setPay(null);
            }}
          >
            Pay {money(invoiceTotal(pay))}
          </button>
        </Sheet>
      ) : null}
      {receipt ? (
        <Sheet
          title={receipt.status === "paid" ? "Receipt" : "Invoice"}
          onClose={() => setReceipt(null)}
        >
          <p className="bd-hint">
            {receipt.id} · {receipt.period}
          </p>
          <dl className="bd-dl bd-dl-tight">
            {receipt.lines.map(([n, v]) => (
              <div key={n}>
                <dt>{n}</dt>
                <dd>{money(v)}</dd>
              </div>
            ))}
            <div>
              <dt>Total</dt>
              <dd>{money(invoiceTotal(receipt))}</dd>
            </div>
          </dl>
          <p className="bd-sub">
            {receipt.status === "paid"
              ? `Paid ${receipt.paidOn}`
              : `Due ${receipt.due}`}
          </p>
        </Sheet>
      ) : null}
    </div>
  );
}

export default function ParentApp({ goTo }) {
  const [tab, setTab] = useState("home");
  const [kid, setKid] = useState("maya");
  const nav = [
    ["home", "home", "Home"],
    ["day", "sun", "Today"],
    ["messages", "chat", "Messages"],
    ["pickup", "shield", "Pickup"],
    ["more", "user", "Family"],
  ];
  return (
    <PhoneFrame
      label="Parent app"
      footer={
        <nav className="bd-bottomnav dc-nav5" aria-label="Parent app">
          {nav.map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
            >
              <Icon name={icon} size={20} />
              {label}
            </button>
          ))}
        </nav>
      }
    >
      {tab === "home" && <Home kid={kid} setKid={setKid} go={setTab} />}
      {tab === "day" && <Day kid={kid} setKid={setKid} />}
      {tab === "messages" && <Messages />}
      {tab === "pickup" && <Pickup goTo={goTo} />}
      {tab === "more" && <More kid={kid} setKid={setKid} />}
    </PhoneFrame>
  );
}
