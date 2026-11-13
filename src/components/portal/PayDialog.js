"use client";

import { useState } from "react";
import Dialog from "./Dialog";
import { usePortal } from "./PortalContext";
import { Alert, Icon, Spinner, btnPrimary, btnSecondary } from "./ui";
import { money2 } from "@/lib/portal/sample";

// Pay Klyvora service invoices on Klyvora’s Stripe account.
// POST /api/portal/invoices/[id]/pay { method: "card" | "other" }
//   200 { checkoutUrl, paid: false }   hand off to Stripe Checkout (a placeholder URL until the back end ships this)
//   200 { paid: true }                 the card on file was charged
//   402 { error: { code: "card_declined", message } }
export default function PayDialog({ invoice, onClose }) {
  const p = usePortal();
  const [method, setMethod] = useState("card");
  const [status, setStatus] = useState("idle"); // idle | busy | declined | failed | handoff
  const [url, setUrl] = useState("");
  const busy = status === "busy";
  const amount = money2(invoice.amount);

  async function pay() {
    if (busy) return;
    setStatus("busy");
    try {
      const data = await p.api(`/api/portal/invoices/${invoice.id}/pay`, { body: { method } });
      if (data?.paid) {
        p.patch((s) => ({ paidExtra: { ...s.paidExtra, [invoice.id]: true } }));
        onClose();
        p.toast(`${amount} paid. Receipt sent to ${p.client.email}.`);
        return;
      }
      setUrl(data?.checkoutUrl || "");
      setStatus("handoff");
    } catch (err) {
      setStatus(err.code === "card_declined" || err.status === 402 ? "declined" : "failed");
    }
  }


  if (status === "handoff") {
    return (
      <Dialog
        size="small"
        eyebrow={`${invoice.name} · ${invoice.id}`}
        title="Finish on Stripe"
        onClose={onClose}
        footer={
          <>
            <button type="button" onClick={onClose} className={btnSecondary}>
              Close
            </button>
            <a href={url || "#"} target="_blank" rel="noreferrer" data-autofocus className={btnPrimary}>
              Open Stripe ↗
            </a>
          </>
        }
      >
        <div role="status" className="flex gap-2.5 items-start p-3.5 rounded-input border border-border-2 bg-surface-2">
          <Icon name="lock" size={18} className="text-accent-light mt-0.5" />
          <span className="text-muted-2">Stripe’s secure page is ready for {amount}. We never see the card number. This page updates when Stripe confirms the payment, and the receipt arrives by email.</span>
        </div>
      </Dialog>
    );
  }

  const opt = (value, title, sub) => (
    <label className={`flex gap-3 items-start p-3.5 rounded-input border cursor-pointer min-h-11 ${method === value ? "border-fg" : "border-border-2"}`}>
      <input type="radio" name="paywith" checked={method === value} onChange={() => { setMethod(value); if (status !== "busy") setStatus("idle"); }} className="mt-1 w-[18px] h-[18px] accent-[#4E85BF] flex-none" />
      <span className="flex flex-col">
        <span>{title}</span>
        <span className="text-[13px] text-muted-2">{sub}</span>
      </span>
    </label>
  );

  return (
    <Dialog
      size="small"
      eyebrow={`${invoice.name} · ${invoice.id}`}
      title={`Pay ${amount}`}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={pay} disabled={busy} aria-busy={busy} className={btnPrimary}>
            {busy ? (
              <>
                <Spinner />
                {method === "card" ? "Charging…" : "Handing you to Stripe…"}
              </>
            ) : status === "declined" || status === "failed" ? (
              "Try again"
            ) : method === "card" ? (
              `Pay ${amount}`
            ) : (
              <>Continue to Stripe ↗</>
            )}
          </button>
        </>
      }
    >
      <p className="m-0 text-muted-2">You finish on Stripe’s secure page. We never see the card number.</p>
      <div role="radiogroup" aria-label="Pay with" className="flex flex-col gap-2.5">
        {opt("card", `${p.card.brand} ending ${p.card.last4}`, "One click; receipt by email")}
        {opt("other", "Another card or bank transfer", "Opens Stripe Checkout in a new tab")}
      </div>
      {status === "declined" ? <Alert>Your bank declined the card. Nothing was charged. Try another card, or call your bank.</Alert> : null}
      {status === "failed" ? <Alert>We couldn’t reach Stripe. Nothing was charged. Try again in a moment.</Alert> : null}
    </Dialog>
  );
}
