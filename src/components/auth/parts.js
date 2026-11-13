"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/ui/Bits";

// Shared pieces of the admin sign-in cards (one centred card, 440px on a phone).
//
// NOTE: Auth.js replaces these screens' logic. The forms post to stub routes under /api/auth/admin/*
// (see the route files for the shapes). When Auth.js lands, keep the markup and swap the submit handlers.
// No real credentials live anywhere in this folder.

const DEV = process.env.NODE_ENV !== "production";

export async function postJson(url, body) {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

// Only follow redirects that stay inside the admin.
export function safeNext(next, fallback = "/admin") {
  return typeof next === "string" && next.startsWith("/admin") && !next.startsWith("//") ? next : fallback;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthCard({ eyebrow, title, titleId, intro, note, children }) {
  return (
    <section aria-labelledby={titleId} className="w-full max-w-[440px] bg-surface border border-border rounded-card p-[clamp(22px,3vw,32px)] min-h-[560px] box-border flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-2.5 min-h-11" aria-label="Klyvora home">
          <BrandMark size={36} />
          <span className="font-display italic text-[22px]">Klyvora</span>
        </Link>
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <div>
        <h1 id={titleId} className="font-display font-normal text-[36px] leading-[1.05] m-0 mb-2.5">
          {title}
        </h1>
        {intro ? <p className="m-0 text-[15px] leading-[1.6] text-muted-2">{intro}</p> : null}
      </div>
      {children}
      {note ? <p className="m-0 mt-auto text-[13px] leading-[1.6] text-muted-2">{note}</p> : null}
    </section>
  );
}

export function AuthAlert({ children, tone = "danger" }) {
  const cls = tone === "danger" ? "border-danger bg-danger/[.08]" : "border-border-2 bg-surface-2";
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`flex gap-2.5 items-start px-3.5 py-3 rounded-input border text-[14px] leading-normal ${cls}`}>
      <span className={`flex-none mt-0.5 ${tone === "danger" ? "text-danger" : "text-accent-light"}`}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {tone === "danger" ? (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16h.01" />
            </>
          ) : (
            <path d="M5 12l5 5 9-10" />
          )}
        </svg>
      </span>
      <span>{children}</span>
    </div>
  );
}

export function AuthField({ id, label, error, hint, className = "", ...rest }) {
  const err = error ? `${id}-err` : undefined;
  const hid = hint && !error ? `${id}-hint` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] text-muted-2">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={err || hid}
        className={`min-h-12 w-full box-border rounded-input border bg-surface-2 text-fg px-4 text-[15px] font-[inherit] disabled:opacity-70 ${error ? "border-danger" : "border-border-2"}`}
        {...rest}
      />
      {error ? (
        <span id={err} role="alert" className="text-[13px] text-danger">
          {error}
        </span>
      ) : null}
      {hint && !error ? (
        <span id={hid} className="text-[13px] text-muted-2">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function CheckRow({ id, children, ...rest }) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 text-[13px] text-muted-2 min-h-11 cursor-pointer">
      <input id={id} type="checkbox" className="w-[18px] h-[18px] accent-[var(--accent)]" {...rest} />
      {children}
    </label>
  );
}

export function Spinner() {
  return <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin motion-reduce:animate-none inline-block" />;
}

const btnBase = "w-full inline-flex items-center justify-center gap-2.5 rounded-full text-[15px] font-medium cursor-pointer box-border disabled:cursor-not-allowed transition-opacity";
export function PrimaryButton({ busy, busyLabel, children, ...rest }) {
  return (
    <button type="submit" aria-busy={busy} disabled={busy} className={`${btnBase} min-h-[52px] bg-fg text-bg border-2 border-transparent ${busy ? "opacity-85" : ""}`} {...rest}>
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

export function SecondaryButton({ children, ...rest }) {
  return (
    <button type="button" className={`${btnBase} min-h-12 text-[14px] bg-transparent text-fg border border-border-2 hover:bg-surface-2 disabled:opacity-60`} {...rest}>
      {children}
    </button>
  );
}

// Form state: idle | invalid | submitting | failed | done. The dev-only switch forces submitting and failed
// so every card can be seen without a slow or failing back end.
export function useFormView() {
  const [status, setStatus] = useState("idle");
  const [force, setForce] = useState(null);
  const view = force || status;
  return { status, setStatus, force, setForce, busy: view === "submitting" || status === "done", failed: view === "failed", view };
}

export function DevStates({ force, setForce }) {
  if (!DEV) return null;
  return (
    <div role="group" aria-label="Development preview" className="flex flex-wrap items-center gap-2 text-[12px] text-muted-2">
      <span>Dev preview:</span>
      {[null, "submitting", "failed"].map((s) => (
        <button key={s || "idle"} type="button" aria-pressed={force === s} onClick={() => setForce(s)} className={`min-h-7 px-2.5 rounded-full border text-[12px] cursor-pointer ${force === s ? "border-fg text-fg" : "border-border-2 text-muted-2 bg-transparent"}`}>
          {s || "idle"}
        </button>
      ))}
    </div>
  );
}

export function CardFallback() {
  return (
    <div aria-busy="true" role="status" className="w-full max-w-[440px] bg-surface border border-border rounded-card p-8 box-border flex flex-col gap-4">
      <span className="sr-only">Loading</span>
      <div aria-hidden="true" className="h-9 w-40 rounded-[10px] bg-surface-2 animate-pulse" />
      <div aria-hidden="true" className="h-12 w-full rounded-[10px] bg-surface-2 animate-pulse" />
      <div aria-hidden="true" className="h-12 w-full rounded-[10px] bg-surface-2 animate-pulse" />
    </div>
  );
}
