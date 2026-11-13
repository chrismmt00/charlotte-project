"use client";

import { useId, useState } from "react";
import { KB, TICKET_STATUS } from "@/lib/portal/sample";
import { listState, usePortal } from "./PortalContext";
import { Alert, Card, Chip, Icon, ListStatus, PageHead, Spinner, btnPrimary, inputCls } from "./ui";
import SupportForm from "./SupportForm";

function Ticket({ t }) {
  const p = usePortal();
  const uid = useId();
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("idle"); // idle | busy | failed
  const st = TICKET_STATUS[t.status] || TICKET_STATUS.open;
  const count = `${t.messages.length} ${t.messages.length === 1 ? "message" : "messages"}`;
  const panel = `${uid}-panel`;

  function toggle() {
    p.patch((s) => ({ tickets: s.tickets.map((x) => (x.id === t.id ? { ...x, expanded: !x.expanded } : x)) }));
  }

  // Reply: POST /api/portal/tickets { ticketId, message } -> 201 { message }
  async function reply(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || status === "busy") return;
    setStatus("busy");
    try {
      await p.api("/api/portal/tickets", { body: { ticketId: t.id, message: text } });
      p.patch((s) => ({ tickets: s.tickets.map((x) => (x.id === t.id ? { ...x, messages: [...x.messages, { who: "You", when: "Just now", text }] } : x)) }));
      setDraft("");
      setStatus("idle");
      p.toast("Reply sent");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <li className="border-t border-border">
      <button type="button" aria-expanded={!!t.expanded} aria-controls={panel} onClick={toggle} className="w-full min-h-14 py-2 flex items-center justify-between gap-3 bg-transparent border-0 text-left text-fg cursor-pointer font-[inherit]">
        <span className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[15px] font-medium">{t.subject}</span>
          <span className="text-[13px] text-muted-2">
            {t.id} · {t.when} · {count}
          </span>
        </span>
        <span className="inline-flex items-center gap-2 flex-none">
          <Chip tone={st.tone}>{st.label}</Chip>
          <Icon name="chevron" className={`text-muted-2 transition-transform duration-200 ${t.expanded ? "rotate-180" : ""}`} />
        </span>
      </button>
      {t.expanded ? (
        <div id={panel} className="pb-4 flex flex-col gap-3.5">
          <ol className="list-none m-0 p-0 flex flex-col gap-3">
            {t.messages.map((m, i) => (
              <li key={i} className={`rounded-input border border-border p-3.5 text-sm leading-[1.6] ${m.who === "You" ? "bg-surface-2" : "bg-surface"}`}>
                <div className="text-[13px] text-muted-2">
                  <strong className="text-fg font-medium">{m.who}</strong> · {m.when}
                </div>
                <p className="m-0 mt-1">{m.text}</p>
              </li>
            ))}
          </ol>
          {t.status !== "closed" ? (
            <form onSubmit={reply} noValidate className="flex flex-col gap-2">
              {status === "failed" ? <Alert>That reply didn’t send. Your text is still here. Try again.</Alert> : null}
              <label htmlFor={`${uid}-reply`} className="text-[13px] text-muted-2">
                Reply
              </label>
              <div className="flex flex-wrap gap-2">
                <input id={`${uid}-reply`} type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Reply to Geoffrey" disabled={status === "busy"} className={`${inputCls} border-border-2 flex-[1_1_220px] w-auto`} />
                <button type="submit" disabled={status === "busy" || !draft.trim()} aria-busy={status === "busy"} className={btnPrimary}>
                  {status === "busy" ? (
                    <>
                      <Spinner />
                      Sending…
                    </>
                  ) : (
                    "Send"
                  )}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export default function SupportView() {
  const p = usePortal();
  const open = p.tickets.filter((t) => t.status !== "closed").length;
  const status = listState(p, p.tickets.length);
  const used = p.hours.used;
  const cap = p.hours.cap;
  const pct = Math.min(100, (used / cap) * 100);
  const over = used >= cap;
  const near = used >= cap * 0.75;
  const chip = over ? ["Over", "danger"] : near ? ["Nearly used", "warning"] : ["On plan", "success"];
  const noPlan = !p.monthlyChosen;

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow="Support" title="Need something changed?" lede="Small changes are part of the monthly plan. Bigger things get a quick quote first." />

      <Card titleId="new-h" title="New request">
        <SupportForm />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <Card titleId="tk-h" title={`Your requests · ${open} open`}>
          {status !== "live" ? (
            <ListStatus status={status} rows={3} label="your requests" empty={{ text: "No requests yet. Send one above and it shows up here." }} onRetry={p.retry} />
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col">
              {p.tickets.map((t) => (
                <Ticket key={t.id} t={t} />
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-4 min-w-0">
          <Card titleId="hrs-h" title="Plan hours this month" action={noPlan ? null : <Chip tone={chip[1]}>{chip[0]}</Chip>}>
            {noPlan ? (
              <p className="m-0 text-sm leading-[1.6] text-muted-2">You are not on a monthly plan, so changes are quoted first. Nothing is billed without a yes.</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-medium tabular-nums">{used.toFixed(1)} h</span>
                  <span className="text-sm text-muted-2">
                    of {cap} h used · resets {p.hours.resetsOn}
                  </span>
                </div>
                <div role="progressbar" aria-label="Plan hours used" aria-valuemin={0} aria-valuemax={cap} aria-valuenow={used} className="h-2 rounded-full bg-border overflow-hidden">
                  <div className={`h-full ${over ? "bg-danger" : near ? "bg-warning" : "bg-accent"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="m-0 text-[13px] leading-[1.6] text-muted-2">
                  {near && !over ? `About ${Math.round((cap - used) * 60)} minutes left this month; anything bigger we quote first. ` : ""}Hours cover text, photo and hours changes, small fixes and questions. New pages or features get a quote first, nothing is billed without a yes.
                </p>
              </>
            )}
          </Card>

          <Card titleId="kb-h" title="Do it yourself">
            <div className="border-t border-border">
              {KB.map((k) => (
                <details key={k.q} className="group border-b border-border last:border-b-0">
                  <summary className="cursor-pointer flex justify-between items-center gap-3 min-h-12 py-2 text-sm font-medium list-none">
                    {k.q}
                    <span aria-hidden="true" className="text-accent-light text-xl leading-none transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="m-0 mb-3.5 text-sm leading-[1.6] text-muted-2">{k.a}</p>
                </details>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
