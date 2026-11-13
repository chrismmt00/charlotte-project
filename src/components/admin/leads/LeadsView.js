"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHead, Skeleton, btnPrimary, btnSecondary, btnDanger } from "@/components/admin/ui";
import { Dialog, Drawer, Toast, useToast, Icon, DevBar, Initial, Row, fieldCls, chipBtn } from "./Overlay";
import { api, dev } from "./api";
import NewLeadDialog from "./NewLeadDialog";
import ImportDialog from "./ImportDialog";
import { LEAD_STATUSES, OWNERS, STATUS_DOT, plainEmail } from "@/lib/admin/sample-leads";

const PAGE = 6; // the build uses 25
const selectCls = "min-h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-[13px] text-fg font-[inherit] max-w-full";

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
  const th = (label, k) => {
    const on = sort.key === k;
    return (
      <th key={label} scope="col" aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className="text-left font-normal px-4 py-3 whitespace-nowrap">
        {k ? (
          <button type="button" onClick={() => sortBy(k)} className={`bg-transparent border-0 p-0 cursor-pointer text-[13px] inline-flex items-center gap-1.5 ${on ? "text-fg" : "text-muted-2 hover:text-fg"}`}>
            {label}
            <span aria-hidden="true">{on ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}</span>
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
        <div role="group" aria-label="View" className="inline-flex gap-1 p-1 border border-border-2 rounded-full">
          {[
            ["table", "Table"],
            ["board", "Board"],
          ].map(([k, l]) => (
            <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)} className={`min-h-8 px-4 rounded-full border-0 text-[13px] font-medium cursor-pointer ${view === k ? "bg-fg text-bg" : "bg-transparent text-muted-2 hover:text-fg"}`}>
              {l}
            </button>
          ))}
        </div>
      </PageHead>

      <DevBar>
        <label className="inline-flex items-center gap-2">
          List state
          <select value={devState} onChange={(e) => (setFailed(false), setDevState(e.target.value))} className={selectCls}>
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

      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <label htmlFor="lead-search" className="sr-only">
          Search leads
        </label>
        <input
          id="lead-search"
          type="search"
          placeholder="Search business, name or email"
          value={query}
          onChange={(e) => (setQuery(e.target.value), setPage(1))}
          className="flex-1 basis-[240px] min-w-0 min-h-10 rounded-[12px] border border-border-2 bg-surface px-4 text-[13px] text-fg"
        />
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {["All", ...LEAD_STATUSES].map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => (setFilter(f), setPage(1))} className={chipBtn(filter === f)}>
              {f}
              <span className={`text-[12px] tabular-nums ${filter === f ? "opacity-70" : "text-muted-2"}`}>{f === "All" ? visible.length : visible.filter((l) => l.status === f).length}</span>
            </button>
          ))}
        </div>
      </div>

      {state === "loading" ? (
        <div aria-busy="true" aria-label="Loading leads" className="border border-border rounded-admin overflow-hidden bg-surface">
          <div className="px-5 py-3.5 bg-surface-2">
            <Skeleton className="h-3 w-1/3" />
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-t border-border">
              <Skeleton className="h-4 w-4" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
              <Skeleton className="h-3 w-24 hidden sm:block" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          ))}
        </div>
      ) : null}

      {state === "error" ? (
        <div role="alert" className="border border-fg rounded-admin bg-surface p-10 flex flex-col items-center text-center gap-3">
          <Icon name="alert" size={28} />
          <h2 className="text-[18px] font-medium m-0">Couldn’t load leads</h2>
          <p className="m-0 text-muted-2 max-w-[420px] leading-relaxed">
            <code className="text-[12px]">GET /api/admin/leads</code> didn’t answer. Nothing was changed. Try again, or open a ticket if it keeps failing.
          </p>
          <div className="flex gap-2.5 mt-1">
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
        <div className="border border-dashed border-border-2 rounded-admin bg-surface p-12 flex flex-col items-center text-center gap-3">
          <span aria-hidden="true" className="w-12 h-12 rounded-full border border-border-2 inline-flex items-center justify-center text-muted-2">
            <Icon name="leads" size={22} />
          </span>
          <h2 className="text-[20px] font-medium m-0">No leads yet</h2>
          <p className="m-0 text-muted-2 max-w-[440px] leading-relaxed">Leads arrive from the contact form, the estimator, and Claude Cowork’s outreach. Until then, import a list you already have or add one by hand.</p>
          <div className="flex flex-wrap justify-center gap-2.5 mt-1">
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
          <div className="border border-border rounded-admin bg-surface overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-[13px]">
              <caption className="sr-only">Leads</caption>
              <thead>
                <tr className="bg-surface-2 text-muted-2">
                  <th scope="col" className="w-11 pl-4 py-3">
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
                      className="w-4 h-4 accent-[var(--accent)]"
                    />
                  </th>
                  {th("Business and contact", "business")}
                  {th("Offer")}
                  {th("Source")}
                  {th("Status", "status")}
                  {th("Received", "when")}
                  {th("Owner")}
                  <th scope="col" className="text-left font-normal px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} aria-selected={!!checks[l.id]} className={`border-t border-border ${checks[l.id] ? "bg-surface-2" : ""}`}>
                    <td className="pl-4 py-3">
                      <input type="checkbox" aria-label={`Select ${l.business}`} checked={!!checks[l.id]} onChange={() => setChecks((c) => ({ ...c, [l.id]: !c[l.id] }))} className="w-4 h-4 accent-[var(--accent)]" />
                    </td>
                    <td className="px-4 py-3 min-w-0">
                      <Link href={`/admin/leads/${l.id}`} className="text-fg font-medium hover:underline">
                        {l.business}
                      </Link>
                      <div className="text-[12px] text-muted-2">
                        {l.name} · {l.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-2">{l.offer}</td>
                    <td className="px-4 py-3 text-muted-2">{l.source}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <Dot status={l.status} />
                        <label htmlFor={`status-${l.id}`} className="sr-only">
                          Status for {l.business}
                        </label>
                        <select id={`status-${l.id}`} value={l.status} onChange={(e) => patch(l.id, { status: e.target.value }, `${l.business} · ${e.target.value}`)} className={selectCls}>
                          {LEAD_STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{l.when}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <Initial owner={l.owner} />
                        {l.owner}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setSelected(l.id)} aria-label={`Open ${l.business}`} className="bg-transparent border-0 p-0 min-h-9 text-accent-light hover:text-fg cursor-pointer text-[13px]">
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rowsAll.length ? <p className="m-0 px-5 py-8 text-center text-muted-2">No leads match. Clear the search or pick another status.</p> : null}
          </div>
          <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <span className="text-muted-2">{rowsAll.length ? `${(cur - 1) * PAGE + 1}–${Math.min(cur * PAGE, rowsAll.length)} of ${rowsAll.length}` : "0 of 0"}</span>
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={cur === 1} onClick={() => setPage(cur - 1)} className={`${btnSecondary} disabled:opacity-50`}>
                Prev
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" aria-current={n === cur ? "page" : undefined} aria-label={`Page ${n}`} onClick={() => setPage(n)} className={`min-w-9 min-h-9 rounded-[10px] border text-[13px] cursor-pointer ${n === cur ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2"}`}>
                  {n}
                </button>
              ))}
              <button type="button" disabled={cur === pageCount} onClick={() => setPage(cur + 1)} className={`${btnSecondary} disabled:opacity-50`}>
                Next
              </button>
            </div>
          </nav>
          <p className="text-[12px] text-muted-2 mt-3 mb-0">Sort by business, status or received (header arrows). Tick rows for the bulk bar. Six per page here so the pager has two pages; the build uses 25.</p>
        </>
      ) : null}

      {live && view === "board" ? (
        <>
          <div className="overflow-x-auto pb-2">
            <div className="grid grid-flow-col auto-cols-[minmax(210px,1fr)] gap-3 min-w-max lg:min-w-0">
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
                    className={`rounded-admin p-3.5 flex flex-col gap-2.5 min-h-[320px] border ${drop ? "border-dashed border-accent-light bg-[rgba(var(--fg-rgb),.04)]" : "border-border bg-surface-2"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Dot status={st} />
                      <h2 id={`col-${st.replace(/\s+/g, "-")}`} className="text-[13px] font-medium m-0 flex-1">
                        {st}
                      </h2>
                      <span className="text-[12px] text-muted-2 tabular-nums">{cards.length}</span>
                    </div>
                    {drop ? <div className="border border-dashed border-accent-light rounded-[12px] px-3 py-4 text-center text-[12px] text-muted-2">Drop to mark {st}</div> : null}
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
                        className={`rounded-[12px] border bg-surface cursor-grab active:cursor-grabbing transition-[transform,box-shadow] ${dragId === l.id ? "border-accent-light rotate-[-2deg] -translate-y-1.5 shadow-[0_24px_48px_rgba(0,0,0,calc(.45*var(--shadow-k)))]" : selected === l.id ? "border-accent-light" : "border-border"}`}
                      >
                        <button type="button" onClick={() => setSelected(l.id)} aria-label={`Open ${l.business}`} className="w-full text-left bg-transparent border-0 p-3 flex flex-col gap-1 cursor-inherit text-fg text-[13px]">
                          <span className="font-medium">{l.business}</span>
                          <span className="text-[12px] text-muted-2">{l.name}</span>
                          <span className="flex justify-between gap-2 text-[12px] text-muted-2 mt-1">
                            <span>{l.offerCode || "—"}</span>
                            <span>{l.when}</span>
                          </span>
                        </button>
                      </div>
                    ))}
                    {!cards.length && !drop ? <p className="m-0 text-[12px] text-muted-2 text-center py-6">Nothing here</p> : null}
                  </section>
                );
              })}
            </div>
          </div>
          <p className="text-[12px] text-muted-2 mt-3 mb-0">Drag a card to another column to change its status. Open a card for the drawer; status also changes from the drawer or the table, which work from the keyboard.</p>
        </>
      ) : null}

      <p className="text-[12px] text-muted-2 mt-6 mb-0">
        Reads <code>GET /api/admin/leads</code>; each row is what <code>POST /api/leads</code> saved from the contact form plus status and owner.
      </p>

      {checkedIds.length ? (
        <div role="toolbar" aria-label="Bulk actions" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[300] max-w-[calc(100vw-24px)] flex flex-wrap items-center justify-center gap-2.5 bg-surface border border-border-2 rounded-[18px] px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,calc(.45*var(--shadow-k)))]">
          <span className="text-[13px] font-medium">{checkedIds.length} selected</span>
          <label htmlFor="bulk-status" className="sr-only">
            Change status
          </label>
          <select id="bulk-status" value="" onChange={(e) => bulkPatch({ status: e.target.value }, (n) => `${n} leads moved to ${e.target.value}`)} className={selectCls}>
            <option value="" disabled>
              Change status…
            </option>
            {LEAD_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <label htmlFor="bulk-owner" className="sr-only">
            Assign owner
          </label>
          <select id="bulk-owner" value="" onChange={(e) => bulkPatch({ owner: e.target.value }, (n) => `${n} leads assigned to ${e.target.value}`)} className={selectCls}>
            <option value="" disabled>
              Assign to…
            </option>
            {OWNERS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <button type="button" className={btnSecondary} onClick={exportCsv}>
            Export CSV
          </button>
          <button type="button" className={btnSecondary} onClick={() => setDialog("bulk-delete")}>
            Delete
          </button>
          <button type="button" aria-label="Clear selection" onClick={() => setChecks({})} className="w-9 h-9 rounded-[10px] border-0 bg-transparent text-muted-2 hover:text-fg hover:bg-surface-2 inline-flex items-center justify-center cursor-pointer">
            <Icon name="close" />
          </button>
        </div>
      ) : null}

      {sel ? (
        <Drawer
          eyebrow={`Lead · ${sel.when}`}
          title={sel.business}
          subtitle={sel.name}
          onClose={() => setSelected(null)}
          footer={
            <>
              <button type="button" className={btnPrimary} onClick={() => patch(sel.id, { status: "Contacted" }, `${sel.business} marked contacted`)}>
                Mark contacted
              </button>
              <Link href={`/admin/leads/${sel.id}`} className={btnSecondary}>
                Open full page ↗
              </Link>
            </>
          }
        >
          <Row id="sel-status" label="Status">
            <select id="sel-status" className={fieldCls} value={sel.status} onChange={(e) => patch(sel.id, { status: e.target.value }, `${sel.business} · ${e.target.value}`)}>
              {LEAD_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Row>
          <dl className="m-0 grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5">
            <dt className="text-muted-2">Offer</dt>
            <dd className="m-0">
              {sel.offer}
              {sel.offerCode ? ` (${sel.offerCode})` : ""}
            </dd>
            <dt className="text-muted-2">Source</dt>
            <dd className="m-0">{sel.source}</dd>
            <dt className="text-muted-2">Email</dt>
            <dd className="m-0 break-all">
              <a href={`mailto:${plainEmail(sel.email)}`} className="text-accent-light">
                {sel.email}
              </a>
            </dd>
            <dt className="text-muted-2">Phone</dt>
            <dd className="m-0">
              <a href="tel:+17045550100" className="text-accent-light">
                {sel.phone || "—"}
              </a>
            </dd>
            <dt className="text-muted-2">
              <label htmlFor="sel-owner">Owner</label>
            </dt>
            <dd className="m-0">
              <select id="sel-owner" className={selectCls} value={sel.owner} onChange={(e) => patch(sel.id, { owner: e.target.value }, `Owner set to ${e.target.value}`)}>
                {OWNERS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </dd>
            <dt className="text-muted-2">Next action</dt>
            <dd className="m-0">{sel.next}</dd>
          </dl>
          {sel.message ? (
            <div>
              <div className="text-muted-2 mb-1">Message</div>
              <p className="m-0 leading-relaxed">{sel.message}</p>
            </div>
          ) : null}
          <Row id="sel-notes" label="Internal notes">
            <textarea id="sel-notes" rows={3} className={`${fieldCls} resize-y`} placeholder="Call notes, next step, who owns it" defaultValue={sel.notes || ""} onBlur={(e) => e.target.value !== (sel.notes || "") && patch(sel.id, { notes: e.target.value })} />
          </Row>
          <p className="m-0 text-[12px] text-muted-2">Status and owner write to <code>PATCH /api/admin/leads/[id]</code>. Calls, emails, notes, proposals and the next action live on the full page.</p>
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
          size="sm"
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
          <p id="bd-p" className="m-0 text-muted-2 leading-relaxed">
            They leave the list and the board, with their notes and activity. The original contact-form submissions stay in the database export for 30 days. This can’t be undone from here.
          </p>
        </Dialog>
      ) : null}

      <Toast toast={toast} raised={checkedIds.length > 0} />
    </>
  );
}
