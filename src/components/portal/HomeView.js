"use client";

import Link from "next/link";
import { INVOICE_STATUS, STAGE_COPY, invoices as buildInvoices, milestones as buildMilestones, money2 } from "@/lib/portal/sample";
import { money } from "@/lib/offers";
import { usePortal, listState, planLine } from "./PortalContext";
import { Card, Chip, KeyRow, ListStatus, PageHead, RingCard, btnPrimary, linkBtn } from "./ui";
import SupportForm from "./SupportForm";
import UpdateCardDialog from "./UpdateCardDialog";
import { useState } from "react";

const MS_TONE = { done: ["Done", "success"], now: ["In progress", "accent"], next: ["Next", "muted"] };

function needs(p, invs) {
  const out = [];
  const due = invs.find((i) => i.status === "due");
  const todo = p.checklist.filter((c) => c.state !== "received").length;
  if (p.stage === "kickoff" || todo) {
    if (todo) out.push({ key: "content", text: `Send ${todo} ${todo === 1 ? "item" : "items"} of content`, href: "/portal/project#content", cta: "Open the checklist" });
  }
  if (p.stage === "demo") out.push({ key: "demo", text: "Click through the working demo, then approve it", href: "/portal/project", cta: "Review the demo" });
  if (p.stage === "launch") out.push({ key: "launch", text: "Sign off on the launch", href: "/portal/project", cta: "Sign off" });
  if (due) out.push({ key: "pay", text: `Pay ${due.name} (${money2(due.amount)})`, href: "/portal/invoices", cta: "Open invoices" });
  return out;
}

export default function HomeView() {
  const p = usePortal();
  const [card, setCard] = useState(false);
  const copy = STAGE_COPY[p.stage];
  const ms = buildMilestones(p.offer, p.stage);
  const invs = buildInvoices(p.offer, p.stage, p.paidExtra);
  const open = p.tickets.filter((t) => t.status !== "closed").length;
  const todo = needs(p, invs);
  const invStatus = listState(p, invs.length);
  const first = p.client.firstName;

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={p.client.business} title={`Welcome back, ${first}.`} lede={`Your ${p.offer.name} project ${copy.homeLede}`} />

      <RingCard titleId="proj-h" className="gap-6">
        <div className="flex flex-wrap justify-between items-baseline gap-3">
          <h2 id="proj-h" className="text-xl font-medium m-0">
            {p.offer.name} · {money(p.offer.setup)} setup
          </h2>
          <span className="text-sm text-muted-2">{planLine(p)}</span>
        </div>
        <ol className="list-none m-0 p-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          {ms.map((m) => {
            const [label, tone] = MS_TONE[m.state];
            const fill = m.state === "done" ? 100 : m.state === "now" ? 55 : 0;
            return (
              <li key={m.num} className={`flex flex-col gap-2.5 p-4 rounded-input bg-surface-2 border ${m.state === "now" ? "border-accent-light" : "border-border"}`}>
                <div className="flex justify-between items-center gap-2">
                  <span className={`eyebrow ${m.state === "now" ? "!text-accent-light" : ""}`}>{m.num}</span>
                  <Chip tone={tone}>{label}</Chip>
                </div>
                <span className="text-base font-medium">{m.title}</span>
                <span className="text-sm text-muted-2">
                  {m.percent}% · {money2(m.amount)}
                </span>
                <div aria-hidden="true" className="h-1 rounded-full bg-border overflow-hidden">
                  <div className={`h-full ${m.state === "done" ? "bg-success" : "bg-accent"}`} style={{ width: `${fill}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <p className="m-0 text-sm text-muted-2 max-w-[640px]">
            Setup is paid 50% at kickoff, 30% at the working demo and 20% when you accept the launch. You already own your domain, content, data and Stripe account; the site and its code are yours at final payment.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link href={copy.homeHref} className={btnPrimary}>
              {copy.homeCta}
            </Link>
            <a href="/api/portal/files/proposal" target="_blank" rel="noreferrer" className={linkBtn}>
              Read the signed proposal <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </RingCard>

      <Card titleId="need-h" title="What we need from you">
        {todo.length ? (
          <ul className="list-none m-0 p-0 flex flex-col">
            {todo.map((t) => (
              <li key={t.key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 min-h-14 border-t border-border py-2 text-sm">
                <span>{t.text}</span>
                <Link href={t.href} className={linkBtn}>
                  {t.cta} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-muted-2 border-t border-border pt-3.5">Nothing right now. We will email you when the next step needs you.</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-4 items-start">
        <section aria-labelledby="inv-h" className="flex-[3_1_520px] min-w-0 bg-surface border border-border rounded-card overflow-hidden">
          <div className="flex justify-between items-center gap-3 px-5 sm:px-6 pt-5 pb-2">
            <h2 id="inv-h" className="text-[17px] font-medium m-0">
              Invoices
            </h2>
            <Link href="/portal/invoices" className={linkBtn}>
              All invoices →
            </Link>
          </div>
          <div className="px-5 sm:px-6 pb-3">
            {invStatus === "live" ? null : <ListStatus status={invStatus} rows={3} label="your invoices" empty={{ text: "No invoices yet. The first one arrives when your project starts." }} onRetry={p.retry} />}
          </div>
          {invStatus === "live" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <caption className="sr-only">Invoices for this project</caption>
                <thead>
                  <tr className="bg-surface-2">
                    <th scope="col" className="text-left font-medium text-[13px] text-muted-2 py-3 px-4 pl-6 whitespace-nowrap">Invoice</th>
                    <th scope="col" className="text-left font-medium text-[13px] text-muted-2 py-3 px-4 whitespace-nowrap">Due</th>
                    <th scope="col" className="text-right font-medium text-[13px] text-muted-2 py-3 px-4 whitespace-nowrap">Amount</th>
                    <th scope="col" className="text-right font-medium text-[13px] text-muted-2 py-3 px-4 pr-6 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invs.map((i) => (
                    <tr key={i.id} className="border-t border-border">
                      <td className="py-3.5 px-4 pl-6">{i.name}</td>
                      <td className="py-3.5 px-4 text-muted-2">{i.dueLabel}</td>
                      <td className="py-3.5 px-4 text-right tabular-nums">{money2(i.amount)}</td>
                      <td className="py-3.5 px-4 pr-6 text-right">
                        <Chip tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-between items-center gap-2.5 px-5 sm:px-6 pt-3.5 pb-4 border-t border-border text-[13px] text-muted-2">
            <span>Payments go through Stripe. Receipts arrive by email.</span>
            <button type="button" onClick={() => setCard(true)} className={linkBtn}>
              Update card on file →
            </button>
          </div>
        </section>

        <div className="flex-[2_1_320px] min-w-0 flex flex-col gap-4">
          <Card titleId="site-h" title="Your site">
            <ul className="list-none m-0 p-0 flex flex-col">
              <KeyRow k={p.live ? "Live site" : "Preview"}>
                <a href={p.live ? p.project.liveUrl : p.project.previewUrl} className="text-accent-light">
                  {p.live ? p.project.domain : "[staging link]"} ↗
                </a>
              </KeyRow>
              <KeyRow k="Domain">{p.project.domain} · yours</KeyRow>
              <KeyRow k="Stripe account">
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="w-[7px] h-[7px] rounded-full bg-success inline-block" />
                  Connected · yours
                </span>
              </KeyRow>
              <KeyRow k="Booking admin">{p.live ? <a href="/app" className="text-accent-light">Open ↗</a> : <span className="text-muted-2">Opens at launch</span>}</KeyRow>
            </ul>
          </Card>
        </div>
      </div>

      <Card titleId="sup-h" title="Need something?" action={<Link href="/portal/support" className={linkBtn}>{open} open →</Link>}>
        <SupportForm />
      </Card>

      {card ? <UpdateCardDialog onClose={() => setCard(false)} /> : null}
    </div>
  );
}
