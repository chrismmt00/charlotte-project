"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageHead, Panel, Chip, LEAD_STATUS_TONE, Empty, btnPrimary, btnSecondary, btnDanger } from "@/components/admin/ui";
import { Dialog, Toast, useToast, Icon, DevBar, Alert, Row, Initial, fieldCls, chipBtn } from "./Overlay";
import { api, dev } from "./api";
import { LEAD_STATUSES, NEXT_TYPES, OWNERS, STATUS_DOT, STATUS_HELP, plainEmail } from "@/lib/admin/sample-leads";
import { MILESTONES, getOffer, monthlyLabel, money, setupLabel } from "@/lib/offers";

const selectCls = "min-h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-[13px] text-fg font-[inherit] max-w-full";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");
const nowLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const plusDays = (n) => {
  const d = new Date(Date.now() + n * 86400000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fmtDate = (s) => {
  const p = (s || "").split("-");
  return p.length === 3 ? `${MONTHS[parseInt(p[1], 10) - 1]} ${parseInt(p[2], 10)}` : s;
};
const nextLine = (n) => `${n.type} · ${fmtDate(n.date)} · ${n.time}`;

const DRAFTED = [
  { id: "pr_demo1", title: "Website + Booking · proposal v1", status: "Draft", meta: "$999 build · $79/mo optional · edited today by Chris" },
  { id: "pr_demo2", title: "Starter Website · proposal", status: "Sent", meta: "$499 build · sent 3d ago · opened twice" },
];

function EventIcon({ kind }) {
  const named = { call: "phone", email: "mail", note: "note" }[kind];
  return (
    <span aria-hidden="true" className="w-8 h-8 rounded-full border border-border-2 bg-surface-2 inline-flex items-center justify-center text-[11px] text-muted-2 flex-none">
      {named ? <Icon name={named} size={15} /> : kind === "check" ? "AI" : "S"}
    </span>
  );
}

export default function LeadDetail({ lead: initial }) {
  const router = useRouter();
  const [lead] = useState(initial);
  const [status, setStatus] = useState(initial.status);
  const [owner, setOwner] = useState(initial.owner);
  const [next, setNext] = useState(initial.nextAction);
  const [events, setEvents] = useState(initial.activity);
  const [filter, setFilter] = useState("All");
  const [notes, setNotes] = useState(initial.notes);
  const [noteState, setNoteState] = useState(initial.notesSavedAt ? `last saved ${initial.notesSavedAt}` : "Saves as you type");
  const [ov, setOv] = useState("none");
  const [logKind, setLogKind] = useState("call");
  const [more, setMore] = useState(false);
  const [propMode, setPropMode] = useState("data"); // dev-only: data | empty | drafted
  const [toast, showToast] = useToast();
  const moreRef = useRef(null);
  const noteTimer = useRef(null);

  useEffect(() => () => clearTimeout(noteTimer.current), []);
  useEffect(() => {
    if (!more) return;
    const onDoc = (e) => moreRef.current && !moreRef.current.contains(e.target) && setMore(false);
    const onKey = (e) => e.key === "Escape" && setMore(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [more]);

  const offer = getOffer(lead.offerCode);
  const estimate = offer ? `${setupLabel(offer)} build · ${monthlyLabel(offer)}` : null;
  const proposals = propMode === "empty" ? [] : propMode === "drafted" ? DRAFTED : lead.proposals;
  const close = () => setOv("none");
  const openLog = (k) => {
    setLogKind(k);
    setMore(false);
    setOv("log");
  };
  const addEvent = (e) => setEvents((es) => [e, ...es]);

  const patch = async (changes) => {
    const res = await api("PATCH", `/api/admin/leads/${lead.id}`, changes);
    return res;
  };
  const changeOwner = async (v) => {
    const prev = owner;
    setOwner(v);
    const res = await patch({ owner: v });
    if (!res.ok) {
      setOwner(prev);
      showToast("Couldn’t change the owner. Nothing was changed.", { tone: "error" });
    } else showToast(`Owner set to ${v}`);
  };
  const onNotes = (v) => {
    setNotes(v);
    setNoteState("Saving…");
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(async () => {
      const res = await patch({ notes: v });
      setNoteState(res.ok ? "Saved just now by Chris" : "Couldn’t save the notes. They save again on your next edit.");
    }, 800);
  };
  const markNextDone = async () => {
    const prev = next;
    setNext(null);
    const res = await patch({ nextAction: null });
    if (!res.ok) {
      setNext(prev);
      showToast("Couldn’t mark it done. Nothing was changed.", { tone: "error" });
    } else showToast("Next action done");
  };

  const kindOf = { Calls: "call", Emails: "email", Notes: "note", Status: "status" };
  const shown = events.filter((e) => filter === "All" || e.kind === kindOf[filter] || (filter === "Notes" && e.kind === "check"));
  const tone = LEAD_STATUS_TONE[status];

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted-2 mb-3">
        <Link href="/admin/leads" className="hover:text-fg min-h-9 inline-flex items-center">
          Leads
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-fg">
          {lead.business}
        </span>
      </nav>

      <PageHead eyebrow={`Lead · received ${lead.when} · ${lead.source}`} title={lead.business} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 -mt-3 mb-4">
        <button type="button" onClick={() => setOv("status")} aria-label={`Status: ${status}. Change status`} className="bg-transparent border-0 p-0 cursor-pointer">
          <Chip tone={tone}>
            <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
            {status} ▾
          </Chip>
        </button>
        <span className="text-muted-2">
          {lead.offer}
          {lead.offerCode ? ` · ${lead.offerCode}` : ""}
        </span>
        <span className="inline-flex items-center gap-2">
          <Initial owner={owner} />
          {owner}
        </span>
        {next ? (
          <span className="inline-flex items-center gap-1.5 text-accent-light">
            <Icon name="clock" size={14} />
            Next: {nextLine(next)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button type="button" className={btnSecondary} onClick={() => openLog("call")}>
          <Icon name="phone" /> Log call
        </button>
        <button type="button" className={btnSecondary} onClick={() => openLog("email")}>
          <Icon name="mail" /> Log email
        </button>
        <button type="button" className={btnSecondary} onClick={() => openLog("note")}>
          Add note
        </button>
        <button type="button" className={btnSecondary} onClick={() => setOv("next")}>
          Set next action
        </button>
        <Link href={`/admin/proposals?new=1&lead=${lead.id}`} className={btnSecondary}>
          Draft proposal ↗
        </Link>
        <button type="button" className={btnPrimary} onClick={() => setOv("convert")}>
          Convert to client
        </button>
        <div ref={moreRef} className="relative">
          <button type="button" aria-haspopup="menu" aria-expanded={more} aria-label="More actions" onClick={() => setMore((m) => !m)} className={`${btnSecondary} !px-2.5`}>
            <Icon name="dots" size={18} />
          </button>
          {more ? (
            <div role="menu" aria-label="More actions" className="absolute left-0 top-[calc(100%+6px)] z-[60] w-60 bg-surface border border-border rounded-admin p-1.5 shadow-[0_16px_40px_rgba(0,0,0,calc(.4*var(--shadow-k)))]">
              {[
                ["Merge with a duplicate…", () => (setMore(false), showToast("No duplicates found for this email"))],
                ["Export as PDF", () => (setMore(false), window.print())],
              ].map(([l, fn]) => (
                <button key={l} type="button" role="menuitem" onClick={fn} className="w-full text-left px-3 min-h-10 rounded-[10px] bg-transparent border-0 text-[13px] text-muted-2 hover:bg-surface-2 hover:text-fg cursor-pointer">
                  {l}
                </button>
              ))}
              <Link href="/admin/outreach" role="menuitem" onClick={() => setMore(false)} className="flex items-center px-3 min-h-10 rounded-[10px] text-[13px] text-muted-2 hover:bg-surface-2 hover:text-fg">
                Open in Outreach
              </Link>
              <div role="separator" className="h-px bg-border my-1" />
              <button type="button" role="menuitem" onClick={() => (setMore(false), setOv("delete"))} className="w-full text-left px-3 min-h-10 rounded-[10px] bg-transparent border-0 text-[13px] text-danger hover:bg-surface-2 cursor-pointer">
                Delete lead…
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <DevBar>
        <label className="inline-flex items-center gap-2">
          Proposals
          <select value={propMode} onChange={(e) => setPropMode(e.target.value)} className={selectCls}>
            <option value="data">from lead data</option>
            <option value="empty">empty</option>
            <option value="drafted">drafted</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" onChange={(e) => (dev.fail = e.target.checked)} className="accent-[var(--accent)]" />
          Next request fails
        </label>
      </DevBar>

      <div className="grid grid-cols-1 min-[1180px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Panel title="Activity" titleId="act-h">
            <div role="group" aria-label="Filter activity" className="flex flex-wrap gap-1.5 mb-4">
              {["All", "Calls", "Emails", "Notes", "Status"].map((f) => (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={chipBtn(filter === f)}>
                  {f}
                </button>
              ))}
            </div>
            <ol className="list-none p-0 m-0">
              {shown.map((e, i) => (
                <li key={e.id} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 relative pb-4">
                  {i < shown.length - 1 ? <span aria-hidden="true" className="absolute left-4 top-8 bottom-0 w-px bg-border" /> : null}
                  <EventIcon kind={e.kind} />
                  <div className="min-w-0">
                    <div className="text-fg">{e.title}</div>
                    <div className="text-[12px] text-muted-2">{e.meta}</div>
                    {e.body ? <p className="m-0 mt-1.5 text-muted-2 leading-relaxed">{e.body}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
            {!shown.length ? <p className="m-0 text-muted-2 mb-3">Nothing of that kind yet.</p> : null}
            <button type="button" className={btnSecondary} onClick={() => openLog("note")}>
              Add a note
            </button>
          </Panel>

          <Panel
            title={lead.siteCheck ? `Site check · ${lead.siteCheck.url}` : "Site check"}
            titleId="audit-h"
            action={lead.siteCheck ? <span className="text-[12px] text-muted-2">ran {lead.siteCheck.ranAt} by {lead.siteCheck.by} · {lead.siteCheck.items.filter((a) => a.pass).length} of {lead.siteCheck.items.length} passed</span> : null}
          >
            {lead.siteCheck ? (
              <>
                <ul className="list-none p-0 m-0 flex flex-col">
                  {lead.siteCheck.items.map((a) => (
                    <li key={a.label} className="flex items-start gap-3 py-2.5 border-t border-border first:border-t-0">
                      <span aria-hidden="true" className={`w-5 h-5 rounded-full border inline-flex items-center justify-center text-[11px] flex-none ${a.pass ? "border-success text-success" : "border-fg text-fg"}`}>
                        {a.pass ? "✓" : "✕"}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block">
                          {a.label} <span className="sr-only">{a.pass ? "passed" : "failed"}</span>
                        </span>
                        <span className="block text-[12px] text-muted-2">{a.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link href="/check" className={btnSecondary}>
                    Re-run in Check my site ↗
                  </Link>
                  <button type="button" className={btnSecondary} onClick={() => openLog("email")}>
                    Use in an email
                  </button>
                </div>
              </>
            ) : (
              <Empty
                title="No site check yet"
                action={
                  <Link href="/check" className={btnSecondary}>
                    Run Check my site ↗
                  </Link>
                }
              >
                Claude runs it on new leads that give a website. Run it by hand to get findings for the first email.
              </Empty>
            )}
          </Panel>

          <section id="proposals" aria-labelledby="prop-h" className="bg-surface border border-border rounded-admin p-5 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 id="prop-h" className="text-[15px] font-medium m-0">
                Proposals
              </h2>
              <Link href={`/admin/proposals?new=1&lead=${lead.id}`} className="text-[13px] text-accent-light hover:text-fg inline-flex items-center min-h-9">
                Draft proposal ↗
              </Link>
            </div>
            {proposals.length ? (
              <ul className="list-none p-0 m-0 flex flex-col">
                {proposals.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3 border-t border-border first:border-t-0">
                    <div className="min-w-0 flex-1">
                      <Link href="/admin/proposals" className="text-fg hover:underline">
                        {p.title}
                      </Link>
                      <div className="text-[12px] text-muted-2">{p.meta}</div>
                    </div>
                    <Chip tone={p.status === "Accepted" ? "success" : p.status === "Sent" ? "fg" : "muted"}>{p.status}</Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty
                title="No proposals yet"
                action={
                  <Link href={`/admin/proposals?new=1&lead=${lead.id}`} className={btnSecondary}>
                    Draft proposal ↗
                  </Link>
                }
              >
                {estimate ? `Start from the estimator numbers: ${lead.offer} is ${estimate}.` : "Pick an offer in the lead details, then start from its price."}
              </Empty>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4 min-w-0">
          <Panel title="Contact" titleId="contact-h">
            <dl className="m-0 grid grid-cols-[96px_1fr] gap-x-3 gap-y-2.5">
              <dt className="text-muted-2">Name</dt>
              <dd className="m-0">{lead.name} · owner</dd>
              <dt className="text-muted-2">Email</dt>
              <dd className="m-0 break-all">
                <a href={`mailto:${plainEmail(lead.email)}`} className="text-accent-light">
                  {lead.email}
                </a>
              </dd>
              <dt className="text-muted-2">Phone</dt>
              <dd className="m-0">
                <a href="tel:+17045550100" className="text-accent-light">
                  {lead.phone || "—"}
                </a>
              </dd>
              <dt className="text-muted-2">Address</dt>
              <dd className="m-0">{lead.address}</dd>
              <dt className="text-muted-2">Current site</dt>
              <dd className="m-0 break-all">{lead.site}</dd>
              <dt className="text-muted-2">Hours</dt>
              <dd className="m-0">{lead.hours}</dd>
            </dl>
            <div className="flex gap-2 mt-4">
              <a href={`mailto:${plainEmail(lead.email)}`} className={btnSecondary}>
                Email
              </a>
              <a href="tel:+17045550100" className={btnSecondary}>
                Call
              </a>
            </div>
          </Panel>

          <Panel title="Lead details" titleId="details-h">
            <dl className="m-0 grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 items-center">
              <dt className="text-muted-2">Offer</dt>
              <dd className="m-0">
                {lead.offer}
                {lead.offerCode ? ` (${lead.offerCode})` : ""}
              </dd>
              <dt className="text-muted-2">Estimate</dt>
              <dd className="m-0">{estimate ? `${estimate}${offer.monthlyRequired ? " · monthly required" : " · monthly optional"}` : "—"}</dd>
              <dt className="text-muted-2">Source</dt>
              <dd className="m-0">
                {lead.source} · {lead.campaign}
              </dd>
              <dt className="text-muted-2">Received</dt>
              <dd className="m-0 break-all">
                {lead.when} · from {lead.page}
              </dd>
              <dt className="text-muted-2">
                <label htmlFor="ld-owner">Owner</label>
              </dt>
              <dd className="m-0">
                <select id="ld-owner" className={selectCls} value={owner} onChange={(e) => changeOwner(e.target.value)}>
                  {OWNERS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </dd>
            </dl>
            {lead.message ? <p className="m-0 mt-4 text-muted-2 leading-relaxed">Their message: “{lead.message}”</p> : null}
          </Panel>

          <Panel
            title="Next action"
            titleId="next-h"
            action={
              <button type="button" className="bg-transparent border-0 p-0 text-[13px] text-accent-light hover:text-fg cursor-pointer min-h-9" onClick={() => setOv("next")}>
                Change
              </button>
            }
          >
            {next ? (
              <>
                <div className="text-fg">{nextLine(next)}</div>
                <div className="text-[12px] text-muted-2 mb-3">
                  {next.owner}
                  {next.note ? ` · ${next.note}` : ""} · reminder the morning of
                </div>
                <button type="button" className={btnSecondary} onClick={markNextDone}>
                  Mark done
                </button>
              </>
            ) : (
              <>
                <p className="m-0 mb-3 text-muted-2">Nothing scheduled. Leads without a next action show on the dashboard’s tasks list as “needs a plan”.</p>
                <button type="button" className={btnSecondary} onClick={() => setOv("next")}>
                  Set one
                </button>
              </>
            )}
          </Panel>

          <section aria-labelledby="notes-h" className="bg-surface border border-border rounded-admin p-5 min-w-0">
            <h2 id="notes-h" className="text-[15px] font-medium m-0 mb-3">
              <label htmlFor="ld-notes">Internal notes</label>
            </h2>
            <textarea id="ld-notes" rows={4} value={notes} onChange={(e) => onNotes(e.target.value)} placeholder="Only the team sees this" className={`${fieldCls} resize-y`} />
            <p className="m-0 mt-2 text-[12px] text-muted-2" aria-live="polite">
              {noteState}
            </p>
          </section>
        </aside>
      </div>

      <p className="text-[12px] text-muted-2 mt-6 mb-0">
        Reads <code>GET /api/admin/leads/[id]</code> with its activity; every dialog here writes one <code>POST /api/admin/leads/[id]/activities</code> or a <code>PATCH</code>; convert also creates the client on the back end.
      </p>

      {ov === "log" ? (
        <LogDialog
          lead={lead}
          owner={owner}
          startKind={logKind}
          onClose={close}
          onSaved={(ev, nextAction) => {
            addEvent(ev);
            if (nextAction) setNext(nextAction);
            close();
            showToast(ev.kind === "note" ? "Note added" : ev.kind === "call" ? "Call logged" : "Email logged");
          }}
        />
      ) : null}
      {ov === "status" ? (
        <StatusDialog
          current={status}
          onClose={close}
          onSave={async (pick, extra) => {
            if (pick === "Signed") return setOv("convert");
            const res = await patch({ status: pick, ...extra });
            if (!res.ok) return false;
            addEvent({ id: `st_${pick}_${events.length}`, kind: "status", title: `Status · ${status} → ${pick}`, meta: "just now · Chris", body: extra.lostReason ? `Reason: ${extra.lostReason}.${extra.lostNote ? ` ${extra.lostNote}` : ""}` : "" });
            setStatus(pick);
            close();
            showToast(`Status set to ${pick}`);
            return true;
          }}
        />
      ) : null}
      {ov === "next" ? (
        <NextDialog
          initial={next}
          owner={owner}
          onClose={close}
          onSave={async (n) => {
            const res = await patch({ nextAction: { ...n, remind: true } });
            if (!res.ok) return false;
            setNext(n);
            close();
            showToast(`Next action set · ${nextLine(n)}`);
            return true;
          }}
        />
      ) : null}
      {ov === "convert" ? (
        <ConvertDialog
          lead={lead}
          offer={offer}
          onClose={close}
          onConvert={async (opts) => {
            const res = await patch({ convert: opts });
            if (!res.ok) return false;
            setStatus("Signed");
            close();
            showToast(`${lead.business} is now a client`);
            setTimeout(() => router.push(`/admin/clients/${res.data.clientId}`), 700);
            return true;
          }}
        />
      ) : null}
      {ov === "delete" ? (
        <DeleteDialog
          lead={lead}
          count={events.length}
          onClose={close}
          onDelete={async () => {
            const res = await api("DELETE", `/api/admin/leads/${lead.id}`);
            if (!res.ok) return false;
            close();
            showToast("Lead deleted");
            setTimeout(() => router.push("/admin/leads"), 700);
            return true;
          }}
        />
      ) : null}

      <Toast toast={toast} />
    </>
  );
}

// ---------- dialogs ----------
const LOGT = {
  call: ["Log a call", "What was said", "Who you spoke to, what they asked, what you promised", "Save call"],
  email: ["Log an email", "Summary", "What the email covered; paste the key lines", "Save email"],
  note: ["Add a note", "Note", "Anything the team should know", "Save note"],
};

function LogDialog({ lead, owner, startKind, onClose, onSaved }) {
  const [kind, setKind] = useState(startKind);
  const [outcome, setOutcome] = useState("Answered");
  const [minutes, setMinutes] = useState("8");
  const [direction, setDirection] = useState("Sent");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [when, setWhen] = useState(nowLocal);
  const [also, setAlso] = useState(false);
  const [nt, setNt] = useState(() => ({ type: "Call back", date: plusDays(3), owner }));
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState("idle");
  const [t, bodyLabel, placeholder, saveLabel] = LOGT[kind];

  const save = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (kind === "note" && !body.trim()) errs.body = "Write the note";
    if (kind === "email" && !subject.trim() && !body.trim()) errs.subject = "Add a subject or a summary";
    if (kind === "call" && minutes && !/^\d+$/.test(minutes)) errs.minutes = "Use whole minutes";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setPhase("submitting");
    const res = await api("POST", `/api/admin/leads/${lead.id}/activities`, { kind, body, at: when, outcome, minutes: minutes ? Number(minutes) : undefined, direction, subject, nextAction: also ? nt : undefined });
    if (!res.ok) {
      setPhase(res.status === 422 ? "idle" : "failed");
      if (res.status === 422) setErrors(res.data?.fields || {});
      return;
    }
    const a = res.data.activity;
    onSaved({ id: a.id, kind: a.kind, title: a.title, meta: a.meta, body: a.body }, also ? { type: nt.type, date: nt.date, time: "09:00", owner: nt.owner, note: "" } : null);
  };
  const busy = phase === "submitting";
  return (
    <Dialog
      eyebrow={lead.business}
      title={t}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={save} disabled={busy}>
            {busy ? "Saving…" : saveLabel}
          </button>
        </>
      }
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        {phase === "failed" ? <Alert>We couldn’t save that. Nothing was logged. Try again.</Alert> : null}
        <div role="group" aria-label="Kind" className="flex gap-1.5">
          {[
            ["call", "Call"],
            ["email", "Email"],
            ["note", "Note"],
          ].map(([k, l]) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => (setKind(k), setErrors({}))} className={chipBtn(kind === k)}>
              {l}
            </button>
          ))}
        </div>
        {kind === "call" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Row id="lg-outcome" label="Outcome">
              <select id="lg-outcome" className={fieldCls} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                {["Answered", "Voicemail", "No answer", "Wrong number", "Call back requested"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Row>
            <Row id="lg-dur" label="Length (min)" error={errors.minutes}>
              <input id="lg-dur" className={fieldCls} type="text" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-invalid={errors.minutes ? true : undefined} />
            </Row>
          </div>
        ) : null}
        {kind === "email" ? (
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4">
            <Row id="lg-dir" label="Direction">
              <select id="lg-dir" className={fieldCls} value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option>Sent</option>
                <option>Received</option>
              </select>
            </Row>
            <Row id="lg-subj" label="Subject" error={errors.subject}>
              <input id="lg-subj" className={fieldCls} type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Re: your booking page" aria-invalid={errors.subject ? true : undefined} />
            </Row>
          </div>
        ) : null}
        <Row id="lg-body" label={bodyLabel} required={kind === "note"} error={errors.body}>
          <textarea id="lg-body" rows={4} className={`${fieldCls} resize-y`} value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} aria-invalid={errors.body ? true : undefined} />
        </Row>
        <Row id="lg-when" label="When">
          <input id="lg-when" className={fieldCls} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </Row>
        <label className="flex items-center gap-2.5 text-muted-2 cursor-pointer min-h-9">
          <input type="checkbox" checked={also} onChange={(e) => setAlso(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
          Also set the next action
        </label>
        {also ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Row id="lg-nt" label="Type">
              <select id="lg-nt" className={fieldCls} value={nt.type} onChange={(e) => setNt({ ...nt, type: e.target.value })}>
                {["Call back", "Send email", "Demo", "Follow up"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Row>
            <Row id="lg-nd" label="Date">
              <input id="lg-nd" className={fieldCls} type="date" value={nt.date} onChange={(e) => setNt({ ...nt, date: e.target.value })} />
            </Row>
            <Row id="lg-no" label="Owner">
              <select id="lg-no" className={fieldCls} value={nt.owner} onChange={(e) => setNt({ ...nt, owner: e.target.value })}>
                {OWNERS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Row>
          </div>
        ) : null}
      </form>
    </Dialog>
  );
}

const LOST_REASONS = ["Price", "Timing — not now", "Went with someone else", "No response after 3 touches", "Not a fit for what we build"];

function StatusDialog({ current, onClose, onSave }) {
  const [pick, setPick] = useState(current);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [recheck, setRecheck] = useState(true);
  const [err, setErr] = useState("");
  const [phase, setPhase] = useState("idle");
  const save = async () => {
    if (pick === "Lost" && !reason) return setErr("Pick why we lost it");
    setErr("");
    setPhase("submitting");
    const ok = await onSave(pick, pick === "Lost" ? { lostReason: reason, lostNote: note, recheckIn90Days: recheck } : {});
    if (ok === false) setPhase("failed");
  };
  const busy = phase === "submitting";
  return (
    <Dialog
      eyebrow="Status"
      title="Change status"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Update status"}
          </button>
        </>
      }
    >
      {phase === "failed" ? <Alert>We couldn’t change the status. Nothing was changed. Try again.</Alert> : null}
      <div role="radiogroup" aria-label="Status" className="flex flex-col gap-2">
        {LEAD_STATUSES.map((s) => (
          <label key={s} className={`flex items-start gap-3 border rounded-admin px-4 py-3 cursor-pointer ${pick === s ? "border-fg bg-surface-2" : "border-border-2"}`}>
            <input type="radio" name="st" checked={pick === s} onChange={() => setPick(s)} className="mt-0.5 accent-[var(--accent)]" />
            <span>
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                {s}
              </span>
              <span className="block text-[12px] text-muted-2">{STATUS_HELP[s]}</span>
            </span>
          </label>
        ))}
      </div>
      {pick === "Lost" ? (
        <>
          <Row id="st-reason" label="Why did we lose it?" required error={err}>
            <select id="st-reason" className={fieldCls} value={reason} onChange={(e) => (setReason(e.target.value), setErr(""))} aria-invalid={err ? true : undefined}>
              <option value="">Pick a reason</option>
              {LOST_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Row>
          <Row id="st-note" label="What they said">
            <textarea id="st-note" rows={2} className={`${fieldCls} resize-y`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="One line helps the next pitch" />
          </Row>
          <label className="flex items-center gap-2.5 text-muted-2 cursor-pointer min-h-9">
            <input type="checkbox" checked={recheck} onChange={(e) => setRecheck(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
            Ask Claude to check back in 90 days
          </label>
        </>
      ) : null}
      {pick === "Signed" ? (
        <p className="m-0 text-muted-2">
          Signed leads become clients. “Update status” will open <strong className="text-fg">Convert to client</strong> so the deposit invoice and portal invite get set up.
        </p>
      ) : null}
    </Dialog>
  );
}

function NextDialog({ initial, owner, onClose, onSave }) {
  const [n, setN] = useState(() => initial || { type: "Call back", date: plusDays(1), time: "10:00", owner, note: "" });
  const [remind, setRemind] = useState(true);
  const [err, setErr] = useState("");
  const [phase, setPhase] = useState("idle");
  const set = (k) => (e) => setN((s) => ({ ...s, [k]: e.target.value }));
  const save = async (e) => {
    e?.preventDefault();
    if (!n.date) return setErr("Pick a date");
    setErr("");
    setPhase("submitting");
    const ok = await onSave({ ...n, remind });
    if (ok === false) setPhase("failed");
  };
  const busy = phase === "submitting";
  return (
    <Dialog
      eyebrow="Next action"
      title="Set the next action"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Set next action"}
          </button>
        </>
      }
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        {phase === "failed" ? <Alert>We couldn’t save the next action. Nothing was changed. Try again.</Alert> : null}
        <Row id="nx-type" label="What">
          <select id="nx-type" className={fieldCls} value={n.type} onChange={set("type")}>
            {NEXT_TYPES.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Row>
        <div className="grid grid-cols-2 gap-4">
          <Row id="nx-date" label="Date" error={err}>
            <input id="nx-date" className={fieldCls} type="date" value={n.date} onChange={set("date")} aria-invalid={err ? true : undefined} />
          </Row>
          <Row id="nx-time" label="Time">
            <input id="nx-time" className={fieldCls} type="time" value={n.time} onChange={set("time")} />
          </Row>
        </div>
        <Row id="nx-owner" label="Who">
          <select id="nx-owner" className={fieldCls} value={n.owner} onChange={set("owner")}>
            {OWNERS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Row>
        <Row id="nx-note" label="Note">
          <input id="nx-note" className={fieldCls} type="text" value={n.note} onChange={set("note")} placeholder="Bring the barbershop demo on the tablet" />
        </Row>
        <label className="flex items-center gap-2.5 text-muted-2 cursor-pointer min-h-9">
          <input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
          Remind me the morning of
        </label>
      </form>
    </Dialog>
  );
}

function ConvertDialog({ lead, offer, onClose, onConvert }) {
  const required = !!offer?.monthlyRequired;
  const [monthly, setMonthly] = useState(true);
  const [deposit, setDeposit] = useState(true);
  const [invite, setInvite] = useState(true);
  const [phase, setPhase] = useState("idle");
  const dep = offer ? (offer.setup * MILESTONES[0].percent) / 100 : null;
  const go = async () => {
    setPhase("submitting");
    const ok = await onConvert({ monthly: required || monthly, sendDeposit: deposit, invitePortal: invite });
    if (ok === false) setPhase("failed");
  };
  const busy = phase === "submitting";
  return (
    <Dialog
      eyebrow="Convert to client"
      title={`Make ${lead.business} a client?`}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={go} disabled={busy}>
            {busy ? "Converting…" : "Convert and open client"}
          </button>
        </>
      }
    >
      {phase === "failed" ? <Alert>We couldn’t create the client. Nothing was changed. Try again.</Alert> : null}
      <p className="m-0 text-muted-2 leading-relaxed">
        This creates the client record with {lead.name} as the main contact, marks the lead <strong className="text-fg">Signed</strong>, and opens the client page. The lead stays here read-only.
      </p>
      <dl className="m-0 grid grid-cols-2 gap-3 border border-border rounded-admin p-4">
        <div>
          <dt className="text-[12px] text-muted-2">Offer</dt>
          <dd className="m-0">
            {lead.offer}
            {lead.offerCode ? ` (${lead.offerCode})` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] text-muted-2">Build</dt>
          <dd className="m-0">{offer ? `${setupLabel(offer)} · ${MILESTONES.map((m) => m.percent).join(" / ")}` : "Set from the proposal"}</dd>
        </div>
      </dl>
      {offer ? (
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={required || monthly} disabled={required} onChange={(e) => setMonthly(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[var(--accent)]" />
          <span>
            Include the monthly plan · {money(offer.monthly)}/mo{offer.usage ? " + usage" : ""}
            <span className="block text-[12px] text-muted-2">
              {required ? "Required for restaurants: ordering, menu updates and support run on our platform." : "Hosting, the Klyvora admin and support. Optional; they can take the code and skip it. It starts at launch."}
            </span>
          </span>
        </label>
      ) : null}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={deposit} onChange={(e) => setDeposit(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[var(--accent)]" />
        <span>
          Send the deposit invoice now{dep ? ` · $${dep.toLocaleString("en-US", { minimumFractionDigits: dep % 1 ? 2 : 0 })}` : ""}
          <span className="block text-[12px] text-muted-2">
            {MILESTONES[0].percent}% to start. Goes to {lead.email} from Invoices.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[var(--accent)]" />
        <span>
          Invite {lead.name} to the portal
          <span className="block text-[12px] text-muted-2">Magic-link email; they see the project, invoices and support.</span>
        </span>
      </label>
      <p className="m-0 text-[12px] text-muted-2">Totals come from the offer catalog; the proposal, if one was sent, wins over these defaults.</p>
    </Dialog>
  );
}

function DeleteDialog({ lead, count, onClose, onDelete }) {
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState("idle");
  const ok = typed.trim() === lead.business;
  const go = async () => {
    setPhase("submitting");
    const r = await onDelete();
    if (r === false) setPhase("failed");
  };
  const busy = phase === "submitting";
  return (
    <Dialog
      role="alertdialog"
      describedBy="dl-p"
      title="Delete this lead?"
      size="sm"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={`${btnDanger} disabled:opacity-45`} disabled={!ok || busy} onClick={go}>
            {busy ? "Deleting…" : "Delete lead"}
          </button>
        </>
      }
    >
      {phase === "failed" ? <Alert>We couldn’t delete the lead. Nothing was removed. Try again.</Alert> : null}
      <p id="dl-p" className="m-0 text-muted-2 leading-relaxed">
        Removes <strong className="text-fg">{lead.business}</strong>, its {count} activity entries and notes. Proposals already sent stay in Proposals. This can’t be undone.
      </p>
      <Row id="dl-confirm" label="Type the business name to confirm">
        <input id="dl-confirm" className={fieldCls} type="text" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={lead.business} autoComplete="off" />
      </Row>
    </Dialog>
  );
}
