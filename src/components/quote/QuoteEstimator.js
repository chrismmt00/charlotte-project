"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Field, { ErrorIcon } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/Bits";
import { CONTACT } from "@/lib/site";
import { MILESTONES, money } from "@/lib/offers";
import {
  DEFAULT_OFFER_CODE,
  MAX_KIOSKS,
  QUOTE_OFFERS,
  addOnPriceLabel,
  addOnsFor,
  addOnsLede,
  computeEstimate,
  money2,
  monthlyTotalLabel,
  monthlyTotalNote,
  planNote,
  priceLine,
  quoteOffer,
  runningTotal,
  setupTotalLabel,
} from "@/components/quote/estimate";

const STEPS = ["Offer", "Add-ons", "Estimate", "Your details", "Sent"];
const EMPTY = { name: "", business: "", email: "", phone: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPLIT = MILESTONES.map((m) => m.percent).join(" / ");
const MILESTONE_BG = ["bg-accent", "bg-accent-light", "bg-fg"];

function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = "Tell us your name.";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter an email like you@business.com.";
  return e;
}

const headingCls = "text-2xl font-medium m-0 mb-1.5 focus-visible:outline-none";
const ledeCls = "m-0 text-sm text-muted-2 leading-normal";

function Spinner() {
  return <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin inline-block" />;
}

function PlusMinus({ plus }) {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14" />
      {plus ? <path d="M12 5v14" /> : null}
    </svg>
  );
}

// The five-step estimator: offer -> add-ons -> estimate -> details -> sent.
// Posts to POST /api/leads { name, business, email, phone, siteUrl, message, source: "quote", offerCode, quote } -> 201 { id }.
export default function QuoteEstimator({ initialOffer = null }) {
  const [step, setStep] = useState(1);
  const [offerCode, setOfferCode] = useState(() => quoteOffer(initialOffer)?.code || DEFAULT_OFFER_CODE);
  const [picked, setPicked] = useState({});
  const [kiosks, setKiosks] = useState(1);
  const [plan, setPlan] = useState(true);
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | error | submitting | failed | sent
  const headingRef = useRef(null);
  const formRef = useRef(null);
  const moved = useRef(false);

  const offer = quoteOffer(offerCode);
  const addOns = addOnsFor(offer);
  const est = computeEstimate(offer, { picked, kiosks, plan });

  // Move focus to the new step's heading after Back / Next (not on first load).
  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
  }, [step]);

  function goTo(n) {
    moved.current = true;
    setStep(n);
  }

  function pickOffer(code) {
    setOfferCode(code);
    setPicked({});
    setKiosks(1);
  }

  const set = (k) => (ev) => setV((cur) => ({ ...cur, [k]: ev.target.value }));

  async function send() {
    if (status === "submitting") return;
    const e = validate(v);
    setErrors(e);
    if (Object.keys(e).length) {
      setStatus("error");
      document.getElementById(`q-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setStatus("submitting");
    const hp = formRef.current?.elements.namedItem("company_website")?.value || "";
    const addOnText = est.addOns.length
      ? est.addOns.map((a) => (a.quantity > 1 ? `${a.name} × ${a.quantity}` : a.name)).join(", ")
      : "none";
    const message =
      `Estimate from /quote: ${offer.name} (${offer.code}). ` +
      `Setup ${setupTotalLabel(est)}, monthly ${est.monthly ? money(est.monthly) + "/month" : "none"}` +
      `${est.usage ? " plus usage" : ""}. Monthly plan ${est.planOn ? "on" : "off"}. Add-ons: ${addOnText}.`;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          business: v.business,
          email: v.email,
          phone: v.phone,
          siteUrl: "",
          message,
          source: "quote",
          offerCode: offer.code,
          company_website: hp,
          quote: {
            offerCode: offer.code,
            offerName: offer.name,
            monthlyPlan: est.planOn,
            monthlyRequired: est.planRequired,
            addOns: est.addOns,
            setupTotal: est.setup,
            setupFrom: est.setupFrom,
            monthlyTotal: est.monthly,
            usageBilled: est.usage,
            milestones: est.milestones,
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      goTo(5);
    } catch {
      setStatus("failed");
    }
  }

  function next() {
    if (step < 4) goTo(step + 1);
  }

  function back() {
    if (step <= 1) return;
    if (status === "error" || status === "failed") setStatus("idle");
    goTo(step - 1);
  }

  function restart() {
    setPicked({});
    setKiosks(1);
    setErrors({});
    setStatus("idle");
    goTo(1);
  }

  const busy = status === "submitting";
  const errCount = Object.keys(errors).length;
  const nextLabel =
    step === 1 ? "Next: add-ons" : step === 2 ? "See the estimate" : step === 3 ? "Email it to me" : busy ? "Sending…" : status === "failed" ? "Try again" : "Send the estimate";

  return (
    <div className="flex flex-col gap-5">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Step {step} of {STEPS.length}: {STEPS[step - 1]}
      </p>

      <ol aria-label="Steps" className="stepper-quote list-none m-0 p-0 grid grid-cols-5 gap-1.5">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const cur = n === step;
          return (
            <li key={label} aria-current={cur ? "step" : undefined} className="flex flex-col gap-2 min-w-0">
              <span
                aria-hidden="true"
                className={`h-1 rounded-full ${n < step ? "bg-success" : cur ? "bg-accent" : "bg-border"}`}
              />
              <span className={`text-xs whitespace-nowrap overflow-hidden text-ellipsis ${cur ? "text-fg" : "text-muted-2"}`}>
                <span className="tabular-nums">{n}</span> · {label}
                {n < step ? <span className="sr-only"> (done)</span> : null}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="card-step bg-surface border border-border rounded-card-lg p-[clamp(22px,4vw,40px)] box-border flex flex-col gap-[22px] min-w-0">
        {/* STEP 1: OFFER */}
        {step === 1 ? (
          <>
            <fieldset className="m-0 p-0 border-0 min-w-0">
              <legend className="p-0 mb-[22px]">
                <h2 ref={headingRef} tabIndex={-1} className={headingCls}>
                  What are we building?
                </h2>
                <span className={`block ${ledeCls}`}>Pick one. You can change it later.</span>
              </legend>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3">
                {QUOTE_OFFERS.map((o) => {
                  const checked = o.code === offerCode;
                  return (
                    <label
                      key={o.code}
                      className={`card-offer cursor-pointer bg-surface-2 border rounded-card px-5 py-[18px] box-border flex flex-col gap-2 min-h-11 min-w-0 transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-accent-light has-[:focus-visible]:outline-offset-3 ${
                        checked ? "border-accent-light shadow-[0_0_0_1px_var(--accent-light)]" : "border-border hover:border-border-2"
                      }`}
                    >
                      <input
                        type="radio"
                        name="offer"
                        value={o.code}
                        checked={checked}
                        onChange={() => pickOffer(o.code)}
                        className="sr-only"
                      />
                      <span className="flex justify-between items-center gap-2">
                        <span className="text-[11px] tracking-[.2em] text-muted-2 border border-border-2 rounded-full px-[9px] py-[3px]">{o.code}</span>
                        {checked ? (
                          <span aria-hidden="true" className="w-[22px] h-[22px] rounded-full bg-accent inline-flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12l5 5 9-10" />
                            </svg>
                          </span>
                        ) : null}
                      </span>
                      <span className="text-base font-medium">{o.name}</span>
                      <span className="text-[13px] text-muted-2 leading-normal">{o.bestFor}</span>
                      <span className="text-[13px] text-muted-2">{priceLine(o)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <p className="m-0 text-[13px] text-muted-2 leading-relaxed">
              Custom AI harnesses and custom web apps start from a founding price and get a fixed quote;{" "}
              <Link href="/contact" className="text-accent-light hover:text-fg underline underline-offset-2">
                talk to us
              </Link>{" "}
              for those. Not sure which?{" "}
              <Link href="/services" className="text-accent-light hover:text-fg underline underline-offset-2">
                Compare the six
              </Link>
              .
            </p>
          </>
        ) : null}

        {/* STEP 2: ADD-ONS */}
        {step === 2 ? (
          <>
            <div>
              <h2 ref={headingRef} tabIndex={-1} className={headingCls}>
                Anything to add to {offer.name}?
              </h2>
              <p className={ledeCls}>{addOnsLede(offer)}</p>
            </div>
            {addOns.length ? (
              <ul className="list-none m-0 p-0 flex flex-col">
                {addOns.map((a) => {
                  const id = `addon-${a.code.toLowerCase()}`;
                  const on = !!picked[a.code];
                  return (
                    <li key={a.code} className="border-t border-border">
                      <label htmlFor={id} className="flex flex-wrap items-center gap-x-4 gap-y-3 min-h-16 py-3 cursor-pointer">
                        <input
                          id={id}
                          type="checkbox"
                          checked={on}
                          onChange={() => setPicked((cur) => ({ ...cur, [a.code]: !cur[a.code] }))}
                          className="w-5 h-5 accent-[#4E85BF] flex-none m-0"
                        />
                        <span className="flex-[1_1_200px] min-w-0 flex flex-col gap-0.5">
                          <span className="text-[15px] font-medium">{a.name}</span>
                          {a.note ? <span className="text-[13px] text-muted-2">{a.note}</span> : null}
                        </span>
                        <span className="text-sm text-muted-2">{addOnPriceLabel(a)}</span>
                      </label>
                      {a.perDevice && on ? (
                        <div role="group" aria-labelledby={`${id}-qty-l`} className="flex flex-wrap items-center gap-2.5 pl-9 pb-3.5">
                          <span id={`${id}-qty-l`} className="text-[13px] text-muted-2">
                            {offer.code === "RK" ? "Extra kiosks" : "Kiosks"}
                          </span>
                          <button
                            type="button"
                            aria-label="Fewer kiosks"
                            disabled={kiosks <= 1}
                            onClick={() => setKiosks((k) => Math.max(1, k - 1))}
                            className="w-11 h-11 rounded-full border border-border-2 bg-transparent text-fg cursor-pointer inline-flex items-center justify-center disabled:opacity-45 disabled:cursor-not-allowed hover:border-fg"
                          >
                            <PlusMinus />
                          </button>
                          <output aria-live="polite" className="text-[15px] min-w-[2ch] text-center tabular-nums">
                            {kiosks}
                          </output>
                          <button
                            type="button"
                            aria-label="More kiosks"
                            disabled={kiosks >= MAX_KIOSKS}
                            onClick={() => setKiosks((k) => Math.min(MAX_KIOSKS, k + 1))}
                            className="w-11 h-11 rounded-full border border-border-2 bg-transparent text-fg cursor-pointer inline-flex items-center justify-center disabled:opacity-45 disabled:cursor-not-allowed hover:border-fg"
                          >
                            <PlusMinus plus />
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="border-t border-border pt-4 flex flex-col gap-2.5">
                <span className="text-[13px] text-muted-2">Already in the price</span>
                <ul className="list-none m-0 p-0 flex flex-col gap-2.5 text-sm">
                  {offer.includes.map((t) => (
                    <li key={t} className="flex gap-2.5 items-start">
                      <CheckIcon size={18} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border-t border-border pt-3.5 flex flex-wrap justify-between items-center gap-3">
              <span className="flex flex-col gap-0.5 min-w-0 flex-[1_1_220px]">
                <span id="plan-label" className="text-[15px] font-medium">
                  Monthly plan · {money(offer.monthly)}/month{offer.usage ? " + usage" : ""}
                </span>
                <span id="plan-note" className="text-[13px] text-muted-2">
                  {planNote(offer, est.planOn)}
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={est.planOn}
                aria-labelledby="plan-label"
                aria-describedby="plan-note"
                aria-disabled={est.planRequired || undefined}
                onClick={() => {
                  if (!est.planRequired) setPlan((p) => !p);
                }}
                className={`relative flex-none w-12 h-7 p-0 rounded-full border border-border-2 transition-colors duration-200 ${
                  est.planOn ? "bg-accent" : "bg-border"
                } ${est.planRequired ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-[3px] w-5 h-5 rounded-full bg-fg transition-[left] duration-200 ${est.planOn ? "left-[23px]" : "left-[3px]"}`}
                />
              </button>
            </div>
          </>
        ) : null}

        {/* STEP 3: ESTIMATE */}
        {step === 3 ? (
          <>
            <div>
              <h2 ref={headingRef} tabIndex={-1} className={headingCls}>
                Your estimate
              </h2>
              <p className={ledeCls}>Same numbers as the pricing page. Your proposal will say exactly what is included.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex-[1_1_240px] min-w-0 bg-surface-2 border border-border rounded-card px-6 py-[22px] flex flex-col gap-1">
                <span className="text-[13px] text-muted-2">Setup, one time</span>
                <span className="font-display text-5xl leading-none">{setupTotalLabel(est)}</span>
                <span className="text-[13px] text-muted-2">Paid {SPLIT}</span>
              </div>
              <div className="flex-[1_1_240px] min-w-0 bg-surface-2 border border-border rounded-card px-6 py-[22px] flex flex-col gap-1">
                <span className="text-[13px] text-muted-2">Monthly</span>
                <span className="font-display text-5xl leading-none">{monthlyTotalLabel(est)}</span>
                <span className="text-[13px] text-muted-2">{monthlyTotalNote(est)}</span>
              </div>
            </div>
            <ul className="list-none m-0 p-0 flex flex-col text-sm">
              {est.lines.map((l) => (
                <li key={l.name} className="flex justify-between gap-4 min-h-11 py-2.5 items-center border-t border-border">
                  <span className="min-w-0">{l.name}</span>
                  <span className="text-muted-2 text-right tabular-nums">{l.amount}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] text-muted-2">How setup is paid</span>
              <div aria-hidden="true" className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                {est.milestones.map((m, i) => (
                  <span key={m.percent + m.when} className={MILESTONE_BG[i] || "bg-fg"} style={{ flex: m.percent }} />
                ))}
              </div>
              <ul className="list-none m-0 p-0 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[13px]">
                {est.milestones.map((m, i) => (
                  <li key={m.percent + m.when} className="flex gap-2 items-start">
                    <span aria-hidden="true" className={`sm:hidden mt-1 w-2 h-2 rounded-full flex-none ${MILESTONE_BG[i] || "bg-fg"}`} />
                    <span>
                      <strong className="font-medium">
                        {m.percent}% {m.when}
                      </strong>
                      <br />
                      <span className="text-muted-2 tabular-nums">
                        {est.setupFrom ? "from " : ""}
                        {money2(m.amount)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="m-0 text-[13px] text-muted-2 leading-relaxed">
              Billed separately: hardware, onsite installation and travel, payment processing, delivery services, third-party
              subscriptions, and AI or messaging usage. Founding customers may qualify for a reduced setup; monthly prices are the same
              for everyone.
            </p>
          </>
        ) : null}

        {/* STEP 4: DETAILS */}
        {step === 4 ? (
          <>
            <div>
              <h2 ref={headingRef} tabIndex={-1} className={headingCls}>
                Where should we send it?
              </h2>
              <p className={ledeCls}>We email the estimate and keep a copy so we can pick up where you left off. No list, no cookies.</p>
            </div>
            {status === "error" && errCount ? (
              <div role="alert" className="form-banner flex gap-3 items-start px-4 py-3.5 rounded-input border border-fg bg-surface text-sm leading-normal">
                <span className="flex-none mt-0.5">
                  <ErrorIcon />
                </span>
                <span>{errCount === 1 ? "One thing needs a look below." : `${errCount === 2 ? "Two" : errCount} things need a look below.`}</span>
              </div>
            ) : null}
            <form
              id="form-quote"
              ref={formRef}
              noValidate
              aria-busy={busy}
              onSubmit={(ev) => {
                ev.preventDefault();
                send();
              }}
              className="form-quote grid grid-cols-1 sm:grid-cols-2 gap-3.5"
            >
              <Field id="q-name" label="Your name" required placeholder="Jordan" value={v.name} onChange={set("name")} error={errors.name} autoComplete="name" />
              <Field id="q-email" label="Email" required type="email" placeholder="you@business.com" value={v.email} onChange={set("email")} error={errors.email} autoComplete="email" />
              <Field id="q-business" label="Business" placeholder="Jordan's Barbershop" value={v.business} onChange={set("business")} autoComplete="organization" />
              <Field id="q-phone" label="Phone" type="tel" placeholder="(704) 555-0100" value={v.phone} onChange={set("phone")} autoComplete="tel" />
              {/* Honeypot: hidden from people, bots fill it in. */}
              <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                <label htmlFor="q-company_website">Company website</label>
                <input id="q-company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              {status === "failed" ? (
                <div role="alert" className="form-failure sm:col-span-2 flex gap-3 items-start px-4 py-3.5 rounded-input border border-fg bg-surface text-sm leading-normal">
                  <span className="flex-none mt-0.5">
                    <ErrorIcon />
                  </span>
                  <span>
                    That didn&apos;t send. Your estimate is still here. Try again, or email{" "}
                    <a href={CONTACT.emailHref} className="text-accent-light hover:text-fg">
                      {CONTACT.email}
                    </a>
                    .
                  </span>
                </div>
              ) : null}
              <span className="sm:col-span-2 text-xs text-muted-2">
                We only use this to send your estimate and reply to you.{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-fg">
                  Privacy
                </Link>
                .
              </span>
            </form>
          </>
        ) : null}

        {/* STEP 5: SENT */}
        {step === 5 ? (
          <div role="status" className="flex flex-col gap-3.5 items-start">
            <CheckIcon size={32} />
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-display italic font-normal text-[clamp(32px,4vw,44px)] leading-[1.05] m-0 break-words max-w-full focus-visible:outline-none"
            >
              Sent to {v.email.trim()}.
            </h2>
            <p className="m-0 text-[15px] leading-[1.7] text-muted-2 max-w-[560px]">
              {offer.name}: {setupTotalLabel(est)} setup, {monthlyTotalLabel(est)} monthly. The email has the line items and the {SPLIT}
              schedule. A person in Charlotte reads every estimate and replies within one business day.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button href="/contact">Book a free 30-minute call</Button>
              <Button href="/pricing" variant="secondary">
                See every price
              </Button>
              <Button variant="ghost" onClick={restart}>
                Start over
              </Button>
            </div>
          </div>
        ) : null}

        {/* NAV */}
        {step < 5 ? (
          <div className="flex flex-wrap justify-between items-center gap-3 border-t border-border pt-5">
            <Button variant="secondary" onClick={back} disabled={step === 1} className="!px-6">
              <span aria-hidden="true">←</span> Back
            </Button>
            <span className="order-first basis-full sm:order-none sm:basis-auto text-sm text-muted-2 tabular-nums">{runningTotal(est)}</span>
            {step === 4 ? (
              <Button type="submit" form="form-quote" aria-disabled={busy || undefined} aria-busy={busy || undefined}>
                {busy ? <Spinner /> : null}
                {nextLabel}
              </Button>
            ) : (
              <Button onClick={next}>{nextLabel}</Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
