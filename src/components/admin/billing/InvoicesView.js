"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Chip, PageHead, btnPrimary, btnSecondary, money } from "@/components/admin/ui";
import {
  DevStates,
  Drawer,
  EmptyCard,
  FilterChips,
  Kpi,
  KpiGrid,
  ListError,
  ListSkeleton,
  TableBox,
  Toast,
  btnSm,
  btnSmDanger,
  clientLink,
  daysBetween,
  emptyRowClass,
  shortDate,
  tableClass,
  tdClass,
  theadRowClass,
  thClass,
  trClass,
  trSelectedClass,
  useListState,
  useToast,
} from "@/components/admin/billing/kit";
import { NewInvoiceDialog, PaymentDialog, PlanDialog, SendDialog, VoidDialog } from "@/components/admin/billing/InvoiceDialogs";
import { INVOICE_STATUSES, INVOICE_TARGET } from "@/lib/admin/sample-billing";

const TONE = { Paid: "success", Due: "accent", Overdue: "danger", Draft: "muted", Void: "muted" };
const FILTERS = ["All", ...INVOICE_STATUSES];
const COLS = ["Invoice", "Client", "For", "Due", "Amount", "Status", "Actions"];

const balanceOf = (i) => (i.amount == null ? 0 : i.amount - i.paid);
const amountText = (i) => (i.amount == null ? "[hardware quote]" : money(i.amount));
const footnote = "m-0 text-[13px] text-muted";

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
  const owing = invoices.filter((i) => i.status === "Due" || i.status === "Overdue");
  const outstanding = owing.reduce((a, i) => a + balanceOf(i), 0);
  const overdue = invoices.filter((i) => i.status === "Overdue");
  const overdueSum = overdue.reduce((a, i) => a + balanceOf(i), 0);
  const billingNow = subscriptions.filter((s) => s.status === "Active" || s.status === "Past due").reduce((a, s) => a + s.price, 0);
  const billingAll = subscriptions.filter((s) => s.status !== "Canceled").reduce((a, s) => a + s.price, 0);

  const rows = invoices.filter((i) => filter === "All" || i.status === filter);

  const startSend = (i) => {
    setSelId(i.id);
    setDialog({ type: "send" });
  };

  return (
    <>
      <PageHead eyebrow="Invoices · this month" title="Invoices">
        <Link href="/admin/subscriptions" className={btnSecondary}>
          Subscriptions <span aria-hidden="true">↗</span>
        </Link>
        <button type="button" className={btnPrimary} onClick={() => setDialog({ type: "new" })}>
          New invoice
        </button>
      </PageHead>

      <KpiGrid label="Cash">
        <Kpi label="Collected this month" value={money(collected)} note={`of ${money(INVOICE_TARGET)} target`} />
        <Kpi label="Outstanding" value={money(outstanding)} note={`${owing.length} invoice${owing.length === 1 ? "" : "s"}`} />
        <Kpi label="Overdue" value={money(overdueSum)} note={`${overdue.length} invoice${overdue.length === 1 ? "" : "s"} · follow up`} noteTone="danger" />
        <Kpi label="Monthly plans billing" value={`${money(billingNow)}/mo`} note={`billing now · ${money(billingAll)}/mo once all launch`} />
      </KpiGrid>

      <FilterChips label="Filter invoices" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f, label: f, count: f === "All" ? invoices.length : count(f) }))} />

      {state === "loading" ? <ListSkeleton label="Loading invoices" /> : null}
      {state === "error" ? (
        <ListError
          title="Couldn’t load invoices"
          retrying={list.retrying}
          onRetry={async () => {
            setDev("live");
            await list.retry();
          }}
        >
          <code className="font-mono text-xs">GET /api/admin/invoices</code> failed. Stripe totals above may be stale. Try again.
        </ListError>
      ) : null}
      {state === "empty" || (state === "live" && invoices.length === 0) ? (
        <EmptyCard
          icon="dollar"
          title="No invoices yet"
          actions={
            <>
              <button type="button" className={btnPrimary} onClick={() => setDialog({ type: "new" })}>
                New invoice
              </button>
              <Link href="/admin/leads" className={btnSecondary}>
                Open Leads
              </Link>
            </>
          }
        >
          The first one is the 50% kickoff invoice, created when a lead converts to a client. You can also write one by hand for hardware or a one-off.
        </EmptyCard>
      ) : null}

      {state === "live" && invoices.length > 0 ? (
        <TableBox footer={rows.length === 0 ? <p className={emptyRowClass}>Nothing with that status.</p> : null}>
          <table className={`${tableClass} min-w-[900px]`}>
            <caption className="sr-only">Invoices</caption>
            <thead>
              <tr className={theadRowClass}>
                {COLS.map((h) => (
                  <th key={h} scope="col" className={`${thClass} ${h === "Amount" || h === "Actions" ? "text-right" : ""}`}>
                    {h === "Actions" ? <span className="sr-only">Actions</span> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className={i.id === selId ? trSelectedClass : trClass}>
                  <td className={`${tdClass} tabular-nums`}>
                    <button type="button" onClick={() => setSelId(i.id)} className="bg-transparent border-0 p-0 text-fg cursor-pointer font-mono text-xs">
                      {i.number}
                    </button>
                  </td>
                  <td className={`${tdClass} font-medium`}>
                    <Link href={clientLink(i.client)} className="text-fg">
                      {i.client}
                    </Link>
                  </td>
                  <td className={`${tdClass} text-muted-2`}>{i.forLabel}</td>
                  <td className={`${tdClass} text-muted-2 whitespace-nowrap`}>{i.due ? shortDate(i.due) : "—"}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{amountText(i)}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <Chip tone={TONE[i.status]}>{i.status}</Chip>
                  </td>
                  <td className={`${tdClass} text-right whitespace-nowrap`}>
                    <span className="inline-flex gap-1.5">
                      {i.status === "Due" || i.status === "Overdue" ? (
                        <button type="button" className={btnSm} onClick={() => startSend(i)}>
                          Send reminder
                        </button>
                      ) : null}
                      {i.status === "Draft" ? (
                        <button type="button" className={btnSm} onClick={() => startSend(i)}>
                          Send
                        </button>
                      ) : null}
                      {i.status === "Paid" ? (
                        <button type="button" className={btnSm} onClick={() => toast(`Receipt PDF for ${i.number} is downloading`)}>
                          Receipt
                        </button>
                      ) : null}
                      <button type="button" className={btnSm} onClick={() => setSelId(i.id)} aria-label={`Open ${i.number}`}>
                        Open
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableBox>
      ) : null}

      <p className={footnote}>
        Overdue uses the danger token (admin only). Milestone invoices follow 50 / 30 / 20 of setup. Hardware is invoiced in full before ordering. Monthly plans bill as Stripe subscriptions from accepted launch and show here as paid when Stripe confirms. Billed-separately items get their own line. Amounts are whole dollars here; the API stores cents.
      </p>

      <DevStates value={dev} onChange={setDev} />

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

const dl = "flex flex-col gap-0.5";
const dt = "text-xs text-muted";

function InvoiceDrawer({ invoice: i, today, onClose, onSend, onPayment, onPlan, onEdit, onVoid, toast }) {
  const remind = i.status === "Due" || i.status === "Overdue";
  const quoteMissing = i.status === "Draft" && i.amount == null;
  return (
    <Drawer
      id="inv"
      eyebrow={`Invoice · ${i.number}`}
      title={i.client}
      closeLabel="Close invoice"
      meta={
        <>
          <Chip tone={TONE[i.status]}>{i.status}</Chip>
          <span className="text-muted-2">{i.forLabel}</span>
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
              <button type="button" className={btnSm} onClick={onPayment}>
                Record manual payment
              </button>
              <button type="button" className={btnSm} onClick={onPlan}>
                Payment plan
              </button>
            </>
          ) : null}
          {i.status === "Draft" ? (
            <>
              <button type="button" className={btnPrimary} onClick={onSend} disabled={quoteMissing}>
                Send invoice
              </button>
              <button type="button" className={btnSm} onClick={onEdit}>
                Edit lines
              </button>
            </>
          ) : null}
          {i.status === "Paid" ? (
            <>
              <button type="button" className={btnPrimary} onClick={() => toast(`Receipt PDF for ${i.number} is downloading`)}>
                Download receipt
              </button>
              <button type="button" className={btnSm} onClick={() => toast("Refunds run in Stripe · open the invoice there")}>
                Refund…
              </button>
            </>
          ) : null}
          <button type="button" className={btnSm} onClick={() => toast(`PDF for ${i.number} is downloading`)}>
            PDF
          </button>
          {i.status !== "Paid" && i.status !== "Void" ? (
            <button type="button" className={`${btnSmDanger} ml-auto`} onClick={onVoid}>
              Void
            </button>
          ) : null}
        </>
      }
    >
      <div className="flex items-baseline justify-between gap-2.5 px-4 py-3.5 border border-border rounded-[14px] bg-surface-2">
        <span className="text-muted-2">Total</span>
        <span className="text-[26px] font-medium tabular-nums">{amountText(i)}</span>
      </div>
      {i.paid > 0 && i.status !== "Paid" ? (
        <p className="m-0 text-muted-2">
          {money(i.paid)} paid so far · {money(balanceOf(i))} still due.
        </p>
      ) : null}
      {quoteMissing ? <p className="m-0 px-3 py-2.5 border border-warning rounded-xl text-muted-2 leading-[1.5]">The vendor quote is not in yet. Add the amount with Edit lines, then send. Hardware is paid in full before we order.</p> : null}

      <table className="w-full border-collapse">
        <caption className="sr-only">Invoice lines</caption>
        <thead>
          <tr>
            <th scope="col" className="text-left font-medium text-[13px] text-muted-2 py-2">
              Line
            </th>
            <th scope="col" className="text-right font-medium text-[13px] text-muted-2 py-2">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {i.lines.map((l, n) => (
            <tr key={n} className="border-t border-border">
              <td className="py-2.5">
                <span className="flex flex-col gap-0.5">
                  <span>{l.description}</span>
                  {l.note ? <span className="text-muted">{l.note}</span> : null}
                </span>
              </td>
              <td className="py-2.5 text-right tabular-nums whitespace-nowrap">{l.amount == null ? "[quote]" : money(l.amount)}</td>
            </tr>
          ))}
          <tr className="border-t border-border">
            <td className="py-2.5 text-muted-2">Tax</td>
            <td className="py-2.5 text-right text-muted-2">$0 · services</td>
          </tr>
        </tbody>
      </table>

      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3">
        <div className={dl}>
          <dt className={dt}>Due</dt>
          <dd className="m-0">
            {i.due ? shortDate(i.due) : "On trigger"}
            {i.status === "Overdue" ? ` · ${daysBetween(i.due, today)} days late` : ""}
          </dd>
        </div>
        <div className={dl}>
          <dt className={dt}>Trigger</dt>
          <dd className="m-0">{i.trigger}</dd>
        </div>
        <div className={dl}>
          <dt className={dt}>Pay link</dt>
          <dd className="m-0">
            <Link href="/portal/invoices" className="text-accent-light">
              portal → invoices
            </Link>
          </dd>
        </div>
        <div className={dl}>
          <dt className={dt}>Stripe</dt>
          <dd className="m-0 font-mono text-xs text-muted">{i.stripe}</dd>
        </div>
      </dl>

      {i.plan ? (
        <div className="border border-border rounded-[14px] px-3.5 py-3 flex flex-col gap-1.5">
          <span className="font-medium">Payment plan · {i.plan.count} payments</span>
          <span className="text-muted-2">
            {i.plan.amounts.map((a, n) => `${money(a)} due ${shortDate(i.plan.dates[n])}`).join(" · ")}
            {i.plan.autoCharge ? " · card on file charged automatically" : ""}
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted">History</span>
        <ol className="list-none m-0 p-0 flex flex-col">
          {i.history.map((h, n) => (
            <li key={n} className="flex gap-2.5 py-2 border-t border-border">
              <span className="text-muted tabular-nums whitespace-nowrap min-w-16">{h.when}</span>
              <span className="text-muted-2">{h.text}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="m-0 text-xs text-muted">Reminders go from your mailbox with the pay link. Manual payments mark the Stripe invoice paid out of band.</p>
    </Drawer>
  );
}
