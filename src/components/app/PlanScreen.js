"use client";

import Link from "next/link";
import { useState } from "react";
import { MILESTONES, getOffer, money } from "@/lib/offers";
import { PLAN_COPY } from "@/lib/app/kinds";
import Dialog, { CancelButton } from "./Dialog";
import { Bar, Card, CardTitle, FieldError, FormGroup, Icon, Page, PageHeader, Spinner, StatusPill, btnDestructive, btnPrimary, btnSecondary, inputCls } from "./ui";
import { useToast } from "./Toast";
import { useAction } from "./hooks";
import { api } from "./api";
import { useBusiness } from "./useBusiness";

export default function PlanScreen() {
  const biz = useBusiness();
  return <Plan key={biz.kind} biz={biz} />;
}

function CodeDialog({ copy, onClose, onDone }) {
  const [email, setEmail] = useState("");
  const [bad, setBad] = useState("");
  const { busy, error, run } = useAction();

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setBad("Enter an email address for the GitHub invite.");
      return;
    }
    setBad("");
    const r = await run(() => api("/api/app/plan/code-download", { body: { email: email.trim() } }), "Couldn’t prepare the download. Nothing was sent and your plan is unchanged. Try again.");
    if (r.ok) onDone(r.data);
  };

  return (
    <Dialog
      size="medium"
      eyebrow="It’s yours"
      title="Download the site code"
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      footer={
        <>
          <CancelButton onClick={onClose} disabled={busy} />
          <button type="submit" className={btnPrimary} disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? "Preparing…" : "Download zip + invite"}
          </button>
        </>
      }
    >
      <p className="m-0 text-muted-2">A zip of the site exactly as it runs today, plus an invite to a GitHub repository under your account.</p>
      <ul className="m-0 pl-5 flex flex-col gap-1.5 text-muted-2">
        <li>Source code, build config and a README with the steps to host it yourself (Vercel, free tier works)</li>
        <li>Your content and photos; your data export is separate (above)</li>
        <li>An example environment file; the Stripe keys are already yours</li>
      </ul>
      <p className="m-0 text-muted-2">{copy.codeNote} Downloading changes nothing about your plan.</p>
      <FormGroup id="cd-email" label="Send the GitHub invite to" error={bad}>
        <input
          id="cd-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setBad("");
          }}
          placeholder="[you@business.com]"
          aria-invalid={bad ? true : undefined}
          aria-describedby={bad ? "cd-email-err" : undefined}
          className={inputCls}
        />
      </FormGroup>
      {error ? <FieldError>{error}</FieldError> : null}
    </Dialog>
  );
}

function CancelDialog({ copy, restaurant, noticePeriod, onClose, onDone }) {
  const [why, setWhy] = useState("Cost");
  const { busy, error, run } = useAction();

  const submit = async (e) => {
    e.preventDefault();
    const r = await run(() => api("/api/app/plan/cancel", { body: { reason: why } }), "Couldn’t send that. Your plan is unchanged. Try again.");
    if (r.ok) onDone(r.data);
  };

  return (
    <Dialog
      size="medium"
      eyebrow="Plan and support"
      title="Cancel the monthly plan?"
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      footer={
        <>
          <CancelButton onClick={onClose} disabled={busy}>
            Keep the plan
          </CancelButton>
          <button type="submit" className={btnDestructive} disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? "Sending…" : restaurant ? "Ask to end the plan" : "Cancel the plan"}
          </button>
        </>
      }
    >
      <p className="m-0 text-muted-2">
        You keep the site, the code, your domain, your data and your Stripe account. Here is what stops after {noticePeriod}:
      </p>
      <ul className="m-0 pl-5 flex flex-col gap-1.5 text-muted-2">
        <li>Klyvora hosting and this admin; we send hosting hand-off steps and stay on a call while you do it</li>
        <li>{copy.stopsLine}</li>
        <li>Included small changes and support hours; requests become quoted</li>
      </ul>
      <FormGroup id="cp-why" label="Mind telling us why? (optional)">
        <select id="cp-why" value={why} onChange={(e) => setWhy(e.target.value)} className={`${inputCls} cursor-pointer`}>
          <option>Cost</option>
          <option>We can host it ourselves</option>
          <option>Closing or selling the business</option>
          <option>Something else</option>
        </select>
      </FormGroup>
      {restaurant ? (
        <p role="note" className="m-0 border border-border-2 rounded-input px-4 py-3 text-[13px] text-muted-2">
          Restaurant plans are required while ordering and the kiosk run on Klyvora. Ending it moves ordering to your own hosting; the kiosk license ends.
        </p>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Dialog>
  );
}

function Plan({ biz }) {
  const kind = biz.kind;
  const copy = PLAN_COPY[kind];
  const offer = getOffer(biz.offerCode);
  const price = money(offer.monthly);
  const toast = useToast();
  const [dialog, setDialog] = useState(null); // "code" | "cancel"
  const [canceled, setCanceled] = useState(false);
  const [exported, setExported] = useState(false);
  const exp = useAction();
  const undo = useAction();
  const restaurant = offer.monthlyRequired;
  const plan = biz.plan;

  const exportData = async () => {
    const r = await exp.run(() => api("/api/app/plan/data-export", { body: {} }), "Couldn’t start the export. Try again.");
    if (r.ok) {
      setExported(true);
      toast("Export requested; link arrives by email within 24 hours");
    }
  };

  const undoCancel = async () => {
    const r = await undo.run(() => api("/api/app/plan/undo", { body: {} }), "Couldn’t keep the plan. Try again or ask Klyvora.");
    if (r.ok) {
      setCanceled(false);
      toast("Plan kept");
    }
  };

  const included = [
    { t: "Hosting and this admin", d: "Fast, backed up, kept up to date." },
    { t: "Small changes", d: `${plan.usage.changesUsed} of ${plan.usage.changesCap} used this month`, pct: plan.usage.changesPct },
    { t: "Support hours", d: `${plan.usage.hoursUsed} of ${plan.usage.hoursCap} hours used this month`, pct: plan.usage.hoursPct },
    { t: copy.careTitle, d: copy.careText },
  ];

  const tile = "flex items-center justify-between gap-3 min-h-14 px-[18px] py-2 rounded-full border border-border-2 bg-transparent text-fg text-[13px] cursor-pointer text-left font-[inherit] disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <Page className="page-app-plan">
      <PageHeader eyebrow="Plan and support" title="Your plan" />

      <div className="flex flex-wrap gap-4 items-start">
        <section aria-labelledby="plan-h" className="card-plan flex-[3_1_520px] min-w-0 rounded-card-lg p-[2px] bg-[linear-gradient(90deg,var(--accent-light),var(--accent),var(--accent-light))]">
          <div className="bg-surface rounded-card p-7 box-border flex flex-col gap-5">
            <div className="flex flex-wrap justify-between items-baseline gap-3">
              <h2 id="plan-h" className="text-xl font-medium m-0">
                {offer.name} · monthly plan
              </h2>
              <span className="flex flex-col items-end gap-1">
                <span className="font-display text-4xl leading-none">
                  {price}
                  <span className="font-sans text-sm text-muted-2">/month</span>
                </span>
                {canceled ? (
                  <span role="status" className="inline-flex items-center gap-1.5 text-xs text-warning border border-warning rounded-full pl-2.5 pr-1 py-0.5">
                    Canceled · ends {plan.endsOn} ·
                    <button type="button" onClick={undoCancel} disabled={undo.busy} className="text-accent-light bg-transparent border-0 cursor-pointer font-[inherit] min-h-11 px-2 -my-2.5 underline">
                      {undo.busy ? "Keeping…" : "keep it"}
                    </button>
                  </span>
                ) : null}
              </span>
            </div>
            {undo.error ? <FieldError>{undo.error}</FieldError> : null}
            <ul className="list-none m-0 p-0 grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
              {included.map((i) => (
                <li key={i.t} className="flex flex-col gap-1.5 px-4 py-3.5 rounded-input bg-surface-2 border border-border">
                  <span className="text-sm font-medium">{i.t}</span>
                  <span className="text-[13px] text-muted-2">{i.d}</span>
                  {i.pct != null ? <Bar pct={i.pct} label={i.t} /> : null}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap justify-between items-center gap-3 text-sm text-muted-2">
              <span>
                {canceled ? `Last charge: ${price} on ${plan.nextChargeDate}` : `Next charge: ${price} on ${plan.nextChargeDate}`}, to the card ending {plan.card.last4}. Receipts from Stripe.
              </span>
              <Link href="/portal" className="text-accent-light min-h-11 inline-flex items-center">
                Invoices and card →
              </Link>
            </div>
          </div>
        </section>

        <Card aria-labelledby="help-h" className="card-ask flex-[2_1_320px] px-6 pt-5 pb-6 flex flex-col gap-3">
          <CardTitle id="help-h">Ask Klyvora</CardTitle>
          <p className="m-0 text-sm leading-relaxed text-muted-2">
            Something you can’t change here, or don’t want to? Send it over. Small changes are in your plan; a person in Charlotte replies, usually the same business day.
          </p>
          <Link href="/portal" className={`${btnPrimary} !min-h-12`}>
            Open a request
          </Link>
          <a href="sms:+19193910982" className={btnSecondary}>
            Text us: (919) 391-0982
          </a>
        </Card>
      </div>

      <Card aria-labelledby="bill-h" className="card-billing px-6 py-5 flex flex-col gap-3">
        <CardTitle id="bill-h">Invoices and card</CardTitle>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-2">
          <span>
            Card on file: {plan.card.brand} ending {plan.card.last4} · expires {plan.card.expires}
          </span>
          <Link href="/portal" className="text-accent-light min-h-11 inline-flex items-center">
            Change the card in your portal →
          </Link>
        </div>
        <ul className="list-none m-0 p-0 flex flex-col">
          {plan.invoices.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border min-h-14 text-sm">
              <span className="flex flex-col gap-0.5">
                <span>{inv.number}</span>
                <span className="text-[13px] text-muted-2">{inv.period}</span>
              </span>
              <span className="flex items-center gap-4">
                <span className="tabular-nums">{price}</span>
                <StatusPill status={inv.status === "Paid" ? "Paid" : inv.status} />
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card aria-labelledby="own-h" className="card-ownership p-6 flex flex-col gap-4">
        <div>
          <h2 id="own-h" className="text-[17px] font-medium m-0 mb-1.5">
            It’s yours. Here’s how to take it.
          </h2>
          <p className="m-0 text-sm leading-relaxed text-muted-2 max-w-[720px]">
            You own your domain, content, customer list, data and Stripe account, and the site itself. The monthly plan is only for us hosting it and giving you this admin. If you’d rather run it yourself, take it with you.
          </p>
        </div>
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <button type="button" className={`btn-export ${tile}`} onClick={exportData} disabled={exp.busy || exported}>
            <span className="flex flex-col gap-0.5">
              <span>{exp.busy ? "Requesting…" : exported ? "Export is on its way by email" : "Export my data"}</span>
              <span className="text-xs text-muted-2">Customers, {copy.exportWhat}, photos, text</span>
            </span>
            {exp.busy ? <Spinner /> : <Icon name="download" />}
          </button>
          <button type="button" className={`btn-download-code ${tile}`} onClick={() => setDialog("code")}>
            <span className="flex flex-col gap-0.5">
              <span>Download the site code</span>
              <span className="text-xs text-muted-2">{copy.codeNote}</span>
            </span>
            <Icon name="download" />
          </button>
          {restaurant ? (
            <button type="button" className={`btn-cancel-plan ${tile} text-muted-2`} onClick={() => setDialog("cancel")} disabled={canceled}>
              <span className="flex flex-col gap-0.5">
                <span>The monthly plan is required</span>
                <span className="text-xs text-muted-2">Ordering and the kiosk run on Klyvora. Want to move off? Ask us.</span>
              </span>
              <Icon name="arrow" />
            </button>
          ) : (
            <button type="button" className={`btn-cancel-plan ${tile} text-muted-2`} onClick={() => setDialog("cancel")} disabled={canceled}>
              <span className="flex flex-col gap-0.5">
                <span>Cancel the monthly plan</span>
                <span className="text-xs text-muted-2">{plan.noticePeriod}. We help you move.</span>
              </span>
              <Icon name="arrow" />
            </button>
          )}
        </div>
        {exp.error ? <FieldError>{exp.error}</FieldError> : null}
        {restaurant ? (
          <p role="note" className="m-0 text-[13px] text-muted-2 leading-relaxed">
            Restaurant plans are required while ordering and the kiosk run on Klyvora. The site code and your data are yours at any time.
          </p>
        ) : null}
      </Card>

      <p className="m-0 text-[13px] text-muted-2">
        Plan terms match the Terms page: setup paid {MILESTONES.map((m) => m.percent).join("/")}, monthly from accepted launch, optional on everything but restaurants.
      </p>

      {dialog === "code" ? (
        <CodeDialog
          copy={copy}
          onClose={() => setDialog(null)}
          onDone={(data) => {
            setDialog(null);
            if (data.downloadUrl) window.location.assign(data.downloadUrl);
            toast(`${data.filename} downloading; GitHub invite sent to ${data.inviteSentTo}`);
          }}
        />
      ) : null}
      {dialog === "cancel" ? (
        <CancelDialog
          copy={copy}
          restaurant={restaurant}
          noticePeriod={plan.noticePeriod}
          onClose={() => setDialog(null)}
          onDone={(data) => {
            setDialog(null);
            setCanceled(true);
            toast(`Plan ends ${data.endsOn}. Hand-off steps are on their way.`, { action: { label: "Undo", onClick: undoCancel } });
          }}
        />
      ) : null}
    </Page>
  );
}
