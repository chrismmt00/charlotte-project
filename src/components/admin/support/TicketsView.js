"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHead, btnPrimary, btnSecondary } from "@/components/admin/ui";
import {
  DevStates,
  EmptyCard,
  FieldRow,
  FilterChips,
  FormError,
  Kpi,
  KpiGrid,
  ListError,
  ListSkeleton,
  Modal,
  Note,
  TableBox,
  Toast,
  api,
  btnSm,
  checkClass,
  checkLabelClass,
  emptyRowClass,
  hours,
  inputClass,
  tableClass,
  tdClass,
  textareaClass,
  theadRowClass,
  thClass,
  trClass,
  useListState,
  useSubmit,
  useToast,
} from "@/components/admin/billing/kit";
import { ASSIGNEES, PRIORITIES, TICKET_SOURCES, TICKET_STATUSES, TICKET_TYPES, ticketHours } from "@/lib/admin/sample-support";

const STATUS_COLOR = { Open: "text-accent-light", "In progress": "text-accent", "Waiting on client": "text-muted-2", Closed: "text-success" };
const FILTERS = ["All", ...TICKET_STATUSES];
const COLS = ["Ticket", "Client", "Type", "Status", "Assigned", "Opened", "Actions"];
const sel = `${inputClass} cursor-pointer`;

export default function TicketsView({ initialTickets, clients }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState("All");
  const [dialog, setDialog] = useState(false);
  const [message, toast] = useToast();
  const list = useListState("/api/admin/tickets");
  const [dev, setDev] = useState("live");
  const state = dev === "live" ? list.state : dev;

  const count = (s) => tickets.filter((t) => t.status === s).length;
  const rows = tickets.filter((t) => filter === "All" || t.status === filter);
  const capped = clients.filter((c) => c.capHours > 0);
  const usedAll = Math.round(capped.reduce((a, c) => a + c.usedHours, 0) * 10) / 10;
  const capAll = capped.reduce((a, c) => a + c.capHours, 0);
  const clientById = Object.fromEntries(clients.map((c) => [c.id, c]));

  const setStatus = async (t, status) => {
    const prev = t.status;
    setTickets((xs) => xs.map((x) => (x.id === t.id ? { ...x, status } : x)));
    try {
      await api(`/api/admin/tickets/${t.id}`, { method: "PATCH", body: { status } });
      toast(`${t.num} set to ${status}`);
    } catch (e) {
      setTickets((xs) => xs.map((x) => (x.id === t.id ? { ...x, status: prev } : x)));
      toast(`Couldn’t change ${t.num}. ${e.message}`);
    }
  };

  return (
    <>
      <PageHead eyebrow="Tickets · support and small changes" title="Support">
        <button type="button" className={btnPrimary} onClick={() => setDialog(true)}>
          New ticket
        </button>
      </PageHead>

      <KpiGrid label="Totals">
        <Kpi label="Open" value={count("Open") + count("In progress")} note="waiting on us" />
        <Kpi label="Waiting on client" value={count("Waiting on client")} note="asked a question" />
        <Kpi label="Closed this week" value={count("Closed")} note="median [x]h to close" />
        <Kpi label="Plan hours used" value={`${hours(usedAll)} / ${capAll}`} note="this month, all clients" />
      </KpiGrid>

      <FilterChips label="Filter tickets" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f, label: f, count: f === "All" ? tickets.length : count(f) }))} />

      {state === "loading" ? <ListSkeleton label="Loading tickets" rows={5} cols="2.2fr 1fr .8fr 1fr .8fr .8fr .6fr" /> : null}
      {state === "error" ? (
        <ListError
          title="Couldn’t load tickets"
          retrying={list.retrying}
          onRetry={async () => {
            setDev("live");
            await list.retry();
          }}
        >
          <code className="font-mono text-xs">GET /api/admin/tickets</code> failed. The portal still accepts new tickets. Try again.
        </ListError>
      ) : null}
      {state === "empty" || (state === "live" && tickets.length === 0) ? (
        <EmptyCard
          title="No tickets"
          actions={
            <button type="button" className={btnPrimary} onClick={() => setDialog(true)}>
              New ticket
            </button>
          }
        >
          Quiet is good. Tickets arrive from the portal support form and [support address]; log a text or call by hand with New ticket.
        </EmptyCard>
      ) : null}

      {state === "live" && tickets.length > 0 ? (
        <TableBox footer={rows.length === 0 ? <p className={emptyRowClass}>Nothing with that status.</p> : null}>
          <table className={`${tableClass} min-w-[900px]`}>
            <caption className="sr-only">Tickets</caption>
            <thead>
              <tr className={theadRowClass}>
                {COLS.map((h) => (
                  <th key={h} scope="col" className={`${thClass} ${h === "Actions" ? "text-right" : ""}`}>
                    {h === "Actions" ? <span className="sr-only">Actions</span> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const c = clientById[t.clientId];
                const near = c && c.capHours > 0 && c.usedHours / c.capHours >= 0.75 && t.status !== "Closed";
                return (
                  <tr key={t.id} className={trClass}>
                    <td className={tdClass}>
                      <span className="flex flex-col gap-0.5">
                        {t.local ? (
                          <span className="font-medium text-fg">{t.subject}</span>
                        ) : (
                          <Link href={`/admin/support/${t.id}`} className="font-medium text-fg">
                            {t.subject}
                          </Link>
                        )}
                        <span className="text-muted">
                          {t.num} · {t.source} ·{" "}
                          <span className={near ? "text-warning" : ""}>{t.quoteRequest ? "quote request" : `${hours(ticketHours(t))} h logged${c && c.capHours ? ` · client ${hours(c.usedHours)} of ${c.capHours}` : ""}`}</span>
                        </span>
                      </span>
                    </td>
                    <td className={`${tdClass} text-muted-2`}>{t.client}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <span className="text-xs border border-border-2 rounded-full px-2.5 py-1 text-muted-2 whitespace-nowrap">{t.type}</span>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <label htmlFor={`st-${t.id}`} className="sr-only">
                        Status for {t.num}
                      </label>
                      <select id={`st-${t.id}`} value={t.status} onChange={(e) => setStatus(t, e.target.value)} className={`min-h-9 rounded-full border border-border-2 bg-surface-2 px-3 text-[13px] cursor-pointer ${STATUS_COLOR[t.status]}`}>
                        {TICKET_STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className={`${tdClass} text-muted-2 whitespace-nowrap`}>{t.assigned}</td>
                    <td className={`${tdClass} text-muted whitespace-nowrap`}>{t.opened}</td>
                    <td className={`${tdClass} text-right`}>
                      {t.local ? null : (
                        <Link href={`/admin/support/${t.id}`} aria-label={`Open ${t.num}`} className={btnSm}>
                          Open
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableBox>
      ) : null}

      <p className="m-0 text-[13px] text-muted">
        Tickets come from the portal’s support form, email to [support address], or a text we log by hand. Each counts against the client’s plan hours, capped in their proposal (caps shown are placeholders). Clients without a monthly plan get a quote instead of a ticket.
      </p>

      <DevStates value={dev} onChange={setDev} />

      {dialog ? (
        <NewTicketDialog
          clients={clients}
          onClose={() => setDialog(false)}
          onCreated={(t, quote) => {
            setTickets((xs) => [t, ...xs]);
            setDialog(false);
            if (quote) {
              toast("Quote request saved · proposal draft opened");
              router.push("/admin/proposals?new=1");
            } else toast(`${t.num} created · assigned to ${t.assigned}`);
          }}
        />
      ) : null}

      <Toast message={message} />
    </>
  );
}

function NewTicketDialog({ clients, onClose, onCreated }) {
  const [f, setF] = useState({ clientId: clients[0].id, requester: "[Owner]", type: "Small change", source: "Text", subject: "", body: "", assigned: "Demetrius", priority: "Normal", counts: true });
  const [errors, setErrors] = useState({});
  const sub = useSubmit();
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const client = clients.find((c) => c.id === f.clientId);
  const quote = !client.plan;
  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!f.subject.trim()) next.subject = "Give the ticket a subject.";
    if (!f.body.trim()) next.body = "Write what they need.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const out = await sub.run(() => api("/api/admin/tickets", { method: "POST", body: { ...f, subject: f.subject.trim() } }));
    if (out) {
      onCreated(
        {
          id: out.ticket.id,
          num: out.ticket.num,
          clientId: client.id,
          client: client.name,
          subject: f.subject.trim(),
          type: quote ? "Quote request" : f.type,
          status: "Open",
          assigned: f.assigned,
          opened: "Just now",
          source: f.source.toLowerCase() === "email" ? "email" : `${f.source.toLowerCase()}, logged by Chris`,
          quoteRequest: out.ticket.quoteRequest,
          time: [],
          local: true,
        },
        out.ticket.quoteRequest
      );
    }
  };
  return (
    <Modal
      id="nt"
      eyebrow="Logged by the team"
      title="New ticket"
      w={600}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="nt-form" className={btnPrimary} disabled={sub.submitting}>
            {sub.submitting ? "Saving…" : quote ? "Create quote request" : "Create ticket"}
          </button>
        </>
      }
    >
      <form id="nt-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="nt-client" label="Client">
            <select id="nt-client" data-autofocus value={f.clientId} onChange={set("clientId")} className={sel}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.planLabel.split(" · ").slice(-1)[0]}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="nt-contact" label="Who asked">
            <select id="nt-contact" value={f.requester} onChange={set("requester")} className={sel}>
              <option>[Owner]</option>
              <option>[Manager]</option>
              <option>Someone else…</option>
            </select>
          </FieldRow>
          <FieldRow id="nt-type" label="Type">
            <select id="nt-type" value={f.type} onChange={set("type")} className={sel}>
              {TICKET_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="nt-src" label="Came in by">
            <select id="nt-src" value={f.source} onChange={set("source")} className={sel}>
              {TICKET_SOURCES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FieldRow>
        </div>
        <FieldRow id="nt-subj" label="Subject" error={errors.subject}>
          <input id="nt-subj" type="text" value={f.subject} onChange={set("subject")} placeholder="Change Sunday hours on the home page" aria-invalid={!!errors.subject} aria-describedby={errors.subject ? "nt-subj-err" : undefined} className={`${inputClass} ${errors.subject ? "!border-danger" : ""}`} />
        </FieldRow>
        <FieldRow id="nt-body" label="What they need" error={errors.body}>
          <textarea id="nt-body" rows={3} value={f.body} onChange={set("body")} placeholder="Exactly what they said, plus what you promised" aria-invalid={!!errors.body} aria-describedby={errors.body ? "nt-body-err" : undefined} className={`${textareaClass} ${errors.body ? "!border-danger" : ""}`} />
        </FieldRow>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="nt-who" label="Assign to">
            <select id="nt-who" value={f.assigned} onChange={set("assigned")} className={sel}>
              {ASSIGNEES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="nt-pri" label="Priority">
            <select id="nt-pri" value={f.priority} onChange={set("priority")} className={sel}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </FieldRow>
        </div>
        {quote ? (
          <Note tone="fg">
            This client has no monthly plan, so the work is quoted, not ticketed. Saving creates the ticket as a <strong className="font-medium">quote request</strong> and opens a proposal draft.
          </Note>
        ) : client.startsAtLaunch ? (
          <Note>Their monthly plan starts at launch, so there is no hours cap yet. The ticket is still logged.</Note>
        ) : (
          <label className={checkLabelClass}>
            <input type="checkbox" checked={f.counts} onChange={set("counts")} className={checkClass} />
            Counts against plan hours · {hours(client.usedHours)} of {client.capHours} used this month
            {client.usedHours / client.capHours >= 0.75 ? " · near the cap" : ""}
          </label>
        )}
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}
