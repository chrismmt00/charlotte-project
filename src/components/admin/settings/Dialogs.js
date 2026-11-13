"use client";

import { useState } from "react";
import Dialog from "./Dialog";
import { TextField } from "./parts";
import { btnPrimary, btnSecondary, btnDanger } from "@/components/admin/ui";
import { PREVIEW_VARS } from "@/lib/admin/sample-settings";

// Every dialog here calls a stub route, shows its own submitting and failed states, and hands the
// result to the screen, which shows the toast.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function send(url, method, body) {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

function Spinner() {
  return <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full border-2 border-current border-r-transparent animate-spin motion-reduce:animate-none" />;
}

function SubmitButton({ busy, busyLabel, children, className = btnPrimary, ...rest }) {
  return (
    <button type="button" className={className} aria-busy={busy} disabled={busy || rest.disabled} {...rest}>
      {busy ? (
        <>
          <Spinner />
          {busyLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function FailedLine({ children }) {
  return (
    <div role="alert" className="flex gap-2.5 items-start p-3 rounded-[12px] border border-danger bg-danger/10 text-[13px]">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-danger flex-none mt-0.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      {children}
    </div>
  );
}

export const ROLE_COPY = {
  Owner: "Everything, including Settings, the catalog and billing. Usually one person.",
  Builder: "Leads, outreach approvals, clients, projects, tickets. No Settings edits.",
};

function RolePicker({ value, onChange, disabled, name }) {
  return (
    <fieldset className="border-0 p-0 m-0 flex flex-col gap-2" disabled={disabled}>
      <legend className="text-[12px] text-muted-2 mb-2">Role</legend>
      {Object.keys(ROLE_COPY).map((r) => (
        <label key={r} className={`flex items-start gap-3 px-3.5 py-3 rounded-[12px] border cursor-pointer ${value === r ? "border-fg" : "border-border-2"}`}>
          <input type="radio" name={name} value={r} checked={value === r} onChange={() => onChange(r)} className="mt-0.5 w-4 h-4 accent-[var(--accent)]" />
          <span className="flex flex-col gap-0.5">
            <span className="text-[13px] font-medium">{r}</span>
            <span className="text-[12px] text-muted">{ROLE_COPY[r]}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function InviteDialog({ initialEmail = "", onClose, onDone }) {
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] = useState("Builder");
  const [bad, setBad] = useState(Boolean(initialEmail) && !EMAIL_RE.test(initialEmail));
  const [failed, setFailed] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!EMAIL_RE.test(email.trim())) {
      setBad(true);
      return;
    }
    setBusy(true);
    setFailed("");
    const r = await send("/api/admin/settings/team", "POST", { action: "invite", email: email.trim(), role });
    setBusy(false);
    if (r.ok) onDone(r.data.member);
    else if (r.status === 400) setBad(true);
    else setFailed("The invite didn’t go out. Check your connection and try again.");
  }

  return (
    <Dialog
      eyebrow="Team"
      title="Invite a teammate"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <SubmitButton busy={busy} busyLabel="Sending…" onClick={submit}>
            Send invite
          </SubmitButton>
        </>
      }
    >
      {failed ? <FailedLine>{failed}</FailedLine> : null}
      <TextField
        id="inv-email"
        label="Work email"
        type="email"
        value={email}
        onChange={(v) => {
          setEmail(v);
          setBad(false);
        }}
        placeholder="name@klyvora.ai"
        error={bad ? "Enter a work email like name@klyvora.ai." : ""}
        disabled={busy}
        data-autofocus
      />
      <RolePicker value={role} onChange={setRole} disabled={busy} name="invite-role" />
      <p className="m-0 text-[12px] text-muted leading-normal">
        They get an invite link that works for 7 days. Claude is not invited; it has the Agent role through an API key (Rotate key on the team list).
      </p>
    </Dialog>
  );
}

export function RoleDialog({ member, owners, onClose, onDone }) {
  const [role, setRole] = useState(member.role);
  const [failed, setFailed] = useState("");
  const [busy, setBusy] = useState(false);
  const lastOwner = member.role === "Owner" && owners === 1 && role !== "Owner";

  async function submit() {
    setBusy(true);
    setFailed("");
    const r = await send("/api/admin/settings/team", "POST", { action: "role", id: member.id, role });
    setBusy(false);
    if (r.ok) onDone(role);
    else setFailed("The role didn’t save. Try again.");
  }

  return (
    <Dialog
      eyebrow={member.name}
      title="Change role"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <SubmitButton busy={busy} busyLabel="Saving…" onClick={submit} disabled={lastOwner || role === member.role}>
            Save role
          </SubmitButton>
        </>
      }
    >
      {failed ? <FailedLine>{failed}</FailedLine> : null}
      <RolePicker value={role} onChange={setRole} disabled={busy} name="change-role" />
      {lastOwner ? (
        <p role="note" className="m-0 text-[13px] text-warning">
          This is the only owner. Make someone else an owner first.
        </p>
      ) : null}
    </Dialog>
  );
}

export function RemoveDialog({ member, others, onClose, onDone }) {
  const [to, setTo] = useState(others[0]?.id || "");
  const [failed, setFailed] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setFailed("");
    const r = await send("/api/admin/settings/team", "POST", { action: "remove", id: member.id, reassignTo: to });
    setBusy(false);
    if (r.ok) onDone(others.find((o) => o.id === to));
    else setFailed("They weren’t removed. Try again.");
  }

  return (
    <Dialog
      eyebrow="Team"
      title={`Remove ${member.name}?`}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy} data-autofocus>
            Cancel
          </button>
          <SubmitButton className={btnDanger} busy={busy} busyLabel="Removing…" onClick={submit}>
            Remove from team
          </SubmitButton>
        </>
      }
    >
      {failed ? <FailedLine>{failed}</FailedLine> : null}
      <p className="m-0 text-muted-2 leading-normal">
        They lose access the moment you confirm. Their leads, notes and time logs stay, labelled with their name. Open items assigned to them move to:
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rm-to" className="text-[12px] text-muted-2">
          Reassign open work to
        </label>
        <select
          id="rm-to"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          disabled={busy}
          className="min-h-10 rounded-[12px] border border-border-2 bg-surface-2 text-fg px-3 text-[13px] font-[inherit]"
        >
          {others.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
    </Dialog>
  );
}

export function KeyDialog({ onClose, onDone }) {
  const [failed, setFailed] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    setFailed("");
    const r = await send("/api/admin/settings/team", "POST", { action: "rotate-key" });
    setBusy(false);
    if (r.ok) onDone();
    else setFailed("The key wasn’t rotated. The current one still works.");
  }
  return (
    <Dialog
      eyebrow="Claude"
      title="Rotate the agent key?"
      size="sm"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy} data-autofocus>
            Cancel
          </button>
          <SubmitButton className={btnDanger} busy={busy} busyLabel="Rotating…" onClick={submit}>
            Rotate key
          </SubmitButton>
        </>
      }
    >
      {failed ? <FailedLine>{failed}</FailedLine> : null}
      <p className="m-0 text-muted-2 leading-normal">
        The current key stops working at once. Tomorrow&rsquo;s run fails until the new key is set in Claude&rsquo;s environment. The new key is shown once, in that setup, never in this screen.
      </p>
    </Dialog>
  );
}

export function PriceDialog({ offer, onClose, onDone, initialNoteError = false }) {
  const [setup, setSetup] = useState(String(offer.setup));
  const [monthly, setMonthly] = useState(String(offer.monthly));
  const [note, setNote] = useState("");
  const [noteBad, setNoteBad] = useState(initialNoteError);
  const [serverErr, setServerErr] = useState({});
  const [failed, setFailed] = useState("");
  const [busy, setBusy] = useState(false);

  const whole = (v) => /^\s*\$?[\d,]+\s*$/.test(String(v));
  const setupBad = !whole(setup) || serverErr.setup;
  const monthlyBad = !whole(monthly) || serverErr.monthly;
  const bad = "Whole dollars, 0 or more.";

  async function submit() {
    if (!note.trim()) {
      setNoteBad(true);
      document.getElementById("pr-note")?.focus();
      return;
    }
    if (!whole(setup) || !whole(monthly)) return;
    setBusy(true);
    setFailed("");
    const r = await send(`/api/admin/settings/catalog/${offer.code}`, "PATCH", { setup, monthly, note: note.trim() });
    setBusy(false);
    if (r.ok) onDone(r.data);
    else if (r.status === 400 && r.data?.error?.fields) {
      setServerErr(r.data.error.fields);
      if (r.data.error.fields.note) setNoteBad(true);
    } else setFailed("The price didn’t save. Try again.");
  }

  return (
    <Dialog
      eyebrow={`Offer catalog · ${offer.code}`}
      title={`Edit ${offer.name}`}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <SubmitButton busy={busy} busyLabel="Saving…" onClick={submit}>
            Save price
          </SubmitButton>
        </>
      }
    >
      {failed ? <FailedLine>{failed}</FailedLine> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <TextField
          id="pr-setup"
          label="Setup price ($)"
          inputMode="numeric"
          value={setup}
          onChange={(v) => {
            setSetup(v);
            setServerErr((e) => ({ ...e, setup: "" }));
          }}
          error={setupBad ? bad : ""}
          disabled={busy}
          data-autofocus
        />
        <TextField
          id="pr-monthly"
          label="Monthly price ($)"
          inputMode="numeric"
          value={monthly}
          onChange={(v) => {
            setMonthly(v);
            setServerErr((e) => ({ ...e, monthly: "" }));
          }}
          error={monthlyBad ? bad : ""}
          disabled={busy}
        />
      </div>
      <label className="flex items-start gap-2.5 px-3.5 py-3 rounded-[12px] border border-border-2">
        <input type="checkbox" checked={offer.monthlyRequired} disabled readOnly className="mt-0.5 accent-[var(--accent)]" />
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">Monthly plan is required</span>
          <span className="text-[12px] text-muted">
            {offer.monthlyRequired
              ? "On for the restaurant offers only, because ordering needs hosting, payments and support to keep running. A founder decision, not a Settings edit."
              : "Off for every offer except the restaurant ones. Clients who skip the optional plan still own the site and the code."}
          </span>
        </span>
      </label>
      <TextField
        id="pr-note"
        label="Why the change (audit note)"
        required
        textarea
        rows={2}
        value={note}
        onChange={(v) => {
          setNote(v);
          setNoteBad(false);
        }}
        placeholder="Founding clients keep the old price; new proposals use this one from today."
        error={noteBad ? "A note is required; it shows in the price history." : ""}
        disabled={busy}
      />
      <div className="flex flex-col gap-1.5 px-3.5 py-3 rounded-[12px] bg-surface-2 border border-border">
        <span className="text-[12px] text-muted-2">What this changes</span>
        <ul className="m-0 pl-4 list-disc text-muted-2 leading-relaxed">
          <li>New proposals, the public Pricing page and the estimator from the moment you save</li>
          <li>Signed proposals and running plans keep their price</li>
          <li>Logged to the price history with your name and the note</li>
        </ul>
      </div>
    </Dialog>
  );
}

const VAR_BUTTONS = { email: ["business", "first_name", "sender_name", "demo_link", "proposal_link"], proposal: ["business", "pages", "offer", "sender_name"] };

function fill(text) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => PREVIEW_VARS[k] || m);
}

export function TemplateDialog({ template, isEmail, onClose, onDone }) {
  const [subject, setSubject] = useState(template.subject || "");
  const [body, setBody] = useState(template.body);
  const [bodyBad, setBodyBad] = useState(false);
  const [failed, setFailed] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!body.trim()) {
      setBodyBad(true);
      return;
    }
    setBusy(true);
    setFailed("");
    const r = await send("/api/admin/settings", "PATCH", { template: { id: template.id, ...(isEmail ? { subject } : {}), body } });
    setBusy(false);
    if (r.ok) onDone({ ...r.data.template });
    else setFailed("The template didn’t save. Try again.");
  }

  return (
    <Dialog
      eyebrow={isEmail ? "Email template" : "Proposal template"}
      title={`Edit template · ${template.name}`}
      size="lg"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={btnSecondary}
            disabled={busy}
            onClick={() => {
              setSubject(template.defaultSubject || "");
              setBody(template.defaultBody);
              setBodyBad(false);
            }}
          >
            Reset to default
          </button>
          <SubmitButton busy={busy} busyLabel="Saving…" onClick={submit}>
            Save template
          </SubmitButton>
        </>
      }
    >
      {failed ? <FailedLine>{failed}</FailedLine> : null}
      {isEmail ? <TextField id="tp-subj" label="Subject" value={subject} onChange={setSubject} disabled={busy} data-autofocus /> : null}
      <TextField
        id="tp-body"
        label="Body"
        textarea
        rows={11}
        value={body}
        onChange={(v) => {
          setBody(v);
          setBodyBad(false);
        }}
        error={bodyBad ? "The body can’t be empty." : ""}
        disabled={busy}
        data-autofocus={isEmail ? undefined : true}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[12px] text-muted mr-0.5">Insert:</span>
        {VAR_BUTTONS[isEmail ? "email" : "proposal"].map((v) => (
          <button
            key={v}
            type="button"
            disabled={busy}
            onClick={() => setBody((b) => `${b}${b && !b.endsWith("\n") ? " " : ""}{{${v}}}`)}
            className="min-h-[30px] px-2.5 rounded-full border border-border-2 bg-transparent text-[12px] text-fg hover:bg-surface-2 cursor-pointer font-mono"
          >
            {`{{${v}}}`}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="text-[12px] text-muted-2">Preview with [Business name]</span>
        <pre className="m-0 whitespace-pre-wrap break-words font-[inherit] text-[13px] leading-[1.6] text-muted-2 rounded-[12px] border border-border bg-surface-2 p-3.5 min-h-[200px] max-h-72 overflow-y-auto">
          {(isEmail ? `Subject: ${fill(subject)}\n\n` : "") + fill(body)}
        </pre>
      </div>
      <p className="m-0 text-[12px] text-muted">
        Variables fill from the record when the email or proposal is created. Plain text; links become buttons in the email layout. Outreach emails are drafts: a person approves and sends each one.
      </p>
    </Dialog>
  );
}
