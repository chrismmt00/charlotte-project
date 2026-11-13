"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthCard, AuthAlert, AuthField, CheckRow, PrimaryButton, SecondaryButton, DevStates, useFormView, postJson, safeNext, EMAIL_RE } from "./parts";

// Admin sign-in cards: password, two-factor code, reset (request + new password) and invite accept.
// Auth.js replaces the logic behind these forms; the stub routes are under src/app/api/auth/admin/*.
// Each form has the five states: idle, validation error, submitting, success (we navigate) and failed.

const COMMON = ["password", "password1234", "123456789012", "qwertyuiopas", "klyvora12345"];

function passwordProblem(pw) {
  if (pw.length < 12) return "Use at least 12 characters. A short sentence works well.";
  if (COMMON.includes(pw.toLowerCase())) return "That password is too common. Try a short sentence.";
  return "";
}

export function SignInCard() {
  const router = useRouter();
  const f = useFormView();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [stay, setStay] = useState(true);
  const [errs, setErrs] = useState({});
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (f.busy) return;
    const v = {};
    if (!EMAIL_RE.test(email.trim())) v.email = "Enter your work email.";
    if (!pw) v.pw = "Enter your password.";
    setErrs(v);
    setNotice("");
    if (Object.keys(v).length) {
      f.setStatus("invalid");
      document.getElementById(v.email ? "a1-email" : "a1-pw")?.focus();
      return;
    }
    f.setStatus("submitting");
    const r = await postJson("/api/auth/admin/signin", { email: email.trim(), password: pw, stay });
    if (r.ok) {
      f.setStatus("done");
      router.push(safeNext(r.data.next, "/admin/signin/code"));
      return;
    }
    setMessage(r.status === 401 ? r.data?.error || "That email and password don’t match." : "We couldn’t reach the server. Try again in a moment.");
    f.setStatus("failed");
  }

  async function magicLink() {
    if (!EMAIL_RE.test(email.trim())) {
      setErrs({ email: "Enter your work email first." });
      document.getElementById("a1-email")?.focus();
      return;
    }
    setErrs({});
    f.setStatus("submitting");
    const r = await postJson("/api/auth/admin/link", { email: email.trim() });
    if (r.ok) {
      f.setStatus("idle");
      setNotice("If that email belongs to someone on the team, a sign-in link is on its way. It works once and expires in 15 minutes.");
    } else {
      setMessage("We couldn’t send the link just now. Try again in a moment.");
      f.setStatus("failed");
    }
  }

  const failedShown = f.failed;
  return (
    <AuthCard
      eyebrow="Admin · /admin/signin"
      title="Sign in to Klyvora."
      titleId="a1"
      intro="Team only. Use your work email."
      note="A two-factor code by text comes next on new devices. Admin accounts are created by the owner in Settings; there is no public sign-up."
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-3">
        {failedShown ? (
          <AuthAlert>
            {message || "That email and password don’t match."} <strong className="font-medium">4 tries left</strong> before a 15-minute pause.
          </AuthAlert>
        ) : null}
        {notice ? <AuthAlert tone="info">{notice}</AuthAlert> : null}
        <AuthField id="a1-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@klyvora.ai" autoComplete="username" disabled={f.busy} error={errs.email} />
        <AuthField id="a1-pw" label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" disabled={f.busy} error={errs.pw} />
        <div className="flex justify-between items-center gap-3 text-[13px]">
          <CheckRow id="a1-stay" checked={stay} onChange={(e) => setStay(e.target.checked)} disabled={f.busy}>
            Stay signed in
          </CheckRow>
          <Link href="/admin/signin/reset" className="text-accent-light min-h-11 inline-flex items-center hover:text-fg">
            Forgot password?
          </Link>
        </div>
        <PrimaryButton busy={f.view === "submitting" || f.status === "done"} busyLabel={f.status === "done" ? "Signed in…" : "Signing in…"}>
          Sign in
        </PrimaryButton>
        <SecondaryButton onClick={magicLink} disabled={f.busy}>
          Email me a sign-in link instead
        </SecondaryButton>
      </form>
      <DevStates force={f.force} setForce={f.setForce} />
    </AuthCard>
  );
}

export function CodeCard() {
  const router = useRouter();
  const f = useFormView();
  const [code, setCode] = useState("");
  const [trust, setTrust] = useState(false);
  const [err, setErr] = useState("");
  const [message, setMessage] = useState("");
  const [resend, setResend] = useState("idle"); // idle | sending | sent

  async function submit(e) {
    e.preventDefault();
    if (f.busy) return;
    if (!/^\d{6}$/.test(code)) {
      setErr("Enter the 6 digits from the text.");
      f.setStatus("invalid");
      document.getElementById("a7-code")?.focus();
      return;
    }
    setErr("");
    f.setStatus("submitting");
    const r = await postJson("/api/auth/admin/code", { code, trustDevice: trust });
    if (r.ok) {
      f.setStatus("done");
      router.push(safeNext(r.data.next));
      return;
    }
    setMessage(r.status === 401 ? "That code didn’t work. Check the newest text, or send a new one." : "We couldn’t check the code just now. Try again in a moment.");
    f.setStatus("failed");
  }

  async function again() {
    setResend("sending");
    const r = await postJson("/api/auth/admin/code", { resend: true });
    setResend(r.ok ? "sent" : "idle");
    if (!r.ok) {
      setMessage("We couldn’t send a new code just now. Try again in a moment.");
      f.setStatus("failed");
    }
  }

  return (
    <AuthCard
      eyebrow="New device · /admin/signin/code"
      title="Enter the code we texted."
      titleId="a7"
      intro={
        <>
          Sent to the number ending <strong className="text-fg font-medium">[••47]</strong>. It works for 10 minutes.
        </>
      }
      note="Five wrong codes signs you out and emails the owner. Lost your phone? The owner can reset two-factor from Settings → Team."
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-3">
        {f.failed ? <AuthAlert>{message || "That code didn’t work. Check the newest text, or send a new one."}</AuthAlert> : null}
        <AuthField
          id="a7-code"
          label="6-digit code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ""));
            setErr("");
          }}
          placeholder="••••••"
          disabled={f.busy}
          error={err}
          className="[&_input]:text-[24px] [&_input]:tracking-[.4em] [&_input]:text-center [&_input]:tabular-nums"
        />
        <CheckRow id="a7-trust" checked={trust} onChange={(e) => setTrust(e.target.checked)} disabled={f.busy}>
          Trust this device for 30 days
        </CheckRow>
        <PrimaryButton busy={f.view === "submitting" || f.status === "done"} busyLabel="Checking…">
          Continue
        </PrimaryButton>
        <SecondaryButton onClick={again} disabled={f.busy || resend === "sending"}>
          {resend === "sending" ? "Sending…" : resend === "sent" ? "Sent again" : "Send it again"}
        </SecondaryButton>
      </form>
      <DevStates force={f.force} setForce={f.setForce} />
    </AuthCard>
  );
}

function PasswordRules({ pw }) {
  const rules = [
    ["12+ characters", pw.length >= 12],
    ["Not a common password", pw.length > 0 && !COMMON.includes(pw.toLowerCase())],
  ];
  return (
    <ul className="list-none m-0 p-0 flex flex-col gap-1 text-[12px]" aria-label="Password rules">
      {rules.map(([t, ok]) => (
        <li key={t} className={`flex items-center gap-1.5 ${ok ? "text-success" : "text-muted-2"}`}>
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {ok ? <path d="M5 12l5 5 9-10" /> : <circle cx="12" cy="12" r="6" />}
          </svg>
          {t}
          <span className="sr-only">{ok ? " (met)" : " (not met yet)"}</span>
        </li>
      ))}
    </ul>
  );
}

// /admin/signin/reset: without ?token= it asks for an email; with one it sets the new password.
export function ResetScreen() {
  const token = useSearchParams().get("token");
  return token ? <ResetCard token={token} /> : <ResetRequestCard />;
}

function ResetRequestCard() {
  const f = useFormView();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (f.busy) return;
    if (!EMAIL_RE.test(email.trim())) {
      setErr("Enter your work email.");
      f.setStatus("invalid");
      document.getElementById("a3-email")?.focus();
      return;
    }
    setErr("");
    f.setStatus("submitting");
    const r = await postJson("/api/auth/admin/reset", { email: email.trim() });
    if (r.ok) {
      f.setStatus("idle");
      setSent(true);
    } else f.setStatus("failed");
  }

  if (sent) {
    return (
      <AuthCard eyebrow="Check your email" title="Link sent." titleId="a3" intro={<>If <strong className="text-fg font-medium">{email.trim()}</strong> is on the team, a reset link is on its way. Open it on this device.</>} note="Reset links work once and expire in 1 hour.">
        <AuthAlert tone="info">Check spam if it isn’t there in a minute.</AuthAlert>
        <SecondaryButton onClick={() => setSent(false)}>Use a different email</SecondaryButton>
        <Link href="/admin/signin" className="text-[14px] text-accent-light text-center min-h-11 inline-flex items-center justify-center hover:text-fg">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard eyebrow="Reset password · /admin/signin/reset" title="Reset your password." titleId="a3" intro="Enter your work email and we’ll send a link that sets a new one." note="Admin accounts are created by the owner in Settings; there is no public sign-up.">
      <form noValidate onSubmit={submit} className="flex flex-col gap-3">
        {f.failed ? <AuthAlert>We couldn’t send the email just now. Try again in a moment.</AuthAlert> : null}
        <AuthField id="a3-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@klyvora.ai" autoComplete="username" disabled={f.busy} error={err} />
        <PrimaryButton busy={f.view === "submitting"} busyLabel="Sending…">
          Send me a reset link
        </PrimaryButton>
        <Link href="/admin/signin" className="text-[14px] text-accent-light text-center min-h-11 inline-flex items-center justify-center hover:text-fg">
          Back to sign in
        </Link>
      </form>
      <DevStates force={f.force} setForce={f.setForce} />
    </AuthCard>
  );
}

function ResetCard({ token }) {
  const router = useRouter();
  const f = useFormView();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errs, setErrs] = useState({});
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (f.busy) return;
    const v = {};
    const p = passwordProblem(pw);
    if (p) v.pw = p;
    else if (pw !== pw2) v.pw2 = "The two passwords don’t match.";
    setErrs(v);
    if (Object.keys(v).length) {
      f.setStatus("invalid");
      document.getElementById(v.pw ? "a4-pw" : "a4-pw2")?.focus();
      return;
    }
    f.setStatus("submitting");
    const r = await postJson("/api/auth/admin/reset", { token, password: pw });
    if (r.ok) {
      f.setStatus("done");
      router.push(safeNext(r.data.next));
      return;
    }
    setMessage(r.status === 410 ? "This reset link has expired. Ask for a new one." : "We couldn’t save the password just now. Try again in a moment.");
    f.setStatus("failed");
  }

  return (
    <AuthCard
      eyebrow="Reset password · /admin/signin/reset"
      title="Set a new password."
      titleId="a4"
      intro="You opened the reset link we sent to [you@klyvora.ai]."
      note="Reset links work once and expire in 1 hour. Every other session is signed out when the password changes."
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-3">
        {f.failed ? <AuthAlert>{message || "We couldn’t save the password just now."}</AuthAlert> : null}
        <AuthField id="a4-pw" label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" disabled={f.busy} error={errs.pw} />
        <PasswordRules pw={pw} />
        <AuthField id="a4-pw2" label="Repeat it" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" disabled={f.busy} error={errs.pw2} />
        <PrimaryButton busy={f.view === "submitting" || f.status === "done"} busyLabel="Saving…">
          Save and sign in
        </PrimaryButton>
      </form>
      <DevStates force={f.force} setForce={f.setForce} />
    </AuthCard>
  );
}

// /admin/signin/invite?token=…  The details below are sample data; the back end looks them up from the token.
// No token (or an unknown one) shows the expired-invite card.
export function InviteScreen() {
  const token = useSearchParams().get("token");
  return token ? <InviteCard token={token} /> : <InviteExpiredCard />;
}

function InviteExpiredCard() {
  return (
    <AuthCard
      eyebrow="Link expired"
      title="This invite has expired."
      titleId="a8"
      intro="Invites work for 7 days. Nothing happened to any account."
      note="Claude is not invited this way; it gets an API key with the Agent role in Settings."
    >
      <AuthAlert tone="info">Ask the owner to resend your invite from Settings → Team.</AuthAlert>
      <Link href="/admin/signin" className="text-[14px] text-accent-light text-center min-h-11 inline-flex items-center justify-center hover:text-fg">
        Back to sign in
      </Link>
    </AuthCard>
  );
}

function InviteCard({ token }) {
  const router = useRouter();
  const f = useFormView();
  const [name, setName] = useState("Geoffrey Fylak");
  const [pw, setPw] = useState("");
  const [errs, setErrs] = useState({});
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (f.busy) return;
    const v = {};
    if (!name.trim()) v.name = "Tell us your name.";
    const p = passwordProblem(pw);
    if (p) v.pw = p;
    setErrs(v);
    if (Object.keys(v).length) {
      f.setStatus("invalid");
      document.getElementById(v.name ? "a5-name" : "a5-pw")?.focus();
      return;
    }
    f.setStatus("submitting");
    const r = await postJson("/api/auth/admin/invite", { token, name: name.trim(), password: pw });
    if (r.ok) {
      f.setStatus("done");
      router.push(safeNext(r.data.next));
      return;
    }
    setMessage(r.status === 410 ? "This invite has expired. Ask the owner to resend it." : "We couldn’t create your account just now. Try again in a moment.");
    f.setStatus("failed");
  }

  return (
    <AuthCard
      eyebrow="Invitation · /admin/signin/invite"
      title="Chris added you to Klyvora."
      titleId="a5"
      intro={
        <>
          You’re joining as <strong className="text-fg font-medium">Builder</strong>: leads, clients and tickets. Set a password to finish.
        </>
      }
      note="Invites expire in 7 days. Claude is not invited this way; it gets an API key with the Agent role in Settings."
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-3">
        {f.failed ? <AuthAlert>{message || "We couldn’t create your account just now."}</AuthAlert> : null}
        <AuthField id="a5-name" label="Your name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" disabled={f.busy} error={errs.name} />
        <AuthField id="a5-email" label="Email" type="email" value="[geoffrey@klyvora.ai]" readOnly autoComplete="username" hint="From the invite; ask the owner if it’s wrong." />
        <AuthField id="a5-pw" label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" disabled={f.busy} error={errs.pw} />
        <PasswordRules pw={pw} />
        <PrimaryButton busy={f.view === "submitting" || f.status === "done"} busyLabel="Creating your account…">
          Join Klyvora
        </PrimaryButton>
      </form>
      <DevStates force={f.force} setForce={f.setForce} />
    </AuthCard>
  );
}
