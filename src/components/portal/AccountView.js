"use client";

import Link from "next/link";
import { useState } from "react";
import {  } from "@/lib/portal/sample";
import { usePortal } from "./PortalContext";
import { Alert, Card, Chip, FieldError, KeyRow, PageHead, Spinner, btnDanger, btnPrimary, btnSecondary, inputCls, labelCls, linkBtn } from "./ui";
import Dialog from "./Dialog";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE = { signer: ["Signer", "fg"], viewer: ["Viewer", "muted"], invited: ["Invited", "warning"] };

function Footer({ onClose, busy, children }) {
  return (
    <>
      <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
        Cancel
      </button>
      {children}
    </>
  );
}

// POST /api/portal/account/invite { email } -> 201 { person: { id, name, email, role: "invited" } }
function InviteDialog({ onClose }) {
  const p = usePortal();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | invalid | busy | failed
  const busy = status === "busy";

  async function send() {
    if (busy) return;
    const em = email.trim();
    if (!EMAIL_RE.test(em)) {
      setStatus("invalid");
      document.getElementById("pi-email")?.focus();
      return;
    }
    setStatus("busy");
    try {
      const data = await p.api("/api/portal/account/invite", { body: { email: em } });
      const person = data?.person || { id: `p${Date.now()}`, name: em.split("@")[0], email: em, role: "invited" };
      p.patch((s) => ({ people: [...s.people, { ...person, initial: em.charAt(0).toUpperCase() }] }));
      onClose();
      p.toast(`Invite sent to ${em}`);
    } catch {
      setStatus("failed");
    }
  }

  const bad = status === "invalid";
  return (
    <Dialog
      size="small"
      eyebrow="People"
      title="Add a person"
      onClose={onClose}
      busy={busy}
      footer={
        <Footer onClose={onClose} busy={busy}>
          <button type="button" onClick={send} disabled={busy} aria-busy={busy} className={btnPrimary}>
            {busy ? (
              <>
                <Spinner />
                Sending…
              </>
            ) : status === "failed" ? (
              "Try again"
            ) : (
              "Send the invite"
            )}
          </button>
        </Footer>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex flex-col gap-1.5"
      >
        <label htmlFor="pi-email" className={labelCls}>
          Their email
        </label>
        <input
          id="pi-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (bad) setStatus("idle");
          }}
          placeholder="name@yourbusiness.com"
          disabled={busy}
          aria-invalid={bad ? true : undefined}
          aria-describedby={bad ? "pi-email-err" : undefined}
          className={`${inputCls} ${bad ? "border-danger" : "border-border-2"}`}
        />
        {bad ? <FieldError id="pi-email-err">Enter an email like name@yourbusiness.com.</FieldError> : null}
      </form>
      <p className="m-0 text-muted-2">They get a sign-in link. They can see the project, invoices and requests, and send requests. Paying, signing off and the plan stay with you.</p>
      {status === "failed" ? <Alert>The invite didn’t send. Nobody was added. Try again in a moment.</Alert> : null}
    </Dialog>
  );
}

function RemoveDialog({ person, onClose }) {
  const p = usePortal();
  return (
    <Dialog
      size="small"
      eyebrow="People"
      title={`Remove ${person.name}?`}
      onClose={onClose}
      footer={
        <Footer onClose={onClose}>
          <button
            type="button"
            onClick={() => {
              p.patch((s) => ({ people: s.people.filter((x) => x.id !== person.id) }));
              onClose();
              p.toast(`${person.name} removed`);
            }}
            className={btnDanger}
          >
            Remove
          </button>
        </Footer>
      }
    >
      <p className="m-0 text-muted-2">{person.email} will no longer be able to sign in to this portal. You can add them again any time.</p>
    </Dialog>
  );
}

// POST /api/portal/account/plan { action: "end" | "keep", reason? } -> 200 { endsOn }
function CancelPlanDialog({ onClose }) {
  const p = usePortal();
  const [reason, setReason] = useState("Cost");
  const [status, setStatus] = useState("idle");
  const busy = status === "busy";
  async function confirm() {
    setStatus("busy");
    try {
      await p.api("/api/portal/account/plan", { body: { action: "end", reason } });
      p.patch({ planCanceled: true });
      onClose();
      p.toast(`Plan ends ${(p.plan.endsOn || "the end of your billing period")}. Hand-off steps are on their way.`);
    } catch {
      setStatus("failed");
    }
  }
  return (
    <Dialog
      eyebrow="Account"
      title="End the monthly plan?"
      onClose={onClose}
      busy={busy}
      footer={
        <Footer onClose={onClose} busy={busy}>
          <button type="button" onClick={confirm} disabled={busy} aria-busy={busy} className={btnDanger}>
            {busy ? (
              <>
                <Spinner />
                Ending…
              </>
            ) : (
              `End the plan on ${(p.plan.endsOn || "the end of your billing period")}`
            )}
          </button>
        </Footer>
      }
    >
      <p className="m-0 text-muted-2">You keep everything: the site, the code, your domain, your data and your Stripe account. Here is what changes:</p>
      <ul className="m-0 pl-[18px] text-muted-2 flex flex-col gap-1">
        <li>Hosting moves to your own Vercel account; we send the steps and stay on a call while you do it</li>
        <li>Booking reminders by text stop unless you add your own Twilio account</li>
        <li>Support becomes quoted per request instead of {p.hours.cap} hours a month</li>
        <li>Nothing is charged after {(p.plan.endsOn || "the end of your billing period")}</li>
      </ul>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cp-why" className={labelCls}>
          Mind telling us why? (optional)
        </label>
        <select id="cp-why" value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} border-border-2`}>
          <option>Cost</option>
          <option>We can host it ourselves</option>
          <option>Closing or selling the business</option>
          <option>Something else</option>
        </select>
      </div>
      {status === "failed" ? <Alert>That didn’t go through, so the plan is unchanged and nothing was ended. Try again, or ask in Support.</Alert> : null}
    </Dialog>
  );
}

// POST /api/portal/account/export -> 202 { requestedAt }
function ExportDialog({ onClose }) {
  const p = usePortal();
  const [status, setStatus] = useState("idle");
  const busy = status === "busy";
  async function confirm() {
    setStatus("busy");
    try {
      const exported = await p.api("/api/portal/account/export", { body: {} });
      if(exported.downloadUrl) window.location.assign(exported.downloadUrl);
      p.patch({ exportRequestedAt: "just now" });
      onClose();
      p.toast("Your data download is ready.");
    } catch {
      setStatus("failed");
    }
  }
  return (
    <Dialog
      size="small"
      eyebrow="Your data"
      title="Download a copy of my data"
      onClose={onClose}
      busy={busy}
      footer={
        <Footer onClose={onClose} busy={busy}>
          <button type="button" onClick={confirm} disabled={busy} aria-busy={busy} className={btnPrimary}>
            {busy ? (
              <>
                <Spinner />
                Requesting…
              </>
            ) : status === "failed" ? (
              "Try again"
            ) : (
              "Request the export"
            )}
          </button>
        </Footer>
      }
    >
      <p className="m-0 text-muted-2">
        Download the records stored for your business. Private files remain available through your portal.
      </p>
      <p className="m-0 text-muted-2">Card numbers are never included; Stripe holds those.</p>
      {status === "failed" ? <Alert>We couldn’t start the export. Nothing was requested. Try again in a moment.</Alert> : null}
    </Dialog>
  );
}

function Switch({ on, label, onToggle }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onToggle} className="relative w-[52px] h-11 flex-none bg-transparent border-0 p-0 cursor-pointer">
      <span aria-hidden="true" className={`absolute left-0 top-1/2 -translate-y-1/2 w-[52px] h-[28px] rounded-full transition-colors duration-200 ${on ? "bg-accent" : "bg-border-2"}`} />
      <span aria-hidden="true" className={`absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-white transition-[left] duration-200 ${on ? "left-[27px]" : "left-[3px]"}`} />
    </button>
  );
}

export default function AccountView() {
  const p = usePortal();
  const [dialog, setDialog] = useState(null); // { type, person? }
  const close = () => setDialog(null);
  const hasPlan = p.monthlyChosen;
  const required = p.offer.monthlyRequired;
  const chip = p.planCanceled ? ["Ending", "warning"] : p.live ? ["Active", "success"] : ["Starts at launch", "muted"];

  // POST /api/portal/account/notifications { key, on } -> 200 { saved: true }
  async function toggle(n) {
    const on = !n.on;
    p.patch((s) => ({ notifications: s.notifications.map((x) => (x.key === n.key ? { ...x, on } : x)) }));
    try {
      await p.api("/api/portal/account/notifications", { body: { key: n.key, on } });
      p.toast("Saved");
    } catch {
      p.patch((s) => ({ notifications: s.notifications.map((x) => (x.key === n.key ? { ...x, on: !on } : x)) }));
      p.toast("That didn’t save. Nothing changed.");
    }
  }

  async function keepPlan() {
    try {
      await p.api("/api/portal/account/plan", { body: { action: "keep" } });
      p.patch({ planCanceled: false });
      p.toast("Plan kept");
    } catch {
      p.toast("That didn’t save. The plan is still ending.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow="Account" title={p.client.business} lede="People who can see this portal, how we reach you, and your plan." />

      <Card titleId="ppl-h" title="People" action={<button type="button" onClick={() => setDialog({ type: "invite" })} className={btnSecondary}>Add a person</button>}>
        <ul className="list-none m-0 p-0 flex flex-col">
          {p.people.map((x) => {
            const [label, tone] = ROLE[x.role] || ROLE.viewer;
            return (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-h-14 border-t border-border py-2">
                <span className="flex items-center gap-3 min-w-0">
                  <span aria-hidden="true" className={`w-9 h-9 rounded-full inline-flex items-center justify-center text-[13px] font-medium flex-none ${x.role === "signer" ? "bg-fg text-bg" : "bg-border-2 text-fg"}`}>
                    {x.initial}
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="text-sm">{x.name}</span>
                    <span className="text-[13px] text-muted-2 break-all">{x.email}</span>
                  </span>
                </span>
                <span className="inline-flex items-center gap-2.5">
                  <Chip tone={tone}>{label}</Chip>
                  {x.role !== "signer" ? (
                    <button type="button" onClick={() => setDialog({ type: "remove", person: x })} aria-label={`Remove ${x.name}`} className={btnSecondary}>
                      Remove
                    </button>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="m-0 text-[13px] text-muted-2">Anyone here can see invoices and send requests. Only the signer can pay, sign off or cancel the plan.</p>
      </Card>

      <Card titleId="not-h" title="How we reach you">
        <ul className="list-none m-0 p-0 flex flex-col">
          {p.notifications.map((n) => (
            <li key={n.key} className="flex items-center justify-between gap-4 min-h-14 border-t border-border py-1">
              <span className="flex flex-col min-w-0">
                <span className="text-sm">{n.label}</span>
                <span className="text-[13px] text-muted-2">{n.sub}</span>
              </span>
              <Switch on={n.on} label={n.label} onToggle={() => toggle(n)} />
            </li>
          ))}
        </ul>
      </Card>

      <Card titleId="plan-h" title={hasPlan ? `Monthly plan · $${p.offer.monthly}/mo` : "Monthly plan"} action={hasPlan ? <Chip tone={chip[1]}>{chip[0]}</Chip> : null}>
        {hasPlan ? (
          <>
            <ul className="list-none m-0 p-0 flex flex-col">
              <KeyRow k="Starts">{p.live ? "[Date] · active" : "The day you sign off on the launch"}</KeyRow>
              <KeyRow k="Includes">Covers {p.offer.monthlyNote}, up to {p.hours.cap} h of changes</KeyRow>
              <KeyRow k="If you end it">You keep the site, code and data</KeyRow>
            </ul>
            {required ? (
              <p className="m-0 text-sm leading-[1.6] text-muted-2 border border-border-2 rounded-input bg-surface-2 p-3.5">
                The monthly plan is required for restaurant clients, so it can’t be ended from here. Ordering, kiosks and kitchen tools need daily care, and the plan is what pays for it. Questions about it? <Link href="/portal/support" className="text-accent-light">Ask in Support</Link>.
              </p>
            ) : p.planCanceled ? (
              <p role="status" className="m-0 text-sm text-muted-2">
                Plan ends {(p.plan.endsOn || "the end of your billing period")}. We email hosting hand-off steps a week before. Changed your mind?{" "}
                <button type="button" onClick={keepPlan} className="bg-transparent border-0 p-0 min-h-11 text-accent-light cursor-pointer font-[inherit] text-sm">
                  Keep the plan
                </button>
                .
              </p>
            ) : (
              <button type="button" onClick={() => setDialog({ type: "cancelplan" })} className={`${btnSecondary} self-start`}>
                End the monthly plan…
              </button>
            )}
          </>
        ) : (
          <p className="m-0 text-sm leading-[1.6] text-muted-2 border-t border-border pt-3.5">You did not choose a monthly plan. The site and code are yours at final payment, and you can add the plan later by asking in Support.</p>
        )}
      </Card>

      <Card titleId="data-h" title="Your data">
        <p className="m-0 text-sm leading-[1.6] text-muted-2">Everything in this portal is yours: content, bookings, customers, invoices. Ask for a copy any time, plan or no plan.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button type="button" onClick={() => setDialog({ type: "export" })} className={btnSecondary}>
            Email me a copy of my data
          </button>
          <Link href="/privacy" className={linkBtn}>
            Privacy policy
          </Link>
        </div>
        {p.exportRequestedAt ? (
          <p role="status" className="m-0 text-sm text-muted-2">
            Export requested {p.exportRequestedAt}. Your data download is available from this account.
          </p>
        ) : null}
        <div className="flex flex-wrap justify-between items-center gap-2 border-t border-border pt-3.5 text-[13px] text-muted-2">
          <span>Signed in as {p.client.email}</span>
          <Link href="/portal/signin" className={linkBtn}>
            Sign out
          </Link>
        </div>
      </Card>

      {dialog?.type === "invite" ? <InviteDialog onClose={close} /> : null}
      {dialog?.type === "remove" ? <RemoveDialog person={dialog.person} onClose={close} /> : null}
      {dialog?.type === "cancelplan" ? <CancelPlanDialog onClose={close} /> : null}
      {dialog?.type === "export" ? <ExportDialog onClose={close} /> : null}
    </div>
  );
}
