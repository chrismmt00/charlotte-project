"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/ui/Bits";
import { CONTACT } from "@/lib/site";
import { useTheme } from "@/lib/theme";
import { portalApi } from "@/lib/portal/api";
import { Alert, FieldError, Icon, Spinner, btnPrimary, btnSecondary, inputCls, labelCls } from "./ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Card({ eyebrow, titleId, title, lede, children, note }) {
  return (
    <section aria-labelledby={titleId} className="w-full max-w-[440px] bg-surface border border-border rounded-card p-[clamp(22px,3vw,32px)] box-border flex flex-col gap-[18px] min-h-[480px]">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <Link href="/" className="inline-flex items-center gap-2.5 min-h-11 text-fg" aria-label="Klyvora home">
          <BrandMark size={36} />
          <span className="font-display italic text-[22px]">Klyvora</span>
        </Link>
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <div>
        <h1 id={titleId} className="font-display font-normal text-4xl leading-[1.05] m-0 mb-2.5">
          {title}
        </h1>
        <p className="m-0 text-[15px] leading-[1.6] text-muted-2">{lede}</p>
      </div>
      {children}
      {note ? <p className="mt-auto mb-0 text-[13px] leading-[1.6] text-muted-2">{note}</p> : null}
    </section>
  );
}

// Magic-link sign-in: request, sent, expired, wrong account, plus submitting and error on the form.
// POST /api/auth/portal/link { email } -> 200 { sent: true }
export default function SignIn() {
  const params = useSearchParams();
  const [theme, setTheme] = useTheme();
  const dark = theme !== "light";
  const startView = params.has("unknown") ? "wrong" : params.has("expired") ? "expired" : "request";
  const [view, setView] = useState(startView);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | invalid | submitting | error
  const [resend, setResend] = useState("idle"); // idle | busy | sent | failed
  const busy = status === "submitting";
  const shownEmail = email.trim() || "[you@business.com]";
  const wrongEmail = params.get("unknown") || "[you@other.com]";

  async function send(to, { fromExpired = false } = {}) {
    if (busy) return;
    const value = fromExpired ? "[you@business.com]" : to.trim();
    if (!fromExpired && !EMAIL_RE.test(value)) {
      setStatus("invalid");
      document.getElementById("pi-email")?.focus();
      return;
    }
    setStatus("submitting");
    try {
      await portalApi("/api/auth/portal/link", { body: { email: value } });
      setStatus("idle");
      setView("sent");
    } catch {
      setStatus("error");
    }
  }

  async function sendAgain() {
    if (resend === "busy") return;
    setResend("busy");
    try {
      await portalApi("/api/auth/portal/link", { body: { email: shownEmail } });
      setResend("sent");
    } catch {
      setResend("failed");
    }
  }

  const failure = status === "error" ? <Alert>We couldn’t send the email just now. Try again in a moment, or text us at {CONTACT.phone}.</Alert> : null;
  const submitLabel = (idle) =>
    busy ? (
      <>
        <Spinner />
        Sending…
      </>
    ) : (
      idle
    );

  let card;
  if (view === "sent") {
    card = (
      <Card eyebrow="Check your email" titleId="pi-h" title="Link sent." lede={<>We emailed a sign-in link to <strong className="text-fg font-medium">{shownEmail}</strong>. Open it on this device.</>} note="Resend is allowed three times an hour.">
        <div role="status" className="flex gap-2.5 items-start p-3.5 rounded-input border border-border-2 bg-surface-2 text-sm leading-normal">
          <Icon name="mail" size={18} className="text-accent-light mt-0.5" />
          <span>Expires in 15 minutes. Check spam if it isn’t there in a minute.</span>
        </div>
        {resend === "failed" ? <Alert>That didn’t send. Try again in a moment.</Alert> : null}
        <button type="button" onClick={sendAgain} disabled={resend === "busy"} aria-busy={resend === "busy"} className={`${btnSecondary} w-full`}>
          {resend === "busy" ? (
            <>
              <Spinner />
              Sending…
            </>
          ) : resend === "sent" ? (
            "Sent again"
          ) : (
            "Send it again"
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setView("request");
            setStatus("idle");
            setResend("idle");
          }}
          className="min-h-11 bg-transparent border-0 text-accent-light text-sm cursor-pointer hover:text-fg"
        >
          Use a different email
        </button>
      </Card>
    );
  } else if (view === "expired") {
    card = (
      <Card eyebrow="Link expired" titleId="pi-h" title="This link has expired." lede={<>Sign-in links work once and for 15 minutes. Yours was sent <strong className="text-fg font-medium">[2 hours] ago</strong>.</>} note="Nothing happened to your account. Someone else opening an old link sees this same screen.">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            send("", { fromExpired: true });
          }}
          className="flex flex-col gap-3"
        >
          {failure}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pi-email" className={labelCls}>
              Email
            </label>
            <input id="pi-email" type="email" readOnly value="[you@business.com]" autoComplete="username" className={`${inputCls} border-border-2`} />
          </div>
          <button type="submit" disabled={busy} aria-busy={busy} className={`${btnPrimary} w-full min-h-[52px]`}>
            {submitLabel("Email me a new link")}
          </button>
        </form>
      </Card>
    );
  } else if (view === "wrong") {
    card = (
      <Card
        eyebrow="No access"
        titleId="pi-h"
        title="That email isn’t on this project."
        lede={<>You signed in as <strong className="text-fg font-medium break-all">{wrongEmail}</strong>, but no Klyvora project lists that address.</>}
        note={<>Team members who land here by mistake: use <Link href="/admin/signin" className="text-accent-light">/admin/signin</Link>. Wrong-account sign-ins are logged, never emailed.</>}
      >
        <ol className="list-none m-0 p-0 flex flex-col gap-3 text-sm leading-normal">
          {["Try the email your proposal was sent to; business owners often have two.", "Ask the person who signed the proposal to add you from Portal → Account → People.", "Or tell us and we will add you."].map((t, i) => (
            <li key={t} className="flex gap-3 items-start">
              <span aria-hidden="true" className="w-6 h-6 rounded-full border border-border-2 text-xs text-muted-2 inline-flex items-center justify-center flex-none">
                {i + 1}
              </span>
              <span className="text-muted-2">{t}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => {
            setView("request");
            setStatus("idle");
          }}
          className={`${btnPrimary} w-full min-h-[52px]`}
        >
          Try another email
        </button>
        <Link href="/contact" className={`${btnSecondary} w-full`}>
          Ask us to add you
        </Link>
      </Card>
    );
  } else {
    card = (
      <Card eyebrow="Client portal" titleId="pi-h" title="Your project, your site." lede="No password. We email you a link that signs you in." note={<>The link works once and expires in 15 minutes. Not a client yet? <Link href="/contact" className="text-accent-light">Get a quote</Link>.</>}>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            send(email);
          }}
          className="flex flex-col gap-3"
        >
          {failure}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pi-email" className={labelCls}>
              Email
            </label>
            <input
              id="pi-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "invalid") setStatus("idle");
              }}
              placeholder="The email on your proposal"
              autoComplete="username"
              disabled={busy}
              aria-invalid={status === "invalid" || status === "error" ? true : undefined}
              aria-describedby={status === "invalid" ? "pi-email-err" : undefined}
              className={`${inputCls} ${status === "invalid" || status === "error" ? "border-danger" : "border-border-2"}`}
            />
            {status === "invalid" ? <FieldError id="pi-email-err">Enter the email on your proposal, like you@business.com.</FieldError> : null}
          </div>
          <button type="submit" disabled={busy} aria-busy={busy} className={`${btnPrimary} w-full min-h-[52px] text-[15px]`}>
            {submitLabel("Send me a sign-in link")}
          </button>
        </form>
      </Card>
    );
  }

  return (
    <div className="portal flex-1 min-h-screen bg-bg text-fg text-[15px] flex flex-col items-center justify-center px-4 py-10 gap-6 relative">
      <button
        type="button"
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => setTheme(dark ? "light" : "dark")}
        className="absolute top-4 right-4 w-11 h-11 rounded-full border border-border-2 bg-transparent text-muted-2 inline-flex items-center justify-center cursor-pointer p-0 hover:text-fg hover:border-fg"
      >
        <Icon name={dark ? "sun" : "moon"} size={18} strokeWidth={1.6} />
      </button>
      <main id="portal-signin" className="w-full flex justify-center">
        {card}
      </main>
    </div>
  );
}
