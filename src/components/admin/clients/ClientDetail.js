"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Chip, btnPrimary, btnSecondary } from "@/components/admin/ui";
import { STAGE_TONE } from "@/lib/admin/sample-clients";
import { AddContactDialog, CancelPlanDialog, EditDialog, InviteDialog, RevokeDialog, StripeDialog } from "./ClientDialogs";
import { Contacts, Files, Invoices, Notes, Overview, PortalUsers, Projects, Subscriptions } from "./ClientTabs";
import { Toast, api, useToast } from "./kit";

const TABS = [
  ["overview", "Overview"],
  ["contacts", "Contacts"],
  ["subscriptions", "Subscriptions"],
  ["projects", "Projects"],
  ["invoices", "Invoices"],
  ["files", "Files"],
  ["portal", "Portal users"],
  ["notes", "Notes"],
];

// One client. `initial` is the Client from GET /api/admin/clients/[id]; edits are sent to the stubs and merged here.
export default function ClientDetail({ initial }) {
  const [client, setClient] = useState(initial);
  const [tab, setTab] = useState("overview");
  const [dialog, setDialog] = useState(null); // { type, contactId?, user? }
  const [tasks, setTasks] = useState(initial.tasks);
  const [files, setFiles] = useState(initial.files);
  const [filesVisible, setFilesVisible] = useState(true);
  const [portalUsers, setPortalUsers] = useState(initial.portalUsers);
  const [notes, setNotes] = useState(initial.notes);
  const [saveState, setSaveState] = useState("idle");
  const [savedAt, setSavedAt] = useState(initial.notesSavedAt);
  const [toast, showToast] = useToast();
  const saveTimer = useRef(null);
  const tabRefs = useRef({});

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const close = () => setDialog(null);
  const open = (type, extra = {}) => setDialog({ type, ...extra });
  const conn = client.stripe.connect;
  const needsConnect = conn.status !== "not-needed";

  const counts = { contacts: client.contacts.length, subscriptions: client.monthly.on ? 1 : 0, projects: 1, invoices: client.invoices.length, files: files.length, portal: portalUsers.length };

  function onTabKey(e, i) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "Home" ? -TABS.length : e.key === "End" ? TABS.length : 0;
    if (!dir) return;
    e.preventDefault();
    const n = Math.abs(dir) > 1 ? (dir < 0 ? 0 : TABS.length - 1) : (i + dir + TABS.length) % TABS.length;
    setTab(TABS[n][0]);
    tabRefs.current[TABS[n][0]]?.focus();
  }

  function changeNotes(text) {
    setNotes(text);
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await api(`/api/admin/clients/${client.id}`, { method: "PATCH", body: { notes: text } });
        setSaveState("saved");
        setSavedAt("just now by Chris");
      } catch {
        setSaveState("failed");
      }
    }, 700);
  }

  const m = client.monthly;
  const planShort = m.on ? `$${client.monthly.price}/mo · ${m.status}` : "Self-managed · no monthly";

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted-2 mb-4">
        <Link href="/admin/clients" className="hover:text-fg">
          Clients
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-fg">
          {client.business}
        </span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="text-[11px] tracking-[.3em] uppercase text-muted-2 mb-2">
            Client · since {client.since}
            {client.leadId ? ` · from lead via ${client.source}` : ` · ${client.source}`}
            <span className="md:hidden normal-case tracking-normal ml-2 border border-border-2 rounded-full px-2 py-0.5">Sample data</span>
          </div>
          <h1 className="font-display font-normal text-[clamp(32px,4vw,44px)] leading-none m-0">{client.business}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Chip tone={STAGE_TONE[client.stage]}>{client.stage}</Chip>
            <Chip>
              {client.offer} · {client.offerCode}
            </Chip>
            <Chip tone={m.on ? "accent" : "muted"}>{planShort}</Chip>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-2">
              <span aria-hidden="true" className="w-6 h-6 rounded-full bg-surface border border-border-2 inline-flex items-center justify-center text-[11px] text-fg">
                {client.owner[0]}
              </span>
              {client.owner}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={() => open("edit")} className={btnSecondary}>
            Edit client
          </button>
          <button type="button" onClick={() => open("invite")} className={btnSecondary}>
            Invite to portal
          </button>
          <Link href="/admin/invoices?new=1" className={btnSecondary}>
            New invoice
          </Link>
          <Link href="/portal" className={btnSecondary}>
            Open portal <span aria-hidden="true">↗</span>
          </Link>
          <Link href="/app" className={btnPrimary}>
            Their admin <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <div role="tablist" aria-label="Client sections" className="flex gap-1 overflow-x-auto border-b border-border mb-5">
        {TABS.map(([key, label], i) => {
          const on = tab === key;
          return (
            <button
              key={key}
              ref={(el) => {
                tabRefs.current[key] = el;
              }}
              id={`tab-${key}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`panel-${key}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(key)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`min-h-10 px-3.5 text-[13px] whitespace-nowrap bg-transparent border-0 border-b-2 -mb-px cursor-pointer inline-flex items-center gap-2 ${on ? "border-fg text-fg font-medium" : "border-transparent text-muted-2 hover:text-fg"}`}
            >
              {label}
              {counts[key] != null ? <span className="text-xs text-muted-2 tabular-nums">{counts[key]}</span> : null}
            </button>
          );
        })}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0} className="outline-offset-4">
        {tab === "overview" ? (
          <Overview
            client={client}
            tasks={tasks}
            onToggleTask={(i) => setTasks((ts) => ts.map((t, j) => (j === i ? { ...t, done: !t.done } : t)))}
            onTab={setTab}
            onEdit={() => open("edit")}
            onStripe={() => open("stripe")}
          />
        ) : null}
        {tab === "contacts" ? <Contacts client={client} onAdd={() => open("contact")} onInvite={(id) => open("invite", { contactId: id })} onToast={showToast} /> : null}
        {tab === "subscriptions" ? <Subscriptions client={client} onEdit={() => open("edit")} onCancel={() => open("cancel")} /> : null}
        {tab === "projects" ? <Projects client={client} /> : null}
        {tab === "invoices" ? <Invoices client={client} /> : null}
        {tab === "files" ? (
          <Files
            client={client}
            files={files}
            visible={filesVisible}
            onVisible={() => setFilesVisible((v) => !v)}
            onAdd={(list) => {
              setFiles((f) => [...f, ...list.map((x, i) => ({ id: `f_new_${Date.now()}_${i}`, ext: (x.name.split(".").pop() || "FILE").slice(0, 4).toUpperCase(), name: x.name, meta: `${Math.max(1, Math.round(x.size / 1024))} KB · just added` }))]);
              showToast(`${list.length} file${list.length === 1 ? "" : "s"} added`);
            }}
          />
        ) : null}
        {tab === "portal" ? (
          <PortalUsers
            client={client}
            users={portalUsers}
            onInvite={(id) => open("invite", { contactId: id })}
            onResend={async (u) => {
              try {
                await api(`/api/admin/clients/${client.id}/invite`, { method: "POST", body: { contactId: u.contactId, can: ["project"] } });
                showToast(`Invite resent to ${u.email}`);
              } catch {
                showToast("Couldn’t resend the invite. Try again.", { tone: "error" });
              }
            }}
            onRevoke={(u) => open("revoke", { user: u })}
          />
        ) : null}
        {tab === "notes" ? <Notes client={client} notes={notes} onChange={changeNotes} saveState={saveState} savedAt={savedAt} /> : null}
      </div>

      <p className="text-[13px] text-muted-2 mt-6 mb-0">
        Reads <code className="text-xs">GET /api/admin/clients/[id]</code>; each tab loads its own list on first open. Stripe customer, subscription and invoices are Stripe objects mirrored here, never edited by hand.
      </p>

      {dialog?.type === "contact" ? (
        <AddContactDialog
          client={client}
          onClose={close}
          onDone={(contact, invited) => {
            setClient((c) => ({ ...c, contacts: [...c.contacts, contact] }));
            if (invited) setPortalUsers((u) => [...u, { contactId: contact.id, name: contact.name, email: contact.email, status: "Invited", last: "never · expires in 7d", can: "Project updates" }]);
            close();
            showToast(invited ? "Contact added · portal invite sent" : "Contact added");
          }}
        />
      ) : null}
      {dialog?.type === "invite" ? (
        <InviteDialog
          client={client}
          contactId={dialog.contactId}
          onClose={close}
          onDone={(contactId, email) => {
            setClient((c) => ({ ...c, contacts: c.contacts.map((ct) => (ct.id === contactId && ct.access === "Not invited" ? { ...ct, access: "Invited · just now" } : ct)) }));
            setPortalUsers((u) => (u.some((x) => x.email === email) ? u : [...u, { contactId, name: client.contacts.find((ct) => ct.id === contactId)?.name || email, email, status: "Invited", last: "never · expires in 7d", can: "Project updates" }]));
            close();
            showToast("Invite sent · link works for 7 days");
          }}
        />
      ) : null}
      {dialog?.type === "stripe" && needsConnect ? (
        <StripeDialog
          client={client}
          onClose={close}
          onConnectStarted={(connect) => {
            setClient((c) => ({ ...c, stripe: { ...c.stripe, connect: { status: "pending", accountId: connect.accountId } } }));
            showToast("Stripe onboarding started");
          }}
          onMarkConnected={() => {
            setClient((c) => ({ ...c, stripe: { ...c.stripe, connect: { ...c.stripe.connect, status: "connected" } } }));
            showToast("Stripe connected · checkout goes to their own account");
          }}
        />
      ) : null}
      {dialog?.type === "edit" ? (
        <EditDialog
          client={client}
          onClose={close}
          onDone={(_next, body) => {
            setClient((c) => ({
              ...c,
              business: body.business,
              legalName: body.legalName,
              address: body.address,
              offerCode: body.offerCode,
              stage: body.stage,
              owner: body.owner,
              domain: body.domain,
              template: body.template,
              monthly: { ...c.monthly, on: body.monthly },
            }));
            close();
            showToast("Client saved · audit line added");
          }}
        />
      ) : null}
      {dialog?.type === "cancel" ? (
        <CancelPlanDialog
          client={client}
          onClose={close}
          onDone={() => {
            setClient((c) => ({ ...c, monthly: { ...c.monthly, status: "cancels at period end" } }));
            close();
            showToast("Plan cancels at period end · handover pack scheduled");
          }}
        />
      ) : null}
      {dialog?.type === "revoke" ? (
        <RevokeDialog
          user={dialog.user}
          onClose={close}
          onDone={() => {
            setPortalUsers((us) => us.filter((x) => x.email !== dialog.user.email));
            close();
            showToast(`Access revoked for ${dialog.user.name}`);
          }}
        />
      ) : null}
      <Toast toast={toast} />
    </>
  );
}
