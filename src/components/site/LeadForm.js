"use client";

import Link from "next/link";
import { useState } from "react";
import Field, { ErrorIcon } from "@/components/ui/Field";
import { CONTACT } from "@/lib/site";
import { OFFERS, getOffer, money } from "@/lib/offers";

const EMPTY = { name: "", business: "", email: "", phone: "", siteUrl: "", message: "", offerCode: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = "Tell us your name.";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter an email like you@business.com.";
  if (v.message.trim().length < 10) e.message = "A sentence or two is enough.";
  return e;
}

// The quote / contact form. Five states: idle, validation error, submitting, sent, failed.
// Posts to POST /api/leads { name, business, email, phone, siteUrl, message, source, offerCode? } -> 201 { id }.
function optionLabel(o) {
  if (o.setupFrom) return `${o.name} · from ${money(o.setup)}`;
  return `${o.name} · ${money(o.setup)} + ${money(o.monthly)}/mo${o.usage ? " + usage" : ""}`;
}

export default function LeadForm({
  source = "contact",
  offerCode = null,
  offerName = null,
  showSiteUrl = false,
  showOffer = false,
  messageLabel,
}) {
  const initialOffer = offerCode && getOffer(offerCode) ? offerCode : "";
  const [v, setV] = useState({ ...EMPTY, offerCode: initialOffer });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const set = (k) => (ev) => setV((cur) => ({ ...cur, [k]: ev.target.value }));

  async function onSubmit(ev) {
    ev.preventDefault();
    if (status === "submitting") return;
    const e = validate(v);
    setErrors(e);
    if (Object.keys(e).length) {
      setStatus("error");
      const first = Object.keys(e)[0];
      document.getElementById(`lead-${first}`)?.focus();
      return;
    }
    setStatus("submitting");
    const hp = ev.currentTarget.elements.namedItem("company_website")?.value || "";
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, source, offerCode: v.offerCode || null, company_website: hp }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    const first = v.name.trim().split(/\s+/)[0];
    const chosen = getOffer(v.offerCode);
    const savedWith = offerName || (chosen ? chosen.name : null);
    return (
      <div role="status" className="form-success flex-[1_1_480px] min-w-0 bg-surface border border-border rounded-card p-8 box-border flex flex-col gap-3.5 self-start">
        <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
          <path d="M5 12l5 5 9-10" />
        </svg>
        <h3 className="font-display italic font-normal text-[32px] leading-[1.05] m-0">Thanks, {first}. Got it.</h3>
        <p className="m-0 text-[15px] leading-[1.7] text-muted-2">
          A person in Charlotte replies within one business day.
          {savedWith ? ` Your note is saved with ${savedWith}.` : ""}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/pricing"
            className="rounded-full text-sm font-medium px-[22px] py-3 bg-transparent text-fg border-2 border-border inline-flex items-center min-h-11 box-border hover:border-border-2"
          >
            See every price
          </Link>
          <button
            type="button"
            onClick={() => {
              setV({ ...EMPTY, offerCode: initialOffer });
              setErrors({});
              setStatus("idle");
            }}
            className="rounded-full text-sm font-medium px-2 py-3 bg-transparent text-accent-light border-0 cursor-pointer min-h-11 hover:text-fg"
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  const busy = status === "submitting";
  const errCount = Object.keys(errors).length;
  return (
    <form
      id="form-contact"
      onSubmit={onSubmit}
      noValidate
      aria-busy={busy}
      className="form-contact flex-[1_1_480px] min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3.5 content-start"
    >
      {status === "error" && errCount ? (
        <div role="alert" className="form-banner sm:col-span-2 flex gap-3 items-start px-4 py-3.5 rounded-input border border-fg bg-surface text-sm leading-normal">
          <span className="flex-none mt-0.5">
            <ErrorIcon />
          </span>
          <span>
            {errCount === 1 ? "One thing to fix before this can send." : `${errCount} things to fix before this can send.`}
          </span>
        </div>
      ) : null}
      <Field id="lead-name" label="Your name" required placeholder="Jordan" value={v.name} onChange={set("name")} error={errors.name} autoComplete="name" />
      <Field id="lead-business" label="Business" placeholder="Jordan's Barbershop" value={v.business} onChange={set("business")} autoComplete="organization" />
      <Field id="lead-email" label="Email" required type="email" placeholder="you@business.com" value={v.email} onChange={set("email")} error={errors.email} autoComplete="email" />
      <Field id="lead-phone" label="Phone" type="tel" placeholder="(704) 555-0100" value={v.phone} onChange={set("phone")} autoComplete="tel" />
      {showOffer ? (
        <div className="flex flex-col gap-1.5 min-w-0 sm:col-span-2">
          <label htmlFor="lead-offerCode" className="text-xs text-muted-2">
            What do you need?
          </label>
          <div className="relative">
            <select
              id="lead-offerCode"
              name="offerCode"
              value={v.offerCode}
              onChange={set("offerCode")}
              className="appearance-none bg-surface-2 border border-border rounded-input pl-[17px] pr-11 py-[15px] text-sm text-fg min-h-12 w-full cursor-pointer"
            >
              <option value="">Not sure yet</option>
              {OFFERS.map((o) => (
                <option key={o.code} value={o.code}>
                  {optionLabel(o)}
                </option>
              ))}
            </select>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-2 pointer-events-none">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      ) : null}
      {showSiteUrl ? (
        <Field
          id="lead-siteUrl"
          label="Current website, if you have one"
          type="url"
          placeholder="https://"
          value={v.siteUrl}
          onChange={set("siteUrl")}
          className="sm:col-span-2"
        />
      ) : null}
      <Field
        id="lead-message"
        label={messageLabel || "What's eating your time right now?"}
        required
        textarea
        rows={4}
        placeholder="We take bookings by DM and lose track. Our site is from 2016."
        value={v.message}
        onChange={set("message")}
        error={errors.message}
        className="sm:col-span-2"
      />
      {/* Honeypot: hidden from people, bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="company_website">Company website</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {status === "failed" ? (
        <div role="alert" className="form-failure sm:col-span-2 flex gap-3 items-start px-4 py-3.5 rounded-input border border-fg bg-surface text-sm leading-normal">
          <span className="flex-none mt-0.5">
            <ErrorIcon />
          </span>
          <span>
            That didn&apos;t send. Your text is still here. Try again, or email{" "}
            <a href={CONTACT.emailHref} className="text-accent-light hover:text-fg">
              {CONTACT.email}
            </a>
            .
          </span>
        </div>
      ) : null}
      <button
        type="submit"
        aria-disabled={busy}
        className={`sm:col-span-2 rounded-full text-sm font-medium p-4 bg-fg text-bg border-2 border-transparent cursor-pointer min-h-12 inline-flex items-center justify-center gap-2 transition-[transform,opacity] duration-300 hover:-translate-y-0.5 ${
          busy ? "opacity-70" : ""
        }`}
      >
        {busy ? (
          <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin inline-block" />
        ) : null}
        {busy ? "Sending…" : status === "failed" ? "Try again" : "Send it over"}
      </button>
      <span className="sm:col-span-2 text-xs text-muted-2">
        We only use this to reply to you. No list, no tracking cookies.{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-fg">
          Privacy
        </Link>
        .
      </span>
    </form>
  );
}
