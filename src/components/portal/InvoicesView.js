"use client";

import Link from "next/link";
import { useState } from "react";
import { INVOICE_STATUS, money2 } from "@/lib/portal/sample";
import { money } from "@/lib/offers";
import { listState, usePortal } from "./PortalContext";
import { Card, Chip, ListStatus, PageHead, btnPrimary, btnSecondary, linkBtn } from "./ui";
import PayDialog from "./PayDialog";
import UpdateCardDialog from "./UpdateCardDialog";

const TH = "text-left font-medium text-[13px] text-muted-2 py-3 px-4 whitespace-nowrap";

export default function InvoicesView() {
  const p = usePortal();
  const [dialog, setDialog] = useState(null); // { type: "pay", id } | { type: "card" }
  const invs = p.invoices;
  const status = listState(p, invs.length);
  const paid = invs.filter((i) => i.status === "paid").reduce((n, i) => n + i.amount, 0);
  const payInv = dialog?.type === "pay" ? invs.find((i) => i.id === dialog.id) : null;
  const m = p.offer.monthly;
  const chip = !p.monthlyChosen ? null : p.planCanceled ? ["Ending", "warning"] : p.live ? ["Active", "success"] : ["Starts at launch", "muted"];

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow="Invoices" title="Invoices and payments" lede={`${p.monthlyChosen ? "Three invoices for the setup, then the " + (p.offer.monthlyRequired ? "monthly plan" : "optional monthly plan") : "Three invoices for the setup"}. Nothing is charged without you pressing Pay.`} />

      <Card titleId="invt-h" title={`Setup · ${money(p.offer.setup)} in three parts`} action={<span className="text-sm text-muted-2">Paid to date: {money2(paid)}</span>} flush>
        <div className="px-5 sm:px-6">
          {status !== "live" ? <ListStatus status={status} rows={3} label="your invoices" empty={{ text: "No invoices yet. The first one arrives when your project starts." }} onRetry={p.retry} /> : null}
        </div>
        {status === "live" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">Invoices</caption>
              <thead>
                <tr className="bg-surface-2">
                  <th scope="col" className={`${TH} pl-6`}>Invoice</th>
                  <th scope="col" className={TH}>Due</th>
                  <th scope="col" className={`${TH} text-right`}>Amount</th>
                  <th scope="col" className={TH}>Status</th>
                  <th scope="col" className={`${TH} pr-6`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invs.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="py-3.5 px-4 pl-6">
                      {i.name}
                      <span className="block text-[13px] text-muted-2">{i.id}</span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-2">{i.dueLabel}</td>
                    <td className="py-3.5 px-4 text-right tabular-nums">{money2(i.amount)}</td>
                    <td className="py-3.5 px-4">
                      <Chip tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Chip>
                    </td>
                    <td className="py-2 px-4 pr-6">
                      {i.status === "due" ? (
                        <button type="button" onClick={() => setDialog({ type: "pay", id: i.id })} className={btnPrimary}>
                          Pay {money2(i.amount)}
                        </button>
                      ) : i.status === "paid" ? (
                        <a href={i.receiptUrl} download className={btnSecondary} onClick={() => p.toast(`Receipt ${i.id}.pdf downloaded`)}>
                          Receipt (PDF)
                        </a>
                      ) : (
                        <span className="text-muted-2">{i.note}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <p className="m-0 px-5 sm:px-6 py-4 border-t border-border text-[13px] leading-normal text-muted-2">
          Each invoice is created by a milestone: kickoff when you signed, the working demo when you approve it, the launch when you sign off. Nothing is charged automatically; you pay each one here or from the email.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <Card titleId="pm-h" title="Card on file">
          <div className="flex flex-wrap justify-between items-center gap-3 border-t border-border pt-3.5">
            <div className="flex flex-col">
              <span className="text-[15px]">
                {p.card.brand} ending {p.card.last4}
              </span>
              <span className="text-[13px] text-muted-2">Expires {p.card.exp} · held by Stripe, never by us</span>
            </div>
            <button type="button" onClick={() => setDialog({ type: "card" })} className={btnSecondary}>
              Update
            </button>
          </div>
          <p className="m-0 text-[13px] text-muted-2">Used only when you press Pay{p.monthlyChosen ? ", and for the monthly plan once it starts" : ""}.</p>
        </Card>

        <Card titleId="mp-h" title="Monthly plan">
          {p.monthlyChosen ? (
            <>
              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3.5">
                <span className="text-[22px] font-medium">${m}/month</span>
                {chip ? <Chip tone={chip[1]}>{chip[0]}</Chip> : null}
              </div>
              <p className="m-0 text-sm leading-[1.6] text-muted-2">
                Covers {p.offer.monthlyNote}, support and up to {p.hours.cap} hours of small changes a month.{" "}
                {p.offer.monthlyRequired ? "It is required for restaurant clients because ordering and kitchen tools need daily care; the site stays yours." : "Optional: you chose it on the proposal, and you can end it any time from Account; the site and code stay yours."}
              </p>
              <Link href="/portal/account" className={`${linkBtn} self-start`}>
                Manage in Account →
              </Link>
            </>
          ) : (
            <p className="m-0 text-sm leading-[1.6] text-muted-2 border-t border-border pt-3.5">
              You did not choose a monthly plan, so there is nothing to pay after the setup. The site and code are yours at final payment. You can add the plan later by asking in Support.
            </p>
          )}
        </Card>
      </div>

      {payInv ? <PayDialog key={payInv.id} invoice={payInv} onClose={() => setDialog(null)} /> : null}
      {dialog?.type === "card" ? <UpdateCardDialog onClose={() => setDialog(null)} /> : null}
    </div>
  );
}
