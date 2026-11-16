"use client";

import { useState } from "react";
import { FAMILIES, NOW, ROOMS, STAFF, at, room, staff } from "./data";
import { useDaycare } from "./store";
import {
  ArtTile,
  ChildStatus,
  Icon,
  Kid,
  KindIcon,
  PhoneFrame,
  RoomTag,
  Sheet,
  Toggle,
} from "./ui";
import "./teacher.css";

const TEACHERS = ["rosa", "kim", "grace", "dana"];
const PLACES = ["Classroom", "Playground", "Gym", "Art room"];
const ACTIVITIES = [
  "Reading",
  "Outdoor play",
  "Arts & crafts",
  "Music",
  "Circle time",
  "Group learning",
];
const MOODS = ["Happy", "Calm", "Excited", "Tired", "Fussy"];
const ARTS = [
  ["leaves", "Leaf painting"],
  ["music", "Music time"],
  ["blocks", "Block building"],
  ["sandbox", "Sandbox play"],
];
const GUEST_STATUS = {
  invited: ["Waiting for guest verification", "sun"],
  verified: ["Verified · pickup pass issued", "mint"],
  used: ["Picked up", "plain"],
  revoked: ["Revoked by parent", "rose"],
  expired: ["Expired", "plain"],
};
const SCHEDULE = [
  [540, 570, "Circle time"],
  [630, 690, "Outdoor play"],
  [705, 750, "Lunch"],
  [750, 870, "Nap and quiet rest"],
  [900, 920, "Afternoon snack"],
  [930, 990, "Centers and free play"],
];

const isToday = (l) => !l.day;
const present = (c) => c.status === "in";

function useRoom(teacherId) {
  const { state } = useDaycare();
  const t = staff(teacherId);
  const r = room(t.room);
  const kids = state.children.filter((c) => c.room === r.id);
  const here = kids.filter(present);
  const onDuty = STAFF.filter(
    (s) => s.room === r.id && state.clockedIn[s.id] && !state.onBreak?.[s.id],
  );
  return { t, r, kids, here, onDuty };
}

function Chips({ label, options, value, onChange }) {
  return (
    <div className="bd-wrapchips" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className="bd-chip"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ---------- Child details ----------
function ChildSheet({ child, onClose }) {
  const { state } = useDaycare();
  const fam = FAMILIES[child.family] || { guardians: [], pickups: [] };
  const logs = state.logs
    .filter((l) => l.child === child.id && isToday(l))
    .sort((a, b) => a.time - b.time);
  const guests = state.guests.filter((g) => g.children.includes(child.id));
  return (
    <Sheet title={child.name} onClose={onClose}>
      <div className="bd-tags">
        <RoomTag id={child.room} />
        <ChildStatus child={child} />
        <span className="bd-status dc-tone-plain">{child.age}</span>
      </div>
      {fam.restriction ? (
        <p className="dc-t-restrict dc-tone-rose">
          <Icon name="alert" size={18} />
          <span>
            <strong>Custody restriction.</strong> {fam.restriction} Never
            release without the director.
          </span>
        </p>
      ) : null}
      <dl className="bd-dl bd-dl-tight">
        <div>
          <dt>Allergies</dt>
          <dd>
            {child.allergies.length
              ? child.allergies.join(", ")
              : "None on file"}
          </dd>
        </div>
        <div>
          <dt>Care notes</dt>
          <dd>{child.care || "None"}</dd>
        </div>
        <div>
          <dt>Comfort item</dt>
          <dd>{child.comfort || "None listed"}</dd>
        </div>
        {child.meds ? (
          <div>
            <dt>Medication</dt>
            <dd>{child.meds}</dd>
          </div>
        ) : null}
        <div>
          <dt>Photos</dt>
          <dd>
            {child.photoOk
              ? "Parent allows photo sharing"
              : "No photos (parent preference)"}
          </dd>
        </div>
      </dl>

      <p className="bd-mini">Today</p>
      {logs.length ? (
        <ul className="dc-t-log">
          {logs.map((l) => (
            <li key={l.id}>
              <KindIcon kind={l.kind} size={30} />
              <span>
                <strong>
                  {at(l.time)} · {l.text}
                </strong>
                <span className="bd-hint">{l.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="bd-hint">Nothing logged yet today.</p>
      )}

      <p className="bd-mini">Authorized pickup</p>
      <ul className="bd-plain-list">
        {fam.guardians.map((g) => (
          <li key={g.name}>
            <strong>{g.name}</strong>
            <span className="bd-hint">{g.relation} · parent account</span>
          </li>
        ))}
        {fam.pickups.map((p) => (
          <li key={p.name}>
            <strong>{p.name}</strong>
            <span className="bd-hint">
              {p.relation}
              {p.emergency ? " · emergency contact" : ""}
            </span>
          </li>
        ))}
        {guests.map((g) => {
          const [label, tone] = GUEST_STATUS[g.status] || GUEST_STATUS.invited;
          return (
            <li key={g.id}>
              <strong>
                {g.name}{" "}
                <span className="bd-hint dc-t-inline">
                  · guest, {g.relation.toLowerCase()}
                </span>
              </strong>
              <span className="bd-hint">
                {g.date}, {at(g.from)} – {at(g.to)} · {g.type}
              </span>
              <span className={`bd-status dc-tone-${tone}`}>{label}</span>
            </li>
          );
        })}
      </ul>
      <p className="bd-hint">
        Phone numbers are visible to the front desk and director only. Every
        release happens at the front desk with an ID check.
      </p>
    </Sheet>
  );
}

// ---------- Room tab ----------
function RoomTab({ teacherId }) {
  const { state, dispatch } = useDaycare();
  const { t, r, kids, here, onDuty } = useRoom(teacherId);
  const [open, setOpen] = useState(null);
  const where = state.roomOf?.[r.id] || "Classroom";
  const allowed = onDuty.length * r.ratio;
  const ok = onDuty.length > 0 && here.length <= allowed;
  const alerts = here.filter((c) => c.allergies.length || c.care);
  const openChild = open ? state.children.find((c) => c.id === open) : null;

  return (
    <div className="bd-c-pad">
      <div className="bd-c-hello">
        <div>
          <p className="bd-eyebrow">{r.ages}</p>
          <h3 className="bd-serif bd-c-h">{r.name}</h3>
        </div>
        <span className="bd-status dc-tone-sky">
          <Icon name="pin" size={13} /> {where}
        </span>
      </div>

      <div className="bd-card dc-t-ratio">
        <div className="bd-row-between">
          <span>
            <strong className="bd-serif dc-t-big">{here.length}</strong>{" "}
            children here
          </span>
          <span>
            <strong className="bd-serif dc-t-big">{onDuty.length}</strong> staff
            on duty
          </span>
        </div>
        <div
          className="dc-t-meter"
          role="img"
          aria-label={`${here.length} children for ${allowed} allowed by the 1 to ${r.ratio} limit`}
        >
          <span
            className={ok ? "" : "is-over"}
            style={{
              width: `${Math.min(100, allowed ? (here.length / allowed) * 100 : 100)}%`,
            }}
          />
        </div>
        <p className={`dc-t-ratio-line dc-tone-${ok ? "mint" : "rose"}`}>
          <Icon name={ok ? "check" : "alert"} size={16} strokeWidth={2.2} />
          {ok
            ? `Within ratio: your limit is 1 to ${r.ratio}, room for ${allowed - here.length} more.`
            : onDuty.length
              ? `Over ratio: limit is 1 to ${r.ratio}. Call for coverage.`
              : "No staff clocked in for this room."}
        </p>
        <p className="bd-hint">
          On duty: {onDuty.map((s) => s.name).join(", ") || "nobody"}
        </p>
      </div>

      {alerts.length ? (
        <div
          className="dc-t-alerts"
          role="note"
          aria-label="Allergy and care alerts"
        >
          <p className="dc-t-alerts-head">
            <Icon name="alert" size={16} /> Allergy & care alerts
          </p>
          <ul>
            {alerts.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong>
                {c.allergies.length
                  ? ` · allergic to ${c.allergies.join(", ").toLowerCase()}`
                  : ""}
                {c.care ? ` · ${c.care}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="bd-c-label">Move the class</p>
      <div
        className="bd-tech-tools"
        role="group"
        aria-label="Where the class is"
      >
        {PLACES.map((p) => (
          <button
            key={p}
            type="button"
            className="bd-tool"
            aria-pressed={where === p}
            onClick={() => {
              if (where === p) return;
              dispatch({
                type: "set",
                key: "roomOf",
                value: (prev) => ({ ...(prev || {}), [r.id]: p }),
              });
              if (here.length)
                dispatch({
                  type: "log",
                  ids: here.map((c) => c.id),
                  by: t.name,
                  entry: {
                    kind: "room",
                    text: "Room change",
                    detail: `Moved to the ${p.toLowerCase()} with ${t.name}`,
                  },
                  toast: `Transition to the ${p.toLowerCase()} recorded for ${here.length} children.`,
                });
            }}
          >
            <Icon name="pin" /> {p}
          </button>
        ))}
      </div>

      <p className="bd-c-label">
        Roster · {here.length} of {kids.length} here
      </p>
      <ul className="dc-t-roster">
        {kids.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="dc-t-kid"
              onClick={() => setOpen(c.id)}
            >
              <Kid child={c} size={40} />
              <span className="dc-t-kid-main">
                <strong>{c.name}</strong>
                <span className="bd-hint">
                  {c.age}
                  {c.allergies.length
                    ? ` · allergy: ${c.allergies.join(", ")}`
                    : ""}
                  {!c.photoOk ? " · no photos" : ""}
                </span>
                {c.lateNote ? (
                  <span className="bd-hint">{c.lateNote}</span>
                ) : null}
                {c.absentNote ? (
                  <span className="bd-hint">{c.absentNote}</span>
                ) : null}
                {c.status === "out" && c.outBy ? (
                  <span className="bd-hint">Picked up by {c.outBy}</span>
                ) : null}
              </span>
              <ChildStatus child={c} />
            </button>
          </li>
        ))}
      </ul>
      <p className="bd-hint">
        Check-ins and pickups happen at the front desk tablet and update this
        list live.
      </p>
      {openChild ? (
        <ChildSheet child={openChild} onClose={() => setOpen(null)} />
      ) : null}
    </div>
  );
}

// ---------- Log tab ----------
const TYPES = [
  ["meal", "Meal"],
  ["snack", "Snack"],
  ["nap", "Nap"],
  ["diaper", "Diaper"],
  ["potty", "Bathroom"],
  ["activity", "Activity"],
  ["mood", "Mood"],
  ["photo", "Photo"],
  ["milestone", "Milestone"],
];

function ActivityForm({ teacherId }) {
  const { state, dispatch } = useDaycare();
  const { t, here } = useRoom(teacherId);
  const [ids, setIds] = useState([]);
  const [type, setType] = useState("meal");
  const [served, setServed] = useState("");
  const [amount, setAmount] = useState("Most");
  const [diaper, setDiaper] = useState("Wet");
  const [potty, setPotty] = useState("Used the potty");
  const [act, setAct] = useState("Reading");
  const [mood, setMood] = useState("Happy");
  const [art, setArt] = useState("blocks");
  const [photo, setPhoto] = useState(null);
  const [note, setNote] = useState("");

  const picked = ids.filter((id) => here.some((c) => c.id === id));
  const toggle = (id) =>
    setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const noPhoto =
    type === "photo"
      ? here.filter((c) => picked.includes(c.id) && !c.photoOk)
      : [];
  const targets =
    type === "photo"
      ? picked.filter((id) => !noPhoto.some((c) => c.id === id))
      : picked;
  const napping = here.filter((c) => picked.includes(c.id) && c.napping);
  const awake = here.filter((c) => picked.includes(c.id) && !c.napping);

  const submit = (e) => {
    e.preventDefault();
    if (!targets.length) return;
    const by = t.name;
    let entry;
    if (type === "meal" || type === "snack") {
      const food =
        served.trim() ||
        (type === "meal"
          ? "Turkey wraps, apple slices and milk"
          : "Crackers and cheese");
      entry = {
        kind: "meal",
        text: type === "meal" ? "Lunch" : "Snack",
        detail: `${food} · ate ${amount.toLowerCase()}`,
      };
    } else if (type === "diaper")
      entry = { kind: "diaper", text: "Diaper", detail: diaper };
    else if (type === "potty")
      entry = { kind: "potty", text: "Bathroom", detail: potty };
    else if (type === "activity")
      entry = {
        kind: "activity",
        text: act,
        detail: note.trim() || `${act} with ${by}`,
      };
    else if (type === "mood")
      entry = {
        kind: "mood",
        text: "Mood",
        detail: note.trim() ? `${mood} · ${note.trim()}` : mood,
      };
    else if (type === "photo") {
      const caption = note.trim() || ARTS.find((a) => a[0] === art)[1];
      entry = {
        kind: "photo",
        text: caption,
        detail: `Photo shared by ${by}`,
        art,
        ...(photo ? { photo } : {}),
      };
    } else
      entry = {
        kind: "milestone",
        text: "Milestone",
        detail: note.trim() || "New skill observed today",
      };
    dispatch({ type: "log", ids: targets, by, entry });
    setNote("");
    setServed("");
    setPhoto(null);
  };

  return (
    <form className="bd-form" onSubmit={submit}>
      <div className="bd-row-between">
        <p className="bd-mini">Children ({picked.length} selected)</p>
        <span className="dc-t-mini-btns">
          <button
            type="button"
            className="bd-link"
            onClick={() => setIds(here.map((c) => c.id))}
          >
            Select all present
          </button>
          <button type="button" className="bd-link" onClick={() => setIds([])}>
            Clear
          </button>
        </span>
      </div>
      <div
        className="dc-t-kidchips"
        role="group"
        aria-label="Children to log for"
      >
        {here.map((c) => (
          <button
            key={c.id}
            type="button"
            className="dc-t-kidchip"
            aria-pressed={picked.includes(c.id)}
            onClick={() => toggle(c.id)}
          >
            <Kid child={c} size={26} />
            {c.first}
          </button>
        ))}
        {!here.length ? (
          <p className="bd-hint">No children checked in yet.</p>
        ) : null}
      </div>

      <p className="bd-mini">What happened</p>
      <div className="bd-wrapchips" role="group" aria-label="Update type">
        {TYPES.map(([k, label]) => (
          <button
            key={k}
            type="button"
            className="bd-chip"
            aria-pressed={type === k}
            onClick={() => setType(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {(type === "meal" || type === "snack") && (
        <>
          <label className="bd-field">
            <span>What was served</span>
            <input
              value={served}
              onChange={(e) => setServed(e.target.value)}
              placeholder={
                type === "meal"
                  ? "Turkey wraps, apple slices and milk"
                  : "Crackers and cheese"
              }
            />
          </label>
          <Chips
            label="How much was eaten"
            options={["All", "Most", "Some", "None"]}
            value={amount}
            onChange={setAmount}
          />
        </>
      )}
      {type === "nap" && (
        <div className="dc-t-nap">
          <p className="bd-hint">
            {napping.length
              ? `Napping: ${napping.map((c) => c.first).join(", ")}. `
              : ""}
            {awake.length
              ? `Awake: ${awake.map((c) => c.first).join(", ")}.`
              : ""}
            {!picked.length ? "Pick the children first." : ""}
          </p>
          <div className="bd-row-btns">
            <button
              type="button"
              className="bd-btn bd-btn-sm"
              disabled={!awake.length}
              onClick={() =>
                dispatch({
                  type: "startNap",
                  ids: awake.map((c) => c.id),
                  by: t.name,
                })
              }
            >
              <Icon name="moon" size={16} /> Start nap ({awake.length})
            </button>
            <button
              type="button"
              className="bd-btn bd-btn-sm bd-btn-soft"
              disabled={!napping.length}
              onClick={() =>
                dispatch({ type: "endNap", ids: napping.map((c) => c.id) })
              }
            >
              <Icon name="sun" size={16} /> End nap ({napping.length})
            </button>
          </div>
        </div>
      )}
      {type === "diaper" && (
        <Chips
          label="Diaper"
          options={["Wet", "BM", "Wet and BM", "Dry"]}
          value={diaper}
          onChange={setDiaper}
        />
      )}
      {type === "potty" && (
        <Chips
          label="Bathroom"
          options={[
            "Used the potty",
            "Tried, no luck",
            "Accident, changed clothes",
          ]}
          value={potty}
          onChange={setPotty}
        />
      )}
      {type === "activity" && (
        <Chips
          label="Activity"
          options={ACTIVITIES}
          value={act}
          onChange={setAct}
        />
      )}
      {type === "mood" && (
        <Chips label="Mood" options={MOODS} value={mood} onChange={setMood} />
      )}
      {type === "photo" && (
        <>
          <div className="dc-t-arts" role="group" aria-label="Photo">
            {ARTS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={!photo && art === k}
                onClick={() => {
                  setArt(k);
                  setPhoto(null);
                }}
              >
                <ArtTile art={k} label={label} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <label className="bd-upload bd-upload-sm">
            <input
              type="file"
              accept="image/*"
              className="bd-sr"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPhoto(URL.createObjectURL(f));
              }}
            />
            <Icon name="camera" size={18} />
            <span>
              {photo
                ? "Photo attached (stays on this device)"
                : "Or upload a photo"}
            </span>
          </label>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="Uploaded classroom photo preview"
              className="dc-t-preview"
            />
          ) : null}
          {noPhoto.length ? (
            <p className="dc-t-note dc-tone-sun">
              <Icon name="lock" size={15} /> Left out automatically:{" "}
              {noPhoto.map((c) => c.name).join(", ")} (no photo permission).
            </p>
          ) : null}
        </>
      )}
      {["activity", "mood", "photo", "milestone"].includes(type) && (
        <label className="bd-field">
          <span>
            {type === "photo"
              ? "Caption"
              : type === "milestone"
                ? "What you observed"
                : "Note (optional)"}
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              type === "milestone"
                ? "Climbed the steps on their own"
                : type === "photo"
                  ? "Building a tall tower together"
                  : "Loved the story about the moon"
            }
          />
        </label>
      )}
      {type !== "nap" ? (
        <button
          type="submit"
          className="bd-btn bd-btn-block"
          disabled={!targets.length}
        >
          {targets.length
            ? `Log for ${targets.length} ${targets.length === 1 ? "child" : "children"}`
            : "Pick children to log for"}
        </button>
      ) : null}
      <p className="bd-hint">
        One tap saves a separate entry in each child’s history, and families see
        it in their daily report.
      </p>
    </form>
  );
}

function CarePanel({ teacherId }) {
  const { state, dispatch } = useDaycare();
  const { t, r, kids, here } = useRoom(teacherId);
  const meds = state.meds.filter((m) => kids.some((c) => c.id === m.child));
  const young = ["caterpillars", "ladybugs", "bumblebees"].includes(r.id);
  const flags = [];
  meds.forEach((m) => {
    if (m.status === "due" && m.due != null && NOW > m.due)
      flags.push(
        `${kids.find((c) => c.id === m.child).name}: ${m.med} was due at ${at(m.due)}.`,
      );
  });
  if (young)
    here.forEach((c) => {
      const last = state.logs
        .filter(
          (l) =>
            l.child === c.id &&
            isToday(l) &&
            (l.kind === "diaper" || l.kind === "potty"),
        )
        .sort((a, b) => b.time - a.time)[0];
      const since = last ? last.time : c.inAt;
      if (since != null && NOW - since > 120 && !c.napping)
        flags.push(
          `${c.name}: no diaper or bathroom check logged since ${at(since)}.`,
        );
    });
  const tasks = here.filter((c) => c.care);

  return (
    <div className="bd-form">
      {flags.length ? (
        <div
          className="dc-t-alerts"
          role="note"
          aria-label="Missed or incomplete care"
        >
          <p className="dc-t-alerts-head">
            <Icon name="alert" size={16} /> Needs attention
          </p>
          <ul>
            {flags.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="dc-t-note dc-tone-mint">
          <Icon name="check" size={15} /> No missed care tasks right now.
        </p>
      )}

      <p className="bd-mini">Medication</p>
      {meds.length ? (
        meds.map((m) => {
          const kid = kids.find((c) => c.id === m.child);
          const overdue = m.status === "due" && m.due != null && NOW > m.due;
          return (
            <div key={m.id} className="bd-card dc-t-med">
              <div className="bd-row-between">
                <strong>{kid.name}</strong>
                {m.status === "given" ? (
                  <span className="bd-status dc-tone-mint">
                    Given {at(m.givenAt)}
                  </span>
                ) : overdue ? (
                  <span className="bd-status dc-tone-rose">
                    <Icon name="alert" size={12} /> Overdue since {at(m.due)}
                  </span>
                ) : (
                  <span className="bd-status dc-tone-sky">
                    {m.due != null ? `Due ${at(m.due)}` : "As needed"}
                  </span>
                )}
              </div>
              <p className="bd-sub">{m.med}</p>
              <p className="bd-hint">{m.auth}</p>
              {m.status === "given" ? (
                <p className="bd-hint">
                  Recorded by {m.givenBy} at {at(m.givenAt)}.
                </p>
              ) : t.med ? (
                <button
                  type="button"
                  className="bd-btn bd-btn-sm"
                  onClick={() =>
                    dispatch({
                      type: "giveMed",
                      id: m.id,
                      child: m.child,
                      med: m.med,
                      by: t.name,
                    })
                  }
                >
                  <Icon name="pill" size={15} /> Record dose
                </button>
              ) : (
                <p className="bd-locked">
                  <Icon name="lock" size={16} /> Only staff trained in
                  medication administration can record a dose. Ask{" "}
                  {STAFF.find((s) => s.room === r.id && s.med)?.name ||
                    "the director"}
                  .
                </p>
              )}
            </div>
          );
        })
      ) : (
        <p className="bd-hint">No medication scheduled for this room today.</p>
      )}

      <p className="bd-mini">Special care routines</p>
      {tasks.length ? (
        tasks.map((c) => (
          <div key={c.id} className="bd-card bd-row-between dc-t-task">
            <span>
              <strong>{c.name}</strong>
              <span className="bd-hint">{c.care}</span>
            </span>
            <button
              type="button"
              className="bd-btn bd-btn-xs bd-btn-soft"
              onClick={() =>
                dispatch({
                  type: "log",
                  ids: [c.id],
                  by: t.name,
                  entry: { kind: "note", text: "Care routine", detail: c.care },
                  toast: `Care routine recorded for ${c.first}.`,
                })
              }
            >
              Mark done
            </button>
          </div>
        ))
      ) : (
        <p className="bd-hint">
          No special routines for the children here today.
        </p>
      )}
      <p className="bd-hint">
        Medication records follow your center’s authorizations and staff
        qualifications.
      </p>
    </div>
  );
}

function IncidentForm({ teacherId }) {
  const { state, dispatch } = useDaycare();
  const { t, r, kids } = useRoom(teacherId);
  const roomStaff = STAFF.filter((s) => s.room === r.id);
  const [child, setChild] = useState(kids[0]?.id || "");
  const [what, setWhat] = useState("");
  const [time, setTime] = useState(NOW - 5);
  const [where, setWhere] = useState("Classroom");
  const [witness, setWitness] = useState(
    roomStaff.find((s) => s.id !== teacherId)?.name || "None",
  );
  const [aid, setAid] = useState("");
  const [file, setFile] = useState("");
  const times = Array.from({ length: 13 }, (_, i) => NOW - i * 5);
  const recent = state.incidents.filter((i) =>
    kids.some((c) => c.id === i.child),
  );

  return (
    <>
      <form
        className="bd-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!child || !what.trim()) return;
          dispatch({
            type: "incident",
            incident: {
              child,
              time: Number(time),
              where,
              what: `${what.trim()}${aid.trim() ? ` First aid: ${aid.trim()}.` : ""}${file ? ` Attachment: ${file}.` : ""}`,
              staff: t.name,
              witness,
            },
          });
          setWhat("");
          setAid("");
          setFile("");
        }}
      >
        <label className="bd-field">
          <span>Child</span>
          <select value={child} onChange={(e) => setChild(e.target.value)}>
            {kids.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="bd-field">
          <span>What happened</span>
          <textarea
            rows={3}
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            placeholder="Bumped head on the table edge during centers. Small red mark, no swelling."
          />
        </label>
        <div className="bd-form-2">
          <label className="bd-field">
            <span>Time</span>
            <select value={time} onChange={(e) => setTime(e.target.value)}>
              {times.map((m) => (
                <option key={m} value={m}>
                  {at(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="bd-field">
            <span>Location</span>
            <select value={where} onChange={(e) => setWhere(e.target.value)}>
              {[
                "Classroom",
                "Playground",
                "Gym",
                "Bathroom",
                "Hallway",
                "Art room",
              ].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="bd-form-2">
          <label className="bd-field">
            <span>Reported by</span>
            <input value={t.name} readOnly />
          </label>
          <label className="bd-field">
            <span>Other staff involved</span>
            <select
              value={witness}
              onChange={(e) => setWitness(e.target.value)}
            >
              {[
                "None",
                ...roomStaff
                  .filter((s) => s.id !== teacherId)
                  .map((s) => s.name),
                "Ms. Joy",
              ].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="bd-field">
          <span>First aid given</span>
          <input
            value={aid}
            onChange={(e) => setAid(e.target.value)}
            placeholder="Ice pack for 10 minutes"
          />
        </label>
        <label className="bd-upload bd-upload-sm">
          <input
            type="file"
            className="bd-sr"
            onChange={(e) => setFile(e.target.files?.[0]?.name || "")}
          />
          <Icon name="file" size={18} />
          <span>{file || "Attach a document (optional)"}</span>
        </label>
        <button
          type="submit"
          className="bd-btn bd-btn-block"
          disabled={!what.trim()}
        >
          Send report to director and guardians
        </button>
        <p className="bd-hint">
          Guardians are asked to acknowledge the report in their app.
        </p>
      </form>
      <p className="bd-mini">Recent reports</p>
      {recent.length ? (
        recent.map((i) => (
          <div key={i.id} className="bd-card bd-past">
            <span>
              <strong>
                {kids.find((c) => c.id === i.child)?.name} · {at(i.time)}
              </strong>
              <span className="bd-hint">
                {i.where} · {i.staff}
              </span>
            </span>
            <span className={`bd-status dc-tone-${i.ack ? "mint" : "sun"}`}>
              {i.ack ? "Acknowledged" : "Awaiting guardian"}
            </span>
          </div>
        ))
      ) : (
        <p className="bd-hint">No incident reports for this room today.</p>
      )}
    </>
  );
}

// Builds a summary only from what staff actually logged for the child today.
function draftFor(child, logs) {
  const mine = logs
    .filter((l) => l.child === child.id && isToday(l))
    .sort((a, b) => a.time - b.time);
  const parts = [];
  const diapers = mine.filter((l) => l.kind === "diaper").length;
  mine.forEach((l) => {
    if (l.kind === "meal") {
      const [food, ate] = l.detail.split(" · ");
      parts.push(
        `At ${l.text.toLowerCase()}, ${child.first} had ${food.charAt(0).toLowerCase()}${food.slice(1)}${ate ? ` and ${ate}` : ""}.`,
      );
    } else if (l.kind === "nap")
      parts.push(
        l.open
          ? `${child.first} is resting now (${l.detail.toLowerCase()}).`
          : `${child.first} napped: ${l.detail.toLowerCase()}.`,
      );
    else if (l.kind === "activity")
      parts.push(
        `${child.first} joined ${l.text.toLowerCase()}: ${l.detail.charAt(0).toLowerCase()}${l.detail.slice(1)}.`,
      );
    else if (l.kind === "photo")
      parts.push(`A photo from ${l.text.toLowerCase()} was shared.`);
    else if (l.kind === "milestone") parts.push(`Milestone: ${l.detail}.`);
    else if (l.kind === "mood") parts.push(`Mood today: ${l.detail}.`);
    else if (l.kind === "incident")
      parts.push(
        `There was an incident report (${l.detail.split(".")[0].toLowerCase()}). Please see the full report in the app.`,
      );
    else if (l.kind === "med") parts.push(`Medication given: ${l.detail}.`);
    else if (l.kind === "potty")
      parts.push(`Bathroom: ${l.detail.toLowerCase()}.`);
  });
  if (diapers)
    parts.push(
      `${diapers} diaper ${diapers === 1 ? "change" : "changes"} logged.`,
    );
  return parts.join(" ");
}

function Summaries({ teacherId }) {
  const { state, dispatch } = useDaycare();
  const { t, here } = useRoom(teacherId);
  const [drafts, setDrafts] = useState(null);

  if (!drafts)
    return (
      <div className="bd-form">
        <div className="bd-card dc-t-ai">
          <p className="bd-eyebrow">
            <Icon name="sparkle" size={13} /> AI assist
          </p>
          <p className="bd-sub">
            Draft an end-of-day note for each child from what your team logged
            today. Nothing is added that wasn’t recorded, and you review every
            draft before it goes out.
          </p>
          <button
            type="button"
            className="bd-btn bd-btn-block"
            disabled={!here.length}
            onClick={() =>
              setDrafts(
                Object.fromEntries(
                  here.map((c) => [c.id, draftFor(c, state.logs)]),
                ),
              )
            }
          >
            Draft end-of-day summaries
          </button>
        </div>
      </div>
    );

  const ready = here.filter((c) => drafts[c.id]?.trim());
  return (
    <div className="bd-form">
      <p className="dc-t-note dc-tone-sky">
        <Icon name="sparkle" size={15} /> Drafted from what your team logged.
        Review before sending.
      </p>
      {here.map((c) => (
        <div key={c.id} className="bd-card dc-t-draft">
          <div className="bd-row-gap">
            <Kid child={c} size={28} />
            <strong>{c.name}</strong>
          </div>
          {draftFor(c, state.logs) ? (
            <label className="bd-field">
              <span className="bd-sr">Summary for {c.name}</span>
              <textarea
                rows={4}
                value={drafts[c.id] || ""}
                onChange={(e) =>
                  setDrafts({ ...drafts, [c.id]: e.target.value })
                }
              />
            </label>
          ) : (
            <p className="bd-hint">
              Nothing logged for {c.first} yet today, so there’s no draft. Add
              updates first.
            </p>
          )}
        </div>
      ))}
      <div className="bd-row-btns">
        <button
          type="button"
          className="bd-btn bd-btn-soft"
          onClick={() => setDrafts(null)}
        >
          Start over
        </button>
        <button
          type="button"
          className="bd-btn"
          disabled={!ready.length}
          onClick={() => {
            ready.forEach((c) =>
              dispatch({
                type: "log",
                ids: [c.id],
                by: t.name,
                entry: {
                  kind: "note",
                  text: "End-of-day summary",
                  detail: drafts[c.id].trim(),
                },
                toast: "",
              }),
            );
            if (ready.some((c) => ["maya", "eli"].includes(c.id)))
              dispatch({
                type: "notice",
                text: `End-of-day summary for ${ready
                  .filter((c) => ["maya", "eli"].includes(c.id))
                  .map((c) => c.first)
                  .join(" and ")} is ready.`,
              });
            dispatch({
              type: "toast",
              text: `Summaries sent to ${ready.length} ${ready.length === 1 ? "family" : "families"}.`,
            });
            setDrafts(null);
          }}
        >
          Send to {ready.length} {ready.length === 1 ? "family" : "families"}
        </button>
      </div>
    </div>
  );
}

function LogTab({ teacherId }) {
  const [part, setPart] = useState("activity");
  const parts = [
    ["activity", "Activity"],
    ["care", "Care & meds"],
    ["incident", "Incident"],
    ["summary", "Summaries"],
  ];
  return (
    <div className="bd-c-pad">
      <h3 className="bd-serif bd-c-h">Log the day</h3>
      <div className="dc-t-tabs" role="group" aria-label="Log section">
        {parts.map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={part === k}
            onClick={() => setPart(k)}
          >
            {label}
          </button>
        ))}
      </div>
      {part === "activity" && <ActivityForm teacherId={teacherId} />}
      {part === "care" && <CarePanel teacherId={teacherId} />}
      {part === "incident" && <IncidentForm teacherId={teacherId} />}
      {part === "summary" && <Summaries teacherId={teacherId} />}
    </div>
  );
}

// ---------- Messages tab ----------
function MessagesTab({ teacherId }) {
  const { state, dispatch } = useDaycare();
  const { t, r, kids } = useRoom(teacherId);
  const [reply, setReply] = useState("");
  const [news, setNews] = useState("");
  const [supplyKid, setSupplyKid] = useState(kids[0]?.id || "");
  const [item, setItem] = useState("A spare set of clothes");
  const [change, setChange] = useState("");
  const [concern, setConcern] = useState("");
  const mine = kids.some((c) => ["maya", "eli"].includes(c.id));
  const thread = state.threads.teacher;
  const families = new Set(kids.map((c) => c.family)).size;
  const tellCarters = (text) => {
    if (mine) dispatch({ type: "notice", text });
  };

  return (
    <div className="bd-c-pad">
      <h3 className="bd-serif bd-c-h">Messages</h3>
      {mine ? (
        <>
          <p className="bd-c-label">Danielle Carter · Maya and Eli’s parent</p>
          <div className="bd-card">
            <div className="bd-sms">
              {thread.messages.map((m, i) => (
                <p
                  key={i}
                  className={m.from === "me" ? "bd-sms-in" : "bd-sms-out"}
                >
                  <span className="bd-sr">
                    {m.from === "me" ? "Parent: " : "You: "}
                  </span>
                  {m.text}
                </p>
              ))}
            </div>
            <form
              className="bd-inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                dispatch({
                  type: "message",
                  thread: "teacher",
                  from: "them",
                  text: reply.trim(),
                  toast: "Sent to Danielle Carter.",
                });
                setReply("");
              }}
            >
              <label className="bd-field">
                <span className="bd-sr">Reply to Danielle Carter</span>
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply"
                />
              </label>
              <button type="submit" className="bd-btn bd-btn-sm">
                Send
              </button>
            </form>
          </div>
        </>
      ) : (
        <p className="bd-hint">No new family messages for {r.name} today.</p>
      )}

      <p className="bd-c-label">Class announcement</p>
      <form
        className="bd-card bd-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!news.trim()) return;
          tellCarters(`Announcement from ${r.name}: ${news.trim()}`);
          dispatch({
            type: "toast",
            text: `Sent to ${families} ${families === 1 ? "family" : "families"} in ${r.name}.`,
          });
          setNews("");
        }}
      >
        <label className="bd-field">
          <span>Message to every family in {r.name}</span>
          <textarea
            rows={2}
            value={news}
            onChange={(e) => setNews(e.target.value)}
            placeholder="Pajama day this Friday! Cozy clothes welcome."
          />
        </label>
        <button
          type="submit"
          className="bd-btn bd-btn-sm"
          disabled={!news.trim()}
        >
          <Icon name="send" size={15} /> Send announcement
        </button>
      </form>

      <p className="bd-c-label">Request supplies</p>
      <form
        className="bd-card bd-form"
        onSubmit={(e) => {
          e.preventDefault();
          const kid = kids.find((c) => c.id === supplyKid);
          if (!kid) return;
          if (["maya", "eli"].includes(kid.id))
            dispatch({
              type: "notice",
              text: `${t.name} asks: ${kid.first} needs ${item.toLowerCase()}.`,
            });
          dispatch({
            type: "toast",
            text: `Request sent to ${kid.first}’s family.`,
          });
        }}
      >
        <label className="bd-field">
          <span>Child</span>
          <select
            value={supplyKid}
            onChange={(e) => setSupplyKid(e.target.value)}
          >
            {kids.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <Chips
          label="Needs"
          options={["A spare set of clothes", "Diapers", "Wipes", "Sunscreen"]}
          value={item}
          onChange={setItem}
        />
        <button type="submit" className="bd-btn bd-btn-sm">
          Ask the family
        </button>
      </form>

      <p className="bd-c-label">Schedule change</p>
      <form
        className="bd-inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!change.trim()) return;
          tellCarters(`Schedule change in ${r.name}: ${change.trim()}`);
          dispatch({
            type: "toast",
            text: `Schedule change shared with ${r.name} families.`,
          });
          setChange("");
        }}
      >
        <label className="bd-field">
          <span className="bd-sr">Schedule change</span>
          <input
            value={change}
            onChange={(e) => setChange(e.target.value)}
            placeholder="Outdoor play moves to 3:30 PM today"
          />
        </label>
        <button type="submit" className="bd-btn bd-btn-sm">
          Share
        </button>
      </form>

      <p className="bd-c-label">Escalate to the director</p>
      <form
        className="bd-card bd-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!concern.trim()) return;
          dispatch({
            type: "alert",
            kind: "escalation",
            text: `${t.name} (${r.name}) escalated a concern: ${concern.trim()}`,
            toast: "Sent to Ms. Joy, the director.",
          });
          setConcern("");
        }}
      >
        <label className="bd-field">
          <span>Concern</span>
          <textarea
            rows={2}
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            placeholder="A parent asked about changing pickup rules. Can you follow up?"
          />
        </label>
        <button
          type="submit"
          className="bd-btn bd-btn-sm bd-btn-soft"
          disabled={!concern.trim()}
        >
          Escalate
        </button>
      </form>
    </div>
  );
}

// ---------- Me tab ----------
function MeTab({ teacherId }) {
  const { state, dispatch } = useDaycare();
  const { t, r } = useRoom(teacherId);
  const [dates, setDates] = useState("Fri, Nov 27");
  const [kind, setKind] = useState("Time off");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const clocked = !!state.clockedIn[teacherId];
  const onBreak = !!state.onBreak?.[teacherId];
  const notes = state.classNotes?.[r.id] || [];
  const mine = state.timeOff.filter((x) => x.staff === teacherId);

  return (
    <div className="bd-c-pad">
      <div className="bd-c-hello">
        <div>
          <p className="bd-eyebrow">{t.role}</p>
          <h3 className="bd-serif bd-c-h">{t.name}</h3>
        </div>
        <button
          type="button"
          className={`bd-clock ${clocked ? "is-in" : ""}`}
          onClick={() => {
            dispatch({
              type: "set",
              key: "clockedIn",
              value: (p) => ({ ...p, [teacherId]: !clocked }),
            });
            dispatch({
              type: "toast",
              text: clocked
                ? `${t.name} clocked out at ${at(NOW)}.`
                : `${t.name} clocked in at ${at(NOW)}.`,
            });
          }}
        >
          <span aria-hidden="true" />
          {clocked ? "Clocked in" : "Clock in"}
        </button>
      </div>
      <div className="bd-card">
        <Toggle
          on={onBreak}
          onChange={() =>
            dispatch({
              type: "set",
              key: "onBreak",
              value: (p) => ({ ...(p || {}), [teacherId]: !onBreak }),
            })
          }
          label="On break"
          hint="Takes you out of the room’s ratio count"
        />
      </div>
      <div className="bd-kpis bd-kpis-3">
        <div className="bd-kpi">
          <span>This week</span>
          <strong className="bd-serif">{t.hours} h</strong>
        </div>
        <div className="bd-kpi">
          <span>Today</span>
          <strong className="bd-serif">8.5 h</strong>
        </div>
        <div className="bd-kpi">
          <span>Break</span>
          <strong className="bd-serif">30 m</strong>
        </div>
      </div>

      <p className="bd-c-label">My shift today</p>
      <div className="bd-card bd-week">
        <div>
          <span>Shift</span>
          <span>7:30 AM – 4:00 PM</span>
        </div>
        <div>
          <span>Break</span>
          <span>1:00 – 1:30 PM</span>
        </div>
        <div>
          <span>Room</span>
          <span>{r.name}</span>
        </div>
      </div>

      <p className="bd-c-label">Classroom schedule</p>
      <ol className="dc-t-sched">
        {SCHEDULE.map(([from, to, what]) => {
          const now = NOW >= from && NOW < to;
          return (
            <li
              key={what}
              className={now ? "is-now" : NOW >= to ? "is-past" : ""}
            >
              <span>
                {at(from)} – {at(to)}
              </span>
              <strong>{what}</strong>
              {now ? <span className="bd-status dc-tone-sky">Now</span> : null}
            </li>
          );
        })}
      </ol>

      <p className="bd-c-label">Staff announcements</p>
      <div className="bd-card bd-note">
        <span className="bd-hint">Ms. Joy · 8:05 AM</span>
        <p>
          Fire drill this Wednesday at 10:15 AM. Take your room’s attendance
          sheet outside.
        </p>
      </div>
      <div className="bd-card bd-note">
        <span className="bd-hint">Ms. Joy · Yesterday</span>
        <p>
          Fall festival Friday 4–6 PM. Sign-up sheet for pumpkin painting is in
          the staff room.
        </p>
      </div>

      <p className="bd-c-label">Time off or availability</p>
      <form
        className="bd-card bd-form"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({
            type: "set",
            key: "timeOff",
            value: (p) => [
              {
                id: `t-${teacherId}-${p.length}`,
                staff: teacherId,
                dates,
                reason: `${kind}${reason.trim() ? `: ${reason.trim()}` : ""}`,
                status: "pending",
              },
              ...p,
            ],
          });
          dispatch({
            type: "alert",
            kind: "timeoff",
            text: `${t.name} requested ${kind.toLowerCase()} for ${dates}.`,
            toast: "Request sent to the director.",
          });
          setReason("");
        }}
      >
        <div
          className="bd-seg bd-seg-sm"
          role="group"
          aria-label="Request type"
        >
          {["Time off", "Availability change"].map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
            >
              {k}
            </button>
          ))}
        </div>
        <label className="bd-field">
          <span>Dates</span>
          <select value={dates} onChange={(e) => setDates(e.target.value)}>
            {[
              "Fri, Nov 27",
              "Mon, Nov 30",
              "Dec 21 – Dec 23",
              "Fridays from December",
            ].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="bd-field">
          <span>Details (optional)</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Doctor’s appointment"
          />
        </label>
        <button type="submit" className="bd-btn bd-btn-block">
          Send request
        </button>
      </form>
      {mine.map((x) => (
        <div key={x.id} className="bd-card bd-past">
          <span>
            <strong>{x.dates}</strong>
            <span className="bd-sub">{x.reason}</span>
          </span>
          <span
            className={`bd-status dc-tone-${x.status === "approved" ? "mint" : x.status === "declined" ? "plain" : "sun"}`}
          >
            {x.status === "pending"
              ? "Pending"
              : x.status === "approved"
                ? "Approved"
                : "Declined"}
          </span>
        </div>
      ))}

      <p className="bd-c-label">Classroom notes</p>
      <form
        className="bd-inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!note.trim()) return;
          dispatch({
            type: "set",
            key: "classNotes",
            value: (p) => ({
              ...(p || {}),
              [r.id]: [
                { text: note.trim(), by: t.name, time: NOW },
                ...((p || {})[r.id] || []),
              ],
            }),
          });
          dispatch({ type: "toast", text: "Note saved for the next shift." });
          setNote("");
        }}
      >
        <label className="bd-field">
          <span className="bd-sr">Classroom note</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Low on glue sticks, paper towels"
          />
        </label>
        <button type="submit" className="bd-btn bd-btn-sm">
          Save
        </button>
      </form>
      {notes.map((n, i) => (
        <div key={i} className="bd-card bd-note">
          <span className="bd-hint">
            {n.by} · {at(n.time)}
          </span>
          <p>{n.text}</p>
        </div>
      ))}

      <button
        type="button"
        className="bd-btn bd-btn-soft bd-btn-block dc-t-help"
        onClick={() =>
          dispatch({
            type: "alert",
            kind: "help",
            text: `${t.name} needs a hand in ${r.name}.`,
            toast: "The director and front desk were notified.",
          })
        }
      >
        <Icon name="bell" size={16} /> Request admin help
      </button>
    </div>
  );
}

export default function TeacherApp() {
  const [teacherId, setTeacherId] = useState("rosa");
  const [tab, setTab] = useState("room");
  const nav = [
    ["room", "users", "Room"],
    ["log", "list", "Log"],
    ["msg", "chat", "Messages"],
    ["me", "user", "Me"],
  ];
  return (
    <div className="bd-tech-wrap">
      <label className="bd-field bd-viewas">
        <span>Signed in as</span>
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
        >
          {TEACHERS.map((id) => {
            const s = staff(id);
            return (
              <option key={id} value={id}>
                {s.name} · {ROOMS.find((r) => r.id === s.room).name}
              </option>
            );
          })}
        </select>
      </label>
      <PhoneFrame
        label="Teacher app"
        footer={
          <nav className="bd-bottomnav" aria-label="Teacher app">
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
        {tab === "room" && <RoomTab key={teacherId} teacherId={teacherId} />}
        {tab === "log" && <LogTab key={teacherId} teacherId={teacherId} />}
        {tab === "msg" && <MessagesTab key={teacherId} teacherId={teacherId} />}
        {tab === "me" && <MeTab key={teacherId} teacherId={teacherId} />}
      </PhoneFrame>
    </div>
  );
}
