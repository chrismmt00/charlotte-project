"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHead, Chip, Empty, Skeleton, btnPrimary, btnSecondary, btnGhost } from "@/components/admin/ui";
import { AlertIcon, DevStateSwitch, Toast, api, useToast } from "@/components/admin/clients/kit";
import { PROPOSAL_STATUSES, PROPOSAL_TONE, usd } from "@/components/proposal/model";
import ProposalBuilder, { newDraft, totalsOf } from "./ProposalBuilder";

function Total({ label, value, note }) {
  return (
    <div className="bg-surface border border-border rounded-admin px-5 py-4 flex flex-col gap-1.5 min-w-0">
      <span className="text-[13px] text-muted-2">{label}</span>
      <span className="text-[28px] font-medium leading-none tabular-nums">{value}</span>
      <span className="text-[13px] text-muted-2">{note}</span>
    </div>
  );
}

// route: { view: "list" } | { view: "builder", id } | { view: "builder", fresh: true, leadId }
export default function ProposalsApp({ initialRoute }) {
  const [proposals, setProposals] = useState(null);
  const [leads, setLeads] = useState([]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [route, setRoute] = useState(initialRoute);
  const [filter, setFilter] = useState("All");
  const [force, setForce] = useState("auto");
  const [toast, showToast] = useToast();

  useEffect(() => {
    let alive = true;
    Promise.all([api("/api/admin/proposals"), api("/api/admin/leads")])
      .then(([d, leadData]) => {
        setLeads(leadData.leads);
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

  if (route.view === "builder") {
    const found = route.fresh ? null : all.find((x) => x.id === route.id);
    if (!route.fresh && !found) {
      if (failed) {
        return (
          <div role="alert" className="border border-fg rounded-admin bg-surface px-6 py-10 text-center flex flex-col items-center gap-3">
            <AlertIcon size={28} />
            <h2 className="text-[18px] font-medium m-0">Couldn’t load that proposal</h2>
            <div className="flex gap-2">
              <button type="button" onClick={retry} className={btnPrimary}>
                Retry
              </button>
              <button type="button" onClick={() => setRoute({ view: "list" })} className={btnSecondary}>
                All proposals
              </button>
            </div>
          </div>
        );
      }
      return proposals === null ? (
        <div aria-busy="true" aria-label="Loading proposal" className="flex flex-col gap-4">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Empty title="No proposal with that id" action={<button type="button" onClick={() => setRoute({ view: "list" })} className={btnPrimary}>All proposals</button>} />
      );
    }
    return (
      <ProposalBuilder
        key={route.fresh ? `new-${route.leadId || ""}` : route.id}
        initial={found || newDraft(route.leadId, leads)}
        leads={leads}
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
      <PageHead eyebrow={`Proposals · ${all.length} total`} title="Proposals">
        <DevStateSwitch value={force} onChange={setForce} options={["auto", "live", "loading", "empty", "error"]} />
        <Link href="/admin/settings?tab=templates" className={btnSecondary}>
          Templates
        </Link>
        <button type="button" onClick={() => setRoute({ view: "builder", fresh: true, leadId: "" })} className={btnPrimary}>
          New proposal
        </button>
      </PageHead>

      <section aria-label="Totals" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-4">
        <Total label="Out for signature" value={out.length} note={`${usd(sum(out))} in builds`} />
        <Total label="Accepted this month" value={acc.length} note={`${usd(sum(acc))} · counts toward $20,000 signed`} />
        <Total label="Acceptance rate" value="[x]%" note="last 90 days · needs 10+ sent" />
        <Total label="Days to sign" value="[x]" note="median · follow up at day 3" />
      </section>

      <div role="group" aria-label="Filter proposals" className="flex flex-wrap gap-1.5 mb-4">
        {["All", ...PROPOSAL_STATUSES].map((f) => {
          const on = filter === f;
          const n = f === "All" ? all.length : all.filter((x) => x.status === f).length;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f)}
              className={`min-h-9 px-3.5 rounded-full border text-[13px] inline-flex items-center gap-2 cursor-pointer ${on ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2 hover:text-fg"}`}
            >
              {f} <span className={`text-xs tabular-nums ${on ? "opacity-70" : "text-muted-2"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {mode === "loading" ? (
        <div aria-busy="true" aria-label="Loading proposals" className="border border-border rounded-admin overflow-hidden bg-surface">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="grid grid-cols-[2.4fr_1.4fr_1fr_1fr_1.8fr] max-md:grid-cols-[2fr_1fr] gap-4 items-center px-5 py-4 border-t border-border first:border-t-0">
              <span className="flex flex-col gap-2">
                <Skeleton className={`h-3.5 ${["w-3/4", "w-2/3", "w-4/5", "w-3/5", "w-2/3"][i]}`} />
                <Skeleton className="h-2.5 w-1/3" />
              </span>
              <Skeleton className="h-6 w-3/5 !rounded-full" />
              <Skeleton className="h-3.5 w-1/2 max-md:hidden" />
              <Skeleton className="h-3.5 w-1/2 max-md:hidden" />
              <Skeleton className="h-3.5 w-4/5 max-md:hidden" />
            </div>
          ))}
        </div>
      ) : null}

      {mode === "error" ? (
        <div role="alert" className="border border-fg rounded-admin bg-surface px-6 py-10 flex flex-col items-center text-center gap-3">
          <AlertIcon size={28} />
          <h2 className="text-[18px] font-medium m-0">Couldn’t load proposals</h2>
          <p className="m-0 text-[13px] text-muted-2 max-w-[420px] leading-relaxed">
            <code className="text-xs">GET /api/admin/proposals</code> returned 500. Nothing was changed. Try again.
          </p>
          <button type="button" onClick={retry} className={btnPrimary}>
            Retry
          </button>
        </div>
      ) : null}

      {mode === "empty" ? (
        <Empty
          title="No proposals yet"
          action={
            <div className="flex flex-wrap justify-center gap-2.5">
              <button type="button" onClick={() => setRoute({ view: "builder", fresh: true, leadId: "" })} className={btnPrimary}>
                New proposal
              </button>
              <Link href="/admin/leads" className={btnSecondary}>
                Open Leads
              </Link>
            </div>
          }
        >
          A proposal is the price page for one lead: offer, scope, 50 / 30 / 20 schedule, the optional monthly, and a signature box. Start one from a lead, or here.
        </Empty>
      ) : null}

      {mode === "live" ? (
        <div className="bg-surface border border-border rounded-admin overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-[13px]">
              <caption className="sr-only">Proposals</caption>
              <thead>
                <tr className="bg-surface-2 text-left text-muted-2">
                  {["Proposal", "For", "Offer", "Build", "Monthly", "Status", "Sent · expires", "Actions"].map((h) => (
                    <th key={h} scope="col" className={`font-medium px-4 py-3 whitespace-nowrap first:pl-5 ${h === "Actions" ? "text-right pr-5" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((x) => {
                  const t = totalsOf(x);
                  return (
                    <tr key={x.id} className="border-t border-border hover:bg-surface-2">
                      <td className="px-4 py-3 pl-5">
                        <button type="button" onClick={() => setRoute({ view: "builder", id: x.id })} className="bg-transparent border-0 p-0 text-left text-fg font-medium hover:underline cursor-pointer text-[13px]">
                          {x.id} · {x.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={x.leadId ? "/admin/leads" : "/admin/clients"} className="text-accent-light hover:text-fg">
                          {x.business}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-2">{x.offerCode}</td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                        {t.buildFrom ? "from " : ""}
                        {usd(t.build)}
                      </td>
                      <td className="px-4 py-3 text-muted-2 tabular-nums whitespace-nowrap">{t.monthlyOn ? `${usd(t.monthlyAmount)}/mo` : "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Chip tone={PROPOSAL_TONE[x.status]}>{x.status}</Chip>
                      </td>
                      <td className="px-4 py-3 text-muted-2">{x.sentNote}</td>
                      <td className="px-4 py-3 pr-5 text-right whitespace-nowrap">
                        {x.status === "Draft" ? (
                          <button type="button" onClick={() => setRoute({ view: "builder", id: x.id })} className={btnSecondary}>
                            Send
                          </button>
                        ) : (
                          <button type="button" onClick={() => copyLink(x)} className={btnGhost}>
                            Copy link
                          </button>
                        )}{" "}
                        <button type="button" onClick={() => setRoute({ view: "builder", id: x.id })} aria-label={`Open ${x.id}`} className={btnSecondary}>
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? <p className="m-0 px-5 py-8 text-[13px] text-muted-2 text-center">Nothing with that status.</p> : null}
        </div>
      ) : null}

      <p className="text-[13px] text-muted-2 mt-4 mb-0">
        Statuses: Draft → Sent → Viewed → Accepted (lead becomes a client, kickoff invoice goes out) or Declined / Expired after 14 days. Prices come from the catalog in Settings; a proposal freezes them for that client.
      </p>
      <Toast toast={toast} />
    </>
  );
}
