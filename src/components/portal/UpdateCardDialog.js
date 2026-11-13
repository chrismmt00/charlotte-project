"use client";

import { useState } from "react";
import Dialog from "./Dialog";
import { usePortal } from "./PortalContext";
import { Alert, Spinner, btnPrimary, btnSecondary } from "./ui";

// Update card: hands off to Stripe's secure page.
// POST /api/portal/account/card -> { setupUrl } (Stripe Checkout in setup mode / billing portal session)
export default function UpdateCardDialog({ onClose }) {
  const p = usePortal();
  const [status, setStatus] = useState("idle"); // idle | busy | failed
  const busy = status === "busy";

  async function go() {
    setStatus("busy");
    try {
      await p.api("/api/portal/account/card", { body: {} });
      onClose();
      p.toast("Opening Stripe in a new tab…");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <Dialog
      size="small"
      eyebrow="Stripe"
      title="Update the card on file"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={go} disabled={busy} aria-busy={busy} className={btnPrimary}>
            {busy ? (
              <>
                <Spinner />
                Opening Stripe…
              </>
            ) : status === "failed" ? (
              "Try again"
            ) : (
              <>Continue to Stripe ↗</>
            )}
          </button>
        </>
      }
    >
      <p className="m-0 text-muted-2">Stripe opens a secure page to take the new card. We get back only the last four digits and the expiry. The old card is removed once the new one is saved.</p>
      <div className="px-3.5 py-3 rounded-input bg-surface-2 border border-border flex flex-col gap-0.5">
        <span className="text-[13px] text-muted-2">Current</span>
        <span>
          {p.card.brand} ending {p.card.last4} · Expires {p.card.exp}
        </span>
      </div>
      {status === "failed" ? <Alert>We couldn’t reach Stripe. Nothing changed on your card. Try again in a moment.</Alert> : null}
    </Dialog>
  );
}
