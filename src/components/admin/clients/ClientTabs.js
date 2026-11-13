"use client";

import Link from "next/link";
import { useRef } from "react";
import { Panel, Chip, Empty, btnPrimary, btnSecondary, btnGhost, money } from "@/components/admin/ui";
import { usd } from "@/components/proposal/model";
import { getOffer } from "@/lib/offers";
import { AlertIcon, CheckRow } from "./kit";

const th = "font-medium px-4 py-3 text-left whitespace-nowrap text-muted-2";
const td = "px-4 py-3";
const MS_TONE = { Paid: "success", Open: "accent", Overdue: "danger", "Not started": "muted" };
const INV_TONE = { Paid: "success", Draft: "muted", Overdue: "danger", Open: "accent" };

function Table({ caption, heads, children }) {
  return (
    <div className="overflow-x-auto border border-border rounded-[12px]">
      <table className="w-full min-w-[640px] border-collapse text-[13px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-surface-2">
            {heads.map((h) => (
              <th key={h} scope="col" className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-t [&>tr]:border-border">{children}</tbody>
      </table>
    </div>
  );
}

function Dl({ rows }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 m-0 text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-2">{k}</dt>
          <dd className="m-0 min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Stat({ label, value, note, href }) {
  const inner = (
    <>
      <span className="text-[13px] text-muted-2">{label}</span>
      <span className="text-[24px] font-medium leading-none tabular-nums">{value}</span>
      <span className="text-[13px] text-muted-2">{note}</span>
    </>
  );
  const cls = "bg-surface border border-border rounded-admin p-5 flex flex-col gap-2 min-w-0";
  return href ? (
    <Link href={href} className={`${cls} hover:border-border-2`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function Overview({ client, tasks, onToggleTask, onTab, onEdit, onStripe }) {
  const offer = getOffer(client.offerCode);
  const next = client.milestones.find((m) => m.status !== "Paid");
  const conn = client.stripe.connect;
  const m = client.monthly;
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <Stat label="Paid to date" value={usd(client.paidToDate)} note={`of ${usd(client.build)} build`} />
          <Stat
            label="Next milestone"
            value={next ? `${next.label} · ${next.percent}%` : "All paid"}
            note={next ? `${usd(next.amount)} ${next.status === "Overdue" ? "overdue" : "due"} · ${next.date}` : "Monthly plan is the only thing left"}
          />
          <Stat
            label="Monthly plan"
            value={m.on ? `${money(offer.monthly)}/mo` : "None"}
            note={m.on ? `${m.status === "running" ? "running" : m.status} · ${m.required ? "required for restaurants" : "optional, they chose it"}` : "Self-managed: they take the code"}
          />
          <Stat label="Open tickets" value={client.tickets.open} note={client.tickets.latest || "Nothing waiting on us"} href="/admin/support" />
        </div>

        <Panel title={`Project · ${client.offer}`} titleId="ms-h" action={<Link href="/admin/projects" className="text-[13px] text-accent-light hover:text-fg">Open project ↗</Link>}>
          <ol className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {client.milestones.map((ms, i) => (
              <li key={ms.key} aria-current={ms === next ? "step" : undefined} className="flex flex-col gap-1.5">
                <span className={`h-1 rounded-full ${ms.status === "Paid" ? "bg-success" : ms === next ? "bg-fg" : "bg-border-2"}`} />
                <span className={`text-[13px] ${ms.status === "Not started" ? "text-muted-2" : "text-fg"}`}>
                  {ms.label} · {ms.percent}%
                </span>
                <span className="text-xs text-muted-2">
                  {usd(ms.amount)} · {ms.status === "Paid" ? `paid ${ms.date}` : i === 1 ? "due at demo approval" : i === 2 ? "due at acceptance; monthly starts" : "due at signing"}
                </span>
              </li>
            ))}
          </ol>
          {tasks.length ? (
            <ul className="list-none p-0 m-0 flex flex-col gap-1">
              {tasks.map((t, i) => (
                <li key={t.label} className="flex items-center gap-3 min-h-9 text-[13px]">
                  <input type="checkbox" checked={t.done} onChange={() => onToggleTask(i)} aria-label={t.label} className="w-4 h-4 accent-[var(--accent)]" />
                  <span className={`flex-1 min-w-0 ${t.done ? "line-through text-muted-2" : ""}`}>{t.label}</span>
                  <span className="text-muted-2 whitespace-nowrap">
                    {t.who} · {t.when}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[13px] text-muted-2">Launched. No open project tasks.</p>
          )}
        </Panel>

        <Panel title="Recent activity" titleId="act-h">
          <ol className="list-none p-0 m-0 flex flex-col">
            {client.events.map((ev, i) => (
              <li key={ev.title} className="flex gap-3 items-start">
                <span className="flex flex-col items-center self-stretch">
                  <span aria-hidden="true" className="w-7 h-7 rounded-full border border-border-2 inline-flex items-center justify-center text-xs text-muted-2 flex-none">
                    {ev.icon}
                  </span>
                  {i < client.events.length - 1 ? <span className="w-px flex-1 bg-border my-1" /> : null}
                </span>
                <span className="flex flex-col gap-0.5 pb-4 min-w-0">
                  <span className="text-[13px]">{ev.title}</span>
                  <span className="text-xs text-muted-2">{ev.meta}</span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <aside className="flex flex-col gap-4 min-w-0">
        <Panel title="Primary contact" titleId="pc-h" action={<button type="button" onClick={() => onTab("contacts")} className={btnGhost}>All contacts</button>}>
          {(() => {
            const p = client.contacts.find((c) => c.primary) || client.contacts[0];
            return p ? (
              <Dl
                rows={[
                  ["Name", `${p.name} · ${p.role.toLowerCase()}`],
                  ["Email", <a key="e" href="mailto:contact@example.com" className="text-accent-light hover:text-fg">{p.email}</a>],
                  ["Phone", <a key="p" href="tel:+17045550100" className="text-accent-light hover:text-fg">{p.phone}</a>],
                  ["Portal", p.access === "Active" ? "Active · last sign-in yesterday" : p.access],
                ]}
              />
            ) : (
              <p className="m-0 text-[13px] text-muted-2">No contacts yet.</p>
            );
          })()}
        </Panel>
        <Panel title="Business" titleId="bi-h" action={<button type="button" onClick={onEdit} className={btnGhost}>Edit</button>}>
          <Dl
            rows={[
              ["Legal name", client.legalName],
              ["Address", client.address],
              ["Domain", `${client.domain} · they own it, we point it`],
              ["Stripe (billing)", `Customer ${client.stripe.customerId}`],
              [
                "Stripe (checkout)",
                conn.status === "not-needed" ? (
                  "Not needed · this offer takes no payments"
                ) : (
                  <span key="c" className="flex flex-wrap items-center gap-2">
                    {conn.status === "connected" ? `Connected ${conn.accountId}` : conn.status === "pending" ? "Onboarding started" : "Not connected"}
                    <button type="button" onClick={onStripe} className={btnGhost + " !min-h-0"}>
                      {conn.status === "connected" ? "Details" : conn.status === "pending" ? "Resume" : "Connect"}
                    </button>
                  </span>
                ),
              ],
              ["Code ownership", client.template ? "Theirs · repo handed over at launch; the Klyvora template stays licensed" : "Theirs · repo handed over at launch; Klyvora platform stays licensed"],
            ]}
          />
        </Panel>
      </aside>
    </div>
  );
}

export function Contacts({ client, onAdd, onInvite, onToast }) {
  return (
    <Panel title={`Contacts ${client.contacts.length}`} titleId="ct-h" action={<button type="button" onClick={onAdd} className={btnPrimary}>Add contact</button>}>
      {client.contacts.length === 0 ? (
        <Empty title="No contacts yet" action={<button type="button" onClick={onAdd} className={btnPrimary}>Add contact</button>}>
          Add the owner first: the primary contact signs proposals and receives invoices.
        </Empty>
      ) : (
        <Table caption="Contacts" heads={["Name", "Role", "Email", "Phone", "Portal access", "Gets", "Actions"]}>
          {client.contacts.map((ct) => (
            <tr key={ct.id}>
              <td className={td}>
                {ct.name} {ct.primary ? <Chip tone="accent">Primary</Chip> : null}
              </td>
              <td className={td}>{ct.role}</td>
              <td className={td}>
                <a href="mailto:contact@example.com" className="text-accent-light hover:text-fg">{ct.email}</a>
              </td>
              <td className={td}>
                <a href="tel:+17045550100" className="text-accent-light hover:text-fg">{ct.phone || "—"}</a>
              </td>
              <td className={`${td} ${ct.access === "Active" ? "text-success" : "text-muted-2"}`}>{ct.access}</td>
              <td className={`${td} text-muted-2`}>{ct.gets}</td>
              <td className={`${td} whitespace-nowrap`}>
                {ct.access !== "Active" && !ct.access.startsWith("Invited") ? (
                  <button type="button" onClick={() => onInvite(ct.id)} className={btnSecondary}>
                    Invite
                  </button>
                ) : null}{" "}
                <button type="button" aria-label={`More for ${ct.name}`} onClick={() => onToast("Make primary · Edit · Remove opens here")} className={`${btnSecondary} !px-2.5`}>
                  ⋯
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <p className="m-0 mt-3 text-xs text-muted-2">The primary contact signs proposals and receives invoices. “Gets” controls which emails each person receives.</p>
    </Panel>
  );
}

export function Subscriptions({ client, onEdit, onCancel }) {
  const offer = getOffer(client.offerCode);
  const m = client.monthly;
  const ending = m.status === "cancels at period end";
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
      <Panel title={m.on ? `Monthly plan · ${client.offer}` : "No monthly plan"} titleId="sub-h" action={m.on ? <Chip tone={ending ? "warning" : m.status === "running" ? "success" : "accent"}>{m.status === "starts at launch" ? "Starts at launch" : ending ? "Cancels at period end" : "Running"}</Chip> : <Chip>Self-managed</Chip>}>
        {m.on ? (
          <>
            <Dl
              rows={[
                ["Price", `${money(offer.monthly)}/month${offer.usage ? " + usage" : ""}`],
                ["First charge", m.status === "starts at launch" ? "On launch acceptance · then monthly" : "Monthly since launch"],
                ["Includes", offer.monthlyNote ? `${offer.monthlyNote[0].toUpperCase()}${offer.monthlyNote.slice(1)}, support, updates` : "Hosting, their admin, support, updates"],
                ["Optional?", offer.monthlyRequired ? "No · required for restaurants (RC, RK)" : "Yes · they can cancel and keep the code; booking then needs their own hosting"],
                ["Stripe subscription", m.status === "starts at launch" ? "sub_[…] · not yet created" : "sub_[…] · active"],
                ["Card on file", "Visa ···· [4242] · added in the portal"],
              ]}
            />
            <div className="flex flex-wrap gap-2 mt-5">
              <button type="button" onClick={onEdit} className={btnSecondary}>Change plan</button>
              <Link href="/admin/subscriptions" className={btnSecondary}>All subscriptions ↗</Link>
              {!ending ? (
                <button type="button" onClick={onCancel} className={`${btnSecondary} !text-danger !border-danger/40`}>
                  Cancel plan…
                </button>
              ) : null}
            </div>
            {offer.monthlyRequired ? (
              <p className="m-0 mt-3 text-xs text-muted-2">Restaurant plans can’t be cancelled while active: ordering, kiosks and kitchen operations run on our platform.</p>
            ) : null}
          </>
        ) : (
          <>
            <p className="m-0 text-[13px] text-muted-2 leading-relaxed">
              {client.business} took the code and pays nothing monthly. They host the site themselves; the handover pack goes out at launch. Add a plan any time from Change plan.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" onClick={onEdit} className={btnPrimary}>Change plan</button>
            </div>
          </>
        )}
      </Panel>
      <aside className="flex flex-col gap-4 min-w-0">
        <Panel title="Add-ons" titleId="ad-h">
          {client.addOns.length ? (
            <ul className="list-none p-0 m-0 flex flex-col gap-2 text-[13px]">
              {client.addOns.map((a) => (
                <li key={a.name} className="flex justify-between gap-3">
                  <span>{a.name}</span>
                  <span className="text-muted-2">{a.note}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[13px] text-muted-2">No add-ons on this client.</p>
          )}
          <p className="m-0 mt-3 text-xs text-muted-2">Restaurants: the monthly is required and includes ordering and menu updates ($149, or $178 with a kiosk).</p>
        </Panel>
        <Panel title="History" titleId="hi-h">
          <p className="m-0 text-[13px] text-muted-2">{m.status === "starts at launch" ? "No charges yet. The first one appears here on launch day." : m.on ? "Charged monthly through Stripe. Each charge appears here." : "No monthly charges."}</p>
        </Panel>
      </aside>
    </div>
  );
}

export function Projects({ client }) {
  const open = client.milestones.filter((m) => m.status !== "Paid").length;
  return (
    <Panel title={`${client.offer} build · started [date] · ${open} of 3 milestones open`} titleId="pj-h" action={<Link href="/admin/projects" className="text-[13px] text-accent-light hover:text-fg">Open in Projects ↗</Link>}>
      <Table caption="Milestones" heads={["Milestone", "Share", "Amount", "Trigger", "Status", "Date"]}>
        {client.milestones.map((r) => (
          <tr key={r.key}>
            <td className={td}>{r.label}</td>
            <td className={td}>{r.percent}%</td>
            <td className={`${td} tabular-nums`}>{usd(r.amount)}</td>
            <td className={`${td} text-muted-2`}>{r.trigger}</td>
            <td className={td}>
              <Chip tone={MS_TONE[r.status]}>{r.status}</Chip>
            </td>
            <td className={`${td} text-muted-2`}>{r.date}</td>
          </tr>
        ))}
      </Table>
      <p className="m-0 mt-3 text-xs text-muted-2">50 / 30 / 20. Approving the demo in the portal triggers the 30% invoice; accepting launch triggers the 20% and starts the monthly.</p>
    </Panel>
  );
}

export function Invoices({ client }) {
  const paid = client.invoices.filter((i) => i.status === "Paid").reduce((t, i) => t + i.amount, 0);
  const drafted = client.invoices.filter((i) => i.status !== "Paid").reduce((t, i) => t + i.amount, 0);
  return (
    <Panel title={`Invoices · ${usd(paid)} paid · ${usd(drafted)} outstanding or drafted`} titleId="inv-h" action={<Link href="/admin/invoices?new=1" className={btnPrimary}>New invoice</Link>}>
      {client.invoices.length === 0 ? (
        <Empty title="No invoices yet">The kickoff invoice goes out when the proposal is signed.</Empty>
      ) : (
        <Table caption="Invoices" heads={["Invoice", "For", "Amount", "Status", "Due", "Actions"]}>
          {client.invoices.map((r) => (
            <tr key={r.id}>
              <td className={td}>
                <Link href="/admin/invoices" className="text-accent-light hover:text-fg">{r.id}</Link>
              </td>
              <td className={td}>{r.for}</td>
              <td className={`${td} tabular-nums`}>{usd(r.amount)}</td>
              <td className={td}>
                <Chip tone={INV_TONE[r.status]}>{r.status}</Chip>
              </td>
              <td className={`${td} text-muted-2`}>{r.due}</td>
              <td className={td}>
                <Link href="/admin/invoices" className="text-accent-light hover:text-fg">{r.status === "Paid" ? "Receipt" : r.status === "Overdue" ? "Send reminder" : "Edit"}</Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

export function Files({ client, files, visible, onVisible, onAdd }) {
  const input = useRef(null);
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
      <Panel title={`Files ${files.length}`} titleId="fl-h" action={<CheckRow checked={visible} onChange={onVisible}>Client can see these in the portal</CheckRow>}>
        {files.length === 0 ? (
          <Empty title="No files yet" action={<button type="button" onClick={() => input.current?.click()} className={btnPrimary}>Browse files</button>}>
            Drop the logo, photos, menu or price list here, or ask the client to send them from the portal.
          </Empty>
        ) : (
          <ul className="list-none p-0 m-0 mb-4 flex flex-col">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
                <span aria-hidden="true" className="w-9 h-9 rounded-[10px] border border-border-2 inline-flex items-center justify-center text-[11px] text-muted-2 flex-none">
                  {f.ext}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-[13px] truncate">{f.name}</span>
                  <span className="text-xs text-muted-2">{f.meta}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="border border-dashed border-border-2 rounded-[12px] p-5 text-center text-[13px] text-muted-2">
          Drop files here or{" "}
          <button type="button" onClick={() => input.current?.click()} className="text-accent-light hover:text-fg underline bg-transparent border-0 cursor-pointer p-0 text-[13px]">
            browse
          </button>{" "}
          · images, PDFs, docs up to 50 MB each
          <input
            ref={input}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-label="Add files"
            onChange={(e) => {
              onAdd([...e.target.files]);
              e.target.value = "";
            }}
          />
        </div>
      </Panel>
      <aside>
        <Panel title="Handover pack" titleId="hp-h">
          <p className="m-0 text-[13px] text-muted-2 leading-relaxed">
            Generated at launch: repository access, environment file, domain instructions, and a short video. The client owns the site and its data; only Klyvora templates and platform stay licensed.
          </p>
          <div className="mt-3">
            <Chip>{client.stage === "Live" ? "Generated at launch" : "Not generated yet · after launch"}</Chip>
          </div>
        </Panel>
      </aside>
    </div>
  );
}

export function PortalUsers({ client, users, onInvite, onResend, onRevoke }) {
  return (
    <Panel title={`Portal users ${users.length}`} titleId="pu-h" action={<button type="button" onClick={() => onInvite(null)} className={btnPrimary}>Invite</button>}>
      {users.length === 0 ? (
        <Empty title="No one has portal access" action={<button type="button" onClick={() => onInvite(null)} className={btnPrimary}>Invite to portal</button>}>
          Invite the owner so they can follow the build, see files and approve the demo.
        </Empty>
      ) : (
        <Table caption="Portal users" heads={["User", "Email", "Status", "Last sign-in", "Can", "Actions"]}>
          {users.map((u) => (
            <tr key={u.email}>
              <td className={td}>{u.name}</td>
              <td className={td}>
                <a href="mailto:user@example.com" className="text-accent-light hover:text-fg">{u.email}</a>
              </td>
              <td className={td}>
                <Chip tone={u.status === "Active" ? "success" : "accent"}>{u.status}</Chip>
              </td>
              <td className={`${td} text-muted-2`}>{u.last}</td>
              <td className={`${td} text-muted-2`}>{u.can}</td>
              <td className={td}>
                {u.status === "Active" ? (
                  <button type="button" onClick={() => onRevoke(u)} className={btnSecondary}>Revoke</button>
                ) : (
                  <button type="button" onClick={() => onResend(u)} className={btnSecondary}>Resend invite</button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
      <p className="m-0 mt-3 text-xs text-muted-2">Clients sign in with a magic link (no passwords). Invites expire after 7 days; resend from here. {client.business} contacts without access are on the Contacts tab.</p>
    </Panel>
  );
}

export function Notes({ client, notes, onChange, saveState, savedAt }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
      <Panel title="Internal notes" titleId="nt-h">
        <label htmlFor="cl-notes" className="sr-only">Internal notes</label>
        <textarea
          id="cl-notes"
          rows={7}
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Only the team sees this"
          className="w-full min-w-0 rounded-input bg-surface-2 border border-border-2 p-3 text-[13px] leading-relaxed text-fg resize-y font-[inherit]"
        />
        <p role="status" className={`m-0 mt-2 text-xs flex items-center gap-1.5 ${saveState === "failed" ? "text-danger" : "text-muted-2"}`}>
          {saveState === "failed" ? <AlertIcon size={14} /> : null}
          {saveState === "saving" ? "Saving…" : saveState === "failed" ? "Couldn’t save. We’ll retry on your next change." : savedAt ? `Saves as you type · last saved ${savedAt}` : "Saves as you type"}
        </p>
      </Panel>
      <aside>
        <Panel title="Pinned" titleId="pin-h">
          {client.pinned.length ? (
            <ul className="list-none p-0 m-0 flex flex-col gap-2 text-[13px]">
              {client.pinned.map((p) => (
                <li key={p.title}>
                  <strong className="font-medium">{p.title}</strong> <span className="text-muted-2">· {p.note}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[13px] text-muted-2">Nothing pinned.</p>
          )}
        </Panel>
      </aside>
    </div>
  );
}
