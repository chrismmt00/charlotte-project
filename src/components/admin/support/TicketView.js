"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Bar, Chip, btnPrimary, btnSecondary } from "@/components/admin/ui";
import { FieldRow, FormError, Icon, Modal, Note, Toast, api, checkClass, clientLink, hours, inputClass, textareaClass, useSubmit, useToast } from "@/components/admin/billing/kit";
import { ASSIGNEES, CANNED, TICKET_STATUSES, monthOf } from "@/lib/admin/sample-support";

const STATUS_TONE = { Open: "accent", "In progress": "accent", "Waiting on client": "muted", Closed: "success" };
const PRIORITY_TONE = { Normal: "muted", High: "warning", Outage: "danger" };
const round1 = (n) => Math.round(n * 10) / 10;

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
  const tone = over ? "danger" : near ? "warning" : "success";
  const capLabel = over ? `Over cap · ${hours(used - capHours)} h extra` : near ? "Near the cap" : hasCap ? "Within plan" : "No cap yet";
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
    patchTicket({ status: v }, `Status set to ${v}`, () => {
      setStatus(v);
      setThread((t) => [...t, addEvent(`Status → ${v}`)]);
    }, () => setStatus(prev));
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
    const msg = { id: out.message.id, kind: isReply ? "team" : "internal", who: who, when: "just now", text: draft, ...(file ? { file } : {}) };
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

  const sendError = sending.status === "failed" ? sending.error : "";

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-[12px] text-muted-2 mb-3">
        <Link href="/admin/support" className="hover:text-fg">
          Support
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-fg">
          {ticket.num}
        </span>
      </nav>

      <header className="mb-5">
        <div className="text-[11px] tracking-[.2em] uppercase text-muted-2 mb-2">
          {ticket.num} · {ticket.type} · opened {ticket.openedLong} by {ticket.requester} in the {ticket.source}
          <span className="md:hidden normal-case tracking-normal ml-2 border border-border-2 rounded-full px-2 py-0.5">Sample data</span>
        </div>
        <h1 className="font-display font-normal text-[clamp(28px,3.4vw,40px)] leading-[1.05] m-0 mb-4">{ticket.subject}</h1>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tk-status" className="text-[12px] text-muted-2">
              Status
            </label>
            <select id="tk-status" value={status} onChange={(e) => changeStatus(e.target.value)} className={`${inputClass} min-w-[170px]`}>
              {TICKET_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tk-who" className="text-[12px] text-muted-2">
              Assigned to
            </label>
            <select id="tk-who" value={who} onChange={(e) => changeWho(e.target.value)} className={`${inputClass} min-w-[150px]`}>
              {ASSIGNEES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <Chip tone={PRIORITY_TONE[ticket.priority]} className="mb-2.5">
            {ticket.priority === "High" ? "High · same day" : ticket.priority === "Outage" ? "Outage · now" : "Normal · 1 business day"}
          </Chip>
          <Chip tone={STATUS_TONE[status]} className="mb-2.5">
            {status}
          </Chip>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Link href={clientLink(ticket.client)} className={btnSecondary}>
              {ticket.client} · {ticket.planLabel} <span aria-hidden="true">↗</span>
            </Link>
            <button type="button" className={btnSecondary} onClick={() => setOverlay("logtime")}>
              <Icon name="clock" size={14} />
              Log time
            </button>
            <Link href="/portal/support" className={btnSecondary}>
              View in portal <span aria-hidden="true">↗</span>
            </Link>
            {status !== "Closed" ? (
              <button type="button" className={btnPrimary} onClick={() => setOverlay("close")}>
                Close ticket
              </button>
            ) : (
              <button type="button" className={btnSecondary} onClick={() => changeStatus("Open")}>
                Reopen
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <section aria-labelledby="th-h" className="bg-surface border border-border rounded-admin p-4 sm:p-5 min-w-0">
          <h2 id="th-h" className="text-[15px] font-medium m-0 mb-4">
            Conversation
          </h2>
          <ol className="list-none p-0 m-0 flex flex-col gap-3.5">
            {thread.map((m) => (
              <Message key={m.id} m={m} />
            ))}
          </ol>

          <div className="mt-5 pt-5 border-t border-border flex flex-col gap-3">
            <div role="tablist" aria-label="Reply kind" className="inline-flex self-start p-0.5 rounded-[11px] border border-border-2">
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
                  className={`min-h-8 px-3 rounded-[9px] text-[13px] font-medium cursor-pointer border-0 ${kind === v ? "bg-fg text-bg" : "bg-transparent text-muted-2 hover:text-fg"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tk-reply" className="text-[12px] text-muted-2">
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
                className={`${textareaClass} ${draftError ? "border-danger" : isReply ? "" : "border-warning/60"}`}
              />
              {draftError ? (
                <p id="tk-reply-err" role="alert" className="m-0 text-[12px] text-danger flex items-center gap-1.5">
                  <Icon name="alert" size={13} />
                  {draftError}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tk-canned" className="text-[12px] text-muted-2">
                  Canned replies
                </label>
                <select
                  id="tk-canned"
                  value=""
                  onChange={(e) => {
                    setDraft(CANNED[e.target.value] || "");
                    setDraftError("");
                  }}
                  className={`${inputClass} min-w-[220px]`}
                >
                  <option value="" disabled>
                    Canned reply…
                  </option>
                  {Object.keys(CANNED).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </div>
              <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => setFile(e.target.files?.[0]?.name || "")} />
              <button type="button" className={btnSecondary} onClick={() => fileRef.current?.click()}>
                <Icon name="clip" size={14} />
                {file ? file : "Attach"}
              </button>
              {isReply ? (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tk-after" className="text-[12px] text-muted-2">
                    then set
                  </label>
                  <select id="tk-after" value={after} onChange={(e) => setAfter(e.target.value)} className={inputClass}>
                    {["Waiting on client", "In progress", "Closed", "Keep status"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              <button type="button" className={`${btnPrimary} sm:ml-auto`} onClick={send} disabled={sending.submitting}>
                {sending.submitting ? "Sending…" : isReply ? "Send reply" : "Save note"}
              </button>
            </div>
            <FormError message={sendError} />
            <p id="tk-reply-note" className="m-0 text-[12px] text-muted-2">
              {isReply ? "Emails the client from the support address; they can reply from their inbox or the portal." : "Internal notes are highlighted and never emailed."}
            </p>
          </div>
        </section>

        <aside className="flex flex-col gap-5 min-w-0">
          <section aria-labelledby="hr-h" className="bg-surface border border-border rounded-admin p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 id="hr-h" className="text-[15px] font-medium m-0">
                Plan hours · {new Date(today + "T00:00:00Z").toLocaleString("en-US", { month: "long", timeZone: "UTC" })}
              </h2>
              <Chip tone={tone}>{capLabel}</Chip>
            </div>
            <div className="flex items-baseline gap-2 mb-2.5">
              <span className={`text-[28px] font-medium leading-none ${over ? "text-danger" : ""}`}>{hours(used)}</span>
              <span className="text-muted-2">{hasCap ? `of ${capHours} h included in the ${ticket.planLabel.split(" · ").slice(-1)[0]}` : "h this month · their plan starts at launch"}</span>
            </div>
            {hasCap ? <Bar pct={Math.round((used / capHours) * 100)} tone={over ? "danger" : near ? "warning" : "success"} label="Plan hours used" /> : null}
            <p className="text-[12px] text-muted-2 mt-3 mb-0 leading-[1.55]">
              {over
                ? `Everything past ${capHours} h is billable at the plan’s hourly rate or quoted as a one-off. Tell the client before you keep going.`
                : near
                  ? "One more small change this month and they hit the cap. Mention it in your reply so there is no surprise."
                  : hasCap
                    ? "Plenty of room. Hours reset on the 1st; unused hours do not roll over."
                    : "No cap until the monthly plan starts. Time is still logged."}
            </p>
            {over ? (
              <Link href="/admin/proposals?new=1" className="inline-flex mt-3 text-accent-light hover:text-fg">
                Send a quote for the extra <span aria-hidden="true" className="ml-1">↗</span>
              </Link>
            ) : null}
            <ul className="list-none p-0 mt-4 mb-3">
              {time.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 border-t border-border py-2">
                  <span className="min-w-0">
                    {e.what} <span className="text-muted-2">· {e.who}</span>
                  </span>
                  <span className="text-muted-2 flex-none">{hours(e.hours)} h</span>
                </li>
              ))}
              {time.length === 0 ? <li className="text-muted-2 border-t border-border pt-2">No time logged yet.</li> : null}
            </ul>
            <button type="button" className={btnSecondary} onClick={() => setOverlay("logtime")}>
              <Icon name="clock" size={14} />
              Log time
            </button>
          </section>

          <section aria-labelledby="dt-h" className="bg-surface border border-border rounded-admin p-5">
            <h2 id="dt-h" className="text-[15px] font-medium m-0 mb-3">
              Details
            </h2>
            <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2.5 m-0">
              <dt className="text-muted-2">Reply due</dt>
              <dd className="m-0">{status === "Closed" ? "Closed" : status === "Waiting on client" ? "Paused while waiting" : ticket.replyDue}</dd>
              <dt className="text-muted-2">Reported by</dt>
              <dd className="m-0 break-words">
                {ticket.requester} · <a href={`mailto:${ticket.requesterEmail.replace(/[[\]]/g, "")}`} className="text-accent-light hover:text-fg">{ticket.requesterEmail}</a>
              </dd>
              <dt className="text-muted-2">Site</dt>
              <dd className="m-0">{ticket.site}</dd>
              <dt className="text-muted-2">Related</dt>
              <dd className="m-0">
                {ticket.related.length
                  ? ticket.related.map((r) => (
                      <div key={r.id}>
                        <Link href={`/admin/support/${r.id}`} className="text-accent-light hover:text-fg">
                          {r.num} · {r.subject}
                        </Link>{" "}
                        · {r.status}
                      </div>
                    ))
                  : "None"}
              </dd>
              <dt className="text-muted-2">Watchers</dt>
              <dd className="m-0">{ticket.watchers} · the client gets every reply by email</dd>
            </dl>
          </section>
        </aside>
      </div>

      <p className="text-[12px] text-muted-2 mt-5 mb-0 max-w-[820px]">
        Replies post to <code>POST /api/admin/tickets/[id]/messages</code> and email the client; internal notes never leave the team. Time entries feed the plan-hours bar and the client’s portal. Plan hour caps are placeholders until each proposal sets them.
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
      <li className="self-center text-center text-[12px] text-muted-2 max-w-[560px]">
        <span className="sr-only">System, {m.when}: </span>
        {m.text} <span aria-hidden="true">· {m.when}</span>
      </li>
    );
  }
  const client = m.kind === "client";
  const internal = m.kind === "internal";
  return (
    <li className={`flex flex-col gap-1.5 max-w-[88%] min-w-0 ${client ? "self-start items-start" : "self-end items-end"}`}>
      <div className="text-[12px] text-muted-2 flex items-center gap-2">
        {m.who} · {m.when}
        {internal ? <Chip tone="warning">Internal</Chip> : null}
      </div>
      <div className={`rounded-[14px] px-3.5 py-3 leading-[1.6] whitespace-pre-wrap break-words border ${client ? "bg-surface-2 border-border text-fg" : internal ? "bg-warning/10 border-warning/50 text-fg" : "bg-fg border-fg text-bg"}`}>
        {m.text}
        {m.file ? (
          <span className={`mt-2 flex items-center gap-2 text-[12px] ${client || internal ? "text-muted-2" : "text-bg"}`}>
            <Icon name="file" size={14} />
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
  const [err, setErr] = useState("");
  const sub = useSubmit();
  const h = Number(hoursText);
  const willExceed = capHours > 0 && h > 0 && used + h > capHours;
  const submit = async (e) => {
    e.preventDefault();
    if (!(h > 0) || h > 24) return setErr("Enter hours between 0 and 24, like 0.5.");
    setErr("");
    const out = await sub.run(() => api(`/api/admin/tickets/${ticket.id}/time`, { method: "POST", body: { hours: h, who: by, what } }));
    if (out) onLogged({ id: out.entry.id, hours: h, who: by, what: what.trim() || "Time on the ticket" });
  };
  return (
    <Modal
      id="lt"
      size="sm"
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
          <FieldRow id="lt-h2" label="Hours" error={err}>
            <input id="lt-h2" data-autofocus type="text" inputMode="decimal" value={hoursText} onChange={(e) => setHoursText(e.target.value)} aria-invalid={!!err} aria-describedby={err ? "lt-h2-err" : undefined} className={`${inputClass} ${err ? "border-danger" : ""}`} />
          </FieldRow>
          <FieldRow id="lt-who" label="Who">
            <select id="lt-who" value={by} onChange={(e) => setBy(e.target.value)} className={inputClass}>
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
  const [err, setErr] = useState("");
  const sub = useSubmit();
  const submit = async (e) => {
    e.preventDefault();
    if (!resolution.trim()) return setErr("Write the resolution the client will see.");
    setErr("");
    const out = await sub.run(() => api(`/api/admin/tickets/${ticket.id}`, { method: "PATCH", body: { status: "Closed", resolution, rootCause: cause, askRating: rating, addToKb: kb } }));
    if (out) onClosed(resolution.trim());
  };
  return (
    <Modal
      id="cl"
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
        <FieldRow id="cl-res" label="Resolution (the client sees this)" error={err}>
          <textarea id="cl-res" data-autofocus rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} aria-invalid={!!err} aria-describedby={err ? "cl-res-err" : undefined} placeholder="What we did and what they should see now" className={`${textareaClass} ${err ? "border-danger" : ""}`} />
        </FieldRow>
        <FieldRow id="cl-cause" label="Root cause (internal)">
          <select id="cl-cause" value={cause} onChange={(e) => setCause(e.target.value)} className={inputClass}>
            {["DNS / email auth", "Our bug", "Client content", "Third-party outage", "Question answered"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </FieldRow>
        <label className="flex items-center gap-2.5 cursor-pointer min-h-9">
          <input type="checkbox" checked={rating} onChange={(e) => setRating(e.target.checked)} className={checkClass} />
          <span>Ask the client for a 1–5 rating</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer min-h-9">
          <input type="checkbox" checked={kb} onChange={(e) => setKb(e.target.checked)} className={checkClass} />
          <span>Add to the knowledge base as “{ticket.subject}”</span>
        </label>
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}
