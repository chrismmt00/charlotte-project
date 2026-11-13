"use client";

import Link from "next/link";
import { useState } from "react";
import { Chip, Empty, Skeleton, btnPrimary, btnSecondary } from "@/components/admin/ui";
import { Icon, Initial, chipBtn } from "@/components/admin/leads/Overlay";
import { OUTREACH_OWNERS, PHASES, PHASE_TONE } from "@/lib/admin/sample-outreach";

const selectCls = "min-h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-[13px] text-fg font-[inherit] max-w-full";
const TH = "text-left font-normal px-4 py-3 whitespace-nowrap";

function TableBox({ children, min = 900 }) {
  return (
    <div className="border border-border rounded-admin bg-surface overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" style={{ minWidth: min }}>
        {children}
      </table>
    </div>
  );
}

function SectionHead({ id, title, count, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h2 id={id} className="text-[17px] font-medium m-0">
          {title} {count != null ? <span className="text-muted-2 font-normal text-[13px]">{count}</span> : null}
        </h2>
        {children ? <p className="m-0 mt-1 text-muted-2 max-w-[640px]">{children}</p> : null}
      </div>
    </div>
  );
}

// ---------------- Approval queue ----------------
export function ApprovalQueue({ queue, loading, busyId, onApprove, onEdit, onSkip }) {
  return (
    <section id="approvals" aria-labelledby="appr-h">
      <SectionHead id="appr-h" title="Approval queue">
        Emails and demos. Nothing goes out until a person approves it.
      </SectionHead>
      {loading ? (
        <div aria-busy="true" aria-label="Loading queue" className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="border border-border rounded-admin bg-surface p-5 flex flex-col gap-3">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3" />
              <Skeleton className="h-8 w-40" />
            </div>
          ))}
        </div>
      ) : null}
      {!loading && !queue.length ? (
        <Empty title="Queue is clear">Claude’s next drafts land here after tomorrow’s 8:00 run.</Empty>
      ) : null}
      {!loading ? (
        <ul className="list-none p-0 m-0 flex flex-col gap-3">
          {queue.map((d) => {
            const demo = d.kind === "demo";
            return (
              <li key={d.id} className="border border-border rounded-admin bg-surface p-5 flex flex-col gap-2.5 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-2">
                  <span>
                    {demo ? "Demo for" : "To"} <strong className="text-fg font-medium">{d.business}</strong> · {demo ? d.attach : d.to}
                  </span>
                  <span>
                    {demo ? "Demo built by Claude" : "Drafted by Claude"} · {d.when}
                  </span>
                </div>
                <div className="text-[15px] font-medium">{d.subject}</div>
                <p className="m-0 text-muted-2 leading-relaxed line-clamp-3">{d.body}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <button type="button" className={btnPrimary} disabled={busyId === d.id} onClick={() => onApprove(d)}>
                    <Icon name="send" /> {busyId === d.id ? "Sending…" : demo ? "Approve and send demo" : "Approve and send"}
                  </button>
                  {demo ? (
                    <Link href={`/admin/outreach/demo/${d.demoId}`} className={btnSecondary}>
                      Open demo ↗
                    </Link>
                  ) : (
                    <button type="button" className={btnSecondary} onClick={() => onEdit(d)}>
                      Edit draft
                    </button>
                  )}
                  {demo ? (
                    <Link href={`/admin/outreach/demo/${d.demoId}#changes`} className={btnSecondary}>
                      Request changes
                    </Link>
                  ) : (
                    <button type="button" className={btnSecondary} onClick={() => onSkip(d)}>
                      Skip
                    </button>
                  )}
                  {!demo ? <span className="text-[12px] text-muted-2 ml-auto">Attach: {d.attach}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

// ---------------- Today's run ----------------
export function RunTab({ run, runInfo, onRun, onReview }) {
  const running = run.status === "running";
  const pct = Math.round((run.step / 5) * 100);
  return (
    <section aria-labelledby="run-h">
      <SectionHead id="run-h" title="Today’s run">
        Claude Cowork · {runInfo.ranAt}
      </SectionHead>
      {running ? (
        <div role="status" aria-live="polite" className="border border-border rounded-admin bg-surface p-5 mb-4">
          <div className="flex justify-between gap-3 mb-2">
            <strong className="font-medium">
              Running now · step {run.step} of 5
            </strong>
            <span className="text-muted-2 tabular-nums">{pct}%</span>
          </div>
          <div role="progressbar" aria-label="Run progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1.5 rounded-full bg-border overflow-hidden mb-3">
            <div className="h-full bg-accent rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="m-0">{runInfo.steps[run.step - 1]}</p>
          <p className="m-0 mt-1 text-[12px] text-muted-2">You can leave this page; the run finishes on its own and the queue updates.</p>
        </div>
      ) : null}
      {run.status === "done" ? (
        <div role="status" className="border border-[rgba(var(--success-rgb),.4)] bg-[rgba(var(--success-rgb),.06)] rounded-admin p-5 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-success">
            <Icon name="check" size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <strong className="font-medium">Run finished</strong>
            <div className="text-muted-2">{runInfo.summary}</div>
          </div>
          <button type="button" className={btnSecondary} onClick={onReview}>
            Review the queue →
          </button>
        </div>
      ) : null}
      <ol className="list-none p-0 m-0 mb-6 border border-border rounded-admin bg-surface">
        {runInfo.log.map((r, i) => (
          <li key={i} className="flex gap-4 px-5 py-3 border-t border-border first:border-t-0">
            <span className="text-muted-2 tabular-nums w-10 flex-none">{r.t}</span>
            <span>{r.text}</span>
          </li>
        ))}
      </ol>
      <div className="border border-border rounded-admin bg-surface p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] text-muted-2 mb-1">Search brief · edit in Settings</div>
          <div className="break-words">{runInfo.brief}</div>
        </div>
        <div className="flex gap-2">
          <button type="button" className={btnSecondary} onClick={onRun} disabled={running}>
            {running ? "Running…" : "Run today’s search now"}
          </button>
          <Link href="/admin/settings" className={btnSecondary}>
            Outreach settings →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------- Prospects ----------------
export function ProspectsTab({ prospects, state, onOpen, onRetry, onRun, onLog }) {
  const [filter, setFilter] = useState("All");
  const [owner, setOwner] = useState("All");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const vis = prospects.filter((p) => (!q || `${p.business} ${p.kind} ${p.area}`.toLowerCase().includes(q)) && (owner === "All" || p.owner === owner));
  const rows = vis.filter((p) => filter === "All" || p.phase === filter);
  const live = state === "live";
  return (
    <section aria-labelledby="pros-h">
      <SectionHead id="pros-h" title="Prospects" count={`${prospects.length} tracked`} />
      <div className="flex flex-wrap items-center gap-2.5 mb-3">
        <label htmlFor="pros-search" className="sr-only">
          Search prospects
        </label>
        <input id="pros-search" type="search" placeholder="Search business or area" value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 basis-[220px] min-w-0 min-h-10 rounded-[12px] border border-border-2 bg-surface px-4 text-[13px] text-fg" />
        <label htmlFor="pros-owner" className="sr-only">
          Filter by owner
        </label>
        <select id="pros-owner" value={owner} onChange={(e) => setOwner(e.target.value)} className={`${selectCls} min-h-10`}>
          <option value="All">Everyone</option>
          {OUTREACH_OWNERS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      <div role="group" aria-label="Filter by phase" className="flex flex-wrap gap-1.5 mb-4">
        {["All", ...PHASES].map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={chipBtn(filter === f)}>
            {f}
            <span className={`text-[12px] tabular-nums ${filter === f ? "opacity-70" : "text-muted-2"}`}>{f === "All" ? vis.length : vis.filter((p) => p.phase === f).length}</span>
          </button>
        ))}
      </div>

      {state === "loading" ? (
        <div aria-busy="true" aria-label="Loading prospects" className="border border-border rounded-admin bg-surface overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-t border-border first:border-t-0">
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          ))}
        </div>
      ) : null}
      {state === "error" ? (
        <div role="alert" className="border border-fg rounded-admin bg-surface p-10 flex flex-col items-center text-center gap-3">
          <Icon name="alert" size={28} />
          <h3 className="text-[18px] font-medium m-0">Couldn’t load prospects</h3>
          <p className="m-0 text-muted-2 max-w-[420px]">
            <code className="text-[12px]">GET /api/admin/outreach</code> didn’t answer. Claude’s run log is unaffected. Try again.
          </p>
          <button type="button" className={btnPrimary} onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}
      {state === "empty" ? (
        <div className="border border-dashed border-border-2 rounded-admin bg-surface p-12 flex flex-col items-center text-center gap-3">
          <h3 className="text-[20px] font-medium m-0">No prospects yet</h3>
          <p className="m-0 text-muted-2 max-w-[460px] leading-relaxed">Claude’s first search runs tomorrow at 8:00 against the brief in Settings: [NEIGHBORHOODS], five business types. Run it now if you don’t want to wait, or log someone you already talked to.</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button type="button" className={btnPrimary} onClick={onRun}>
              Run today’s search now
            </button>
            <button type="button" className={btnSecondary} onClick={onLog}>
              Log outreach
            </button>
            <Link href="/admin/settings" className={btnSecondary}>
              Edit the brief
            </Link>
          </div>
        </div>
      ) : null}
      {live ? (
        <>
          <TableBox min={1040}>
            <caption className="sr-only">Prospects and where each one is</caption>
            <thead>
              <tr className="bg-surface-2 text-muted-2">
                {["Business", "Website today", "Suggested offer", "Phase", "Owner", "Last activity", "Next step", "Actions"].map((h) => (
                  <th key={h} scope="col" className={TH}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onOpen(p.id)} className="bg-transparent border-0 p-0 text-left text-fg font-medium hover:underline cursor-pointer text-[13px]">
                      {p.business}
                    </button>
                    <div className="text-[12px] text-muted-2">
                      {p.kind} · {p.area}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-2">{p.site}</td>
                  <td className="px-4 py-3 text-muted-2">{p.offer}</td>
                  <td className="px-4 py-3">
                    <Chip tone={PHASE_TONE[p.phase]}>{p.phase}</Chip>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <Initial owner={p.owner} />
                      {p.owner}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.last}
                    <div className="text-[12px] text-muted-2">{p.lastWhen}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-2">{p.next}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onOpen(p.id)} aria-label={`Open ${p.business}`} className="bg-transparent border-0 p-0 min-h-9 text-accent-light hover:text-fg cursor-pointer text-[13px]">
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableBox>
          {!rows.length ? <p className="m-0 mt-3 text-center text-muted-2">No prospects match. Clear the search or pick another phase.</p> : null}
        </>
      ) : null}
    </section>
  );
}

// ---------------- Call list ----------------
export function CallsTab({ calls, contactsWeek, goal, onOpen, onLog, onScript }) {
  return (
    <section aria-labelledby="calls-h">
      <SectionHead id="calls-h" title="Call list" count={`${calls.length} for today`}>
        Prospects who replied, asked for a call, or went quiet after the email. Log each call so the week’s contact count stays honest.
      </SectionHead>
      <p className="m-0 mb-3 text-muted-2">
        Weekly target {goal[0]}–{goal[1]} contacts · {contactsWeek} so far
      </p>
      <TableBox min={880}>
        <caption className="sr-only">Today’s call list</caption>
        <thead>
          <tr className="bg-surface-2 text-muted-2">
            {["Business", "Phone", "Why today", "Best time", "Script", "Who", "Actions"].map((h) => (
              <th key={h} scope="col" className={TH}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calls.map((c) => (
            <tr key={c.id} className={`border-t border-border align-top ${c.done ? "opacity-60" : ""}`}>
              <td className="px-4 py-3">
                <button type="button" onClick={() => onOpen(c.prospect.id)} className="bg-transparent border-0 p-0 text-left text-fg font-medium hover:underline cursor-pointer text-[13px]">
                  {c.prospect.business}
                </button>
                <div className="text-[12px] text-muted-2">
                  {c.prospect.kind} · {c.prospect.area}
                </div>
              </td>
              <td className="px-4 py-3">
                <a href="tel:+17045550100" className="text-accent-light">
                  [Phone]
                </a>
              </td>
              <td className="px-4 py-3">{c.why}</td>
              <td className="px-4 py-3 text-muted-2">{c.best}</td>
              <td className="px-4 py-3">
                <button type="button" onClick={onScript} className="bg-transparent border-0 p-0 min-h-9 text-accent-light hover:text-fg cursor-pointer text-[13px]">
                  {c.scriptTitle}
                </button>
              </td>
              <td className="px-4 py-3">{c.who}</td>
              <td className="px-4 py-3">
                {c.done ? (
                  <Chip tone="success">Logged</Chip>
                ) : (
                  <button type="button" className={btnSecondary} onClick={() => onLog(c)}>
                    Log call
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </TableBox>
    </section>
  );
}

// ---------------- Scripts ----------------
export function ScriptsTab({ scripts, onCopy }) {
  return (
    <section aria-labelledby="scripts-h">
      <SectionHead id="scripts-h" title="Scripts">
        Talk tracks for calls and visits. Claude keeps the email versions in Settings → Templates; these are for people. Say “we”.
      </SectionHead>
      <div className="flex flex-col gap-3">
        {scripts.map((sc, i) => (
          <details key={sc.id} open={i === 0} className="border border-border rounded-admin bg-surface group">
            <summary className="flex items-center justify-between gap-3 px-5 min-h-12 cursor-pointer list-none">
              <span className="font-medium">
                {sc.title} <span className="text-muted-2 font-normal">· {sc.length}</span>
              </span>
              <span aria-hidden="true" className="text-muted-2 group-open:rotate-180 transition-transform">
                ▾
              </span>
            </summary>
            <div className="px-5 pb-5 flex flex-col gap-2.5">
              {sc.lines.map((l) => (
                <p key={l.k} className="m-0 leading-relaxed">
                  <strong className="font-medium">{l.k}</strong> <span className="text-muted-2">{l.t}</span>
                </p>
              ))}
              <div className="flex gap-2 mt-1">
                <button type="button" className={btnSecondary} onClick={() => onCopy(sc)}>
                  Copy
                </button>
                <Link href="/admin/settings" className={btnSecondary}>
                  Edit in Settings
                </Link>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

// ---------------- Partners ----------------
export function PartnersTab({ partners, onAdd, onTouch }) {
  return (
    <section aria-labelledby="partners-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHead id="partners-h" title="Referral partners" count={partners.length}>
          People who meet small-business owners before we do. One touch a month each; a referral that signs earns the thank-you in Settings.
        </SectionHead>
        <button type="button" className={btnPrimary} onClick={onAdd}>
          Add partner
        </button>
      </div>
      <TableBox min={900}>
        <caption className="sr-only">Referral partners</caption>
        <thead>
          <tr className="bg-surface-2 text-muted-2">
            {["Partner", "Type", "Contact", "Last touch", "Referrals", "Signed", "Owner", "Actions"].map((h) => (
              <th key={h} scope="col" className={TH}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {partners.map((pt) => (
            <tr key={pt.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{pt.name}</td>
              <td className="px-4 py-3 text-muted-2">{pt.type}</td>
              <td className="px-4 py-3">
                <a href="mailto:partner@example.com" className="text-accent-light">
                  [email]
                </a>{" "}
                ·{" "}
                <a href="tel:+17045550100" className="text-accent-light">
                  [Phone]
                </a>
              </td>
              <td className={`px-4 py-3 ${pt.overdue ? "text-warning" : "text-muted-2"}`}>
                {pt.last}
                {pt.overdue ? " · overdue" : ""}
              </td>
              <td className="px-4 py-3">{pt.referrals}</td>
              <td className="px-4 py-3">{pt.signed}</td>
              <td className="px-4 py-3">{pt.owner}</td>
              <td className="px-4 py-3">
                <button type="button" className={btnSecondary} onClick={() => onTouch(pt)}>
                  Log touch
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableBox>
      <p className="text-[12px] text-muted-2 mt-3 mb-0">Overdue (no touch in 30 days) shows in the warning color and says so. Partners are not prospects: they never get Claude’s cold emails.</p>
    </section>
  );
}
