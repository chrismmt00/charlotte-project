"use client";

import Link from "next/link";
import { useState } from "react";
import Field, { ErrorIcon } from "@/components/ui/Field";
import { CONTACT } from "@/lib/site";

const EMPTY = { name: "", business: "", email: "", phone: "", message: "", firstSite: true };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER = ["name", "business", "email", "message", "firstSite"];

function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = "Tell us your name.";
  if (!v.business.trim()) e.business = "Which business is this for?";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter an email like you@business.com.";
  if (v.message.trim().length < 10) e.message = "A sentence or two is enough.";
  if (!v.firstSite) e.firstSite = true;
  return e;
}

// The founding-slot application. Same five states and JSON shape as LeadForm:
// idle, validation error, submitting, sent, failed.
// Posts to POST /api/leads { name, business, email, phone, siteUrl, message, source: "founding", offerCode: null, meta: { firstSite } }.
export default function FoundingForm() {
  const [v, setV] = useState(EMPTY);
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
      const first = ORDER.find((k) => e[k]);
      document.getElementById(`fa-${first}`)?.focus();
      return;
    }
    setStatus("submitting");
    const hp = ev.currentTarget.elements.namedItem("company_website")?.value || "";
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
          message: v.message,
          source: "founding",
          offerCode: null,
          meta: { firstSite: v.firstSite },
          company_website: hp,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    const first = v.name.trim().split(/\s+/)[0];
    return (
      <div role="status" className="form-success flex flex-col items-start gap-4 py-3">
        <span aria-hidden="true" className="w-14 h-14 rounded-full border border-[rgba(var(--success-rgb),.4)] bg-[rgba(var(--success-rgb),.08)] flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
            <path d="M5 12l5 5 9-10" />
          </svg>
        </span>
        <h3 className="font-display italic font-normal text-[40px] leading-[1.05] m-0">Application in, {first}.</h3>
        <p className="text-[15px] leading-[1.7] text-muted-2 m-0 max-w-[420px]">
          We reply within a day to set up a call. Slots go in order of application; we’ll tell you where you stand.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/quote"
            className="rounded-full text-sm font-medium px-6 bg-transparent text-fg border-2 border-border inline-flex items-center justify-center min-h-12 box-border hover:border-border-2"
          >
            See what it would cost
          </Link>
          <button
            type="button"
            onClick={() => {
              setV(EMPTY);
              setErrors({});
              setStatus("idle");
            }}
            className="rounded-full text-sm font-medium px-2 bg-transparent text-accent-light border-0 cursor-pointer min-h-12 hover:text-fg"
          >
            Back to the form
          </button>
        </div>
      </div>
    );
  }

  const busy = status === "submitting";
  const errCount = Object.keys(errors).length;
  return (
    <form id="form-founding" onSubmit={onSubmit} noValidate aria-busy={busy} className="form-founding flex flex-wrap gap-3.5">
      {status === "error" && errCount ? (
        <div role="alert" className="form-banner basis-full flex gap-3 items-start px-4 py-3.5 rounded-input border border-fg bg-surface-2 text-sm leading-normal">
          <span className="flex-none mt-0.5">
            <ErrorIcon />
          </span>
          <span>{errCount === 1 ? "One thing needs a look below." : `${errCount} things need a look below.`}</span>
        </div>
      ) : null}
      <Field id="fa-name" label="Your name" required placeholder="Jordan" value={v.name} onChange={set("name")} error={errors.name} autoComplete="name" className="flex-[1_1_220px]" />
      <Field
        id="fa-business"
        label="Business"
        required
        placeholder="Jordan’s Barbershop"
        value={v.business}
        onChange={set("business")}
        error={errors.business}
        autoComplete="organization"
        className="flex-[1_1_220px]"
      />
      <Field
        id="fa-email"
        label="Email"
        required
        type="email"
        placeholder="you@business.com"
        value={v.email}
        onChange={set("email")}
        error={errors.email}
        autoComplete="email"
        className="flex-[1_1_220px]"
      />
      <Field id="fa-phone" label="Phone" type="tel" placeholder="(704) 555-0100" value={v.phone} onChange={set("phone")} autoComplete="tel" className="flex-[1_1_220px]" />
      <Field
        id="fa-message"
        label="Tell us about your business"
        required
        textarea
        rows={4}
        placeholder="What you sell, where you are, and how customers find you today."
        value={v.message}
        onChange={set("message")}
        error={errors.message}
        className="basis-full"
      />
      <div className="basis-full flex flex-col gap-1.5">
        <label htmlFor="fa-firstSite" className="flex items-center gap-3 min-h-11 text-sm text-fg cursor-pointer">
          <input
            id="fa-firstSite"
            name="firstSite"
            type="checkbox"
            checked={v.firstSite}
            onChange={() => setV((cur) => ({ ...cur, firstSite: !cur.firstSite }))}
            aria-invalid={errors.firstSite ? true : undefined}
            aria-describedby={errors.firstSite ? "fa-firstSite-err" : undefined}
            aria-required="true"
            className="w-5 h-5 m-0 flex-none accent-accent"
          />
          <span>
            This would be our first website or online store
            <span aria-hidden="true" className="text-accent-light">
              {" "}
              *
            </span>
          </span>
        </label>
        {errors.firstSite ? (
          <span id="fa-firstSite-err" className="text-xs text-fg flex flex-wrap items-center gap-1.5 ml-8">
            <ErrorIcon />
            Founding slots are for businesses going online for the first time. Not you?
            <Link href="/contact" className="text-accent-light hover:text-fg underline underline-offset-2">
              Get a regular quote
            </Link>
            .
          </span>
        ) : null}
      </div>
      {/* Honeypot: hidden from people, bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="founding_company_website">Company website</label>
        <input id="founding_company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {status === "failed" ? (
        <div role="alert" className="form-failure basis-full flex gap-3 items-start px-4 py-3.5 rounded-input border border-fg bg-surface-2 text-sm leading-normal">
          <span className="flex-none mt-0.5">
            <ErrorIcon />
          </span>
          <span>
            That didn’t send. Your answers are still here. Try again, or email{" "}
            <a href={CONTACT.emailHref} className="text-accent-light hover:text-fg">
              {CONTACT.email}
            </a>
            .
          </span>
        </div>
      ) : null}
      <div className="basis-full flex flex-wrap justify-between items-center gap-3.5 pt-1">
        <Link href="/privacy" className="text-sm text-accent-light min-h-11 inline-flex items-center hover:text-fg">
          How we handle your details
        </Link>
        <button
          type="submit"
          aria-disabled={busy}
          className={`rounded-full text-sm font-medium px-[30px] min-h-12 bg-fg text-bg border-2 border-transparent inline-flex items-center justify-center gap-2 cursor-pointer box-border transition-[transform,opacity] duration-300 hover:-translate-y-0.5 ${
            busy ? "opacity-70" : ""
          }`}
        >
          {busy ? (
            <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin inline-block" />
          ) : null}
          {busy ? "Sending…" : status === "failed" ? "Try again" : "Apply for a slot"}
        </button>
      </div>
    </form>
  );
}
