"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { btnPrimary, btnSecondary } from "@/components/admin/ui";
import { DevStateSwitch, EmptyCard, ErrorCard, FilterChip, Skel, Toast, TitleBlock, api, btnS, tdCls, thCls, trCls, useToast } from "@/components/admin/clients/kit";
import { PROPOSAL_STATUSES, usd } from "@/components/proposal/model";
import ProposalBuilder, { StatusChip, newDraft, totalsOf } from "./ProposalBuilder";

// Board: surface-2 tile, radius 16, padding 18 20, value 32/500.
function Total({ label, value, note }) {
  return (
    <div className="bg-surface-2 border border-border rounded-admin px-5 py-[18px] box-border flex flex-col gap-1.5 min-w-0">
      <span className="text-[13px] text-muted-2">{label}</span>
      <span className="flex flex-wrap items-baseline gap-2.5">
        <span className="text-[32px] font-medium leading-none tabular-nums">{value}</span>
        <span className="text-[13px] text-muted">{note}</span>
      </span>
    </div>
  );
}

// route: { view: "list" } | { view: "builder", id } | { view: "builder", fresh: true, leadId }
export default function ProposalsApp({ initialRoute }) {
  const [proposals, setProposals] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [route, setRoute] = useState(initialRoute);
  const [filter, setFilter] = useState("All");
  const [force, setForce] = useState("auto");
  const [toast, showToast] = useToast();

  useEffect(() => {
    let alive = true;
    api("/api/admin/proposals")
      .then((d) => {
        if (!alive) return;
        setProposals(d.proposals);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setFailed(false);
    setProposals(null);
    setForce("auto");
    setAttempt((n) => n + 1);
  }, []);

  const all = proposals || [];
  const mode = force !== "auto" ? force : failed ? "error" : proposals === null ? "loading" : proposals.length === 0 ? "empty" : "live";

  const patch = (id, fields) => setProposals((list) => (list || []).map((x) => (x.id === id ? { ...x, ...fields } : x)));
  const upsert = (p) => setProposals((list) => ((list || []).some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? { ...x, ...p } : x)) : [p, ...(list || [])]));
  const newProposal = () => setRoute({ view: "builder", fresh: true, leadId: "" });

  if (route.view === "builder") {
    const found = route.fresh ? null : all.find((x) => x.id === route.id);
    if (!route.fresh && !found) {
      if (failed) {
        return (
          <ErrorCard title="Couldn’t load that proposal" onRetry={retry}>
            Nothing was changed. Try again, or go back to all proposals.
          </ErrorCard>
        );
      }
      return proposals === null ? (
        <div aria-busy="true" aria-label="Loading proposal" className="flex flex-col gap-5">
          <Skel className="h-10 w-80" />
          <Skel className="h-64 w-full" />
        </div>
      ) : (
        <EmptyCard
          title="No proposal with that id"
          actions={
            <button type="button" onClick={() => setRoute({ view: "list" })} className={btnPrimary}>
              All proposals
            </button>
          }
        >
          It may have been removed. Go back to the list to pick another.
        </EmptyCard>
      );
    }
    return (
      <ProposalBuilder
        key={route.fresh ? `new-${route.leadId || ""}` : route.id}
        initial={found || newDraft(route.leadId)}
        onBack={() => setRoute({ view: "list" })}
        onSaved={(p) => {
          upsert(p);
          if (route.fresh) setRoute({ view: "builder", id: p.id });
        }}
        onStatus={(id, status) => patch(id, { status, sentNote: status === "Sent" ? "sent just now · not opened · expires in 14d" : status === "Accepted" ? "signed [date]" : status === "Declined" ? "declined [date]" : undefined })}
      />
    );
  }

  const rows = all.filter((x) => filter === "All" || x.status === filter);
  const out = all.filter((x) => x.status === "Sent" || x.status === "Viewed");
  const acc = all.filter((x) => x.status === "Accepted");
  const sum = (list) => list.reduce((t, x) => t + totalsOf(x).build, 0);

  async function copyLink(p) {
    const url = `klyvora.ai/p/${p.token}`;
    try {
      await navigator.clipboard.writeText(`https://${url}`);
      showToast(`Link copied · ${url}`);
    } catch {
      showToast(`Copy this link: ${url}`);
    }
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted">
        <Link href="/admin/leads" className="text-muted-2 hover:text-fg">
          Leads
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-fg">
          Proposals
        </span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <TitleBlock eyebrow={`Proposals · ${all.length} total`} title="Proposals" />
        <div className="flex flex-wrap items-center gap-2">
          <DevStateSwitch value={force} onChange={setForce} options={["auto", "live", "loading", "empty", "error"]} />
          <Link href="/admin/settings?tab=templates" className={btnSecondary}>
            Templates
          </Link>
          <button type="button" onClick={newProposal} className={btnPrimary}>
            New proposal
          </button>
        </div>
      </header>

      <section aria-label="Totals" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <Total label="Out for signature" value={out.length} note={`${usd(sum(out))} in builds`} />
        <Total label="Accepted this month" value={acc.length} note={`${usd(sum(acc))} · counts toward $20,000 signed`} />
        <Total label="Acceptance rate" value="[x]%" note="last 90 days · needs 10+ sent" />
        <Total label="Days to sign" value="[x]" note="median · follow up at day 3" />
      </section>

      <div role="group" aria-label="Filter proposals" className="flex flex-wrap gap-1.5">
        {["All", ...PROPOSAL_STATUSES].map((f) => (
          <FilterChip key={f} label={f} on={filter === f} onClick={() => setFilter(f)} count={f === "All" ? all.length : all.filter((x) => x.status === f).length} />
        ))}
      </div>

      {mode === "loading" ? (
        <div aria-busy="true" aria-label="Loading proposals" className="border border-border rounded-admin overflow-hidden bg-surface">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="grid grid-cols-[2.4fr_1.4fr_1fr_1fr_1.8fr] max-md:grid-cols-[2fr_1fr] gap-4 items-center px-5 py-4 border-t border-border first:border-t-0">
              <span className="flex flex-col gap-2">
                <Skel className={`h-3 ${["w-3/4", "w-2/3", "w-4/5", "w-3/5", "w-2/3"][i]}`} />
                <Skel className="h-2.5 w-1/3" />
              </span>
              <Skel className="h-6 w-3/5 !rounded-full" />
              <Skel className="h-3 w-1/2 max-md:hidden" />
              <Skel className="h-3 w-1/2 max-md:hidden" />
              <Skel className="h-3 w-4/5 max-md:hidden" />
            </div>
          ))}
        </div>
      ) : null}

      {mode === "error" ? (
        <ErrorCard title="Couldn’t load proposals" onRetry={retry}>
          <code className="font-mono text-xs">GET /api/admin/proposals</code> returned 500. Nothing was changed. Try again.
        </ErrorCard>
      ) : null}

      {mode === "empty" ? (
        <EmptyCard
          title="No proposals yet"
          actions={
            <>
              <button type="button" onClick={newProposal} className={btnPrimary}>
                New proposal
              </button>
              <Link href="/admin/leads" className={btnSecondary}>
                Open Leads
              </Link>
            </>
          }
        >
          A proposal is the price page for one lead: offer, scope, 50 / 30 / 20 schedule, the optional monthly, and a signature box. Start one from a lead, or here.
        </EmptyCard>
      ) : null}

      {mode === "live" ? (
        <div className="bg-surface border border-border rounded-admin overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-[13px]">
              <caption className="sr-only">Proposals</caption>
              <thead>
                <tr className="bg-surface-2">
                  {[
                    ["Proposal", ""],
                    ["For", ""],
                    ["Offer", ""],
                    ["Build", "!text-right"],
                    ["Monthly", "!text-right"],
                    ["Status", ""],
                    ["Sent · expires", ""],
                  ].map(([h, c]) => (
                    <th key={h} scope="col" className={`${thCls} ${c}`}>
                      {h}
                    </th>
                  ))}
                  <th scope="col" className={`${thCls} !text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x) => {
                  const t = totalsOf(x);
                  return (
                    <tr key={x.id} className={trCls}>
                      <td className={tdCls}>
                        <button type="button" onClick={() => setRoute({ view: "builder", id: x.id })} className="bg-transparent border-0 p-0 font-[inherit] text-[13px] text-fg font-medium text-left cursor-pointer">
                          {x.id} · {x.name}
                        </button>
                      </td>
                      <td className={tdCls}>
                        <Link href={x.leadId ? "/admin/leads" : "/admin/clients"} className="text-fg">
                          {x.business}
                        </Link>
                      </td>
                      <td className={`${tdCls} text-muted-2 whitespace-nowrap`}>{x.offerCode}</td>
                      <td className={`${tdCls} text-right tabular-nums whitespace-nowrap`}>
                        {t.buildFrom ? "from " : ""}
                        {usd(t.build)}
                      </td>
                      <td className={`${tdCls} text-right tabular-nums whitespace-nowrap text-muted-2`}>{t.monthlyOn ? `${usd(t.monthlyAmount)}/mo` : "—"}</td>
                      <td className={`${tdCls} whitespace-nowrap`}>
                        <StatusChip status={x.status} />
                      </td>
                      <td className={`${tdCls} text-muted-2 whitespace-nowrap`}>{x.sentNote}</td>
                      <td className={`${tdCls} text-right whitespace-nowrap`}>
                        <span className="inline-flex gap-2">
                          {x.status === "Draft" ? (
                            <button type="button" onClick={() => setRoute({ view: "builder", id: x.id })} className={btnS}>
                              Send
                            </button>
                          ) : (
                            <button type="button" onClick={() => copyLink(x)} className={btnS}>
                              Copy link
                            </button>
                          )}
                          <button type="button" onClick={() => setRoute({ view: "builder", id: x.id })} aria-label={`Open ${x.id}`} className={btnS}>
                            Open
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? <p className="m-0 px-5 py-8 text-[13px] text-muted text-center">Nothing with that status.</p> : null}
        </div>
      ) : null}

      <p className="text-[13px] text-muted m-0">
        Statuses: Draft → Sent → Viewed → Accepted (lead becomes a client, kickoff invoice goes out) or Declined / Expired after 14 days. Prices come from the catalog in Settings; a proposal freezes them for that client.
      </p>
      <Toast toast={toast} />
    </>
  );
}
