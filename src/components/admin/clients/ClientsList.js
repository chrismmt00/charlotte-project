"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { PageHead, Chip, Empty, Skeleton, btnPrimary, btnSecondary, money } from "@/components/admin/ui";
import { STAGE_TONE } from "@/lib/admin/sample-clients";
import { AlertIcon, DevStateSwitch, api } from "./kit";

const STAGES = ["In build", "Demo review", "Live", "Paused"];
const SEL_KEY = "klyvora-clients-selected";
const SEL_EVENT = "klyvora-clients-selected-change";

// The row you came back from keeps an accent bar (set when you open a client).
function readSel() {
  try {
    return sessionStorage.getItem(SEL_KEY) || "";
  } catch {
    return "";
  }
}
function subSel(cb) {
  window.addEventListener(SEL_EVENT, cb);
  return () => window.removeEventListener(SEL_EVENT, cb);
}
function setSel(id) {
  try {
    sessionStorage.setItem(SEL_KEY, id);
  } catch {}
  window.dispatchEvent(new Event(SEL_EVENT));
}

function Total({ label, value, note }) {
  return (
    <div className="bg-surface border border-border rounded-admin px-5 py-4 flex flex-col gap-1.5 min-w-0">
      <span className="text-[13px] text-muted-2">{label}</span>
      <span className="flex items-baseline gap-2.5 flex-wrap">
        <span className="text-[28px] font-medium leading-none tabular-nums">{value}</span>
        <span className="text-[13px] text-muted-2">{note}</span>
      </span>
    </div>
  );
}

export default function ClientsList() {
  const [clients, setClients] = useState(null); // null while loading
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All");
  const [force, setForce] = useState("auto");
  const selected = useSyncExternalStore(subSel, readSel, () => "");

  useEffect(() => {
    let alive = true;
    api("/api/admin/clients")
      .then((d) => {
        if (!alive) return;
        setClients(d.clients);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setFailed(false);
    setClients(null);
    setForce("auto");
    setAttempt((n) => n + 1);
  }, []);

  const mode = force !== "auto" ? force : failed ? "error" : clients === null ? "loading" : clients.length === 0 ? "empty" : "live";
  const all = clients || [];

  const q = query.trim().toLowerCase();
  const matching = all.filter((c) => !q || `${c.business} ${c.contact}`.toLowerCase().includes(q));
  const rows = matching.filter((c) => stage === "All" || c.stage === stage);
  const onPlan = all.filter((c) => c.monthly.on);
  const mrr = all.reduce((t, c) => t + c.mrr, 0);

  return (
    <>
      <PageHead eyebrow={`Clients · ${all.length} active`} title="Clients">
        <DevStateSwitch value={force} onChange={setForce} options={["auto", "live", "loading", "empty", "error"]} />
        <Link href="/admin/leads" className={btnSecondary}>
          Signed leads become clients
        </Link>
      </PageHead>

      <section aria-label="Totals" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4 mb-4">
        <Total label="On a monthly plan" value={onPlan.length} note={`${money(mrr)}/mo recurring`} />
        <Total label="Self-managed" value={all.length - onPlan.length} note="took the code, no monthly" />
        <Total label="In build" value={all.filter((c) => c.stage !== "Live").length} note="not yet launched" />
        <Total label="Live" value={all.filter((c) => c.stage === "Live").length} note="accepted launch" />
      </section>

      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <label htmlFor="cl-search" className="sr-only">
          Search clients
        </label>
        <input
          id="cl-search"
          type="search"
          placeholder="Search business or contact"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-[1_1_240px] min-w-0 min-h-10 rounded-input border border-border-2 bg-surface text-fg px-3.5 text-[13px]"
        />
        <div role="group" aria-label="Filter by stage" className="flex flex-wrap gap-1.5">
          {["All", ...STAGES].map((f) => {
            const on = stage === f;
            const n = f === "All" ? matching.length : matching.filter((c) => c.stage === f).length;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => setStage(f)}
                className={`min-h-9 px-3.5 rounded-full border text-[13px] inline-flex items-center gap-2 cursor-pointer ${on ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2 hover:text-fg"}`}
              >
                {f} <span className={`text-xs tabular-nums ${on ? "opacity-70" : "text-muted-2"}`}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {mode === "loading" ? (
        <div aria-busy="true" aria-label="Loading clients" className="border border-border rounded-admin overflow-hidden bg-surface">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="grid grid-cols-[2fr_1.4fr_1fr_1.4fr_1.6fr_.8fr_.9fr] gap-4 items-center px-5 py-4 border-t border-border first:border-t-0 max-lg:grid-cols-[2fr_1fr_1fr]">
              <span className="flex flex-col gap-2">
                <Skeleton className={`h-3.5 ${["w-1/2", "w-2/3", "w-3/5", "w-1/2", "w-2/3"][i]}`} />
                <Skeleton className="h-2.5 w-3/4" />
              </span>
              <Skeleton className="h-6 w-4/5 !rounded-full" />
              <Skeleton className="h-6 w-3/5 !rounded-full" />
              <Skeleton className="h-3.5 w-4/5 max-lg:hidden" />
              <Skeleton className="h-3.5 w-3/5 max-lg:hidden" />
              <Skeleton className="h-3.5 w-1/2 max-lg:hidden" />
              <Skeleton className="h-3.5 w-1/2 max-lg:hidden" />
            </div>
          ))}
        </div>
      ) : null}

      {mode === "error" ? (
        <div role="alert" className="border border-fg rounded-admin bg-surface px-6 py-10 flex flex-col items-center text-center gap-3">
          <AlertIcon size={28} />
          <h2 className="text-[18px] font-medium m-0">Couldn’t load clients</h2>
          <p className="m-0 text-[13px] text-muted-2 max-w-[420px] leading-relaxed">
            <code className="text-xs">GET /api/admin/clients</code> returned 500. Stripe totals may be stale until this loads. Try again.
          </p>
          <button type="button" onClick={retry} className={btnPrimary}>
            Retry
          </button>
        </div>
      ) : null}

      {mode === "empty" ? (
        <Empty
          title="No clients yet"
          action={
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link href="/admin/leads" className={btnPrimary}>
                Open Leads
              </Link>
              <Link href="/founding" className={btnSecondary}>
                Founding offer <span aria-hidden="true">↗</span>
              </Link>
            </div>
          }
        >
          A client appears here the moment a lead is marked Signed and converted. The first one is the hardest; the founding-client offer is built for it.
        </Empty>
      ) : null}

      {mode === "live" ? (
        <div className="bg-surface border border-border rounded-admin overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-[13px]">
              <caption className="sr-only">Clients</caption>
              <thead>
                <tr className="bg-surface-2 text-left text-muted-2">
                  {["Client", "Offer", "Stage", "Monthly plan", "Next milestone", "Owner"].map((h) => (
                    <th key={h} scope="col" className="font-medium px-4 py-3 first:pl-5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th scope="col" className="font-medium px-4 py-3 text-right whitespace-nowrap">
                    MRR
                  </th>
                  <th scope="col" className="font-medium px-4 py-3 pr-5 text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const on = selected === c.id;
                  return (
                    <tr key={c.id} aria-selected={on} className={`border-t border-border hover:bg-surface-2 ${on ? "bg-surface-2 shadow-[inset_3px_0_0_var(--accent-light)]" : ""}`}>
                      <td className="px-4 py-3 pl-5">
                        <span className="flex flex-col gap-0.5">
                          <Link href={`/admin/clients/${c.id}`} onClick={() => setSel(c.id)} className="font-medium text-fg hover:underline">
                            {c.business}
                          </Link>
                          <span className="text-muted-2">
                            {c.contact} · since {c.since}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Chip>{c.offer}</Chip>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Chip tone={STAGE_TONE[c.stage]}>{c.stage}</Chip>
                      </td>
                      <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{c.plan}</td>
                      <td className="px-4 py-3 text-muted-2">{c.next}</td>
                      <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{c.owner}</td>
                      <td className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${c.mrr ? "" : "text-muted-2"}`}>{c.mrr ? money(c.mrr) : "—"}</td>
                      <td className="px-4 py-3 pr-5 text-right whitespace-nowrap">
                        <Link href={`/admin/clients/${c.id}`} onClick={() => setSel(c.id)} aria-label={`Open ${c.business}`} className={btnSecondary}>
                          Open
                        </Link>{" "}
                        <Link href="/portal" aria-label={`Open portal for ${c.business}`} className={`${btnSecondary} !border-0`}>
                          Portal <span aria-hidden="true">↗</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? <p className="m-0 px-5 py-8 text-[13px] text-muted-2 text-center">No clients match. Clear the search or pick another stage.</p> : null}
        </div>
      ) : null}

      <p className="text-[13px] text-muted-2 mt-4 mb-0">
        A client row is created when a lead is marked Signed. “Monthly plan” is optional on everything but restaurants; self-managed clients took the code and pay nothing monthly.
      </p>
    </>
  );
}
