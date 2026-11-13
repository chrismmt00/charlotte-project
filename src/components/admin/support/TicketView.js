"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SamplePill, btnPrimary, btnSecondary } from "@/components/admin/ui";
import { FieldRow, FormError, Icon, Modal, Note, Toast, api, btnSm, checkClass, checkLabelClass, clientLink, hours, inputClass, textareaClass, useSubmit, useToast } from "@/components/admin/billing/kit";
import { ASSIGNEES, CANNED, TICKET_STATUSES, monthOf } from "@/lib/admin/sample-support";

const STATUS_COLOR = { Open: "text-accent-light", "In progress": "text-accent", "Waiting on client": "text-muted-2", Closed: "text-success" };
const PRIORITY_COLOR = { Normal: "text-muted-2", High: "text-warning", Outage: "text-danger" };
const round1 = (n) => Math.round(n * 10) / 10;
const pillSelect = "min-h-8 rounded-full border border-border-2 bg-surface px-3 text-[13px] cursor-pointer";
const pillChip = "inline-flex items-center min-h-8 px-3 rounded-full border border-border-2";
const panel = "bg-surface border border-border rounded-admin px-5 py-[18px] box-border flex flex-col gap-3.5 min-w-0";
const dl = "flex flex-col gap-0.5";
const dt = "text-xs text-muted";

export default function TicketView({ ticket, capHours, usedByOthers, today }) {
  const [status, setStatus] = useState(ticket.status);
  const [who, setWho] = useState(ticket.assigned);
  const [thread, setThread] = useState(ticket.thread);
  const [time, setTime] = useState(ticket.time);
  const [kind, setKind] = useState("reply");
  const [draft, setDraft] = useState("");
  const [after, setAfter] = useState("Waiting on client");
  const [file, setFile] = useState("");
  const [draftError, setDraftError] = useState("");
  const [overlay, setOverlay] = useState(null);
  const [message, toast] = useToast();
  const sending = useSubmit();
  const draftRef = useRef(null);
  const fileRef = useRef(null);

  const month = monthOf(today);
  const thisTicketUsed = round1(time.filter((e) => monthOf(e.on) === month).reduce((a, e) => a + e.hours, 0));
  const used = round1(usedByOthers + thisTicketUsed);
  const hasCap = capHours > 0;
  const over = hasCap && used > capHours;
  const near = hasCap && !over && used / capHours >= 0.75;
  const capColor = over ? "text-danger" : near ? "text-warning" : "text-success";
  const capBg = over ? "bg-danger" : near ? "bg-warning" : "bg-success";
  const capLabel = over ? `Over cap · ${hours(used - capHours)} h extra` : near ? "Near the cap" : hasCap ? "Within plan" : "No cap yet";
  const capPct = hasCap ? Math.min(100, Math.round((used / capHours) * 100)) : 0;
  const isReply = kind === "reply";
  const closeOverlay = () => setOverlay(null);
  const addEvent = (text) => ({ id: `ev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, kind: "event", who: "System", when: "just now", text });

  const patchTicket = async (body, okMessage, apply, revert) => {
    apply();
    try {
      await api(`/api/admin/tickets/${ticket.id}`, { method: "PATCH", body });
      toast(okMessage);
    } catch (e) {
      revert();
      toast(`Couldn’t save that. ${e.message}`);
    }
  };

  const changeStatus = (v) => {
    const prev = status;
    patchTicket(
      { status: v },
      `Status set to ${v}`,
      () => {
        setStatus(v);
        setThread((t) => [...t, addEvent(`Status → ${v}`)]);
      },
      () => setStatus(prev)
    );
  };
  const changeWho = (v) => {
    const prev = who;
    patchTicket({ assigned: v }, `Assigned to ${v}`, () => setWho(v), () => setWho(prev));
  };

  const send = async () => {
    if (!draft.trim()) {
      setDraftError(isReply ? "Write a reply first." : "Write the note first.");
      draftRef.current?.focus();
      return;
    }
    setDraftError("");
    const out = await sending.run(() => api(`/api/admin/tickets/${ticket.id}/messages`, { method: "POST", body: { kind, body: draft, after: isReply ? after : undefined } }));
    if (!out) return;
    const msg = { id: out.message.id, kind: isReply ? "team" : "internal", who, when: "just now", text: draft, ...(file ? { file } : {}) };
    setThread((t) => {
      const next = [...t, msg];
      if (isReply && after !== "Keep status" && after !== status) next.push(addEvent(`Status → ${after}`));
      return next;
    });
    if (isReply && after !== "Keep status") setStatus(after);
    setDraft("");
    setFile("");
    toast(isReply ? `Reply sent to ${ticket.requester} by email` : "Note saved · team only");
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted flex items-center gap-2">
        <Link href="/admin/support" className="text-muted-2 hover:text-fg">
          Support
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-fg">
          {ticket.num}
        </span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2.5 min-w-0">
          <div className="text-[11px] tracking-[.3em] uppercase text-muted-2 flex flex-wrap items-center gap-2.5">
            <span>
              {ticket.num} · {ticket.type} · opened {ticket.openedLong} by {ticket.requester} in the {ticket.source}
            </span>
            <span className="normal-case tracking-normal">
              <SamplePill />
            </span>
          </div>
          <h1 className="font-display font-normal text-[clamp(28px,3.4vw,40px)] leading-[1.05] m-0">{ticket.subject}</h1>
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <label htmlFor="tk-status" className="sr-only">
              Status
            </label>
            <select id="tk-status" value={status} onChange={(e) => changeStatus(e.target.value)} className={`${pillSelect} font-medium ${STATUS_COLOR[status]}`}>
              {TICKET_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <label htmlFor="tk-who" className="sr-only">
              Assigned to
            </label>
            <select id="tk-who" value={who} onChange={(e) => changeWho(e.target.value)} className={`${pillSelect} text-fg`}>
              {ASSIGNEES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <span className={`${pillChip} ${PRIORITY_COLOR[ticket.priority]}`}>{ticket.priority === "High" ? "High · same day" : ticket.priority === "Outage" ? "Outage · now" : "Normal · 1 business day"}</span>
            <Link href={clientLink(ticket.client)} className={`${pillChip} text-muted-2`}>
              {ticket.client} · {ticket.planLabel} ↗
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnSm} onClick={() => setOverlay("logtime")}>
            Log time
          </button>
          <Link href="/portal/support" className={btnSm}>
            View in portal <span aria-hidden="true">↗</span>
          </Link>
          {status !== "Closed" ? (
            <button type="button" className={`${btnSm} !bg-fg !text-bg !border-fg`} onClick={() => setOverlay("close")}>
              Close ticket
            </button>
          ) : (
            <button type="button" className={btnSm} onClick={() => changeStatus("Open")}>
              Reopen
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 min-[1181px]:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <section aria-labelledby="th-h" className="bg-surface border border-border rounded-admin overflow-hidden min-w-0">
          <h2 id="th-h" className="sr-only">
            Conversation
          </h2>
          <ol className="list-none m-0 px-5 pt-5 pb-2 flex flex-col gap-3.5">
            {thread.map((m) => (
              <Message key={m.id} m={m} />
            ))}
          </ol>

          <div className="border-t border-border px-5 pt-3.5 pb-[18px] flex flex-col gap-2.5 bg-surface-2">
            <div role="tablist" aria-label="Reply kind" className="inline-flex gap-1 p-1 border border-border-2 rounded-full self-start">
              {[
                ["reply", "Reply to client"],
                ["note", "Internal note"],
              ].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={kind === v}
                  onClick={() => {
                    setKind(v);
                    setDraftError("");
                  }}
                  className={`min-h-8 px-3.5 rounded-full border-0 text-[13px] font-medium cursor-pointer ${kind === v ? "bg-fg text-bg" : "bg-transparent text-muted-2"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label htmlFor="tk-reply" className="sr-only">
              {isReply ? "Reply to the client" : "Internal note"}
            </label>
            <textarea
              id="tk-reply"
              ref={draftRef}
              rows={4}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (draftError) setDraftError("");
              }}
              aria-invalid={!!draftError}
              aria-describedby={draftError ? "tk-reply-err" : "tk-reply-note"}
              placeholder={isReply ? `Write to ${ticket.requester}. Plain words, say what happens next and when.` : "Only the team sees this"}
              className={`${textareaClass} !bg-surface leading-[1.55] ${draftError ? "!border-danger" : isReply ? "" : "!border-warning/60"}`}
            />
            {draftError ? (
              <p id="tk-reply-err" role="alert" className="m-0 text-xs text-danger flex items-center gap-1.5">
                <Icon name="alert" size={13} />
                {draftError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="tk-canned" className="sr-only">
                Canned replies
              </label>
              <select
                id="tk-canned"
                value=""
                onChange={(e) => {
                  setDraft(CANNED[e.target.value] || "");
                  setDraftError("");
                }}
                className={`${inputClass} !w-auto !min-h-[34px] !bg-surface cursor-pointer`}
              >
                <option value="" disabled>
                  Canned reply…
                </option>
                {Object.keys(CANNED).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => setFile(e.target.files?.[0]?.name || "")} />
              <button type="button" className={`${btnSm} !min-h-[34px]`} onClick={() => fileRef.current?.click()}>
                <Icon name="clip" size={14} />
                {file || "Attach"}
              </button>
              <span className="flex-1" />
              {isReply ? (
                <>
                  <label htmlFor="tk-after" className="text-xs text-muted-2">
                    then set
                  </label>
                  <select id="tk-after" value={after} onChange={(e) => setAfter(e.target.value)} className={`${inputClass} !w-auto !min-h-[34px] !bg-surface cursor-pointer`}>
                    {["Waiting on client", "In progress", "Closed", "Keep status"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </>
              ) : null}
              <button type="button" className={`${btnPrimary} !min-h-9`} onClick={send} disabled={sending.submitting}>
                {sending.submitting ? "Sending…" : isReply ? "Send reply" : "Save note"}
              </button>
            </div>
            <FormError message={sending.status === "failed" ? sending.error : ""} />
            <span id="tk-reply-note" className="text-xs text-muted">
              {isReply ? "Emails the client from support@klyvora.com; they can reply from their inbox or the portal." : "Internal notes are highlighted and never emailed."}
            </span>
          </div>
        </section>

        <aside className="flex flex-col gap-5 min-w-0">
          <section aria-labelledby="hr-h" className={panel}>
            <div className="flex items-center justify-between gap-2.5">
              <h2 id="hr-h" className="text-[15px] font-medium m-0">
                Plan hours · {new Date(today + "T00:00:00Z").toLocaleString("en-US", { month: "long", timeZone: "UTC" })}
              </h2>
              <span className={`text-xs border border-border-2 rounded-full px-2.5 py-[3px] ${capColor}`}>{capLabel}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-medium leading-none tabular-nums">{hours(used)}</span>
              <span className="text-[13px] text-muted">{hasCap ? `of ${capHours} h included in the ${ticket.planLabel.split(" · ").slice(-1)[0]}` : "h this month · their plan starts at launch"}</span>
            </div>
            {hasCap ? (
              <div role="progressbar" aria-label="Plan hours used" aria-valuemin={0} aria-valuemax={capHours} aria-valuenow={used} className="h-1.5 rounded-[3px] bg-border overflow-hidden">
                <div className={`h-full rounded-[3px] transition-[width] duration-[400ms] ${capBg}`} style={{ width: `${capPct}%` }} />
              </div>
            ) : null}
            <p className="m-0 text-[13px] text-muted-2 leading-[1.6]">
              {over
                ? `Everything past ${capHours} h is billable at the plan’s hourly rate or quoted as a one-off. Tell the client before you keep going.`
                : near
                  ? "One more small change this month and they hit the cap. Mention it in your reply so there is no surprise."
                  : hasCap
                    ? "Plenty of room. Hours reset on the 1st; unused hours do not roll over."
                    : "No cap until the monthly plan starts. Time is still logged."}
            </p>
            {over ? (
              <Link href="/admin/proposals?new=1" className={`${btnSecondary} self-start`}>
                Send a quote for the extra ↗
              </Link>
            ) : null}
            <ul className="list-none m-0 p-0 flex flex-col text-[13px]">
              {time.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2.5 min-h-9 border-t border-border">
                  <span className="text-muted-2">
                    {e.what} · {e.who}
                  </span>
                  <span className="tabular-nums whitespace-nowrap">{hours(e.hours)} h</span>
                </li>
              ))}
              {time.length === 0 ? <li className="min-h-9 flex items-center border-t border-border text-muted">No time logged yet.</li> : null}
            </ul>
            <button type="button" className={`${btnSm} self-start`} onClick={() => setOverlay("logtime")}>
              Log time
            </button>
          </section>

          <section aria-labelledby="dt-h" className={panel}>
            <h2 id="dt-h" className="text-[15px] font-medium m-0">
              Details
            </h2>
            <dl className="m-0 flex flex-col gap-2.5 text-[13px]">
              <div className={dl}>
                <dt className={dt}>Reply due</dt>
                <dd className="m-0">{status === "Closed" ? <span className="text-muted">Closed</span> : status === "Waiting on client" ? "Paused while waiting" : ticket.replyDue}</dd>
              </div>
              <div className={dl}>
                <dt className={dt}>Reported by</dt>
                <dd className="m-0 break-words">
                  {ticket.requester} ·{" "}
                  <a href={`mailto:${ticket.requesterEmail.replace(/[[\]]/g, "")}`} className="text-accent-light">
                    {ticket.requesterEmail}
                  </a>
                </dd>
              </div>
              <div className={dl}>
                <dt className={dt}>Site</dt>
                <dd className="m-0 font-mono text-xs">{ticket.site}</dd>
              </div>
              <div className={dl}>
                <dt className={dt}>Related</dt>
                <dd className="m-0">
                  {ticket.related.length
                    ? ticket.related.map((r) => (
                        <div key={r.id}>
                          <Link href={`/admin/support/${r.id}`} className="text-accent-light">
                            {r.num} · {r.subject}
                          </Link>{" "}
                          · {r.status}
                        </div>
                      ))
                    : "None"}
                </dd>
              </div>
              <div className={dl}>
                <dt className={dt}>Watchers</dt>
                <dd className="m-0">{ticket.watchers} · client gets every reply by email</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <p className="m-0 text-[13px] text-muted">
        Replies post to <code className="font-mono text-xs text-muted-2">POST /api/admin/tickets/[id]/messages</code> and email the client; internal notes never leave the team. Time entries feed the plan-hours bar and the client’s portal. Plan hour caps are placeholders until each proposal sets them.
      </p>

      {overlay === "logtime" ? (
        <LogTimeDialog
          ticket={ticket}
          who={who}
          used={used}
          capHours={capHours}
          onClose={closeOverlay}
          onLogged={(entry) => {
            setTime((t) => [...t, { ...entry, on: today }]);
            setThread((t) => [...t, addEvent(`${entry.hours} h logged by ${entry.who}`)]);
            closeOverlay();
            toast(`${entry.hours} h logged`);
          }}
        />
      ) : null}
      {overlay === "close" ? (
        <CloseDialog
          ticket={ticket}
          used={thisTicketUsed}
          who={who}
          onClose={closeOverlay}
          onClosed={(resolution) => {
            setStatus("Closed");
            setThread((t) => [...t, { id: `m_${Date.now().toString(36)}`, kind: "team", who, when: "just now", text: resolution }, addEvent("Closed · rating request sent")]);
            closeOverlay();
            toast("Closed · client notified and asked for a rating");
          }}
        />
      ) : null}

      <Toast message={message} />
    </>
  );
}

function Message({ m }) {
  if (m.kind === "event") {
    return (
      <li className="flex flex-col gap-1.5 items-center">
        <span className="sr-only">System, {m.when}: </span>
        <span className="text-xs text-muted border border-dashed border-border-2 rounded-full px-3 py-1">{m.text}</span>
      </li>
    );
  }
  const client = m.kind === "client";
  const internal = m.kind === "internal";
  return (
    <li className={`flex flex-col gap-1.5 min-w-0 ${client ? "items-start" : "items-end"}`}>
      <span className="text-xs text-muted flex items-center gap-2">
        {m.who} · {m.when}
        {internal ? <span className="text-[11px] text-warning border border-border-2 rounded-full px-2 py-px">Internal</span> : null}
      </span>
      <div className={`max-w-[640px] px-3.5 py-3 rounded-[14px] text-[13px] leading-[1.65] whitespace-pre-wrap break-words border ${client ? "bg-surface-2 border-border text-fg" : internal ? "bg-warning/[.08] border-warning/50 text-fg" : "bg-fg border-fg text-bg"}`}>
        {m.text}
        {m.file ? (
          <span className="flex w-fit items-center gap-2 mt-2.5 px-2.5 py-2 border border-border-2 rounded-[10px] text-xs text-muted-2">
            <span aria-hidden="true" className="font-mono text-[10px] border border-border-2 rounded-md px-1.5 py-0.5">
              {m.file.split(".").pop().toUpperCase().slice(0, 4)}
            </span>
            {m.file}
          </span>
        ) : null}
      </div>
    </li>
  );
}

function LogTimeDialog({ ticket, who, used, capHours, onClose, onLogged }) {
  const [hoursText, setHoursText] = useState("0.5");
  const [by, setBy] = useState(ASSIGNEES.includes(who) ? who : "Geoffrey");
  const [what, setWhat] = useState("");
  const [error, setError] = useState("");
  const sub = useSubmit();
  const h = Number(hoursText);
  const willExceed = capHours > 0 && h > 0 && used + h > capHours;
  const submit = async (e) => {
    e.preventDefault();
    if (!(h > 0) || h > 24) return setError("Enter hours between 0 and 24, like 0.5.");
    setError("");
    const out = await sub.run(() => api(`/api/admin/tickets/${ticket.id}/time`, { method: "POST", body: { hours: h, who: by, what } }));
    if (out) onLogged({ id: out.entry.id, hours: h, who: by, what: what.trim() || "Time on the ticket" });
  };
  return (
    <Modal
      id="lt"
      w={440}
      eyebrow={ticket.num}
      title="Log time"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="lt-form" className={btnPrimary} disabled={sub.submitting}>
            {sub.submitting ? "Logging…" : `Log ${hoursText || "0"} h`}
          </button>
        </>
      }
    >
      <form id="lt-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <FieldRow id="lt-h2" label="Hours" error={error}>
            <input id="lt-h2" data-autofocus type="text" inputMode="decimal" value={hoursText} onChange={(e) => setHoursText(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "lt-h2-err" : undefined} className={`${inputClass} ${error ? "!border-danger" : ""}`} />
          </FieldRow>
          <FieldRow id="lt-who" label="Who">
            <select id="lt-who" value={by} onChange={(e) => setBy(e.target.value)} className={`${inputClass} cursor-pointer`}>
              {ASSIGNEES.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </FieldRow>
        </div>
        <FieldRow id="lt-what" label="What">
          <input id="lt-what" type="text" value={what} onChange={(e) => setWhat(e.target.value)} placeholder="SPF + DKIM records, resend test" className={inputClass} />
        </FieldRow>
        {willExceed ? (
          <Note tone="warning">This takes the client over the {capHours} h in their plan. Log it anyway; the overage shows on the hours card and you can quote the rest.</Note>
        ) : used > capHours && capHours > 0 ? (
          <Note tone="warning">The client is already over their {capHours} h plan cap this month. Extra time is billable or quoted.</Note>
        ) : null}
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}

function CloseDialog({ ticket, used, who, onClose, onClosed }) {
  const [resolution, setResolution] = useState("");
  const [cause, setCause] = useState("Question answered");
  const [rating, setRating] = useState(true);
  const [kb, setKb] = useState(false);
  const [error, setError] = useState("");
  const sub = useSubmit();
  const submit = async (e) => {
    e.preventDefault();
    if (!resolution.trim()) return setError("Write the resolution the client will see.");
    setError("");
    const out = await sub.run(() => api(`/api/admin/tickets/${ticket.id}`, { method: "PATCH", body: { status: "Closed", resolution, rootCause: cause, askRating: rating, addToKb: kb } }));
    if (out) onClosed(resolution.trim());
  };
  return (
    <Modal
      id="cl"
      w={520}
      eyebrow={`${ticket.num} · ${hours(used)} h logged by ${who}`}
      title="Close this ticket?"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="cl-form" className={btnPrimary} disabled={sub.submitting}>
            {sub.submitting ? "Closing…" : "Close and notify"}
          </button>
        </>
      }
    >
      <form id="cl-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        <FieldRow id="cl-res" label="Resolution (the client sees this)" error={error}>
          <textarea id="cl-res" data-autofocus rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "cl-res-err" : undefined} placeholder="What we did and what they should see now" className={`${textareaClass} ${error ? "!border-danger" : ""}`} />
        </FieldRow>
        <FieldRow id="cl-cause" label="Root cause (internal)">
          <select id="cl-cause" value={cause} onChange={(e) => setCause(e.target.value)} className={`${inputClass} cursor-pointer`}>
            {["DNS / email auth", "Our bug", "Client content", "Third-party outage", "Question answered"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </FieldRow>
        <label className={checkLabelClass}>
          <input type="checkbox" checked={rating} onChange={(e) => setRating(e.target.checked)} className={checkClass} />
          Ask the client for a 1–5 rating
        </label>
        <label className={checkLabelClass}>
          <input type="checkbox" checked={kb} onChange={(e) => setKb(e.target.checked)} className={checkClass} />
          Add to the knowledge base as “{ticket.subject}”
        </label>
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}
