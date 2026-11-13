"use client";

import Link from "next/link";
import { Chip, btnPrimary, btnSecondary, btnGhost, money } from "@/components/admin/ui";
import { Card, TextField, SwitchRow, LockNote, ListGate, th } from "./parts";

// The six Settings tabs. They are controlled by SettingsView: `v` holds the editable values,
// `set(key)` returns a setter, `errors` maps a key to a message, `locked` means a builder (read only).

const ROLE_TONE = { Owner: "fg", Builder: "muted", Agent: "accent" };
const TFA_TONE = { On: "text-success", Off: "text-warning", Key: "text-accent-light" };

function Dot({ className }) {
  return <span aria-hidden="true" className={`w-[7px] h-[7px] rounded-full inline-block bg-current ${className}`} />;
}

export function GeneralTab({ v, set, errors, locked, integrations }) {
  const f = (key, id, label, extra = {}) => (
    <TextField id={id} label={label} value={v[key]} onChange={set(key)} error={errors[key]} disabled={locked} {...extra} />
  );
  return (
    <div className="flex flex-col gap-4">
      {locked ? <LockNote /> : null}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4 items-start">
        <Card title="Business" id="s-biz">
          {f("general.name", "b-name", "Business name")}
          {f("general.email", "b-email", "Public email", { type: "email" })}
          {f("general.phone", "b-phone", "Phone", { type: "tel" })}
          {f("general.hours", "b-hours", "Hours shown on the site")}
          {f("general.address", "b-addr", "Mailing address (privacy policy)")}
        </Card>
        <Card title="Targets" id="s-targets">
          <p className="m-0 text-[12px] text-muted-2">What the dashboard measures against. Change them here and every bar follows.</p>
          {f("targets.signed", "t-signed", "Signed per month ($)", { inputMode: "numeric", hint: "Setup fees signed. PROJECT-BRIEF: $20,000." })}
          {f("targets.cash", "t-cash", "Cash collected per month ($)", { inputMode: "numeric", hint: "PROJECT-BRIEF: $17,000." })}
          {f("targets.mrr", "t-mrr", "Monthly recurring ($)", { inputMode: "numeric", hint: "PROJECT-BRIEF: $1,500 by month 3." })}
          {f("targets.prospects", "t-pros", "Prospects per day (outreach)", { inputMode: "numeric", hint: "Claude’s morning run stops at this number." })}
        </Card>
      </div>
      <Card title="Integrations" id="s-int">
        <ul className="list-none m-0 p-0 grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-x-6">
          {integrations.map((i) => (
            <li key={i.name} className="flex items-center justify-between gap-3 py-2.5 border-t border-border">
              <span className="flex flex-col min-w-0">
                <span className="text-[13px] text-fg">{i.name}</span>
                <span className="text-[12px] text-muted-2">{i.use}</span>
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[12px] whitespace-nowrap ${i.tone === "success" ? "text-success" : "text-accent-light"}`}>
                <Dot />
                {i.status}
              </span>
            </li>
          ))}
        </ul>
        <p className="m-0 text-[12px] text-muted-2">
          Keys live in environment variables, never in this screen. Klyvora&rsquo;s Stripe account is for our invoices; every client connects their own, and client payments go to them with a $0 cut for us.
        </p>
      </Card>
    </div>
  );
}

export function TeamTab({ team, meId, locked, state, onRetry, onInvite, onRole, onRemove, onKey }) {
  const owners = team.filter((m) => m.role === "Owner").length;
  return (
    <div className="flex flex-col gap-4">
      {locked ? <LockNote /> : null}
      <section aria-labelledby="s-team" className="bg-surface border border-border rounded-admin overflow-hidden min-w-0">
        <div className="flex flex-wrap justify-between items-center gap-3 px-5 pt-[18px] pb-3">
          <h2 id="s-team" className="text-[15px] font-medium m-0">
            Team · {state === "live" ? team.length : "…"}
          </h2>
          <button type="button" className={btnPrimary} onClick={onInvite} disabled={locked || state !== "live"}>
            Invite a teammate
          </button>
        </div>
        <div className="px-5 pb-5">
          <ListGate state={state} onRetry={onRetry} emptyTitle="No one on the team yet" emptyText="Admin accounts are created here; there is no public sign-up." emptyAction={<button type="button" className={btnPrimary} onClick={onInvite} disabled={locked}>Invite a teammate</button>}>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[680px] border-collapse text-[13px]">
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
                            <span aria-hidden="true" className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-[13px] font-medium flex-none ${m.role === "Owner" ? "bg-fg text-bg" : m.role === "Agent" ? "bg-accent text-white" : "bg-border-2 text-fg"}`}>
                              {m.name[0]}
                            </span>
                            <span className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-fg">
                                {m.name}
                                {me ? <span className="text-muted-2"> (you)</span> : null}
                              </span>
                              <span className="text-[12px] text-muted-2">{m.email}</span>
                            </span>
                          </span>
                        </th>
                        <td className="px-4 py-3">
                          <Chip tone={ROLE_TONE[m.role]}>{m.role}</Chip>
                          {m.pending ? <span className="block mt-1 text-[12px] text-warning">Invited · expires in 7 days</span> : null}
                        </td>
                        <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{m.active}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 ${TFA_TONE[m.tfa]}`}>
                            <Dot />
                            {m.tfa}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {m.human ? (
                            <>
                              <button type="button" className={btnGhost} disabled={locked} onClick={() => onRole(m)} aria-label={`Change role for ${m.name}`}>
                                Change role
                              </button>
                              <button type="button" className={btnGhost} disabled={locked || me} onClick={() => onRemove(m)} aria-label={`Remove ${m.name}`} title={me ? "You can’t remove yourself" : undefined}>
                                Remove
                              </button>
                            </>
                          ) : (
                            <button type="button" className={btnGhost} disabled={locked} onClick={onKey} aria-label="Rotate the agent key">
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
            <p className="m-0 mt-4 text-[12px] text-muted-2 leading-relaxed">
              Roles: Owner (everything), Builder (leads, clients, projects, tickets), Agent (Claude: prospects, email drafts and demo builds; never sends, never sees Settings). Admin accounts are created here; there is no public sign-up.
              {owners === 1 ? " There is one owner, so that role can’t be removed until someone else has it." : ""}
            </p>
          </ListGate>
        </div>
      </section>
    </div>
  );
}

export function CatalogTab({ catalog, history, locked, state, onRetry, onEdit }) {
  return (
    <div className="flex flex-col gap-4">
      {locked ? <LockNote /> : null}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <section aria-labelledby="s-cat" className="bg-surface border border-border rounded-admin overflow-hidden min-w-0">
            <div className="flex flex-wrap justify-between items-center gap-3 px-5 pt-[18px] pb-3">
              <div className="flex flex-col gap-1">
                <h2 id="s-cat" className="text-[15px] font-medium m-0">
                  Offer catalog · {state === "live" ? `${catalog.length} offers` : "…"}
                </h2>
                <span className="text-[12px] text-muted-2">The one place prices live. Proposals, the Pricing page and the estimator read from here.</span>
              </div>
              <Chip tone="success">Matches PROJECT-BRIEF</Chip>
            </div>
            <div className="px-5 pb-5">
              <ListGate state={state} onRetry={onRetry} emptyTitle="No offers yet" emptyText="The catalog is seeded from PROJECT-BRIEF when the database is set up." rows={6}>
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full min-w-[760px] border-collapse text-[13px]">
                    <caption className="sr-only">Offers and prices</caption>
                    <thead>
                      <tr className="bg-surface-2">
                        <th scope="col" className={th}>Code</th>
                        <th scope="col" className={th}>Offer</th>
                        <th scope="col" className={`${th} text-right`}>Setup</th>
                        <th scope="col" className={`${th} text-right`}>Monthly</th>
                        <th scope="col" className={th}>Monthly plan</th>
                        <th scope="col" className={th}>Changed</th>
                        <th scope="col" className={`${th} text-right`}>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalog.map((o) => (
                        <tr key={o.code} className="border-t border-border align-top hover:bg-[rgba(var(--fg-rgb),.03)]">
                          <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{o.code}</td>
                          <th scope="row" className="text-left font-normal px-4 py-3">
                            <span className="text-fg">{o.name}</span>
                            <span className="block text-[12px] text-muted-2">{o.sub}</span>
                          </th>
                          <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{money(o.setup)}</td>
                          <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                            {money(o.monthly)}/mo{o.usage ? " + usage" : ""}
                          </td>
                          <td className="px-4 py-3">{o.monthlyRequired ? <Chip tone="warning">Required</Chip> : <span className="text-muted-2">Optional</span>}</td>
                          <td className="px-4 py-3 text-muted-2 whitespace-nowrap">{o.changed}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button type="button" className={btnGhost} disabled={locked} onClick={(e) => onEdit(o, e)} aria-label={`Edit price for ${o.name}`}>
                              Edit price…
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ListGate>
            </div>
          </section>

          <Card title="Add-ons and rules" id="s-addons">
            <ul className="list-none m-0 p-0 text-[13px]">
              {[
                ["Add booking later", "+$500 setup · +$30/mo on the Starter Website"],
                ["Kiosk mode (restaurants)", "$299 per device · $29/mo per device"],
                ["Setup schedule", "50% kickoff · 30% working demo · 20% accepted launch; monthly starts at launch"],
                ["AI usage", "Passed through at cost as a usage line on the plan"],
                ["Ownership", "Site, code and data are the client’s on final payment; only Klyvora templates and the platform are licensed"],
                ["Client payments", "Go to the client’s own Stripe account; Klyvora’s cut is $0"],
              ].map(([k, d]) => (
                <li key={k} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-6 py-2.5 border-t border-border first:border-t-0 first:pt-0">
                  <span className="text-fg">{k}</span>
                  <span className="text-muted-2 sm:text-right">{d}</span>
                </li>
              ))}
            </ul>
            <p className="m-0 text-[12px] text-muted-2">These rules are text on the proposal; changing them is a founder decision, not a Settings edit.</p>
          </Card>
        </div>

        <aside aria-labelledby="s-hist" className="bg-surface border border-border rounded-admin px-5 py-[18px] flex flex-col gap-3.5 min-w-0">
          <h2 id="s-hist" className="text-[15px] font-medium m-0">
            Price history
          </h2>
          <ol className="list-none m-0 p-0 flex flex-col gap-3.5">
            {history.map((h) => (
              <li key={h.id} className="flex gap-3">
                <span aria-hidden="true" className={`mt-1.5 w-2 h-2 rounded-full flex-none ${h.tone === "success" ? "bg-success" : h.tone === "accent" ? "bg-accent-light" : "bg-border-2"}`} />
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[13px] text-fg">{h.what}</span>
                  <span className="text-[12px] text-muted-2">
                    {h.who} · {h.when}
                  </span>
                  <span className="text-[12px] text-muted-2 italic">&ldquo;{h.note}&rdquo;</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="m-0 text-[12px] text-muted-2">Every save needs a note. Signed proposals keep their price; new ones use the current one.</p>
        </aside>
      </div>
    </div>
  );
}

function TemplateList({ title, id, intro, items, locked, onEdit }) {
  return (
    <Card title={title} id={id}>
      <p className="m-0 text-[12px] text-muted-2">{intro}</p>
      <ul className="list-none m-0 p-0">
        {items.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 border-t border-border">
            <span className="flex flex-col min-w-0">
              <span className="text-[13px] text-fg flex items-center gap-2 flex-wrap">
                {t.name}
                {t.custom ? <Chip tone="accent">Edited</Chip> : null}
              </span>
              <span className="text-[12px] text-muted-2">{t.sub}</span>
            </span>
            <button type="button" className={btnSecondary} disabled={locked} onClick={(e) => onEdit(t, e)} aria-label={`Edit ${t.name}`}>
              Edit
            </button>
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
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4 items-start">
          <TemplateList title="Proposal templates" id="s-ptpl" intro="The scope checklist and plain-words terms the builder pre-fills per offer." items={proposal} locked={locked} onEdit={(t, e) => onEdit(t, false, e)} />
          <TemplateList title="Email templates" id="s-etpl" intro="Subject and body with variables. Outreach emails are drafts; a person approves and sends each one." items={email} locked={locked} onEdit={(t, e) => onEdit(t, true, e)} />
        </div>
      </ListGate>
    </div>
  );
}

export function OutreachTab({ v, set, errors, locked, lastRun }) {
  const f = (key, id, label, extra = {}) => (
    <TextField id={id} label={label} value={v[key]} onChange={set(key)} error={errors[key]} disabled={locked} {...extra} />
  );
  return (
    <div className="flex flex-col gap-4">
      {locked ? <LockNote /> : null}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4 items-start">
        <Card title="Outreach · Claude" id="s-outreach">
          <p className="m-0 text-[12px] text-muted-2">The brief Claude runs every morning, and the guardrails around it.</p>
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
          <dl className="m-0 text-[13px]">
            {[
              ["Started", lastRun.started],
              ["Prospects found", lastRun.found],
              ["Skipped", lastRun.skipped],
              ["Errors", lastRun.errors],
            ].map(([k, d]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 border-t border-border first:border-t-0 first:pt-0">
                <dt className="text-muted-2">{k}</dt>
                <dd className="m-0 text-right">{d}</dd>
              </div>
            ))}
          </dl>
          <Link href="/admin/outreach" className="text-[13px] text-accent-light hover:text-fg inline-flex items-center gap-1 min-h-9">
            Open the approval queue <span aria-hidden="true">→</span>
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4 items-start">
      <Card title="Notifications · you" id="s-notify">
        <p className="m-0 text-[12px] text-muted-2">Each person sets their own. These are yours, and builders can change them too.</p>
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
        <p className="m-0 text-[12px] text-muted-2">Emails still arrive; texts wait until the morning. Nothing from the Outreach run ever texts anyone.</p>
      </Card>
    </div>
  );
}
