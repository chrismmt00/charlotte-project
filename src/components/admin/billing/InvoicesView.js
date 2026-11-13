"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Chip, Empty, PageHead, btnGhost, btnPrimary, btnSecondary, money } from "@/components/admin/ui";
import {
  DevStates,
  Drawer,
  FilterChips,
  Icon,
  Kpi,
  ListError,
  ListSkeleton,
  Note,
  TableBox,
  Toast,
  clientLink,
  daysBetween,
  shortDate,
  tdClass,
  thClass,
  useListState,
  useToast,
} from "@/components/admin/billing/kit";
import { NewInvoiceDialog, PaymentDialog, PlanDialog, SendDialog, VoidDialog } from "@/components/admin/billing/InvoiceDialogs";
import { INVOICE_STATUSES, INVOICE_TARGET } from "@/lib/admin/sample-billing";

const TONE = { Paid: "success", Due: "accent", Overdue: "danger", Draft: "muted", Void: "muted" };
const FILTERS = ["All", ...INVOICE_STATUSES];

const balanceOf = (i) => (i.amount == null ? 0 : i.amount - i.paid);
const amountText = (i) => (i.amount == null ? "[hardware quote]" : money(i.amount));

// Reads ?status=overdue (or due, paid, draft) and ?new=1. Rendered inside <Suspense> by the page.
export default function InvoicesView({ initialInvoices, subscriptions, today }) {
  const router = useRouter();
  const params = useSearchParams();
  const wanted = (params.get("status") || "all").toLowerCase();
  const filter = FILTERS.find((f) => f.toLowerCase() === wanted) || "All";

  const [invoices, setInvoices] = useState(initialInvoices);
  const [selId, setSelId] = useState(null);
  const [dialog, setDialog] = useState(() => (params.get("new") === "1" ? { type: "new" } : null));
  const [message, toast] = useToast();
  const list = useListState("/api/admin/invoices");
  const [dev, setDev] = useState("live");
  const state = dev === "live" ? list.state : dev;

  const sel = invoices.find((i) => i.id === selId) || null;
  const patch = (id, fn) => setInvoices((xs) => xs.map((i) => (i.id === id ? fn(i) : i)));
  const closeDialog = () => setDialog(null);

  const setFilter = (v) => router.replace(v === "All" ? "/admin/invoices" : `/admin/invoices?status=${v.toLowerCase()}`, { scroll: false });

  const count = (s) => invoices.filter((i) => i.status === s).length;
  const collected = invoices.reduce((a, i) => a + i.paid, 0);
  const outstanding = invoices.filter((i) => i.status === "Due" || i.status === "Overdue").reduce((a, i) => a + balanceOf(i), 0);
  const outstandingCount = invoices.filter((i) => i.status === "Due" || i.status === "Overdue").length;
  const overdue = invoices.filter((i) => i.status === "Overdue");
  const overdueSum = overdue.reduce((a, i) => a + balanceOf(i), 0);
  const billingNow = subscriptions.filter((s) => s.status === "Active" || s.status === "Past due").reduce((a, s) => a + s.price, 0);
  const billingAll = subscriptions.filter((s) => s.status !== "Canceled").reduce((a, s) => a + s.price, 0);

  const rows = invoices.filter((i) => filter === "All" || i.status === filter);
  const open = (id) => setSelId(id);

  const startSend = (i) => {
    setSelId(i.id);
    setDialog({ type: "send" });
  };

  return (
    <>
      <PageHead eyebrow="Invoices · this month" title="Invoices">
        <Link href="/admin/subscriptions" className={btnGhost}>
          Subscriptions <span aria-hidden="true">↗</span>
        </Link>
        <button type="button" className={btnPrimary} onClick={() => setDialog({ type: "new" })}>
          <Icon name="plus" size={14} />
          New invoice
        </button>
      </PageHead>

      <section aria-label="Cash" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi label="Collected this month" value={money(collected)} note={`of ${money(INVOICE_TARGET)} target`} />
        <Kpi label="Outstanding" value={money(outstanding)} note={`${outstandingCount} invoice${outstandingCount === 1 ? "" : "s"}`} />
        <Kpi label="Overdue" value={money(overdueSum)} note={`${overdue.length} invoice${overdue.length === 1 ? "" : "s"} · follow up`} tone={overdue.length ? "danger" : undefined} />
        <Kpi label="Monthly plans billing" value={`${money(billingNow)}/mo`} note={`billing now · ${money(billingAll)}/mo once all launch`} />
      </section>

      <FilterChips label="Filter invoices" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f, label: f, count: f === "All" ? invoices.length : count(f) }))} />

      <DevStates value={dev} onChange={setDev} />

      {state === "loading" ? <ListSkeleton label="Loading invoices" /> : null}
      {state === "error" ? (
        <ListError title="Couldn’t load invoices" retrying={list.retrying} onRetry={async () => { setDev("live"); await list.retry(); }}>
          <code className="text-[12px]">GET /api/admin/invoices</code> failed. Stripe totals above may be stale. Try again.
        </ListError>
      ) : null}
      {state === "empty" || (state === "live" && invoices.length === 0) ? (
        <Empty
          title="No invoices yet"
          action={
            <span className="flex flex-wrap gap-2 justify-center">
              <button type="button" className={btnPrimary} onClick={() => setDialog({ type: "new" })}>
                New invoice
              </button>
              <Link href="/admin/leads" className={btnSecondary}>
                Open leads
              </Link>
            </span>
          }
        >
          The first one is the 50% kickoff invoice, created when a lead converts to a client. You can also write one by hand for hardware or a one-off.
        </Empty>
      ) : null}

      {state === "live" && invoices.length > 0 ? (
        <TableBox>
          <table className="w-full border-collapse min-w-[900px]">
            <caption className="sr-only">Invoices</caption>
            <thead>
              <tr>
                {["Invoice", "Client", "For", "Due", "Amount", "Status", "Actions"].map((h) => (
                  <th key={h} scope="col" className={`${thClass} ${h === "Amount" ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className={`hover:bg-surface-2 ${i.id === selId ? "bg-surface-2" : ""}`}>
                  <td className={tdClass}>
                    <button type="button" onClick={() => open(i.id)} className="bg-transparent border-0 p-0 text-fg font-medium cursor-pointer hover:text-accent-light">
                      {i.number}
                    </button>
                  </td>
                  <td className={tdClass}>
                    <Link href={clientLink(i.client)} className="text-fg hover:text-accent-light">
                      {i.client}
                    </Link>
                  </td>
                  <td className={`${tdClass} text-muted-2 max-w-[260px]`}>{i.forLabel}</td>
                  <td className={`${tdClass} whitespace-nowrap ${i.status === "Overdue" ? "text-danger" : "text-muted-2"}`}>
                    {i.due ? shortDate(i.due) : "—"}
                    {i.status === "Overdue" ? <div className="text-[12px]">{daysBetween(i.due, today)} days late</div> : null}
                  </td>
                  <td className={`${tdClass} text-right whitespace-nowrap`}>{amountText(i)}</td>
                  <td className={tdClass}>
                    <Chip tone={TONE[i.status]}>{i.status}</Chip>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    {i.status === "Due" || i.status === "Overdue" ? (
                      <button type="button" className={btnGhost} onClick={() => startSend(i)}>
                        Send reminder
                      </button>
                    ) : null}
                    {i.status === "Draft" ? (
                      <button type="button" className={btnGhost} onClick={() => startSend(i)}>
                        Send
                      </button>
                    ) : null}
                    {i.status === "Paid" ? (
                      <button type="button" className={btnGhost} onClick={() => toast(`Receipt PDF for ${i.number} is downloading`)}>
                        Receipt
                      </button>
                    ) : null}
                    <button type="button" className={btnGhost} onClick={() => open(i.id)} aria-label={`Open ${i.number}`}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="m-0 p-6 text-center text-muted-2">Nothing with that status.</p> : null}
        </TableBox>
      ) : null}

      <p className="text-[12px] text-muted-2 mt-4 mb-0 max-w-[820px]">
        Overdue uses the danger token (admin only). Milestone invoices follow 50 / 30 / 20 of setup. Hardware is invoiced in full before ordering. Monthly plans bill as Stripe subscriptions from accepted launch and show here as paid when Stripe confirms. Billed-separately items get their own line. Amounts are whole dollars here; the API stores cents.
      </p>

      {sel ? (
        <InvoiceDrawer
          key={sel.id}
          invoice={sel}
          today={today}
          onClose={() => setSelId(null)}
          onSend={() => setDialog({ type: "send" })}
          onPayment={() => setDialog({ type: "payment" })}
          onPlan={() => setDialog({ type: "plan" })}
          onEdit={() => setDialog({ type: "new", initial: { client: sel.client, kind: sel.kind } })}
          onVoid={() => setDialog({ type: "void" })}
          toast={toast}
        />
      ) : null}

      {dialog?.type === "new" ? (
        <NewInvoiceDialog
          today={today}
          initial={dialog.initial}
          onClose={closeDialog}
          onCreated={(inv) => {
            setInvoices((xs) => [inv, ...xs]);
            closeDialog();
            toast(inv.status === "Due" ? `${inv.number} created and sent · ${amountText(inv)}` : `${inv.number} saved as a draft`);
          }}
        />
      ) : null}
      {dialog?.type === "send" && sel ? (
        <SendDialog
          invoice={sel}
          onClose={closeDialog}
          onSent={(kind) => {
            patch(sel.id, (i) => ({ ...i, status: kind === "invoice" ? "Due" : i.status, history: [...i.history, { when: "today", text: kind === "invoice" ? `Sent to ${i.billingEmail}` : `Reminder sent to ${i.billingEmail}` }] }));
            closeDialog();
            toast(kind === "invoice" ? `Invoice sent · ${sel.number}` : `Reminder sent for ${sel.number}`);
          }}
        />
      ) : null}
      {dialog?.type === "payment" && sel ? (
        <PaymentDialog
          invoice={sel}
          today={today}
          onClose={closeDialog}
          onRecorded={(n, method) => {
            const full = n >= balanceOf(sel);
            patch(sel.id, (i) => ({ ...i, paid: i.paid + n, status: full ? "Paid" : i.status, history: [...i.history, { when: "today", text: `${money(n)} paid · manual (${method}), recorded by Chris` }] }));
            closeDialog();
            toast(full ? `${sel.number} marked paid · receipt sent` : `${money(n)} recorded on ${sel.number} · ${money(balanceOf(sel) - n)} still due`);
          }}
        />
      ) : null}
      {dialog?.type === "plan" && sel ? (
        <PlanDialog
          invoice={sel}
          today={today}
          onClose={closeDialog}
          onSet={(plan) => {
            patch(sel.id, (i) => ({ ...i, plan, history: [...i.history, { when: "today", text: `Payment plan set · ${plan.count} payments` }] }));
            closeDialog();
            toast(`Payment plan set · ${plan.count} payments`);
          }}
        />
      ) : null}
      {dialog?.type === "void" && sel ? (
        <VoidDialog
          invoice={sel}
          onClose={closeDialog}
          onVoided={() => {
            patch(sel.id, (i) => ({ ...i, status: "Void", history: [...i.history, { when: "today", text: "Voided · the client got a notice" }] }));
            closeDialog();
            toast(`${sel.number} voided · the client gets a notice`);
          }}
        />
      ) : null}

      <Toast message={message} />
    </>
  );
}

function InvoiceDrawer({ invoice: i, today, onClose, onSend, onPayment, onPlan, onEdit, onVoid, toast }) {
  const remind = i.status === "Due" || i.status === "Overdue";
  const quoteMissing = i.status === "Draft" && i.amount == null;
  return (
    <Drawer
      id="inv"
      eyebrow={`Invoice · ${i.number}`}
      title={i.client}
      meta={
        <>
          <Chip tone={TONE[i.status]}>{i.status}</Chip>
          <span>{i.forLabel}</span>
        </>
      }
      onClose={onClose}
      footer={
        <>
          {remind ? (
            <>
              <button type="button" className={btnPrimary} onClick={onSend}>
                Send reminder
              </button>
              <button type="button" className={btnSecondary} onClick={onPayment}>
                Record manual payment
              </button>
              <button type="button" className={btnSecondary} onClick={onPlan}>
                Payment plan
              </button>
            </>
          ) : null}
          {i.status === "Draft" ? (
            <>
              <button type="button" className={btnPrimary} onClick={onSend} disabled={quoteMissing}>
                Send invoice
              </button>
              <button type="button" className={btnSecondary} onClick={onEdit}>
                Edit lines
              </button>
            </>
          ) : null}
          {i.status === "Paid" ? (
            <>
              <button type="button" className={btnSecondary} onClick={() => toast(`Receipt PDF for ${i.number} is downloading`)}>
                Download receipt
              </button>
              <button type="button" className={btnSecondary} onClick={() => toast("Refunds run in Stripe · open the invoice there")}>
                Refund…
              </button>
            </>
          ) : null}
          <button type="button" className={btnSecondary} onClick={() => toast(`PDF for ${i.number} is downloading`)}>
            PDF
          </button>
          {i.status !== "Paid" && i.status !== "Void" ? (
            <button type="button" className={`${btnGhost} ml-auto`} onClick={onVoid}>
              Void
            </button>
          ) : null}
        </>
      }
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-muted-2">Total</span>
        <span className="font-display text-[34px] leading-none">{amountText(i)}</span>
      </div>
      {i.paid > 0 && i.status !== "Paid" ? <Note tone="accent">{money(i.paid)} paid so far · {money(balanceOf(i))} still due.</Note> : null}
      {quoteMissing ? <Note tone="warning">The vendor quote is not in yet. Add the amount with Edit lines, then send. Hardware is paid in full before we order.</Note> : null}

      <div className="border border-border rounded-[12px] overflow-x-auto">
        <table className="w-full border-collapse">
          <caption className="sr-only">Invoice lines</caption>
          <thead>
            <tr>
              <th scope="col" className={thClass}>
                Line
              </th>
              <th scope="col" className={`${thClass} text-right`}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {i.lines.map((l, n) => (
              <tr key={n}>
                <td className="px-4 py-2.5 border-b border-border">
                  {l.description}
                  {l.note ? <div className="text-[12px] text-muted-2">{l.note}</div> : null}
                </td>
                <td className="px-4 py-2.5 border-b border-border text-right whitespace-nowrap">{l.amount == null ? "[quote]" : money(l.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="px-4 py-2.5 text-muted-2">Tax</td>
              <td className="px-4 py-2.5 text-right text-muted-2">$0 · services</td>
            </tr>
          </tbody>
        </table>
      </div>

      <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2.5 m-0">
        <dt className="text-muted-2">Due</dt>
        <dd className={`m-0 ${i.status === "Overdue" ? "text-danger" : ""}`}>
          {i.due ? shortDate(i.due) : "On trigger"}
          {i.status === "Overdue" ? ` · ${daysBetween(i.due, today)} days late` : ""}
        </dd>
        <dt className="text-muted-2">Trigger</dt>
        <dd className="m-0">{i.trigger}</dd>
        <dt className="text-muted-2">Pay link</dt>
        <dd className="m-0">
          <Link href="/portal/invoices" className="text-accent-light hover:text-fg">
            portal → invoices
          </Link>
        </dd>
        <dt className="text-muted-2">Stripe</dt>
        <dd className="m-0">{i.stripe}</dd>
      </dl>

      {i.plan ? (
        <section aria-labelledby="inv-plan" className="border border-border rounded-[12px] p-3.5">
          <h3 id="inv-plan" className="text-[13px] font-medium m-0 mb-1.5">
            Payment plan · {i.plan.count} payments
          </h3>
          <p className="m-0 text-muted-2">
            {i.plan.amounts.map((a, n) => `${money(a)} ${n === 0 ? "due" : "due"} ${shortDate(i.plan.dates[n])}`).join(" · ")}
            {i.plan.autoCharge ? " · card on file charged automatically" : ""}
          </p>
        </section>
      ) : null}

      <section aria-labelledby="inv-hist">
        <h3 id="inv-hist" className="text-[13px] font-medium m-0 mb-2">
          History
        </h3>
        <ol className="list-none p-0 m-0">
          {i.history.map((h, n) => (
            <li key={n} className="flex gap-3 border-t border-border py-2">
              <span className="text-muted-2 w-16 flex-none">{h.when}</span>
              <span>{h.text}</span>
            </li>
          ))}
        </ol>
      </section>
      <p className="m-0 text-[12px] text-muted-2">Reminders go from your mailbox with the pay link. Manual payments mark the Stripe invoice paid out of band.</p>
    </Drawer>
  );
}
