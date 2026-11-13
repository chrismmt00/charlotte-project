"use client";

import Link from "next/link";
import { useState } from "react";
import { ErrorIcon } from "@/components/ui/Field";
import { CONTACT } from "@/lib/site";
import ProposalHeader from "./ProposalHeader";
import { BILLED_SEPARATELY, NEEDS_CONNECT, OWNERSHIP_TERMS, SCOPE_CAPS, computeTotals, isRestaurant, usd } from "./model";

function shortDate(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CHIP = {
  draft: ["Preview · not sent yet", "muted"],
  open: ["Open", "accent"],
  signed: ["Signed", "success"],
  expired: ["Expired", "warning"],
  declined: ["Declined", "muted"],
};

const PHASES = [
  ["Kickoff", "A 30-minute call, your photos and prices, the domain. We write the pages."],
  ["Working demo", "A real link you can tap through. Rounds of changes are capped on this proposal."],
  ["Launch", "Domain switched, everything live. You accept the launch and the last 20% falls due."],
  ["After", "Monthly plan: we host it and fix things. Self-managed: you get the handover pack."],
];

// Board button specs (Proposal.dc.html): pills, 48px (14px) for secondary actions, 52px (15px) in the sign form.
const pill = "inline-flex items-center justify-center gap-2 rounded-full font-medium cursor-pointer box-border whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";
const pillPrimary = `${pill} bg-fg text-bg border-2 border-transparent`;
const pillSecondary = `${pill} bg-transparent text-fg border border-border-2`;
const btn48 = "min-h-12 px-[18px] text-sm";
const btn52 = "min-h-[52px] px-6 text-[15px]";
const link = "text-accent-light hover:text-fg";
// Inputs: 48px, radius 12, border-2, surface-2, padding 0 12, 15px. Errors use the fg border plus an icon (no red on the public page).
const input = "w-full min-w-0 min-h-12 box-border rounded-xl bg-surface-2 border border-border-2 px-3 text-[15px] text-fg font-[inherit] aria-[invalid=true]:border-fg";

function Eyebrow({ children }) {
  return <div className="text-[11px] tracking-[.3em] uppercase text-muted-2">{children}</div>;
}

function H2({ id, children, className = "" }) {
  return (
    <h2 id={id} className={`font-display font-normal text-[30px] leading-[1.1] m-0 ${className}`}>
      {children}
    </h2>
  );
}

function Check() {
  return (
    <span aria-hidden="true" className="w-[22px] h-[22px] rounded-full border border-success text-success inline-flex items-center justify-center flex-none mt-0.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5 9-10" />
      </svg>
    </span>
  );
}

function FieldError({ id, children }) {
  return (
    <span id={id} className="text-[13px] text-fg flex items-center gap-1.5">
      <ErrorIcon />
      {children}
    </span>
  );
}

function Gone({ proposal }) {
  const expired = proposal.state === "expired";
  return (
    <section className="text-center flex flex-col items-center gap-3.5 py-10">
      <Eyebrow>
        Proposal · {expired ? "expired" : "declined"} {expired ? proposal.expiredAt : proposal.declinedAt}
      </Eyebrow>
      <h1 className="font-display font-normal text-[clamp(36px,6vw,64px)] leading-none m-0">{expired ? "This proposal has expired." : "You passed on this one."}</h1>
      <p className="m-0 text-[15px] leading-[1.7] text-muted-2 max-w-[520px]">
        {expired
          ? "Prices were held while the proposal was open. Nothing was charged and nothing is lost: ask and we’ll send a fresh copy, usually at the same numbers."
          : "Thanks for telling us. Nothing was charged. If the timing changes, the offer is still here: reply to the email or call and we’ll pick it up where we left it."}
      </p>
      <div className="flex flex-wrap justify-center gap-2.5">
        <Link href="/contact" className={`${pillPrimary} ${btn48}`}>
          Ask for a fresh one
        </Link>
        {CONTACT.phoneHref ? (
          <a href={CONTACT.phoneHref} className={`${pillSecondary} ${btn48}`}>
            Call {CONTACT.phone}
          </a>
        ) : (
          <span className="inline-flex items-center min-h-12 px-4 text-sm text-muted-2">Or call {CONTACT.phone}</span>
        )}
      </div>
    </section>
  );
}

export default function ProposalView({ proposal }) {
  const p = proposal;
  const restaurant = isRestaurant(p.offerCode);
  const [state, setState] = useState(p.state);
  const [monthly, setMonthly] = useState(p.monthly);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState((p.email || "").replace(/[[\]]/g, ""));
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState("idle"); // idle | error | submitting | failed
  const [failMsg, setFailMsg] = useState("");
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("Not now");
  const [declineBusy, setDeclineBusy] = useState(false);
  const [declineFail, setDeclineFail] = useState(false);
  const [signedName, setSignedName] = useState(p.signatureName);

  const totals = computeTotals({ offerCode: p.offerCode, addOns: p.addOns, monthly, quote: p.quote });
  const offer = totals.offer;
  const monthlyOn = totals.monthlyOn;
  const kickoff = totals.schedule[0].amount;
  const addOnLines = totals.lines.slice(1);
  const preview = state === "draft";
  const open = state === "open" || state === "draft";
  const signed = state === "signed";
  const connect = NEEDS_CONNECT.includes(p.offerCode);
  const monthlyWord = monthlyOn ? `included at ${usd(totals.monthlyAmount)}/month${restaurant ? " (required for restaurants)" : " and cancelable any month"}` : "not included; we host the site ourselves";

  async function sign(e) {
    e.preventDefault();
    if (phase === "submitting") return;
    const er = {};
    const n = name.trim();
    if (n.length < 3 || !/[a-z]/i.test(n)) er.name = "Type your full name to sign.";
    if (!EMAIL_RE.test(email.trim())) er.email = "Enter an email like you@business.com.";
    if (!agree) er.agree = "Tick the box to confirm you’ve read this.";
    setErrors(er);
    if (Object.keys(er).length) {
      setPhase("error");
      const first = er.name ? "sg-name" : er.email ? "sg-email" : "sg-agree";
      document.getElementById(first)?.focus();
      return;
    }
    setPhase("submitting");
    try {
      const res = await fetch(`/api/p/${p.token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureName: n, monthly: monthlyOn }),
      });
      if (!res.ok) {
        let msg = "";
        try {
          msg = (await res.json())?.error?.message || "";
        } catch {}
        setFailMsg(msg);
        throw new Error(String(res.status));
      }
      setSignedName(n);
      setPhase("idle");
      setState("signed");
      requestAnimationFrame(() => document.getElementById("signed-h")?.focus());
    } catch {
      setPhase("failed");
    }
  }

  async function decline() {
    setDeclineBusy(true);
    setDeclineFail(false);
    try {
      const res = await fetch(`/api/p/${p.token}/decline`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
      if (!res.ok) throw new Error(String(res.status));
      setState("declined");
    } catch {
      setDeclineFail(true);
      setDeclineBusy(false);
    }
  }

  const first = (signedName || "").trim().split(/\s+/)[0] || p.contactFirst;
  const busy = phase === "submitting";
  const errCount = Object.keys(errors).length;
  const [chipText, chipTone] = CHIP[state];

  return (
    <>
      <ProposalHeader chip={state === "open" ? `${chipText} · valid until ${p.validUntil}` : chipText} tone={chipTone} />
      <main id="main" className="mx-auto w-full max-w-[880px] px-[clamp(16px,4vw,32px)] pt-10 pb-24 flex flex-col gap-10">
        {state === "expired" || state === "declined" ? <Gone proposal={{ ...p, state }} /> : null}

        {open || signed ? (
          <>
            {preview ? (
              <p role="note" className="m-0 border border-border-2 rounded-xl px-4 py-3 text-sm text-muted-2">
                Preview. This is what the client will see; it isn’t sent yet, so signing is switched off.
              </p>
            ) : null}

            <section className="flex flex-col gap-4">
              <Eyebrow>
                Proposal {p.id} · for {p.business} · valid until {p.validUntil}
              </Eyebrow>
              <h1 className="font-display font-normal text-[clamp(40px,7vw,80px)] leading-[.98] tracking-[-.01em] m-0">{p.headline}</h1>
              <p className="m-0 text-[17px] leading-[1.7] text-muted-2 max-w-[640px]">
                Hi {p.contactFirst}. Here’s what we’d build for {p.business}, what it costs, and what you own. Read it, ask us anything, and sign at the bottom when it looks right. Nothing is charged until you do.
              </p>
              <div className="flex flex-wrap gap-2.5 text-[13px] text-muted-2">
                <span className="border border-border-2 rounded-full px-3 py-1.5">
                  Prepared by {p.preparedBy} · Klyvora, {CONTACT.city}
                </span>
                <span className="border border-border-2 rounded-full px-3 py-1.5">Earliest start {shortDate(p.earliestStart)}</span>
                <span className="border border-border-2 rounded-full px-3 py-1.5">About {p.timeline} to launch</span>
              </div>
            </section>

            <section aria-labelledby="sc-h" className="flex flex-col gap-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                <div className="flex flex-col gap-3">
                  <H2 id="sc-h">What you get</H2>
                  <p className="m-0 text-[15px] leading-[1.7] text-muted-2">
                    {offer.name}. {offer.summary}
                  </p>
                </div>
                <ul className="list-none m-0 p-0 flex flex-col gap-2.5 text-[15px] leading-[1.6]">
                  {p.scope.map((t) => (
                    <li key={t} className="flex gap-3 items-start">
                      <Check />
                      <span>{t}</span>
                    </li>
                  ))}
                  {p.extras ? (
                    <li className="flex gap-3 items-start">
                      <Check />
                      <span>Also included: {p.extras}</span>
                    </li>
                  ) : null}
                </ul>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
                <h3 className="text-[15px] font-medium m-0">What’s capped in this proposal</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 m-0 text-[15px]">
                  {SCOPE_CAPS.map((c) => (
                    <div key={c.key} className="flex justify-between gap-3 border-t border-border py-2">
                      <dt className="text-muted-2">{c.label}</dt>
                      <dd className="m-0 text-right">{p.caps[c.key]}</dd>
                    </div>
                  ))}
                </dl>
                <p className="m-0 text-[13px] text-muted">Anything beyond these caps, like substantial new functionality, gets its own quote before we start.</p>
              </div>
            </section>

            <section aria-labelledby="pr-h" className="flex flex-col gap-4">
              <H2 id="pr-h">The price, in three parts</H2>
              <div className="border border-border rounded-[20px] overflow-hidden bg-surface">
                <div className="flex flex-wrap justify-between items-baseline gap-2.5 px-6 py-5 border-b border-border">
                  <span className="text-[15px] text-muted-2">
                    Build · {offer.name}
                    {addOnLines.length ? ` · ${addOnLines.map((l) => l.label.toLowerCase()).join(", ")}` : ""}
                  </span>
                  <span className="text-[32px] font-medium tabular-nums">
                    {totals.buildFrom ? "from " : ""}
                    {usd(totals.build)}
                  </span>
                </div>
                <ul className="list-none m-0 px-6 py-2 flex flex-col">
                  {totals.schedule.map((m) => (
                    <li key={m.label} className="flex flex-wrap justify-between gap-2 py-3 border-t border-border first:border-t-0 text-[15px]">
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span>
                          {m.label} · {m.percent}%
                        </span>
                        <span className="text-[13px] text-muted">{m.when[0].toUpperCase() + m.when.slice(1)}.</span>
                      </span>
                      <span className="tabular-nums font-medium">{usd(m.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <label
                className={`flex gap-3.5 items-start px-5 py-[18px] rounded-[20px] border bg-surface text-[15px] leading-[1.6] has-[:disabled]:cursor-default cursor-pointer ${monthlyOn ? "border-fg" : "border-border-2"} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-accent-light`}
              >
                <input type="checkbox" checked={monthlyOn} disabled={restaurant || signed} onChange={() => setMonthly((v) => !v)} className="w-[18px] h-[18px] mt-1 m-0 flex-none accent-[var(--accent)]" />
                <span className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">Monthly plan · {restaurant ? "required for restaurants" : "optional"}</span>
                    <span className="font-medium tabular-nums">
                      {usd(totals.monthlyAmount)}/month{totals.usage ? " + usage" : ""}
                    </span>
                  </span>
                  <span className="text-muted-2">
                    {restaurant
                      ? "Ordering, kiosks and kitchen operations run on our platform and need daily care, so the monthly is part of the plan. Starts the day you accept launch."
                      : `${offer.monthlyNote[0].toUpperCase()}${offer.monthlyNote.slice(1)}, your own admin, support and updates. Starts the day you accept launch; cancel any month.`}
                    {!restaurant ? (
                      <>
                        {" "}
                        <strong className="font-medium text-fg">Skip it and you still get the code</strong>: you’d host the site yourself.
                      </>
                    ) : null}
                  </span>
                </span>
              </label>
              <p className="m-0 text-[13px] text-muted leading-[1.6]">
                Card or bank, through Stripe. Billed separately and never rolled into the build: {BILLED_SEPARATELY.map((t) => t[0].toLowerCase() + t.slice(1)).join("; ")}. Prices are frozen for this proposal until it expires.
                {connect ? " Customer payments on your site go to your own Stripe account, and we take $0 of them." : ""}
              </p>
            </section>

            <section aria-labelledby="ow-h" className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              <H2 id="ow-h" className="col-span-full">
                What you own
              </H2>
              {OWNERSHIP_TERMS.map((t) => (
                <div key={t.title} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2 text-[15px] leading-[1.6]">
                  <span className="font-medium">{t.title}</span>
                  <span className="text-muted-2">{t.body}</span>
                </div>
              ))}
            </section>

            <section aria-labelledby="tl-h" className="flex flex-col gap-4">
              <H2 id="tl-h">How it goes</H2>
              <ol className="list-none m-0 p-0 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                {PHASES.map(([t, d]) => (
                  <li key={t} className="flex flex-col gap-2 text-sm leading-normal">
                    <span aria-hidden="true" className="h-[3px] rounded-sm bg-border-2" />
                    <span className="font-medium">{t}</span>
                    <span className="text-muted-2">{d}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="tm-h" className="flex flex-col gap-2.5">
              <H2 id="tm-h" className="mb-1.5">
                The small print, in plain words
              </H2>
              {[
                ["What if I want more than the caps allow?", "Every proposal caps pages, design rounds, integrations, hosting, support hours and minor changes. Small extras are quick; substantial new functionality gets a separate quote before we start."],
                ["Can I cancel the monthly?", restaurant ? "Not while you run ordering, kiosks or kitchen operations on our platform; it’s required for restaurants. Your site, code and data stay yours either way." : "Any month. You keep the site, the code (except licensed templates and platform) and all of your data, with a full export. Hosting, your admin, support and small changes stop at the end of the period, and we send the handover pack first."],
                ["Who owns the data?", "You do: your customers, your content, your domain and your Stripe account. Export it any time, or ask us."],
                ["What if I stop partway?", "[LEGAL TEXT: what happens to work done and milestone payments already made.]"],
              ].map(([q, a]) => (
                <details key={q} className="group border border-border rounded-2xl px-5 bg-surface">
                  <summary className="min-h-14 flex items-center justify-between gap-3 cursor-pointer text-[15px] font-medium list-none">
                    <span>{q}</span>
                    <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  <p className="m-0 pb-[18px] text-[15px] leading-[1.7] text-muted-2">{a}</p>
                </details>
              ))}
              <p className="mt-1.5 mb-0 text-[13px] text-muted">
                Full terms:{" "}
                <Link href="/terms" className={link}>
                  klyvora.ai/terms
                </Link>
                . [DRAFT until the lawyer’s text lands.]
              </p>
            </section>

            <section id="sign" aria-labelledby={signed ? "signed-h" : "sg-h"} className="border border-border-2 rounded-3xl bg-surface p-[clamp(20px,4vw,32px)] flex flex-col gap-[18px] scroll-mt-24">
              {!signed ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <H2 id="sg-h">Accept and sign</H2>
                    <p className="m-0 text-[15px] leading-[1.7] text-muted-2">
                      Signing means yes to the build at <strong className="font-medium text-fg">{usd(totals.build)}</strong>
                      {monthlyOn ? `, plus the ${usd(totals.monthlyAmount)}/month plan from launch` : ", with no monthly plan"}. We’ll email the kickoff invoice ({usd(kickoff)}) and your portal link right after.
                    </p>
                  </div>
                  <form onSubmit={sign} noValidate aria-busy={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                    {phase === "error" && errCount ? (
                      <div role="alert" className="sm:col-span-2 flex gap-3 items-start px-4 py-3.5 rounded-xl border border-fg bg-surface-2 text-sm leading-normal">
                        <span className="flex-none mt-0.5">
                          <ErrorIcon />
                        </span>
                        {errCount === 1 ? "One thing to fix before you can sign." : `${errCount} things to fix before you can sign.`}
                      </div>
                    ) : null}
                    {phase === "failed" ? (
                      <div role="alert" className="sm:col-span-2 flex gap-3 items-start px-4 py-3.5 rounded-xl border border-fg bg-surface-2 text-sm leading-normal">
                        <span className="flex-none mt-0.5">
                          <ErrorIcon />
                        </span>
                        <span>{failMsg || "That didn’t go through, and nothing was signed or charged."} Try again, or call us and we’ll sign it with you.</span>
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <label htmlFor="sg-name" className="text-[13px] text-muted-2">
                        Your full name
                      </label>
                      <input id="sg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears on your business filing" autoComplete="name" aria-required="true" aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "sg-name-err" : undefined} className={input} />
                      {errors.name ? <FieldError id="sg-name-err">{errors.name}</FieldError> : null}
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <label htmlFor="sg-title" className="text-[13px] text-muted-2">
                        Title
                      </label>
                      <input id="sg-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Owner" autoComplete="organization-title" className={input} />
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0 sm:col-span-2">
                      <label htmlFor="sg-email" className="text-[13px] text-muted-2">
                        Email for the signed copy
                      </label>
                      <input id="sg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-required="true" aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? "sg-email-err" : undefined} className={input} />
                      {errors.email ? <FieldError id="sg-email-err">{errors.email}</FieldError> : null}
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <span className="text-[13px] text-muted-2">Signature · type your name</span>
                      <div aria-live="polite" className="min-h-[72px] rounded-xl border border-border-2 bg-surface-2 px-[18px] py-2 flex items-center font-display italic text-[34px] leading-tight break-words">
                        {name.trim() || <span className="text-muted not-italic font-sans text-[15px]">Your name appears here as you type it</span>}
                      </div>
                      <span className="text-xs text-muted">Typed signatures are legally binding (ESIGN Act). We record the time, your IP and this page’s version.</span>
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="flex gap-3 items-start text-sm leading-[1.6] text-muted-2 cursor-pointer min-h-11">
                        <input
                          id="sg-agree"
                          type="checkbox"
                          checked={agree}
                          onChange={() => setAgree((v) => !v)}
                          aria-invalid={errors.agree ? true : undefined}
                          aria-describedby={errors.agree ? "sg-agree-err" : undefined}
                          className="w-[18px] h-[18px] mt-[3px] m-0 flex-none accent-[var(--accent)]"
                        />
                        <span>I’ve read the proposal and the terms. I understand the 50 / 30 / 20 schedule and that the monthly plan is {monthlyWord}.</span>
                      </label>
                      {errors.agree ? <FieldError id="sg-agree-err">{errors.agree}</FieldError> : null}
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap items-center gap-2.5">
                      <button type="submit" disabled={busy || preview} aria-disabled={busy || preview} className={`${pillPrimary} ${btn52} w-full sm:w-auto`}>
                        {busy ? "Signing…" : `Accept and sign · ${usd(totals.build)}`}
                      </button>
                      <Link href="/contact" className={`${pillSecondary} ${btn52}`}>
                        Ask a question first
                      </Link>
                      <button type="button" onClick={() => setDeclining((v) => !v)} aria-expanded={declining} className="bg-transparent border-0 px-2 font-[inherit] text-sm text-muted-2 hover:text-fg underline cursor-pointer min-h-11">
                        Not for us
                      </button>
                    </div>
                    {declining ? (
                      <div className="sm:col-span-2 border border-border-2 rounded-xl p-4 flex flex-col gap-3">
                        <label htmlFor="dc-why" className="text-[13px] text-muted-2">
                          Mind telling us why? (optional)
                        </label>
                        <select id="dc-why" value={reason} onChange={(e) => setReason(e.target.value)} className={`${input} cursor-pointer`}>
                          {["Not now", "Price", "Going with someone else", "Changed my mind", "Other"].map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                        {declineFail ? (
                          <FieldError id="dc-err">That didn’t go through. Nothing changed; try again.</FieldError>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={decline} disabled={declineBusy || preview} className={`${pillSecondary} ${btn48}`}>
                            {declineBusy ? "Working…" : "Yes, decline this proposal"}
                          </button>
                          <button type="button" onClick={() => setDeclining(false)} className="bg-transparent border-0 px-3 font-[inherit] text-sm text-muted-2 hover:text-fg cursor-pointer min-h-12">
                            Keep reading
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </form>
                </>
              ) : (
                <div role="status" className="flex flex-col gap-3.5">
                  <span aria-hidden="true" className="w-12 h-12 rounded-full border border-success text-success inline-flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  </span>
                  <h2 id="signed-h" tabIndex={-1} className="font-display font-normal text-[30px] leading-[1.1] m-0 outline-none">
                    Signed. Welcome aboard, {first}.
                  </h2>
                  <p className="m-0 text-[15px] leading-[1.7] text-muted-2 max-w-[600px]">
                    Signed {p.signedAt || "today"}
                    {signedName ? ` by ${signedName}` : ""} · copy sent to {email || "your inbox"}. Three things happen now:
                  </p>
                  <ol className="m-0 pl-5 text-[15px] leading-[1.8] text-muted-2">
                    <li>
                      The kickoff invoice for <strong className="font-medium text-fg">{usd(kickoff)}</strong> is in your inbox; the build starts when it clears.
                    </li>
                    <li>Your portal link is on its way: follow the build, send photos, approve the demo.</li>
                    <li>{p.preparedBy} calls within one business day to book the kickoff.</li>
                  </ol>
                  {connect ? <p className="m-0 text-[13px] text-muted">Your portal will ask you to connect your own Stripe account so customer payments go straight to you. We take $0 of them.</p> : null}
                  <div className="flex flex-wrap gap-2.5">
                    <Link href="/portal" className={`${pillPrimary} ${btn48}`}>
                      Open your portal
                    </Link>
                    <button type="button" onClick={() => window.print()} className={`${pillSecondary} ${btn48}`}>
                      Print this page
                    </button>
                  </div>
                </div>
              )}
            </section>

            <p className="m-0 text-[13px] text-muted text-center leading-[1.7]">
              Questions? Reply to the email this came in, or call {CONTACT.phone}. Klyvora · {CONTACT.city} ·{" "}
              <Link href="/privacy" className={link}>
                Privacy
              </Link>
            </p>
          </>
        ) : null}
      </main>
    </>
  );
}
