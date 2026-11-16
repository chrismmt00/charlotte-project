"use client";

import { useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  LENGTHS,
  SALON,
  SERVICES,
  SHAPES,
  SWATCHES,
  TECHS,
  svcMins,
  svcNames,
  svcPrice,
  tech,
} from "./data";
import { useDemo } from "./store";
import {
  Avatar,
  DESIGN_KEYS,
  Icon,
  NailArt,
  PhoneFrame,
  Sparkles,
  Swatch,
  Toggle,
  designName,
  money,
} from "./ui";

const DAYS = [
  ["Tue", "17"],
  ["Wed", "18"],
  ["Thu", "19"],
  ["Fri", "20"],
  ["Sat", "21"],
  ["Sun", "22"],
];
const SLOTS = [
  "9:30 AM",
  "10:15 AM",
  "11:00 AM",
  "12:30 PM",
  "1:45 PM",
  "3:00 PM",
  "4:15 PM",
  "5:30 PM",
];
const taken = (d, s) => (d * 3 + s * 5) % 7 < 3;
const DEPOSIT = 20;

export function Sheet({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="bd-sheet-wrap">
      <button
        type="button"
        className="bd-sheet-scrim"
        aria-label="Close"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        className="bd-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <div className="bd-sheet-head">
          <h4 className="bd-serif">{title}</h4>
          <button
            type="button"
            className="bd-icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="plus" size={18} className="bd-rot45" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ApptCard({ a, onConfirm, onReschedule, onCancel }) {
  return (
    <div className="bd-card bd-appt">
      <div className="bd-appt-top">
        <span className="bd-appt-date">
          <span>{a.day.split(",")[0]}</span>
          <strong className="bd-serif">{a.day.split(" ").pop()}</strong>
        </span>
        <span className="bd-appt-info">
          <strong>{svcNames(a.services)}</strong>
          <span className="bd-sub">
            {a.time} with{" "}
            {a.tech === "any" ? "first available" : tech(a.tech).name}
            {a.group ? ` · ${a.group}` : ""}
          </span>
          <span
            className={`bd-status bd-tone-${a.confirmed ? "mint" : "peach"}`}
          >
            {a.confirmed ? "Confirmed" : "Please confirm"} · {money(a.deposit)}{" "}
            deposit paid
          </span>
        </span>
      </div>
      <div className="bd-appt-actions">
        {!a.confirmed ? (
          <button
            type="button"
            className="bd-btn bd-btn-sm"
            onClick={onConfirm}
          >
            Confirm
          </button>
        ) : null}
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-soft"
          onClick={onReschedule}
        >
          Reschedule
        </button>
        <button
          type="button"
          className="bd-btn bd-btn-sm bd-btn-ghost"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function useAppts() {
  const { state, dispatch } = useDemo();
  const [sheet, setSheet] = useState(null);
  const update = (id, patch) =>
    dispatch({
      type: "me",
      patch: {
        upcoming: state.me.upcoming.map((u) =>
          u.id === id ? { ...u, ...patch } : u,
        ),
      },
    });
  const cards = state.me.upcoming.map((a) => (
    <ApptCard
      key={a.id}
      a={a}
      onConfirm={() => {
        update(a.id, { confirmed: true });
        dispatch({ type: "toast", text: "Confirmed! See you soon. 💅" });
      }}
      onReschedule={() => setSheet({ kind: "move", a })}
      onCancel={() => setSheet({ kind: "cancel", a })}
    />
  ));
  const sheetEl = sheet ? (
    sheet.kind === "move" ? (
      <Sheet title="Pick a new time" onClose={() => setSheet(null)}>
        <p className="bd-sub">
          Same services with {tech(sheet.a.tech)?.name || "first available"}.
          Your deposit moves with you.
        </p>
        <div className="bd-slots">
          {[
            "Fri 20 · 4:15 PM",
            "Sat 21 · 1:45 PM",
            "Sat 21 · 3:00 PM",
            "Sun 22 · 11:00 AM",
          ].map((s) => (
            <button
              key={s}
              type="button"
              className="bd-chip"
              onClick={() => {
                const [d, t] = s.split(" · ");
                const [dw, dn] = d.split(" ");
                const full = { Fri: "Fri", Sat: "Sat", Sun: "Sun" }[dw];
                update(sheet.a.id, {
                  day: `${full}, Nov ${dn}`,
                  time: t,
                  confirmed: true,
                });
                dispatch({
                  type: "alert",
                  kind: "booking",
                  text: `${state.me.full} moved an appointment to ${s}.`,
                  toast: `Moved to ${s}. Confirmation sent.`,
                });
                setSheet(null);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </Sheet>
    ) : (
      <Sheet title="Cancel appointment?" onClose={() => setSheet(null)}>
        <div className="bd-policy">
          <Icon name="heart" size={18} />
          <p>
            Cancel more than 24 hours ahead and your {money(sheet.a.deposit)}{" "}
            deposit is refunded. Inside 24 hours, the deposit is kept by the
            salon.
          </p>
        </div>
        <div className="bd-row-btns">
          <button
            type="button"
            className="bd-btn bd-btn-soft"
            onClick={() => setSheet(null)}
          >
            Keep it
          </button>
          <button
            type="button"
            className="bd-btn"
            onClick={() => {
              dispatch({
                type: "me",
                patch: {
                  upcoming: state.me.upcoming.filter(
                    (u) => u.id !== sheet.a.id,
                  ),
                },
              });
              dispatch({
                type: "alert",
                kind: "cancel",
                text: `${state.me.full} cancelled ${sheet.a.day} (deposit refunded, 24h+ notice).`,
                toast: "Cancelled. Your deposit is on its way back.",
              });
              setSheet(null);
            }}
          >
            Yes, cancel
          </button>
        </div>
      </Sheet>
    )
  ) : null;
  return [cards, sheetEl];
}

function Home({ go, rebook }) {
  const { state } = useDemo();
  const [texts, setTexts] = useState(false);
  const [cards, sheet] = useAppts();
  const me = state.me;
  const last = me.history[0];
  const pending = state.designs.find(
    (d) => d.client === me.full && d.status !== "approved",
  );
  return (
    <div className="bd-c-pad">
      <div className="bd-c-hello">
        <div>
          <p className="bd-eyebrow">{SALON.name}</p>
          <h3 className="bd-serif bd-c-h">
            Hi {me.name}{" "}
            <span className="bd-flower" aria-hidden="true">
              ✿
            </span>
          </h3>
        </div>
        <button
          type="button"
          className="bd-icon-btn is-dot"
          aria-label="Messages from the salon"
          onClick={() => setTexts(true)}
        >
          <Icon name="bell" size={20} />
        </button>
      </div>

      <p className="bd-c-label">Coming up</p>
      {cards.length ? cards : <p className="bd-sub">Nothing booked yet.</p>}

      <div className="bd-card bd-loyal">
        <Sparkles className="bd-loyal-spark" />
        <p className="bd-eyebrow">Lumi rewards</p>
        <strong className="bd-serif">{me.points} points</strong>
        <div
          className="bd-meter"
          role="img"
          aria-label={`${me.points} of ${me.goal} points`}
        >
          <span style={{ width: `${(me.points / me.goal) * 100}%` }} />
        </div>
        <span className="bd-hint">
          {me.goal - me.points} more points for free nail art
        </span>
      </div>

      <p className="bd-c-label">Book again</p>
      <div className="bd-card bd-rebook">
        <Avatar id={last.tech} size={40} />
        <span>
          <strong>{svcNames(last.services)}</strong>
          <span className="bd-sub">
            with {tech(last.tech).name} · last on {last.day}
          </span>
        </span>
        <button
          type="button"
          className="bd-btn bd-btn-sm"
          onClick={() => rebook(last)}
        >
          Rebook
        </button>
      </div>

      <button
        type="button"
        className="bd-card bd-design-cta"
        onClick={() => go("me", "design")}
      >
        <NailArt
          design="chrome"
          className="bd-design-cta-art"
          label="Pearl chrome nail inspiration"
        />
        <span>
          <strong>Got inspo? 💕</strong>
          <span className="bd-sub">
            {pending
              ? pending.status === "quoted"
                ? `Your estimate is ready: ${money(pending.estimate)}`
                : "Your design request is with the salon"
              : "Send a photo and get a custom quote"}
          </span>
        </span>
        <Icon name="arrow" size={18} />
      </button>

      {texts ? (
        <Sheet title="Texts from Lumi" onClose={() => setTexts(false)}>
          <div className="bd-sms">
            <p className="bd-sms-in">
              Lumi Nail Studio: Hi Jasmine! Reminder of your Gel-X + Nail Art
              with Mia on Sat at 11:00 AM. Reply C to confirm or change it here:
              lumi.link/a/8F2
            </p>
            <p className="bd-sms-out">C</p>
            <p className="bd-sms-in">
              You’re confirmed! 💅 Need to move it? Tap lumi.link/a/8F2.
              Cancellations within 24h keep the $20 deposit.
            </p>
            <p className="bd-sms-in">
              It’s been 3 weeks since your gel set. Want to rebook with Mia?
              lumi.link/r/mia
            </p>
          </div>
          <p className="bd-hint">
            Reminders follow each client’s text and email choices. Demo only,
            nothing is sent.
          </p>
        </Sheet>
      ) : null}
      {sheet}
    </div>
  );
}

function Book({ preset, onBooked }) {
  const { state, dispatch } = useDemo();
  const [step, setStep] = useState(0);
  const [cat, setCat] = useState("Manicures");
  const [picked, setPicked] = useState(preset?.services || []);
  const [who, setWho] = useState(preset?.tech || "any");
  const [day, setDay] = useState(4);
  const [slot, setSlot] = useState(null);
  const [group, setGroup] = useState(false);
  const [guests, setGuests] = useState(3);
  const [occasion, setOccasion] = useState("Birthday");
  const [waitlist, setWaitlist] = useState(false);
  const [asGuest, setAsGuest] = useState(false);

  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const people = group ? guests : 1;
  const total = svcPrice(picked, who) * people;
  const deposit = DEPOSIT * people;
  const when =
    slot != null ? `${DAYS[day][0]}, Nov ${DAYS[day][1]} · ${SLOTS[slot]}` : "";

  const book = () => {
    const appt = {
      id: `u${Date.now()}`,
      day: `${DAYS[day][0]}, Nov ${DAYS[day][1]}`,
      time: SLOTS[slot],
      services: picked,
      tech: who,
      deposit,
      confirmed: true,
      group: group ? `${occasion} · ${guests} guests` : null,
    };
    dispatch({ type: "me", patch: { upcoming: [...state.me.upcoming, appt] } });
    dispatch({
      type: "alert",
      kind: "booking",
      text: `New online booking: ${asGuest ? "Guest" : state.me.full}, ${when}${group ? ` (${occasion}, ${guests} guests)` : ""}. ${money(deposit)} deposit paid.`,
    });
    if (waitlist)
      dispatch({
        type: "alert",
        kind: "waitlist",
        text: `${state.me.full} joined the waitlist for an earlier time.`,
      });
    setStep(4);
  };

  if (step === 4)
    return (
      <div className="bd-c-pad bd-c-done">
        <Sparkles className="bd-k-spark" />
        <span className="bd-k-donecheck" aria-hidden="true">
          <Icon name="check" size={30} strokeWidth={2.4} />
        </span>
        <h3 className="bd-serif bd-c-h">You’re booked!</h3>
        <p className="bd-sub">
          {svcNames(picked)} · {when}
          {group ? ` · ${occasion} for ${guests}` : ""}
        </p>
        <div className="bd-sms">
          <p className="bd-sms-in">
            Lumi Nail Studio: You’re booked for {when}. We’ll remind you 24
            hours before. Change or cancel: lumi.link/a/K2Q
          </p>
        </div>
        {waitlist ? (
          <p className="bd-hint">
            You’re also on the waitlist. We’ll text you if something earlier
            opens up.
          </p>
        ) : null}
        <button
          type="button"
          className="bd-btn bd-btn-block"
          onClick={onBooked}
        >
          See my appointments
        </button>
      </div>
    );

  return (
    <div className="bd-c-pad">
      <div className="bd-c-booktop">
        {step > 0 ? (
          <button
            type="button"
            className="bd-icon-btn"
            aria-label="Back"
            onClick={() => setStep(step - 1)}
          >
            <Icon name="back" size={18} />
          </button>
        ) : null}
        <div>
          <p className="bd-eyebrow">Step {step + 1} of 4</p>
          <h3 className="bd-serif bd-c-h">
            {
              [
                "Choose services",
                "Choose your tech",
                "Pick a time",
                "Review & book",
              ][step]
            }
          </h3>
        </div>
      </div>
      <div className="bd-progress" aria-hidden="true">
        <span style={{ width: `${((step + 1) / 4) * 100}%` }} />
      </div>

      {step === 0 && (
        <>
          <div
            className="bd-scrollchips"
            role="group"
            aria-label="Service category"
          >
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className="bd-chip"
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="bd-svc-list">
            {SERVICES.filter((s) => s.cat === cat).map((s) => (
              <button
                key={s.id}
                type="button"
                className="bd-svc"
                aria-pressed={picked.includes(s.id)}
                onClick={() => toggle(s.id)}
              >
                <span>
                  <strong>{s.name}</strong>
                  <span className="bd-sub">{s.blurb}</span>
                  <span className="bd-hint">
                    {s.mins} min · {s.from ? "from " : ""}
                    {money(s.price)}
                  </span>
                </span>
                <span className="bd-svc-add" aria-hidden="true">
                  <Icon
                    name={picked.includes(s.id) ? "check" : "plus"}
                    size={16}
                    strokeWidth={2.2}
                  />
                </span>
              </button>
            ))}
          </div>
          <div className="bd-card bd-group">
            <Toggle
              on={group}
              onChange={() => setGroup(!group)}
              label="Booking for a group"
              hint="Birthdays, bridal parties, girls’ day"
            />
            {group ? (
              <div className="bd-group-opts">
                <div className="bd-stepper">
                  <button
                    type="button"
                    aria-label="Fewer guests"
                    onClick={() => setGuests(Math.max(2, guests - 1))}
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <span>{guests} guests</span>
                  <button
                    type="button"
                    aria-label="More guests"
                    onClick={() => setGuests(Math.min(8, guests + 1))}
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
                <label className="bd-field">
                  <span className="bd-sr">Occasion</span>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                  >
                    {["Birthday", "Bridal party", "Girls’ day", "Mom & me"].map(
                      (o) => (
                        <option key={o}>{o}</option>
                      ),
                    )}
                  </select>
                </label>
              </div>
            ) : null}
          </div>
        </>
      )}

      {step === 1 && (
        <div className="bd-tech-list">
          {[{ id: "any" }, ...TECHS].map((t) => (
            <button
              key={t.id}
              type="button"
              className="bd-svc"
              aria-pressed={who === t.id}
              onClick={() => setWho(t.id)}
            >
              {t.id === "any" ? (
                <span className="bd-any-icon" aria-hidden="true">
                  <Icon name="sparkle" size={20} />
                </span>
              ) : (
                <Avatar id={t.id} size={42} />
              )}
              <span>
                <strong>{t.id === "any" ? "First available" : t.name}</strong>
                <span className="bd-sub">
                  {t.id === "any"
                    ? "Most times to choose from"
                    : `${t.role} · ${t.skills.join(", ")}`}
                </span>
                {t.senior ? (
                  <span className="bd-hint">
                    Senior pricing: +$5 on enhancements
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <>
          <div className="bd-days" role="group" aria-label="Day">
            {DAYS.map(([d, n], i) => (
              <button
                key={d}
                type="button"
                aria-pressed={day === i}
                onClick={() => {
                  setDay(i);
                  setSlot(null);
                }}
              >
                <span>{d}</span>
                <strong>{n}</strong>
              </button>
            ))}
          </div>
          <div className="bd-slots" role="group" aria-label="Time">
            {SLOTS.map((s, i) => {
              const off = taken(day, i);
              return (
                <button
                  key={s}
                  type="button"
                  className="bd-chip"
                  disabled={off}
                  aria-pressed={slot === i}
                  onClick={() => setSlot(i)}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <p className="bd-hint">
            {svcMins(picked) * (group ? 1 : 1)} min
            {group ? ` · ${guests} techs side by side` : ""} · greyed-out times
            are taken
          </p>
          <div className="bd-card">
            <Toggle
              on={waitlist}
              onChange={() => setWaitlist(!waitlist)}
              label="Want something sooner?"
              hint="Join the waitlist and we’ll text you if an earlier time opens."
            />
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="bd-seg bd-seg-sm" role="group" aria-label="Book as">
            <button
              type="button"
              aria-pressed={!asGuest}
              onClick={() => setAsGuest(false)}
            >
              My account
            </button>
            <button
              type="button"
              aria-pressed={asGuest}
              onClick={() => setAsGuest(true)}
            >
              Continue as guest
            </button>
          </div>
          {asGuest ? (
            <div className="bd-guest">
              <label className="bd-field">
                <span>Name</span>
                <input placeholder="Your name" autoComplete="off" />
              </label>
              <label className="bd-field">
                <span>Mobile</span>
                <input
                  placeholder="For your reminder text"
                  inputMode="tel"
                  autoComplete="off"
                />
              </label>
            </div>
          ) : null}
          <dl className="bd-dl bd-dl-tight">
            <div>
              <dt>Services</dt>
              <dd>{svcNames(picked)}</dd>
            </div>
            <div>
              <dt>Technician</dt>
              <dd>{who === "any" ? "First available" : tech(who).name}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>{when}</dd>
            </div>
            {group ? (
              <div>
                <dt>Group</dt>
                <dd>
                  {occasion} · {guests} guests
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Estimated total</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>
          <div className="bd-policy">
            <Icon name="heart" size={18} />
            <p>
              <strong>{money(deposit)} deposit today</strong>, taken off your
              total at checkout. Free changes up to 24 hours before. Later
              cancellations or no-shows keep the deposit.
            </p>
          </div>
        </>
      )}

      <div className="bd-c-cta">
        {step === 0 && (
          <button
            type="button"
            className="bd-btn bd-btn-block"
            disabled={!picked.length}
            onClick={() => setStep(1)}
          >
            {picked.length
              ? `Continue · ${picked.length} selected`
              : "Choose a service"}
          </button>
        )}
        {step === 1 && (
          <button
            type="button"
            className="bd-btn bd-btn-block"
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        )}
        {step === 2 && (
          <button
            type="button"
            className="bd-btn bd-btn-block"
            disabled={slot == null}
            onClick={() => setStep(3)}
          >
            {slot == null ? "Pick a time" : `Continue · ${SLOTS[slot]}`}
          </button>
        )}
        {step === 3 && (
          <button type="button" className="bd-btn bd-btn-block" onClick={book}>
            Pay {money(deposit)} deposit & book
          </button>
        )}
      </div>
    </div>
  );
}

function Visits({ rebook }) {
  const { state, dispatch } = useDemo();
  const [cards, sheet] = useAppts();
  const [review, setReview] = useState(null);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [priv, setPriv] = useState(false);
  const me = state.me;
  return (
    <div className="bd-c-pad">
      <h3 className="bd-serif bd-c-h">My visits</h3>
      <p className="bd-c-label">Upcoming</p>
      {cards.length ? cards : <p className="bd-sub">Nothing booked yet.</p>}
      <p className="bd-c-label">Past visits</p>
      {me.history.map((h) => (
        <div key={h.id} className="bd-card bd-past">
          <span>
            <strong>{svcNames(h.services)}</strong>
            <span className="bd-sub">
              {h.day} · {tech(h.tech).name} · {money(h.total)}
            </span>
          </span>
          <span className="bd-past-btns">
            <button
              type="button"
              className="bd-btn bd-btn-sm bd-btn-soft"
              onClick={() => rebook(h)}
            >
              Rebook
            </button>
            {h.reviewed ? (
              <span className="bd-hint">
                <Icon name="star" size={13} /> Reviewed
              </span>
            ) : (
              <button
                type="button"
                className="bd-btn bd-btn-sm bd-btn-ghost"
                onClick={() => setReview(h)}
              >
                Review
              </button>
            )}
          </span>
        </div>
      ))}
      {review ? (
        <Sheet title="How was your visit?" onClose={() => setReview(null)}>
          <div
            className="bd-seg bd-seg-sm"
            role="group"
            aria-label="Feedback type"
          >
            <button
              type="button"
              aria-pressed={!priv}
              onClick={() => setPriv(false)}
            >
              Leave a review
            </button>
            <button
              type="button"
              aria-pressed={priv}
              onClick={() => setPriv(true)}
            >
              Private note to owner
            </button>
          </div>
          {!priv ? (
            <div className="bd-stars" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={stars === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className={n <= stars ? "is-on" : ""}
                  onClick={() => setStars(n)}
                >
                  <Icon name="star" size={26} />
                </button>
              ))}
            </div>
          ) : (
            <p className="bd-hint">
              Only the owner sees this. It never shows publicly.
            </p>
          )}
          <label className="bd-field">
            <span>
              {priv ? "What should the owner know?" : "Tell us more (optional)"}
            </span>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                priv ? "Anything that didn’t feel right…" : "Mia was amazing…"
              }
            />
          </label>
          <button
            type="button"
            className="bd-btn bd-btn-block"
            onClick={() => {
              dispatch({
                type: "alert",
                kind: priv ? "private" : "review",
                text: priv
                  ? `Private note from ${me.full}: “${text || "Could the pedicure water be a little warmer?"}”`
                  : `${me.full} left a ${stars}-star review for ${tech(review.tech).name}.`,
                toast: priv
                  ? "Sent privately to the owner."
                  : "Thank you! Your review was posted. 💗",
              });
              dispatch({
                type: "me",
                patch: {
                  history: me.history.map((x) =>
                    x.id === review.id ? { ...x, reviewed: true } : x,
                  ),
                },
              });
              setReview(null);
              setText("");
            }}
          >
            {priv ? "Send privately" : "Post review"}
          </button>
        </Sheet>
      ) : null}
      {sheet}
    </div>
  );
}

function Me({ section }) {
  const { state, dispatch } = useDemo();
  const me = state.me;
  const [design, setDesign] = useState(section === "design");
  const [photo, setPhoto] = useState(null);
  const [sample, setSample] = useState("bloom");
  const [desc, setDesc] = useState("");
  const [sms, setSms] = useState(true);
  const [email, setEmail] = useState(true);
  const [promo, setPromo] = useState(false);
  const prefs = me.prefs;
  const setPref = (patch) =>
    dispatch({ type: "me", patch: { prefs: { ...prefs, ...patch } } });
  const myDesigns = state.designs.filter((d) => d.client === me.full);
  const designRef = useRef(null);
  useEffect(() => {
    if (section === "design")
      designRef.current?.scrollIntoView({ block: "start" });
  }, [section]);

  return (
    <div className="bd-c-pad">
      <div className="bd-me-head">
        <span
          className="bd-avatar bd-tone-blush"
          style={{ width: 52, height: 52, fontSize: 22 }}
          aria-hidden="true"
        >
          J
        </span>
        <span>
          <h3 className="bd-serif bd-c-h">{me.full}</h3>
          <span className="bd-hint">VIP · 14 visits</span>
        </span>
      </div>

      <p className="bd-c-label">My nail preferences</p>
      <div className="bd-card">
        <p className="bd-mini">Shape</p>
        <div className="bd-wrapchips" role="group" aria-label="Nail shape">
          {SHAPES.map((s) => (
            <button
              key={s}
              type="button"
              className="bd-chip"
              aria-pressed={prefs.shape === s}
              onClick={() => setPref({ shape: s })}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="bd-mini">Length</p>
        <div className="bd-wrapchips" role="group" aria-label="Nail length">
          {LENGTHS.map((s) => (
            <button
              key={s}
              type="button"
              className="bd-chip"
              aria-pressed={prefs.length === s}
              onClick={() => setPref({ length: s })}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="bd-mini">Favourite colours</p>
        <div
          className="bd-swatches"
          role="group"
          aria-label="Favourite colours"
        >
          {Object.entries(SWATCHES).map(([k, s]) => (
            <button
              key={k}
              type="button"
              aria-pressed={prefs.colors.includes(k)}
              aria-label={s.name}
              onClick={() =>
                setPref({
                  colors: prefs.colors.includes(k)
                    ? prefs.colors.filter((c) => c !== k)
                    : [...prefs.colors, k],
                })
              }
            >
              <Swatch id={k} size={30} />
            </button>
          ))}
        </div>
        <label className="bd-field">
          <span>Notes for my technician</span>
          <textarea
            rows={2}
            value={prefs.notes}
            onChange={(e) => setPref({ notes: e.target.value })}
          />
        </label>
      </div>

      <div ref={designRef} className="bd-c-label">
        Custom design requests
      </div>
      {myDesigns.map((d) => (
        <div key={d.id} className="bd-card bd-dreq">
          {d.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={d.photo}
              alt="Your inspiration upload"
              className="bd-dreq-photo"
            />
          ) : (
            <NailArt design={d.design} className="bd-dreq-art" />
          )}
          <span>
            <strong>{d.text}</strong>
            {d.status === "pending" && (
              <span className="bd-status bd-tone-peach">
                With the salon for a quote
              </span>
            )}
            {d.status === "quoted" && (
              <>
                <span className="bd-sub">
                  Estimate: <strong>{money(d.estimate)}</strong> extra · about{" "}
                  {d.mins} min
                </span>
                <button
                  type="button"
                  className="bd-btn bd-btn-sm"
                  onClick={() => {
                    dispatch({ type: "approveDesign", id: d.id });
                    dispatch({
                      type: "alert",
                      kind: "design",
                      text: `${me.full} approved the ${money(d.estimate)} design estimate.`,
                      toast: "Approved! It’s saved to your next visit.",
                    });
                  }}
                >
                  Approve estimate
                </button>
              </>
            )}
            {d.status === "approved" && (
              <span className="bd-status bd-tone-mint">
                Approved{d.estimate ? ` · ${money(d.estimate)}` : ""}
              </span>
            )}
          </span>
        </div>
      ))}
      <button
        type="button"
        className="bd-btn bd-btn-soft bd-btn-block"
        onClick={() => setDesign(true)}
      >
        <Icon name="camera" size={18} /> New design request
      </button>

      <p className="bd-c-label">Reminders & messages</p>
      <div className="bd-card">
        <Toggle
          on={sms}
          onChange={() => setSms(!sms)}
          label="Text reminders"
          hint="24 hours and 2 hours before"
        />
        <Toggle
          on={email}
          onChange={() => setEmail(!email)}
          label="Email reminders"
        />
        <Toggle
          on={promo}
          onChange={() => setPromo(!promo)}
          label="Offers and rebooking nudges"
        />
      </div>

      {design ? (
        <Sheet title="Request a custom design" onClose={() => setDesign(false)}>
          <label className="bd-upload">
            <input
              type="file"
              accept="image/*"
              className="bd-sr"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPhoto(URL.createObjectURL(f));
              }}
            />
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Your inspiration upload" />
            ) : (
              <>
                <Icon name="camera" size={24} />
                <span>Upload an inspiration photo</span>
                <span className="bd-hint">
                  Stays on your device in this demo
                </span>
              </>
            )}
          </label>
          {!photo ? (
            <>
              <p className="bd-mini">Or pick a sample</p>
              <div
                className="bd-samples"
                role="group"
                aria-label="Sample designs"
              >
                {DESIGN_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={sample === k}
                    onClick={() => setSample(k)}
                  >
                    <NailArt design={k} />
                    <span>{designName(k)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <label className="bd-field">
            <span>Describe what you’d love</span>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Chrome on all ten, tiny hearts on the ring fingers"
            />
          </label>
          <button
            type="button"
            className="bd-btn bd-btn-block"
            onClick={() => {
              dispatch({
                type: "design",
                client: me.full,
                design: sample,
                photo,
                text:
                  desc ||
                  `${designName(sample)}, ${prefs.shape.toLowerCase()}, ${prefs.length.toLowerCase()} length`,
              });
              dispatch({
                type: "toast",
                text: "Sent! The salon will reply with an estimate.",
              });
              setDesign(false);
              setPhoto(null);
              setDesc("");
            }}
          >
            Request a quote
          </button>
        </Sheet>
      ) : null}
    </div>
  );
}

export default function ClientApp() {
  const [tab, setTab] = useState("home");
  const [section, setSection] = useState(null);
  const [preset, setPreset] = useState(null);
  const [bookKey, setBookKey] = useState(0);
  const bodyRef = useRef(null);
  const go = (t, s = null) => {
    setTab(t);
    setSection(s);
    bodyRef.current?.closest(".bd-phone-body")?.scrollTo({ top: 0 });
  };
  const rebook = (h) => {
    setPreset({ services: h.services, tech: h.tech });
    setBookKey((k) => k + 1);
    go("book");
  };
  const nav = [
    ["home", "home", "Home"],
    ["book", "sparkle", "Book"],
    ["visits", "calendar", "Visits"],
    ["me", "user", "Me"],
  ];
  return (
    <PhoneFrame
      label="Client booking app"
      footer={
        <nav className="bd-bottomnav" aria-label="Client app">
          {nav.map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => {
                if (id === "book" && tab !== "book") {
                  setPreset(null);
                  setBookKey((k) => k + 1);
                }
                go(id);
              }}
            >
              <Icon name={icon} size={20} />
              {label}
            </button>
          ))}
        </nav>
      }
    >
      <div ref={bodyRef}>
        {tab === "home" && <Home go={go} rebook={rebook} />}
        {tab === "book" && (
          <Book key={bookKey} preset={preset} onBooked={() => go("visits")} />
        )}
        {tab === "visits" && <Visits rebook={rebook} />}
        {tab === "me" && <Me key={section} section={section} />}
      </div>
    </PhoneFrame>
  );
}
