"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Field, { ErrorIcon } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/Bits";
import { CONTACT } from "@/lib/site";
import { BILLED_SEPARATELY, NEEDS_CONNECT, OWNERSHIP_TERMS, SCOPE_CAPS, computeTotals, isRestaurant, usd } from "./model";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CHIP = {
  draft: "Preview · not sent yet",
  open: "Open",
  signed: "Signed",
  expired: "Expired",
  declined: "Declined",
};

const PHASES = [
  ["Kickoff", "A 30-minute call, your photos and prices, the domain. We write the pages."],
  ["Working demo", "A real link you can tap through. Rounds of changes are capped on this proposal."],
  ["Launch", "Domain switched, everything live. You accept the launch and the last 20% falls due."],
  ["After", "Monthly plan: we host it and fix things. Self-managed: you get the handover pack."],
];

function Eyebrow({ children }) {
  return <div className="text-[11px] tracking-[.3em] uppercase text-muted-2">{children}</div>;
}

function H2({ id, children }) {
  return (
    <h2 id={id} className="font-display text-[30px] leading-[1.1] m-0 font-normal">
      {children}
    </h2>
  );
}

function Gone({ proposal }) {
  const expired = proposal.state === "expired";
  return (
    <section className="flex flex-col items-center text-center gap-3.5 py-10">
      <Eyebrow>
        Proposal · {expired ? "expired" : "declined"} {expired ? proposal.expiredAt : proposal.declinedAt}
      </Eyebrow>
      <h1 className="font-display font-normal text-[clamp(36px,8vw,64px)] leading-none m-0">{expired ? "This proposal has expired." : "You passed on this one."}</h1>
      <p className="m-0 text-[15px] leading-[1.7] text-muted-2 max-w-[520px]">
        {expired
          ? "Prices were held while the proposal was open. Nothing was charged and nothing is lost: ask and we’ll send a fresh copy, usually at the same numbers."
          : "Thanks for telling us. Nothing was charged. If the timing changes, the offer is still here: reply to the email or call and we’ll pick it up where we left it."}
      </p>
      <div className="flex flex-wrap justify-center gap-2.5 mt-1">
        <Button href="/contact">Ask for a fresh one</Button>
        {CONTACT.phoneHref ? (
          <Button href={CONTACT.phoneHref} variant="secondary">
            Call {CONTACT.phone}
          </Button>
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
  const formRef = useRef(null);

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

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 sm:px-8 pt-8 pb-24 flex flex-col gap-10">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-muted-2">Proposal {p.id}</span>
        <span className={`text-[13px] border rounded-full px-3 py-1 ${signed ? "border-success text-success" : "border-border-2 text-muted-2"}`}>
          {CHIP[state]}
          {state === "open" ? ` · valid until ${p.validUntil}` : ""}
        </span>
      </div>

      {state === "expired" || state === "declined" ? <Gone proposal={{ ...p, state }} /> : null}

      {open || signed ? (
        <>
          {preview ? (
            <p role="note" className="m-0 border border-border-2 rounded-input px-4 py-3 text-sm text-muted-2">
              Preview. This is what the client will see; it isn’t sent yet, so signing is switched off.
            </p>
          ) : null}

          <section className="flex flex-col gap-4">
            <Eyebrow>
              Proposal {p.id} · for {p.business} · valid until {p.validUntil}
            </Eyebrow>
            <h1 className="font-display font-normal text-[clamp(40px,8vw,80px)] leading-[.98] tracking-[-.01em] m-0">{p.headline}</h1>
            <p className="m-0 text-[17px] leading-[1.7] text-muted-2 max-w-[640px]">
              Hi {p.contactFirst}. Here’s what we’d build for {p.business}, what it costs, and what you own. Read it, ask us anything, and sign at the bottom when it looks right. Nothing is charged until you do.
            </p>
            <div className="flex flex-wrap gap-2.5 text-[13px] text-muted-2">
              <span className="border border-border-2 rounded-full px-3 py-1.5">Prepared by {p.preparedBy} · Klyvora, {CONTACT.city}</span>
              <span className="border border-border-2 rounded-full px-3 py-1.5">Earliest start {p.earliestStart}</span>
              <span className="border border-border-2 rounded-full px-3 py-1.5">About {p.timeline} to launch</span>
            </div>
          </section>

          <section aria-labelledby="sc-h" className="flex flex-col gap-4">
            <H2 id="sc-h">What you get</H2>
            <p className="m-0 text-[15px] leading-[1.7] text-muted-2">{offer.summary}</p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5 text-[15px] leading-[1.6]">
              {p.scope.map((t) => (
                <li key={t} className="flex gap-3 items-start">
                  <CheckIcon size={20} className="text-success mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
              {p.extras ? (
                <li className="flex gap-3 items-start">
                  <CheckIcon size={20} className="text-success mt-0.5" />
                  <span>Also included: {p.extras}</span>
                </li>
              ) : null}
            </ul>
            <div className="border border-border rounded-card bg-surface p-5">
              <h3 className="text-sm font-medium m-0 mb-3">What’s capped in this proposal</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 m-0 text-sm">
                {SCOPE_CAPS.map((c) => (
                  <div key={c.key} className="flex justify-between gap-3 border-b border-border py-1.5">
                    <dt className="text-muted-2">{c.label}</dt>
                    <dd className="m-0 text-right">{p.caps[c.key]}</dd>
                  </div>
                ))}
              </dl>
              <p className="m-0 mt-3 text-[13px] text-muted-2">Anything beyond these caps, like substantial new functionality, gets its own quote before we start.</p>
            </div>
          </section>

          <section aria-labelledby="pr-h" className="flex flex-col gap-4">
            <H2 id="pr-h">The price, in three parts</H2>
            <div className="border border-border rounded-card bg-surface overflow-hidden">
              <div className="flex flex-wrap justify-between items-baseline gap-2.5 px-5 sm:px-6 py-5 border-b border-border">
                <span className="text-[15px] text-muted-2">
                  Build · {offer.name}
                  {addOnLines.length ? ` · ${addOnLines.map((l) => l.label.toLowerCase()).join(", ")}` : ""}
                </span>
                <span className="text-[32px] font-medium tabular-nums">
                  {totals.buildFrom ? "from " : ""}
                  {usd(totals.build)}
                </span>
              </div>
              <ul className="list-none m-0 px-5 sm:px-6 py-2 flex flex-col">
                {totals.schedule.map((m) => (
                  <li key={m.label} className="flex flex-wrap justify-between gap-2 py-3 border-t border-border first:border-t-0 text-[15px]">
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span>
                        {m.label} · {m.percent}%
                      </span>
                      <span className="text-[13px] text-muted-2">{m.when[0].toUpperCase() + m.when.slice(1)}.</span>
                    </span>
                    <span className="tabular-nums font-medium">{usd(m.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <label
              className={`flex gap-3.5 items-start p-5 rounded-card border bg-surface text-[15px] leading-relaxed ${restaurant ? "cursor-default" : "cursor-pointer"} ${monthlyOn ? "border-fg" : "border-border-2"} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-fg`}
            >
              <input
                type="checkbox"
                checked={monthlyOn}
                disabled={restaurant || state === "signed"}
                onChange={() => setMonthly((v) => !v)}
                className="w-[22px] h-[22px] mt-0.5 flex-none accent-[var(--accent)]"
              />
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
            <p className="m-0 text-[13px] text-muted-2 leading-relaxed">
              Card or bank, through Stripe. Billed separately and never rolled into the build: {BILLED_SEPARATELY.map((t) => t[0].toLowerCase() + t.slice(1)).join("; ")}. Prices are frozen for this proposal until it expires.
              {connect ? " Customer payments on your site go to your own Stripe account, and we take $0 of them." : ""}
            </p>
          </section>

          <section aria-labelledby="ow-h" className="flex flex-col gap-4">
            <H2 id="ow-h">What you own</H2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              {OWNERSHIP_TERMS.map((t) => (
                <div key={t.title} className="bg-surface border border-border rounded-card p-5 flex flex-col gap-2 text-[15px] leading-relaxed">
                  <span className="font-medium">{t.title}</span>
                  <span className="text-muted-2">{t.body}</span>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="tl-h" className="flex flex-col gap-4">
            <H2 id="tl-h">How it goes</H2>
            <ol className="list-none p-0 m-0 flex flex-col gap-4">
              {PHASES.map(([t, d], i) => (
                <li key={t} className="flex gap-4 items-start">
                  <span aria-hidden="true" className="w-8 h-8 rounded-full border border-border-2 inline-flex items-center justify-center text-[13px] text-muted-2 flex-none">
                    {i + 1}
                  </span>
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-[15px]">{t}</span>
                    <span className="text-[15px] text-muted-2 leading-relaxed">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="tm-h" className="flex flex-col gap-3">
            <H2 id="tm-h">The small print, in plain words</H2>
            {[
              ["What if I want more than the caps allow?", "Every proposal caps pages, design rounds, integrations, hosting, support hours and minor changes. Small extras are quick; substantial new functionality gets a separate quote before we start."],
              ["Can I cancel the monthly?", restaurant ? "Not while you run ordering, kiosks or kitchen operations on our platform; it’s required for restaurants. Your site, code and data stay yours either way." : "Any month. You keep the site, the code (except licensed templates and platform) and all of your data, with a full export. Hosting, your admin, support and small changes stop at the end of the period, and we send the handover pack first."],
              ["Who owns the data?", "You do: your customers, your content, your domain and your Stripe account. Export it any time, or ask us."],
              ["What if I stop partway?", "[LEGAL TEXT: what happens to work done and milestone payments already made.]"],
            ].map(([q, a]) => (
              <details key={q} className="group border border-border rounded-card bg-surface px-5 py-1">
                <summary className="min-h-12 flex items-center justify-between gap-3 cursor-pointer text-[15px] list-none">
                  {q}
                  <span aria-hidden="true" className="text-muted-2 transition-transform group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <p className="m-0 pb-4 text-[15px] leading-relaxed text-muted-2">{a}</p>
              </details>
            ))}
            <p className="m-0 text-[13px] text-muted-2">
              Full terms: <Link href="/terms" className="text-accent-light underline underline-offset-2 hover:text-fg">klyvora.ai/terms</Link>. [DRAFT until the lawyer’s text lands.]
            </p>
          </section>

          <section id="sign" aria-labelledby={signed ? "signed-h" : "sg-h"} className="flex flex-col gap-4 scroll-mt-24">
            {!signed ? (
              <>
                <H2 id="sg-h">Accept and sign</H2>
                <p className="m-0 text-[15px] leading-[1.7] text-muted-2">
                  Signing means yes to the build at <strong className="text-fg font-medium">{usd(totals.build)}</strong>
                  {monthlyOn ? `, plus the ${usd(totals.monthlyAmount)}/month plan from launch` : ", with no monthly plan"}. We’ll email the kickoff invoice ({usd(kickoff)}) and your portal link right after.
                </p>
                <form ref={formRef} onSubmit={sign} noValidate aria-busy={busy} className="bg-surface border border-border rounded-card p-5 sm:p-6 flex flex-col gap-4">
                  {phase === "error" && errCount ? (
                    <div role="alert" className="flex gap-3 items-start px-4 py-3.5 rounded-input border border-fg bg-surface-2 text-sm leading-normal">
                      <span className="flex-none mt-0.5">
                        <ErrorIcon />
                      </span>
                      {errCount === 1 ? "One thing to fix before you can sign." : `${errCount} things to fix before you can sign.`}
                    </div>
                  ) : null}
                  {phase === "failed" ? (
                    <div role="alert" className="flex gap-3 items-start px-4 py-3.5 rounded-input border border-fg bg-surface-2 text-sm leading-normal">
                      <span className="flex-none mt-0.5">
                        <ErrorIcon />
                      </span>
                      <span>
                        {failMsg || "That didn’t go through, and nothing was signed or charged."} Try again, or call us and we’ll sign it with you.
                      </span>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="sg-name" label="Your full name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears on your business filing" autoComplete="name" error={errors.name} />
                    <Field id="sg-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Owner" autoComplete="organization-title" />
                  </div>
                  <Field id="sg-email" label="Email for the signed copy" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" error={errors.email} />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-2">Signature · typed from your name</span>
                    <div aria-live="polite" className="min-h-14 rounded-input border border-dashed border-border-2 px-4 py-3 font-display italic text-[28px] leading-tight break-words">
                      {name.trim() || <span className="text-muted-2 text-[16px] not-italic font-sans">Your name appears here as you type it</span>}
                    </div>
                    <span className="text-xs text-muted-2">Typed signatures are legally binding (ESIGN Act). We record the time, your IP address and this page’s version.</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex gap-3 items-start text-[15px] leading-relaxed min-h-11 cursor-pointer">
                      <input
                        id="sg-agree"
                        type="checkbox"
                        checked={agree}
                        onChange={() => setAgree((v) => !v)}
                        aria-invalid={errors.agree ? true : undefined}
                        aria-describedby={errors.agree ? "sg-agree-err" : undefined}
                        className="w-[22px] h-[22px] mt-0.5 flex-none accent-[var(--accent)]"
                      />
                      <span>I’ve read the proposal and the terms. I understand the 50 / 30 / 20 schedule and that the monthly plan is {monthlyWord}.</span>
                    </label>
                    {errors.agree ? (
                      <span id="sg-agree-err" className="text-xs text-fg flex items-center gap-1.5">
                        <ErrorIcon />
                        {errors.agree}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button type="submit" disabled={busy || preview} aria-disabled={busy || preview} className="w-full sm:w-auto">
                      {busy ? "Signing…" : `Accept and sign · ${usd(totals.build)}`}
                    </Button>
                    <Button href="/contact" variant="ghost">
                      Ask a question first
                    </Button>
                    <button type="button" onClick={() => setDeclining((v) => !v)} aria-expanded={declining} className="min-h-11 px-2 bg-transparent border-0 text-sm text-muted-2 hover:text-fg cursor-pointer">
                      Not for us
                    </button>
                  </div>
                  {declining ? (
                    <div className="border border-border-2 rounded-input p-4 flex flex-col gap-3">
                      <label htmlFor="dc-why" className="text-xs text-muted-2">
                        Mind telling us why? (optional)
                      </label>
                      <select id="dc-why" value={reason} onChange={(e) => setReason(e.target.value)} className="bg-surface-2 border border-border rounded-input px-4 min-h-12 text-sm text-fg">
                        {["Not now", "Price", "Going with someone else", "Changed my mind", "Other"].map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                      {declineFail ? (
                        <span role="alert" className="text-xs text-fg flex items-center gap-1.5">
                          <ErrorIcon />
                          That didn’t go through. Nothing changed; try again.
                        </span>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={decline} disabled={declineBusy || preview} className="!min-h-11 !py-2">
                          {declineBusy ? "Working…" : "Yes, decline this proposal"}
                        </Button>
                        <Button variant="ghost" onClick={() => setDeclining(false)}>
                          Keep reading
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </form>
              </>
            ) : (
              <div role="status" className="bg-surface border border-border rounded-card p-6 sm:p-8 flex flex-col gap-3.5">
                <CheckIcon size={28} />
                <h2 id="signed-h" tabIndex={-1} className="font-display italic font-normal text-[clamp(30px,6vw,40px)] leading-[1.05] m-0 outline-none">
                  Signed. Welcome aboard, {first}.
                </h2>
                <p className="m-0 text-[15px] leading-[1.7] text-muted-2">
                  Signed {p.signedAt || "today"}
                  {signedName ? ` by ${signedName}` : ""} · a copy goes to {email || "your inbox"}. Three things happen now:
                </p>
                <ol className="m-0 pl-5 flex flex-col gap-1.5 text-[15px] leading-relaxed text-muted-2">
                  <li>
                    The kickoff invoice for <strong className="text-fg font-medium">{usd(kickoff)}</strong> is in your inbox; the build starts when it clears.
                  </li>
                  <li>Your portal link is on its way: follow the build, send photos, approve the demo.</li>
                  <li>We call within one business day to book the kickoff.</li>
                </ol>
                {connect ? <p className="m-0 text-[13px] text-muted-2">Your portal will ask you to connect your own Stripe account so customer payments go straight to you. We take $0 of them.</p> : null}
                <div className="flex flex-wrap gap-2.5 mt-1">
                  <Button href="/portal">Open your portal</Button>
                  <Button variant="secondary" onClick={() => window.print()}>
                    Print this page
                  </Button>
                </div>
              </div>
            )}
          </section>

          <p className="m-0 text-[13px] text-muted-2 leading-relaxed">
            Questions? Reply to the email this came in, or call {CONTACT.phone}. Klyvora · {CONTACT.city} ·{" "}
            <Link href="/privacy" className="text-accent-light underline underline-offset-2 hover:text-fg">
              Privacy
            </Link>
          </p>
        </>
      ) : null}
    </div>
  );
}
