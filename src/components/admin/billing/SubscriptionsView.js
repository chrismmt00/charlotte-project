"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHead, btnDanger, btnPrimary, btnSecondary, money } from "@/components/admin/ui";
import {
  DevStates,
  Drawer,
  EmptyCard,
  FieldRow,
  FilterChips,
  FormError,
  Icon,
  Kpi,
  KpiGrid,
  ListError,
  ListSkeleton,
  Modal,
  Note,
  TableBox,
  Toast,
  api,
  btnSm,
  btnSmDanger,
  checkClass,
  checkLabelClass,
  clientLink,
  emptyRowClass,
  inputClass,
  linkInline,
  shortDate,
  tableClass,
  tdClass,
  theadRowClass,
  thClass,
  trClass,
  trSelectedClass,
  useListState,
  useSubmit,
  useToast,
} from "@/components/admin/billing/kit";
import { SUB_STATUSES } from "@/lib/admin/sample-billing";

const COLOR = { Active: "text-success", "Starts at launch": "text-accent-light", "Past due": "text-danger", Paused: "text-muted-2", Canceled: "text-muted" };
const DOT = { Active: "bg-success", "Starts at launch": "bg-accent-light", "Past due": "bg-danger", Paused: "bg-muted-2", Canceled: "bg-muted" };
const FILTERS = ["All", ...SUB_STATUSES];
const COLS = ["Client", "Plan", "Price", "Status", "Next charge", "Usage", "Card", "Actions"];
const MRR_TARGET = 1500;
const footnote = "m-0 text-[13px] text-muted leading-[1.6]";

const nextText = (s) => (s.status === "Canceled" ? "—" : s.next && s.next !== "on launch" ? shortDate(s.next) : s.next || "—");
const priceText = (s) => (s.price ? `${money(s.price)}/mo${s.usage ? " + usage" : ""}` : "—");
const chargeAmount = (s) => s.price + s.usage;

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center text-xs border border-border-2 rounded-full px-2.5 py-1 ${COLOR[status]}`}>
      <span aria-hidden="true" className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${DOT[status]}`} />
      {status}
    </span>
  );
}

export default function SubscriptionsView({ initialSubs }) {
  const [subs, setSubs] = useState(initialSubs);
  const [filter, setFilter] = useState("All");
  const [selId, setSelId] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [message, toast] = useToast();
  const list = useListState("/api/admin/subscriptions");
  const [dev, setDev] = useState("live");
  const state = dev === "live" ? list.state : dev;

  const sel = subs.find((s) => s.id === selId) || null;
  const patch = (id, p) => setSubs((xs) => xs.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const rows = subs.filter((s) => filter === "All" || s.status === filter);
  const billingNow = subs.filter((s) => s.status === "Active" || s.status === "Past due").reduce((a, s) => a + s.price, 0);
  const soon = subs.filter((s) => s.status !== "Canceled").reduce((a, s) => a + s.price, 0);
  const usage = subs.reduce((a, s) => a + s.usage, 0);
  const pastDue = subs.filter((s) => s.status === "Past due").length;
  const activeCount = subs.filter((s) => s.status === "Active").length;

  const act = async (s, action, done) => {
    try {
      await api(`/api/admin/subscriptions/${s.id}`, { method: "PATCH", body: { action } });
      done();
    } catch (e) {
      toast(`Couldn’t do that. ${e.message}`);
    }
  };
  const retryCharge = (s) =>
    act(s, "retry", () => {
      patch(s.id, { status: "Active", card: s.card.replace(" · declined", ""), charges: s.charges.map((c) => (c.what === "declined" ? { ...c, what: "paid", tone: "fg" } : c)) });
      toast(`Charge retried · ${money(chargeAmount(s))} succeeded`);
    });
  const cardLink = (s) => act(s, "card-link", () => toast(`Card-update link sent to ${s.client}`));
  const togglePause = (s) =>
    act(s, s.status === "Paused" ? "resume" : "pause", () => {
      const resume = s.status === "Paused";
      patch(s.id, { status: resume ? "Active" : "Paused" });
      toast(resume ? "Resumed" : "Paused · no charges until resumed");
    });

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted flex items-center gap-2">
        <Link href="/admin/invoices" className="text-muted-2 hover:text-fg">
          Invoices
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-fg">
          Subscriptions
        </span>
      </nav>

      <PageHead eyebrow="Monthly plans · Stripe subscriptions" title="Subscriptions">
        <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" className={btnSecondary}>
          Open Stripe <span aria-hidden="true">↗</span>
        </a>
        <Link href="/admin/clients" className={btnPrimary}>
          Plans start from a client
        </Link>
      </PageHead>

      <KpiGrid label="Recurring">
        <Kpi compact label="Billing now" value={money(billingNow)} note={`/mo · ${activeCount} active`} />
        <Kpi compact label="Once builds launch" value={money(soon)} note={`/mo · toward the ${money(MRR_TARGET)} target`} />
        <Kpi compact label="Usage this month" value={money(usage)} note="AI texts and calls, billed at cost" />
        <Kpi compact label="Past due" value={pastDue} note="card failed · retrying" tone={pastDue ? "danger" : undefined} />
      </KpiGrid>

      <FilterChips label="Filter subscriptions" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f, label: f, count: f === "All" ? subs.length : subs.filter((s) => s.status === f).length }))} />

      {state === "loading" ? <ListSkeleton label="Loading subscriptions" cols="1.4fr 1.6fr .8fr 1fr 1fr .8fr 1fr 1fr" /> : null}
      {state === "error" ? (
        <ListError
          title="Couldn’t load subscriptions"
          retrying={list.retrying}
          onRetry={async () => {
            setDev("live");
            await list.retry();
          }}
        >
          <code className="font-mono text-xs">GET /api/admin/subscriptions</code> failed. Stripe is the source of truth; nothing here is lost. Try again.
        </ListError>
      ) : null}
      {state === "empty" || (state === "live" && subs.length === 0) ? (
        <EmptyCard
          title="No monthly plans yet"
          actions={
            <Link href="/admin/clients" className={btnPrimary}>
              Open Clients
            </Link>
          }
        >
          A plan starts when a client accepts launch (or at signing for restaurants). The {money(MRR_TARGET)}/month target is five to twenty of these.
        </EmptyCard>
      ) : null}

      {state === "live" && subs.length > 0 ? (
        <TableBox footer={rows.length === 0 ? <p className={emptyRowClass}>Nothing with that status.</p> : null}>
          <table className={`${tableClass} min-w-[980px]`}>
            <caption className="sr-only">Subscriptions</caption>
            <thead>
              <tr className={theadRowClass}>
                {COLS.map((h) => (
                  <th key={h} scope="col" className={`${thClass} ${h === "Price" || h === "Usage" || h === "Actions" ? "text-right" : ""}`}>
                    {h === "Actions" ? <span className="sr-only">Actions</span> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className={s.id === selId ? trSelectedClass : trClass}>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <span className="flex flex-col gap-0.5">
                      <Link href={clientLink(s.client)} className="font-medium text-fg">
                        {s.client}
                      </Link>
                      <span className="text-muted">since {s.since}</span>
                    </span>
                  </td>
                  <td className={`${tdClass} text-muted-2`}>
                    {s.planLabel}
                    {s.required ? <div className="text-muted">required while active</div> : null}
                  </td>
                  <td className={`${tdClass} text-right tabular-nums whitespace-nowrap`}>{priceText(s)}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <StatusPill status={s.status} />
                  </td>
                  <td className={`${tdClass} text-muted-2 whitespace-nowrap`}>{nextText(s)}</td>
                  <td className={`${tdClass} text-right tabular-nums text-muted-2 whitespace-nowrap`}>{s.usage ? money(s.usage) : "—"}</td>
                  <td className={`${tdClass} text-muted-2 whitespace-nowrap`}>{s.card}</td>
                  <td className={`${tdClass} text-right whitespace-nowrap`}>
                    <span className="inline-flex gap-1.5">
                      {s.status === "Past due" ? (
                        <button type="button" className={btnSm} onClick={() => retryCharge(s)}>
                          Retry charge
                        </button>
                      ) : null}
                      <button type="button" className={btnSm} onClick={() => setSelId(s.id)} aria-label={`Open ${s.client}`}>
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
        Prices from PROJECT-BRIEF: $49 (W1, W2), $79 (WB, BK), $99 (EC, CA), $149 restaurants + $29 per kiosk device, AI plans $49 / $99 plus usage at cost. Monthly is optional except restaurants; a canceled client keeps their site and code. Mirrors Stripe; change prices in Settings → Catalog, never here. Amounts are whole dollars here; the API stores cents.
      </p>

      <DevStates value={dev} onChange={setDev} />

      {sel ? (
        <SubDrawer
          key={sel.id}
          sub={sel}
          onClose={() => setSelId(null)}
          onRetry={() => retryCharge(sel)}
          onCardLink={() => cardLink(sel)}
          onPause={() => togglePause(sel)}
          onCancel={() => setCancelId(sel.id)}
        />
      ) : null}

      {cancelId && sel ? (
        <CancelDialog
          sub={sel}
          onClose={() => setCancelId(null)}
          onCanceled={(when) => {
            patch(sel.id, when === "now" ? { status: "Canceled", next: null } : { cancelsAtPeriodEnd: true });
            setCancelId(null);
            toast(when === "now" ? "Plan canceled · prorated refund issued · handover pack scheduled" : "Plan cancels at period end · handover pack scheduled");
          }}
        />
      ) : null}

      <Toast message={message} />
    </>
  );
}

const dl = "flex flex-col gap-0.5";
const dt = "text-xs text-muted";

function SubDrawer({ sub: s, onClose, onRetry, onCardLink, onPause, onCancel }) {
  const canceled = s.status === "Canceled";
  return (
    <Drawer
      id="sub"
      eyebrow={`Subscription · ${s.planLabel}`}
      title={s.client}
      meta={
        <>
          <span className={`text-xs border border-border-2 rounded-full px-2.5 py-[3px] ${COLOR[s.status]}`}>{s.status}</span>
          {s.cancelsAtPeriodEnd ? <span className="text-xs border border-border-2 rounded-full px-2.5 py-[3px] text-warning">Cancels at period end</span> : null}
          <span className="text-muted-2">
            {priceText(s)} · next {nextText(s)}
          </span>
        </>
      }
      onClose={onClose}
      footer={
        canceled ? null : (
          <>
            {s.status === "Past due" ? (
              <button type="button" className={btnPrimary} onClick={onRetry}>
                Retry charge
              </button>
            ) : null}
            <Link href={clientLink(s.client)} className={btnSm}>
              Change plan
            </Link>
            <button type="button" className={btnSm} onClick={onCardLink}>
              Card-update link
            </button>
            {s.status !== "Starts at launch" ? (
              <button type="button" className={btnSm} onClick={onPause}>
                {s.status === "Paused" ? "Resume" : "Pause"}
              </button>
            ) : null}
            <button type="button" className={`${btnSmDanger} ml-auto`} onClick={onCancel}>
              Cancel…
            </button>
          </>
        )
      }
    >
      {s.status === "Past due" ? (
        <div role="alert" className="flex items-start gap-2.5 px-3.5 py-3 border border-danger rounded-xl leading-[1.5]">
          <span aria-hidden="true" className="text-danger">
            ●
          </span>
          <span>
            Card declined on {shortDate(s.next)}. Stripe retries in 3, 5 and 7 days, then pauses the plan.{" "}
            <button type="button" onClick={onCardLink} className={linkInline}>
              Send a card-update link
            </button>
            .
          </span>
        </div>
      ) : null}
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3">
        <div className={dl}>
          <dt className={dt}>Includes</dt>
          <dd className="m-0">{s.includes}</dd>
        </div>
        <div className={dl}>
          <dt className={dt}>Optional?</dt>
          <dd className="m-0">{s.optionalNote}</dd>
        </div>
        <div className={dl}>
          <dt className={dt}>Card</dt>
          <dd className="m-0">{s.card}</dd>
        </div>
        <div className={dl}>
          <dt className={dt}>Stripe</dt>
          <dd className="m-0 font-mono text-xs text-muted">sub_[…] · cus_[…]</dd>
        </div>
      </dl>

      {s.usage ? (
        <div className="border border-border rounded-[14px] px-3.5 py-3 flex flex-col gap-2">
          <span className="font-medium">Usage this month · {money(s.usage)}</span>
          {s.usageRows.map((u) => (
            <span key={u.label} className="flex justify-between gap-2.5 text-muted-2">
              <span>{u.label}</span>
              <span className="tabular-nums">${u.amount.toFixed(2)}</span>
            </span>
          ))}
          <span className="text-muted">Metered at cost, added to the next charge. The client sees the same breakdown in the portal.</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted">Charges</span>
        {s.charges.length ? (
          <ol className="list-none m-0 p-0 flex flex-col">
            {s.charges.map((c, n) => (
              <li key={n} className="flex justify-between gap-2.5 py-2 border-t border-border">
                <span className="text-muted-2">
                  {c.when.startsWith("2026") ? shortDate(c.when) : c.when} · {c.what}
                </span>
                <span className={`tabular-nums ${c.tone === "danger" ? "text-danger" : c.tone === "muted" ? "text-muted" : "text-fg"}`}>{money(c.amount)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="m-0 text-muted-2">No charges. {s.optionalNote}.</p>
        )}
      </div>
    </Drawer>
  );
}

function CancelDialog({ sub: s, onClose, onCanceled }) {
  const [when, setWhen] = useState("period-end");
  const [why, setWhy] = useState("They want to self-host");
  const [pack, setPack] = useState(true);
  const [ack, setAck] = useState(false);
  const [error, setError] = useState("");
  const sub = useSubmit();
  const periodEnd = s.next && s.next !== "on launch" ? shortDate(s.next) : "the end of the current period";
  const note = s.required
    ? "Restaurants need the plan: ordering, the kiosk and menu updates stop when it ends. They keep the site and the code. Make sure the owner knows before you confirm."
    : "They keep the site and the code. Hosting, their admin and support end with the period; we send the handover pack and a reminder 7 days before.";
  const submit = async () => {
    if (s.required && !ack) {
      setError("Confirm the owner knows ordering and menu updates stop.");
      return;
    }
    setError("");
    const out = await sub.run(() => api(`/api/admin/subscriptions/${s.id}/cancel`, { method: "POST", body: { when, reason: why, handoverPack: pack, acknowledgedRequired: ack } }));
    if (out) onCanceled(when);
  };
  return (
    <Modal
      id="cs"
      alert
      tight
      w={480}
      title={`Cancel ${s.client}’s plan?`}
      describedBy="cs-p"
      onClose={onClose}
      footer={
        <>
          <button type="button" data-autofocus className={btnSecondary} onClick={onClose}>
            Keep the plan
          </button>
          <button type="button" className={btnDanger} onClick={submit} disabled={sub.submitting}>
            {sub.submitting ? "Canceling…" : "Cancel plan"}
          </button>
        </>
      }
    >
      <p id="cs-p" className="m-0 text-muted-2 leading-[1.6]">
        {note}
      </p>
      {s.required ? <Note tone="warning">This is a required plan while the restaurant is active. Canceling it stops ordering, so only do it when the owner has agreed.</Note> : null}
      <FieldRow id="cs-when" label="When">
        <select id="cs-when" value={when} onChange={(e) => setWhen(e.target.value)} className={`${inputClass} cursor-pointer`}>
          <option value="period-end">End of the current period · {periodEnd}</option>
          <option value="now">Now (prorated refund)</option>
        </select>
      </FieldRow>
      <FieldRow id="cs-why" label="Reason">
        <select id="cs-why" value={why} onChange={(e) => setWhy(e.target.value)} className={`${inputClass} cursor-pointer`}>
          {["They want to self-host", "Price", "Closing the business", "Unhappy with support", "Other"].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </FieldRow>
      <label className={checkLabelClass}>
        <input type="checkbox" checked={pack} onChange={(e) => setPack(e.target.checked)} className={checkClass} />
        Send the handover pack (code, data export, DNS steps)
      </label>
      {s.required ? (
        <div className="flex flex-col gap-1.5">
          <label className={`${checkLabelClass} items-start`}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} aria-describedby={error ? "cs-ack-err" : undefined} className={`${checkClass} mt-0.5`} />I told the owner that ordering, the kiosk and menu updates stop when this plan ends.
          </label>
          {error ? (
            <p id="cs-ack-err" role="alert" className="m-0 text-xs text-danger flex items-center gap-1.5">
              <Icon name="alert" size={13} />
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
      <FormError message={sub.status === "failed" ? sub.error : ""} />
    </Modal>
  );
}
