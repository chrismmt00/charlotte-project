"use client";

import { useEffect, useState } from "react";
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSecondary,
  money,
} from "@/components/admin/ui";
import {
  FieldRow,
  FormError,
  Modal,
  Note,
  addDays,
  addMonths,
  api,
  checkClass,
  inputClass,
  shortDate,
  splitEven,
  textareaClass,
  thClass,
  useSubmit,
} from "@/components/admin/billing/kit";
import { nextMilestoneFor } from "@/lib/admin/sample-projects";

const KINDS = [
  { value: "hardware", label: "Hardware (100% before order)" },
  { value: "add-on", label: "Add-on" },
  { value: "custom", label: "Custom" },
];
const DUE_OPTIONS = [
  "On receipt",
  "7 days",
  "14 days",
  "On demo approval (trigger)",
  "On launch acceptance (trigger)",
];
const DUE_DAYS = { "On receipt": 0, "7 days": 7, "14 days": 14 };

function startLines(client, kind) {
  if (kind === "milestone") {
    const n = nextMilestoneFor(client);
    if (n)
      return [
        {
          d: `${n.project.offer} · ${n.milestone.label.toLowerCase()}`,
          q: "1",
          u: String(n.milestone.amount),
        },
      ];
  }
  if (kind === "hardware")
    return [{ d: "Kiosk hardware · [vendor] stand + tablet", q: "1", u: "" }];
  return [{ d: "", q: "1", u: "" }];
}

const lineTotal = (l) => (Number(l.q) || 0) * (Number(l.u) || 0);

// ---------- New invoice ----------
export function NewInvoiceDialog({ today, initial, onClose, onCreated }) {
  const [clientRows, setClientRows] = useState([]);
  useEffect(() => {
    let alive = true;
    api("/api/admin/clients")
      .then((d) => {
        if (alive) setClientRows(d.clients);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const INVOICE_CLIENTS = clientRows.map((c) => c.business);
  const CLIENT_KEY = Object.fromEntries(
    clientRows.map((c) => [c.business, c.id]),
  );
  const [client, setClient] = useState(initial?.client || "");
  const [kind, setKind] = useState(initial?.kind || "custom");
  const [lines, setLines] = useState(
    initial?.lines ||
      startLines(initial?.client || "", initial?.kind || "custom"),
  );
  const [due, setDue] = useState("On receipt");
  const [memo, setMemo] = useState("");
  const [methods, setMethods] = useState("Card + bank (ACH)");
  const [sendNow, setSendNow] = useState(true);
  const [errors, setErrors] = useState({});
  const sub = useSubmit();
  const total = lines.reduce((a, l) => a + lineTotal(l), 0);
  const hardware = kind === "hardware";
  const setLine = (i, k, v) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
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
    if (!filled.length)
      next.lines = "Add at least one line with a description.";
    else if (!hardware && total <= 0)
      next.lines = "Enter a unit price so the total is more than $0.";
    else if (filled.some((l) => l.u !== "" && !(Number(l.u) >= 0)))
      next.lines = "Unit prices are whole dollars, like 450.";
    if (sendNow && hardware && total <= 0)
      next.lines =
        "Add the vendor quote amount before sending, or save it as a draft.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const out = await sub.run(() =>
      api("/api/admin/invoices", {
        method: "POST",
        body: {
          clientId: CLIENT_KEY[client],
          kind,
          lines: filled.map((l) => ({
            description: l.d.trim(),
            qty: Number(l.q) || 1,
            unit: Number(l.u) || 0,
          })),
          due: addDays(today, DUE_DAYS[due] ?? 7),
          memo,
          methods: [methods],
          sendNow,
        },
      }),
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
        trigger: due.includes("trigger")
          ? due.replace(" (trigger)", "")
          : "Written by hand",
        billingEmail:
          clientRows.find((c) => c.business === client)?.email || "",
        stripe: out.invoice.stripe,
        lines: filled.map((l) => ({
          description: l.d.trim(),
          note: "",
          amount: total > 0 ? lineTotal(l) : null,
        })),
        history: [
          { when: "today", text: "Created by hand" },
          ...(sendNow ? [{ when: "today", text: "Queued for delivery" }] : []),
        ],
        plan: null,
      });
    }
  };
  return (
    <Modal
      id="ni"
      eyebrow="Invoices"
      title="New invoice"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="ni-form"
            className={btnPrimary}
            disabled={sub.submitting}
          >
            {sub.submitting
              ? "Saving…"
              : sendNow
                ? "Create and send"
                : "Save draft"}
          </button>
        </>
      }
    >
      <form
        id="ni-form"
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-3.5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="ni-client" label="Client">
            <select
              id="ni-client"
              data-autofocus
              value={client}
              onChange={(e) => pickClient(e.target.value)}
              className={inputClass}
            >
              <option value="">Choose a client</option>
              {INVOICE_CLIENTS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="ni-kind" label="Kind">
            <select
              id="ni-kind"
              value={kind}
              onChange={(e) => pickKind(e.target.value)}
              className={inputClass}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </FieldRow>
        </div>

        <fieldset className="border-0 p-0 m-0 min-w-0">
          <legend className="text-[12px] text-muted-2 mb-1.5 p-0">Lines</legend>
          <div className="border border-border rounded-[12px] overflow-x-auto">
            <table className="w-full border-collapse min-w-[520px]">
              <thead>
                <tr>
                  {["Description", "Qty", "Unit ($)", "Total"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className={`${thClass} ${h === "Total" ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td className="p-1.5">
                      <input
                        type="text"
                        aria-label={`Line ${i + 1} description`}
                        value={l.d}
                        onChange={(e) => setLine(i, "d", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="p-1.5 w-[70px]">
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Line ${i + 1} quantity`}
                        value={l.q}
                        onChange={(e) => setLine(i, "q", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="p-1.5 w-[110px]">
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Line ${i + 1} unit price in dollars`}
                        value={l.u}
                        onChange={(e) => setLine(i, "u", e.target.value)}
                        placeholder={hardware ? "[quote]" : ""}
                        className={inputClass}
                      />
                    </td>
                    <td className="p-1.5 text-right w-[90px]">
                      {l.u !== "" ? money(lineTotal(l)) : "—"}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="p-1.5">
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() =>
                        setLines((ls) => [...ls, { d: "", q: "1", u: "" }])
                      }
                    >
                      + Add a line
                    </button>
                  </td>
                  <td className="p-1.5 text-right font-medium">
                    {total > 0 ? money(total) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {errors.lines ? (
            <p
              id="ni-lines-err"
              role="alert"
              className="m-0 mt-1.5 text-[12px] text-danger"
            >
              {errors.lines}
            </p>
          ) : null}
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="ni-due" label="Due">
            <select
              id="ni-due"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className={inputClass}
            >
              {DUE_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="ni-pm" label="Payment methods">
            <select
              id="ni-pm"
              value={methods}
              onChange={(e) => setMethods(e.target.value)}
              className={inputClass}
            >
              <option>Card + bank (ACH)</option>
              <option>Card only</option>
              <option>Bank only</option>
            </select>
          </FieldRow>
        </div>
        <FieldRow id="ni-memo" label="Memo on the invoice">
          <input
            id="ni-memo"
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Thanks — this covers the kiosk hardware"
            className={inputClass}
          />
        </FieldRow>
        {hardware ? (
          <Note tone="accent">
            Hardware is invoiced at 100% before we order. Put the vendor quote
            number in the memo; the kiosk device plan ($29/mo each) starts when
            the device is activated.
          </Note>
        ) : null}
        <label className="flex items-center gap-2.5 cursor-pointer min-h-9">
          <input
            type="checkbox"
            checked={sendNow}
            onChange={(e) => setSendNow(e.target.checked)}
            className={checkClass}
          />
          <span>Send it now (otherwise it saves as a draft)</span>
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
  const [tpl, setTpl] = useState(
    remind
      ? invoice.status === "Overdue"
        ? "Overdue · firm but kind"
        : "Due soon"
      : "New invoice",
  );
  const [copy, setCopy] = useState(true);
  const [err, setErr] = useState("");
  const sub = useSubmit();
  const amount =
    invoice.amount == null ? "[amount]" : money(invoice.amount - invoice.paid);
  const label = invoice.forLabel.split(" · ")[0];
  const subject = remind
    ? `Quick reminder: ${invoice.number} for ${label}`
    : `Invoice ${invoice.number} from Klyvora · ${amount}`;
  const body =
    invoice.status === "Overdue"
      ? `Hi [First name], ${invoice.number} (${amount}) was due ${shortDate(invoice.due)}. Work on the next milestone picks back up as soon as it clears. Pay by card or bank from the link; reply if something is off.`
      : remind
        ? `Hi [First name], a quick note that ${invoice.number} (${amount}) is due ${shortDate(invoice.due)}. Pay by card or bank from the link.`
        : `Hi [First name], here is ${invoice.number} for ${invoice.forLabel}. Pay by card or bank from the button; your receipt lands in the portal.`;
  const templates = [
    remind ? tpl : "New invoice",
    "Friendly nudge",
    "Second reminder",
    "Final notice before pause",
  ].filter((v, i, a) => a.indexOf(v) === i);
  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setErr("Enter a valid email address.");
      return;
    }
    setErr("");
    const out = await sub.run(() =>
      api(`/api/admin/invoices/${invoice.id}/send`, {
        method: "POST",
        body: { to, template: tpl, copyMe: copy },
      }),
    );
    if (out) onSent(out.kind);
  };
  return (
    <Modal
      id="sd"
      eyebrow={`${invoice.number} · ${amount}`}
      title={remind ? "Send a reminder" : "Send the invoice"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="sd-form"
            className={btnPrimary}
            disabled={sub.submitting}
          >
            {sub.submitting
              ? "Sending…"
              : remind
                ? "Send reminder"
                : "Send invoice"}
          </button>
        </>
      }
    >
      <form
        id="sd-form"
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-3.5"
      >
        <FieldRow id="sd-to" label="To" error={err}>
          <input
            id="sd-to"
            data-autofocus
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-invalid={!!err}
            aria-describedby={err ? "sd-to-err" : undefined}
            className={`${inputClass} ${err ? "border-danger" : ""}`}
          />
        </FieldRow>
        <FieldRow id="sd-tpl" label="Template">
          <select
            id="sd-tpl"
            value={tpl}
            onChange={(e) => setTpl(e.target.value)}
            className={inputClass}
          >
            {templates.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </FieldRow>
        <div className="bg-surface-2 border border-border rounded-[12px] p-3.5 leading-[1.6]">
          <strong className="font-medium">{subject}</strong>
          <p className="m-0 mt-2 text-muted-2">{body}</p>
          <p className="m-0 mt-2">Pay {amount}</p>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer min-h-9">
          <input
            type="checkbox"
            checked={copy}
            onChange={(e) => setCopy(e.target.checked)}
            className={checkClass}
          />
          <span>Copy me</span>
        </label>
        <p className="m-0 text-[12px] text-muted-2">
          {remind
            ? "Reminders go from your mailbox with the pay link. A second reminder goes out automatically in 7 days unless paid or paused."
            : "Sending moves the draft to Due and creates the Stripe invoice."}
        </p>
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
  const [err, setErr] = useState("");
  const sub = useSubmit();
  const n = Number(amount);
  const submit = async (e) => {
    e.preventDefault();
    if (!Number.isInteger(n) || n <= 0)
      return setErr("Enter whole dollars, like 450.");
    if (n > balance)
      return setErr(`That is more than the ${money(balance)} still due.`);
    setErr("");
    const out = await sub.run(() =>
      api(`/api/admin/invoices/${invoice.id}/payments`, {
        method: "POST",
        body: {
          kind: "manual",
          amount: n,
          method,
          receivedOn: received,
          reference,
          note,
        },
      }),
    );
    if (out) onRecorded(n, method);
  };
  return (
    <Modal
      id="mp"
      eyebrow={`${invoice.number} · ${invoice.client}`}
      title="Record a manual payment"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="mp-form"
            className={btnPrimary}
            disabled={sub.submitting}
          >
            {sub.submitting ? "Saving…" : "Mark paid"}
          </button>
        </>
      }
    >
      <form
        id="mp-form"
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-3.5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="mp-amt" label="Amount ($)" error={err}>
            <input
              id="mp-amt"
              data-autofocus
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={!!err}
              aria-describedby={err ? "mp-amt-err" : undefined}
              className={`${inputClass} ${err ? "border-danger" : ""}`}
            />
          </FieldRow>
          <FieldRow id="mp-how" label="Method">
            <select
              id="mp-how"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={inputClass}
            >
              {[
                "Cash",
                "Check",
                "Zelle",
                "Cash App",
                "Bank transfer",
                "Other",
              ].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="mp-date" label="Received">
            <input
              id="mp-date"
              type="date"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              className={inputClass}
            />
          </FieldRow>
          <FieldRow id="mp-ref" label="Reference">
            <input
              id="mp-ref"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Check no., Zelle memo"
              className={inputClass}
            />
          </FieldRow>
        </div>
        <FieldRow id="mp-note" label="Note">
          <textarea
            id="mp-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Paid in person at the shop"
            className={textareaClass}
          />
        </FieldRow>
        <p className="m-0 text-[12px] text-muted-2">
          Marks the Stripe invoice as paid out of band and sends the receipt. If
          the amount is less than the total, the rest stays due.
        </p>
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
  const dueOf = (i) =>
    every === "Month" ? addMonths(first, i) : addDays(first, i * 14);
  const submit = async (e) => {
    e.preventDefault();
    const out = await sub.run(() =>
      api(`/api/admin/invoices/${invoice.id}/payments`, {
        method: "POST",
        body: { kind: "plan", count, firstOn: first, every, autoCharge: auto },
      }),
    );
    if (out)
      onSet({
        count,
        firstOn: first,
        every,
        autoCharge: auto,
        amounts,
        dates: amounts.map((_, i) => dueOf(i)),
      });
  };
  return (
    <Modal
      id="pp"
      eyebrow={`${invoice.number} · ${money(balance)}`}
      title="Set up a payment plan"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="pp-form"
            className={btnPrimary}
            disabled={sub.submitting}
          >
            {sub.submitting ? "Saving…" : "Set up plan"}
          </button>
        </>
      }
    >
      <form id="pp-form" onSubmit={submit} className="flex flex-col gap-3.5">
        <fieldset className="border-0 p-0 m-0">
          <legend className="text-[12px] text-muted-2 mb-1.5 p-0">
            Split into
          </legend>
          <div
            role="radiogroup"
            aria-label="Number of payments"
            className="inline-flex p-0.5 rounded-[11px] border border-border-2"
          >
            {[2, 3, 4].map((n, i) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={count === n}
                data-autofocus={i === 0 ? "" : undefined}
                onClick={() => setCount(n)}
                className={`min-h-8 px-3 rounded-[9px] text-[13px] font-medium cursor-pointer border-0 ${count === n ? "bg-fg text-bg" : "bg-transparent text-muted-2 hover:text-fg"}`}
              >
                {n} payments
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="pp-first" label="First payment">
            <input
              id="pp-first"
              type="date"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              className={inputClass}
            />
          </FieldRow>
          <FieldRow id="pp-every" label="Then every">
            <select
              id="pp-every"
              value={every}
              onChange={(e) => setEvery(e.target.value)}
              className={inputClass}
            >
              <option>2 weeks</option>
              <option>Month</option>
            </select>
          </FieldRow>
        </div>
        <div className="border border-border rounded-[12px] overflow-x-auto">
          <table className="w-full border-collapse">
            <caption className="sr-only">Payment schedule</caption>
            <thead>
              <tr>
                {["Payment", "Due", "Amount"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className={`${thClass} ${h === "Amount" ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {amounts.map((a, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 border-b border-border last:border-0">
                    Payment {i + 1} of {count}
                  </td>
                  <td className="px-4 py-2.5 border-b border-border">
                    {shortDate(dueOf(i))}
                  </td>
                  <td className="px-4 py-2.5 border-b border-border text-right">
                    {money(a)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer min-h-9">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
            className={checkClass}
          />
          <span>Charge the card on file automatically on each date</span>
        </label>
        <p className="m-0 text-[12px] text-muted-2">
          Work on the next milestone still waits for the milestone to be fully
          paid. No fee for splitting.
        </p>
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}

// ---------- Void ----------
export function VoidDialog({ invoice, onClose, onVoided }) {
  const sub = useSubmit();
  const confirm = async () => {
    const out = await sub.run(() =>
      api(`/api/admin/invoices/${invoice.id}`, {
        method: "PATCH",
        body: { status: "void" },
      }),
    );
    if (out) onVoided();
  };
  return (
    <Modal
      id="vd"
      alert
      size="sm"
      title={`Void ${invoice.number}?`}
      describedBy="vd-p"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            data-autofocus
            className={btnSecondary}
            onClick={onClose}
          >
            Keep it
          </button>
          <button
            type="button"
            className={btnDanger}
            onClick={confirm}
            disabled={sub.submitting}
          >
            {sub.submitting ? "Voiding…" : "Void invoice"}
          </button>
        </>
      }
    >
      <p id="vd-p" className="m-0 leading-[1.6]">
        {invoice.client} gets a notice that {invoice.number} is canceled and the
        pay link stops working. This cannot be undone; write a new invoice if it
        was a mistake.
      </p>
      <FormError message={sub.status === "failed" ? sub.error : ""} />
    </Modal>
  );
}
