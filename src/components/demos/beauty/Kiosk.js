"use client";

import { useState } from "react";
import {
  CATEGORIES,
  SALON,
  SERVICES,
  TECHS,
  clock,
  svc,
  svcMins,
  svcNames,
  tech,
} from "./data";
import { useDemo, waitFor } from "./store";
import { Avatar, Icon, Sparkles, Status, TabletFrame, money } from "./ui";

function techState(state, id) {
  if (!state.clockedIn[id]) return ["Not in today", "plain"];
  if (state.onBreak[id]) return ["On a short break", "peach"];
  const busy =
    state.queue.some(
      (q) => q.tech === id && ["assigned", "service"].includes(q.status),
    ) || state.appts.some((a) => a.tech === id && a.status === "service");
  return busy ? ["With a client", "lilac"] : ["Free now", "mint"];
}

function KioskTop({ onHome }) {
  return (
    <div className="bd-k-top">
      <button type="button" className="bd-k-logo" onClick={onHome}>
        <span className="bd-logo-mark">L</span>
        <span>
          <span className="bd-serif">{SALON.name}</span>
          <span className="bd-hint">Walk-ins welcome</span>
        </span>
      </button>
      <span className="bd-k-clock">
        <Icon name="clock" size={16} /> {clock(310)}
      </span>
    </div>
  );
}

function Steps({ at }) {
  const steps = ["You", "Services", "Technician", "Confirm"];
  return (
    <ol className="bd-k-steps" aria-label="Check-in steps">
      {steps.map((s, i) => (
        <li
          key={s}
          aria-current={i === at ? "step" : undefined}
          className={i < at ? "is-done" : ""}
        >
          <span>
            {i < at ? <Icon name="check" size={12} strokeWidth={2.4} /> : i + 1}
          </span>
          {s}
        </li>
      ))}
    </ol>
  );
}

function CheckIn({ goTo }) {
  const { state, dispatch } = useDemo();
  const [screen, setScreen] = useState("welcome");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [texts, setTexts] = useState(true);
  const [picked, setPicked] = useState([]);
  const [pref, setPref] = useState("any");
  const [lookup, setLookup] = useState("");
  const [lastId, setLastId] = useState(null);

  const reset = () => {
    setScreen("welcome");
    setName("");
    setPhone("");
    setPicked([]);
    setPref("any");
    setLookup("");
  };
  const waiting = state.queue.filter((q) => q.status === "waiting");
  const nextWait = waitFor(state, "__new");
  const first = name.trim().split(" ")[0];
  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = () => {
    const before = new Set(state.queue.map((q) => q.id));
    dispatch({
      type: "checkIn",
      name: name.trim(),
      services: picked,
      pref,
      texts: texts && !!phone,
    });
    setLastId(before);
    setScreen("done");
  };
  const mine = lastId ? state.queue.find((q) => !lastId.has(q.id)) : null;
  const position = mine
    ? state.queue
        .filter((q) => q.status === "waiting")
        .findIndex((q) => q.id === mine.id) + 1
    : 0;

  if (screen === "welcome")
    return (
      <div className="bd-k-welcome">
        <div className="bd-k-hello">
          <Sparkles className="bd-k-spark" />
          <p className="bd-eyebrow">Hi, gorgeous</p>
          <h3 className="bd-k-title bd-serif">
            Welcome to <em>{SALON.short}</em>
          </h3>
          <p className="bd-sub">
            Check in for a walk-in or let us know you’re here for your
            appointment.
          </p>
          <div className="bd-k-choices">
            <button
              type="button"
              className="bd-k-choice is-main"
              onClick={() => setScreen("who")}
            >
              <Icon name="sparkle" size={26} />
              <span>
                <strong>I’m a walk-in</strong>
                <span>Join the list in under a minute</span>
              </span>
            </button>
            <button
              type="button"
              className="bd-k-choice"
              onClick={() => setScreen("appt")}
            >
              <Icon name="calendar" size={26} />
              <span>
                <strong>I have an appointment</strong>
                <span>Let your technician know you’re here</span>
              </span>
            </button>
          </div>
        </div>
        <aside className="bd-k-side">
          <div className="bd-k-wait">
            <span className="bd-hint">Current walk-in wait</span>
            <strong className="bd-serif">~{nextWait} min</strong>
            <span>
              {waiting.length} {waiting.length === 1 ? "guest" : "guests"} ahead
            </span>
          </div>
          <div className="bd-k-qr">
            <FakeQr />
            <span>
              <strong>Skip the tablet</strong>
              Scan to check in from your phone
            </span>
          </div>
        </aside>
      </div>
    );

  if (screen === "appt") {
    const found =
      lookup.replace(/\D/g, "").length >= 4 || lookup.trim().length >= 3;
    const appt = state.appts.find((a) => a.id === "a8");
    return (
      <div className="bd-k-flow">
        <button type="button" className="bd-k-back" onClick={reset}>
          <Icon name="back" size={16} /> Start over
        </button>
        <h3 className="bd-k-h bd-serif">Find your appointment</h3>
        <label className="bd-field bd-k-field">
          <span>Your mobile number or name</span>
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="e.g. Hannah"
            autoComplete="off"
          />
        </label>
        {found ? (
          <div className="bd-card bd-k-found">
            <Avatar id={appt.tech} size={48} />
            <div>
              <p className="bd-eyebrow">Found it</p>
              <strong>
                {appt.client} · {clock(appt.start)}
              </strong>
              <span className="bd-sub">
                {svcNames(appt.services)} with {tech(appt.tech).name} ·{" "}
                {appt.group}
              </span>
            </div>
            <button
              type="button"
              className="bd-btn"
              onClick={() => {
                dispatch({
                  type: "alert",
                  kind: "arrived",
                  text: `${appt.client} arrived for ${clock(appt.start)} (bridal party).`,
                  toast: `Mia got a heads-up that ${appt.client} is here.`,
                });
                setScreen("apptDone");
              }}
            >
              I’m here
            </button>
          </div>
        ) : (
          <p className="bd-hint">
            Try “Hannah”, booked at 3:30 PM with a bridal party.
          </p>
        )}
      </div>
    );
  }

  if (screen === "apptDone")
    return (
      <Done
        title="You’re checked in, Hannah!"
        lines={[
          "Mia knows you’re here and will grab you shortly.",
          "Help yourself to water or tea while you wait. ✨",
        ]}
        onDone={reset}
      />
    );

  if (screen === "done" && mine)
    return (
      <Done
        title={`You’re on the list, ${first}!`}
        big={`#${position}`}
        bigLabel="in line"
        lines={[
          `About ${waitFor(state, mine.id)} minutes for ${svcNames(mine.services)}.`,
          mine.texts
            ? `We’ll text ${phone} when you’re next, so feel free to step out.`
            : "Keep an eye on the waiting-room screen for your name.",
        ]}
        onDone={reset}
        extra={
          <button
            type="button"
            className="bd-btn bd-btn-soft"
            onClick={() => goTo("owner")}
          >
            See it in the owner dashboard <Icon name="arrow" size={16} />
          </button>
        }
      />
    );

  const stepIdx = { who: 0, services: 1, tech: 2, review: 3 }[screen];
  const totalMins = svcMins(picked);
  const from = picked.reduce((t, id) => t + svc(id).price, 0);

  return (
    <div className="bd-k-flow">
      <div className="bd-k-flowtop">
        <button
          type="button"
          className="bd-k-back"
          onClick={() =>
            setScreen(["welcome", "who", "services", "tech"][stepIdx])
          }
        >
          <Icon name="back" size={16} /> Back
        </button>
        <Steps at={stepIdx} />
      </div>

      {screen === "who" && (
        <div className="bd-k-who">
          <h3 className="bd-k-h bd-serif">First, who are we pampering?</h3>
          <div className="bd-k-grid2">
            <label className="bd-field bd-k-field">
              <span>First name and last initial</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kayla R."
                autoComplete="off"
              />
            </label>
            <label className="bd-field bd-k-field">
              <span>Mobile number (optional)</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(704) 555-0100"
                inputMode="tel"
                autoComplete="off"
              />
            </label>
          </div>
          <label className="bd-check">
            <input
              type="checkbox"
              checked={texts}
              onChange={(e) => setTexts(e.target.checked)}
            />
            <span>Text me when I’m next so I can step outside</span>
          </label>
          <div className="bd-k-actions">
            <button
              type="button"
              className="bd-btn bd-btn-lg"
              disabled={!name.trim()}
              onClick={() => setScreen("services")}
            >
              Continue <Icon name="arrow" size={18} />
            </button>
          </div>
        </div>
      )}

      {screen === "services" && (
        <>
          <h3 className="bd-k-h bd-serif">
            What are we doing today{first ? `, ${first}` : ""}?
          </h3>
          <p className="bd-sub">Pick as many as you like.</p>
          <div className="bd-k-services">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="bd-k-cat">
                <p className="bd-eyebrow">{cat}</p>
                {SERVICES.filter((s) => s.cat === cat).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="bd-pick"
                    aria-pressed={picked.includes(s.id)}
                    onClick={() => toggle(s.id)}
                  >
                    <span className="bd-pick-tick" aria-hidden="true">
                      <Icon name="check" size={13} strokeWidth={2.6} />
                    </span>
                    <span className="bd-pick-name">{s.name}</span>
                    <span className="bd-pick-meta">
                      {s.mins} min · {s.from ? "from " : ""}
                      {money(s.price)}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="bd-k-total">
            <span>
              {picked.length ? (
                <>
                  <strong>{picked.length} selected</strong> · {totalMins} min ·
                  from {money(from)}
                </>
              ) : (
                "Choose at least one service"
              )}
            </span>
            <button
              type="button"
              className="bd-btn bd-btn-lg"
              disabled={!picked.length}
              onClick={() => setScreen("tech")}
            >
              Continue <Icon name="arrow" size={18} />
            </button>
          </div>
        </>
      )}

      {screen === "tech" && (
        <>
          <h3 className="bd-k-h bd-serif">Anyone you’d love to see?</h3>
          <div className="bd-k-techs">
            <button
              type="button"
              className="bd-pick bd-pick-tech is-any"
              aria-pressed={pref === "any"}
              onClick={() => setPref("any")}
            >
              <span className="bd-any-icon" aria-hidden="true">
                <Icon name="sparkle" size={22} />
              </span>
              <span className="bd-pick-name">First available</span>
              <span className="bd-pick-meta">Shortest wait</span>
            </button>
            {TECHS.map((t) => {
              const [label, tone] = techState(state, t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  className="bd-pick bd-pick-tech"
                  aria-pressed={pref === t.id}
                  onClick={() => setPref(t.id)}
                >
                  <Avatar id={t.id} size={44} />
                  <span className="bd-pick-name">{t.name}</span>
                  <span className="bd-pick-meta">
                    {t.skills.slice(0, 2).join(" · ")}
                  </span>
                  <span className={`bd-status bd-tone-${tone}`}>{label}</span>
                </button>
              );
            })}
          </div>
          <div className="bd-k-actions">
            <button
              type="button"
              className="bd-btn bd-btn-lg"
              onClick={() => setScreen("review")}
            >
              Continue <Icon name="arrow" size={18} />
            </button>
          </div>
        </>
      )}

      {screen === "review" && (
        <div className="bd-k-review">
          <div>
            <h3 className="bd-k-h bd-serif">Look good, {first}?</h3>
            <dl className="bd-dl">
              <div>
                <dt>Services</dt>
                <dd>{svcNames(picked)}</dd>
              </div>
              <div>
                <dt>Technician</dt>
                <dd>{pref === "any" ? "First available" : tech(pref).name}</dd>
              </div>
              <div>
                <dt>Time needed</dt>
                <dd>About {totalMins} minutes</dd>
              </div>
              <div>
                <dt>Updates</dt>
                <dd>
                  {texts && phone
                    ? `Texts to ${phone}`
                    : "Watch the waiting-room screen"}
                </dd>
              </div>
            </dl>
            <p className="bd-hint">
              Final price is confirmed by your technician before checkout.
            </p>
          </div>
          <div className="bd-k-estimate">
            <span className="bd-hint">Estimated wait</span>
            <strong className="bd-serif">~{nextWait} min</strong>
            <span>
              {pref !== "any"
                ? `Waiting for ${tech(pref).name} can take a little longer.`
                : "We’ll match you with the next free technician."}
            </span>
            <button
              type="button"
              className="bd-btn bd-btn-lg bd-btn-block"
              onClick={submit}
            >
              Check me in <Icon name="heart" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Done({ title, lines, big, bigLabel, onDone, extra }) {
  return (
    <div className="bd-k-done">
      <Sparkles className="bd-k-spark" />
      <span className="bd-k-donecheck" aria-hidden="true">
        <Icon name="check" size={34} strokeWidth={2.4} />
      </span>
      <h3 className="bd-k-title bd-serif">{title}</h3>
      {big ? (
        <p className="bd-k-big">
          <strong className="bd-serif">{big}</strong> {bigLabel}
        </p>
      ) : null}
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

function FakeQr() {
  // Decorative stand-in for the salon's check-in QR code.
  const cells =
    "1110111010110100101101110111000101101011101101001011100010111011";
  return (
    <svg
      viewBox="0 0 8 8"
      className="bd-qr"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {cells
        .split("")
        .map((c, i) =>
          c === "1" ? (
            <rect
              key={i}
              x={i % 8}
              y={Math.floor(i / 8)}
              width="1"
              height="1"
            />
          ) : null,
        )}
    </svg>
  );
}

function Display() {
  const { state } = useDemo();
  const serving = state.queue.filter((q) =>
    ["assigned", "service", "checkout"].includes(q.status),
  );
  const waiting = state.queue.filter((q) => q.status === "waiting");
  return (
    <div className="bd-tv">
      <div className="bd-tv-head">
        <span className="bd-serif">
          {SALON.name} <em>✦</em>
        </span>
        <span>
          <Icon name="clock" size={16} /> {clock(310)}
        </span>
      </div>
      <div className="bd-tv-cols">
        <section aria-label="Now serving">
          <p className="bd-eyebrow">Now serving</p>
          {serving.length ? (
            serving.map((q) => (
              <div key={q.id} className="bd-tv-row is-serving">
                <Avatar id={q.tech} size={40} />
                <span>
                  <strong>{q.name}</strong>
                  <span>
                    {tech(q.tech).name} · {q.station}
                  </span>
                </span>
                <Status status={q.status} />
              </div>
            ))
          ) : (
            <p className="bd-sub">Everyone’s in a chair. ✨</p>
          )}
        </section>
        <section aria-label="Waiting">
          <p className="bd-eyebrow">Up next</p>
          {waiting.map((q, i) => (
            <div key={q.id} className={`bd-tv-row${q.isNew ? " is-new" : ""}`}>
              <span className="bd-tv-num">{i + 1}</span>
              <span>
                <strong>{q.name}</strong>
                <span>
                  {svcNames(q.services)}
                  {q.pref !== "any" ? ` · for ${tech(q.pref).name}` : ""}
                </span>
              </span>
              <span className="bd-tv-wait">
                ~{waitFor(state, q.id)} min
                {q.outside ? (
                  <span className="bd-hint">Stepped out</span>
                ) : null}
              </span>
            </div>
          ))}
          {!waiting.length ? (
            <p className="bd-sub">No wait right now. Come on in!</p>
          ) : null}
        </section>
      </div>
      <p className="bd-tv-foot">
        <Icon name="phone" size={16} /> Stepping out? We’ll text you when you’re
        next.
      </p>
    </div>
  );
}

export default function Kiosk({ goTo }) {
  const [mode, setMode] = useState("checkin");
  const [key, setKey] = useState(0);
  return (
    <div className="bd-kiosk">
      <div className="bd-seg" role="group" aria-label="Kiosk screen">
        <button
          type="button"
          aria-pressed={mode === "checkin"}
          onClick={() => setMode("checkin")}
        >
          <Icon name="phone" size={16} /> Check-in tablet
        </button>
        <button
          type="button"
          aria-pressed={mode === "display"}
          onClick={() => setMode("display")}
        >
          <Icon name="list" size={16} /> Waiting-room screen
        </button>
      </div>
      <TabletFrame
        label={
          mode === "checkin"
            ? "Walk-in check-in tablet"
            : "Waiting-room display"
        }
      >
        {mode === "checkin" ? (
          <div className="bd-k">
            <KioskTop onHome={() => setKey((k) => k + 1)} />
            <CheckIn key={key} goTo={goTo} />
          </div>
        ) : (
          <Display />
        )}
      </TabletFrame>
    </div>
  );
}
