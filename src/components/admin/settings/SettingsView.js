"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHead, btnPrimary, btnSecondary } from "@/components/admin/ui";
import { NUMBER_RULES, NOTIFY_KEYS, numberError } from "@/lib/admin/sample-settings";
import Toast, { useToast } from "./Toast";
import { GeneralTab, TeamTab, CatalogTab, TemplatesTab, OutreachTab, NotificationsTab } from "./Tabs";
import { InviteDialog, RoleDialog, RemoveDialog, KeyDialog, PriceDialog, TemplateDialog } from "./Dialogs";

const DEV = false;
const TABS = [
  ["general", "General"],
  ["team", "Team"],
  ["catalog", "Offer catalog"],
  ["templates", "Templates"],
  ["outreach", "Outreach"],
  ["notifications", "Notifications"],
];
const TAB_KEYS = TABS.map((t) => t[0]);

// Settings. The tab follows ?tab= (the account menu links to /admin/settings?tab=team). This component reads
// useSearchParams, so the page wraps it in <Suspense>. Fields in General, Outreach and Notifications are drafts that
// the "unsaved changes" bar saves in one PATCH. Team, catalog and template edits save from their own dialogs.
export default function SettingsView({ initial }) {
  const params = useSearchParams();
  const wanted = params.get("tab");
  const tab = TAB_KEYS.includes(wanted) ? wanted : "general";

  const [role, setRole] = useState(initial.me.role); // from the session; the dev switch below changes it for the preview only
  const [base, setBase] = useState(initial.values);
  const [values, setValues] = useState(initial.values);
  const [team, setTeam] = useState(initial.team);
  const [catalog, setCatalog] = useState(initial.catalog);
  const [history, setHistory] = useState(initial.history);
  const [proposalTpls, setProposalTpls] = useState(initial.proposalTemplates);
  const [emailTpls, setEmailTpls] = useState(initial.emailTemplates);
  const [listState, setListState] = useState("live"); // live | loading | error (real fetch)
  const [forced, setForced] = useState(null); // dev-only preview of loading / error / empty
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [toast, showToast] = useToast();
  const tablist = useRef(null);

  const locked = role !== "owner";
  const me = {...initial.me, label:initial.me.role==="owner"?"Owner":"Builder"};
  const state = forced || (listState === "live" && (!team.length ? "empty" : "live")) || listState;
  const catalogState = forced || (listState === "live" && !catalog.length ? "empty" : listState);
  const tplState = forced || (listState === "live" && !proposalTpls.length && !emailTpls.length ? "empty" : listState);

  const changed = Object.keys(values).filter((k) => values[k] !== base[k]);
  const errors = {};
  for (const k of Object.keys(NUMBER_RULES)) {
    const msg = numberError(k, values[k]);
    if (msg) errors[k] = msg;
  }
  const hasErrors = Object.keys(errors).length > 0;
  const dirty = changed.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (key) => (val) => setValues((cur) => ({ ...cur, [key]: val }));

  function goTab(key) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", key);
    window.history.replaceState(null, "", url.pathname + url.search);
  }

  function onTabKey(e) {
    const i = TAB_KEYS.indexOf(tab);
    let n = null;
    if (e.key === "ArrowRight") n = (i + 1) % TAB_KEYS.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + TAB_KEYS.length) % TAB_KEYS.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = TAB_KEYS.length - 1;
    if (n === null) return;
    e.preventDefault();
    goTab(TAB_KEYS[n]);
    tablist.current?.querySelector(`#tab-${TAB_KEYS[n]}`)?.focus();
  }

  async function save() {
    if (hasErrors || saving) return;
    const patch = Object.fromEntries(changed.filter((k) => !locked || NOTIFY_KEYS.includes(k)).map((k) => [k, values[k]]));
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: patch }) });
      if (!res.ok) throw new Error(String(res.status));
      setBase((b) => ({ ...b, ...patch }));
      showToast("Settings saved");
    } catch {
      showToast("Settings didn’t save. Your changes are still here; try again.", { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  const discard = () => setValues(base);

  async function reload() {
    setForced(null);
    setListState("loading");
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      setTeam(d.team);
      setCatalog(d.catalog);
      setHistory(d.history);
      setProposalTpls(d.proposalTemplates);
      setEmailTpls(d.emailTemplates);
      setListState("live");
    } catch {
      setListState("error");
    }
  }

  const close = () => setDialog(null);
  const first = (name) => name.split(" ")[0];
  const owners = team.filter((m) => m.role === "Owner").length;
  const twoFactorOff = team.some((m) => m.tfa === "Off");

  return (
    <>
      <PageHead eyebrow="Settings" title="Settings">
        <span className="inline-flex items-center text-[12px] text-muted-2 border border-border-2 rounded-full px-3 py-1.5">
          Signed in as {me.name} · {me.label}
        </span>
      </PageHead>

      {DEV ? (
        <div role="group" aria-label="Development preview" className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-muted-2">
          <span>Dev preview:</span>
          {["owner", "builder"].map((r) => (
            <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)} className={`min-h-7 px-2.5 rounded-full border text-[12px] cursor-pointer ${role === r ? "border-fg text-fg" : "border-border-2 text-muted-2 bg-transparent"}`}>
              {r}
            </button>
          ))}
          <span aria-hidden="true">·</span>
          {[null, "loading", "empty", "error"].map((s) => (
            <button key={s || "live"} type="button" aria-pressed={forced === s} onClick={() => setForced(s)} className={`min-h-7 px-2.5 rounded-full border text-[12px] cursor-pointer ${forced === s ? "border-fg text-fg" : "border-border-2 text-muted-2 bg-transparent"}`}>
              {s || "live"}
            </button>
          ))}
        </div>
      ) : null}

      <div ref={tablist} role="tablist" aria-label="Settings sections" onKeyDown={onTabKey} className="flex gap-1 border-b border-border overflow-x-auto mb-5">
        {TABS.map(([k, label]) => {
          const on = tab === k;
          return (
            <button
              key={k}
              id={`tab-${k}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`panel-${k}`}
              tabIndex={on ? 0 : -1}
              onClick={() => goTab(k)}
              className={`min-h-10 px-3.5 -mb-px border-0 border-b-2 bg-transparent text-[13px] font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${on ? "text-fg border-fg" : "text-muted-2 border-transparent hover:text-fg"}`}
            >
              {label}
              {k === "team" && twoFactorOff ? (
                <>
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-warning" />
                  <span className="sr-only">Two-factor is off for someone</span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={-1} className={dirty ? "pb-20" : ""}>
        {tab === "general" ? <GeneralTab v={values} set={set} errors={errors} locked={locked} integrations={initial.integrations} /> : null}
        {tab === "team" ? (
          <TeamTab
            team={team}
            meId={me.id}
            locked={locked}
            state={state}
            onRetry={reload}
            onInvite={() => setDialog({ type: "invite" })}
            onRole={(m) => setDialog({ type: "role", id: m.id })}
            onRemove={(m) => setDialog({ type: "remove", id: m.id })}
            onKey={() => setDialog({ type: "key" })}
          />
        ) : null}
        {tab === "catalog" ? <CatalogTab catalog={catalog} history={history} locked={locked} state={catalogState} onRetry={reload} onEdit={(o) => setDialog({ type: "price", code: o.code })} /> : null}
        {tab === "templates" ? (
          <TemplatesTab proposal={proposalTpls} email={emailTpls} locked={locked} state={tplState} onRetry={reload} onEdit={(t, isEmail) => setDialog({ type: "template", id: t.id, isEmail })} />
        ) : null}
        {tab === "outreach" ? <OutreachTab v={values} set={set} errors={errors} locked={locked} lastRun={initial.lastRun} /> : null}
        {tab === "notifications" ? <NotificationsTab v={values} set={set} /> : null}
      </div>

      {dirty ? (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="fixed left-1/2 -translate-x-1/2 bottom-7 z-[350] max-w-[calc(100vw-24px)] flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2 py-2.5 pl-[18px] pr-2.5 rounded-[28px] bg-surface border border-border-2 text-[13px] shadow-[0_20px_50px_rgba(0,0,0,calc(.4*var(--shadow-k)))]"
        >
          <span className="text-muted-2">{changed.length === 1 ? "1 change" : `${changed.length} changes`} unsaved</span>
          {hasErrors ? <span className="text-danger">Fix the fields in red</span> : null}
          <button type="button" className={btnSecondary} onClick={discard} disabled={saving}>
            Discard
          </button>
          <button type="button" className={btnPrimary} onClick={save} disabled={hasErrors || saving} aria-busy={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      ) : null}

      {dialog?.type === "invite" ? (
        <InviteDialog
          onClose={close}
          onDone={(member) => {
            setTeam((t) => [...t, member]);
            close();
            showToast(`Invite sent to ${member.email}`);
          }}
        />
      ) : null}
      {dialog?.type === "role" ? (
        (() => {
          const m = team.find((x) => x.id === dialog.id);
          return m ? (
            <RoleDialog
              member={m}
              owners={owners}
              onClose={close}
              onDone={(newRole) => {
                setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, role: newRole } : x)));
                close();
                showToast(`${first(m.name)} is now ${newRole}`);
              }}
            />
          ) : null;
        })()
      ) : null}
      {dialog?.type === "remove" ? (
        (() => {
          const m = team.find((x) => x.id === dialog.id);
          const others = team.filter((x) => x.human && x.id !== dialog.id && !x.pending);
          return m ? (
            <RemoveDialog
              member={m}
              others={others}
              onClose={close}
              onDone={(to) => {
                setTeam((t) => t.filter((x) => x.id !== m.id));
                close();
                showToast(`${first(m.name)} removed. Open work moved to ${first(to?.name || "the owner")}.`);
              }}
            />
          ) : null;
        })()
      ) : null}
      {dialog?.type === "key" ? (
        <KeyDialog
          onClose={close}
          onDone={() => {
            close();
            showToast("New agent key created. It is shown once, in Claude’s setup.");
          }}
        />
      ) : null}
      {dialog?.type === "price" ? (
        (() => {
          const o = catalog.find((x) => x.code === dialog.code);
          return o ? (
            <PriceDialog
              offer={o}
              onClose={close}
              onDone={({ offer, history: entry }) => {
                setCatalog((c) => c.map((x) => (x.code === offer.code ? { ...x, setup: offer.setup, monthly: offer.monthly, changed: offer.changed } : x)));
                setHistory((h) => [entry, ...h]);
                close();
                showToast(`${o.name} updated. New proposals use it from now.`);
              }}
            />
          ) : null;
        })()
      ) : null}
      {dialog?.type === "template" ? (
        (() => {
          const list = dialog.isEmail ? emailTpls : proposalTpls;
          const t = list.find((x) => x.id === dialog.id);
          return t ? (
            <TemplateDialog
              template={t}
              isEmail={dialog.isEmail}
              onClose={close}
              onDone={(saved) => {
                const upd = (l) => l.map((x) => (x.id === t.id ? { ...x, subject: saved.subject ?? x.subject, body: saved.body, custom: true } : x));
                if (dialog.isEmail) setEmailTpls(upd);
                else setProposalTpls(upd);
                close();
                showToast("Template saved");
              }}
            />
          ) : null;
        })()
      ) : null}

      <Toast toast={toast} raised={dirty} />
    </>
  );
}
