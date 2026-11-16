"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import Field, { inputClass } from "@/components/ui/Field";
import {
  SERVICES,
  serviceById,
  money,
  recurringLabel,
} from "@/lib/marketing/catalog";
import { INDUSTRY_OPTIONS, inquirySchema } from "@/lib/marketing/inquiry";
import { CONTACT } from "@/lib/site";

const EMPTY = {
  name: "",
  business: "",
  email: "",
  phone: "",
  industry: "",
  service: "",
  siteUrl: "",
  equipment: "",
  message: "",
};
const LEGACY_SELECTIONS = {
  W1: "websites",
  W2: "websites",
  WB: "beauty",
  BK: "beauty",
  RC: "restaurants",
  RK: "restaurants",
  EC: "ecommerce",
  AI: "automation",
  AH: "software",
  CA: "software",
};

function Select({ id, label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-xs text-muted-2" htmlFor={`quote-${id}`}>
        {label}
      </label>
      <select
        id={`quote-${id}`}
        name={id}
        value={value}
        onChange={onChange}
        className={`${inputClass} border-border`}
      >
        {children}
      </select>
    </div>
  );
}

function InquiryForm({ initialService }) {
  const [values, setValues] = useState({ ...EMPTY, service: initialService });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const success = useRef(null);
  const inFlight = useRef(false);
  const selected = serviceById(values.service);
  const set = (key) => (event) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  function showErrors(fields) {
    setErrors(fields);
    setStatus("invalid");
    requestAnimationFrame(() =>
      document.getElementById(`quote-${Object.keys(fields)[0]}`)?.focus(),
    );
  }
  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    const company_website =
      event.currentTarget.elements.namedItem("company_website")?.value || "";
    const parsed = inquirySchema.safeParse({ ...values, company_website });
    if (!parsed.success)
      return showErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
        ),
      );
    inFlight.current = true;
    setErrors({});
    setStatus("sending");
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json();
      if (response.status === 422 && result.fields) {
        showErrors(result.fields);
        return;
      }
      if (!response.ok || !result.id) throw new Error("Submission failed");
      setStatus("sent");
      requestAnimationFrame(() => success.current?.focus());
    } catch {
      setStatus("failed");
    } finally {
      inFlight.current = false;
    }
  }

  if (status === "sent")
    return (
      <div
        ref={success}
        tabIndex={-1}
        role="status"
        className="mk-note self-start"
      >
        <p className="eyebrow mk-eyebrow">Request received</p>
        <h2 className="mk-h3">Thanks. Your inquiry is on its way.</h2>
        <p>
          We’ve saved your project details
          {selected ? ` for ${selected.name}` : ""}. We’ll review your request
          and follow up using the contact information you shared.
        </p>
        <Link href="/pricing" className="mk-text-link">
          Review Pricing <span aria-hidden="true">→</span>
        </Link>
        <button
          type="button"
          className="min-h-11 text-sm text-accent-light cursor-pointer mt-3"
          onClick={() => {
            setValues({ ...EMPTY, service: initialService });
            setStatus("idle");
          }}
        >
          Send another inquiry
        </button>
      </div>
    );
  const busy = status === "sending";
  return (
    <form
      onSubmit={submit}
      noValidate
      aria-busy={busy}
      className="grid grid-cols-1 sm:grid-cols-2 gap-5 content-start"
    >
      <p className="mk-small sm:col-span-2 !m-0">
        Fields marked * are required.
      </p>
      {status === "invalid" && (
        <p
          role="alert"
          className="sm:col-span-2 text-sm border border-fg rounded-input p-4"
        >
          Please review the highlighted fields.
        </p>
      )}
      <Field
        id="quote-name"
        label="Name"
        required
        value={values.name}
        onChange={set("name")}
        error={errors.name}
        autoComplete="name"
        maxLength={200}
      />
      <Field
        id="quote-business"
        label="Business name"
        required
        value={values.business}
        onChange={set("business")}
        error={errors.business}
        autoComplete="organization"
        maxLength={300}
      />
      <Field
        id="quote-email"
        label="Email"
        required
        type="email"
        value={values.email}
        onChange={set("email")}
        error={errors.email}
        autoComplete="email"
        maxLength={254}
      />
      <Field
        id="quote-phone"
        label="Phone (optional)"
        type="tel"
        value={values.phone}
        onChange={set("phone")}
        autoComplete="tel"
        maxLength={50}
      />
      <Select
        id="industry"
        label="Business industry"
        value={values.industry}
        onChange={set("industry")}
      >
        <option value="">Choose your industry</option>
        {INDUSTRY_OPTIONS.map((i) => (
          <option key={i}>{i}</option>
        ))}
      </Select>
      <Select
        id="service"
        label="Service interested in"
        value={values.service}
        onChange={set("service")}
      >
        <option value="">Not sure yet</option>
        {SERVICES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      {selected && (
        <div className="mk-note sm:col-span-2 !p-4">
          <p>
            <strong>
              {selected.name}: from {money(selected.setup)} setup.
            </strong>
            <br />
            {recurringLabel(selected)}.
          </p>
          {selected.kind === "industry" && (
            <p>
              Your project includes website design, software configuration, and
              guided onboarding for your team.
            </p>
          )}
          <p>USD. Final scope and costs are confirmed in a written proposal.</p>
        </div>
      )}
      <Field
        id="quote-siteUrl"
        label="Current website (optional)"
        type="url"
        placeholder="https://yourbusiness.com"
        value={values.siteUrl}
        onChange={set("siteUrl")}
        error={errors.siteUrl}
        autoComplete="url"
        maxLength={2048}
        className="sm:col-span-2"
      />
      <Field
        id="quote-equipment"
        label="Existing hardware or software (optional)"
        textarea
        rows={2}
        placeholder="Tablets, payment provider, booking software, or other tools you already use."
        value={values.equipment}
        onChange={set("equipment")}
        error={errors.equipment}
        maxLength={2000}
        className="sm:col-span-2"
      />
      <Field
        id="quote-message"
        label="Project description"
        required
        textarea
        rows={5}
        placeholder="Tell us what you’d like to improve and what your business needs."
        value={values.message}
        onChange={set("message")}
        error={errors.message}
        maxLength={7000}
        className="sm:col-span-2"
      />
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px overflow-hidden"
      >
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {status === "failed" && (
        <p
          role="alert"
          className="sm:col-span-2 border border-fg p-4 rounded-input text-sm leading-7"
        >
          Your request couldn’t be sent. Your details are still here. Try again,
          or email{" "}
          <a href={CONTACT.emailHref} className="underline">
            {CONTACT.email}
          </a>
          .
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="sm:col-span-2 min-h-13 rounded-full p-4 text-sm font-medium bg-fg text-bg cursor-pointer disabled:opacity-60 disabled:cursor-wait"
      >
        {busy ? "Sending your request…" : "Start Project"}
      </button>
      <p className="sm:col-span-2 mk-small !m-0">
        We use these details to review and respond to your inquiry.{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy information
        </Link>
        .
      </p>
    </form>
  );
}
export default function ContactForm() {
  const params = useSearchParams();
  const candidate =
    params.get("service") ||
    LEGACY_SELECTIONS[(params.get("offer") || "").toUpperCase()] ||
    "";
  const initialService = serviceById(candidate)?.id || "";
  return <InquiryForm key={initialService} initialService={initialService} />;
}
