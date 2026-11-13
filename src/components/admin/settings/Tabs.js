"use client";

import Link from "next/link";
import { Chip, btnPrimary, money } from "@/components/admin/ui";
import { Card, TextField, SwitchRow, LockNote, ListGate, th, rowBtn, rowGhost } from "./parts";

// The six Settings tabs, drawn to the AdminSettings board: 15px card titles, 12px muted helper text,
// 13px rows with 1px dividers, 36px outlined row buttons, 48x28 switches. They are controlled by
// SettingsView: `v` holds the editable values, `set(key)` returns a setter, `errors` maps a key to a
// message, `locked` means a builder (read only).

const ROLE_TONE = { Owner: "fg", Builder: "muted", Agent: "accent" };
const TFA_TEXT = { On: "text-success", Off: "text-warning", Key: "text-accent-light" };
const TWO_COL = "grid grid-cols-1 min-[1181px]:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start";
const CARD_GRID = "grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4 items-start";
const ROW = "flex justify-between items-center gap-3 border-t border-border";

function Dot({ className = "" }) {
  return <span aria-hidden="true" className={`w-[7px] h-[7px] rounded-full inline-block bg-current ${className}`} />;
}

function Help({ children }) {
  return <p className="m-0 text-[12px] text-muted">{children}</p>;
}

// A card whose table runs edge to edge: header row 18/20/12, then the table, then an optional footnote.
function TableCard({ id, title, sub, action, children, note }) {
  return (
    <section aria-labelledby={id} className="bg-surface border border-border rounded-admin overflow-hidden min-w-0">
      <div className="flex flex-wrap justify-between items-center gap-3 px-5 pt-[18px] pb-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 id={id} className="text-[15px] font-medium m-0">
            {title}
          </h2>
          {sub ? <span className="text-[12px] text-muted">{sub}</span> : null}
        </div>
        {action}
      </div>
      {children}
      {note ? <p className="m-0 px-5 pt-3 pb-4 text-[12px] text-muted border-t border-border">{note}</p> : null}
    </section>
  );
}

export function GeneralTab({ v, set, errors, locked, integrations }) {
  const f = (key, id, label, extra = {}) => <TextField id={id} label={label} value={v[key]} onChange={set(key)} error={errors[key]} disabled={locked} {...extra} />;
  return (
    <div className="flex flex-col gap-4">
      {locked ? <LockNote /> : null}
      <div className={CARD_GRID}>
        <Card title="Business" id="s-biz">
          {f("general.name", "b-name", "Business name")}
          {f("general.email", "b-email", "Public email", { type: "email" })}
          {f("general.phone", "b-phone", "Phone", { type: "tel" })}
          {f("general.hours", "b-hours", "Hours shown on the site")}
          {f("general.address", "b-addr", "Mailing address (privacy policy)")}
        </Card>
        <Card title="Targets" id="s-targets">
          <Help>What the dashboard measures against. Change them here and every bar follows.</Help>
          {f("targets.signed", "t-signed", "Signed per month ($)", { inputMode: "numeric", hint: "Setup fees signed. PROJECT-BRIEF: $20,000." })}
          {f("targets.cash", "t-cash", "Cash collected per month ($)", { inputMode: "numeric", hint: "PROJECT-BRIEF: $17,000." })}
          {f("targets.mrr", "t-mrr", "Monthly recurring ($)", { inputMode: "numeric", hint: "PROJECT-BRIEF: $1,500 by month 3." })}
          {f("targets.prospects", "t-pros", "Prospects per day (outreach)", { inputMode: "numeric", hint: "Claude’s morning run stops at this number." })}
        </Card>
      </div>
      <Card title="Integrations" id="s-int">
        <ul className="list-none m-0 p-0 flex flex-col">
          {integrations.map((i) => (
            <li key={i.name} className={`${ROW} min-h-[52px] text-[13px]`}>
              <span className="flex flex-col gap-0.5 min-w-0">
                <span>{i.name}</span>
                <span className="text-[12px] text-muted">{i.use}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-[13px] text-muted-2 whitespace-nowrap">
                <span aria-hidden="true" className={`w-[7px] h-[7px] rounded-full inline-block ${i.tone === "success" ? "bg-success" : "bg-accent-light"}`} />
                {i.status}
              </span>
            </li>
          ))}
        </ul>
        <Help>Keys live in environment variables, never in this screen. Klyvora&rsquo;s Stripe account is for our invoices; every client connects their own, and client payments go to them with a $0 cut for us.</Help>
      </Card>
    </div>
  );
}

export function TeamTab({ team, meId, locked, state, onRetry, onInvite, onRole, onRemove, onKey }) {
  const owners = team.filter((m) => m.role === "Owner").length;
  return (
    <div className="flex flex-col gap-4">
      {locked ? <LockNote /> : null}
      <TableCard
        id="s-team"
        title={`Team · ${state === "live" ? team.length : "…"}`}
        action={
          <button type="button" className={btnPrimary} onClick={onInvite} disabled={locked || state !== "live"}>
            Invite a teammate
          </button>
        }
        note={`Roles: Owner (everything), Builder (leads, clients, projects, tickets), Agent (Claude: prospects, email drafts and demo builds; never sends, never sees Settings). Admin accounts are created here; there is no public sign-up.${owners === 1 ? " There is one owner, so that role can’t be removed until someone else has it." : ""}`}
      >
        <ListGate
          state={state}
          onRetry={onRetry}
          pad="px-5 pb-5"
          emptyTitle="No one on the team yet"
          emptyText="Admin accounts are created here; there is no public sign-up."
          emptyAction={
            <button type="button" className={btnPrimary} onClick={onInvite} disabled={locked}>
              Invite a teammate
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <caption className="sr-only">Team members</caption>
              <thead>
                <tr className="bg-surface-2">
                  <th scope="col" className={th}>Member</th>
                  <th scope="col" className={th}>Role</th>
                  <th scope="col" className={th}>Last active</th>
                  <th scope="col" className={th}>2-factor</th>
                  <th scope="col" className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((m) => {
                  const me = m.id === meId;
                  return (
                    <tr key={m.id} className="border-t border-border align-top hover:bg-[rgba(var(--fg-rgb),.03)]">
                      <th scope="row" className="text-left font-normal px-4 py-3">
                        <span className="flex items-center gap-3">
                          <span aria-hidden="true" className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-[13px] font-medium flex-none ${m.role === "Owner" ? "bg-fg text-bg" : m.role === "Agent" ? "bg-accent text-bg" : "bg-border-2 text-fg"}`}>
                            {m.name[0]}
                          </span>
                          <span className="flex flex-col gap-0.5 min-w-0">
                            <span>
                              {m.name}
                              {me ? <span className="text-muted-2"> (you)</span> : null}
                            </span>
                            <span className="text-[12px] text-muted">{m.email}</span>
                          </span>
                        </span>
                      </th>
                      <td className="px-4 py-3">
                        <Chip tone={ROLE_TONE[m.role]}>{m.role}</Chip>
                        {m.pending ? <span className="ml-1.5 text-[12px] text-warning">Invited · expires in 7 days</span> : null}
                      </td>
                      <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{m.active}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 ${TFA_TEXT[m.tfa]}`}>
                          <Dot />
                          {m.tfa}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {m.human ? (
                          <>
                            <button type="button" className={`${rowGhost} text-fg`} disabled={locked} onClick={() => onRole(m)} aria-label={`Change role for ${m.name}`}>
                              Change role
                            </button>
                            <button type="button" className={`${rowGhost} text-danger`} disabled={locked || me} onClick={() => onRemove(m)} aria-label={`Remove ${m.name}`} title={me ? "You can’t remove yourself" : undefined}>
                              Remove
                            </button>
                          </>
                        ) : (
                          <button type="button" className={`${rowGhost} text-fg`} disabled={locked} onClick={onKey} aria-label="Rotate the agent key">
                            Rotate key…
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ListGate>
      </TableCard>
    </div>
  );
}

export function CatalogTab({ catalog, history, locked, state, onRetry, onEdit }) {
  return (
    <div className={TWO_COL}>
      <div className="flex flex-col gap-4 min-w-0">
        {locked ? <LockNote /> : null}
        <TableCard
          id="s-cat"
          title={`Offer catalog · ${state === "live" ? `${catalog.length} offers` : "…"}`}
          sub="The one place prices live. Proposals, the Pricing page and the estimator read from here."
          action={<Chip tone="success">Matches PROJECT-BRIEF</Chip>}
        >
          <ListGate state={state} onRetry={onRetry} pad="px-5 pb-5" emptyTitle="No offers yet" emptyText="The catalog is seeded from PROJECT-BRIEF when the database is set up." rows={6}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-[13px]">
                <caption className="sr-only">Offers and prices</caption>
                <thead>
                  <tr className="bg-surface-2">
                    <th scope="col" className={th}>Code</th>
                    <th scope="col" className={`${th} min-w-[260px]`}>Offer</th>
                    <th scope="col" className={`${th} text-right`}>Setup</th>
                    <th scope="col" className={`${th} text-right`}>Monthly</th>
                    <th scope="col" className={th}>Plan</th>
                    <th scope="col" className={th}>Changed</th>
                    <th scope="col" className={`${th} text-right`}>
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((o) => (
                    <tr key={o.code} className="border-t border-border align-top hover:bg-[rgba(var(--fg-rgb),.03)]">
                      <td className="px-4 py-3 font-mono text-[12px] text-muted-2">{o.code}</td>
                      <th scope="row" className="text-left font-normal px-4 py-3">
                        <span className="flex flex-col gap-0.5">
                          <span>{o.name}</span>
                          <span className="text-[12px] text-muted">{o.sub}</span>
                        </span>
                      </th>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{money(o.setup)}</td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                        {money(o.monthly)}/mo{o.usage ? " + usage" : ""}
                      </td>
                      <td className="px-4 py-3">{o.monthlyRequired ? <Chip tone="warning">Required</Chip> : <Chip tone="muted">Optional</Chip>}</td>
                      <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{o.changed}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" className={rowBtn} disabled={locked} onClick={() => onEdit(o)} aria-label={`Edit price for ${o.name}`}>
                          Edit price…
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ListGate>
        </TableCard>

        <Card title="Add-ons and rules" id="s-addons">
          <ul className="list-none m-0 p-0 flex flex-col text-[13px]">
            {[
              ["Add booking later", "+$500 setup · +$30/mo on the Starter Website"],
              ["Kiosk mode (restaurants)", "$299 per device · $29/mo per device"],
              ["Setup schedule", "50% kickoff · 30% working demo · 20% accepted launch; monthly starts at launch"],
              ["AI usage", "Passed through at cost as a usage line on the plan"],
              ["Ownership", "Site, code and data are the client’s on final payment; only Klyvora templates and the platform are licensed"],
              ["Client payments", "Go to the client’s own Stripe account; Klyvora’s cut is $0"],
            ].map(([k, d]) => (
              <li key={k} className={`${ROW} min-h-11 py-2`}>
                <span>{k}</span>
                <span className="text-muted-2 text-right">{d}</span>
              </li>
            ))}
          </ul>
          <Help>These rules are text on the proposal; changing them is a founder decision, not a Settings edit.</Help>
        </Card>
      </div>

      <aside aria-labelledby="s-hist" className="bg-surface border border-border rounded-admin px-5 py-[18px] flex flex-col gap-3.5 min-w-0">
        <h2 id="s-hist" className="text-[15px] font-medium m-0">
          Price history
        </h2>
        <ol className="list-none m-0 p-0 flex flex-col">
          {history.map((h) => (
            <li key={h.id} className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 py-2.5 border-t border-border">
              <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full mt-[5px] ${h.tone === "success" ? "bg-success" : h.tone === "accent" ? "bg-accent-light" : "bg-border-2"}`} />
              <span className="flex flex-col gap-[3px] text-[13px] min-w-0">
                <span>{h.what}</span>
                <span className="text-[12px] text-muted">
                  {h.who} · {h.when}
                </span>
                <span className="text-muted-2 leading-normal">&ldquo;{h.note}&rdquo;</span>
              </span>
            </li>
          ))}
        </ol>
        <Help>Every save needs a note. Signed proposals keep their price; new ones use the current one.</Help>
      </aside>
    </div>
  );
}

function TemplateList({ title, id, intro, items, locked, onEdit }) {
  return (
    <Card title={title} id={id}>
      <Help>{intro}</Help>
      <ul className="list-none m-0 p-0 flex flex-col">
        {items.map((t) => (
          <li key={t.id} className={`${ROW} min-h-[52px] text-[13px]`}>
            <span className="flex flex-col gap-0.5 min-w-0">
              <span>{t.name}</span>
              <span className="text-[12px] text-muted">{t.sub}</span>
            </span>
            <span className="inline-flex items-center gap-2 flex-none">
              {t.custom ? <span className="text-[12px] text-accent-light">Edited</span> : null}
              <button type="button" className={rowBtn} disabled={locked} onClick={() => onEdit(t)} aria-label={`Edit ${t.name}`}>
                Edit
              </button>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function TemplatesTab({ proposal, email, locked, state, onRetry, onEdit }) {
  return (
    <div className="flex flex-col gap-4">
      {locked ? <LockNote /> : null}
      <ListGate state={state} onRetry={onRetry} emptyTitle="No templates yet" emptyText="Templates are seeded from the proposal and email copy when the database is set up." rows={5}>
        <div className={CARD_GRID}>
          <TemplateList title="Proposal templates" id="s-ptpl" intro="The scope checklist and plain-words terms the builder pre-fills per offer." items={proposal} locked={locked} onEdit={(t) => onEdit(t, false)} />
          <TemplateList title="Email templates" id="s-etpl" intro="Subject and body with variables. Outreach emails are drafts; a person approves and sends each one." items={email} locked={locked} onEdit={(t) => onEdit(t, true)} />
        </div>
      </ListGate>
    </div>
  );
}

export function OutreachTab({ v, set, errors, locked, lastRun }) {
  const f = (key, id, label, extra = {}) => <TextField id={id} label={label} value={v[key]} onChange={set(key)} error={errors[key]} disabled={locked} {...extra} />;
  return (
    <div className="flex flex-col gap-4">
      {locked ? <LockNote /> : null}
      <div className={CARD_GRID}>
        <Card title="Outreach · Claude" id="s-outreach">
          <p className="m-0 text-[13px] text-muted">The brief Claude runs every morning, and the guardrails around it.</p>
          {f("outreach.areas", "o-areas", "Areas to search", { hint: "Comma-separated neighborhoods or zip codes" })}
          {f("outreach.types", "o-types", "Business types")}
          {f("outreach.signals", "o-signals", "Look for")}
          {f("outreach.time", "o-time", "Daily run time", { type: "time" })}
          {f("outreach.from", "o-from", "Send from", { type: "email", hint: "Replies land in this inbox and are logged to the prospect" })}
          {f("outreach.cap", "o-cap", "Daily send cap", { inputMode: "numeric", hint: "Hard stop for the run; 10 by default." })}
          <div className="flex flex-col">
            <SwitchRow id="sw-approval" label="Human approval before any email is sent" note="Always on. Claude drafts; a person approves and sends every email and demo." on disabled locked />
            <SwitchRow id="sw-followup" label="Draft follow-ups after 3 days of silence" note="Goes to the approval queue like everything else" on={v["outreach.followup"]} onChange={set("outreach.followup")} disabled={locked} />
            <SwitchRow id="sw-demo" label="Suggest a demo for every emailed prospect" note="Adds a “Start a demo” next step" on={v["outreach.demo"]} onChange={set("outreach.demo")} disabled={locked} />
            <SwitchRow id="sw-build" label="Claude may build demos when assigned" note="Anyone can assign a demo to Claude or to a person. Every demo is reviewed before it is sent." on={v["outreach.build"]} onChange={set("outreach.build")} disabled={locked} />
          </div>
          {f("outreach.dnc", "o-dnc", "Do not contact", { textarea: true, rows: 3, placeholder: "One business or email per line", hint: "Unsubscribes are added here automatically." })}
        </Card>
        <Card title="Last run" id="s-run">
          <dl className="m-0 flex flex-col text-[13px]">
            {[
              ["Started", lastRun.started],
              ["Prospects found", lastRun.found],
              ["Skipped", lastRun.skipped],
              ["Errors", lastRun.errors],
            ].map(([k, d]) => (
              <div key={k} className={`${ROW} min-h-11`}>
                <dt className="text-muted-2">{k}</dt>
                <dd className="m-0 text-right inline-flex items-center gap-2">
                  {k === "Errors" && d === "None" ? <span aria-hidden="true" className="w-[7px] h-[7px] rounded-full inline-block bg-success" /> : null}
                  {d}
                </dd>
              </div>
            ))}
          </dl>
          <Link href="/admin/outreach" className="text-[13px] text-accent-light hover:text-fg min-h-10 inline-flex items-center">
            Open the approval queue →
          </Link>
        </Card>
      </div>
    </div>
  );
}

const NOTIFY = [
  ["notify.lead", "New lead from the site", "Email and text"],
  ["notify.reply", "Prospect replied", "Email, when you own the prospect"],
  ["notify.digest", "Morning digest of the approval queue", "One email after Claude’s run"],
  ["notify.overdue", "Invoice overdue", "Email on the day and every 7 days"],
  ["notify.ticket", "New support ticket", "Email and text during business hours"],
  ["notify.signed", "Proposal signed", "Email and text"],
];

export function NotificationsTab({ v, set }) {
  return (
    <div className={CARD_GRID}>
      <Card title="Notifications · you" id="s-notify">
        <Help>Each person sets their own. These are yours, and builders can change them too.</Help>
        <div className="flex flex-col">
          {NOTIFY.map(([k, label, note]) => (
            <SwitchRow key={k} id={`sw-${k}`} label={label} note={note} on={v[k]} onChange={set(k)} />
          ))}
        </div>
      </Card>
      <Card title="Texts and quiet hours" id="s-quiet">
        <TextField id="q-phone" label="Text messages go to" type="tel" value={v["notify.phone"]} onChange={set("notify.phone")} />
        <div className="grid grid-cols-2 gap-3.5">
          <TextField id="q-from" label="No texts after" type="time" value={v["notify.quietFrom"]} onChange={set("notify.quietFrom")} />
          <TextField id="q-to" label="Until" type="time" value={v["notify.quietTo"]} onChange={set("notify.quietTo")} />
        </div>
        <Help>Emails still arrive; texts wait until the morning. Nothing from the Outreach run ever texts anyone.</Help>
      </Card>
    </div>
  );
}
