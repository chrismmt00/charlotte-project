"use client";

import { useState } from "react";
import { Dialog, Row, Alert, fieldCls, chipBtn } from "@/components/admin/leads/Overlay";
import { api } from "@/components/admin/leads/api";
import { btnPrimary, btnSecondary } from "@/components/admin/ui";
import { OUTREACH_OWNERS, PARTNER_TYPES } from "@/lib/admin/sample-outreach";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pad = (n) => String(n).padStart(2, "0");
const nowLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const FROM_OPTIONS = ["Chris · [Chris email]", "Geoffrey · [Geoffrey email]"];
const TWEAKS = ["Shorter", "Warmer", "Add the site-check findings", "Mention the price less"];

// Email editor. A person approves: nothing is sent until "Approve and send".
// Save draft -> POST approvals/[id] { action: "edit" }; Approve and send -> { action: "approve" }.
export function EmailEditor({ item, draft, onClose, onSave, onApprove, onTweak }) {
  const [v, setV] = useState(() => ({ to: item.to.replace(/[[\]]/g, ""), from: FROM_OPTIONS[0], subject: item.subject, body: item.body, attach: item.attach, followUp: "Claude drafts a follow-up in 3 days", ...draft }));
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState("idle"); // idle | saving | sending | failed
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const run = async (kind) => {
    const errs = {};
    if (!EMAIL.test(v.to.trim())) errs.to = "Enter a valid email address";
    if (!v.subject.trim()) errs.subject = "Add a subject";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setPhase(kind === "send" ? "sending" : "saving");
    const ok = await (kind === "send" ? onApprove(v) : onSave(v));
    if (ok === false) setPhase("failed");
  };
  const busy = phase === "saving" || phase === "sending";
  return (
    <Dialog
      eyebrow={`Drafted by Claude · ${item.when}`}
      title={`Edit the email to ${item.business}`}
      size="lg"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnSecondary} onClick={() => run("save")} disabled={busy}>
            {phase === "saving" ? "Saving…" : "Save draft"}
          </button>
          <button type="button" className={btnPrimary} onClick={() => run("send")} disabled={busy}>
            {phase === "sending" ? "Sending…" : "Approve and send"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {phase === "failed" ? <Alert>That didn’t go through, and nothing was sent. Check the connection and try again.</Alert> : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Row id="ed-to" label="To" error={errors.to}>
            <input id="ed-to" className={fieldCls} type="email" value={v.to} onChange={set("to")} aria-invalid={errors.to ? true : undefined} aria-describedby={errors.to ? "ed-to-err" : undefined} />
          </Row>
          <Row id="ed-from" label="From">
            <select id="ed-from" className={fieldCls} value={v.from} onChange={set("from")}>
              {FROM_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Row>
        </div>
        <Row id="ed-subj" label="Subject" error={errors.subject}>
          <input id="ed-subj" className={fieldCls} type="text" value={v.subject} onChange={set("subject")} aria-invalid={errors.subject ? true : undefined} aria-describedby={errors.subject ? "ed-subj-err" : undefined} />
        </Row>
        <Row id="ed-body" label="Body">
          <textarea id="ed-body" rows={9} className={`${fieldCls} resize-y leading-relaxed`} value={v.body} onChange={set("body")} />
        </Row>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-2">Ask Claude:</span>
          {TWEAKS.map((t) => (
            <button key={t} type="button" onClick={() => onTweak(t)} className={chipBtn(false)}>
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Row id="ed-attach" label="Attach">
            <select id="ed-attach" className={fieldCls} value={v.attach} onChange={set("attach")}>
              {[...new Set([item.attach, "Nothing", "Link to Check my site", "Pricing one-pager (PDF)"])].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Row>
          <Row id="ed-follow" label="If no reply">
            <select id="ed-follow" className={fieldCls} value={v.followUp} onChange={set("followUp")}>
              <option>Claude drafts a follow-up in 3 days</option>
              <option>Claude drafts a follow-up in 7 days</option>
              <option>No follow-up</option>
            </select>
          </Row>
        </div>
        <p className="m-0 text-[12px] text-muted-2">The footer with the Charlotte address and an unsubscribe link is added on send. It sends from your mailbox, so replies come to you.</p>
      </div>
    </Dialog>
  );
}

// Assign or hand off a demo. PATCH /api/admin/outreach/prospects/[id] { demo: { builder, notifyProspect } }
export function HandoffDialog({ prospect, builder, onClose, onConfirm }) {
  const [notify, setNotify] = useState(true);
  const [phase, setPhase] = useState("idle");
  const claude = builder === "Claude";
  const go = async () => {
    setPhase("submitting");
    const ok = await onConfirm(notify);
    if (ok === false) setPhase("failed");
  };
  const busy = phase === "submitting";
  return (
    <Dialog
      role="alertdialog"
      describedBy="ho-p"
      size="sm"
      title={claude ? `Assign the ${prospect.business} demo to Claude Cowork?` : `Hand the ${prospect.business} demo to ${builder}?`}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={go} disabled={busy}>
            {busy ? "Assigning…" : claude ? "Assign to Claude" : `Hand off to ${builder}`}
          </button>
        </>
      }
    >
      {phase === "failed" ? <Alert>We couldn’t assign it. Nothing was changed. Try again.</Alert> : null}
      <p id="ho-p" className="m-0 text-muted-2 leading-relaxed">
        {claude ? "Claude builds a one-page demo from what it found. It lands in the approval queue; nothing goes to the prospect until you approve it." : `${builder} becomes the owner and builds the demo by hand. They send it when it is ready and log it here.`}
      </p>
      <ul className="m-0 pl-5 flex flex-col gap-1">
        <li>
          Offer: <strong>{prospect.offer}</strong>
        </li>
        <li>Source material: Google Maps listing, Instagram posts, reviews</li>
        <li>
          Due: <strong>{claude ? "tomorrow 8:00 (next run)" : "Friday"}</strong>
        </li>
      </ul>
      <label className="flex items-center gap-2.5 text-muted-2 cursor-pointer min-h-9">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
        Tell the prospect a demo is coming (Claude drafts the note; you approve it)
      </label>
    </Dialog>
  );
}

const KINDS = ["Call", "Visit", "Text / DM", "Email", "Event"];
const OUTCOMES = ["Spoke to the owner", "Spoke to staff, left a card", "Voicemail / no answer", "Interested — wants a demo", "Interested — wants a call", "Not interested"];

// Log outreach done by a person. POST /api/admin/outreach/activities
export function LogDialog({ prospects, startId, startKind = "Call", callId, onClose, onSaved }) {
  const [id, setId] = useState(startId || prospects[0].id);
  const [kind, setKind] = useState(startKind);
  const [biz, setBiz] = useState("");
  const [type, setType] = useState("Barbershop");
  const [outcome, setOutcome] = useState(OUTCOMES[0]);
  const [when, setWhen] = useState(nowLocal);
  const [notes, setNotes] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [counts, setCounts] = useState(true);
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState("idle");
  const isNew = id === "new";

  const save = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (isNew && !biz.trim()) errs.business = "Enter the business name";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setPhase("submitting");
    const res = await api("POST", "/api/admin/outreach/activities", { prospectId: isNew ? null : id, newProspect: isNew ? { business: biz.trim(), type } : undefined, kind, outcome, at: when, notes, next: nextStep, countsTowardWeek: counts, callId });
    if (!res.ok) {
      setPhase(res.status === 422 ? "idle" : "failed");
      if (res.status === 422) setErrors(res.data?.fields || {});
      return;
    }
    onSaved({ prospectId: isNew ? null : id, business: biz.trim(), type, kind, nextStep, counts, activity: res.data.activity });
  };
  const busy = phase === "submitting";
  return (
    <Dialog
      eyebrow="Outreach by a person"
      title="Log outreach"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        {phase === "failed" ? <Alert>We couldn’t save that. Nothing was logged. Try again.</Alert> : null}
        <Row id="lo-who" label="Prospect">
          <select id="lo-who" className={fieldCls} value={id} onChange={(e) => setId(e.target.value)}>
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.business} · {p.phase}
              </option>
            ))}
            <option value="new">Someone new (not in the list)…</option>
          </select>
        </Row>
        {isNew ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Row id="lo-biz" label="Business" required error={errors.business}>
              <input id="lo-biz" className={fieldCls} type="text" value={biz} onChange={(e) => setBiz(e.target.value)} placeholder="Shop name" aria-invalid={errors.business ? true : undefined} aria-describedby={errors.business ? "lo-biz-err" : undefined} />
            </Row>
            <Row id="lo-type" label="Type">
              <select id="lo-type" className={fieldCls} value={type} onChange={(e) => setType(e.target.value)}>
                {["Barbershop", "Salon", "Restaurant", "Auto detailing", "Retail", "Other"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Row>
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] text-muted-2" id="lo-kind-l">
            What you did
          </span>
          <div role="radiogroup" aria-labelledby="lo-kind-l" className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={chipBtn(kind === k)}>
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Row id="lo-out" label="Outcome">
            <select id="lo-out" className={fieldCls} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              {OUTCOMES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Row>
          <Row id="lo-when" label="When">
            <input id="lo-when" className={fieldCls} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </Row>
        </div>
        <Row id="lo-note" label="Notes">
          <textarea id="lo-note" rows={3} className={`${fieldCls} resize-y`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What they said, what you promised" />
        </Row>
        <Row id="lo-next" label="Next step">
          <input id="lo-next" className={fieldCls} type="text" value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="Send the demo link Friday" />
        </Row>
        <label className="flex items-center gap-2.5 text-muted-2 cursor-pointer min-h-9">
          <input type="checkbox" checked={counts} onChange={(e) => setCounts(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
          Count toward this week’s contacts
        </label>
      </form>
    </Dialog>
  );
}

// Add a referral partner. POST /api/admin/outreach/partners { name, type, owner }
export function PartnerDialog({ onClose, onSaved }) {
  const [name, setName] = useState("");
  const [type, setType] = useState(PARTNER_TYPES[0]);
  const [owner, setOwner] = useState("Chris");
  const [err, setErr] = useState("");
  const [phase, setPhase] = useState("idle");
  const save = async (e) => {
    e?.preventDefault();
    if (!name.trim()) return setErr("Enter the partner’s name");
    setErr("");
    setPhase("submitting");
    const res = await api("POST", "/api/admin/outreach/partners", { name: name.trim(), type, owner });
    if (!res.ok) return setPhase(res.status === 422 ? "idle" : "failed");
    onSaved(res.data.partner);
  };
  const busy = phase === "submitting";
  return (
    <Dialog
      eyebrow="Referral partners"
      title="Add partner"
      size="sm"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Add partner"}
          </button>
        </>
      }
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        {phase === "failed" ? <Alert>We couldn’t add the partner. Try again.</Alert> : null}
        <Row id="pt-name" label="Name" required error={err}>
          <input id="pt-name" className={fieldCls} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Print shop on Central" aria-invalid={err ? true : undefined} aria-describedby={err ? "pt-name-err" : undefined} />
        </Row>
        <div className="grid grid-cols-2 gap-4">
          <Row id="pt-type" label="Type">
            <select id="pt-type" className={fieldCls} value={type} onChange={(e) => setType(e.target.value)}>
              {PARTNER_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Row>
          <Row id="pt-owner" label="Owner">
            <select id="pt-owner" className={fieldCls} value={owner} onChange={(e) => setOwner(e.target.value)}>
              {OUTREACH_OWNERS.filter((o) => o !== "Claude").map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Row>
        </div>
      </form>
    </Dialog>
  );
}
