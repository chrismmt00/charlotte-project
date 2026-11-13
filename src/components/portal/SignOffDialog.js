"use client";

import Link from "next/link";
import { useState } from "react";
import Dialog from "./Dialog";
import { planStartLine, usePortal } from "./PortalContext";
import { Alert, FieldError, Spinner, btnPrimary, btnSecondary, inputCls, labelCls } from "./ui";
import { money2, partAmount } from "@/lib/portal/sample";

// Launch sign-off (milestone 3) with a typed e-signature. It makes the 20% invoice due, releases the code
// and starts the monthly plan if one was chosen.
// POST /api/portal/project/sign-off { signatureName, title? } -> 200 { invoice: { id, percent, amount }, planStarted }
export default function SignOffDialog({ onClose }) {
  const p = usePortal();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("Owner");
  const [agree, setAgree] = useState(false);
  const [nameBad, setNameBad] = useState(false);
  const [status, setStatus] = useState("idle");
  const busy = status === "busy";
  const amount = partAmount(p.offer, 20);

  async function confirm() {
    if (busy) return;
    if (name.trim().length < 4) {
      setNameBad(true);
      document.getElementById("so-name")?.focus();
      return;
    }
    if (!agree) return;
    setStatus("busy");
    try {
      const data = await p.api("/api/portal/project/sign-off", { body: { signatureName: name.trim(), title: title.trim() } });
      const inv = data?.invoice;
      p.patch({ stage: "accepted" });
      onClose();
      p.toast(`Signed. Welcome to launch; ${inv?.id || "INV-0014"} (${money2(inv?.amount ?? amount)}) is ready to pay.`);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <Dialog
      eyebrow="Milestone 3 of 3 · e-sign"
      title="Sign off on the launch"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={!agree || busy} aria-busy={busy} className={btnPrimary}>
            {busy ? (
              <>
                <Spinner />
                Signing…
              </>
            ) : (
              "Sign and accept the launch"
            )}
          </button>
        </>
      }
    >
      <p className="m-0 text-muted-2">
        Your site is live at{" "}
        <a href={p.project.previewUrl} className="text-accent-light">
          {p.project.domain}
        </a>
        . Signing accepts the launch as agreed in the proposal.
      </p>
      <ul className="m-0 pl-[18px] text-muted-2 flex flex-col gap-1">
        <li>
          The 20% invoice (<strong className="text-fg font-medium">{money2(amount)}</strong>) becomes due
        </li>
        <li>The code moves to your GitHub account and the handover pack unlocks</li>
        <li>{planStartLine(p)}</li>
      </ul>
      {status === "failed" ? <Alert>The signature didn’t save, so nothing was signed and nothing is due yet. Your name is still here. Try again in a moment.</Alert> : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="so-name" className={labelCls}>
          Your full name
        </label>
        <input
          id="so-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameBad(false);
          }}
          placeholder="As on the proposal"
          autoComplete="name"
          aria-invalid={nameBad ? true : undefined}
          aria-describedby={nameBad ? "so-name-err" : undefined}
          className={`${inputCls} ${nameBad ? "border-danger" : "border-border-2"}`}
        />
        {nameBad ? <FieldError id="so-name-err">Type your full name to sign.</FieldError> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="so-title" className={labelCls}>
          Title
        </label>
        <input id="so-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputCls} border-border-2`} />
      </div>
      <div role="group" aria-label="Signature preview" className="px-4 py-3.5 rounded-input border border-dashed border-border-2 bg-surface-2">
        <div className="eyebrow mb-1">Signature preview</div>
        <div className={`font-display italic text-[28px] leading-tight break-words ${name.trim() ? "text-fg" : "text-muted"}`}>{name.trim() || "Your name appears here"}</div>
      </div>
      <label className="flex gap-2.5 items-start cursor-pointer min-h-11">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-[18px] h-[18px] accent-[#4E85BF] flex-none" />
        <span>
          I accept the launch. Typing my name is my signature, the same as on the proposal.{" "}
          <Link href="/terms" className="text-accent-light" target="_blank">
            Terms
          </Link>
          .
        </span>
      </label>
    </Dialog>
  );
}
