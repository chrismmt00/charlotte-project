"use client";

import { useState } from "react";
import { CENTER, NOW, TODAY, at, room } from "./data";
import { useDaycare } from "./store";
import { FakeQr, Icon, Kid, Person, PhoneFrame, RoomTag } from "./ui";
import "./parent.css";

const codeFor = (id) =>
  id === "g1"
    ? "482913"
    : String(
        100000 +
          ([...id].reduce(
            (h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0,
            17,
          ) %
            900000),
      );
const pretty = (code) => `${code.slice(0, 3)} ${code.slice(3)}`;

function Invite({ g, kids, onOpen }) {
  return (
    <div className="bd-c-pad dc-g-sms">
      <div className="dc-g-smshead">
        <span className="dc-logo" aria-hidden="true">
          B
        </span>
        <span>
          <strong>{CENTER.name}</strong>
          <span className="bd-hint">Text message</span>
        </span>
      </div>
      <div className="bd-sms">
        <p className="bd-sms-in">
          Hi {g.name.split(" ")[0]}! {g.by} authorized you to pick up{" "}
          {kids.map((k) => k.name).join(" and ")} on {g.date} between{" "}
          {at(g.from)} and {at(g.to)}. Verify your identity to get your pickup
          pass: {CENTER.url}/v/7KQ2
        </p>
        <p className="bd-sms-in">
          This link is just for you and expires in 24 hours. Questions? Call{" "}
          {CENTER.phone}.
        </p>
      </div>
      <button type="button" className="bd-btn bd-btn-block" onClick={onOpen}>
        <Icon name="lock" size={16} /> Open secure link
      </button>
    </div>
  );
}

function VerifyForm({ g, kids, onDone }) {
  const { dispatch } = useDaycare();
  const [legalName, setLegalName] = useState(g.name);
  const [phone, setPhone] = useState(g.phone);
  const [photo, setPhoto] = useState(null);
  const [sample, setSample] = useState(false);
  const [idType, setIdType] = useState("Driver’s license");
  const [idLast4, setIdLast4] = useState("");
  const [rules, setRules] = useState({
    bring: false,
    check: false,
    share: false,
  });
  const ok =
    legalName.trim().split(" ").length >= 2 &&
    phone.replace(/\D/g, "").length >= 10 &&
    (photo || sample) &&
    idLast4.length === 4 &&
    rules.bring &&
    rules.check &&
    rules.share;
  return (
    <div className="bd-c-pad">
      <p className="bd-eyebrow">{CENTER.short} · Secure form</p>
      <h3 className="bd-serif bd-c-h">Verify your identity</h3>
      <div className="bd-card dc-g-who">
        {kids.map((k) => (
          <span key={k.id} className="bd-row-gap">
            <Kid child={k} size={36} />
            <span>
              <strong>{k.name}</strong>
              <RoomTag id={k.room} />
            </span>
          </span>
        ))}
        <span className="bd-hint">
          {g.date} · {at(g.from)} – {at(g.to)} · {g.type} · authorized by {g.by}
        </span>
      </div>
      <div className="dc-p-form">
        <label className="bd-field">
          <span>Full legal name (as on your ID)</span>
          <input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            autoComplete="off"
          />
        </label>
        <div className="bd-form-2">
          <label className="bd-field">
            <span>Mobile</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="off"
            />
          </label>
          <label className="bd-field">
            <span>Relationship</span>
            <input value={g.relation} readOnly />
          </label>
        </div>
        <p className="bd-mini">A clear photo of your face</p>
        <label className="bd-upload dc-g-photo">
          <input
            type="file"
            accept="image/*"
            capture="user"
            className="bd-sr"
            aria-label="Face photo"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setPhoto(URL.createObjectURL(f));
                setSample(false);
              }
            }}
          />
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Your face photo" />
          ) : sample ? (
            <Person name={legalName || g.name} size={88} tone="sun" />
          ) : (
            <>
              <Icon name="camera" size={24} />
              <span>Take or upload a photo</span>
              <span className="bd-hint">
                Staff compare it with you at pickup. Stays on this device in the
                demo.
              </span>
            </>
          )}
        </label>
        {!photo ? (
          <button
            type="button"
            className="bd-link"
            onClick={() => setSample(true)}
          >
            {sample ? "Using a sample photo" : "Use a sample photo instead"}
          </button>
        ) : null}
        <div className="bd-form-2">
          <label className="bd-field">
            <span>Photo ID you’ll show</span>
            <select value={idType} onChange={(e) => setIdType(e.target.value)}>
              {["Driver’s license", "State ID", "Passport"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="bd-field">
            <span>Last 4 of ID number</span>
            <input
              value={idLast4}
              onChange={(e) =>
                setIdLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              inputMode="numeric"
              placeholder="1234"
              autoComplete="off"
            />
          </label>
        </div>
        <div className="dc-checks">
          <label className="bd-check">
            <input
              type="checkbox"
              checked={rules.bring}
              onChange={(e) => setRules({ ...rules, bring: e.target.checked })}
            />
            <span>I’ll bring this photo ID to pickup</span>
          </label>
          <label className="bd-check">
            <input
              type="checkbox"
              checked={rules.check}
              onChange={(e) => setRules({ ...rules, check: e.target.checked })}
            />
            <span>
              I understand staff will check my ID and won’t release a child if
              they can’t verify me
            </span>
          </label>
          <label className="bd-check">
            <input
              type="checkbox"
              checked={rules.share}
              onChange={(e) => setRules({ ...rules, share: e.target.checked })}
            />
            <span>I won’t share my pickup pass with anyone</span>
          </label>
        </div>
      </div>
      <button
        type="button"
        className="bd-btn bd-btn-block dc-p-gap"
        disabled={!ok}
        onClick={() => {
          dispatch({
            type: "verifyGuest",
            id: g.id,
            code: codeFor(g.id),
            patch: {
              legalName: legalName.trim(),
              phone,
              photo,
              sample: !photo,
              idType,
              idLast4,
            },
          });
          onDone();
        }}
      >
        Submit and get my pass
      </button>
      {!ok ? (
        <p className="bd-hint">
          Fill in every field, add a photo and tick all three boxes.
        </p>
      ) : null}
    </div>
  );
}

function Pass({ g, kids, goTo }) {
  const expired = g.status === "verified" && (g.date !== TODAY || NOW > g.to);
  const state =
    g.status === "revoked"
      ? "revoked"
      : g.status === "used"
        ? "used"
        : expired
          ? "expired"
          : "ok";
  return (
    <div className="bd-c-pad">
      <p className="bd-eyebrow">{CENTER.short} · Pickup pass</p>
      <div className={`dc-g-pass is-${state}`}>
        <div className="dc-g-pass-top">
          <Person
            name={g.legalName || g.name}
            size={44}
            tone="sun"
            photo={g.photo}
          />
          <span>
            <strong>{g.legalName || g.name}</strong>
            <span className="bd-hint">{g.relation}</span>
          </span>
        </div>
        {state === "ok" ? (
          <>
            <FakeQr seed={g.code} size={168} />
            <span
              className="dc-g-code"
              aria-label={`Pickup code ${g.code.split("").join(" ")}`}
            >
              {pretty(g.code)}
            </span>
          </>
        ) : (
          <div className="dc-g-void" role="status">
            <Icon name={state === "used" ? "check" : "x"} size={34} />
            <strong>
              {state === "revoked"
                ? "This pass was revoked"
                : state === "used"
                  ? "Pickup complete"
                  : "This pass has expired"}
            </strong>
            <span>
              {state === "revoked"
                ? `${g.by} cancelled this authorization. It can’t be used.`
                : state === "used"
                  ? `Used at ${at(g.usedAt || NOW)}. One-time passes can’t be reused.`
                  : "Ask the parent to send a new authorization."}
            </span>
          </div>
        )}
        <dl className="bd-dl bd-dl-tight">
          <div>
            <dt>Picking up</dt>
            <dd>
              {kids.map((k) => `${k.name} · ${room(k.room).name}`).join(", ")}
            </dd>
          </div>
          <div>
            <dt>Valid</dt>
            <dd>
              {g.date} · {at(g.from)} – {at(g.to)}
            </dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>
              {g.type === "One-time" ? "One-time · works once" : "Recurring"}
            </dd>
          </div>
        </dl>
      </div>
      {state === "ok" ? (
        <>
          <p className="bd-policy">
            <Icon name="id" size={18} />
            <span>
              Bring your {g.idType || "photo ID"}. This code alone won’t release{" "}
              {kids.map((k) => k.first).join(" or ")}. Staff will match your
              face and ID first.
            </span>
          </p>
          <button
            type="button"
            className="bd-btn bd-btn-block dc-p-gap"
            onClick={() => goTo("desk")}
          >
            I’m at the front desk <Icon name="arrow" size={16} />
          </button>
        </>
      ) : null}
    </div>
  );
}

export default function GuestPass({ goTo }) {
  const { state } = useDaycare();
  const options = state.guests.filter((g) => g.by === "Danielle Carter");
  const [pick, setPick] = useState(options[0]?.id);
  const [opened, setOpened] = useState(false);
  const g = state.guests.find((x) => x.id === pick) || options[0];
  const kids = g
    ? g.children.map((id) => state.children.find((c) => c.id === id))
    : [];
  let body;
  if (!g)
    body = (
      <div className="bd-c-pad">
        <h3 className="bd-serif bd-c-h">No invites yet</h3>
        <p className="bd-sub">
          In the Parent app, open Pickup and tap “Authorize someone else”.
        </p>
        <button type="button" className="bd-btn" onClick={() => goTo("parent")}>
          Open the Parent app
        </button>
      </div>
    );
  else if (g.status === "invited" && !opened)
    body = <Invite g={g} kids={kids} onOpen={() => setOpened(true)} />;
  else if (g.status === "invited")
    body = (
      <VerifyForm
        key={g.id}
        g={g}
        kids={kids}
        onDone={() => setOpened(false)}
      />
    );
  else body = <Pass g={g} kids={kids} goTo={goTo} />;

  return (
    <div className="bd-tech-wrap">
      {options.length > 1 ? (
        <label className="bd-field bd-viewas">
          <span>Guest’s phone</span>
          <select
            value={g?.id}
            onChange={(e) => {
              setPick(e.target.value);
              setOpened(false);
            }}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} · {o.date}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <PhoneFrame label="Guest’s phone with the pickup invite">
        {body}
      </PhoneFrame>
    </div>
  );
}
