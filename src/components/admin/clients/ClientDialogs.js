"use client";

import { useState } from "react";
import { btnDanger, btnPrimary, btnSecondary } from "@/components/admin/ui";
import { OFFERS, getOffer, money } from "@/lib/offers";
import { CLIENT_STAGES, OWNERS } from "@/lib/admin/sample-clients";
import { CheckRow, Dialog, EMAIL_RE, FailBanner, FieldRow, api, inputCls } from "./kit";

// Every form dialog here has five states: idle, validation error, submitting, success (closes, parent toasts), failed.
// Parents mount a dialog to open it and unmount it to close it.

const GETS = [
  ["updates", "Project updates"],
  ["invoices", "Invoices and receipts"],
  ["tickets", "Support ticket replies"],
];
const ROLES = ["Owner", "Manager", "Bookkeeper", "Marketing / social", "Other"];

function Footer({ onClose, busy, submitLabel, formId, danger = false, cancelLabel = "Cancel", disabled = false }) {
  return (
    <>
      <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
        {cancelLabel}
      </button>
      {submitLabel ? (
        <button type="submit" form={formId} disabled={busy || disabled} className={`${danger ? btnDanger : btnPrimary} disabled:opacity-60`}>
          {busy ? "Working…" : submitLabel}
        </button>
      ) : null}
    </>
  );
}

export function AddContactDialog({ client, onClose, onDone }) {
  const [v, setV] = useState({ name: "", role: "Owner", email: "", phone: "", gets: ["updates"], invite: true });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const set = (k) => (e) => setV((c) => ({ ...c, [k]: e.target.value }));
  const busy = status === "submitting";

  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (!v.name.trim()) er.name = "Enter a name.";
    if (!EMAIL_RE.test(v.email.trim())) er.email = "Enter an email like name@business.com.";
    setErrors(er);
    if (Object.keys(er).length) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const { contact } = await api(`/api/admin/clients/${client.id}/contacts`, { method: "POST", body: { ...v, name: v.name.trim(), email: v.email.trim() } });
      onDone(contact, v.invite);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <Dialog eyebrow={client.business} title="Add a contact" onClose={onClose} busy={busy} footer={<Footer onClose={onClose} busy={busy} submitLabel="Add contact" formId="ac-form" />}>
      <form id="ac-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        {status === "failed" ? <FailBanner>Couldn’t add the contact. Nothing was saved; try again.</FailBanner> : null}
        <FieldRow id="ac-name" label="Name *" error={errors.name}>
          <input id="ac-name" data-autofocus value={v.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "ac-name-err" : undefined} placeholder="Full name" className={inputCls} />
        </FieldRow>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="ac-role" label="Role">
            <select id="ac-role" value={v.role} onChange={set("role")} className={inputCls}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="ac-phone" label="Phone">
            <input id="ac-phone" type="tel" value={v.phone} onChange={set("phone")} placeholder="(704) 555-0100" className={inputCls} />
          </FieldRow>
        </div>
        <FieldRow id="ac-email" label="Email *" error={errors.email}>
          <input id="ac-email" type="email" value={v.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "ac-email-err" : undefined} placeholder="name@business.com" className={inputCls} />
        </FieldRow>
        <fieldset className="border-0 p-0 m-0 flex flex-col gap-2">
          <legend className="text-[13px] text-muted-2 mb-1">Gets</legend>
          {GETS.map(([k, label]) => (
            <CheckRow key={k} checked={v.gets.includes(k)} onChange={() => setV((c) => ({ ...c, gets: c.gets.includes(k) ? c.gets.filter((x) => x !== k) : [...c.gets, k] }))}>
              {label}
            </CheckRow>
          ))}
        </fieldset>
        <CheckRow checked={v.invite} onChange={() => setV((c) => ({ ...c, invite: !c.invite }))}>
          Invite to the portal now (magic link)
        </CheckRow>
        <p className="m-0 text-xs text-muted-2">The primary contact signs proposals and receives invoices. “Gets” controls which emails each person receives.</p>
      </form>
    </Dialog>
  );
}

const CAN = [
  ["project", "See the project, files and demo", true],
  ["approve", "Approve the demo and sign off on launch", false],
  ["invoices", "See and pay invoices", false],
  ["tickets", "Open support tickets", true],
];

export function InviteDialog({ client, contactId, onClose, onDone }) {
  const people = client.contacts;
  const firstInvitable = people.find((c) => c.id === contactId) || people.find((c) => c.access === "Not invited") || people[0];
  const [who, setWho] = useState(firstInvitable?.id || "other");
  const [email, setEmail] = useState("");
  const [can, setCan] = useState(() => CAN.filter((c) => c[2]).map((c) => c[0]));
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");
  const busy = status === "submitting";
  const person = people.find((c) => c.id === who);
  const owner = client.owner;

  async function submit(e) {
    e.preventDefault();
    if (who === "other" && !EMAIL_RE.test(email.trim())) {
      setError("Enter the email to invite.");
      setStatus("error");
      return;
    }
    setError("");
    setStatus("submitting");
    try {
      await api(`/api/admin/clients/${client.id}/invite`, { method: "POST", body: { contactId: person?.id, email: who === "other" ? email.trim() : undefined, can } });
      onDone(person?.id || null, who === "other" ? email.trim() : person.email);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <Dialog eyebrow={client.business} title="Invite to the portal" onClose={onClose} busy={busy} footer={<Footer onClose={onClose} busy={busy} submitLabel="Send invite" formId="iv-form" />}>
      <form id="iv-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        {status === "failed" ? <FailBanner>The invite didn’t send. Try again; nothing was emailed.</FailBanner> : null}
        <FieldRow id="iv-who" label="Who">
          <select id="iv-who" data-autofocus value={who} onChange={(e) => setWho(e.target.value)} className={inputCls}>
            {people.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.email}
                {c.access === "Active" ? " (already active)" : ""}
              </option>
            ))}
            <option value="other">Someone else…</option>
          </select>
        </FieldRow>
        {who === "other" ? (
          <FieldRow id="iv-email" label="Email" error={error}>
            <input id="iv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "iv-email-err" : undefined} placeholder="name@business.com" className={inputCls} />
          </FieldRow>
        ) : null}
        <fieldset className="border-0 p-0 m-0 flex flex-col gap-2">
          <legend className="text-[13px] text-muted-2 mb-1">They can</legend>
          {CAN.map(([k, label]) => (
            <CheckRow key={k} checked={can.includes(k)} onChange={() => setCan((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]))}>
              {label}
            </CheckRow>
          ))}
        </fieldset>
        <div className="rounded-input border border-border bg-surface-2 p-3.5 text-[13px] leading-relaxed">
          <div className="text-xs text-muted-2 mb-1.5">Email preview</div>
          <strong className="font-medium">Your Klyvora portal for {client.business}</strong>
          <br />
          Hi [First name], {owner} set up a portal where you can follow the build, see files and approve the demo. Tap the button to sign in; the link works for 7 days and there is no password to remember.
          <br />
          <span className="inline-block mt-2 px-3 py-1.5 rounded-full bg-fg text-bg text-xs font-medium">Open my portal</span>
        </div>
      </form>
    </Dialog>
  );
}

export function StripeDialog({ client, onClose, onConnectStarted, onMarkConnected }) {
  const conn = client.stripe.connect;
  const [delivery, setDelivery] = useState("email");
  const [status, setStatus] = useState("idle");
  const [sentTo, setSentTo] = useState(null);
  const busy = status === "submitting";

  async function start() {
    setStatus("submitting");
    try {
      const { connect } = await api(`/api/admin/clients/${client.id}/stripe/connect`, { method: "POST", body: { delivery } });
      setSentTo(connect.sentTo);
      setStatus("idle");
      onConnectStarted(connect);
    } catch {
      setStatus("failed");
    }
  }

  const connected = conn.status === "connected";
  const pending = conn.status === "pending";
  const fee = (
    <div className="rounded-input border border-border bg-surface-2 p-3.5 text-[13px] leading-relaxed">
      Checkout runs through <strong className="font-medium">their own Stripe account</strong>, which they fully control, with full access to their Stripe dashboard. Klyvora’s fee on their sales is <strong className="font-medium">$0</strong>. Our own Stripe customer for them only bills setup invoices and the monthly plan.
    </div>
  );

  let footer;
  if (connected) {
    footer = (
      <button type="button" onClick={onClose} className={btnPrimary}>
        Done
      </button>
    );
  } else if (pending) {
    footer = (
      <>
        {process.env.NODE_ENV !== "production" ? (
          <button type="button" onClick={onMarkConnected} className={`${btnSecondary} border-dashed`}>
            Dev: mark connected
          </button>
        ) : null}
        <button type="button" onClick={onClose} className={btnPrimary}>
          Done
        </button>
      </>
    );
  } else {
    footer = (
      <>
        <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
          Cancel
        </button>
        <button type="button" onClick={start} disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>
          {busy ? "Starting…" : "Start Connect onboarding"}
        </button>
      </>
    );
  }

  return (
    <Dialog eyebrow={client.business} title={connected ? "Stripe is connected" : pending ? "Waiting on Stripe onboarding" : "Connect their Stripe account"} onClose={onClose} busy={busy} footer={footer}>
      {status === "failed" ? <FailBanner>Stripe didn’t start the onboarding. Nothing was created; try again.</FailBanner> : null}
      {connected ? (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 m-0 text-[13px]">
            <dt className="text-muted-2">Account</dt>
            <dd className="m-0">{conn.accountId || "acct_[…]"} · owned by the client</dd>
            <dt className="text-muted-2">Charges</dt>
            <dd className="m-0">Enabled</dd>
            <dt className="text-muted-2">Payouts</dt>
            <dd className="m-0">Enabled, to their bank</dd>
            <dt className="text-muted-2">Our fee</dt>
            <dd className="m-0">$0 on their sales</dd>
          </dl>
          {fee}
        </>
      ) : pending ? (
        <>
          <p className="m-0 text-[13px] leading-relaxed text-muted-2">
            {sentTo ? `We emailed the onboarding link to ${sentTo}. ` : "The onboarding link is ready. "}They add their business and bank details on Stripe’s own page; the card or bank is never typed here. This turns to Connected on its own when they finish.
          </p>
          <div className="rounded-input border border-border bg-surface-2 p-3 text-xs break-all font-mono">https://connect.stripe.com/setup/[…]</div>
          {fee}
        </>
      ) : (
        <>
          <p className="m-0 text-[13px] leading-relaxed text-muted-2">
            {client.business} takes {getOffer(client.offerCode)?.name ? `payments on their ${getOffer(client.offerCode).name}` : "payments"}, so they need their own Stripe account for deposits, orders and payouts. Connect onboarding is the client’s own form; we only start it.
          </p>
          <fieldset className="border-0 p-0 m-0 flex flex-col gap-2">
            <legend className="text-[13px] text-muted-2 mb-1.5">How they get the link</legend>
            {[
              ["email", "Email it to the primary contact", "Usual choice. Sent from the portal address."],
              ["link", "Just give me the link", "To text or read out on a call."],
            ].map(([k, label, help]) => (
              <label key={k} className={`flex gap-2.5 items-start p-3 rounded-input border cursor-pointer ${delivery === k ? "border-fg bg-surface-2" : "border-border-2"}`}>
                <input type="radio" name="stripe-delivery" checked={delivery === k} onChange={() => setDelivery(k)} className="mt-0.5 accent-[var(--accent)]" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-fg">{label}</span>
                  <span className="text-xs text-muted-2">{help}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {fee}
        </>
      )}
    </Dialog>
  );
}

export function EditDialog({ client, onClose, onDone }) {
  const [v, setV] = useState({
    business: client.business,
    legalName: client.legalName,
    address: client.address,
    offerCode: client.offerCode,
    stage: client.stage,
    owner: client.owner,
    domain: client.domain,
    monthly: client.monthly.on,
    template: client.template,
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const busy = status === "submitting";
  const offer = getOffer(v.offerCode);
  const required = !!offer?.monthlyRequired;
  const set = (k) => (e) => setV((c) => ({ ...c, [k]: e.target.value }));
  const price = offer ? `${money(offer.monthly)}/mo${offer.usage ? " + usage" : ""}` : "";

  async function submit(e) {
    e.preventDefault();
    if (!v.business.trim()) {
      setErrors({ business: "Enter the business name." });
      setStatus("error");
      return;
    }
    setErrors({});
    setStatus("submitting");
    try {
      const body = { ...v, business: v.business.trim(), monthly: required ? true : v.monthly };
      const { client: next } = await api(`/api/admin/clients/${client.id}`, { method: "PATCH", body });
      onDone(next, body);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <Dialog eyebrow="Client" title={`Edit ${client.business}`} size="lg" onClose={onClose} busy={busy} footer={<Footer onClose={onClose} busy={busy} submitLabel="Save changes" formId="ed-form" />}>
      <form id="ed-form" onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {status === "failed" ? (
          <div className="sm:col-span-2">
            <FailBanner>Couldn’t save the client. Nothing changed; try again.</FailBanner>
          </div>
        ) : null}
        <FieldRow id="ed-biz" label="Business name" error={errors.business}>
          <input id="ed-biz" data-autofocus value={v.business} onChange={set("business")} aria-invalid={!!errors.business} aria-describedby={errors.business ? "ed-biz-err" : undefined} className={inputCls} />
        </FieldRow>
        <FieldRow id="ed-legal" label="Legal name">
          <input id="ed-legal" value={v.legalName} onChange={set("legalName")} className={inputCls} />
        </FieldRow>
        <FieldRow id="ed-addr" label="Address" className="sm:col-span-2">
          <input id="ed-addr" value={v.address} onChange={set("address")} className={inputCls} />
        </FieldRow>
        <FieldRow id="ed-offer" label="Offer">
          <select id="ed-offer" value={v.offerCode} onChange={set("offerCode")} className={inputCls}>
            {OFFERS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name} ({o.code})
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow id="ed-stage" label="Stage">
          <select id="ed-stage" value={v.stage} onChange={set("stage")} className={inputCls}>
            {CLIENT_STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow id="ed-owner" label="Owner">
          <select id="ed-owner" value={v.owner} onChange={set("owner")} className={inputCls}>
            {OWNERS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow id="ed-domain" label="Domain">
          <input id="ed-domain" value={v.domain} onChange={set("domain")} className={inputCls} />
        </FieldRow>
        <div className="sm:col-span-2 flex flex-col gap-2.5">
          <CheckRow checked={required || v.monthly} disabled={required} onChange={() => setV((c) => ({ ...c, monthly: !c.monthly }))}>
            Monthly plan · {price}
            <span className="block text-xs text-muted-2 mt-0.5">
              {required ? "Required for restaurants: ordering and menu updates need our hosting and admin." : "Optional. Hosting, their admin and support. Untick if they take the code and self-host."}
            </span>
          </CheckRow>
          <CheckRow checked={v.template} onChange={() => setV((c) => ({ ...c, template: !c.template }))}>
            Using a Klyvora template
            <span className="block text-xs text-muted-2 mt-0.5">The template license stays with us; everything else is theirs.</span>
          </CheckRow>
          <p className="m-0 text-xs text-muted-2">Changing offer or plan writes an audit line on the Overview and does not touch Stripe until you confirm on the Subscriptions tab.</p>
        </div>
      </form>
    </Dialog>
  );
}

export function CancelPlanDialog({ client, onClose, onDone }) {
  const offer = getOffer(client.offerCode);
  const locked = !!offer?.monthlyRequired;
  const [when, setWhen] = useState("period");
  const [why, setWhy] = useState("They want to self-host");
  const [status, setStatus] = useState("idle");
  const busy = status === "submitting";

  async function confirm() {
    setStatus("submitting");
    try {
      await api(`/api/admin/clients/${client.id}`, { method: "PATCH", body: { monthly: false } });
      onDone(when);
    } catch {
      setStatus("failed");
    }
  }

  const footer = locked ? (
    <button type="button" onClick={onClose} className={btnPrimary}>
      Keep the plan
    </button>
  ) : (
    <>
      <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
        Keep the plan
      </button>
      <button type="button" onClick={confirm} disabled={busy} className={`${btnDanger} disabled:opacity-60`}>
        {busy ? "Cancelling…" : "Cancel plan"}
      </button>
    </>
  );

  return (
    <Dialog alert title="Cancel the monthly plan?" describedBy="cp-p" onClose={onClose} busy={busy} footer={footer}>
      {locked ? (
        <div id="cp-p" className="flex flex-col gap-3">
          <div role="note" className="rounded-input border border-border-2 bg-surface-2 p-3.5 text-[13px] leading-relaxed">
            <strong className="font-medium">The monthly plan is required for restaurants.</strong> {client.business} is on {offer.name} ({offer.code}), and ordering, kiosks and kitchen operations run on our platform and need daily maintenance. An active restaurant plan can’t be cancelled here.
          </div>
          <p className="m-0 text-[13px] text-muted-2 leading-relaxed">To end the relationship, move them to a different offer from Edit client, or talk to Chris about a handover. The site, code and data are theirs on final payment either way.</p>
        </div>
      ) : (
        <>
          <p id="cp-p" className="m-0 text-[13px] text-muted-2 leading-relaxed">
            {client.business} keeps the site and the code. Hosting, their admin and support stop at the end of the period; booking needs their own hosting after that. We send the handover pack and a last reminder 7 days before.
          </p>
          {status === "failed" ? <FailBanner>Couldn’t cancel the plan. It is still active; try again.</FailBanner> : null}
          <FieldRow id="cp-when" label="When">
            <select id="cp-when" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls}>
              <option value="period">End of the current period</option>
              <option value="now">Now (prorated refund)</option>
            </select>
          </FieldRow>
          <FieldRow id="cp-why" label="Reason">
            <select id="cp-why" value={why} onChange={(e) => setWhy(e.target.value)} className={inputCls}>
              {["They want to self-host", "Price", "Closing the business", "Unhappy with support", "Other"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </FieldRow>
        </>
      )}
    </Dialog>
  );
}

export function RevokeDialog({ user, onClose, onDone }) {
  return (
    <Dialog alert title="Revoke portal access?" size="sm" describedBy="rv-p" onClose={onClose} footer={
      <>
        <button type="button" onClick={onClose} className={btnSecondary}>
          Keep access
        </button>
        <button type="button" onClick={onDone} className={btnDanger}>
          Revoke access
        </button>
      </>
    }>
      <p id="rv-p" className="m-0 text-[13px] text-muted-2 leading-relaxed">
        {user.name} will be signed out of the portal and their magic links stop working. You can invite them again any time.
      </p>
    </Dialog>
  );
}
