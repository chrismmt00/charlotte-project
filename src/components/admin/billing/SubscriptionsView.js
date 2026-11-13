"use client";

import Link from "next/link";
import { useState } from "react";
import { Chip, Empty, PageHead, btnDanger, btnGhost, btnPrimary, btnSecondary, money } from "@/components/admin/ui";
import {
  DevStates,
  Drawer,
  FieldRow,
  FilterChips,
  FormError,
  Icon,
  Kpi,
  ListError,
  ListSkeleton,
  Modal,
  Note,
  TableBox,
  Toast,
  api,
  checkClass,
  clientLink,
  inputClass,
  shortDate,
  tdClass,
  thClass,
  useListState,
  useSubmit,
  useToast,
} from "@/components/admin/billing/kit";
import { SUB_STATUSES } from "@/lib/admin/sample-billing";

const TONE = { Active: "success", "Starts at launch": "accent", "Past due": "danger", Paused: "muted", Canceled: "muted" };
const FILTERS = ["All", ...SUB_STATUSES];
const MRR_TARGET = 1500;

const nextText = (s) => (s.status === "Canceled" ? "—" : s.next && s.next !== "on launch" ? shortDate(s.next) : s.next || "—");
const priceText = (s) => (s.price ? `${money(s.price)}/mo${s.usage ? " + usage" : ""}` : "—");
const chargeAmount = (s) => s.price + s.usage;

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
      <nav aria-label="Breadcrumb" className="text-[12px] text-muted-2 mb-3">
        <Link href="/admin/invoices" className="hover:text-fg">
          Invoices
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-fg">
          Subscriptions
        </span>
      </nav>
      <PageHead eyebrow="Monthly plans · Stripe subscriptions" title="Subscriptions">
        <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" className={btnGhost}>
          Open Stripe <span aria-hidden="true">↗</span>
        </a>
        <Link href="/admin/clients" className={btnSecondary}>
          Plans start from a client
        </Link>
      </PageHead>

      <section aria-label="Recurring" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi label="Billing now" value={`${money(billingNow)}/mo`} note={`${activeCount} active`} />
        <Kpi label="Once builds launch" value={`${money(soon)}/mo`} note={`toward the ${money(MRR_TARGET)} target`} />
        <Kpi label="Usage this month" value={money(usage)} note="AI texts and calls, billed at cost" />
        <Kpi label="Past due" value={pastDue} note="card failed · retrying" tone={pastDue ? "danger" : undefined} />
      </section>

      <FilterChips label="Filter subscriptions" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f, label: f, count: f === "All" ? subs.length : subs.filter((s) => s.status === f).length }))} />

      <DevStates value={dev} onChange={setDev} />

      {state === "loading" ? <ListSkeleton label="Loading subscriptions" /> : null}
      {state === "error" ? (
        <ListError title="Couldn’t load subscriptions" retrying={list.retrying} onRetry={async () => { setDev("live"); await list.retry(); }}>
          <code className="text-[12px]">GET /api/admin/subscriptions</code> failed. Stripe is the source of truth; nothing here is lost. Try again.
        </ListError>
      ) : null}
      {state === "empty" || (state === "live" && subs.length === 0) ? (
        <Empty title="No monthly plans yet" action={<Link href="/admin/clients" className={btnSecondary}>Open clients</Link>}>
          A plan starts when a client accepts launch (or at signing for restaurants). The {money(MRR_TARGET)}/month target is five to twenty of these.
        </Empty>
      ) : null}

      {state === "live" && subs.length > 0 ? (
        <TableBox>
          <table className="w-full border-collapse min-w-[960px]">
            <caption className="sr-only">Subscriptions</caption>
            <thead>
              <tr>
                {["Client", "Plan", "Price", "Status", "Next charge", "Usage", "Card", "Actions"].map((h) => (
                  <th key={h} scope="col" className={thClass}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className={`hover:bg-surface-2 ${s.id === selId ? "bg-surface-2" : ""}`}>
                  <td className={tdClass}>
                    <Link href={clientLink(s.client)} className="text-fg font-medium hover:text-accent-light">
                      {s.client}
                    </Link>
                    <div className="text-[12px] text-muted-2">since {s.since}</div>
                  </td>
                  <td className={tdClass}>
                    {s.planLabel}
                    {s.required ? <div className="text-[12px] text-muted-2">required while active</div> : null}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>{priceText(s)}</td>
                  <td className={tdClass}>
                    <Chip tone={TONE[s.status]}>{s.status}</Chip>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap ${s.status === "Past due" ? "text-danger" : "text-muted-2"}`}>{nextText(s)}</td>
                  <td className={`${tdClass} text-muted-2`}>{s.usage ? money(s.usage) : "—"}</td>
                  <td className={`${tdClass} text-muted-2 whitespace-nowrap`}>{s.card}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    {s.status === "Past due" ? (
                      <button type="button" className={btnGhost} onClick={() => retryCharge(s)}>
                        Retry charge
                      </button>
                    ) : null}
                    <button type="button" className={btnGhost} onClick={() => setSelId(s.id)} aria-label={`Open ${s.client}`}>
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
        Prices come from the offer catalog: $49 (W1, W2), $79 (WB, BK), $99 (EC, CA), $149 restaurants + $29 per kiosk device, AI plans $49 / $99 plus usage at cost. Monthly is optional except restaurants; a canceled client keeps their site and code. Mirrors Stripe; change prices in Settings → Catalog, never here. Amounts are whole dollars here; the API stores cents.
      </p>

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

function SubDrawer({ sub: s, onClose, onRetry, onCardLink, onPause, onCancel }) {
  const canceled = s.status === "Canceled";
  return (
    <Drawer
      id="sub"
      eyebrow={`Subscription · ${s.planLabel}`}
      title={s.client}
      meta={
        <>
          <Chip tone={TONE[s.status]}>{s.status}</Chip>
          {s.cancelsAtPeriodEnd ? <Chip tone="warning">Cancels at period end</Chip> : null}
          <span>
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
            <Link href={clientLink(s.client)} className={btnSecondary}>
              Change plan
            </Link>
            <button type="button" className={btnSecondary} onClick={onCardLink}>
              Card-update link
            </button>
            {s.status !== "Starts at launch" ? (
              <button type="button" className={btnSecondary} onClick={onPause}>
                {s.status === "Paused" ? "Resume" : "Pause"}
              </button>
            ) : null}
            <button type="button" className={`${btnGhost} ml-auto`} onClick={onCancel}>
              Cancel…
            </button>
          </>
        )
      }
    >
      {s.status === "Past due" ? (
        <div role="alert" className="flex items-start gap-2.5 border border-danger/50 bg-danger/10 rounded-[12px] px-3.5 py-3 leading-[1.55]">
          <Icon name="alert" className="text-danger mt-0.5" />
          <span>
            Card declined on {shortDate(s.next)}. Stripe retries in 3, 5 and 7 days, then pauses the plan.{" "}
            <button type="button" onClick={onCardLink} className="bg-transparent border-0 p-0 text-accent-light underline cursor-pointer text-[13px] font-[inherit]">
              Send a card-update link
            </button>
            .
          </span>
        </div>
      ) : null}
      <dl className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2.5 m-0">
        <dt className="text-muted-2">Includes</dt>
        <dd className="m-0">{s.includes}</dd>
        <dt className="text-muted-2">Optional?</dt>
        <dd className="m-0">{s.optionalNote}</dd>
        <dt className="text-muted-2">Card</dt>
        <dd className="m-0">{s.card}</dd>
        <dt className="text-muted-2">Stripe</dt>
        <dd className="m-0">sub_[…] · cus_[…]</dd>
      </dl>
      {s.required ? <Note tone="accent">Required for restaurants while active: ordering, the kiosk and menu updates run on this plan.</Note> : null}

      {s.usage ? (
        <section aria-labelledby="sub-usage" className="border border-border rounded-[12px] p-3.5">
          <h3 id="sub-usage" className="text-[13px] font-medium m-0 mb-2">
            Usage this month · {money(s.usage)}
          </h3>
          <ul className="list-none p-0 m-0">
            {s.usageRows.map((u) => (
              <li key={u.label} className="flex justify-between gap-3 py-1.5 border-t border-border first:border-t-0">
                <span className="text-muted-2">{u.label}</span>
                <span>${u.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-2 text-[12px] text-muted-2">Metered at cost, added to the next charge. The client sees the same breakdown in the portal. Rounded to {money(s.usage)} in this view.</p>
        </section>
      ) : null}

      <section aria-labelledby="sub-charges">
        <h3 id="sub-charges" className="text-[13px] font-medium m-0 mb-2">
          Charges
        </h3>
        {s.charges.length ? (
          <ol className="list-none p-0 m-0">
            {s.charges.map((c, n) => (
              <li key={n} className="flex justify-between gap-3 border-t border-border py-2">
                <span className={c.tone === "danger" ? "text-danger" : c.tone === "muted" ? "text-muted-2" : ""}>
                  {c.when.startsWith("2026") ? shortDate(c.when) : c.when} · {c.what}
                </span>
                <span className={c.tone === "danger" ? "text-danger" : ""}>{money(c.amount)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="m-0 text-muted-2">No charges. {s.optionalNote}.</p>
        )}
      </section>
    </Drawer>
  );
}

function CancelDialog({ sub: s, onClose, onCanceled }) {
  const [when, setWhen] = useState("period-end");
  const [why, setWhy] = useState("They want to self-host");
  const [pack, setPack] = useState(true);
  const [ack, setAck] = useState(false);
  const [err, setErr] = useState("");
  const sub = useSubmit();
  const periodEnd = s.next && s.next !== "on launch" ? shortDate(s.next) : "the end of the current period";
  const note = s.required
    ? "Restaurants need the plan: ordering, the kiosk and menu updates stop when it ends. They keep the site and the code. Make sure the owner knows before you confirm."
    : "They keep the site and the code. Hosting, their admin and support end with the period; we send the handover pack and a reminder 7 days before.";
  const submit = async () => {
    if (s.required && !ack) {
      setErr("Confirm the owner knows ordering and menu updates stop.");
      return;
    }
    setErr("");
    const out = await sub.run(() => api(`/api/admin/subscriptions/${s.id}/cancel`, { method: "POST", body: { when, reason: why, handoverPack: pack, acknowledgedRequired: ack } }));
    if (out) onCanceled(when);
  };
  return (
    <Modal
      id="cs"
      alert
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
      <p id="cs-p" className="m-0 leading-[1.6]">
        {note}
      </p>
      {s.required ? (
        <Note tone="warning">This is a required plan while the restaurant is active. Canceling it stops ordering, so only do it when the owner has agreed.</Note>
      ) : null}
      <FieldRow id="cs-when" label="When">
        <select id="cs-when" value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass}>
          <option value="period-end">End of the current period · {periodEnd}</option>
          <option value="now">Now (prorated refund)</option>
        </select>
      </FieldRow>
      <FieldRow id="cs-why" label="Reason">
        <select id="cs-why" value={why} onChange={(e) => setWhy(e.target.value)} className={inputClass}>
          {["They want to self-host", "Price", "Closing the business", "Unhappy with support", "Other"].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </FieldRow>
      <label className="flex items-center gap-2.5 cursor-pointer min-h-9">
        <input type="checkbox" checked={pack} onChange={(e) => setPack(e.target.checked)} className={checkClass} />
        <span>Send the handover pack (code, data export, DNS steps)</span>
      </label>
      {s.required ? (
        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-2.5 cursor-pointer min-h-9">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} aria-describedby={err ? "cs-ack-err" : undefined} className={`${checkClass} mt-0.5`} />
            <span>I told the owner that ordering, the kiosk and menu updates stop when this plan ends.</span>
          </label>
          {err ? (
            <p id="cs-ack-err" role="alert" className="m-0 text-[12px] text-danger flex items-center gap-1.5">
              <Icon name="alert" size={13} />
              {err}
            </p>
          ) : null}
        </div>
      ) : null}
      <FormError message={sub.status === "failed" ? sub.error : ""} />
    </Modal>
  );
}
