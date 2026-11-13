"use client";

import { useState } from "react";
import { btnDanger, btnPrimary, btnSecondary, money } from "@/components/admin/ui";
import { FieldRow, FormError, Modal, Note, addDays, addMonths, api, checkClass, checkLabelClass, inputClass, linkInline, shortDate, splitEven, useSubmit } from "@/components/admin/billing/kit";
import { nextMilestoneFor } from "@/lib/admin/sample-projects";
import { INVOICE_CLIENTS } from "@/lib/admin/sample-billing";

const KINDS = [
  { value: "milestone", label: "Milestone (50 / 30 / 20)" },
  { value: "hardware", label: "Hardware (100% before order)" },
  { value: "add-on", label: "Add-on" },
  { value: "custom", label: "Custom" },
];
const DUE_OPTIONS = ["On receipt", "7 days", "14 days", "On demo approval (trigger)", "On launch acceptance (trigger)"];
const DUE_DAYS = { "On receipt": 0, "7 days": 7, "14 days": 14 };
const CLIENT_KEY = { "Food truck [6]": "ft6", "Braids studio [7]": "br7", "Studio [9]": "st9", "Bakery [5]": "bk5", "Detailing [4]": "dt4" };

const sel = `${inputClass} cursor-pointer`;
const bad = (e) => (e ? "!border-danger" : "");
// Board table inside a dialog: surface-2 header row, th 8px 10px, td 6px 10px.
const dth = "text-left font-medium text-[13px] text-muted-2 px-2.5 py-2 whitespace-nowrap";

function startLines(client, kind) {
  if (kind === "milestone") {
    const n = nextMilestoneFor(client);
    if (n) return [{ d: `${n.project.offer} · ${n.milestone.label.toLowerCase()}`, q: "1", u: String(n.milestone.amount) }];
  }
  if (kind === "hardware") return [{ d: "Kiosk hardware · [vendor] stand + tablet", q: "1", u: "" }];
  return [{ d: "", q: "1", u: "" }];
}

const lineTotal = (l) => (Number(l.q) || 0) * (Number(l.u) || 0);

// ---------- New invoice ----------
export function NewInvoiceDialog({ today, initial, onClose, onCreated }) {
  const [client, setClient] = useState(initial?.client || INVOICE_CLIENTS[0]);
  const [kind, setKind] = useState(initial?.kind || "milestone");
  const [lines, setLines] = useState(initial?.lines || startLines(initial?.client || INVOICE_CLIENTS[0], initial?.kind || "milestone"));
  const [due, setDue] = useState("On receipt");
  const [memo, setMemo] = useState("");
  const [methods, setMethods] = useState("Card + bank (ACH)");
  const [sendNow, setSendNow] = useState(true);
  const [errors, setErrors] = useState({});
  const sub = useSubmit();
  const total = lines.reduce((a, l) => a + lineTotal(l), 0);
  const hardware = kind === "hardware";
  const setLine = (i, k, v) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const pickClient = (v) => {
    setClient(v);
    setLines(startLines(v, kind));
  };
  const pickKind = (v) => {
    setKind(v);
    setLines(startLines(client, v));
    if (v === "hardware") setSendNow(false);
  };
  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    const filled = lines.filter((l) => l.d.trim());
    if (!filled.length) next.lines = "Add at least one line with a description.";
    else if (!hardware && total <= 0) next.lines = "Enter a unit price so the total is more than $0.";
    else if (filled.some((l) => l.u !== "" && !(Number(l.u) >= 0))) next.lines = "Unit prices are whole dollars, like 450.";
    if (sendNow && hardware && total <= 0) next.lines = "Add the vendor quote amount before sending, or save it as a draft.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const out = await sub.run(() =>
      api("/api/admin/invoices", {
        method: "POST",
        body: { clientId: CLIENT_KEY[client], kind, lines: filled.map((l) => ({ description: l.d.trim(), qty: Number(l.q) || 1, unit: Number(l.u) || 0 })), due, memo, methods, sendNow },
      })
    );
    if (out) {
      const offset = DUE_DAYS[due];
      onCreated({
        ...out.invoice,
        client,
        kind,
        forLabel: filled[0].d.trim(),
        due: offset != null ? addDays(today, offset) : null,
        paid: 0,
        trigger: due.includes("trigger") ? due.replace(" (trigger)", "") : "Written by hand",
        billingEmail: "billing@example.com",
        stripe: "in_[…]",
        lines: filled.map((l) => ({ description: l.d.trim(), note: "", amount: total > 0 ? lineTotal(l) : null })),
        history: [{ when: "today", text: "Created by hand" }, ...(sendNow ? [{ when: "today", text: "Sent to billing@example.com" }] : [])],
        plan: null,
      });
    }
  };
  return (
    <Modal
      id="ni"
      eyebrow="Invoices"
      title="New invoice"
      w={720}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="ni-form" className={btnPrimary} disabled={sub.submitting}>
            {sub.submitting ? "Saving…" : sendNow ? "Create and send" : "Save draft"}
          </button>
        </>
      }
    >
      <form id="ni-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="ni-client" label="Client">
            <select id="ni-client" data-autofocus value={client} onChange={(e) => pickClient(e.target.value)} className={sel}>
              {INVOICE_CLIENTS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="ni-kind" label="Kind">
            <select id="ni-kind" value={kind} onChange={(e) => pickKind(e.target.value)} className={sel}>
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </FieldRow>
        </div>

        <fieldset className="border-0 p-0 m-0 min-w-0 flex flex-col gap-1.5">
          <legend className="text-xs text-muted-2 p-0 mb-1.5">Lines</legend>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[480px]">
              <thead>
                <tr className="bg-surface-2">
                  <th scope="col" className={dth}>
                    Description
                  </th>
                  <th scope="col" className={`${dth} w-[70px]`}>
                    Qty
                  </th>
                  <th scope="col" className={`${dth} w-[120px] text-right`}>
                    Unit
                  </th>
                  <th scope="col" className={`${dth} w-[110px] text-right`}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2.5 py-1.5">
                      <input type="text" aria-label={`Line ${i + 1} description`} value={l.d} onChange={(e) => setLine(i, "d", e.target.value)} className={`${inputClass} !min-h-9`} />
                    </td>
                    <td className="px-2.5 py-1.5">
                      <input type="text" inputMode="numeric" aria-label={`Line ${i + 1} quantity`} value={l.q} onChange={(e) => setLine(i, "q", e.target.value)} className={`${inputClass} !min-h-9`} />
                    </td>
                    <td className="px-2.5 py-1.5">
                      <input type="text" inputMode="numeric" aria-label={`Line ${i + 1} unit price in dollars`} value={l.u} onChange={(e) => setLine(i, "u", e.target.value)} placeholder={hardware ? "[quote]" : ""} className={`${inputClass} !min-h-9 text-right`} />
                    </td>
                    <td className="px-2.5 py-1.5 text-right tabular-nums">{l.u !== "" ? money(lineTotal(l)) : "—"}</td>
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <td colSpan={3} className="px-2.5 py-2">
                    <button type="button" className={linkInline} onClick={() => setLines((ls) => [...ls, { d: "", q: "1", u: "" }])}>
                      + Add a line
                    </button>
                  </td>
                  <td className="px-2.5 py-2 text-right font-medium tabular-nums">{total > 0 ? money(total) : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {errors.lines ? (
            <p id="ni-lines-err" role="alert" className="m-0 text-xs text-danger">
              {errors.lines}
            </p>
          ) : null}
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <FieldRow id="ni-due" label="Due">
            <select id="ni-due" value={due} onChange={(e) => setDue(e.target.value)} className={sel}>
              {DUE_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="ni-memo" label="Memo on the invoice">
            <input id="ni-memo" type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Thanks — this covers the kiosk hardware" className={inputClass} />
          </FieldRow>
          <FieldRow id="ni-pm" label="Payment methods">
            <select id="ni-pm" value={methods} onChange={(e) => setMethods(e.target.value)} className={sel}>
              <option>Card + bank (ACH)</option>
              <option>Card only</option>
              <option>Bank only</option>
            </select>
          </FieldRow>
        </div>
        {hardware ? <Note>Hardware is invoiced at 100% before we order. Put the vendor quote number in the memo; the kiosk device plan ($29/mo each) starts when the device is activated.</Note> : null}
        <label className={checkLabelClass}>
          <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} className={checkClass} />
          Send it now (otherwise it saves as a draft)
        </label>
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}

// ---------- Send invoice / reminder ----------
export function SendDialog({ invoice, onClose, onSent }) {
  const remind = invoice.status === "Due" || invoice.status === "Overdue";
  const [to, setTo] = useState(invoice.billingEmail);
  const [tpl, setTpl] = useState(remind ? (invoice.status === "Overdue" ? "Overdue · firm but kind" : "Due soon") : "New invoice");
  const [copy, setCopy] = useState(true);
  const [error, setError] = useState("");
  const sub = useSubmit();
  const amount = invoice.amount == null ? "[amount]" : money(invoice.amount - invoice.paid);
  const label = invoice.forLabel.split(" · ")[0];
  const subject = remind ? `Quick reminder: ${invoice.number} for ${label}` : `Invoice ${invoice.number} from Klyvora · ${amount}`;
  const body =
    invoice.status === "Overdue"
      ? `Hi [First name], ${invoice.number} (${amount}) was due ${shortDate(invoice.due)}. Work on the next milestone picks back up as soon as it clears. Pay by card or bank from the link; reply if something is off.`
      : remind
        ? `Hi [First name], a quick note that ${invoice.number} (${amount}) is due ${shortDate(invoice.due)}. Pay by card or bank from the link.`
        : `Hi [First name], here is ${invoice.number} for ${invoice.forLabel}. Pay by card or bank from the button; your receipt lands in the portal.`;
  const templates = [tpl, "Friendly nudge", "Second reminder", "Final notice before pause"].filter((v, i, a) => a.indexOf(v) === i);
  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    const out = await sub.run(() => api(`/api/admin/invoices/${invoice.id}/send`, { method: "POST", body: { to, template: tpl, copyMe: copy } }));
    if (out) onSent(out.kind);
  };
  return (
    <Modal
      id="sd"
      eyebrow={`${invoice.number} · ${amount}`}
      title={remind ? "Send a reminder" : "Send the invoice"}
      w={560}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="sd-form" className={btnPrimary} disabled={sub.submitting}>
            {sub.submitting ? "Sending…" : remind ? "Send reminder" : "Send invoice"}
          </button>
        </>
      }
    >
      <form id="sd-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="sd-to" label="To" error={error}>
            <input id="sd-to" data-autofocus type="email" value={to} onChange={(e) => setTo(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "sd-to-err" : undefined} className={`${inputClass} ${bad(error)}`} />
          </FieldRow>
          <FieldRow id="sd-tpl" label="Template">
            <select id="sd-tpl" value={tpl} onChange={(e) => setTpl(e.target.value)} className={sel}>
              {templates.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FieldRow>
        </div>
        <div className="border border-border rounded-xl p-3.5 bg-surface-2 leading-[1.6] text-muted-2">
          <strong className="font-medium text-fg">{subject}</strong>
          <br />
          {body}
          <br />
          <span className="inline-block mt-2 rounded-full bg-fg text-bg px-3.5 py-1.5 font-medium">Pay {amount}</span>
        </div>
        <label className={checkLabelClass}>
          <input type="checkbox" checked={copy} onChange={(e) => setCopy(e.target.checked)} className={checkClass} />
          Copy me
        </label>
        <p className="m-0 text-muted">{remind ? "Second reminder goes out automatically in 7 days unless paid or paused." : "Sending moves the draft to Due and creates the Stripe invoice."}</p>
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}

// ---------- Record manual payment ----------
export function PaymentDialog({ invoice, today, onClose, onRecorded }) {
  const balance = invoice.amount - invoice.paid;
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState("Cash");
  const [received, setReceived] = useState(today);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const sub = useSubmit();
  const n = Number(amount);
  const submit = async (e) => {
    e.preventDefault();
    if (!Number.isInteger(n) || n <= 0) return setError("Enter whole dollars, like 450.");
    if (n > balance) return setError(`That is more than the ${money(balance)} still due.`);
    setError("");
    const out = await sub.run(() => api(`/api/admin/invoices/${invoice.id}/payments`, { method: "POST", body: { kind: "manual", amount: n, method, receivedOn: received, reference, note } }));
    if (out) onRecorded(n, method);
  };
  return (
    <Modal
      id="mp"
      eyebrow={`${invoice.number} · ${invoice.client}`}
      title="Record a manual payment"
      w={520}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="mp-form" className={btnPrimary} disabled={sub.submitting}>
            {sub.submitting ? "Saving…" : "Mark paid"}
          </button>
        </>
      }
    >
      <form id="mp-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="mp-amt" label="Amount" error={error}>
            <input id="mp-amt" data-autofocus type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "mp-amt-err" : undefined} className={`${inputClass} ${bad(error)}`} />
          </FieldRow>
          <FieldRow id="mp-how" label="Method">
            <select id="mp-how" value={method} onChange={(e) => setMethod(e.target.value)} className={sel}>
              {["Cash", "Check", "Zelle", "Cash App", "Bank transfer", "Other"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="mp-date" label="Received">
            <input id="mp-date" type="date" value={received} onChange={(e) => setReceived(e.target.value)} className={inputClass} />
          </FieldRow>
          <FieldRow id="mp-ref" label="Reference">
            <input id="mp-ref" type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Check no., Zelle memo" className={inputClass} />
          </FieldRow>
        </div>
        <FieldRow id="mp-note" label="Note">
          <input id="mp-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Paid in person at the shop" className={inputClass} />
        </FieldRow>
        <Note>Marks the Stripe invoice as paid out of band and sends the receipt. If the amount is less than the total, the rest stays due.</Note>
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}

// ---------- Payment plan ----------
export function PlanDialog({ invoice, today, onClose, onSet }) {
  const balance = invoice.amount - invoice.paid;
  const [count, setCount] = useState(3);
  const [first, setFirst] = useState(today);
  const [every, setEvery] = useState("2 weeks");
  const [auto, setAuto] = useState(true);
  const sub = useSubmit();
  const amounts = splitEven(balance, count);
  const dueOf = (i) => (every === "Month" ? addMonths(first, i) : addDays(first, i * 14));
  const submit = async (e) => {
    e.preventDefault();
    const out = await sub.run(() => api(`/api/admin/invoices/${invoice.id}/payments`, { method: "POST", body: { kind: "plan", count, firstOn: first, every, autoCharge: auto } }));
    if (out) onSet({ count, firstOn: first, every, autoCharge: auto, amounts, dates: amounts.map((_, i) => dueOf(i)) });
  };
  return (
    <Modal
      id="pp"
      eyebrow={`${invoice.number} · ${money(balance)}`}
      title="Set up a payment plan"
      w={560}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="pp-form" className={btnPrimary} disabled={sub.submitting}>
            {sub.submitting ? "Saving…" : "Set up plan"}
          </button>
        </>
      }
    >
      <form id="pp-form" onSubmit={submit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <span id="pp-split" className="text-xs text-muted-2">
            Split into
          </span>
          <div role="radiogroup" aria-labelledby="pp-split" className="inline-flex gap-1 p-1 border border-border-2 rounded-full self-start">
            {[2, 3, 4].map((n, i) => (
              <button key={n} type="button" role="radio" aria-checked={count === n} data-autofocus={i === 0 ? "" : undefined} onClick={() => setCount(n)} className={`min-h-8 px-3.5 rounded-full border-0 text-[13px] font-medium cursor-pointer ${count === n ? "bg-fg text-bg" : "bg-transparent text-muted-2 hover:text-fg"}`}>
                {n} payments
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="pp-first" label="First payment">
            <input id="pp-first" type="date" value={first} onChange={(e) => setFirst(e.target.value)} className={inputClass} />
          </FieldRow>
          <FieldRow id="pp-every" label="Then every">
            <select id="pp-every" value={every} onChange={(e) => setEvery(e.target.value)} className={sel}>
              <option>2 weeks</option>
              <option>Month</option>
            </select>
          </FieldRow>
        </div>
        <table className="w-full border-collapse">
          <caption className="sr-only">Payment schedule</caption>
          <thead>
            <tr className="bg-surface-2">
              <th scope="col" className={dth}>
                Payment
              </th>
              <th scope="col" className={dth}>
                Due
              </th>
              <th scope="col" className={`${dth} text-right`}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {amounts.map((a, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-2.5 py-2">
                  Payment {i + 1} of {count}
                </td>
                <td className="px-2.5 py-2 text-muted-2">{shortDate(dueOf(i))}</td>
                <td className="px-2.5 py-2 text-right tabular-nums">{money(a)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <label className={checkLabelClass}>
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className={checkClass} />
          Charge the card on file automatically on each date
        </label>
        <p className="m-0 text-muted">Work on the next milestone still waits for the milestone to be fully paid. No fee for splitting.</p>
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}

// ---------- Void ----------
export function VoidDialog({ invoice, onClose, onVoided }) {
  const sub = useSubmit();
  const confirm = async () => {
    const out = await sub.run(() => api(`/api/admin/invoices/${invoice.id}`, { method: "PATCH", body: { status: "void" } }));
    if (out) onVoided();
  };
  return (
    <Modal
      id="vd"
      alert
      tight
      w={440}
      title={`Void ${invoice.number}?`}
      describedBy="vd-p"
      onClose={onClose}
      footer={
        <>
          <button type="button" data-autofocus className={btnSecondary} onClick={onClose}>
            Keep it
          </button>
          <button type="button" className={btnDanger} onClick={confirm} disabled={sub.submitting}>
            {sub.submitting ? "Voiding…" : "Void invoice"}
          </button>
        </>
      }
    >
      <p id="vd-p" className="m-0 text-muted-2 leading-[1.6]">
        {invoice.client} gets a notice that {invoice.number} is canceled and the pay link stops working. This cannot be undone; write a new invoice if it was a mistake.
      </p>
      <FormError message={sub.status === "failed" ? sub.error : ""} />
    </Modal>
  );
}
