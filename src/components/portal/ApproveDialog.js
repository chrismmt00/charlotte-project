"use client";

import { useState } from "react";
import Dialog from "./Dialog";
import { usePortal } from "./PortalContext";
import { Alert, Spinner, btnPrimary, btnSecondary, inputCls, labelCls } from "./ui";
import { money2, partAmount, checklist } from "@/lib/portal/sample";

// Approve the working demo (milestone 2). Approving creates the 30% invoice.
// POST /api/portal/project/approve-demo { note? } -> 200 { invoice: { id, percent, amount } }
export default function ApproveDialog({ onClose }) {
  const p = usePortal();
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("idle");
  const busy = status === "busy";
  const amount = partAmount(p.offer, 30);

  async function confirm() {
    if (!checked || busy) return;
    setStatus("busy");
    try {
      const data = await p.api("/api/portal/project/approve-demo", { body: { note: note.trim() } });
      const inv = data?.invoice;
      p.patch({ stage: "launch", checklist: checklist("launch") });
      onClose();
      p.toast(`Demo approved. Invoice ${inv?.id || "INV-0013"} (${money2(inv?.amount ?? amount)}) is ready to pay.`);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <Dialog
      eyebrow="Milestone 2 of 3"
      title="Approve the working demo?"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={!checked || busy} aria-busy={busy} className={btnPrimary}>
            {busy ? (
              <>
                <Spinner />
                Approving…
              </>
            ) : (
              "Approve the demo"
            )}
          </button>
        </>
      }
    >
      <p className="m-0 text-muted-2">
        You have seen the demo at{" "}
        <a href={p.project.previewUrl} className="text-accent-light">
          [staging link]
        </a>
        . Approving means the structure, pages and booking flow are right; text and photo tweaks keep coming through Support.
      </p>
      <ul className="m-0 pl-[18px] text-muted-2 flex flex-col gap-1">
        <li>
          Creates the 30% invoice: <strong className="text-fg font-medium">{money2(amount)}</strong>, payable here or from the email
        </li>
        <li>We start the launch checklist today: domain, Stripe live mode, reminders</li>
        <li>Launch sign-off comes next, usually within a week</li>
      </ul>
      <label className={`flex gap-2.5 items-start p-3.5 rounded-input border cursor-pointer min-h-11 ${checked ? "border-fg" : "border-border-2"}`}>
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 w-[18px] h-[18px] accent-[#4E85BF] flex-none" />
        <span>I clicked through the demo on my phone and it does what we agreed.</span>
      </label>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ap-note" className={labelCls}>
          Anything to fix before launch? (optional)
        </label>
        <textarea id="ap-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="The Tuesday hours are wrong; use the new logo" className={`${inputCls} border-border-2 py-3 leading-normal resize-y`} />
      </div>
      {status === "failed" ? <Alert>That didn’t go through, so nothing was approved and no invoice was created. Try again, or tell us in Support.</Alert> : null}
    </Dialog>
  );
}
