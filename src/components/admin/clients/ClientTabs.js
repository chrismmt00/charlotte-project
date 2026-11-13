"use client";

import Link from "next/link";
import { useRef } from "react";
import { Chip, money } from "@/components/admin/ui";
import { usd } from "@/components/proposal/model";
import { getOffer } from "@/lib/offers";
import { AlertIcon, Card, CheckRow, EmptyCard, btnS, btnSDanger, btnSPrimary, linkBtn, tdCls, tdIn, textareaCls, thCls, thIn, trCls } from "./kit";

// Layout from the board: .two-col = minmax(0,1fr) 340px, gap 20, single column at 1180px and below.
const TWO_COL = "grid grid-cols-1 min-[1181px]:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start";
const COL = "flex flex-col gap-5 min-w-0";
const MS_TONE = { Paid: "success", Open: "accent", Overdue: "danger", "Not started": "muted" };
const INV_TONE = { Paid: "success", Draft: "muted", Overdue: "danger", Open: "accent" };
const mono = "font-mono text-xs";
const link = "text-accent-light hover:text-fg";

// Stat tile: surface, radius 16, padding 18 20, gap 6.
function Stat({ label, href, children }) {
  const cls = "bg-surface border border-border rounded-admin px-5 py-[18px] box-border flex flex-col gap-1.5 min-w-0 text-fg";
  const inner = (
    <>
      <span className="text-[13px] text-muted-2">{label}</span>
      {children}
    </>
  );
  return href ? (
    <Link href={href} className={`${cls} hover:border-border-2`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
const Big = ({ children }) => <span className="text-[28px] font-medium leading-none tabular-nums">{children}</span>;
const Mid = ({ children }) => <span className="text-xl font-medium leading-[1.2]">{children}</span>;
const Note = ({ children }) => <span className="text-[13px] text-muted">{children}</span>;

// Stacked definition list: dt 12px muted over dd 13px.
function Dl({ rows, cols = false }) {
  return (
    <dl className={`m-0 text-[13px] ${cols ? "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3" : "flex flex-col gap-2.5"}`}>
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5 min-w-0">
          <dt className="text-xs text-muted">{k}</dt>
          <dd className="m-0 min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function CountSub({ n }) {
  return <span className="text-[13px] text-muted font-normal">{n}</span>;
}

export function Overview({ client, tasks, onToggleTask, onTab, onEdit, onStripe }) {
  const offer = getOffer(client.offerCode);
  const next = client.milestones.find((m) => m.status !== "Paid");
  const conn = client.stripe.connect;
  const m = client.monthly;
  const pct = Math.round((client.paidToDate / client.build) * 100);
  const primary = client.contacts.find((c) => c.primary) || client.contacts[0];
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Stat label="Paid to date">
          <span className="flex items-baseline gap-2">
            <Big>{usd(client.paidToDate)}</Big>
            <Note>of {usd(client.build)} build</Note>
          </span>
          <div aria-hidden="true" className="h-1 rounded-sm bg-border mt-1.5">
            <div className="h-full rounded-sm bg-fg" style={{ width: `${pct}%` }} />
          </div>
        </Stat>
        <Stat label="Next milestone">
          <Mid>{next ? `${next.label} · ${next.percent}%` : "All paid"}</Mid>
          <Note>{next ? `${usd(next.amount)} ${next.status === "Overdue" ? "overdue" : next.key === "demo" ? "due at demo approval" : next.key === "launch" ? "due at acceptance" : "due at signing"} · ${next.date}` : "The monthly plan is the only thing left"}</Note>
        </Stat>
        <Stat label="Monthly plan">
          <Mid>{m.on ? `${money(offer.monthly)}/mo · ${m.status}` : "None"}</Mid>
          <Note>{m.on ? `${(offer.monthlyNote || "hosting, their admin, support").replace(/^./, (c) => c)} · ${m.required ? "required for restaurants" : "optional, they chose it"}` : "Self-managed: they take the code"}</Note>
        </Stat>
        <Stat label="Open tickets" href="/admin/support">
          <span className="flex items-baseline gap-2">
            <Big>{client.tickets.open}</Big>
            <Note>{client.tickets.latest || "Nothing waiting on us"}</Note>
          </span>
        </Stat>
      </div>

      <div className={TWO_COL}>
        <div className={COL}>
          <Card
            title={`Project · ${client.offer}`}
            titleId="ms-h"
            action={
              <Link href="/admin/projects" className="text-[13px] text-accent-light hover:text-fg">
                Open project ↗
              </Link>
            }
          >
            <ol className="list-none m-0 p-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {client.milestones.map((ms, i) => (
                <li key={ms.key} aria-current={ms === next ? "step" : undefined} className="flex flex-col gap-2 text-[13px]">
                  <span aria-hidden="true" className={`h-[3px] rounded-sm ${ms.status === "Paid" ? "bg-success" : ms === next ? "bg-fg" : "bg-border-2"}`} />
                  <span className={`font-medium ${ms.status === "Not started" ? "text-muted" : "text-fg"}`}>
                    {ms.label} · {ms.percent}%
                  </span>
                  <span className="text-muted">
                    {usd(ms.amount)} · {ms.status === "Paid" ? `paid ${ms.date}` : i === 1 ? "due at demo approval" : i === 2 ? "due at acceptance; monthly starts" : "due at signing"}
                  </span>
                </li>
              ))}
            </ol>
            {tasks.length ? (
              <ul className="list-none m-0 p-0 flex flex-col text-[13px]">
                {tasks.map((t, i) => (
                  <li key={t.label} className="flex items-center gap-3 min-h-10 border-t border-border">
                    <input type="checkbox" checked={t.done} onChange={() => onToggleTask(i)} aria-label={t.label} className="w-4 h-4 m-0 accent-[var(--accent)]" />
                    <span className={`flex-1 min-w-0 ${t.done ? "line-through text-muted" : ""}`}>{t.label}</span>
                    <span className="text-muted whitespace-nowrap">
                      {t.who} · {t.when}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[13px] text-muted border-t border-border pt-3">Launched. No open project tasks.</p>
            )}
          </Card>

          <Card title="Recent activity" titleId="act-h">
            <ol className="list-none m-0 p-0 flex flex-col">
              {client.events.map((ev, i) => (
                <li key={ev.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 pb-3.5 relative">
                  <span aria-hidden="true" className={`absolute left-[13px] top-7 bottom-0 w-px ${i === client.events.length - 1 ? "bg-transparent" : "bg-border"}`} />
                  <span aria-hidden="true" className="w-7 h-7 rounded-full border border-border-2 bg-surface-2 inline-flex items-center justify-center text-[10px] font-medium text-muted-2">
                    {ev.icon}
                  </span>
                  <span className="flex flex-col gap-0.5 pt-1 text-[13px]">
                    <span className="font-medium">{ev.title}</span>
                    <span className="text-xs text-muted">{ev.meta}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <aside className={COL}>
          <Card
            title="Primary contact"
            titleId="pc-h"
            action={
              <button type="button" onClick={() => onTab("contacts")} className={linkBtn}>
                All contacts
              </button>
            }
          >
            {primary ? (
              <Dl
                rows={[
                  ["Name", `${primary.name} · ${primary.role.toLowerCase()}`],
                  [
                    "Email",
                    <a key="e" href="mailto:contact@example.com" className={link}>
                      {primary.email}
                    </a>,
                  ],
                  [
                    "Phone",
                    <a key="p" href="tel:+17045550100" className={link}>
                      {primary.phone}
                    </a>,
                  ],
                  ["Portal", <span key="s" className={primary.access === "Active" ? "text-success" : "text-muted-2"}>{primary.access === "Active" ? "Active · last sign-in yesterday" : primary.access}</span>],
                ]}
              />
            ) : (
              <p className="m-0 text-[13px] text-muted">No contacts yet.</p>
            )}
          </Card>
          <Card
            title="Business"
            titleId="bi-h"
            action={
              <button type="button" onClick={onEdit} className={linkBtn}>
                Edit
              </button>
            }
          >
            <Dl
              rows={[
                ["Legal name", client.legalName],
                ["Address", client.address],
                [
                  "Domain",
                  <span key="d" className={mono}>
                    {client.domain} · they own it, we point it
                  </span>,
                ],
                [
                  "Stripe (our billing)",
                  <span key="b">
                    <span className="text-success">Customer</span> <span className={`${mono} text-muted`}>{client.stripe.customerId}</span>
                  </span>,
                ],
                [
                  "Stripe (their checkout)",
                  conn.status === "not-needed" ? (
                    <span key="c" className="text-muted-2">Not needed · this offer takes no payments</span>
                  ) : (
                    <span key="c" className="flex flex-wrap items-center gap-2">
                      {conn.status === "connected" ? (
                        <>
                          <span className="text-success">Connected</span> <span className={`${mono} text-muted`}>{conn.accountId}</span>
                        </>
                      ) : (
                        <span className="text-muted-2">{conn.status === "pending" ? "Onboarding started" : "Not connected"}</span>
                      )}
                      <button type="button" onClick={onStripe} className={linkBtn}>
                        {conn.status === "connected" ? "Details" : conn.status === "pending" ? "Resume" : "Connect"}
                      </button>
                    </span>
                  ),
                ],
                ["Code ownership", client.template ? "Theirs · repo handed over at launch; Klyvora templates stay licensed" : "Theirs · repo handed over at launch; Klyvora platform stays licensed"],
              ]}
            />
          </Card>
        </aside>
      </div>
    </>
  );
}

export function Contacts({ client, onAdd, onInvite, onToast }) {
  const add = (
    <button type="button" onClick={onAdd} className={btnSPrimary}>
      Add contact
    </button>
  );
  return (
    <Card flush title="Contacts" titleId="ct-h" sub={String(client.contacts.length)} action={add}>
      {client.contacts.length === 0 ? (
        <div className="px-5 pb-5">
          <EmptyCard title="No contacts yet" actions={add}>
            Add the owner first: the primary contact signs proposals and receives invoices.
          </EmptyCard>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-[13px]">
            <caption className="sr-only">Contacts</caption>
            <thead>
              <tr className="bg-surface-2">
                {["Name", "Role", "Email", "Phone", "Portal access", "Gets"].map((h) => (
                  <th key={h} scope="col" className={thCls}>
                    {h}
                  </th>
                ))}
                <th scope="col" className={`${thCls} !text-right`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {client.contacts.map((ct) => (
                <tr key={ct.id} className={trCls}>
                  <td className={`${tdCls} font-medium`}>
                    {ct.name}{" "}
                    {ct.primary ? <span className="text-[11px] text-muted-2 border border-border-2 rounded-full px-2 py-0.5 ml-1.5 font-normal">Primary</span> : null}
                  </td>
                  <td className={`${tdCls} text-muted-2`}>{ct.role}</td>
                  <td className={tdCls}>
                    <a href="mailto:contact@example.com" className={link}>
                      {ct.email}
                    </a>
                  </td>
                  <td className={tdCls}>
                    <a href="tel:+17045550100" className={link}>
                      {ct.phone || "—"}
                    </a>
                  </td>
                  <td className={`${tdCls} ${ct.access === "Active" ? "text-success" : "text-muted-2"}`}>{ct.access}</td>
                  <td className={`${tdCls} text-muted-2`}>{ct.gets}</td>
                  <td className={`${tdCls} text-right whitespace-nowrap`}>
                    {ct.access !== "Active" && !ct.access.startsWith("Invited") ? (
                      <button type="button" onClick={() => onInvite(ct.id)} className={btnS}>
                        Invite
                      </button>
                    ) : null}{" "}
                    <button type="button" aria-label={`More for ${ct.name}`} onClick={() => onToast("Make primary · Edit · Remove opens here")} className={`${btnS} !px-3`}>
                      ⋯
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="m-0 px-5 pt-3 pb-4 text-xs text-muted border-t border-border">The primary contact signs proposals and receives invoices. “Gets” controls which emails each person receives.</p>
    </Card>
  );
}

export function Subscriptions({ client, onEdit, onCancel }) {
  const offer = getOffer(client.offerCode);
  const m = client.monthly;
  const ending = m.status === "cancels at period end";
  return (
    <div className={TWO_COL}>
      <Card
        title={m.on ? `Monthly plan · ${client.offer}` : "No monthly plan"}
        titleId="sub-h"
        action={<Chip tone={ending ? "warning" : m.status === "running" ? "success" : "accent"}>{!m.on ? "Self-managed" : m.status === "starts at launch" ? "Starts at launch" : ending ? "Cancels at period end" : "Running"}</Chip>}
      >
        {m.on ? (
          <>
            <Dl
              cols
              rows={[
                [
                  "Price",
                  <span key="p" className="text-xl font-medium">
                    {money(offer.monthly)}
                    <span className="text-[13px] text-muted font-normal">/month{offer.usage ? " + usage" : ""}</span>
                  </span>,
                ],
                ["First charge", m.status === "starts at launch" ? "On launch acceptance · then monthly" : "Monthly since launch"],
                ["Includes", offer.monthlyNote ? `${offer.monthlyNote[0].toUpperCase()}${offer.monthlyNote.slice(1)}, support, updates` : "Hosting, their admin, support, updates"],
                ["Optional?", offer.monthlyRequired ? "No · required for restaurants (RC, RK)" : "Yes · they can cancel and keep the code; booking then needs their own hosting"],
                [
                  "Stripe subscription",
                  <span key="s" className={`${mono} text-muted`}>
                    {m.status === "starts at launch" ? "sub_[…] · not yet created" : "sub_[…] · active"}
                  </span>,
                ],
                ["Card on file", "Visa ···· [4242] · added in the portal"],
              ]}
            />
            <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
              <button type="button" onClick={onEdit} className={`${btnS} mt-3`}>
                Change plan
              </button>
              <Link href="/admin/subscriptions" className={`${btnS} mt-3`}>
                All subscriptions ↗
              </Link>
              {!ending ? (
                <button type="button" onClick={onCancel} className={`${btnSDanger} mt-3`}>
                  Cancel plan…
                </button>
              ) : null}
            </div>
            {offer.monthlyRequired ? <p className="m-0 text-xs text-muted">Restaurant plans can’t be cancelled while active: ordering, kiosks and kitchen operations run on our platform.</p> : null}
          </>
        ) : (
          <>
            <p className="m-0 text-[13px] text-muted-2 leading-[1.6]">
              {client.business} took the code and pays nothing monthly. They host the site themselves; the handover pack goes out at launch. Add a plan any time from Change plan.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
              <button type="button" onClick={onEdit} className={`${btnSPrimary} mt-3`}>
                Change plan
              </button>
            </div>
          </>
        )}
      </Card>
      <aside className={COL}>
        <Card title="Add-ons">
          {client.addOns.length ? (
            <ul className="list-none m-0 p-0 flex flex-col text-[13px]">
              {client.addOns.map((a) => (
                <li key={a.name} className="flex justify-between items-center gap-2.5 min-h-10 border-t border-border">
                  <span>{a.name}</span>
                  <span className="text-muted-2">{a.note}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[13px] text-muted">No add-ons on this client.</p>
          )}
          <p className="m-0 text-xs text-muted">Restaurants: the monthly is required and includes ordering and menu updates ($149 or $178 with a kiosk).</p>
        </Card>
        <Card title="History">
          <p className="m-0 text-[13px] text-muted">{m.status === "starts at launch" ? "No charges yet. The first one appears here on launch day." : m.on ? "Charged monthly through Stripe. Each charge appears here." : "No monthly charges."}</p>
        </Card>
      </aside>
    </div>
  );
}

export function Projects({ client }) {
  const open = client.milestones.filter((m) => m.status !== "Paid").length;
  return (
    <Card
      title={`${client.offer} build`}
      titleId="pj-h"
      sub={`· started [date] · ${open} of 3 milestones open`}
      action={
        <Link href="/admin/projects" className={btnS}>
          Open in Projects ↗
        </Link>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[13px]">
          <caption className="sr-only">Milestones</caption>
          <thead>
            <tr className="bg-surface-2">
              {[
                ["Milestone", ""],
                ["Share", ""],
                ["Amount", "!text-right"],
                ["Trigger", ""],
                ["Status", ""],
                ["Date", ""],
              ].map(([h, c]) => (
                <th key={h} scope="col" className={`${thIn} ${c}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {client.milestones.map((r) => (
              <tr key={r.key} className={trCls}>
                <td className={`${tdIn} font-medium`}>{r.label}</td>
                <td className={`${tdIn} text-muted-2`}>{r.percent}%</td>
                <td className={`${tdIn} text-right tabular-nums`}>{usd(r.amount)}</td>
                <td className={`${tdIn} text-muted-2`}>{r.trigger}</td>
                <td className={tdIn}>
                  <Chip tone={MS_TONE[r.status]}>{r.status}</Chip>
                </td>
                <td className={`${tdIn} text-muted`}>{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-xs text-muted">50 / 30 / 20 from PROJECT-BRIEF.md. Approving the demo in the portal triggers the 30% invoice; accepting launch triggers the 20% and starts the monthly.</p>
    </Card>
  );
}

export function Invoices({ client }) {
  const paid = client.invoices.filter((i) => i.status === "Paid").reduce((t, i) => t + i.amount, 0);
  const drafted = client.invoices.filter((i) => i.status !== "Paid").reduce((t, i) => t + i.amount, 0);
  const add = (
    <Link href="/admin/invoices?new=1" className={btnSPrimary}>
      New invoice
    </Link>
  );
  return (
    <Card flush title="Invoices" titleId="inv-h" sub={`· ${usd(paid)} paid · ${usd(drafted)} ${client.invoices.some((i) => i.status === "Overdue") ? "outstanding" : "drafted"}`} action={add}>
      {client.invoices.length === 0 ? (
        <div className="px-5 pb-5">
          <EmptyCard title="No invoices yet">The kickoff invoice goes out when the proposal is signed.</EmptyCard>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <caption className="sr-only">Invoices</caption>
            <thead>
              <tr className="bg-surface-2">
                {[
                  ["Invoice", ""],
                  ["For", ""],
                  ["Amount", "!text-right"],
                  ["Status", ""],
                  ["Due", ""],
                ].map(([h, c]) => (
                  <th key={h} scope="col" className={`${thCls} ${c}`}>
                    {h}
                  </th>
                ))}
                <th scope="col" className={`${thCls} !text-right`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {client.invoices.map((r) => (
                <tr key={r.id} className={trCls}>
                  <td className={`${tdCls} ${mono}`}>
                    <Link href="/admin/invoices" className="text-fg">
                      {r.id}
                    </Link>
                  </td>
                  <td className={tdCls}>{r.for}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{usd(r.amount)}</td>
                  <td className={tdCls}>
                    <Chip tone={INV_TONE[r.status]}>{r.status}</Chip>
                  </td>
                  <td className={`${tdCls} text-muted`}>{r.due}</td>
                  <td className={`${tdCls} text-right whitespace-nowrap`}>
                    <Link href="/admin/invoices" className={btnS}>
                      {r.status === "Paid" ? "Receipt" : r.status === "Overdue" ? "Send reminder" : "Edit"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function Files({ client, files, visible, onVisible, onAdd }) {
  const input = useRef(null);
  const browse = () => input.current?.click();
  return (
    <div className={TWO_COL}>
      <Card
        title="Files"
        titleId="fl-h"
        sub={String(files.length)}
        action={
          <CheckRow checked={visible} onChange={onVisible} className="!text-muted-2">
            Client can see these in the portal
          </CheckRow>
        }
      >
        {files.length === 0 ? (
          <EmptyCard
            title="No files yet"
            actions={
              <button type="button" onClick={browse} className={btnSPrimary}>
                Browse files
              </button>
            }
          >
            Drop the logo, photos, menu or price list here, or ask the client to send them from the portal.
          </EmptyCard>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
            {files.map((f) => (
              <div key={f.id} className="border border-border rounded-xl p-3 flex flex-col gap-2 text-[13px] bg-surface-2 min-w-0">
                <span aria-hidden="true" className="w-9 h-9 rounded-[10px] border border-border-2 inline-flex items-center justify-center font-mono text-[10px] text-muted-2 bg-surface">
                  {f.ext}
                </span>
                <span className="font-medium overflow-hidden text-ellipsis whitespace-nowrap">{f.name}</span>
                <span className="text-muted">{f.meta}</span>
              </div>
            ))}
          </div>
        )}
        <div className="border border-dashed border-border-2 rounded-xl p-5 text-center text-[13px] text-muted-2">
          Drop files here or{" "}
          <button type="button" onClick={browse} className="bg-transparent border-0 p-0 font-[inherit] text-accent-light underline cursor-pointer">
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
      </Card>
      <aside className={COL}>
        <Card title="Handover pack">
          <p className="m-0 text-[13px] text-muted-2 leading-[1.6]">
            Generated at launch: repository access, environment file, domain instructions, and a short video. The client owns the site and its data; only Klyvora templates and platform stay licensed.
          </p>
          <span className="self-start">
            <Chip>{client.stage === "Live" ? "Generated at launch" : "Not generated yet · after launch"}</Chip>
          </span>
        </Card>
      </aside>
    </div>
  );
}

export function PortalUsers({ users, onInvite, onResend, onRevoke }) {
  const add = (
    <button type="button" onClick={() => onInvite(null)} className={btnSPrimary}>
      Invite
    </button>
  );
  return (
    <Card flush title="Portal users" titleId="pu-h" sub={String(users.length)} action={add}>
      {users.length === 0 ? (
        <div className="px-5 pb-5">
          <EmptyCard title="No one has portal access" actions={add}>
            Invite the owner so they can follow the build, see files and approve the demo.
          </EmptyCard>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <caption className="sr-only">Portal users</caption>
            <thead>
              <tr className="bg-surface-2">
                {["User", "Email", "Status", "Last sign-in", "Can"].map((h) => (
                  <th key={h} scope="col" className={thCls}>
                    {h}
                  </th>
                ))}
                <th scope="col" className={`${thCls} !text-right`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email} className={trCls}>
                  <td className={`${tdCls} font-medium`}>{u.name}</td>
                  <td className={tdCls}>
                    <a href="mailto:user@example.com" className={link}>
                      {u.email}
                    </a>
                  </td>
                  <td className={tdCls}>
                    <Chip tone={u.status === "Active" ? "success" : "accent"}>{u.status}</Chip>
                  </td>
                  <td className={`${tdCls} text-muted`}>{u.last}</td>
                  <td className={`${tdCls} text-muted-2`}>{u.can}</td>
                  <td className={`${tdCls} text-right whitespace-nowrap`}>
                    {u.status === "Active" ? (
                      <button type="button" onClick={() => onRevoke(u)} className={btnS}>
                        Revoke
                      </button>
                    ) : (
                      <button type="button" onClick={() => onResend(u)} className={btnS}>
                        Resend invite
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="m-0 px-5 pt-3 pb-4 text-xs text-muted border-t border-border">Clients sign in with a magic link (no passwords). Invites expire after 7 days; resend from here.</p>
    </Card>
  );
}

export function Notes({ client, notes, onChange, saveState, savedAt }) {
  return (
    <div className={TWO_COL}>
      <Card title={<label htmlFor="cl-notes">Internal notes</label>} titleId="nt-h">
        <textarea id="cl-notes" rows={5} value={notes} onChange={(e) => onChange(e.target.value)} placeholder="Only the team sees this" className={`${textareaCls} w-full`} />
        <span role="status" className={`text-xs flex items-center gap-1.5 ${saveState === "failed" ? "text-danger" : "text-muted"}`}>
          {saveState === "failed" ? <AlertIcon size={14} /> : null}
          {saveState === "saving" ? "Saving…" : saveState === "failed" ? "Couldn’t save. We’ll retry on your next change." : savedAt ? `Saves as you type · last saved ${savedAt}` : "Saves as you type"}
        </span>
      </Card>
      <aside className={COL}>
        <Card title="Pinned">
          {client.pinned.length ? (
            <ul className="list-none m-0 p-0 flex flex-col gap-2 text-[13px]">
              {client.pinned.map((p) => (
                <li key={p.title} className="px-3 py-2.5 border border-border rounded-xl bg-surface-2 text-muted-2">
                  <strong className="font-medium text-fg">{p.title}</strong> · {p.note}
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[13px] text-muted">Nothing pinned.</p>
          )}
        </Card>
      </aside>
    </div>
  );
}
