"use client";

import Link from "next/link";
import { useState } from "react";
import { btnPrimary, btnSecondary } from "@/components/admin/ui";
import { Icon, Initial, chipBtn, btnSmSecondary } from "@/components/admin/leads/Overlay";
import { OUTREACH_OWNERS, PHASES } from "@/lib/admin/sample-outreach";

// Phase colour (text + dot), from the board's PC map.
export const PHASE_TEXT = {
  Found: "text-muted-2",
  Researched: "text-muted-2",
  "Email drafted": "text-accent-light",
  Emailed: "text-accent-light",
  Replied: "text-accent",
  "Demo in progress": "text-accent",
  "Demo ready for review": "text-accent-light",
  "Demo sent": "text-fg",
  "Call booked": "text-fg",
  "Became a lead": "text-success",
  "Not a fit": "text-muted",
};
const PHASE_DOT = {
  Found: "bg-muted-2",
  Researched: "bg-muted-2",
  "Email drafted": "bg-accent-light",
  Emailed: "bg-accent-light",
  Replied: "bg-accent",
  "Demo in progress": "bg-accent",
  "Demo ready for review": "bg-accent-light",
  "Demo sent": "bg-fg",
  "Call booked": "bg-fg",
  "Became a lead": "bg-success",
  "Not a fit": "bg-muted",
};

const TH = "text-left font-medium text-[13px] text-muted-2 px-4 py-3.5 whitespace-nowrap";
const THFIRST = "text-left font-medium text-[13px] text-muted-2 pl-5 pr-4 py-3.5 whitespace-nowrap";
const THLAST = "text-right font-medium text-[13px] text-muted-2 pl-4 pr-5 py-3.5";
const TD = "px-4 py-3";
const TDFIRST = "pl-5 pr-4 py-3";
const TDLAST = "pl-4 pr-5 py-3 text-right whitespace-nowrap";
const linkBtn = "bg-transparent border-0 p-0 text-left font-medium text-fg hover:underline cursor-pointer text-[13px] font-[inherit]";
const rowCls = "border-t border-border hover:bg-[rgba(var(--fg-rgb),.03)]";

function Sk({ className = "", style }) {
  return <span aria-hidden="true" style={style} className={`block rounded-md bg-surface-2 animate-pulse ${className}`} />;
}

// Table card: surface, border, radius 16, scrolls inside.
function TableCard({ min, children, foot }) {
  return (
    <div className="bg-surface border border-border rounded-admin overflow-hidden">
      <div className="overflow-x-auto relative">
        <table className="w-full border-collapse text-[13px]" style={{ minWidth: min }}>
          {children}
        </table>
      </div>
      {foot}
    </div>
  );
}

function Heading({ id, title, count, desc, right, align = "center" }) {
  return (
    <div className={`flex flex-wrap justify-between ${align === "end" ? "items-end" : "items-center"} gap-3`}>
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-xl font-medium m-0">
          {title} {count != null ? <span className="text-[13px] text-muted font-normal">{count}</span> : null}
        </h2>
        {desc ? <span className="text-[13px] text-muted-2">{desc}</span> : null}
      </div>
      {right}
    </div>
  );
}

// ---------------- Approval queue ----------------
export function ApprovalQueue({ queue, loading, busyId, onApprove, onEdit, onSkip }) {
  return (
    <section id="approvals" aria-labelledby="appr-h" className="bg-surface border border-border rounded-admin overflow-hidden scroll-mt-20">
      <div className="flex flex-wrap justify-between items-center gap-3 px-6 pt-5 pb-3">
        <h2 id="appr-h" className="text-[17px] font-medium m-0">
          Approval queue
        </h2>
        <span className="text-[13px] text-muted">Emails and demos. Nothing goes out until a person approves it.</span>
      </div>
      {loading ? (
        <div aria-busy="true" aria-label="Loading queue" className="px-6 pt-1 pb-6 flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="border border-border rounded-[14px] px-[18px] py-4 flex flex-col gap-2.5">
              <Sk className="h-3 w-[45%]" />
              <Sk className="h-3.5 w-[70%]" />
              <Sk className="h-2.5 w-[95%]" />
              <Sk className="h-2.5 w-[88%]" />
              <span className="flex gap-2 mt-1">
                <Sk className="h-9 w-[140px] rounded-full" />
                <Sk className="h-9 w-[100px] rounded-full" />
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {!loading && !queue.length ? <p className="m-0 px-6 pt-3 pb-7 text-[13px] text-muted">Queue is clear. Claude’s next drafts land here after tomorrow’s 8:00 run.</p> : null}
      {!loading ? (
        <ul className="list-none m-0 px-6 pb-5 flex flex-col gap-3">
          {queue.map((d) => {
            const demo = d.kind === "demo";
            return (
              <li key={d.id} className="bg-surface-2 border border-border rounded-[14px] px-[18px] py-4 flex flex-col gap-2.5 min-w-0">
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-2 text-[13px] text-muted-2">
                  <span>
                    {demo ? "Demo for" : "To"} <strong className="text-fg font-medium">{d.business}</strong> · {demo ? d.attach : d.to}
                  </span>
                  <span>
                    {demo ? "Demo built by Claude" : "Drafted by Claude"} · {d.when}
                  </span>
                </div>
                <span className="text-[15px] font-medium">{d.subject}</span>
                <p className="m-0 text-[13px] leading-[1.6] text-muted-2">{d.body}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <button type="button" className={btnPrimary} disabled={busyId === d.id} onClick={() => onApprove(d)}>
                    {busyId === d.id ? "Sending…" : demo ? "Approve and send demo" : "Approve and send"}
                  </button>
                  {demo ? (
                    <Link href={`/admin/outreach/demo/${d.demoId}`} className={btnSecondary}>
                      Open demo <span aria-hidden="true">↗</span>
                    </Link>
                  ) : (
                    <button type="button" className={btnSecondary} onClick={() => onEdit(d)}>
                      Edit draft
                    </button>
                  )}
                  {demo ? (
                    <Link href={`/admin/outreach/demo/${d.demoId}#changes`} className={`${btnSecondary} !text-muted-2`}>
                      Request changes
                    </Link>
                  ) : (
                    <button type="button" className={`${btnSecondary} !text-muted-2`} onClick={() => onSkip(d)}>
                      Skip
                    </button>
                  )}
                  {!demo ? <span className="text-xs text-muted ml-auto">Attach: {d.attach}</span> : null}
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
export function RunTab({ run, runInfo, onReview }) {
  const running = run.status === "running";
  const pct = Math.round((run.step / 5) * 100);
  return (
    <section aria-labelledby="run-h" className="max-w-[760px] bg-surface border border-border rounded-admin px-6 pt-5 pb-6 flex flex-col gap-3.5">
      <div className="flex justify-between items-center gap-3">
        <h2 id="run-h" className="text-[17px] font-medium m-0">
          Today’s run
        </h2>
        <span className="inline-flex items-center gap-2 text-xs text-muted-2">
          <span aria-hidden="true" className="w-[7px] h-[7px] rounded-full bg-success inline-block" />
          Claude Cowork · {runInfo.ranAt}
        </span>
      </div>
      {running ? (
        <div role="status" aria-live="polite" className="flex flex-col gap-2.5 px-4 py-3.5 border border-border rounded-[14px] bg-surface-2">
          <div className="flex justify-between gap-2.5 text-[13px]">
            <span className="font-medium inline-flex items-center gap-2">
              <span aria-hidden="true" className="w-3.5 h-3.5 border-2 border-border-2 border-t-fg rounded-full animate-spin inline-block" />
              Running now · step {run.step} of 5
            </span>
            <span className="text-muted tabular-nums">{pct}%</span>
          </div>
          <div role="progressbar" aria-label="Run progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1 rounded-sm bg-border">
            <div className="h-full rounded-sm bg-fg transition-[width] duration-[400ms]" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[13px] text-muted-2">{runInfo.steps[run.step - 1]}</span>
          <span className="text-xs text-muted">You can leave this page; the run finishes on its own and the queue updates.</span>
        </div>
      ) : null}
      {run.status === "done" ? (
        <div role="status" className="flex flex-col gap-1.5 px-4 py-3.5 border border-border rounded-[14px] bg-surface-2 text-[13px]">
          <span className="font-medium inline-flex items-center gap-2 text-success">
            <Icon name="check" />
            <span className="text-fg">Run finished · {runInfo.finishedAt}</span>
          </span>
          <span className="text-muted-2">{runInfo.summary}</span>
          <button type="button" onClick={onReview} className="bg-transparent border-0 p-0 text-left text-accent-light hover:text-fg cursor-pointer text-[13px] font-[inherit]">
            Review the queue →
          </button>
        </div>
      ) : null}
      <ol className="list-none p-0 m-0 flex flex-col">
        {runInfo.log.map((r, i) => (
          <li key={i} className="flex gap-3 py-2.5 border-t border-border text-[13px]">
            <span className="text-xs text-muted tabular-nums min-w-[42px] pt-0.5">{r.t}</span>
            <span className="text-muted-2 leading-normal">{r.text}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-border">
        <span className="text-xs text-muted">Search brief · edit in Settings</span>
        <span className="text-[13px] text-muted-2">{runInfo.brief}</span>
        <Link href="/admin/settings" className="text-[13px] text-accent-light hover:text-fg min-h-10 inline-flex items-center">
          Outreach settings →
        </Link>
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
    <>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 id="pros-h" className="text-xl font-medium m-0">
          Prospects <span className="text-[13px] text-muted font-normal">{prospects.length} tracked</span>
        </h2>
        <div className="flex flex-wrap gap-2.5 items-center">
          <label htmlFor="pros-search" className="sr-only">
            Search prospects
          </label>
          <input id="pros-search" type="search" placeholder="Search business or area" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-[220px] min-h-10 rounded-[14px] border border-border-2 bg-surface px-3.5 text-[13px] text-fg box-border" />
          <label htmlFor="pros-owner" className="sr-only">
            Filter by owner
          </label>
          <select id="pros-owner" value={owner} onChange={(e) => setOwner(e.target.value)} className="min-h-10 rounded-full border border-border-2 bg-surface px-3.5 text-[13px] text-fg cursor-pointer">
            <option value="All">Everyone</option>
            {OUTREACH_OWNERS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>
      <div role="group" aria-label="Filter by phase" className="flex flex-wrap gap-1.5">
        {["All", ...PHASES].map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={chipBtn(filter === f)}>
            {f}
            <span className={`text-xs tabular-nums ${filter === f ? "opacity-70" : "text-muted"}`}>{f === "All" ? vis.length : vis.filter((p) => p.phase === f).length}</span>
          </button>
        ))}
      </div>

      {state === "loading" ? (
        <div aria-busy="true" aria-label="Loading prospects" className="border border-border rounded-admin overflow-hidden bg-surface">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="grid gap-4 px-5 py-4 items-center border-t border-border first:border-t-0" style={{ gridTemplateColumns: "2fr 1.2fr 1.2fr 1.2fr 1fr 1.4fr 1.4fr .6fr" }}>
              <span className="flex flex-col gap-2">
                <Sk className="h-3" style={{ width: `${45 + ((i * 23) % 35)}%` }} />
                <Sk className="h-2.5" style={{ width: `${60 + ((i * 31) % 30)}%` }} />
              </span>
              <Sk className="h-3 w-[70%]" />
              <Sk className="h-6 w-4/5 rounded-full" />
              <Sk className="h-6 w-4/5 rounded-full" />
              <Sk className="h-3 w-3/5" />
              <Sk className="h-3 w-[85%]" />
              <Sk className="h-3 w-3/4" />
              <Sk className="h-8 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : null}
      {state === "error" ? (
        <div role="alert" className="border border-fg rounded-admin bg-surface px-6 py-10 flex flex-col items-center text-center gap-3">
          <Icon name="alert" size={28} />
          <h3 className="text-lg font-medium m-0">Couldn’t load prospects</h3>
          <p className="m-0 text-[13px] text-muted-2 max-w-[420px] leading-[1.6]">
            <code className="text-xs">GET /api/admin/outreach</code> didn’t answer. Claude’s run log is unaffected. Try again.
          </p>
          <button type="button" className={btnPrimary} onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}
      {state === "empty" ? (
        <div className="border border-dashed border-border-2 rounded-admin bg-surface px-6 py-14 flex flex-col items-center text-center gap-3">
          <span aria-hidden="true" className="w-12 h-12 rounded-full border border-border-2 inline-flex items-center justify-center text-muted-2">
            <Icon name="leads" size={22} />
          </span>
          <h3 className="text-xl font-medium m-0">No prospects yet</h3>
          <p className="m-0 text-[13px] text-muted-2 max-w-[460px] leading-[1.6]">Claude’s first search runs tomorrow at 8:00 against the brief in Settings: [NEIGHBORHOODS], five business types. Run it now if you don’t want to wait, or log someone you already talked to.</p>
          <div className="flex flex-wrap justify-center gap-2.5 mt-1.5">
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
        <TableCard min={1000} foot={!rows.length ? <p className="m-0 px-5 py-8 text-[13px] text-muted text-center">No prospects match. Clear the search or pick another phase.</p> : null}>
          <caption className="sr-only">Prospects and where each one is</caption>
          <thead>
            <tr className="bg-surface-2">
              <th scope="col" className={THFIRST}>Business</th>
              <th scope="col" className={TH}>Website today</th>
              <th scope="col" className={TH}>Suggested offer</th>
              <th scope="col" className={TH}>Phase</th>
              <th scope="col" className={TH}>Owner</th>
              <th scope="col" className={TH}>Last activity</th>
              <th scope="col" className={TH}>Next step</th>
              <th scope="col" className={THLAST}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className={rowCls}>
                <td className={TDFIRST}>
                  <span className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => onOpen(p.id)} className={linkBtn}>
                      {p.business}
                    </button>
                    <span className="text-[13px] text-muted">
                      {p.kind} · {p.area}
                    </span>
                  </span>
                </td>
                <td className={`${TD} text-muted-2 whitespace-nowrap`}>{p.site}</td>
                <td className={`${TD} whitespace-nowrap`}>
                  <span className="text-xs border border-border-2 rounded-full px-2.5 py-1 whitespace-nowrap text-muted-2">{p.offer}</span>
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  <span className={`text-xs border border-border-2 rounded-full px-2.5 py-1 whitespace-nowrap ${PHASE_TEXT[p.phase]}`}>
                    <span aria-hidden="true" className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${PHASE_DOT[p.phase]}`} />
                    {p.phase}
                  </span>
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  <span className="inline-flex items-center gap-2">
                    <Initial owner={p.owner} variant="owner" />
                    {p.owner}
                  </span>
                </td>
                <td className={`${TD} text-muted-2`}>
                  <span className="flex flex-col gap-0.5">
                    <span>{p.last}</span>
                    <span className="text-xs text-muted">{p.lastWhen}</span>
                  </span>
                </td>
                <td className={`${TD} text-muted-2`}>{p.next}</td>
                <td className={TDLAST}>
                  <button type="button" onClick={() => onOpen(p.id)} aria-label={`Open ${p.business}`} className="min-h-9 px-4 rounded-full border border-border-2 bg-transparent text-fg text-[13px] cursor-pointer hover:bg-surface-2">
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      ) : null}
    </>
  );
}

// ---------------- Call list ----------------
export function CallsTab({ calls, contactsWeek, goal, onOpen, onLog, onScript }) {
  return (
    <>
      <Heading
        id="calls-h"
        align="end"
        title="Call list"
        count={`${calls.length} for today`}
        desc="Prospects who replied, asked for a call, or went quiet after the email. Log each call so the week’s contact count stays honest."
        right={
          <span className="text-[13px] text-muted">
            Weekly target {goal[0]}–{goal[1]} contacts · {contactsWeek} so far
          </span>
        }
      />
      <TableCard min={900}>
        <caption className="sr-only">Today’s call list</caption>
        <thead>
          <tr className="bg-surface-2">
            <th scope="col" className={`${THFIRST} pr-5`}>Business</th>
            <th scope="col" className={TH}>Phone</th>
            <th scope="col" className={TH}>Why today</th>
            <th scope="col" className={TH}>Best time</th>
            <th scope="col" className={TH}>Script</th>
            <th scope="col" className={TH}>Who</th>
            <th scope="col" className={THLAST}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {calls.map((c) => (
            <tr key={c.id} className={`${rowCls} ${c.done ? "opacity-[.55]" : ""}`}>
              <td className={TDFIRST}>
                <span className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => onOpen(c.prospect.id)} className={linkBtn}>
                    {c.prospect.business}
                  </button>
                  <span className="text-muted">
                    {c.prospect.kind} · {c.prospect.area}
                  </span>
                </span>
              </td>
              <td className={`${TD} whitespace-nowrap`}>
                <a href="tel:+17045550100" className="text-accent-light">
                  [Phone]
                </a>
              </td>
              <td className={`${TD} text-muted-2`}>{c.why}</td>
              <td className={`${TD} text-muted-2 whitespace-nowrap`}>{c.best}</td>
              <td className={`${TD} whitespace-nowrap`}>
                <button type="button" onClick={onScript} className="bg-transparent border-0 p-0 text-accent-light hover:text-fg cursor-pointer text-[13px] font-[inherit]">
                  {c.scriptTitle}
                </button>
              </td>
              <td className={`${TD} whitespace-nowrap text-muted-2`}>{c.who}</td>
              <td className={TDLAST}>
                {c.done ? (
                  <span className="text-xs text-success border border-border-2 rounded-full px-2.5 py-1">Logged</span>
                ) : (
                  <button type="button" className={btnSmSecondary} onClick={() => onLog(c)}>
                    Log call
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </>
  );
}

// ---------------- Scripts ----------------
export function ScriptsTab({ scripts, onCopy }) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h2 id="scripts-h" className="text-xl font-medium m-0">
          Scripts
        </h2>
        <span className="text-[13px] text-muted-2">Talk tracks for calls and visits. Claude keeps the email versions in Settings → Templates; these are for people. Say “we”.</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {scripts.map((sc, i) => (
          <details key={sc.id} open={i === 0} className="bg-surface border border-border rounded-admin px-5 group">
            <summary className="flex items-center justify-between gap-3 min-h-[52px] cursor-pointer list-none text-sm font-medium">
              <span>
                {sc.title} <span className="text-xs text-muted font-normal">· {sc.length}</span>
              </span>
              <span aria-hidden="true" className="text-muted group-open:rotate-180 transition-transform">
                ▾
              </span>
            </summary>
            <div className="pb-[18px] flex flex-col gap-2.5 text-[13px] leading-[1.7] text-muted-2">
              {sc.lines.map((l) => (
                <p key={l.k} className="m-0">
                  <strong className="font-medium text-fg">{l.k}</strong> {l.t}
                </p>
              ))}
              <div className="flex gap-2 pt-1">
                <button type="button" className={btnSmSecondary} onClick={() => onCopy(sc)}>
                  Copy
                </button>
                <Link href="/admin/settings" className={btnSmSecondary}>
                  Edit in Settings
                </Link>
              </div>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}

// ---------------- Partners ----------------
export function PartnersTab({ partners, onAdd, onTouch }) {
  return (
    <>
      <Heading
        id="partners-h"
        align="end"
        title="Referral partners"
        count={partners.length}
        desc="People who meet small-business owners before we do. One touch a month each; a referral that signs earns the thank-you in Settings."
        right={
          <button type="button" className={btnSecondary} onClick={onAdd}>
            Add partner
          </button>
        }
      />
      <TableCard min={900}>
        <caption className="sr-only">Referral partners</caption>
        <thead>
          <tr className="bg-surface-2">
            <th scope="col" className={`${THFIRST} pr-5`}>Partner</th>
            <th scope="col" className={TH}>Type</th>
            <th scope="col" className={TH}>Contact</th>
            <th scope="col" className={TH}>Last touch</th>
            <th scope="col" className={`${TH} !text-right`}>Referrals</th>
            <th scope="col" className={`${TH} !text-right`}>Signed</th>
            <th scope="col" className={TH}>Owner</th>
            <th scope="col" className={THLAST}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {partners.map((pt) => (
            <tr key={pt.id} className={rowCls}>
              <td className={`${TDFIRST} font-medium`}>{pt.name}</td>
              <td className={`${TD} text-muted-2 whitespace-nowrap`}>{pt.type}</td>
              <td className={`${TD} whitespace-nowrap`}>
                <a href="mailto:partner@example.com" className="text-accent-light">
                  [email]
                </a>{" "}
                ·{" "}
                <a href="tel:+17045550100" className="text-accent-light">
                  [Phone]
                </a>
              </td>
              <td className={`${TD} whitespace-nowrap ${pt.overdue ? "text-warning" : "text-muted-2"}`}>
                {pt.last}
                {pt.overdue ? " · overdue" : ""}
              </td>
              <td className={`${TD} text-right tabular-nums`}>{pt.referrals}</td>
              <td className={`${TD} text-right tabular-nums`}>{pt.signed}</td>
              <td className={`${TD} whitespace-nowrap text-muted-2`}>{pt.owner}</td>
              <td className={TDLAST}>
                <button type="button" className={btnSmSecondary} onClick={() => onTouch(pt)}>
                  Log touch
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <p className="text-[13px] text-muted m-0">Overdue (no touch in 30 days) shows in the status color and says so. Partners are not prospects: they never get Claude’s cold emails.</p>
    </>
  );
}
