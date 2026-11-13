import Link from "next/link";
import { PageHead, Ring, LEAD_STATUS_TONE, LinkArrow, money } from "@/components/admin/ui";
import TaskList from "@/components/admin/TaskList";
import { Suspense } from "react";
import { LEAD_STATUSES } from "@/lib/admin/sample";
import { getDashboard } from "@/lib/server/data";
import { pageUser } from "@/lib/server/views";

export const metadata = { title: "Dashboard" };

const STAGE_BAR = {
  New: "bg-accent-light",
  Contacted: "bg-muted-2",
  "Demo booked": "bg-accent",
  "Proposal sent": "bg-fg",
  Signed: "bg-success",
  Lost: "bg-muted",
};
const STATUS_TEXT = {
  accent: "text-accent-light",
  muted: "text-muted-2",
  fg: "text-fg",
  success: "text-success",
};

function Target({ label, value, target, unit = "" }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <article className="bg-surface border border-border rounded-admin p-6 box-border flex flex-col gap-3">
      <div className="flex justify-between items-center gap-3">
        <span className="text-[13px] text-muted-2">{label}</span>
        <span className={`text-xs border border-border-2 rounded-full px-2.5 py-1 ${pct >= 100 ? "text-success" : "text-muted-2"}`}>{pct}% of target</span>
      </div>
      <div className="flex items-center gap-4">
        <Ring pct={pct} label={`${label} progress toward target`} />
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-display text-[40px] leading-none tabular-nums">
            {money(value)}
            {unit}
          </span>
          <span className="text-[13px] text-muted">
            of {money(target)}
            {unit} · {pct >= 100 ? "Target met" : `${money(target - value)} to go`}
          </span>
        </div>
      </div>
    </article>
  );
}

function Count({ href, label, value, note, noteClass = "text-muted", children }) {
  return (
    <Link href={href} className="bg-surface-2 border border-border rounded-admin px-6 py-5 box-border flex flex-col gap-1.5 text-fg hover:border-border-2 transition-colors">
      <span className="text-[13px] text-muted-2">{label}</span>
      <span className="flex items-baseline gap-2.5">
        <span className="text-[32px] font-medium leading-none tabular-nums">{value}</span>
        <span className={`text-[13px] ${noteClass}`}>{note}</span>
      </span>
      {children}
    </Link>
  );
}

export default function Page() { return <Suspense fallback={<div aria-busy="true">Loading…</div>}><Dashboard /></Suspense>; }
async function Dashboard() {
  await pageUser();
  const data = await getDashboard();
  const { leads: LEADS, tasks: TASKS, outreach: OUTREACH_TODAY, metrics: m } = data;
  const t = m.targets;
  const counts = LEAD_STATUSES.map((s) => [s, LEADS.filter((l) => l.status === s).length]);
  const open = LEADS.filter((l) => l.status !== "Signed" && l.status !== "Lost").length;
  const onPace = m.contactsThisWeek >= 65;
  const contactsNote = onPace ? "On pace" : `${65 - m.contactsThisWeek} to the low end`;
  return (
    <>
      <PageHead eyebrow="Dashboard · business overview" title="Where the business stands">
        <LinkArrow href="/admin/leads">Open leads</LinkArrow>
      </PageHead>

      <section aria-labelledby="targets-h">
        <h2 id="targets-h" className="sr-only">
          Targets
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          <Target label="Signed project fees" value={m.signed} target={t.signed} />
          <Target label="Cash collected" value={m.cash} target={t.cash} />
          <Target label="Monthly recurring" value={m.mrr} target={t.mrr} unit="/mo" />
        </div>
      </section>

      <section aria-label="This week">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <Count href="/admin/outreach" label="Contacts this week · goal 65–95" value={m.contactsThisWeek} note={contactsNote} noteClass={onPace ? "text-success" : "text-accent-light"}>
            <span aria-hidden="true" className="block h-1 rounded-full bg-border overflow-hidden mt-1">
              <span className="block h-full bg-accent" style={{ width: `${Math.min(100, Math.round((m.contactsThisWeek / 95) * 100))}%` }} />
            </span>
          </Count>
          <Count href="/admin/invoices?status=overdue" label="Overdue invoices" value={m.overdueInvoices} note="Send a reminder" />
          <Count href="/admin/support" label="Open tickets" value={m.openTickets} note="View tickets →" noteClass="text-accent-light" />
          <Count href="/admin/subscriptions" label="Clients on a monthly plan" value={m.activeClients} note={`${money(m.mrr)}/mo today`} />
        </div>
      </section>

      <section aria-labelledby="out-h" className="bg-surface border border-border rounded-admin px-6 py-5 box-border flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex-[1_1_260px] min-w-0 flex flex-col gap-1">
          <h2 id="out-h" className="text-[17px] font-medium m-0 flex items-center gap-2.5">
            <span aria-hidden="true" className="w-2 h-2 rounded-full bg-success inline-block" />
            Outreach · Claude ran at {OUTREACH_TODAY.ranAt}
          </h2>
          <span className="text-[13px] text-muted-2">
            {OUTREACH_TODAY.found} new prospects, {OUTREACH_TODAY.toApprove} items waiting for your approval, {OUTREACH_TODAY.replies} reply overnight.
          </span>
        </div>
        <div className="flex flex-wrap gap-6 text-[13px]">
          {[
            [OUTREACH_TODAY.found, `found today · goal ${OUTREACH_TODAY.foundGoal}`],
            [OUTREACH_TODAY.toApprove, "to approve"],
            [OUTREACH_TODAY.demosInProgress, "demos in progress"],
          ].map(([n, l]) => (
            <span key={l} className="flex flex-col gap-0.5">
              <span className="text-2xl font-medium leading-none tabular-nums">{n}</span>
              <span className="text-xs text-muted">{l}</span>
            </span>
          ))}
        </div>
        <Link href="/admin/outreach" className="text-[13px] font-medium text-bg bg-fg rounded-full px-[18px] min-h-10 inline-flex items-center gap-2">
          Review the queue <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section aria-labelledby="tasks-h" className="bg-surface border border-border rounded-admin overflow-hidden">
        <TaskList tasks={TASKS} />
      </section>

      <div className="flex flex-wrap gap-4 items-start">
        <section aria-labelledby="recent-h" className="flex-[3_1_520px] min-w-0 bg-surface border border-border rounded-admin overflow-hidden">
          <div className="flex justify-between items-center gap-3 px-6 pt-5 pb-3">
            <h2 id="recent-h" className="text-[17px] font-medium m-0">
              Recent leads
            </h2>
            <Link href="/admin/leads" className="text-[13px] text-accent-light hover:text-fg">
              All leads →
            </Link>
          </div>
          <ul className="list-none m-0 p-0 px-2 pb-2">
            {LEADS.slice(0, 5).map((l) => (
              <li key={l.id}>
                <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-[14px] text-fg min-h-14 box-border hover:bg-surface-2">
                  <span aria-hidden="true" className="w-9 h-9 rounded-full bg-surface-2 border border-border-2 inline-flex items-center justify-center text-[13px] text-muted-2 flex-none">
                    {l.business[0]}
                  </span>
                  <span className="flex-[1_1_200px] min-w-0 flex flex-col gap-0.5">
                    <span className="text-[13px] font-medium">{l.business}</span>
                    <span className="text-[13px] text-muted">
                      {l.name} · {l.source}
                    </span>
                  </span>
                  <span className="text-xs text-muted-2 border border-border-2 rounded-full px-2.5 py-1">{l.offer}</span>
                  <span className={`text-xs border border-border-2 rounded-full px-2.5 py-1 ${STATUS_TEXT[LEAD_STATUS_TONE[l.status]] || "text-muted-2"}`}>{l.status}</span>
                  <span className="text-[13px] text-muted min-w-16 text-right">{l.when}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pipe-h" className="flex-[2_1_320px] min-w-0 bg-surface border border-border rounded-admin px-6 pt-5 pb-6 box-border flex flex-col gap-4">
          <div className="flex justify-between items-center gap-3">
            <h2 id="pipe-h" className="text-[17px] font-medium m-0">
              Pipeline
            </h2>
            <span className="text-[13px] text-muted">{open} open</span>
          </div>
          <div aria-hidden="true" className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            {counts.map(([s, n]) => (
              <span key={s} className={STAGE_BAR[s]} style={{ flex: `${n} 1 0`, minWidth: n ? 6 : 0 }} />
            ))}
          </div>
          <ol className="list-none m-0 p-0 flex flex-col">
            {counts.map(([s, n]) => (
              <li key={s} className="flex justify-between items-center gap-3 min-h-10 border-t border-border text-[13px]">
                <span className="flex items-center gap-2.5">
                  <span aria-hidden="true" className={`w-2 h-2 rounded-full inline-block ${STAGE_BAR[s]}`} />
                  {s}
                </span>
                <span className="tabular-nums text-muted-2">{n}</span>
              </li>
            ))}
          </ol>
          <Link href="/admin/leads?view=board" className="text-[13px] text-accent-light hover:text-fg min-h-11 inline-flex items-center">
            Open the board →
          </Link>
        </section>
      </div>
    </>
  );
}
