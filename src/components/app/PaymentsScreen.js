"use client";

import { useState } from "react";
import { money } from "@/lib/offers";
import { PAYMENTS_COPY } from "@/lib/app/kinds";
import { Card, CardTitle, DevStateSwitch, EmptyState, ErrorState, Icon, Page, PageHeader, SkeletonRows, StatTile, StatusPill, btnSecondary } from "./ui";
import RefundDialog from "./RefundDialog";
import { useToast } from "./Toast";
import { useListStatus } from "./hooks";
import { useBusiness } from "./useBusiness";

// Klyvora's cut on a client's payments. Business rule: payments go to the client's own Stripe account.
const KLYVORA_CUT = 0;

export default function PaymentsScreen() {
  const biz = useBusiness();
  return <Payments key={biz.kind} biz={biz} />;
}

function Payments({ biz }) {
  const copy = PAYMENTS_COPY[biz.kind];
  const toast = useToast();
  const [status, setStatus, retry] = useListStatus("live");
  const [refunded, setRefunded] = useState({});
  const [refunding, setRefunding] = useState(null);

  const rows = biz.payments.map((p) => (refunded[p.id] ? { ...p, status: "Refunded" } : p));
  const refundCount = rows.filter((p) => p.status === "Refunded").length;
  const shown = status === "live" && rows.length === 0 ? "empty" : status;

  return (
    <Page className="page-app-payments">
      <PageHeader eyebrow="Payments · your Stripe account" title="Money in">
        <span className="inline-flex items-center gap-2 text-[13px] text-muted-2">
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-success" />
          Stripe connected · yours
        </span>
        <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" className={btnSecondary}>
          Open Stripe
          <Icon name="external" size={15} />
        </a>
      </PageHeader>

      <div className="tiles grid gap-4 grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        <StatTile label={copy.takenLabel} value="$[x]" />
        <StatTile label="Next payout" value="$[x]" note="to [bank ••1234] on [date]" />
        <StatTile label="Refunds this month" value={String(refundCount)} note="$[x] back to customers" />
        <StatTile label="Klyvora’s cut" value={money(KLYVORA_CUT)} note="only Stripe’s card fee applies" />
      </div>

      <div className="flex flex-wrap gap-4 items-start">
        <Card aria-labelledby="pay-h" className="card-payments flex-[3_1_560px] overflow-hidden">
          <div className="flex justify-between items-center gap-3 px-6 pt-5 pb-3">
            <CardTitle id="pay-h">Recent payments</CardTitle>
            <span className="text-[13px] text-muted-2">Receipts are emailed by Stripe</span>
          </div>
          {shown === "loading" ? <SkeletonRows /> : null}
          {shown === "error" ? (
            <div className="px-4 pb-4">
              <ErrorState onRetry={retry}>Couldn’t load your payments from Stripe. Your money is safe; this is just the list.</ErrorState>
            </div>
          ) : null}
          {shown === "empty" ? (
            <div className="px-4 pb-4">
              <EmptyState title="No payments yet">The first online {biz.kind === "booking" ? "booking" : "order"} shows here with its payout date.</EmptyState>
            </div>
          ) : null}
          {shown === "live" ? (
            <div className="overflow-x-auto">
              <table className="payments-table w-full min-w-[640px] border-collapse text-sm">
                <caption className="sr-only">Recent payments</caption>
                <thead>
                  <tr className="bg-surface-2">
                    {["When", "Customer", "For", "Amount", "Status", "Actions"].map((h) => (
                      <th key={h} scope="col" className="text-left font-medium text-[13px] text-muted-2 px-4 py-3.5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="payment-row border-t border-border">
                      <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{p.when}</td>
                      <td className="px-4 py-3">{p.who}</td>
                      <td className="px-4 py-3 text-muted-2">{p.what}</td>
                      <td className="px-4 py-3 tabular-nums">{p.amount}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={p.status} />
                      </td>
                      <td className="px-4 py-2">
                        {p.status === "Refunded" ? (
                          <span className="text-[13px] text-muted-2">Refunded</span>
                        ) : (
                          <button type="button" className={btnSecondary} onClick={() => setRefunding(p)}>
                            Refund…<span className="sr-only"> {p.who}, {p.what}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>

        <Card aria-labelledby="po-h" className="card-payouts flex-[2_1_300px] px-6 py-5 flex flex-col gap-2">
          <CardTitle id="po-h">Payouts</CardTitle>
          <p className="m-0 text-[13px] text-muted-2">Stripe sends your balance to your bank on its own schedule.</p>
          {shown === "loading" ? <SkeletonRows rows={3} /> : null}
          {shown === "live" || shown === "empty" || shown === "error" ? (
            <ul className="list-none m-0 p-0 flex flex-col">
              {(shown === "live" ? biz.payouts : []).map((po) => (
                <li key={po.id} className="flex items-center justify-between gap-3 border-t border-border min-h-14 text-sm">
                  <span className="flex flex-col gap-0.5">
                    <span>{po.amount}</span>
                    <span className="text-[13px] text-muted-2">
                      {po.date} · {po.to}
                    </span>
                  </span>
                  <StatusPill status={po.status} />
                </li>
              ))}
              {shown !== "live" ? <li className="border-t border-border pt-3 text-[13px] text-muted-2">{shown === "empty" ? "No payouts yet." : "Payouts aren’t showing right now."}</li> : null}
            </ul>
          ) : null}
        </Card>
      </div>

      <p className="m-0 text-[13px] text-muted-2 leading-relaxed">
        Every dollar lands in your own Stripe account; Klyvora never holds your money and takes {money(KLYVORA_CUT)} per payment. Refunds, disputes and tax settings live in Stripe; this page is the short version.
      </p>

      <DevStateSwitch value={status} onChange={setStatus} options={["live", "empty", "loading", "error"]} />

      {refunding ? (
        <RefundDialog
          payment={refunding}
          onClose={() => setRefunding(null)}
          onDone={(p) => {
            setRefunded((r) => ({ ...r, [p.id]: true }));
            setRefunding(null);
            toast(`${p.amount} refunded to ${p.who} via Stripe`);
          }}
        />
      ) : null}
    </Page>
  );
}
