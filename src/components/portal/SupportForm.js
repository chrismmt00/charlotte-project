"use client";

import { useId, useState } from "react";
import { CONTACT } from "@/lib/site";
import { Alert, FieldError, Icon, Spinner, btnPrimary, inputCls, labelCls, linkBtn } from "./ui";
import { usePortal } from "./PortalContext";

// New request form with five states: idle, validation error, submitting, sent, failed.
// POST /api/portal/tickets { subject, message } -> 201 { ticket }   (the ticket shape in lib/portal/sample.js)
export default function SupportForm() {
  const p = usePortal();
  const uid = useId();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | invalid | submitting | sent | failed
  const [sentSubject, setSentSubject] = useState("");
  const [newId, setNewId] = useState("");
  const busy = status === "submitting";
  const subjectId = `${uid}-subject`;
  const msgId = `${uid}-msg`;

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    if (!subject.trim()) {
      setStatus("invalid");
      document.getElementById(subjectId)?.focus();
      return;
    }
    setStatus("submitting");
    try {
      const data = await p.api("/api/portal/tickets", { body: { subject: subject.trim(), message: message.trim() } });
      const ticket = data?.ticket || { id: "TK-041", subject: subject.trim(), status: "open", when: "Just now", messages: [{ who: "You", when: "Just now", text: message.trim() || "(no details)" }] };
      p.patch((s) => ({ tickets: [{ ...ticket, expanded: false }, ...s.tickets] }));
      setSentSubject(ticket.subject);
      setNewId(ticket.id);
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="flex flex-col gap-2.5 p-5 rounded-input border border-border-2 bg-surface-2">
        <Icon name="check" size={24} strokeWidth={2} className="text-success" />
        <p className="m-0 text-[15px] leading-normal">
          Got it: <strong className="font-medium">{sentSubject}</strong>
        </p>
        <p className="m-0 text-sm leading-[1.6] text-muted-2">A person in Charlotte replies by email, usually the same business day. It is open in your tickets as {newId}.</p>
        <button
          type="button"
          onClick={() => {
            setSubject("");
            setMessage("");
            setStatus("idle");
          }}
          className={`${linkBtn} self-start`}
        >
          Send another
        </button>
      </div>
    );
  }

  const bad = status === "invalid";
  return (
    <form noValidate onSubmit={onSubmit} aria-busy={busy} className="flex flex-col gap-3">
      {status === "failed" ? <Alert>That didn’t send. Your text is still here. Try again, or text us at {CONTACT.phone}.</Alert> : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={subjectId} className={labelCls}>
          Subject
        </label>
        <input
          id={subjectId}
          type="text"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (bad) setStatus("idle");
          }}
          placeholder="Change our hours, new photos, a question"
          disabled={busy}
          aria-invalid={bad ? true : undefined}
          aria-describedby={bad ? `${subjectId}-err` : undefined}
          className={`${inputCls} ${bad ? "border-danger" : "border-border-2"}`}
        />
        {bad ? <FieldError id={`${subjectId}-err`}>Give it a subject so we can route it.</FieldError> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={msgId} className={labelCls}>
          Details
        </label>
        <textarea
          id={msgId}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What should change, and by when"
          disabled={busy}
          className={`${inputCls} border-border-2 py-3 leading-normal resize-y min-h-[88px]`}
        />
      </div>
      <button type="submit" disabled={busy} aria-busy={busy} className={`${btnPrimary} self-start`}>
        {busy ? (
          <>
            <Spinner />
            Sending…
          </>
        ) : status === "failed" ? (
          "Try again"
        ) : (
          "Send to Klyvora"
        )}
      </button>
      <span className="text-[13px] text-muted-2">
        {p.live ? "Small changes come out of your plan hours." : "Before launch, requests go straight to your builder."} Or text us: {CONTACT.phone}.
      </span>
    </form>
  );
}
