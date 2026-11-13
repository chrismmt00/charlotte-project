"use client";
import { useState } from "react";
import {
  AuthCard,
  AuthAlert,
  AuthField,
  PrimaryButton,
  postJson,
  EMAIL_RE,
} from "./parts";
export function SignInCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  async function submit(e) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setStatus("invalid");
    setStatus("busy");
    const result = await postJson("/api/auth/admin/link", {
      email: email.trim(),
    });
    setStatus(result.ok ? "sent" : "failed");
  }
  return (
    <AuthCard
      eyebrow="Admin · sign in"
      title="Sign in to Klyvora."
      titleId="admin-signin"
      intro="Team only. Use your work email."
      note="Your sign-in link works once and expires in 15 minutes. Accounts are created by the owner; there is no public registration."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {status === "sent" ? (
          <AuthAlert tone="info">
            If this email belongs to the team, a sign-in link is on its way.
            Check your inbox.
          </AuthAlert>
        ) : null}
        {status === "failed" ? (
          <AuthAlert>
            We could not send the link. Please try again shortly.
          </AuthAlert>
        ) : null}
        <AuthField
          id="admin-email"
          label="Work email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={status === "busy"}
          error={status === "invalid" ? "Enter a valid work email." : ""}
        />
        <PrimaryButton busy={status === "busy"} busyLabel="Sending…">
          Email me a sign-in link
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
export function CodeCard() {
  return <SignInCard />;
}
export function ResetScreen() {
  return <SignInCard />;
}
export function InviteScreen() {
  return <SignInCard />;
}
