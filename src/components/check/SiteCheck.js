"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Field, { ErrorIcon, inputClass } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/Bits";
import { CONTACT } from "@/lib/site";
import {
  serviceById,
  money,
  recurringLabel,
  quoteHref,
} from "@/lib/marketing/catalog";
import {
  CHECKS,
  VERDICTS,
  hostOf,
  normalizeUrl,
} from "@/components/check/report";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TICK_MS = 600;
const starter = serviceById("websites");
const serviceForCode = (code) =>
  serviceById(
    { W1: "websites", W2: "websites", WB: "beauty", AI: "automation" }[code],
  );
const priceLine = (service) =>
  `from ${money(service.setup)} setup; ${recurringLabel(service)}`;

function Spinner({ size = 16 }) {
  return (
    <span
      aria-hidden="true"
      className="rounded-full border-2 border-current border-r-transparent animate-spin inline-block flex-none"
      style={{ width: size, height: size }}
    />
  );
}

function CrossIcon() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function Banner({ children, className = "" }) {
  return (
    <div
      role="alert"
      className={`flex gap-3 items-start px-4 py-3.5 rounded-input border border-fg bg-surface text-sm leading-normal ${className}`}
    >
      <span className="flex-none mt-0.5">
        <ErrorIcon />
      </span>
      <span>{children}</span>
    </div>
  );
}

const cardCls =
  "bg-surface border border-border rounded-card-lg p-[clamp(18px,3vw,28px)] box-border flex flex-col min-w-0";

// "Check my site": idle -> checking -> report -> (email the report) -> sent.
// Calls POST /api/site-check { url }, then POST /api/leads { ..., source: "check-my-site", siteUrl, report }.
export default function SiteCheck() {
  const [url, setUrl] = useState("");
  const [urlErr, setUrlErr] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | checking | report | error
  const [done, setDone] = useState(0);
  const [report, setReport] = useState(null);
  const [stamp, setStamp] = useState("");
  const [v, setV] = useState({ email: "", name: "" });
  const [capErrors, setCapErrors] = useState({});
  const [cap, setCap] = useState("idle"); // idle | error | submitting | failed | sent
  const timer = useRef(null);
  const runId = useRef(0);
  const urlRef = useRef(null);
  const reportRef = useRef(null);
  const sentRef = useRef(null);
  const capFormRef = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  useEffect(() => {
    if (phase === "report") reportRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (cap === "sent") sentRef.current?.focus();
  }, [cap]);

  async function run(ev) {
    ev.preventDefault();
    if (phase === "checking") return;
    const target = normalizeUrl(url);
    if (!target) {
      setUrlErr("Enter an address like yourbusiness.com.");
      urlRef.current?.focus();
      return;
    }
    setUrlErr("");
    setCap("idle");
    setCapErrors({});
    setReport(null);
    setPhase("checking");
    setDone(0);
    const id = ++runId.current;
    clearInterval(timer.current);
    // The checklist animates while the request runs; it never claims the last check before the answer arrives.
    timer.current = setInterval(
      () => setDone((d) => Math.min(CHECKS.length - 1, d + 1)),
      TICK_MS,
    );
    try {
      const res = await fetch("/api/site-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json().catch(() => null);
      if (id !== runId.current) return;
      clearInterval(timer.current);
      if (res.status === 400) {
        setPhase("idle");
        setUrlErr(
          data?.error?.message || "Enter an address like yourbusiness.com.",
        );
        urlRef.current?.focus();
        return;
      }
      if (!res.ok || !data?.findings) throw new Error(String(res.status));
      setDone(CHECKS.length);
      setReport(data);
      setStamp(
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      );
      setTimeout(() => {
        if (id === runId.current) setPhase("report");
      }, 350);
    } catch {
      if (id !== runId.current) return;
      clearInterval(timer.current);
      setPhase("error");
    }
  }

  async function sendReport(ev) {
    ev.preventDefault();
    if (cap === "submitting" || !report) return;
    const e = {};
    if (!EMAIL_RE.test(v.email.trim()))
      e.email = "Enter an email like you@business.com.";
    if (!v.name.trim()) e.name = "Tell us your name.";
    setCapErrors(e);
    if (Object.keys(e).length) {
      setCap("error");
      document.getElementById(`rp-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setCap("submitting");
    const verdict = VERDICTS[report.verdict] || VERDICTS.good;
    const passed = report.findings.filter((f) => f.pass).length;
    const hp =
      capFormRef.current?.elements.namedItem("company_website")?.value || "";
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          business: "",
          email: v.email,
          phone: "",
          siteUrl: report.finalUrl || report.url,
          message: `Check my site report for ${hostOf(report.url)}: ${verdict.headline} ${passed} of ${report.findings.length} checks pass.`,
          source: "check-my-site",
          offerCode: null,
          company_website: hp,
          report: {
            url: report.url,
            finalUrl: report.finalUrl,
            status: report.status,
            redirected: report.redirected,
            loadMs: report.loadMs,
            mobileFriendly: report.mobileFriendly,
            hasBooking: report.hasBooking,
            verdict: report.verdict,
            findings: report.findings,
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setCap("sent");
    } catch {
      setCap("failed");
    }
  }

  function restart() {
    runId.current += 1;
    clearInterval(timer.current);
    setUrl("");
    setUrlErr("");
    setReport(null);
    setPhase("idle");
    setDone(0);
    setCap("idle");
    setCapErrors({});
    requestAnimationFrame(() => urlRef.current?.focus());
  }

  const busy = phase === "checking";
  const host = hostOf(report?.url || normalizeUrl(url) || url) || "your site";
  const verdict = report ? VERDICTS[report.verdict] || VERDICTS.good : null;
  const fixOffer = verdict ? serviceForCode(verdict.fixCode) : null;
  const score = report ? report.findings.filter((f) => f.pass).length : 0;
  const capBusy = cap === "submitting";
  const capErrCount = Object.keys(capErrors).length;

  return (
    <div className="flex flex-col gap-5">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {phase === "report" && verdict
          ? `Report ready for ${host}: ${verdict.headline} ${score} of ${CHECKS.length} pass.`
          : ""}
        {phase === "error" ? "The check couldn’t run." : ""}
      </p>

      {/* URL FORM */}
      <form
        id="form-check"
        noValidate
        onSubmit={run}
        aria-busy={busy}
        className={`form-check ${cardCls} gap-3`}
      >
        <label htmlFor="ck-url" className="text-[13px] text-muted-2">
          Your website address
        </label>
        <div className="flex flex-wrap gap-2.5">
          <input
            ref={urlRef}
            id="ck-url"
            name="url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="yourbusiness.com"
            value={url}
            readOnly={busy}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlErr) setUrlErr("");
            }}
            aria-invalid={urlErr ? true : undefined}
            aria-describedby={urlErr ? "ck-url-err" : undefined}
            className={`${inputClass} !w-auto flex-[1_1_260px] min-h-[52px] !text-base ${urlErr ? "border-fg" : "border-border"}`}
          />
          <Button
            type="submit"
            aria-disabled={busy || undefined}
            className="flex-[1_0_auto] sm:flex-none min-h-[52px]"
          >
            {busy ? <Spinner /> : null}
            {busy
              ? "Checking…"
              : phase === "report"
                ? "Check again"
                : "Check it"}
          </Button>
        </div>
        {urlErr ? (
          <span
            id="ck-url-err"
            className="text-xs text-fg flex items-center gap-1.5"
          >
            <ErrorIcon />
            {urlErr}
          </span>
        ) : null}
        <span className="text-xs text-muted-2 leading-normal">
          No website yet?{" "}
          <Link
            href="/websites"
            className="text-accent-light hover:text-fg underline underline-offset-2"
          >
            Start with a {starter.name} at {money(starter.setup)}
          </Link>
          , or{" "}
          <Link
            href="/contact"
            className="text-accent-light hover:text-fg underline underline-offset-2"
          >
            request a quote
          </Link>
          .
        </span>
      </form>

      {/* CHECKING */}
      {busy ? (
        <div
          role="status"
          aria-live="polite"
          className={`card-checking ${cardCls} gap-3.5`}
        >
          <div className="flex justify-between items-center gap-3">
            <h2 className="text-xl font-medium m-0 min-w-0 break-words">
              Checking {host}…
            </h2>
            <span className="text-[13px] text-muted-2 flex-none tabular-nums">
              {done} of {CHECKS.length}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="h-1.5 rounded-full bg-border overflow-hidden"
          >
            <div
              className="h-full bg-gradient-to-r from-accent-light to-accent transition-[width] duration-400 ease-out"
              style={{ width: `${Math.round((done / CHECKS.length) * 100)}%` }}
            />
          </div>
          <ol className="list-none m-0 p-0 grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-x-6 gap-y-2">
            {CHECKS.map((c, i) => {
              const finished = done > i;
              const running = done === i;
              return (
                <li
                  key={c.id}
                  className={`flex items-center gap-2.5 min-h-9 text-sm ${finished || running ? "text-fg" : "text-muted"}`}
                >
                  {running ? <Spinner size={14} /> : null}
                  {finished ? <CheckIcon size={14} /> : null}
                  {!finished && !running ? (
                    <span
                      aria-hidden="true"
                      className="w-3.5 h-3.5 rounded-full border border-border-2 inline-block flex-none"
                    />
                  ) : null}
                  {c.label}
                  <span className="sr-only">
                    {finished
                      ? " (done)"
                      : running
                        ? " (checking)"
                        : " (waiting)"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      {phase === "error" ? (
        <Banner>
          We couldn&apos;t run the check just now. Try again in a minute, or
          email{" "}
          <a
            href={CONTACT.emailHref}
            className="text-accent-light hover:text-fg"
          >
            {CONTACT.email}
          </a>{" "}
          and we&apos;ll look at it by hand.
        </Banner>
      ) : null}

      {/* REPORT */}
      {phase === "report" && report && verdict ? (
        <>
          <article
            aria-labelledby="rep-h"
            className="card-report gradient-ring !rounded-card-lg flex min-w-0"
          >
            <div className="flex-1 min-w-0 bg-surface rounded-card p-[clamp(18px,3vw,32px)] box-border flex flex-col gap-[22px]">
              <div className="flex flex-wrap justify-between items-end gap-3">
                <div className="min-w-0">
                  <div className="eyebrow mb-2.5 break-words">
                    Report · {host} · {stamp}
                  </div>
                  <h2
                    id="rep-h"
                    ref={reportRef}
                    tabIndex={-1}
                    className="font-display italic font-normal text-[clamp(30px,4vw,44px)] leading-[1.05] m-0 focus-visible:outline-none"
                  >
                    {verdict.headline}
                  </h2>
                </div>
                <span className="inline-flex items-center gap-2 text-[13px] text-muted-2 border border-border-2 rounded-full px-3 py-1.5">
                  <span
                    aria-hidden="true"
                    className="w-[7px] h-[7px] rounded-full bg-accent-light inline-block"
                  />
                  {score} of {CHECKS.length} pass
                </span>
              </div>
              <ul className="list-none m-0 p-0 flex flex-col">
                {report.findings.map((f) => (
                  <li
                    key={f.id}
                    className="report-row flex flex-wrap items-start gap-x-4 gap-y-2.5 py-3.5 border-t border-border"
                  >
                    <span
                      aria-hidden="true"
                      className={`w-7 h-7 rounded-full inline-flex items-center justify-center flex-none border border-border-2 ${
                        f.pass
                          ? "bg-[rgba(var(--success-rgb),.12)] text-success"
                          : "bg-surface-2 text-fg"
                      }`}
                    >
                      {f.pass ? <CheckIcon size={14} /> : <CrossIcon />}
                    </span>
                    <span className="flex-[1_1_220px] min-w-0 flex flex-col gap-[3px]">
                      <span className="text-[15px] font-medium">
                        {f.label}{" "}
                        <span className="font-normal text-muted-2">
                          · {f.result}
                        </span>
                      </span>
                      <span className="text-sm leading-relaxed text-muted-2">
                        {f.why}
                      </span>
                    </span>
                    <span
                      className={`text-xs border border-border-2 rounded-full px-2.5 py-1 whitespace-nowrap ${f.pass ? "text-success" : "text-accent-light"}`}
                    >
                      {f.pass ? "Pass" : "Worth fixing"}
                    </span>
                  </li>
                ))}
              </ul>
              {fixOffer ? (
                <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-border pt-[18px]">
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[13px] text-muted-2">
                      {report.verdict === "good"
                        ? "What would help next"
                        : "What would fix it"}
                    </span>
                    <span className="text-base font-medium">
                      {fixOffer.name}{" "}
                      <span className="text-muted-2 font-normal">
                        · {priceLine(fixOffer)}
                      </span>
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    <Button
                      href={fixOffer.href}
                      variant="secondary"
                      className="!px-6 !py-3 !min-h-11"
                    >
                      View {fixOffer.name}
                    </Button>
                    <Button
                      href={quoteHref(fixOffer)}
                      variant="secondary"
                      className="!px-6 !py-3 !min-h-11"
                    >
                      Start Project
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </article>

          {/* CAPTURE */}
          {cap !== "sent" ? (
            <form
              id="form-report"
              ref={capFormRef}
              noValidate
              onSubmit={sendReport}
              aria-busy={capBusy}
              className={`form-report ${cardCls} gap-3.5`}
            >
              <div>
                <h2 className="text-xl font-medium m-0 mb-1">
                  Want the full report?
                </h2>
                <p className="m-0 text-sm text-muted-2 leading-normal">
                  We email it with screenshots of your site on a phone, the
                  timing breakdown and what we would fix first. A person replies
                  if you want to talk; otherwise that is the only email you get.
                </p>
              </div>
              {cap === "error" && capErrCount ? (
                <Banner>
                  {capErrCount === 1
                    ? "One thing to fix before this can send."
                    : "Two things to fix before this can send."}
                </Banner>
              ) : null}
              <div className="flex flex-wrap gap-2.5 items-start">
                <Field
                  id="rp-email"
                  label="Email"
                  required
                  type="email"
                  placeholder="you@business.com"
                  value={v.email}
                  onChange={(e) =>
                    setV((cur) => ({ ...cur, email: e.target.value }))
                  }
                  error={capErrors.email}
                  autoComplete="email"
                  className="flex-[1_1_260px]"
                />
                <Field
                  id="rp-name"
                  label="Name"
                  required
                  placeholder="Jordan"
                  value={v.name}
                  onChange={(e) =>
                    setV((cur) => ({ ...cur, name: e.target.value }))
                  }
                  error={capErrors.name}
                  autoComplete="name"
                  className="flex-[1_1_200px]"
                />
                <Button
                  type="submit"
                  aria-disabled={capBusy || undefined}
                  className="flex-[1_0_auto] sm:flex-none sm:mt-[22px]"
                >
                  {capBusy ? <Spinner /> : null}
                  {capBusy
                    ? "Sending…"
                    : cap === "failed"
                      ? "Try again"
                      : "Email me the report"}
                </Button>
              </div>
              {/* Honeypot: hidden from people, bots fill it in. */}
              <div
                aria-hidden="true"
                className="absolute -left-[9999px] w-px h-px overflow-hidden"
              >
                <label htmlFor="rp-company_website">Company website</label>
                <input
                  id="rp-company_website"
                  name="company_website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              {cap === "failed" ? (
                <Banner className="form-failure">
                  That didn&apos;t send. Your report is still on this page. Try
                  again, or email{" "}
                  <a
                    href={CONTACT.emailHref}
                    className="text-accent-light hover:text-fg"
                  >
                    {CONTACT.email}
                  </a>
                  .
                </Banner>
              ) : null}
              <span className="text-xs text-muted-2">
                We only use this to send the report and reply to you.{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-fg"
                >
                  Privacy
                </Link>
                .
              </span>
            </form>
          ) : (
            <div
              role="status"
              className={`card-sent ${cardCls} gap-3 items-start`}
            >
              <CheckIcon size={28} />
              <h2
                ref={sentRef}
                tabIndex={-1}
                className="font-display italic font-normal text-[clamp(28px,4vw,40px)] leading-[1.05] m-0 break-words max-w-full focus-visible:outline-none"
              >
                Report sent to {v.email.trim()}.
              </h2>
              <p className="m-0 text-[15px] leading-[1.7] text-muted-2 max-w-[560px]">
                It has the phone screenshots, the timing and the fix we would
                start with ({fixOffer?.name}). If you want a person to walk you
                through it, book a call; otherwise that is the only email.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Button href="/contact">Book a free 30-minute call</Button>
                {fixOffer ? (
                  <Button href={fixOffer.href} variant="secondary">
                    See {fixOffer.name}
                  </Button>
                ) : null}
                <Button variant="ghost" onClick={restart}>
                  Check another site
                </Button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
