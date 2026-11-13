"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PageHead, Chip, Skeleton, btnPrimary, btnSecondary, money } from "@/components/admin/ui";
import { RANGES } from "@/lib/admin/sample-reports";
import Dialog from "@/components/admin/settings/Dialog";
import Toast, { useToast } from "@/components/admin/settings/Toast";
import { SignedChart, MrrChart, Funnel, OutreachChart, DataTable, Legend } from "./Charts";

const DEV = process.env.NODE_ENV !== "production";
const dateInput =
  "min-h-10 w-[150px] rounded-[12px] border bg-surface-2 text-fg px-3 text-[13px] box-border font-[inherit]";

function pct(v, t) {
  return Math.round((v / t) * 100);
}

function Tile({ label, value, note, loading }) {
  return (
    <div className="bg-surface-2 border border-border rounded-admin px-5 py-[18px] flex flex-col gap-1.5 min-w-0">
      <span className="text-[12px] text-muted-2">{label}</span>
      {loading ? (
        <Skeleton className="h-7 w-28 rounded-md!" />
      ) : (
        <span className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[28px] font-medium leading-none tabular-nums">{value}</span>
          <span className="text-[12px] text-muted-2">{note}</span>
        </span>
      )}
    </div>
  );
}

function ChartCard({ title, sub, loading, legend, table, children }) {
  return (
    <section aria-label={title} className="bg-surface border border-border rounded-admin px-5 py-[18px] flex flex-col gap-3.5 min-w-0">
      <div className="flex flex-wrap justify-between items-baseline gap-3">
        <h2 className="text-[15px] font-medium m-0">{title}</h2>
        <span className="text-[12px] text-muted">{sub}</span>
      </div>
      {loading ? <Skeleton className="h-[180px] rounded-[12px]!" /> : children}
      {legend}
      {!loading && table ? table : null}
    </section>
  );
}

function ErrorCard({ onRetry }) {
  return (
    <div role="alert" className="border border-fg rounded-admin bg-surface p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="flex-none">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium">We couldn&rsquo;t load the reports.</div>
        <p className="text-[13px] text-muted-2 m-0 mt-1">Nothing is lost; the numbers come from proposals, invoices and the outreach log. Try again in a moment.</p>
      </div>
      <button type="button" className={btnSecondary} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function ExportDialog({ query, label, onClose, onDone }) {
  const [sections, setSections] = useState({ months: true, pipeline: true, outreach: false });
  const [status, setStatus] = useState("idle"); // idle | invalid | submitting | failed
  const toggle = (k) => () => {
    setSections((s) => ({ ...s, [k]: !s[k] }));
    if (status === "invalid") setStatus("idle");
  };
  const picked = Object.keys(sections).filter((k) => sections[k]);

  async function download() {
    if (!picked.length) {
      setStatus("invalid");
      return;
    }
    setStatus("submitting");
    const params = new URLSearchParams(query);
    params.set("sections", picked.join(","));
    try {
      const res = await fetch(`/api/admin/reports/export?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") || "")?.[1] || "reports.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      onDone(`${name} downloaded`);
    } catch {
      setStatus("failed");
    }
  }

  const busy = status === "submitting";
  const box = "accent-[var(--accent)] flex-none";
  return (
    <Dialog
      eyebrow="Reports"
      title={`Export ${label}`}
      size="sm"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={download} disabled={busy} aria-busy={busy}>
            {busy ? (
              <>
                <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full border-2 border-current border-r-transparent animate-spin motion-reduce:animate-none" />
                Preparing…
              </>
            ) : (
              "Download CSV"
            )}
          </button>
        </>
      }
    >
      {status === "failed" ? (
        <div role="alert" className="flex gap-2.5 items-start p-3 rounded-[12px] border border-danger bg-danger/10 text-[13px]">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-danger flex-none mt-0.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          The export didn&rsquo;t download. Check your connection and try again.
        </div>
      ) : null}
      <fieldset className="border-0 p-0 m-0 flex flex-col gap-2" aria-describedby={status === "invalid" ? "ex-err" : undefined}>
        <legend className="text-[12px] text-muted-2 mb-1.5">What</legend>
        {[
          ["months", "Signed, cash and recurring by month"],
          ["pipeline", "Pipeline by stage"],
          ["outreach", "Outreach contacts by week"],
        ].map(([k, l]) => (
          <label key={k} className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] border border-border-2 cursor-pointer">
            <input type="checkbox" className={box} checked={sections[k]} onChange={toggle(k)} disabled={busy} data-autofocus={k === "months" ? true : undefined} />
            {l}
          </label>
        ))}
      </fieldset>
      {status === "invalid" ? (
        <p id="ex-err" role="alert" className="m-0 text-[12px] text-danger">
          Pick at least one section.
        </p>
      ) : null}
      <p className="m-0 text-[12px] text-muted leading-normal">CSV, one block per section. Prospects who opted out are left out of the outreach numbers.</p>
    </Dialog>
  );
}

export default function ReportsView({ initial }) {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState("live"); // live | loading | error
  const [query, setQuery] = useState({ range: initial.range });
  const [dates, setDates] = useState({ from: "", to: "" });
  const [dateError, setDateError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [forced, setForced] = useState(null); // dev-only state preview
  const [toast, showToast] = useToast();
  const req = useRef(0);

  async function load(q) {
    const n = ++req.current;
    setQuery(q);
    setStatus("loading");
    try {
      const res = await fetch(`/api/admin/reports?${new URLSearchParams(q)}`);
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      if (n !== req.current) return;
      setData(json);
      setStatus("live");
    } catch {
      if (n === req.current) setStatus("error");
    }
  }

  function pickRange(key) {
    setDates({ from: "", to: "" });
    setDateError("");
    load({ range: key });
  }

  function onDate(k, value) {
    const next = { ...dates, [k]: value };
    setDates(next);
    if (!next.from || !next.to) {
      setDateError("");
      return;
    }
    if (next.from > next.to) {
      setDateError("The start date is after the end date.");
      return;
    }
    setDateError("");
    load({ from: next.from, to: next.to });
  }

  const view = forced || (status === "live" && data.empty ? "empty" : status);
  const loading = view === "loading";
  const t = data.tiles;
  const tg = data.targets;
  const label = data.label;
  const contactsNote = t.contactsThisWeek >= 65 ? "of the 65–95 goal" : `of the 65–95 goal · ${65 - t.contactsThisWeek} to the low end`;

  return (
    <>
      <PageHead eyebrow="Reports" title="How the business is doing">
        <div role="group" aria-label="Date range" className="inline-flex gap-0.5 p-[3px] border border-border-2 rounded-full">
          {RANGES.map((r) => {
            const on = query.range === r.key;
            return (
              <button
                key={r.key}
                type="button"
                aria-pressed={on}
                onClick={() => pickRange(r.key)}
                className={`min-h-8 px-3 rounded-full border-0 text-[12px] font-medium cursor-pointer ${on ? "bg-fg text-bg" : "bg-transparent text-muted-2 hover:text-fg"}`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <label htmlFor="rp-from" className="text-[12px] text-muted-2">
            From
          </label>
          <input
            id="rp-from"
            type="date"
            value={dates.from}
            onChange={(e) => onDate("from", e.target.value)}
            aria-invalid={dateError ? true : undefined}
            aria-describedby={dateError ? "rp-err" : undefined}
            className={`${dateInput} ${dateError ? "border-danger" : "border-border-2"}`}
          />
          <label htmlFor="rp-to" className="text-[12px] text-muted-2">
            to
          </label>
          <input
            id="rp-to"
            type="date"
            value={dates.to}
            onChange={(e) => onDate("to", e.target.value)}
            aria-invalid={dateError ? true : undefined}
            aria-describedby={dateError ? "rp-err" : undefined}
            className={`${dateInput} ${dateError ? "border-danger" : "border-border-2"}`}
          />
        </div>
        <button type="button" className={btnSecondary} onClick={() => setDialog("export")} disabled={view !== "live"}>
          Export CSV
        </button>
        {dateError ? (
          <p id="rp-err" role="alert" className="m-0 basis-full text-right text-[12px] text-danger">
            {dateError}
          </p>
        ) : null}
      </PageHead>

      {view === "error" ? (
        <ErrorCard onRetry={() => (forced ? setForced(null) : load(query))} />
      ) : view === "empty" ? (
        <div className="border border-dashed border-border-2 rounded-admin px-6 py-12 text-center flex flex-col items-center gap-2.5">
          <h2 className="text-[17px] font-medium m-0">Nothing to chart yet</h2>
          <p className="m-0 text-[12px] text-muted max-w-[460px] leading-[1.6]">
            Reports fill in from signed proposals, paid invoices and the outreach log. Day one shows the targets only: {money(tg.signed)} signed, {money(tg.cash)} cash, {money(tg.mrr)} recurring by month 3.
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            <Link href="/admin/outreach" className={btnPrimary}>
              Run today&rsquo;s outreach
            </Link>
            <Link href="/admin/settings?tab=general" className={btnSecondary}>
              Change the targets
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6" aria-busy={loading}>
          <section aria-label="Totals" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
            <Tile loading={loading} label={`Signed · ${label}`} value={money(t.signed)} note={`of ${money(tg.signed)} target · ${pct(t.signed, tg.signed)}%`} />
            <Tile loading={loading} label="Cash collected" value={money(t.cash)} note={`of ${money(tg.cash)} target · ${pct(t.cash, tg.cash)}%`} />
            <Tile loading={loading} label="Monthly recurring" value={`${money(t.mrr)}/mo`} note={`billing now · ${money(t.mrrAtLaunch)}/mo at launch · target ${money(tg.mrr)}`} />
            <Tile loading={loading} label="Close rate" value={`${t.closeRate}%`} note="signed ÷ demos sent" />
            <Tile loading={loading} label="Days to sign" value={t.daysToSign} note="first contact → signature, median" />
            <Tile loading={loading} label="Contacts · this week" value={t.contactsThisWeek} note={contactsNote} />
          </section>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(480px,100%),1fr))] gap-4 items-start">
            <ChartCard
              title="Signed and collected by month"
              sub={`Setup fees · ${label}`}
              loading={loading}
              legend={<Legend items={[["Signed", "bg-accent"], ["Cash collected", "bg-success"], ["Target line (dashed)", "bg-muted"]]} />}
              table={
                <DataTable
                  caption="Signed and collected by month"
                  head={["Month", "Signed", "Collected", "Target"]}
                  rows={data.months.map((m) => [m.label, money(m.signed), money(m.cash), money(tg.signed)])}
                />
              }
            >
              <SignedChart months={data.months} target={tg.signed} />
            </ChartCard>

            <ChartCard
              title="Monthly recurring"
              sub="Plans billing now, dotted = once current builds launch"
              loading={loading}
              legend={<Legend items={[["Billing", "bg-accent"], ["Projected at launch", "bg-accent-light"]]} />}
              table={
                <DataTable
                  caption="Monthly recurring revenue by month"
                  head={["Month", "Monthly recurring", "Status"]}
                  rows={data.mrr.map((p) => [p.label, `${money(p.value)}/mo`, p.projected ? "Projected" : "Billing"])}
                />
              }
            >
              <MrrChart points={data.mrr} target={tg.mrr} />
            </ChartCard>

            <ChartCard
              title="Pipeline by stage"
              sub="Where leads are right now"
              loading={loading}
              legend={
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                  <Legend items={[["Leads", "bg-accent"], ["Signed", "bg-success"]]} />
                  <Link href="/admin/leads?view=board" className="text-[12px] text-accent-light hover:text-fg">
                    Open a stage in Leads to see the names →
                  </Link>
                </div>
              }
            >
              <Funnel stages={data.funnel} />
            </ChartCard>

            <ChartCard
              title="Outreach contacts per week"
              sub="Emails approved and sent · calls logged"
              loading={loading}
              legend={<Legend items={[["Emails", "bg-accent"], ["Calls", "bg-accent-light"], ["Goal band", "bg-success/30"]]} />}
              table={
                <DataTable
                  caption="Outreach contacts per week"
                  head={["Week", "Emails", "Calls", "Contacts"]}
                  rows={data.weeks.map((w) => [w.label, w.emails, w.calls, w.emails + w.calls])}
                />
              }
            >
              <OutreachChart weeks={data.weeks} />
            </ChartCard>
          </div>

          <section aria-labelledby="off-h" className="bg-surface border border-border rounded-admin overflow-hidden min-w-0">
            <div className="flex flex-wrap justify-between items-baseline gap-3 px-5 pt-[18px] pb-3">
              <h2 id="off-h" className="text-[15px] font-medium m-0">
                By offer
              </h2>
              <span className="text-[12px] text-muted-2">Signed in range · what sells</span>
            </div>
            {loading ? (
              <div className="px-5 pb-5 flex flex-col gap-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-9" />
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-[13px]">
                    <caption className="sr-only">Signed proposals by offer</caption>
                    <thead>
                      <tr className="bg-surface-2">
                        <th scope="col" className="text-left font-medium text-muted-2 px-4 py-3">
                          Offer
                        </th>
                        <th scope="col" className="text-right font-medium text-muted-2 px-4 py-3">
                          Signed
                        </th>
                        <th scope="col" className="text-right font-medium text-muted-2 px-4 py-3">
                          Setup $
                        </th>
                        <th scope="col" className="text-right font-medium text-muted-2 px-4 py-3">
                          Monthly $
                        </th>
                        <th scope="col" className="text-left font-medium text-muted-2 px-4 py-3">
                          Took the plan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byOffer.map((o) => (
                        <tr key={o.code} className="border-t border-border hover:bg-[rgba(var(--fg-rgb),.03)]">
                          <th scope="row" className="text-left font-normal px-4 py-3">
                            {o.name} <span className="text-[12px] text-muted-2">· {o.code}</span>
                          </th>
                          <td className="px-4 py-3 text-right tabular-nums">{o.signed}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{o.signed ? money(o.setup) : "—"}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{o.monthly ? `${money(o.monthly)}/mo` : "—"}</td>
                          <td className="px-4 py-3 text-muted-2">
                            {o.monthlyRequired ? <Chip tone="warning">Plan required</Chip> : o.signed ? `${o.planTaken} of ${o.signed}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="m-0 px-5 pt-3 pb-4 text-[12px] text-muted-2 border-t border-border">
                  Sample rows use catalog prices. &ldquo;Took the plan&rdquo; is the share who kept the optional monthly; restaurant offers are marked plan required because the monthly is part of the deal there.
                </p>
              </>
            )}
          </section>
        </div>
      )}

      {DEV ? (
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-2" aria-label="Development state preview" role="group">
          <span>Dev preview:</span>
          {[null, "loading", "empty", "error"].map((s) => (
            <button
              key={s || "live"}
              type="button"
              aria-pressed={forced === s}
              onClick={() => setForced(s)}
              className={`min-h-7 px-2.5 rounded-full border text-[12px] cursor-pointer ${forced === s ? "border-fg text-fg" : "border-border-2 text-muted-2 bg-transparent"}`}
            >
              {s || "live"}
            </button>
          ))}
        </div>
      ) : null}

      {dialog === "export" ? (
        <ExportDialog
          query={query}
          label={label}
          onClose={() => setDialog(null)}
          onDone={(msg) => {
            setDialog(null);
            showToast(msg);
          }}
        />
      ) : null}
      <Toast toast={toast} />
    </>
  );
}
