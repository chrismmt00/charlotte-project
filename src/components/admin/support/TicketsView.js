"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Empty, PageHead, btnPrimary, btnSecondary } from "@/components/admin/ui";
import {
  DevStates,
  FieldRow,
  FilterChips,
  FormError,
  Icon,
  Kpi,
  ListError,
  ListSkeleton,
  Modal,
  Note,
  StatusDot,
  TableBox,
  Toast,
  api,
  checkClass,
  hours,
  inputClass,
  tdClass,
  textareaClass,
  thClass,
  useListState,
  useSubmit,
  useToast,
} from "@/components/admin/billing/kit";
import { ASSIGNEES, PRIORITIES, TICKET_SOURCES, TICKET_STATUSES, TICKET_TYPES, ticketHours } from "@/lib/admin/sample-support";

const DOT = { Open: "accent-light", "In progress": "accent", "Waiting on client": "muted", Closed: "success" };
const FILTERS = ["All", ...TICKET_STATUSES];

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
          <Icon name="plus" size={14} />
          New ticket
        </button>
      </PageHead>

      <section aria-label="Totals" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi label="Open" value={count("Open") + count("In progress")} note="waiting on us" />
        <Kpi label="Waiting on client" value={count("Waiting on client")} note="asked a question" />
        <Kpi label="Closed this week" value={count("Closed")} note="median [x]h to close" />
        <Kpi label="Plan hours used" value={`${hours(usedAll)} / ${capAll}`} note="this month, all clients" />
      </section>

      <FilterChips label="Filter tickets" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f, label: f, count: f === "All" ? tickets.length : count(f) }))} />

      <DevStates value={dev} onChange={setDev} />

      {state === "loading" ? <ListSkeleton label="Loading tickets" rows={5} /> : null}
      {state === "error" ? (
        <ListError title="Couldn’t load tickets" retrying={list.retrying} onRetry={async () => { setDev("live"); await list.retry(); }}>
          <code className="text-[12px]">GET /api/admin/tickets</code> failed. The portal still accepts new tickets. Try again.
        </ListError>
      ) : null}
      {state === "empty" || (state === "live" && tickets.length === 0) ? (
        <Empty title="No tickets" action={<button type="button" className={btnPrimary} onClick={() => setDialog(true)}>New ticket</button>}>
          Quiet is good. Tickets arrive from the portal support form and [support address]; log a text or call by hand with New ticket.
        </Empty>
      ) : null}

      {state === "live" && tickets.length > 0 ? (
        <TableBox>
          <table className="w-full border-collapse min-w-[860px]">
            <caption className="sr-only">Tickets</caption>
            <thead>
              <tr>
                {["Ticket", "Client", "Type", "Status", "Assigned", "Opened", "Actions"].map((h) => (
                  <th key={h} scope="col" className={thClass}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const c = clientById[t.clientId];
                const near = c && c.capHours > 0 && c.usedHours / c.capHours >= 0.75;
                return (
                  <tr key={t.id} className="hover:bg-surface-2">
                    <td className={`${tdClass} max-w-[340px]`}>
                      {t.local ? (
                        <span className="text-fg font-medium">{t.subject}</span>
                      ) : (
                        <Link href={`/admin/support/${t.id}`} className="text-fg font-medium hover:text-accent-light">
                          {t.subject}
                        </Link>
                      )}
                      <div className="text-[12px] text-muted-2">
                        {t.num} · {t.source} ·{" "}
                        <span className={near && t.status !== "Closed" ? "text-warning" : ""}>
                          {t.quoteRequest ? "quote request" : `${hours(ticketHours(t))} h logged${c && c.capHours ? ` · client ${hours(c.usedHours)} of ${c.capHours}` : ""}`}
                        </span>
                      </div>
                    </td>
                    <td className={tdClass}>{t.client}</td>
                    <td className={tdClass}>{t.type}</td>
                    <td className={tdClass}>
                      <span className="inline-flex items-center gap-2">
                        <StatusDot tone={DOT[t.status]} />
                        <label htmlFor={`st-${t.id}`} className="sr-only">
                          Status for {t.num}
                        </label>
                        <select id={`st-${t.id}`} value={t.status} onChange={(e) => setStatus(t, e.target.value)} className="bg-transparent border border-border-2 rounded-[8px] text-[13px] text-fg min-h-9 px-2 cursor-pointer">
                          {TICKET_STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </span>
                    </td>
                    <td className={tdClass}>{t.assigned}</td>
                    <td className={`${tdClass} text-muted-2 whitespace-nowrap`}>{t.opened}</td>
                    <td className={tdClass}>
                      {t.local ? null : (
                        <Link href={`/admin/support/${t.id}`} aria-label={`Open ${t.num}`} className="text-accent-light hover:text-fg text-[13px]">
                          Open
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="m-0 p-6 text-center text-muted-2">Nothing with that status.</p> : null}
        </TableBox>
      ) : null}

      <p className="text-[12px] text-muted-2 mt-4 mb-0 max-w-[820px]">
        Tickets come from the portal’s support form, email to [support address], or a text we log by hand. Each counts against the client’s plan hours, capped in their proposal (caps shown are placeholders). Clients without a monthly plan get a quote instead of a ticket.
      </p>

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
        <FieldRow id="nt-client" label="Client">
          <select id="nt-client" data-autofocus value={f.clientId} onChange={set("clientId")} className={inputClass}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.planLabel.split(" · ").slice(-1)[0]}
              </option>
            ))}
          </select>
        </FieldRow>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="nt-contact" label="Who asked">
            <select id="nt-contact" value={f.requester} onChange={set("requester")} className={inputClass}>
              <option>[Owner]</option>
              <option>[Manager]</option>
              <option>Someone else…</option>
            </select>
          </FieldRow>
          <FieldRow id="nt-type" label="Type">
            <select id="nt-type" value={f.type} onChange={set("type")} className={inputClass}>
              {TICKET_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="nt-src" label="Came in by">
            <select id="nt-src" value={f.source} onChange={set("source")} className={inputClass}>
              {TICKET_SOURCES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="nt-who" label="Assign to">
            <select id="nt-who" value={f.assigned} onChange={set("assigned")} className={inputClass}>
              {ASSIGNEES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FieldRow>
        </div>
        <FieldRow id="nt-subj" label="Subject" error={errors.subject}>
          <input id="nt-subj" type="text" value={f.subject} onChange={set("subject")} placeholder="Change Sunday hours on the home page" aria-invalid={!!errors.subject} aria-describedby={errors.subject ? "nt-subj-err" : undefined} className={`${inputClass} ${errors.subject ? "border-danger" : ""}`} />
        </FieldRow>
        <FieldRow id="nt-body" label="What they need" error={errors.body}>
          <textarea id="nt-body" rows={3} value={f.body} onChange={set("body")} placeholder="Exactly what they said, plus what you promised" aria-invalid={!!errors.body} aria-describedby={errors.body ? "nt-body-err" : undefined} className={`${textareaClass} ${errors.body ? "border-danger" : ""}`} />
        </FieldRow>
        <FieldRow id="nt-pri" label="Priority">
          <select id="nt-pri" value={f.priority} onChange={set("priority")} className={inputClass}>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </FieldRow>
        {quote ? (
          <Note tone="accent">
            This client has no monthly plan, so the work is quoted, not ticketed. Saving creates the ticket as a <strong className="font-medium">quote request</strong> and opens a proposal draft.
          </Note>
        ) : client.startsAtLaunch ? (
          <Note>Their monthly plan starts at launch, so there is no hours cap yet. The ticket is still logged.</Note>
        ) : (
          <label className="flex items-center gap-2.5 cursor-pointer min-h-9">
            <input type="checkbox" checked={f.counts} onChange={set("counts")} className={checkClass} />
            <span>
              Counts against plan hours · {hours(client.usedHours)} of {client.capHours} used this month
              {client.usedHours / client.capHours >= 0.75 ? " · near the cap" : ""}
            </span>
          </label>
        )}
        <FormError message={sub.status === "failed" ? sub.error : ""} />
      </form>
    </Modal>
  );
}
