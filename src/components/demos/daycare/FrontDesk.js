"use client";

import { useState } from "react";
import { CENTER, FAMILIES, NOW, STAFF, TODAY, at, room } from "./data";
import { useDaycare } from "./store";
import { ChildStatus, Icon, Kid, Person, RoomTag, TabletFrame } from "./ui";
import "./frontdesk.css";

const DESK_STAFF = STAFF.filter((s) =>
  ["priya", "joy", "rosa", "kim"].includes(s.id),
);
const familyByPin = (pin) =>
  Object.entries(FAMILIES).find(([, f]) =>
    f.guardians.some((g) => g.pin === pin),
  );

function Keypad({ value, setValue, length, label, onDone }) {
  const press = (k) => {
    if (k === "back") return setValue(value.slice(0, -1));
    if (k === "clear") return setValue("");
    if (value.length >= length) return;
    const next = value + k;
    setValue(next);
    if (next.length === length) onDone(next);
  };
  return (
    <div className="dc-pad">
      <div
        className="dc-pad-dots"
        role="status"
        aria-label={`${label}: ${value.length} of ${length} digits entered`}
      >
        {Array.from({ length }, (_, i) => (
          <span key={i} className={i < value.length ? "is-on" : ""} />
        ))}
      </div>
      <div className="dc-pad-keys">
        {[
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "clear",
          "0",
          "back",
        ].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            aria-label={
              k === "back" ? "Delete last digit" : k === "clear" ? "Clear" : k
            }
          >
            {k === "back" ? (
              <Icon name="back" size={20} />
            ) : k === "clear" ? (
              "Clear"
            ) : (
              k
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Top({ onHome, title }) {
  return (
    <div className="bd-k-top">
      <button type="button" className="bd-k-logo" onClick={onHome}>
        <span className="dc-logo" aria-hidden="true">
          B
        </span>
        <span>
          <span className="bd-serif">{CENTER.name}</span>
          <span className="bd-hint">
            {title || `${CENTER.location} · Front desk`}
          </span>
        </span>
      </button>
      <span className="bd-k-clock">
        <Icon name="clock" size={16} /> {at(NOW)}
      </span>
    </div>
  );
}

function Back({ onClick, label = "Start over" }) {
  return (
    <button type="button" className="bd-k-back" onClick={onClick}>
      <Icon name="back" size={16} /> {label}
    </button>
  );
}

function Done({ title, lines, onDone, extra }) {
  return (
    <div className="bd-k-done">
      <span className="bd-k-donecheck" aria-hidden="true">
        <Icon name="check" size={34} strokeWidth={2.4} />
      </span>
      <h3 className="bd-k-title bd-serif">{title}</h3>
      {lines.map((l) => (
        <p key={l} className="bd-sub">
          {l}
        </p>
      ))}
      <div className="bd-k-actions is-center">
        <button type="button" className="bd-btn" onClick={onDone}>
          Done
        </button>
        {extra}
      </div>
    </div>
  );
}

function StaffPick({ value, onChange }) {
  return (
    <label className="bd-field dc-staffpick">
      <span>Staff member releasing</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {DESK_STAFF.map((s) => (
          <option key={s.id} value={s.name}>
            {s.name} · {s.role}
          </option>
        ))}
      </select>
    </label>
  );
}

// ---------- Drop-off ----------
function DropOff({ reset }) {
  const { state, dispatch } = useDaycare();
  const [pin, setPin] = useState("");
  const [fam, setFam] = useState(null);
  const [err, setErr] = useState("");
  const [picked, setPicked] = useState([]);
  const [change, setChange] = useState("No changes today");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(null);

  if (done)
    return (
      <Done
        title={`${done.names} ${done.count > 1 ? "are" : "is"} checked in!`}
        lines={[
          `Arrival recorded at ${at(NOW)} by ${done.adult}.`,
          `${done.teachers} alerted, and a confirmation went to the family’s app.`,
        ]}
        onDone={reset}
      />
    );

  if (!fam)
    return (
      <div className="bd-k-flow dc-flow-split">
        <div>
          <Back onClick={reset} />
          <h3 className="bd-k-h bd-serif">Drop-off</h3>
          <p className="bd-sub">
            Enter your 4-digit family PIN, or scan your QR pass from the parent
            app.
          </p>
          <div className="dc-scan">
            <Icon name="qr" size={28} />
            <span>
              <strong>Scan QR pass</strong>
              <span className="bd-hint">Hold your phone under the camera</span>
            </span>
          </div>
          {err ? (
            <p className="bd-hint bd-warn" role="alert">
              {err}
            </p>
          ) : (
            <p className="bd-hint">
              Demo PINs: 1357 (Patel family, late arrival) · 2468 (Carter
              family)
            </p>
          )}
        </div>
        <Keypad
          value={pin}
          setValue={setPin}
          length={4}
          label="Family PIN"
          onDone={(p) => {
            const f = familyByPin(p);
            if (!f) {
              setErr(
                "That PIN didn’t match a family. Try again or ask the front desk.",
              );
              setPin("");
              return;
            }
            setErr("");
            setFam(f);
            setPicked(
              state.children
                .filter((c) => c.family === f[0] && c.status !== "in")
                .map((c) => c.id),
            );
          }}
        />
      </div>
    );

  const [famId, family] = fam;
  const guardian =
    family.guardians.find((g) => g.pin === pin) || family.guardians[0];
  const kids = state.children.filter((c) => c.family === famId);
  const ready = kids.filter((c) => c.status !== "in");
  return (
    <div className="bd-k-flow">
      <Back onClick={reset} />
      <h3 className="bd-k-h bd-serif">
        Good afternoon, {guardian.name.split(" ")[0]}!
      </h3>
      <p className="bd-sub">Who are you dropping off?</p>
      <div className="dc-kidpick">
        {kids.map((c) => {
          const isIn = c.status === "in";
          return (
            <button
              key={c.id}
              type="button"
              className="bd-pick dc-kidcard"
              disabled={isIn}
              aria-pressed={picked.includes(c.id)}
              onClick={() =>
                setPicked((p) =>
                  p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id],
                )
              }
            >
              <Kid child={c} size={52} />
              <span className="bd-pick-name">{c.name}</span>
              <RoomTag id={c.room} />
              {isIn ? (
                <ChildStatus child={c} />
              ) : c.lateNote ? (
                <span className="bd-hint">{c.lateNote}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {ready.length ? (
        <>
          <div
            className="bd-wrapchips dc-health"
            role="group"
            aria-label="Anything we should know today?"
          >
            {[
              "No changes today",
              "Medicine given at home",
              "Didn’t sleep well",
              "Something else",
            ].map((x) => (
              <button
                key={x}
                type="button"
                className="bd-chip"
                aria-pressed={change === x}
                onClick={() => setChange(x)}
              >
                {x}
              </button>
            ))}
          </div>
          {change !== "No changes today" ? (
            <label className="bd-field bd-k-field">
              <span>Note for the teacher</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Tylenol at 7:30 AM for a sore ear"
              />
            </label>
          ) : null}
          <div className="bd-k-actions">
            <button
              type="button"
              className="bd-btn bd-btn-lg"
              disabled={!picked.length}
              onClick={() => {
                const ids = picked;
                const names = ids
                  .map((id) => kids.find((k) => k.id === id).first)
                  .join(" and ");
                const teachers = [
                  ...new Set(
                    ids.map(
                      (id) =>
                        STAFF.find(
                          (s) => s.room === kids.find((k) => k.id === id).room,
                        )?.name,
                    ),
                  ),
                ].join(" and ");
                dispatch({
                  type: "checkIn",
                  ids,
                  adult: guardian.name,
                  note:
                    change !== "No changes today"
                      ? `${change}${note ? `: ${note}` : ""}`
                      : "",
                });
                setDone({
                  names,
                  count: ids.length,
                  adult: guardian.name,
                  teachers,
                });
              }}
            >
              Check in <Icon name="arrow" size={18} />
            </button>
          </div>
        </>
      ) : (
        <p className="bd-sub">Everyone is already checked in today.</p>
      )}
    </div>
  );
}

// ---------- Staff verification for a guest pass ----------
function GuestVerify({ guest, reset }) {
  const { state, dispatch } = useDaycare();
  const [face, setFace] = useState(false);
  const [id, setId] = useState(false);
  const [staffName, setStaffName] = useState("Ms. Priya");
  const [result, setResult] = useState(null);
  const kids = guest.children.map((cid) =>
    state.children.find((c) => c.id === cid),
  );
  const restriction = kids
    .map((k) => FAMILIES[k.family]?.restriction)
    .find(Boolean);

  if (result === "ok")
    return (
      <Done
        title={`${kids.map((k) => k.first).join(" and ")} ${kids.length > 1 ? "are" : "is"} on the way!`}
        lines={[
          `Released to ${guest.legalName || guest.name} at ${at(NOW)}, approved by ${staffName}.`,
          "The one-time pass is now used up, and Danielle got a pickup confirmation.",
        ]}
        onDone={reset}
      />
    );
  if (result === "no")
    return (
      <Done
        title="Release refused"
        lines={[
          `${kids.map((k) => k.first).join(" and ")} stays with staff. The attempt was logged and the director and guardians were notified.`,
        ]}
        onDone={reset}
      />
    );

  return (
    <div className="bd-k-flow">
      <div className="bd-k-flowtop">
        <Back onClick={reset} />
        <span className="bd-status dc-tone-sun">
          <Icon name="lock" size={13} /> Staff only
        </span>
      </div>
      <h3 className="bd-k-h bd-serif">Verify before release</h3>
      <div className="dc-verify">
        <section className="bd-card" aria-label="Child">
          <p className="bd-eyebrow">Releasing</p>
          {kids.map((k) => (
            <div key={k.id} className="dc-verify-kid">
              <Kid child={k} size={48} />
              <span>
                <strong>{k.name}</strong>
                <RoomTag id={k.room} />
                <span className="bd-hint">{k.age}</span>
              </span>
              <ChildStatus child={k} />
            </div>
          ))}
          <dl className="bd-dl bd-dl-tight">
            <div>
              <dt>Authorized by</dt>
              <dd>{guest.by} (verified parent)</dd>
            </div>
            <div>
              <dt>Valid</dt>
              <dd>
                {guest.date} · {at(guest.from)} – {at(guest.to)} · {guest.type}
              </dd>
            </div>
            <div>
              <dt>Instructions</dt>
              <dd>{guest.notes || "None"}</dd>
            </div>
          </dl>
          {restriction ? (
            <p className="dc-alert-box">
              <Icon name="alert" size={18} /> {restriction}
            </p>
          ) : (
            <p className="bd-hint">
              <Icon name="shield" size={14} /> No custody restrictions on file
              for this child.
            </p>
          )}
        </section>
        <section className="bd-card" aria-label="Pickup person">
          <p className="bd-eyebrow">Pickup person</p>
          <div className="dc-verify-guest">
            {guest.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={guest.photo}
                alt={`Photo submitted by ${guest.legalName || guest.name}`}
                className="dc-guest-photo"
              />
            ) : (
              <span
                className="dc-guest-photo dc-guest-sample"
                role="img"
                aria-label={`Sample photo for ${guest.name}`}
              >
                <Person name={guest.name} size={96} tone="sun" />
              </span>
            )}
            <span>
              <strong>{guest.legalName || guest.name}</strong>
              <span className="bd-sub">{guest.relation}</span>
              <span className="bd-hint">{guest.phone}</span>
              <span className="bd-hint">
                ID on form: {guest.idType || "—"} ending {guest.idLast4 || "—"}
              </span>
              <span className="bd-status dc-tone-mint">
                Code valid · pass verified
              </span>
            </span>
          </div>
          <div className="dc-checks">
            <label className="bd-check">
              <input
                type="checkbox"
                checked={face}
                onChange={(e) => setFace(e.target.checked)}
              />
              <span>The person in front of me matches the submitted photo</span>
            </label>
            <label className="bd-check">
              <input
                type="checkbox"
                checked={id}
                onChange={(e) => setId(e.target.checked)}
              />
              <span>I checked a photo ID and the name matches</span>
            </label>
          </div>
          <StaffPick value={staffName} onChange={setStaffName} />
          <div className="bd-row-btns">
            <button
              type="button"
              className="bd-btn bd-btn-ghost"
              onClick={() => {
                kids.forEach((k) =>
                  dispatch({
                    type: "refuse",
                    child: k.id,
                    who: guest.legalName || guest.name,
                    what: "Identity could not be verified at the front desk.",
                    staff: staffName,
                    guest: guest.id,
                  }),
                );
                setResult("no");
              }}
            >
              Refuse release
            </button>
            <button
              type="button"
              className="bd-btn"
              disabled={!face || !id || !!restriction}
              onClick={() => {
                kids.forEach((k) =>
                  dispatch({
                    type: "release",
                    child: k.id,
                    by: guest.legalName || guest.name,
                    relation: guest.relation,
                    staff: staffName,
                    method: "Guest pass",
                    guest: guest.id,
                  }),
                );
                setResult("ok");
              }}
            >
              Approve release
            </button>
          </div>
          <p className="bd-hint">
            A code alone never releases a child. Both checks are required.
          </p>
        </section>
      </div>
    </div>
  );
}

// ---------- Pickup ----------
function Pickup({ reset, goTo }) {
  const { state, dispatch } = useDaycare();
  const [mode, setMode] = useState(null);
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [tries, setTries] = useState(0);
  const [guest, setGuest] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [fam, setFam] = useState(null);
  const [picked, setPicked] = useState([]);
  const [known, setKnown] = useState(false);
  const [staffName, setStaffName] = useState("Ms. Priya");
  const [done, setDone] = useState(null);
  const [manual, setManual] = useState({
    child: "noah",
    name: "",
    relation: "Uncle",
  });
  const [checked, setChecked] = useState(null);

  if (done)
    return <Done title={done.title} lines={done.lines} onDone={reset} />;
  if (guest && !waiting) return <GuestVerify guest={guest} reset={reset} />;

  if (guest && waiting)
    return (
      <div className="bd-k-done">
        <span className="bd-k-donecheck dc-wait" aria-hidden="true">
          <Icon name="shield" size={34} />
        </span>
        <h3 className="bd-k-title bd-serif">
          Thanks, {(guest.legalName || guest.name).split(" ")[0]}.
        </h3>
        <p className="bd-sub">
          Your code is valid. A staff member is coming to check your ID before
          anyone is released.
        </p>
        <p className="bd-hint">Danielle was notified that you’ve arrived.</p>
        <div className="bd-k-actions is-center">
          <button
            type="button"
            className="bd-btn"
            onClick={() => setWaiting(false)}
          >
            <Icon name="lock" size={16} /> Staff: verify now
          </button>
        </div>
      </div>
    );

  if (!mode)
    return (
      <div className="bd-k-flow">
        <Back onClick={reset} />
        <h3 className="bd-k-h bd-serif">Pickup</h3>
        <div className="dc-modes">
          <button
            type="button"
            className="bd-k-choice is-main"
            onClick={() => setMode("parent")}
          >
            <Icon name="heart" size={26} />
            <span>
              <strong>Parent or guardian</strong>
              <span>Enter your family PIN</span>
            </span>
          </button>
          <button
            type="button"
            className="bd-k-choice"
            onClick={() => setMode("pass")}
          >
            <Icon name="key" size={26} />
            <span>
              <strong>I have a pickup pass</strong>
              <span>Enter the code a parent sent you</span>
            </span>
          </button>
          <button
            type="button"
            className="bd-k-choice"
            onClick={() => setMode("manual")}
          >
            <Icon name="alert" size={26} />
            <span>
              <strong>Someone not on the list</strong>
              <span>Staff handle this by hand</span>
            </span>
          </button>
        </div>
      </div>
    );

  if (mode === "pass") {
    const locked = tries >= 3;
    const tryCode = (code) => {
      const g = state.guests.find((x) => x.code === code);
      setValue("");
      if (!g) {
        const n = tries + 1;
        setTries(n);
        dispatch({ type: "badCode", code, locked: n >= 3 });
        setErr(
          n >= 3
            ? "Too many tries. Code entry is locked. Please see a staff member."
            : `That code didn’t work. ${3 - n} ${3 - n === 1 ? "try" : "tries"} left.`,
        );
        return;
      }
      if (g.status === "revoked")
        return setErr(
          "This pass was revoked by the parent. Please see a staff member.",
        );
      if (g.status === "used")
        return setErr("This one-time pass was already used.");
      if (g.date !== TODAY || NOW < g.from || NOW > g.to)
        return setErr(
          `This pass is valid ${g.date}, ${at(g.from)} – ${at(g.to)}.`,
        );
      setErr("");
      const kids = g.children.map((cid) =>
        state.children.find((c) => c.id === cid),
      );
      dispatch({
        type: "guestArrived",
        name: g.legalName || g.name,
        childName: kids.map((k) => k.name).join(" and "),
      });
      setGuest(g);
      setWaiting(true);
    };
    const pending = state.guests.find((g) => g.status === "verified");
    return (
      <div className="bd-k-flow dc-flow-split">
        <div>
          <Back onClick={reset} />
          <h3 className="bd-k-h bd-serif">Enter your pickup code</h3>
          <p className="bd-sub">
            It’s on the pass the parent sent you. You’ll still need to show ID.
          </p>
          <button
            type="button"
            className="dc-scan"
            disabled={!pending || locked}
            onClick={() => pending && tryCode(pending.code)}
          >
            <Icon name="qr" size={28} />
            <span>
              <strong>Scan pickup pass</strong>
              <span className="bd-hint">
                {pending
                  ? "Hold the QR code under the camera"
                  : "No verified pass yet. Complete the Guest pass first."}
              </span>
            </span>
          </button>
          {err ? (
            <p className="bd-hint bd-warn" role="alert">
              {err}
            </p>
          ) : (
            <p className="bd-hint">
              No code yet?{" "}
              <button
                type="button"
                className="bd-link"
                onClick={() => goTo("guest")}
              >
                Open the Guest pass view
              </button>
            </p>
          )}
        </div>
        {locked ? (
          <div className="dc-locked">
            <Icon name="lock" size={30} />
            <p>
              Code entry locked after 3 failed tries. The attempt was logged for
              the director.
            </p>
          </div>
        ) : (
          <Keypad
            value={value}
            setValue={setValue}
            length={6}
            label="Pickup code"
            onDone={tryCode}
          />
        )}
      </div>
    );
  }

  if (mode === "parent") {
    if (!fam)
      return (
        <div className="bd-k-flow dc-flow-split">
          <div>
            <Back onClick={reset} />
            <h3 className="bd-k-h bd-serif">Parent pickup</h3>
            <p className="bd-sub">Enter your family PIN.</p>
            {err ? (
              <p className="bd-hint bd-warn" role="alert">
                {err}
              </p>
            ) : (
              <p className="bd-hint">
                Demo PINs: 2468 (Carter family) · 8642 (Brooks family)
              </p>
            )}
          </div>
          <Keypad
            value={value}
            setValue={setValue}
            length={4}
            label="Family PIN"
            onDone={(p) => {
              const f = familyByPin(p);
              setValue("");
              if (!f) return setErr("That PIN didn’t match a family.");
              setErr("");
              setFam([...f, p]);
              setPicked(
                state.children
                  .filter((c) => c.family === f[0] && c.status === "in")
                  .map((c) => c.id),
              );
            }}
          />
        </div>
      );
    const [famId, family, p] = fam;
    const g = family.guardians.find((x) => x.pin === p) || family.guardians[0];
    const kids = state.children.filter((c) => c.family === famId);
    return (
      <div className="bd-k-flow">
        <Back onClick={reset} />
        <h3 className="bd-k-h bd-serif">
          Hi {g.name.split(" ")[0]}! Who’s going home?
        </h3>
        <div className="dc-kidpick">
          {kids.map((c) => (
            <button
              key={c.id}
              type="button"
              className="bd-pick dc-kidcard"
              disabled={c.status !== "in"}
              aria-pressed={picked.includes(c.id)}
              onClick={() =>
                setPicked((x) =>
                  x.includes(c.id) ? x.filter((y) => y !== c.id) : [...x, c.id],
                )
              }
            >
              <Kid child={c} size={52} />
              <span className="bd-pick-name">{c.name}</span>
              <RoomTag id={c.room} />
              <ChildStatus child={c} />
            </button>
          ))}
        </div>
        <div className="bd-card dc-staffbox">
          <p className="bd-eyebrow">
            <Icon name="lock" size={13} /> Staff confirmation
          </p>
          <label className="bd-check">
            <input
              type="checkbox"
              checked={known}
              onChange={(e) => setKnown(e.target.checked)}
            />
            <span>
              I know {g.name} as this child’s guardian, or I checked a photo ID
            </span>
          </label>
          <StaffPick value={staffName} onChange={setStaffName} />
        </div>
        <div className="bd-k-actions">
          <button
            type="button"
            className="bd-btn bd-btn-lg"
            disabled={!picked.length || !known}
            onClick={() => {
              picked.forEach((id) =>
                dispatch({
                  type: "release",
                  child: id,
                  by: g.name,
                  relation: g.relation,
                  staff: staffName,
                  method: "Parent PIN",
                }),
              );
              setDone({
                title: "Have a great evening!",
                lines: [
                  `${picked.map((id) => kids.find((k) => k.id === id).first).join(" and ")} released to ${g.name} at ${at(NOW)} by ${staffName}.`,
                  "Attendance updated and the other guardian was notified.",
                ],
              });
            }}
          >
            Release <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Someone not on the authorized list: staff only, and the system never allows release here.
  const kid = state.children.find((c) => c.id === manual.child);
  const restriction = FAMILIES[kid.family]?.restriction;
  const restrictedName = restriction?.match(
    /release to ([A-Z][a-z]+ [A-Z][a-z]+)/,
  )?.[1];
  const hit =
    restrictedName &&
    manual.name
      .trim()
      .toLowerCase()
      .split(" ")
      .some(
        (w) => w && restrictedName.toLowerCase().includes(w) && w.length > 2,
      );
  return (
    <div className="bd-k-flow">
      <div className="bd-k-flowtop">
        <Back onClick={reset} />
        <span className="bd-status dc-tone-sun">
          <Icon name="lock" size={13} /> Staff only
        </span>
      </div>
      <h3 className="bd-k-h bd-serif">Unexpected pickup</h3>
      <p className="bd-sub">
        Check the request against the child’s authorized list and restrictions.
      </p>
      <div className="bd-k-grid2">
        <label className="bd-field bd-k-field">
          <span>Child</span>
          <select
            value={manual.child}
            onChange={(e) => {
              setManual({ ...manual, child: e.target.value });
              setChecked(null);
            }}
          >
            {state.children
              .filter((c) => c.status === "in")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {room(c.room).name}
                </option>
              ))}
          </select>
        </label>
        <label className="bd-field bd-k-field">
          <span>Adult’s full name</span>
          <input
            value={manual.name}
            onChange={(e) => {
              setManual({ ...manual, name: e.target.value });
              setChecked(null);
            }}
            placeholder="Try “Marcus Brooks” for Noah"
            autoComplete="off"
          />
        </label>
      </div>
      <div className="bd-k-actions">
        <button
          type="button"
          className="bd-btn"
          disabled={!manual.name.trim()}
          onClick={() => setChecked(hit ? "restricted" : "unlisted")}
        >
          Check authorization
        </button>
      </div>
      {checked === "restricted" ? (
        <div className="dc-alert-box dc-alert-big" role="alert">
          <Icon name="alert" size={22} />
          <span>
            <strong>Do not release.</strong> {restriction}
            <span className="bd-hint">
              Keep {kid.first} with staff, stay calm, and contact the director.
              Follow your emergency procedure if needed.
            </span>
          </span>
        </div>
      ) : checked === "unlisted" ? (
        <div className="dc-alert-box dc-alert-warn" role="alert">
          <Icon name="shield" size={22} />
          <span>
            <strong>
              {manual.name} isn’t authorized for {kid.first}.
            </strong>{" "}
            A guardian must add them in the app and they must complete
            verification. Release isn’t possible from here.
          </span>
        </div>
      ) : null}
      {checked ? (
        <div className="bd-row-btns">
          {checked === "unlisted" ? (
            <button
              type="button"
              className="bd-btn bd-btn-soft"
              onClick={() =>
                dispatch({
                  type: "alert",
                  kind: "guest",
                  text: `Front desk called ${FAMILIES[kid.family].guardians[0].name} about an unexpected pickup request for ${kid.name}.`,
                  toast: `Calling ${FAMILIES[kid.family].guardians[0].name} (${FAMILIES[kid.family].guardians[0].phone})…`,
                })
              }
            >
              <Icon name="phone" size={16} /> Call guardian
            </button>
          ) : null}
          <button
            type="button"
            className="bd-btn"
            onClick={() => {
              dispatch({
                type: "refuse",
                child: kid.id,
                who: manual.name,
                what:
                  checked === "restricted"
                    ? "Matched a custody restriction. Release refused."
                    : "Not on the authorized pickup list. Release refused.",
                staff: "Ms. Priya",
              });
              setDone({
                title: `${kid.first} stays with us`,
                lines: [
                  "Refusal logged with time and staff name.",
                  "The director and the child’s guardians were notified.",
                ],
              });
            }}
          >
            Refuse and notify director
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function FrontDesk({ goTo }) {
  const { state } = useDaycare();
  const [screen, setScreen] = useState("home");
  const [key, setKey] = useState(0);
  const reset = () => {
    setScreen("home");
    setKey((k) => k + 1);
  };
  const present = state.children.filter((c) => c.status === "in").length;
  const late = state.children.filter((c) => c.status === "expected");
  const guestsToday = state.guests.filter(
    (g) => g.date === TODAY && ["invited", "verified"].includes(g.status),
  );
  return (
    <TabletFrame label="Front desk check-in and pickup tablet">
      <div className="bd-k">
        <Top onHome={reset} />
        {screen === "home" && (
          <div className="bd-k-welcome">
            <div className="bd-k-hello">
              <p className="bd-eyebrow">Welcome</p>
              <h3 className="bd-k-title bd-serif">
                Hello, <em>friends!</em>
              </h3>
              <p className="bd-sub">
                Dropping off or picking up? Every pickup is confirmed by a staff
                member.
              </p>
              <div className="bd-k-choices">
                <button
                  type="button"
                  className="bd-k-choice is-main"
                  onClick={() => setScreen("drop")}
                >
                  <Icon name="sun" size={26} />
                  <span>
                    <strong>Drop-off</strong>
                    <span>Check in with your family PIN or QR</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="bd-k-choice"
                  onClick={() => setScreen("pickup")}
                >
                  <Icon name="door" size={26} />
                  <span>
                    <strong>Pickup</strong>
                    <span>Parents, guardians and approved guests</span>
                  </span>
                </button>
              </div>
            </div>
            <aside className="bd-k-side">
              <div className="bd-k-wait">
                <span className="bd-hint">Here today</span>
                <strong className="bd-serif">
                  {present} <small>of {state.children.length}</small>
                </strong>
                <span>{TODAY}</span>
              </div>
              <div className="bd-card dc-desk-list">
                <p className="bd-eyebrow">Expected</p>
                {late.length ? (
                  late.map((c) => (
                    <p key={c.id} className="dc-desk-row">
                      <Kid child={c} size={28} /> <span>{c.name}</span>{" "}
                      <span className="bd-hint">~12:45 PM</span>
                    </p>
                  ))
                ) : (
                  <p className="bd-hint">Everyone’s here.</p>
                )}
                <p className="bd-eyebrow">Guest pickups today</p>
                {guestsToday.length ? (
                  guestsToday.map((g) => (
                    <p key={g.id} className="dc-desk-row">
                      <Person name={g.name} size={28} tone="sun" />{" "}
                      <span>{g.name}</span>
                      <span className="bd-hint">
                        {at(g.from)}–{at(g.to)}
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="bd-hint">None right now.</p>
                )}
              </div>
            </aside>
          </div>
        )}
        {screen === "drop" && <DropOff key={key} reset={reset} />}
        {screen === "pickup" && <Pickup key={key} reset={reset} goTo={goTo} />}
      </div>
    </TabletFrame>
  );
}
