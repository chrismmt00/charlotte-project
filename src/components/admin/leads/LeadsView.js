"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHead, btnPrimary, btnSecondary, btnDanger } from "@/components/admin/ui";
import { Dialog, Drawer, Toast, useToast, Icon, DevBar, Initial, Segmented, pillSelect, chipBtn, drawerFieldCls } from "./Overlay";
import { api, dev } from "./api";
import NewLeadDialog from "./NewLeadDialog";
import ImportDialog from "./ImportDialog";
import { LEAD_STATUSES, OWNERS, STATUS_DOT, plainEmail } from "@/lib/admin/sample-leads";

const PAGE = 6; // the build uses 25
const STATUS_TEXT = { New: "text-accent-light", Contacted: "text-muted-2", "Demo booked": "text-accent", "Proposal sent": "text-fg", Signed: "text-success", Lost: "text-muted" };
const devSelect = "min-h-8 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-xs text-fg font-[inherit]";
const skelGrid = { gridTemplateColumns: "24px 2.2fr 1fr 1fr 1fr .8fr .7fr" };
const bulkCtl = "min-h-[34px] rounded-full border border-[rgba(var(--bg-rgb),.3)] bg-transparent text-bg px-3 text-[13px] cursor-pointer";

function Sk({ className = "", style }) {
  return <span aria-hidden="true" style={style} className={`block rounded-md bg-surface-2 animate-pulse ${className}`} />;
}

function Dot({ status }) {
  return <span aria-hidden="true" className={`w-2 h-2 rounded-full flex-none ${STATUS_DOT[status] || "bg-muted"}`} />;
}

export default function LeadsView({ initial }) {
  const params = useSearchParams();
  const [leads, setLeads] = useState(initial);
  const [view, setView] = useState(params.get("view") === "board" ? "board" : "table");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "when", dir: "asc" });
  const [page, setPage] = useState(1);
  const [checks, setChecks] = useState({});
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(params.get("new") === "1" ? "new" : "none");
  const [devState, setDevState] = useState("live"); // dev-only: live | loading | error | empty
  const [failed, setFailed] = useState(false); // real: a retry that failed keeps the error card
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [toast, showToast] = useToast();

  // ---- data helpers ----
  const patch = async (id, changes, okText) => {
    const before = leads.find((l) => l.id === id);
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...changes } : l)));
    const res = await api("PATCH", `/api/admin/leads/${id}`, changes);
    if (!res.ok) {
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...Object.fromEntries(Object.keys(changes).map((k) => [k, before?.[k]])) } : l)));
      showToast("Couldn’t save that change. Nothing was changed.", { tone: "error" });
      return false;
    }
    if (okText) showToast(okText);
    return true;
  };
  const bulkPatch = async (changes, text) => {
    const ids = Object.keys(checks).filter((k) => checks[k]);
    const before = leads;
    setLeads((ls) => ls.map((l) => (checks[l.id] ? { ...l, ...changes } : l)));
    const results = await Promise.all(ids.map((id) => api("PATCH", `/api/admin/leads/${id}`, changes)));
    if (results.some((r) => !r.ok)) {
      setLeads(before);
      showToast("Some changes didn’t save, so none were applied.", { tone: "error" });
      return;
    }
    setChecks({});
    showToast(text(ids.length));
  };
  const confirmBulkDelete = async () => {
    const ids = Object.keys(checks).filter((k) => checks[k]);
    const results = await Promise.all(ids.map((id) => api("DELETE", `/api/admin/leads/${id}`)));
    if (results.some((r) => !r.ok)) {
      setDialog("none");
      showToast("Couldn’t delete every lead. Nothing was removed.", { tone: "error" });
      return;
    }
    setLeads((ls) => ls.filter((l) => !checks[l.id]));
    setChecks({});
    setDialog("none");
    showToast(`${ids.length} leads deleted`);
  };
  const retry = async () => {
    const res = await api("GET", "/api/admin/leads");
    if (!res.ok) {
      setFailed(true);
      showToast("Still can’t reach the leads. Try again in a minute.", { tone: "error" });
      return;
    }
    setLeads(res.data.leads);
    setFailed(false);
    setDevState("live");
  };
  const exportCsv = () => {
    const rows = leads.filter((l) => checks[l.id]);
    const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const csv = ["Business,Name,Email,Phone,Offer,Source,Status,Owner,Received"].concat(rows.map((l) => [l.business, l.name, plainEmail(l.email), l.phone, l.offer, l.source, l.status, l.owner, l.when].map(esc).join(","))).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
    setChecks({});
    showToast(`CSV with ${rows.length} leads is downloading`);
  };

  // ---- derived ----
  const q = query.trim().toLowerCase();
  const visible = useMemo(() => leads.filter((l) => !q || `${l.business} ${l.name} ${l.email}`.toLowerCase().includes(q)), [leads, q]);
  const rowsAll = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return visible
      .filter((l) => filter === "All" || l.status === filter)
      .sort((a, b) => {
        if (sort.key === "business") return a.business.localeCompare(b.business) * dir;
        if (sort.key === "status") return (LEAD_STATUSES.indexOf(a.status) - LEAD_STATUSES.indexOf(b.status)) * dir;
        return (a.ageHours - b.ageHours) * dir;
      });
  }, [visible, filter, sort]);
  const pageCount = Math.max(1, Math.ceil(rowsAll.length / PAGE));
  const cur = Math.min(page, pageCount);
  const rows = rowsAll.slice((cur - 1) * PAGE, cur * PAGE);
  const checkedIds = Object.keys(checks).filter((k) => checks[k] && leads.some((l) => l.id === k));
  const allChecked = rows.length > 0 && rows.every((l) => checks[l.id]);
  const sel = leads.find((l) => l.id === selected) || null;
  const existingEmails = useMemo(() => new Set(leads.map((l) => plainEmail(l.email).toLowerCase())), [leads]);

  const state = failed ? "error" : devState !== "live" ? devState : leads.length === 0 ? "empty" : "live";
  const live = state === "live";

  const sortBy = (key) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
    setPage(1);
  };
  // Header cells: first data column 14px 20px, the rest 14px 16px (board).
  const th = (label, k, first) => {
    const on = sort.key === k;
    return (
      <th key={label} scope="col" aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={`text-left font-medium text-[13px] text-muted-2 py-3.5 whitespace-nowrap ${first ? "px-5" : "px-4"}`}>
        {k ? (
          <button type="button" onClick={() => sortBy(k)} className={`bg-transparent border-0 p-0 cursor-pointer text-[13px] font-medium inline-flex items-center gap-1.5 ${on ? "text-fg" : "text-muted-2 hover:text-fg"}`}>
            {label}
            <span aria-hidden="true" className="text-[11px]">
              {on ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
            </span>
          </button>
        ) : (
          label
        )}
      </th>
    );
  };

  const moveTo = (id, status) => {
    const l = leads.find((x) => x.id === id);
    if (!l || l.status === status) return;
    patch(id, { status }, `${l.business} moved to ${status}`);
  };

  return (
    <>
      <PageHead eyebrow={`Leads · ${leads.length} total`} title="Leads">
        <button type="button" className={btnSecondary} onClick={() => setDialog("import")}>
          <Icon name="upload" />
          Import
        </button>
        <button type="button" className={btnPrimary} onClick={() => setDialog("new")}>
          New lead
        </button>
        <Segmented label="View" value={view} onChange={setView} options={[["table", "Table"], ["board", "Board"]]} />
      </PageHead>

      <DevBar>
        <label className="inline-flex items-center gap-2">
          List state
          <select value={devState} onChange={(e) => (setFailed(false), setDevState(e.target.value))} className={devSelect}>
            <option>live</option>
            <option>loading</option>
            <option>error</option>
            <option>empty</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" defaultChecked={false} onChange={(e) => (dev.fail = e.target.checked)} className="accent-[var(--accent)]" />
          Next request fails
        </label>
      </DevBar>

      <div className="flex flex-wrap items-center gap-2.5">
        <label htmlFor="lead-search" className="sr-only">
          Search leads
        </label>
        <input
          id="lead-search"
          type="search"
          placeholder="Search business, name or email"
          value={query}
          onChange={(e) => (setQuery(e.target.value), setPage(1))}
          className="flex-[1_1_240px] min-w-0 min-h-11 rounded-[14px] border border-border-2 bg-surface px-4 text-[13px] text-fg box-border"
        />
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {["All", ...LEAD_STATUSES].map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => (setFilter(f), setPage(1))} className={chipBtn(filter === f)}>
              {f}
              <span className={`text-xs tabular-nums ${filter === f ? "opacity-70" : "text-muted"}`}>{f === "All" ? visible.length : visible.filter((l) => l.status === f).length}</span>
            </button>
          ))}
        </div>
      </div>

      {state === "loading" ? (
        <div aria-busy="true" aria-label="Loading leads" className="border border-border rounded-admin overflow-hidden bg-surface">
          <div className="grid gap-4 px-5 py-3.5 bg-surface-2 items-center" style={skelGrid}>
            <Sk className="h-3 w-[18px]" />
            <Sk className="h-3 w-2/5" />
            <Sk className="h-3 w-1/2" />
            <Sk className="h-3 w-1/2" />
            <Sk className="h-3 w-1/2" />
            <Sk className="h-3 w-3/5" />
            <Sk className="h-3 w-3/5" />
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="grid gap-4 px-5 py-4 items-center border-t border-border" style={skelGrid}>
              <Sk className="h-[18px] w-[18px]" />
              <span className="flex flex-col gap-2">
                <Sk className="h-3" style={{ width: `${45 + ((i * 23) % 35)}%` }} />
                <Sk className="h-2.5" style={{ width: `${60 + ((i * 31) % 30)}%` }} />
              </span>
              <Sk className="h-3 w-[70%]" />
              <Sk className="h-3 w-[55%]" />
              <Sk className="h-7 w-4/5 rounded-full" />
              <Sk className="h-3 w-1/2" />
              <Sk className="h-3 w-3/5" />
            </div>
          ))}
        </div>
      ) : null}

      {state === "error" ? (
        <div role="alert" className="border border-fg rounded-admin bg-surface px-6 py-10 flex flex-col items-center text-center gap-3">
          <Icon name="alert" size={28} />
          <h2 className="text-lg font-medium m-0">Couldn’t load leads</h2>
          <p className="m-0 text-[13px] text-muted-2 max-w-[420px] leading-[1.6]">
            <code className="text-xs">GET /api/admin/leads</code> didn’t answer. Nothing was changed. Try again, or check the status page if it keeps failing.
          </p>
          <div className="flex gap-2.5 mt-1.5">
            <button type="button" className={btnPrimary} onClick={retry}>
              Retry
            </button>
            <Link href="/admin/support" className={btnSecondary}>
              Open a ticket
            </Link>
          </div>
        </div>
      ) : null}

      {state === "empty" ? (
        <div className="border border-dashed border-border-2 rounded-admin bg-surface px-6 py-14 flex flex-col items-center text-center gap-3">
          <span aria-hidden="true" className="w-12 h-12 rounded-full border border-border-2 inline-flex items-center justify-center text-muted-2">
            <Icon name="leads" size={22} />
          </span>
          <h2 className="text-xl font-medium m-0">No leads yet</h2>
          <p className="m-0 text-[13px] text-muted-2 max-w-[440px] leading-[1.6]">Leads arrive from the contact form, the estimator, and Claude Cowork’s outreach. Until then, import a list you already have or add one by hand.</p>
          <div className="flex flex-wrap justify-center gap-2.5 mt-1.5">
            <button type="button" className={btnPrimary} onClick={() => setDialog("new")}>
              New lead
            </button>
            <button type="button" className={btnSecondary} onClick={() => setDialog("import")}>
              Import CSV
            </button>
            <Link href="/admin/outreach" className={btnSecondary}>
              Start outreach ↗
            </Link>
          </div>
        </div>
      ) : null}

      {live && view === "table" ? (
        <>
          <div className="border border-border rounded-admin bg-surface overflow-hidden">
            <div className="overflow-x-auto relative">
              <table className="w-full min-w-[940px] border-collapse text-[13px]">
                <caption className="sr-only">Leads</caption>
                <thead>
                  <tr className="bg-surface-2">
                    <th scope="col" className="pl-4 py-3.5 w-[18px]">
                      <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        checked={allChecked}
                        onChange={() =>
                          setChecks((c) => {
                            const n = { ...c };
                            rows.forEach((l) => (allChecked ? delete n[l.id] : (n[l.id] = true)));
                            return n;
                          })
                        }
                        className="w-[18px] h-[18px] accent-[var(--accent)] cursor-pointer m-0 block"
                      />
                    </th>
                    {th("Business and contact", "business", true)}
                    {th("Offer")}
                    {th("Source")}
                    {th("Status", "status")}
                    {th("Received", "when")}
                    {th("Owner")}
                    <th scope="col" className="text-right px-5 py-3.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => (
                    <tr key={l.id} aria-selected={!!checks[l.id]} className={`border-t border-border hover:bg-[rgba(var(--fg-rgb),.03)] ${checks[l.id] || selected === l.id ? "bg-surface-2" : ""} ${selected === l.id ? "shadow-[inset_3px_0_0_var(--accent-light)]" : ""}`}>
                      <td className="pl-4 py-3">
                        <input type="checkbox" aria-label={`Select ${l.business}`} checked={!!checks[l.id]} onChange={() => setChecks((c) => ({ ...c, [l.id]: !c[l.id] }))} className="w-[18px] h-[18px] accent-[var(--accent)] cursor-pointer m-0 block" />
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex flex-col gap-0.5">
                          <Link href={`/admin/leads/${l.id}`} className="font-medium text-fg hover:underline">
                            {l.business}
                          </Link>
                          <span className="text-[13px] text-muted">
                            {l.name} · {l.email}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{l.offer}</td>
                      <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{l.source}</td>
                      <td className="px-4 py-3">
                        <label htmlFor={`status-${l.id}`} className="sr-only">
                          Status for {l.business}
                        </label>
                        <select id={`status-${l.id}`} value={l.status} onChange={(e) => patch(l.id, { status: e.target.value }, `${l.business} · ${e.target.value}`)} className={`${pillSelect} ${STATUS_TEXT[l.status]}`}>
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} className="text-fg">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{l.when}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 text-muted-2">
                          <Initial owner={l.owner} />
                          {l.owner}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button type="button" onClick={() => setSelected(l.id)} aria-label={`Open ${l.business}`} className="min-h-9 px-3.5 rounded-full border border-border-2 bg-transparent text-fg text-[13px] cursor-pointer hover:bg-surface-2">
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!rowsAll.length ? <p className="m-0 px-5 py-8 text-[13px] text-muted text-center">No leads match. Clear the search or pick another status.</p> : null}
            <nav aria-label="Pagination" className="flex flex-wrap justify-between items-center gap-2.5 px-5 py-3 border-t border-border text-[13px] text-muted">
              <span>{rowsAll.length ? `${(cur - 1) * PAGE + 1}–${Math.min(cur * PAGE, rowsAll.length)} of ${rowsAll.length}` : "0 of 0"}</span>
              <div className="flex items-center gap-1.5">
                <button type="button" disabled={cur === 1} aria-disabled={cur === 1} onClick={() => setPage(cur - 1)} className="min-h-8 px-3 rounded-full border border-border-2 bg-transparent text-fg text-[13px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  Prev
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" aria-current={n === cur ? "page" : undefined} aria-label={`Page ${n}`} onClick={() => setPage(n)} className={`min-w-8 min-h-8 px-2.5 rounded-full border text-[13px] cursor-pointer tabular-nums ${n === cur ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2"}`}>
                    {n}
                  </button>
                ))}
                <button type="button" disabled={cur === pageCount} aria-disabled={cur === pageCount} onClick={() => setPage(cur + 1)} className="min-h-8 px-3 rounded-full border border-border-2 bg-transparent text-fg text-[13px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </nav>
          </div>
          <p className="text-[13px] text-muted m-0">Sort by business, status or received (header arrows, aria-sort). Tick rows for the bulk bar. Six per page here so the pager has two pages; the build uses 25.</p>
        </>
      ) : null}

      {live && view === "board" ? (
        <>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-[1200px] items-start">
              {LEAD_STATUSES.map((st) => {
                const cards = visible.filter((l) => l.status === st);
                const drop = dragId && dragOver === st && leads.find((l) => l.id === dragId)?.status !== st;
                return (
                  <section
                    key={st}
                    aria-labelledby={`col-${st.replace(/\s+/g, "-")}`}
                    onDragOver={(e) => {
                      if (!dragId) return;
                      e.preventDefault();
                      setDragOver(st);
                    }}
                    onDragLeave={() => setDragOver((d) => (d === st ? null : d))}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId) moveTo(dragId, st);
                      setDragId(null);
                      setDragOver(null);
                    }}
                    className={`flex-[1_1_0] min-w-[190px] rounded-admin p-3.5 flex flex-col gap-2.5 min-h-[320px] box-border border ${drop ? "border-dashed border-accent-light bg-[rgba(var(--fg-rgb),.04)]" : "border-border bg-surface-2"}`}
                  >
                    <div className="flex justify-between items-center gap-2 pt-0.5 px-1.5 pb-1.5">
                      <h2 id={`col-${st.replace(/\s+/g, "-")}`} className="text-[13px] font-medium m-0 flex items-center gap-2">
                        <Dot status={st} />
                        {st}
                      </h2>
                      <span className="text-xs text-muted tabular-nums">{cards.length}</span>
                    </div>
                    {drop ? <span className="text-[13px] text-accent-light border border-dashed border-accent-light rounded-[14px] px-3.5 py-[26px] text-center">Drop to mark {st}</span> : null}
                    {cards.map((l) => (
                      <div
                        key={l.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", l.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragId(l.id);
                        }}
                        onDragEnd={() => (setDragId(null), setDragOver(null))}
                        className={`rounded-[14px] transition-[transform,box-shadow] duration-200 ${dragId === l.id ? "rotate-[-2deg] -translate-y-1.5 shadow-[0_24px_48px_rgba(0,0,0,calc(.45*var(--shadow-k)))]" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelected(l.id)}
                          aria-label={`Open ${l.business}`}
                          className={`w-full text-left bg-surface border rounded-[14px] p-3.5 flex flex-col gap-2 text-fg cursor-grab active:cursor-grabbing ${dragId === l.id || selected === l.id ? "border-accent-light" : "border-border"}`}
                        >
                          <span className="text-[13px] font-medium leading-[1.3]">{l.business}</span>
                          <span className="text-[13px] text-muted">{l.name}</span>
                          <span className="flex flex-wrap gap-1.5 items-center mt-0.5">
                            <span className="text-[11px] tracking-[.05em] text-muted-2 border border-border-2 rounded-full px-2 py-[3px]">{l.offerCode || "—"}</span>
                            <span className="text-xs text-muted">{l.when}</span>
                          </span>
                        </button>
                      </div>
                    ))}
                    {!cards.length && !drop ? <span className="text-[13px] text-muted border border-dashed border-border-2 rounded-[14px] px-3.5 py-[18px] text-center">Nothing here</span> : null}
                  </section>
                );
              })}
            </div>
          </div>
          <p className="text-[13px] text-muted m-0">Drag a card to another column to change its status. Open a card for the drawer; status also changes from the drawer or the table, which work from the keyboard.</p>
        </>
      ) : null}

      <p className="text-[13px] text-muted m-0">
        Reads <code className="text-xs text-muted-2">GET /api/admin/leads</code>; each row is what <code className="text-xs text-muted-2">POST /api/leads</code> saved from the contact form: name, business, email, phone, message, source, offerCode, plus status and receivedAt.
      </p>

      {checkedIds.length ? (
        <div role="toolbar" aria-label="Bulk actions" className="fixed left-1/2 bottom-7 -translate-x-1/2 z-[350] flex flex-wrap items-center gap-2 py-2 pr-2 pl-[18px] rounded-full bg-fg text-bg text-[13px] shadow-[0_20px_50px_rgba(0,0,0,calc(.4*var(--shadow-k)))] max-w-[calc(100vw-32px)]">
          <span className="font-medium whitespace-nowrap">{checkedIds.length} selected</span>
          <span aria-hidden="true" className="w-px h-5 bg-[rgba(var(--bg-rgb),.25)]" />
          <label htmlFor="bulk-status" className="sr-only">
            Change status
          </label>
          <select id="bulk-status" value="" onChange={(e) => bulkPatch({ status: e.target.value }, (n) => `${n} leads moved to ${e.target.value}`)} className={bulkCtl}>
            <option value="" disabled>
              Change status…
            </option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} className="text-fg bg-surface">
                {s}
              </option>
            ))}
          </select>
          <label htmlFor="bulk-owner" className="sr-only">
            Assign owner
          </label>
          <select id="bulk-owner" value="" onChange={(e) => bulkPatch({ owner: e.target.value }, (n) => `${n} leads assigned to ${e.target.value}`)} className={bulkCtl}>
            <option value="" disabled>
              Assign to…
            </option>
            {OWNERS.map((o) => (
              <option key={o} className="text-fg bg-surface">
                {o}
              </option>
            ))}
          </select>
          <button type="button" className={bulkCtl} onClick={exportCsv}>
            Export CSV
          </button>
          <button type="button" className={bulkCtl} onClick={() => setDialog("bulk-delete")}>
            Delete
          </button>
          <button type="button" aria-label="Clear selection" onClick={() => setChecks({})} className="w-[34px] h-[34px] rounded-full border-0 bg-[rgba(var(--bg-rgb),.15)] text-bg inline-flex items-center justify-center cursor-pointer p-0">
            <Icon name="close" />
          </button>
        </div>
      ) : null}

      {sel ? (
        <Drawer eyebrow={`Lead · ${sel.when}`} title={sel.business} subtitle={sel.name} onClose={() => setSelected(null)} width={440}>
          <div className="flex flex-col gap-2">
            <label htmlFor="sel-status" className="text-[13px] text-muted-2">
              Status
            </label>
            <select id="sel-status" className={`${drawerFieldCls} cursor-pointer`} value={sel.status} onChange={(e) => patch(sel.id, { status: e.target.value }, `${sel.business} · ${e.target.value}`)}>
              {LEAD_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3.5 text-sm">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted">Offer</dt>
              <dd className="m-0">
                {sel.offer} {sel.offerCode ? <span className="text-muted">({sel.offerCode})</span> : null}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted">Source</dt>
              <dd className="m-0">{sel.source}</dd>
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <dt className="text-xs text-muted">Email</dt>
              <dd className="m-0 break-all">
                <a href={`mailto:${plainEmail(sel.email)}`} className="text-accent-light">
                  {sel.email}
                </a>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted">Phone</dt>
              <dd className="m-0">
                <a href="tel:+17045550100" className="text-accent-light">
                  {sel.phone || "—"}
                </a>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted">Owner</dt>
              <dd className="m-0">
                <label htmlFor="sel-owner" className="sr-only">
                  Owner
                </label>
                <select id="sel-owner" className="min-h-8 rounded-full border border-border-2 bg-surface-2 text-fg px-2.5 text-[13px] cursor-pointer" value={sel.owner} onChange={(e) => patch(sel.id, { owner: e.target.value }, `Owner set to ${e.target.value}`)}>
                  {OWNERS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted">Next action</dt>
              <dd className="m-0">{sel.next}</dd>
            </div>
          </dl>
          {sel.message ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Message</span>
              <p className="m-0 text-sm leading-[1.65] text-muted-2 bg-surface-2 border border-border rounded-[14px] px-4 py-3.5">{sel.message}</p>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <label htmlFor="sel-notes" className="text-[13px] text-muted-2">
              Internal notes
            </label>
            <textarea
              id="sel-notes"
              rows={3}
              className="rounded-[14px] border border-border-2 bg-surface-2 text-fg px-3.5 py-3 text-sm leading-normal resize-y font-[inherit]"
              placeholder="Call notes, next step, who owns it"
              defaultValue={sel.notes || ""}
              onBlur={(e) => e.target.value !== (sel.notes || "") && patch(sel.id, { notes: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="flex-[1_1_160px] min-h-12 rounded-full border-2 border-transparent bg-fg text-bg text-sm font-medium cursor-pointer hover:opacity-90" onClick={() => patch(sel.id, { status: "Contacted" }, `${sel.business} marked contacted`)}>
              Mark contacted
            </button>
            <Link href={`/admin/leads/${sel.id}`} className="flex-[1_1_160px] min-h-12 rounded-full border-2 border-border bg-transparent text-fg text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-surface-2">
              Open full page <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className="m-0 text-xs text-muted">
            Status and owner write to <code className="text-muted-2">PATCH /api/admin/leads/[id]</code>. Email and phone open the device’s mail and phone apps. Calls, emails, notes, proposals and the next action live on the full page.
          </p>
        </Drawer>
      ) : null}

      {dialog === "new" ? (
        <NewLeadDialog
          onClose={() => setDialog("none")}
          onCreated={(lead, open) => {
            setLeads((ls) => [lead, ...ls]);
            setDialog("none");
            if (open) setSelected(lead.id);
            showToast(`Lead saved · ${lead.status} · owned by ${lead.owner}`);
          }}
        />
      ) : null}

      {dialog === "import" ? (
        <ImportDialog
          existingEmails={existingEmails}
          onClose={() => setDialog("none")}
          onImported={(result, created) => {
            setLeads((ls) => [...created, ...ls]);
            showToast(`${result.imported} leads imported, ${result.updated} updated`);
          }}
        />
      ) : null}

      {dialog === "bulk-delete" ? (
        <Dialog
          role="alertdialog"
          describedBy="bd-p"
          width={440}
          title={`Delete ${checkedIds.length} leads?`}
          onClose={() => setDialog("none")}
          footer={
            <>
              <button type="button" className={btnSecondary} onClick={() => setDialog("none")}>
                Cancel
              </button>
              <button type="button" className={btnDanger} onClick={confirmBulkDelete}>
                Delete {checkedIds.length} leads
              </button>
            </>
          }
        >
          <p id="bd-p" className="m-0 text-[13px] text-muted-2 leading-[1.6]">
            They leave the list and the board, with their notes and activity. The original contact-form submissions stay in the database export for 30 days. This can’t be undone from here.
          </p>
        </Dialog>
      ) : null}

      <Toast toast={toast} raised={checkedIds.length > 0} />
    </>
  );
}
