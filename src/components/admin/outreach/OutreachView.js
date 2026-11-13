"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHead, btnPrimary, btnSecondary, money } from "@/components/admin/ui";
import { Icon, Toast, useToast, DevBar } from "@/components/admin/leads/Overlay";
import { api, dev } from "@/components/admin/leads/api";
import { TARGETS } from "@/lib/admin/sample";
import { ApprovalQueue, RunTab, ProspectsTab, CallsTab, ScriptsTab, PartnersTab } from "./Panels";
import ProspectDrawer from "./ProspectDrawer";
import { EmailEditor, HandoffDialog, LogDialog, PartnerDialog } from "./Dialogs";

const TAB_KEYS = ["approvals", "run", "prospects", "calls", "scripts", "partners"];
const selectCls = "min-h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-[13px] text-fg font-[inherit] max-w-full";

// Outreach. Claude drafts and builds; a person approves every email and demo. Nothing sends without that click.
// Data comes from getOutreach() (sample) as `initial`; mutations call the /api/admin/outreach stubs.
export default function OutreachView({ initial }) {
  const params = useSearchParams();
  const startTab = params.get("tab");
  const [tab, setTab] = useState(TAB_KEYS.includes(startTab) ? startTab : "approvals");
  const [prospects, setProspects] = useState(initial.prospects);
  const [queue, setQueue] = useState(initial.queue);
  const [drafts, setDrafts] = useState({});
  const [partners, setPartners] = useState(initial.partners);
  const [called, setCalled] = useState({});
  const [contactsWeek, setContactsWeek] = useState(initial.stats.contactsWeek);
  const [sentWeek, setSentWeek] = useState(initial.stats.sentWeek);
  const [run, setRun] = useState({ status: "idle", step: 0 });
  const [sel, setSel] = useState(null);
  const [builder, setBuilder] = useState("Claude");
  const [dialog, setDialog] = useState(null); // { type: "draft"|"handoff"|"log"|"partner", ... }
  const [busyId, setBusyId] = useState(null);
  const [devState, setDevState] = useState("live"); // dev-only: live | loading | error | empty
  const [failed, setFailed] = useState(false);
  const [toast, showToast] = useToast();
  const timer = useRef(null);
  const step = useRef(0);
  useEffect(() => () => clearInterval(timer.current), []);

  const stats = initial.stats;
  const prospectState = failed ? "error" : devState !== "live" ? devState : prospects.length === 0 ? "empty" : "live";
  const byId = (id) => prospects.find((p) => p.id === id);
  const selected = byId(sel);

  // ---- prospects ----
  const addActivity = (id, who, text) => setProspects((ps) => ps.map((p) => (p.id === id ? { ...p, activity: [...p.activity, { who, text, when: "just now" }] } : p)));
  const change = async (id, changes, okText) => {
    const before = byId(id);
    setProspects((ps) => ps.map((p) => (p.id === id ? { ...p, ...changes } : p)));
    const res = await api("PATCH", `/api/admin/outreach/prospects/${id}`, changes);
    if (!res.ok) {
      setProspects((ps) => ps.map((p) => (p.id === id ? { ...p, ...Object.fromEntries(Object.keys(changes).map((k) => [k, before[k]])) } : p)));
      showToast("Couldn’t save that change. Nothing was changed.", { tone: "error" });
      return false;
    }
    if (okText) showToast(okText);
    return true;
  };
  const convert = async (p) => {
    const res = await api("PATCH", `/api/admin/outreach/prospects/${p.id}`, { convert: true });
    if (!res.ok) return showToast("Couldn’t create the lead. Nothing was changed.", { tone: "error" });
    setProspects((ps) => ps.map((x) => (x.id === p.id ? { ...x, phase: "Became a lead", next: "In Leads", activity: [...x.activity, { who: "Chris", text: "Converted to lead", when: "just now" }] } : x)));
    showToast(`${p.business} is now a lead · source Outreach`);
  };
  const notFit = (p) => change(p.id, { phase: "Not a fit", next: "No action" }, "Marked not a fit · Claude won’t re-add them");
  const retry = async () => {
    const res = await api("GET", "/api/admin/outreach");
    if (!res.ok) {
      setFailed(true);
      return showToast("Still can’t reach the prospects. Try again in a minute.", { tone: "error" });
    }
    setProspects(res.data.prospects);
    setFailed(false);
    setDevState("live");
  };

  // ---- approvals: a person approves every email and demo ----
  const sendApproval = async (item, action, email, extra = {}) => {
    const res = await api("POST", `/api/admin/outreach/approvals/${item.id}`, { action, kind: item.kind, prospectId: item.prospectId, email, ...extra });
    if (!res.ok) return null;
    return res.data;
  };
  const afterApproval = (item, data) => {
    setQueue((q) => q.filter((d) => d.id !== item.id));
    setProspects((ps) => ps.map((p) => (p.id === item.prospectId ? { ...p, phase: data.prospect.phase, next: data.prospect.next, activity: [...p.activity, { who: "Chris", text: data.action === "approve" ? (item.kind === "demo" ? "Approved and sent the demo" : "Approved and sent") : "Skipped the draft", when: "just now" }] } : p)));
  };
  const approve = async (item, email) => {
    setBusyId(item.id);
    const data = await sendApproval(item, "approve", email);
    setBusyId(null);
    if (!data) {
      showToast("That didn’t go through. Nothing was sent.", { tone: "error" });
      return false;
    }
    afterApproval(item, data);
    setSentWeek((n) => n + 1);
    setDialog(null);
    showToast(item.kind === "demo" ? `Demo sent to ${item.business} · follow-up drafted for 3 days` : `Sent to ${item.to} · follow-up drafted for 3 days`);
    return true;
  };
  const skip = async (item) => {
    const data = await sendApproval(item, "reject");
    if (!data) return showToast("Couldn’t skip that draft. Nothing was changed.", { tone: "error" });
    afterApproval(item, data);
    showToast("Skipped · Claude won’t redraft this one for 30 days");
  };

  // ---- run ----
  const startRun = async () => {
    if (run.status === "running") return;
    const res = await api("POST", "/api/admin/outreach/run", {});
    if (!res.ok) return showToast("Couldn’t start the run. Try again.", { tone: "error" });
    step.current = 1;
    setRun({ status: "running", step: 1 });
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      step.current += 1;
      if (step.current > 5) {
        clearInterval(timer.current);
        setRun({ status: "done", step: 5 });
        showToast("Run finished · 4 new prospects, 3 drafts, 1 demo");
      } else setRun({ status: "running", step: step.current });
    }, 900);
  };

  // ---- tabs ----
  const onTabKey = (e, i) => {
    const n = e.key === "ArrowRight" ? (i + 1) % TAB_KEYS.length : e.key === "ArrowLeft" ? (i + TAB_KEYS.length - 1) % TAB_KEYS.length : e.key === "Home" ? 0 : e.key === "End" ? TAB_KEYS.length - 1 : null;
    if (n === null) return;
    e.preventDefault();
    setTab(TAB_KEYS[n]);
    document.getElementById(`tab-${TAB_KEYS[n]}`)?.focus();
  };
  const calls = initial.calls.map((c) => ({ ...c, prospect: byId(c.prospectId), scriptTitle: initial.scripts.find((s) => s.id === c.script)?.title, done: !!called[c.id] })).map((c) => ({ ...c, who: c.prospect.owner === "Claude" ? "Chris" : c.prospect.owner }));
  const tabs = [
    ["approvals", "Approval queue", queue.length],
    ["run", "Today’s run", null],
    ["prospects", "Prospects", prospects.length],
    ["calls", "Call list", calls.length],
    ["scripts", "Scripts", initial.scripts.length],
    ["partners", "Partners", partners.length],
  ];

  const foundToday = prospects.filter((p) => p.found === "Today").length;
  const demoOwners = [...new Set(prospects.filter((p) => p.phase === "Demo in progress").map((p) => p.owner))];
  const tile = "bg-surface border border-border rounded-admin p-4 flex flex-col gap-1 min-w-0 text-left";

  return (
    <>
      <PageHead eyebrow="Outreach · daily prospecting with Claude Cowork" title="Outreach">
        <button type="button" className={btnSecondary} onClick={() => setDialog({ type: "log" })}>
          Log outreach
        </button>
        <button type="button" className={btnPrimary} onClick={startRun} disabled={run.status === "running"}>
          <Icon name="send" />
          {run.status === "running" ? "Running…" : run.status === "done" ? "Run again" : "Run today’s search now"}
        </button>
      </PageHead>

      <DevBar>
        <label className="inline-flex items-center gap-2">
          Prospects state
          <select value={devState} onChange={(e) => (setFailed(false), setDevState(e.target.value))} className={selectCls}>
            <option>live</option>
            <option>loading</option>
            <option>error</option>
            <option>empty</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" onChange={(e) => (dev.fail = e.target.checked)} className="accent-[var(--accent)]" />
          Next request fails
        </label>
      </DevBar>

      <section aria-label="Today" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3 mb-6">
        <div className={tile}>
          <span className="text-muted-2">Prospects found today</span>
          <span className="text-[26px] font-medium leading-none">{foundToday}</span>
          <span className="text-[12px] text-muted-2">of {stats.dailyGoal} daily goal</span>
        </div>
        <button type="button" onClick={() => setTab("approvals")} className={`${tile} cursor-pointer hover:border-border-2`}>
          <span className="text-muted-2">Awaiting your approval</span>
          <span className="text-[26px] font-medium leading-none">{queue.length}</span>
          <span className="text-[12px] text-muted-2">emails and demos drafted by Claude</span>
        </button>
        <div className={tile}>
          <span className="text-muted-2">Emails sent this week</span>
          <span className="text-[26px] font-medium leading-none">{sentWeek}</span>
          <span className="text-[12px] text-muted-2">{stats.repliesWeek} replies</span>
        </div>
        <div className={tile}>
          <span className="text-muted-2">Demos in progress</span>
          <span className="text-[26px] font-medium leading-none">{prospects.filter((p) => p.phase === "Demo in progress").length}</span>
          <span className="text-[12px] text-muted-2">{demoOwners.length ? demoOwners.join(", ") : "None right now"}</span>
        </div>
        <Link href="/admin/leads" className={`${tile} hover:border-border-2`}>
          <span className="text-muted-2">Became leads this month</span>
          <span className="text-[26px] font-medium leading-none">{prospects.filter((p) => p.phase === "Became a lead").length}</span>
          <span className="text-[12px] text-muted-2">feeds the {money(TARGETS.signed)} signed target</span>
        </Link>
        <Link href="/admin" className={`${tile} hover:border-border-2`}>
          <span className="text-muted-2">Contacts this week</span>
          <span className="text-[26px] font-medium leading-none">{contactsWeek}</span>
          <span className="text-[12px] text-muted-2">of the {stats.weeklyGoal[0]}–{stats.weeklyGoal[1]} weekly goal</span>
        </Link>
      </section>

      <div role="tablist" aria-label="Outreach views" className="flex gap-1 border-b border-border mb-5 overflow-x-auto">
        {tabs.map(([k, label, count], i) => (
          <button
            key={k}
            id={`tab-${k}`}
            type="button"
            role="tab"
            aria-selected={tab === k}
            aria-controls={`panel-${k}`}
            tabIndex={tab === k ? 0 : -1}
            onClick={() => setTab(k)}
            onKeyDown={(e) => onTabKey(e, i)}
            className={`min-h-11 px-4 whitespace-nowrap bg-transparent border-0 border-b-2 -mb-px text-[13px] cursor-pointer ${tab === k ? "border-fg text-fg font-medium" : "border-transparent text-muted-2 hover:text-fg"}`}
          >
            {label}
            {count != null ? <span className="ml-1.5 text-[12px] text-muted-2 tabular-nums">{count}</span> : null}
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0} className="outline-offset-4">
        {tab === "approvals" ? (
          <ApprovalQueue
            queue={queue}
            loading={devState === "loading"}
            busyId={busyId}
            onApprove={(d) => approve(d, d.kind === "email" ? { to: (drafts[d.id]?.to || d.to).replace(/[[\]]/g, ""), subject: drafts[d.id]?.subject || d.subject, body: drafts[d.id]?.body || d.body } : undefined)}
            onEdit={(d) => setDialog({ type: "draft", id: d.id })}
            onSkip={skip}
          />
        ) : null}
        {tab === "run" ? <RunTab run={run} runInfo={initial.run} onRun={startRun} onReview={() => setTab("approvals")} /> : null}
        {tab === "prospects" ? <ProspectsTab prospects={prospects} state={prospectState} onOpen={setSel} onRetry={retry} onRun={startRun} onLog={() => setDialog({ type: "log" })} /> : null}
        {tab === "calls" ? (
          <CallsTab calls={calls} contactsWeek={contactsWeek} goal={stats.weeklyGoal} onOpen={setSel} onLog={(c) => setDialog({ type: "log", prospectId: c.prospectId, kind: "Call", callId: c.id })} onScript={() => setTab("scripts")} />
        ) : null}
        {tab === "scripts" ? (
          <ScriptsTab
            scripts={initial.scripts}
            onCopy={async (sc) => {
              try {
                await navigator.clipboard.writeText(`${sc.title}\n\n${sc.lines.map((l) => `${l.k} ${l.t}`).join("\n")}`);
                showToast("Script copied");
              } catch {
                showToast("Couldn’t copy. Select the text and copy it by hand.", { tone: "error" });
              }
            }}
          />
        ) : null}
        {tab === "partners" ? (
          <PartnersTab
            partners={partners}
            onAdd={() => setDialog({ type: "partner" })}
            onTouch={async (pt) => {
              const res = await api("POST", "/api/admin/outreach/partners", { partnerId: pt.id, touch: true });
              if (!res.ok) return showToast("Couldn’t log the touch. Try again.", { tone: "error" });
              setPartners((ps) => ps.map((x) => (x.id === pt.id ? { ...x, last: "just now", overdue: false } : x)));
              showToast(`Touch logged for ${pt.name}`);
            }}
          />
        ) : null}
      </div>

      <p className="text-[12px] text-muted-2 mt-8 mb-0 max-w-[900px]">
        How it works: Claude Cowork runs each morning against the search brief in Settings, writes prospects to the prospect list, logs every step, and drafts emails into the approval queue. When a demo is assigned to Claude, it builds the demo from what it found and that lands in the same queue. A person approves before anything is sent. “Convert to lead” creates a row in Leads with source “Outreach”.
      </p>

      {selected ? (
        <ProspectDrawer
          p={selected}
          builder={builder}
          onBuilder={setBuilder}
          onClose={() => setSel(null)}
          onChange={change}
          onStartDemo={(id) => setDialog({ type: "handoff", prospectId: id })}
          onLog={(id) => setDialog({ type: "log", prospectId: id })}
          onConvert={convert}
          onNotFit={notFit}
        />
      ) : null}

      {dialog?.type === "draft" && queue.find((d) => d.id === dialog.id) ? (
        <EmailEditor
          item={queue.find((d) => d.id === dialog.id)}
          draft={drafts[dialog.id]}
          onClose={() => setDialog(null)}
          onTweak={(t) => showToast(`Claude is rewriting: ${t.toLowerCase()}`)}
          onSave={async (v) => {
            const item = queue.find((d) => d.id === dialog.id);
            const data = await sendApproval(item, "edit", v);
            if (!data) return false;
            setDrafts((d) => ({ ...d, [item.id]: v }));
            setDialog(null);
            showToast("Draft saved · still in the queue");
            return true;
          }}
          onApprove={(v) => approve(queue.find((d) => d.id === dialog.id), v)}
        />
      ) : null}

      {dialog?.type === "handoff" && byId(dialog.prospectId) ? (
        <HandoffDialog
          prospect={byId(dialog.prospectId)}
          builder={builder}
          onClose={() => setDialog(null)}
          onConfirm={async (notify) => {
            const id = dialog.prospectId;
            const next = builder === "Claude" ? "Claude builds the demo; it comes back here for review before it is sent" : `${builder} builds the demo, then sends the link`;
            const res = await api("PATCH", `/api/admin/outreach/prospects/${id}`, { phase: "Demo in progress", owner: builder, next, demo: { builder, notifyProspect: notify } });
            if (!res.ok) return false;
            setProspects((ps) => ps.map((p) => (p.id === id ? { ...p, phase: "Demo in progress", owner: builder, next } : p)));
            addActivity(id, "Chris", `Assigned the demo to ${builder === "Claude" ? "Claude" : builder}`);
            setDialog(null);
            showToast(`Demo assigned to ${builder === "Claude" ? "Claude Cowork" : builder}`);
            return true;
          }}
        />
      ) : null}

      {dialog?.type === "log" ? (
        <LogDialog
          prospects={prospects}
          startId={dialog.prospectId}
          startKind={dialog.kind}
          callId={dialog.callId}
          onClose={() => setDialog(null)}
          onSaved={(r) => {
            if (r.prospectId) addActivity(r.prospectId, "Chris", `${r.kind} · logged by hand`);
            else {
              const np = { id: `pr_new_${Date.now().toString(36)}`, business: r.business, kind: r.type, area: "[Neighborhood]", site: "—", offerCode: null, offer: "None", phase: "Found", owner: "Chris", last: `${r.kind} logged by hand`, lastWhen: "just now", next: r.nextStep || "Decide the next step", found: "Today", why: ["Added by hand after a conversation"], activity: [{ who: "Chris", text: `${r.kind} · logged by hand`, when: "just now" }] };
              setProspects((ps) => [np, ...ps]);
            }
            if (r.nextStep && r.prospectId) setProspects((ps) => ps.map((p) => (p.id === r.prospectId ? { ...p, next: r.nextStep } : p)));
            if (dialog.callId) setCalled((c) => ({ ...c, [dialog.callId]: true }));
            if (r.counts) setContactsWeek((n) => n + 1);
            setDialog(null);
            showToast(`${r.kind} logged${r.counts ? " · counts toward this week" : ""}`);
          }}
        />
      ) : null}

      {dialog?.type === "partner" ? (
        <PartnerDialog
          onClose={() => setDialog(null)}
          onSaved={(pt) => {
            setPartners((ps) => [...ps, pt]);
            setDialog(null);
            showToast(`${pt.name} added`);
          }}
        />
      ) : null}

      <Toast toast={toast} />
    </>
  );
}
