"use client";

import { useState } from "react";
import Dialog, { CancelButton } from "./Dialog";
import { FieldError, FormGroup, Spinner, btnDestructive, inputCls } from "./ui";
import { useAction } from "./hooks";
import { api } from "./api";

// Money goes back through the owner's own Stripe account: confirm here, then the caller toasts.
// payment: { id, who, what, amount }; onDone(payment) runs after the stub says yes.
export default function RefundDialog({ payment, onClose, onDone }) {
  const [amount, setAmount] = useState("full");
  const [requestId] = useState(() => crypto.randomUUID());
  const [other, setOther] = useState("");
  const [reason, setReason] = useState("Customer asked");
  const [bad, setBad] = useState("");
  const { busy, error, run } = useAction();

  const submit = async (e) => {
    e.preventDefault();
    if (amount === "other" && !other.trim()) {
      setBad("Enter the amount to refund.");
      return;
    }
    setBad("");
    const r = await run(
      () => api(`/api/app/payments/${encodeURIComponent(payment.id)}/refund`, { body: { requestId, amount: amount === "other" ? Number(other) : "full", reason } }),
      "The refund didn’t go through. Nothing was sent to Stripe. Try again."
    );
    if (r.ok) onDone(payment);
  };

  return (
    <Dialog
      size="small"
      eyebrow={`${payment.amount} · ${payment.what}`}
      title={`Refund ${payment.who}?`}
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      footer={
        <>
          <CancelButton onClick={onClose} disabled={busy} />
          <button type="submit" className={btnDestructive} disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? "Refunding…" : `Refund ${payment.amount}`}
          </button>
        </>
      }
    >
      <p className="m-0 text-muted-2">Stripe sends it back to the same card in 5 to 10 business days. The customer gets an email from Stripe.</p>
      <FormGroup id="rf-amt" label="Amount">
        <select id="rf-amt" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} cursor-pointer`}>
          <option value="full">Full amount</option>
          <option value="deposit">Deposit only</option>
          <option value="other">Other…</option>
        </select>
      </FormGroup>
      {amount === "other" ? (
        <FormGroup id="rf-other" label="Amount to refund" error={bad}>
          <input
            id="rf-other"
            type="text"
            inputMode="decimal"
            value={other}
            onChange={(e) => {
              setOther(e.target.value);
              setBad("");
            }}
            placeholder="$0"
            aria-invalid={bad ? true : undefined}
            aria-describedby={bad ? "rf-other-err" : undefined}
            className={inputCls}
          />
        </FormGroup>
      ) : null}
      <FormGroup id="rf-why" label="Reason">
        <select id="rf-why" value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} cursor-pointer`}>
          <option>Customer asked</option>
          <option>We had to cancel</option>
          <option>Duplicate charge</option>
          <option>Other</option>
        </select>
      </FormGroup>
      {error ? <FieldError>{error}</FieldError> : null}
    </Dialog>
  );
}
