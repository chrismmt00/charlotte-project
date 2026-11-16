"use client";

import { useState } from "react";
import {
  MIA_EARNINGS,
  TECHS,
  TECH_REVENUE,
  UPGRADES,
  clock,
  svcNames,
  svcPrice,
  tech,
} from "./data";
import { useDemo } from "./store";
import TechSchedule, { useDay } from "./TechSchedule";
import { Sheet } from "./ClientApp";
import { Icon, NailArt, PhoneFrame, Status, Swatch, Toggle, money } from "./ui";

function Detail({ item, techId, onClose }) {
  const { state, dispatch } = useDemo();
  const [panel, setPanel] = useState(null);
  const [price, setPrice] = useState("");
  const live =
    item.src === "walkin"
      ? state.queue.find((q) => q.id === item.id)
      : state.appts.find((a) => a.id === item.id);
  if (!live) return null;
  const status = live.status;
  const client = state.clients.find(
    (c) => c.name === (live.client || live.name),
  );
  const design = state.designs.find(
    (d) => d.client === (live.client || live.name) && d.status === "approved",
  );
  const added = live.added || [];
  const base = live.override ?? svcPrice(live.services, techId);
  const total =
    base +
    added.reduce((t, id) => t + UPGRADES.find((u) => u.id === id).price, 0);
  const name = live.client || live.name;
  const patch = (p) =>
    item.src === "walkin"
      ? dispatch({ type: "queuePatch", id: item.id, patch: p })
      : dispatch({ type: "appt", id: item.id, patch: p });
  const canPrice = state.perms[techId]?.price;
  const t = tech(techId);

  return (
    <Sheet title={name} onClose={onClose}>
      <div className="bd-tags">
        <Status status={status} />
        {item.src === "walkin" ? (
          <span className="bd-status bd-tone-blush">
            Walk-in · {live.station}
          </span>
        ) : null}
        {client?.vip ? (
          <span className="bd-status bd-tone-gold">VIP</span>
        ) : null}
        {live.firstVisit ? (
          <span className="bd-status bd-tone-lilac">First visit</span>
        ) : null}
        {live.group ? (
          <span className="bd-status bd-tone-lilac">{live.group}</span>
        ) : null}
      </div>
      <dl className="bd-dl bd-dl-tight">
        <div>
          <dt>Services</dt>
          <dd>
            {svcNames(live.services)}
            {added.length
              ? ` + ${added.map((id) => UPGRADES.find((u) => u.id === id).name).join(", ")}`
              : ""}
          </dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>
            {item.src === "walkin"
              ? `Arrived ${clock(live.arrived)}`
              : clock(live.start)}
          </dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>
            {money(total)}
            {live.override != null ? " (adjusted)" : ""}
          </dd>
        </div>
      </dl>
      {design || live.design ? (
        <div className="bd-inspo">
          <p className="bd-mini">Inspiration</p>
          {design?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={design.photo} alt={`${name}'s inspiration upload`} />
          ) : (
            <NailArt design={design?.design || live.design} />
          )}
          <p className="bd-sub">{design?.text || live.note}</p>
        </div>
      ) : null}
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
      ) : null}

      <div className="bd-tech-main">
        {["booked", "assigned"].includes(status) && (
          <button
            type="button"
            className="bd-btn bd-btn-block"
            onClick={() => patch({ status: "service" })}
          >
            Start service
          </button>
        )}
        {status === "service" && (
          <button
            type="button"
            className="bd-btn bd-btn-block"
            onClick={() => {
              patch({ status: "checkout" });
              dispatch({
                type: "toast",
                text: `${name} is ready for checkout. The front desk can see it.`,
              });
            }}
          >
            Finish · send to checkout
          </button>
        )}
        {status === "checkout" && (
          <p className="bd-sub">Waiting at the front desk for payment.</p>
        )}
        {status === "done" && <p className="bd-sub">Completed and paid.</p>}
      </div>

      {status !== "done" ? (
        <div className="bd-tech-tools">
          <button
            type="button"
            className="bd-tool"
            aria-pressed={panel === "late"}
            onClick={() => setPanel(panel === "late" ? null : "late")}
          >
            <Icon name="clock" /> Running late
          </button>
          <button
            type="button"
            className="bd-tool"
            onClick={() =>
              dispatch({
                type: "alert",
                kind: "help",
                text: `${t.name} needs the front desk at ${t.station}.`,
                from: techId,
                toast: "The front desk got your request.",
              })
            }
          >
            <Icon name="bell" /> Need front desk
          </button>
          <button
            type="button"
            className="bd-tool"
            aria-pressed={panel === "up"}
            onClick={() => setPanel(panel === "up" ? null : "up")}
          >
            <Icon name="plus" /> Add upgrade
          </button>
          <button
            type="button"
            className="bd-tool"
            aria-pressed={panel === "price"}
            onClick={() => setPanel(panel === "price" ? null : "price")}
          >
            <Icon name="tag" /> Adjust price
          </button>
        </div>
      ) : null}
      {panel === "late" && (
        <div className="bd-wrapchips">
          {[5, 10, 15, 20].map((m) => (
            <button
              key={m}
              type="button"
              className="bd-chip"
              onClick={() => {
                dispatch({
                  type: "alert",
                  kind: "delay",
                  text: `${t.name} is running ${m} min behind (with ${name})`,
                  from: techId,
                  toast: `Front desk told. Your next client gets a text about the ${m}-minute delay.`,
                });
                setPanel(null);
              }}
            >
              +{m} min
            </button>
          ))}
        </div>
      )}
      {panel === "up" && (
        <div className="bd-uplist">
          {UPGRADES.map((u) => (
            <button
              key={u.id}
              type="button"
              className="bd-svc"
              aria-pressed={added.includes(u.id)}
              onClick={() =>
                patch({
                  added: added.includes(u.id)
                    ? added.filter((x) => x !== u.id)
                    : [...added, u.id],
                })
              }
            >
              <span>
                <strong>{u.name}</strong>
                <span className="bd-hint">
                  +{money(u.price)} · approved by owner
                </span>
              </span>
              <span className="bd-svc-add" aria-hidden="true">
                <Icon
                  name={added.includes(u.id) ? "check" : "plus"}
                  size={16}
                  strokeWidth={2.2}
                />
              </span>
            </button>
          ))}
        </div>
      )}
      {panel === "price" &&
        (canPrice ? (
          <form
            className="bd-inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(price);
              if (!n) return;
              patch({ override: n });
              dispatch({
                type: "alert",
                kind: "price",
                text: `${t.name} changed ${name}’s price to ${money(n)}.`,
                from: techId,
                toast: "Price updated and logged for the owner.",
              });
              setPanel(null);
            }}
          >
            <label className="bd-field">
              <span>New service price</span>
              <input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                placeholder={String(base)}
              />
            </label>
            <button type="submit" className="bd-btn bd-btn-sm">
              Save
            </button>
          </form>
        ) : (
          <p className="bd-locked">
            <Icon name="lock" size={16} /> Only the owner can change prices for{" "}
            {t.name}. They can turn this on in Team permissions.
          </p>
        ))}
    </Sheet>
  );
}

function Today({ techId }) {
  const { state, dispatch } = useDemo();
  const day = useDay(techId);
  const [open, setOpen] = useState(null);
  const t = tech(techId);
  const left = day.filter(
    (d) => d.src !== "break" && !["done", "checkout"].includes(d.status),
  );
  return (
    <div className="bd-c-pad">
      <div className="bd-c-hello">
        <div>
          <p className="bd-eyebrow">{t.station}</p>
          <h3 className="bd-serif bd-c-h">Hi {t.name} ✨</h3>
        </div>
        <button
          type="button"
          className={`bd-clock ${state.clockedIn[techId] ? "is-in" : ""}`}
          onClick={() => {
            dispatch({ type: "clock", tech: techId });
            dispatch({
              type: "toast",
              text: state.clockedIn[techId]
                ? `${t.name} clocked out at 2:10 PM.`
                : `${t.name} clocked in at 2:10 PM.`,
            });
          }}
        >
          <span aria-hidden="true" />
          {state.clockedIn[techId] ? "Clocked in" : "Clock in"}
        </button>
      </div>
      <div className="bd-card bd-today-sum">
        <span>
          <strong className="bd-serif">{left.length}</strong>
          <span className="bd-hint">clients left</span>
        </span>
        <span>
          <strong className="bd-serif">
            {day.filter((d) => d.status === "done").length}
          </strong>
          <span className="bd-hint">done</span>
        </span>
        <Toggle
          on={!!state.onBreak[techId]}
          onChange={() => dispatch({ type: "breakToggle", tech: techId })}
          label="On break"
        />
      </div>
      <p className="bd-c-label">Today</p>
      <ol className="bd-timeline">
        {day.map((d) =>
          d.src === "break" ? (
            <li key={d.id} className="is-break">
              <span className="bd-tl-time">{clock(d.start)}</span>
              <span className="bd-tl-card">
                <strong>{d.label || "Break"}</strong>
                <span className="bd-hint">
                  {d.mins} min · until {clock(d.start + d.mins)}
                </span>
              </span>
            </li>
          ) : (
            <li key={d.id} className={`is-${d.status}`}>
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
                  <Status status={d.status} />
                </span>
                <span className="bd-sub">{svcNames(d.services)}</span>
                {d.design ? (
                  <span className="bd-hint">✿ Has inspiration photo</span>
                ) : null}
                {d.group ? <span className="bd-hint">{d.group}</span> : null}
              </button>
            </li>
          ),
        )}
      </ol>
      {open ? (
        <Detail item={open} techId={techId} onClose={() => setOpen(null)} />
      ) : null}
    </div>
  );
}

function Earnings({ techId }) {
  const t = tech(techId);
  const ratio =
    TECH_REVENUE.find((r) => r.id === techId).revenue / TECH_REVENUE[0].revenue;
  const days = MIA_EARNINGS.days.map((d) => ({
    ...d,
    earned: Math.round(d.earned * ratio),
    tips: Math.round(d.tips * ratio),
  }));
  const earned = days.reduce((s, d) => s + d.earned, 0);
  const tips = days.reduce((s, d) => s + d.tips, 0);
  const max = Math.max(...days.map((d) => d.earned + d.tips));
  const svcs = Math.round(23 * ratio);
  return (
    <div className="bd-c-pad">
      <h3 className="bd-serif bd-c-h">My earnings</h3>
      <p className="bd-hint">This week · {t.commission}% commission</p>
      <div className="bd-kpis bd-kpis-3">
        <div className="bd-kpi">
          <span>Commission</span>
          <strong className="bd-serif">{money(earned)}</strong>
        </div>
        <div className="bd-kpi">
          <span>Tips</span>
          <strong className="bd-serif">{money(tips)}</strong>
        </div>
        <div className="bd-kpi">
          <span>Services</span>
          <strong className="bd-serif">{svcs}</strong>
        </div>
      </div>
      <div className="bd-card">
        <p className="bd-mini">Commission + tips by day</p>
        <div
          className="bd-bars"
          role="img"
          aria-label={`Daily earnings including tips: ${days.map((d) => `${d.day} ${money(d.earned + d.tips)}`).join(", ")}`}
        >
          {days.map((d) => (
            <div
              key={d.day}
              className="bd-bar-col"
              data-tip={`${d.day}: ${money(d.earned)} + ${money(d.tips)} tips`}
            >
              <span className="bd-bar-val">
                {d.earned + d.tips ? money(d.earned + d.tips) : ""}
              </span>
              <span
                className="bd-bar"
                style={{ height: `${((d.earned + d.tips) / max) * 100}%` }}
              />
              <span className="bd-bar-label">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="bd-c-label">Completed today</p>
      {MIA_EARNINGS.done.map((d) => (
        <div key={d.time} className="bd-card bd-past">
          <span>
            <strong>{d.service}</strong>
            <span className="bd-sub">
              {d.time} · {d.client}
            </span>
          </span>
          <span className="bd-earn">
            <strong>{money(Math.round(d.price * (t.commission / 100)))}</strong>
            <span className="bd-hint">+{money(d.tip)} tip</span>
          </span>
        </div>
      ))}
      <p className="bd-hint">
        Recorded earnings for your reference. Payroll stays with the salon’s
        payroll provider.
      </p>
    </div>
  );
}

function Team({ techId }) {
  const { state, dispatch } = useDemo();
  const [note, setNote] = useState("");
  return (
    <div className="bd-c-pad">
      <h3 className="bd-serif bd-c-h">Team</h3>
      <p className="bd-c-label">Announcements</p>
      {state.announcements.map((n) => (
        <div key={n.id} className="bd-card bd-note is-owner">
          <span className="bd-hint">
            {n.from} · {n.at}
          </span>
          <p>{n.text}</p>
        </div>
      ))}
      <p className="bd-c-label">Shift notes</p>
      <form
        className="bd-inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!note.trim()) return;
          dispatch({
            type: "note",
            from: tech(techId).name,
            text: note.trim(),
          });
          setNote("");
        }}
      >
        <label className="bd-field">
          <span className="bd-sr">Add a shift note</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for the next shift"
          />
        </label>
        <button type="submit" className="bd-btn bd-btn-sm">
          Post
        </button>
      </form>
      {state.notes.map((n) => (
        <div key={n.id} className="bd-card bd-note">
          <span className="bd-hint">
            {n.from} · {n.at}
          </span>
          <p>{n.text}</p>
        </div>
      ))}
    </div>
  );
}

export default function TechApp() {
  const [techId, setTechId] = useState("mia");
  const [tab, setTab] = useState("today");
  const nav = [
    ["today", "list", "Today"],
    ["week", "calendar", "Schedule"],
    ["earn", "chart", "Earnings"],
    ["team", "chat", "Team"],
  ];
  return (
    <div className="bd-tech-wrap">
      <label className="bd-field bd-viewas">
        <span>Signed in as</span>
        <select value={techId} onChange={(e) => setTechId(e.target.value)}>
          {TECHS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.role}
            </option>
          ))}
        </select>
      </label>
      <PhoneFrame
        label="Technician app"
        footer={
          <nav className="bd-bottomnav" aria-label="Technician app">
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
        {tab === "today" && <Today key={techId} techId={techId} />}
        {tab === "week" && (
          <TechSchedule key={techId} techId={techId} TodayDetail={Detail} />
        )}
        {tab === "earn" && <Earnings techId={techId} />}
        {tab === "team" && <Team techId={techId} />}
      </PhoneFrame>
    </div>
  );
}
