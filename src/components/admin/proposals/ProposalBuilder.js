"use client";

import Link from "next/link";
import { useState } from "react";
import { btnPrimary, btnSecondary, btnDanger } from "@/components/admin/ui";
import { Card, CheckRow, Dialog, EMAIL_RE, FailBanner, FieldRow, TitleBlock, Toast, api, btnS, groupCls, inputCls, selectCls, textareaCls, useToast } from "@/components/admin/clients/kit";
import { OFFERS, getOffer, money } from "@/lib/offers";
import { LEADS } from "@/lib/admin/sample";
import { BILLED_SEPARATELY, NEEDS_CONNECT, OWNERSHIP_TERMS, SCOPE_CAPS, addOnsFor, computeTotals, defaultCaps, isRestaurant, monthlyNote, usd } from "@/components/proposal/model";

const TWO_COL = "grid grid-cols-1 min-[1181px]:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start";
const COL = "flex flex-col gap-5 min-w-0";

const TERMS = [
  ["standard", "Standard · websites and booking"],
  ["ecommerce", "Ecommerce (store policies)"],
  ["restaurant", "Restaurant (monthly required)"],
  ["custom", "Custom app (hourly overages)"],
];
const termsFor = (code) => (getOffer(code)?.monthlyRequired ? "restaurant" : code === "EC" ? "ecommerce" : code === "CA" ? "custom" : "standard");

// A new draft from a lead (or blank).
export function newDraft(leadId) {
  const lead = LEADS.find((l) => l.id === leadId);
  const offerCode = lead && getOffer(lead.offerCode) ? lead.offerCode : "WB";
  const offer = getOffer(offerCode);
  return {
    id: null,
    token: null,
    leadId: lead ? lead.id : "",
    business: lead ? lead.business : "",
    contactName: lead ? lead.name : "",
    email: "",
    name: lead ? `${offer.name} for ${lead.business}` : "",
    offerCode,
    addOns: {},
    monthly: true,
    quote: "",
    scopeOff: [],
    extras: "",
    caps: defaultCaps(offerCode),
    termsTemplate: termsFor(offerCode),
    validDays: 14,
    earliestStart: "2026-11-17",
    status: "Draft",
    created: "just now · Chris",
    sentNote: "not sent",
    views: 0,
  };
}

function emailFor(p) {
  const bare = (p.email || "").replace(/[[\]]/g, "");
  if (EMAIL_RE.test(bare)) return bare;
  const n = (p.business.match(/\[(\d+)\]/) || [])[1];
  return n ? `owner${n}@example.com` : "";
}

// Status chip: 12px pill, border-2, colour by status with a 6px dot (board).
export function StatusChip({ status }) {
  const t = { Draft: ["text-muted", "bg-muted"], Sent: ["text-accent-light", "bg-accent-light"], Viewed: ["text-accent", "bg-accent"], Accepted: ["text-success", "bg-success"], Declined: ["text-muted-2", "bg-muted-2"], Expired: ["text-warning", "bg-warning"] }[status] || ["text-muted", "bg-muted"];
  return (
    <span className={`inline-flex items-center whitespace-nowrap text-xs border border-border-2 rounded-full px-2.5 py-1 ${t[0]}`}>
      <span aria-hidden="true" className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${t[1]}`} />
      {status}
    </span>
  );
}

function Timeline({ p }) {
  const s = p.status;
  const end = s === "Declined" ? "Declined" : s === "Expired" ? "Expired" : "Accepted";
  const steps = ["Draft", "Sent", "Viewed", end];
  const idx = { Draft: 0, Sent: 1, Viewed: 2, Accepted: 3, Declined: 3, Expired: 3 }[s];
  const note = (i) => {
    if (i === 0) return `[date] · ${p.created.split("· ")[1] || "Chris"}`;
    if (i === 1) return s === "Draft" ? "not yet" : "[date] · to the primary contact";
    if (i === 2) return s === "Draft" ? "—" : s === "Sent" ? "not opened yet · nudge on day 3" : p.views ? `[date] · opened ${p.views}× · 4 min on the price table` : "[date] · opened";
    if (s === "Accepted") return "[date] · typed signature · IP logged";
    if (s === "Declined") return `Declined [date] · “${p.declinedReason || "not now"}” · check back in 90 days`;
    if (s === "Expired") return "Expired [date] · resend to reopen";
    return "waiting";
  };
  return (
    <ol className="list-none m-0 p-0 flex flex-col gap-2.5 text-[13px]" aria-label="Proposal status">
      {steps.map((st, i) => {
        const done = i <= idx;
        const here = i === idx;
        const ring = done ? (here && s !== "Accepted" ? "border-fg" : "border-success") : "border-border-2";
        return (
          <li key={st} aria-current={here ? "step" : undefined} className={`flex gap-3 items-start ${done ? "text-fg" : "text-muted"}`}>
            <span aria-hidden="true" className={`w-5 h-5 rounded-full border inline-flex items-center justify-center text-[11px] flex-none ${ring}`}>
              {done ? "✓" : i + 1}
            </span>
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium">{st}</span>
              <span className="text-muted">{note(i)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function SendDialog({ p, totals, onClose, onSent }) {
  const [to, setTo] = useState(emailFor(p));
  const [cc, setCc] = useState("");
  const [msg, setMsg] = useState(
    `Hi [First name], here’s the proposal we talked about: ${p.name.toLowerCase().replace(/ for .*/, "")}, ${usd(totals.build)} to build, half to start. The monthly is ${totals.monthlyRequired ? "part of the plan for restaurants" : "optional"} and explained on the page. Open it, read it tonight, and sign when it looks right, or reply with anything you’d change.`,
  );
  const [nudge, setNudge] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");
  const busy = status === "submitting";

  async function submit(e) {
    e.preventDefault();
    if (!EMAIL_RE.test(to.trim())) {
      setError("Enter the client’s email.");
      setStatus("error");
      return;
    }
    setError("");
    setStatus("submitting");
    try {
      await api(`/api/admin/proposals/${p.id}/send`, { method: "POST", body: { to: to.trim(), cc: cc.trim() || undefined, message: msg, autoNudge: nudge } });
      onSent();
    } catch {
      setStatus("failed");
    }
  }

  return (
    <Dialog
      eyebrow={`${p.id} · ${usd(totals.build)}`}
      title="Send the proposal"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" form="ps-form" disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>
            {busy ? "Sending…" : "Send proposal"}
          </button>
        </>
      }
    >
      <form id="ps-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        {status === "failed" ? <FailBanner>The proposal didn’t send and nothing was emailed. Try again.</FailBanner> : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FieldRow id="ps-to" label="To" error={error}>
            <input id="ps-to" data-autofocus type="email" value={to} onChange={(e) => setTo(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "ps-to-err" : undefined} className={inputCls} />
          </FieldRow>
          <FieldRow id="ps-cc" label="Cc">
            <input id="ps-cc" type="email" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="partner, bookkeeper" className={inputCls} />
          </FieldRow>
        </div>
        <FieldRow id="ps-msg" label="Message">
          <textarea id="ps-msg" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} className={textareaCls} />
        </FieldRow>
        <div className="rounded-xl border border-border bg-surface-2 px-3.5 py-3 flex flex-col gap-1.5 text-muted-2">
          <span>
            Link: <span className="font-mono text-xs text-fg">klyvora.ai/p/{p.token || "[token]"}</span> · expires in {p.validDays} days · views are tracked
          </span>
          <span>On signature: lead → Signed, client created, kickoff invoice ({usd(totals.schedule[0].amount)}) sent, portal invite sent.</span>
        </div>
        <CheckRow className="!text-muted-2" checked={nudge} onChange={() => setNudge((v) => !v)}>
          Nudge automatically on day 3 if not opened
        </CheckRow>
      </form>
    </Dialog>
  );
}

function ConfirmDialog({ title, body, confirm, danger, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <Dialog
      alert
      size="sm"
      title={title}
      describedBy="pc-p"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setFailed(false);
              try {
                await onConfirm();
              } catch {
                setFailed(true);
                setBusy(false);
              }
            }}
            className={`${danger ? btnDanger : btnPrimary} disabled:opacity-60`}
          >
            {busy ? "Working…" : confirm}
          </button>
        </>
      }
    >
      <p id="pc-p" className="m-0 text-[13px] text-muted-2 leading-relaxed">
        {body}
      </p>
      {failed ? <FailBanner>That didn’t go through. Nothing changed; try again.</FailBanner> : null}
    </Dialog>
  );
}

// onSaved(proposal): saved to the list. onStatus(id, status): status moved (sent, accepted, declined). onBack: back to the list.
export default function ProposalBuilder({ initial, onBack, onSaved, onStatus }) {
  const [p, setP] = useState(initial);
  const [nameTouched, setNameTouched] = useState(!!initial.id);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, showToast] = useToast();

  const totals = computeTotals({ offerCode: p.offerCode, addOns: p.addOns, monthly: p.monthly, quote: p.quote });
  const offer = totals.offer;
  const frozen = p.status !== "Draft";
  const closed = p.status === "Accepted";
  const addOns = addOnsFor(p.offerCode);
  const set = (k) => (e) => setP((c) => ({ ...c, [k]: e.target.value }));

  function pickLead(e) {
    const lead = LEADS.find((l) => l.id === e.target.value);
    setP((c) => {
      if (!lead) return { ...c, leadId: "", business: "" };
      const code = getOffer(lead.offerCode) ? lead.offerCode : c.offerCode;
      return {
        ...c,
        leadId: lead.id,
        business: lead.business,
        contactName: lead.name,
        offerCode: code,
        caps: defaultCaps(code),
        termsTemplate: termsFor(code),
        addOns: code === c.offerCode ? c.addOns : {},
        scopeOff: code === c.offerCode ? c.scopeOff : [],
        name: nameTouched ? c.name : `${getOffer(code).name} for ${lead.business}`,
      };
    });
  }

  function pickOffer(code) {
    setP((c) => ({
      ...c,
      offerCode: code,
      addOns: {},
      scopeOff: [],
      quote: "",
      monthly: isRestaurant(code) ? true : c.monthly,
      caps: defaultCaps(code),
      termsTemplate: termsFor(code),
      name: nameTouched ? c.name : `${getOffer(code).name} for ${c.business || "[business]"}`,
    }));
  }

  async function saveDraft() {
    const er = {};
    if (!p.name.trim()) er.name = "Give the proposal a name.";
    if (!p.business) er.lead = "Pick the lead or client it’s for.";
    setErrors(er);
    if (Object.keys(er).length) {
      showToast("Fix the highlighted fields first.", { tone: "error" });
      return null;
    }
    setSaving(true);
    try {
      const body = { ...p, name: p.name.trim(), monthly: totals.monthlyOn };
      const { proposal } = p.id ? await api(`/api/admin/proposals/${p.id}`, { method: "PATCH", body }) : await api("/api/admin/proposals", { method: "POST", body });
      const saved = { ...p, id: proposal.id || p.id, token: proposal.token || p.token };
      setP(saved);
      onSaved(saved);
      showToast("Draft saved");
      return saved;
    } catch {
      showToast("Couldn’t save the draft. Nothing changed.", { tone: "error" });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function openSend() {
    if (!p.id) {
      const saved = await saveDraft();
      if (!saved) return;
    }
    setDialog("send");
  }

  async function copyLink() {
    const url = `klyvora.ai/p/${p.token}`;
    try {
      await navigator.clipboard.writeText(`https://${url}`);
      showToast(`Link copied · ${url}`);
    } catch {
      showToast(`Copy this link: ${url}`);
    }
  }

  async function setStatus(status, message) {
    await api(`/api/admin/proposals/${p.id}`, { method: "PATCH", body: { status } });
    setP((c) => ({ ...c, status }));
    onStatus(p.id, status);
    setDialog(null);
    showToast(message);
  }

  const canSend = !closed && p.status !== "Declined";
  const connect = NEEDS_CONNECT.includes(p.offerCode);
  const eyebrow = `Proposal builder · ${p.id || "new draft"}`;

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted">
        <Link href="/admin/leads" className="text-muted-2 hover:text-fg">
          Leads
        </Link>
        <span aria-hidden="true">/</span>
        <button type="button" onClick={onBack} className="bg-transparent border-0 p-0 text-[13px] text-muted-2 hover:text-fg cursor-pointer">
          Proposals
        </button>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-fg">
          {p.id || "New"}
        </span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <TitleBlock eyebrow={eyebrow} title={p.name || "New proposal"} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onBack} className={btnSecondary}>
            ← All proposals
          </button>
          {p.token ? (
            <Link href={`/p/${p.token}`} target="_blank" className={btnSecondary}>
              Preview as the client <span aria-hidden="true">↗</span>
            </Link>
          ) : null}
          {p.token && p.status !== "Draft" ? (
            <button type="button" onClick={copyLink} className={btnSecondary}>
              Copy link
            </button>
          ) : null}
          {!frozen ? (
            <button type="button" onClick={saveDraft} disabled={saving} className={btnSecondary}>
              {saving ? "Saving…" : "Save draft"}
            </button>
          ) : null}
          {canSend ? (
            <button type="button" onClick={openSend} disabled={saving} className={btnPrimary}>
              {p.status === "Draft" ? "Send proposal" : "Resend"}
            </button>
          ) : null}
        </div>
      </header>

      {frozen ? (
        <p role="note" className="m-0 text-[13px] text-muted-2 border border-border-2 rounded-xl px-3.5 py-2.5">
          Prices are frozen once a proposal is sent. {p.status === "Expired" || p.status === "Declined" ? "Resend to reopen it at the same numbers." : "Changes need a new proposal."}
        </p>
      ) : null}

      <div className={TWO_COL}>
        <fieldset disabled={frozen} className="border-0 p-0 m-0 min-w-0 flex flex-col gap-5">
          <Card title="1 · Who it’s for">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <FieldRow id="pb-lead" label="Lead or client" error={errors.lead}>
                <select id="pb-lead" value={p.leadId} onChange={pickLead} aria-invalid={!!errors.lead} aria-describedby={errors.lead ? "pb-lead-err" : undefined} className={selectCls}>
                  <option value="">{p.business && !p.leadId ? p.business : "Pick a lead…"}</option>
                  {LEADS.filter((l) => l.status !== "Lost").map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.business} · {l.name}
                    </option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow id="pb-name" label="Proposal name" error={errors.name}>
                <input
                  id="pb-name"
                  value={p.name}
                  onChange={(e) => {
                    setNameTouched(true);
                    set("name")(e);
                  }}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "pb-name-err" : undefined}
                  className={inputCls}
                />
              </FieldRow>
            </div>
          </Card>

          <Card title="2 · Offer">
            <div role="radiogroup" aria-label="Offer" className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 text-[13px]">
              {OFFERS.map((o) => {
                const on = o.code === p.offerCode;
                return (
                  <label key={o.code} className={`flex gap-2.5 items-start px-3 py-2.5 border rounded-xl cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-light has-[:disabled]:cursor-default ${on ? "border-fg bg-surface-2" : "border-border-2"}`}>
                    <input type="radio" name="offer" checked={on} onChange={() => pickOffer(o.code)} className="mt-[3px] m-0 accent-[var(--accent)]" />
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-medium">
                        {o.name} ({o.code})
                      </span>
                      <span className="text-muted">
                        {o.setupFrom ? "from " : ""}
                        {money(o.setup)} build · {money(o.monthly)}/mo {o.monthlyRequired ? "required" : "optional"}
                        {o.usage ? " + usage" : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {offer.setupFrom ? (
              <FieldRow id="pb-quote" label={`Fixed quote for the build (from ${money(offer.setup)})`} hint="Scoped before we start; never below the catalog price.">
                <input id="pb-quote" type="number" min={offer.setup} step="1" value={p.quote} onChange={set("quote")} placeholder={String(offer.setup)} className={inputCls} />
              </FieldRow>
            ) : null}
          </Card>

          <Card title="3 · Scope" action={<span className="text-xs text-muted">Pre-filled from the offer; edit freely</span>}>
            <ul className="list-none m-0 p-0 flex flex-col gap-1.5 text-[13px]">
              {offer.includes.map((t, i) => {
                const off = p.scopeOff.includes(i);
                return (
                  <li key={t}>
                    <CheckRow checked={!off} onChange={() => setP((c) => ({ ...c, scopeOff: off ? c.scopeOff.filter((x) => x !== i) : [...c.scopeOff, i] }))}>
                      <span className={off ? "line-through text-muted" : ""}>{t}</span>
                    </CheckRow>
                  </li>
                );
              })}
            </ul>
            <FieldRow id="pb-extra" label="Anything extra (shows under “Also included”)">
              <textarea id="pb-extra" rows={2} value={p.extras} onChange={set("extras")} placeholder="Migrate the 40 photos from Instagram · Set up the Google Business link" className={textareaCls} />
            </FieldRow>
            <fieldset className={`${groupCls} !gap-3`}>
              <legend className="text-xs text-muted-2 px-1.5">Caps. Every proposal limits these; the founders fill the [PLACEHOLDER] values.</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {SCOPE_CAPS.map((c) => (
                  <FieldRow key={c.key} id={`cap-${c.key}`} label={c.label}>
                    <input id={`cap-${c.key}`} value={p.caps[c.key]} onChange={(e) => setP((cur) => ({ ...cur, caps: { ...cur.caps, [c.key]: e.target.value } }))} className={inputCls} />
                  </FieldRow>
                ))}
              </div>
            </fieldset>
          </Card>

          <Card title="4 · Add-ons and the monthly">
            {addOns.length ? (
              <ul className="list-none m-0 p-0 flex flex-col gap-2 text-[13px]">
                {addOns.map((a) => {
                  const qty = Number(p.addOns[a.code] || 0);
                  return (
                    <li key={a.code} className="flex flex-wrap gap-2.5 items-center px-3 py-2.5 border border-border rounded-xl">
                      <input
                        type="checkbox"
                        checked={qty > 0}
                        onChange={() => setP((c) => ({ ...c, addOns: { ...c.addOns, [a.code]: qty > 0 ? 0 : 1 } }))}
                        aria-label={a.name}
                        className="w-4 h-4 m-0 accent-[var(--accent)]"
                      />
                      <span className="flex-1 min-w-[180px] flex flex-col gap-0.5">
                        <span className="font-medium">{a.name}</span>
                        {a.help ? <span className="text-muted">{a.help}</span> : null}
                      </span>
                      {a.perDevice && qty > 0 ? (
                        <label className="flex items-center gap-2 text-xs text-muted-2">
                          Devices
                          <input type="number" min={1} max={20} value={qty} onChange={(e) => setP((c) => ({ ...c, addOns: { ...c.addOns, [a.code]: Math.max(1, Number(e.target.value) || 1) } }))} className={`${inputCls} !w-20`} />
                        </label>
                      ) : null}
                      <span className="tabular-nums whitespace-nowrap text-muted-2">
                        {a.setupFrom ? "from " : ""}
                        {usd(a.setup)} + {usd(a.monthly)}/mo{a.perDevice ? " per device" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="m-0 text-[13px] text-muted">No add-ons for this offer.</p>
            )}
            <label className="flex gap-2.5 items-start px-3.5 py-3 border border-border rounded-xl bg-surface-2 text-[13px] cursor-pointer has-[:disabled]:cursor-default">
              <input type="checkbox" checked={totals.monthlyOn} disabled={totals.monthlyRequired} onChange={() => setP((c) => ({ ...c, monthly: !c.monthly }))} className="w-4 h-4 mt-0.5 m-0 accent-[var(--accent)]" />
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">
                  Monthly plan · {usd(totals.monthlyAmount)}/mo{totals.usage ? " + usage" : ""}
                </span>
                <span className="text-muted">{monthlyNote(offer)}</span>
              </span>
            </label>
          </Card>

          <Card title="5 · Terms and validity">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <FieldRow id="pb-terms" label="Terms template">
                <select id="pb-terms" value={p.termsTemplate} onChange={set("termsTemplate")} className={selectCls}>
                  {TERMS.map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow id="pb-valid" label="Valid for">
                <select id="pb-valid" value={p.validDays} onChange={(e) => setP((c) => ({ ...c, validDays: Number(e.target.value) }))} className={selectCls}>
                  {[14, 7, 30].map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow id="pb-start" label="Earliest start">
                <input id="pb-start" type="date" value={p.earliestStart} onChange={set("earliestStart")} className={inputCls} />
              </FieldRow>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 px-3.5 py-3 flex flex-col gap-3">
              <div className="text-xs text-muted">Ownership terms · fixed text from the brief, edited in the template in Settings, not here. [DRAFT until the lawyer’s text lands.]</div>
              {OWNERSHIP_TERMS.map((t) => (
                <div key={t.title} className="flex flex-col gap-0.5 text-[13px]">
                  <span className="font-medium">{t.title}</span>
                  <span className="text-muted-2 leading-[1.6]">{t.body}</span>
                </div>
              ))}
              <div className="flex flex-col gap-0.5 text-[13px]">
                <span className="font-medium">Billed separately</span>
                <span className="text-muted-2 leading-[1.6]">{BILLED_SEPARATELY.join("; ")}.</span>
              </div>
            </div>
            <p className="m-0 text-xs text-muted leading-normal">Ownership lines are fixed text: the client owns the site, the code and the data; Klyvora templates stay licensed. Edit the templates in Settings, not here.</p>
          </Card>
        </fieldset>

        <aside className={`${COL} min-[1181px]:sticky min-[1181px]:top-20`}>
          <Card title="Totals the client sees" className="!gap-3" action={<StatusChip status={p.status} />}>
            {totals.lines.length > 1 ? (
              <ul className="list-none m-0 p-0 flex flex-col gap-1 text-[13px]" aria-label="What the build includes">
                {totals.lines.map((l) => (
                  <li key={l.label} className="flex justify-between gap-3">
                    <span className="text-muted-2">{l.label}</span>
                    <span className="tabular-nums">
                      {l.from ? "from " : ""}
                      {usd(l.setup)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex justify-between items-baseline">
              <span className="text-[13px] text-muted-2">Build</span>
              <span className="text-[26px] font-medium tabular-nums">
                {totals.buildFrom ? "from " : ""}
                {usd(totals.build)}
              </span>
            </div>
            <ul className="list-none m-0 p-0 flex flex-col text-[13px]" aria-label="Payment schedule">
              {totals.schedule.map((m) => (
                <li key={m.label} className="flex justify-between gap-2.5 py-2 border-t border-border">
                  <span className="text-muted-2">
                    {m.label} · {m.percent}% · {m.when}
                  </span>
                  <span className="tabular-nums">{usd(m.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-baseline pt-2 border-t border-border">
              <span className="text-[13px] text-muted-2">Monthly</span>
              <span className="text-lg font-medium tabular-nums">{totals.monthlyOn ? `${usd(totals.monthlyAmount)}/mo${totals.usage ? " + usage" : ""}` : "none · self-managed"}</span>
            </div>
            {connect ? <p className="m-0 text-xs text-muted">After signing they connect their own Stripe account for payments. Klyvora takes $0 of their sales.</p> : null}
            {p.token ? (
              <Link href={`/p/${p.token}`} target="_blank" className={btnSecondary}>
                Open the client page <span aria-hidden="true">↗</span>
              </Link>
            ) : null}
          </Card>

          <Card title="Status">
            <Timeline p={p} />
            {p.status === "Sent" || p.status === "Viewed" ? (
              <div className="flex flex-wrap gap-2 pt-1.5 border-t border-border">
                <button type="button" className={`${btnS} mt-1.5`} onClick={() => setStatus("Sent", "Nudge sent · “Did the proposal land?”").catch(() => showToast("Couldn’t send the nudge.", { tone: "error" }))}>
                  Send a nudge
                </button>
                <button type="button" className={`${btnS} mt-1.5`} onClick={() => setDialog("accept")}>
                  Mark accepted (signed on paper)
                </button>
                <button type="button" className={`${btnS} mt-1.5 !text-muted-2`} onClick={() => setDialog("decline")}>
                  Mark declined
                </button>
              </div>
            ) : null}
            {p.status === "Accepted" ? (
              <div className="flex flex-wrap gap-2 pt-1.5 border-t border-border">
                <Link href={p.clientId ? `/admin/clients/${p.clientId}` : "/admin/clients"} className={`${btnPrimary} mt-1.5`}>
                  Open the client
                </Link>
                <Link href="/admin/invoices" className={`${btnS} mt-1.5`}>
                  Kickoff invoice
                </Link>
              </div>
            ) : null}
          </Card>
        </aside>
      </div>

      {dialog === "send" && p.id ? (
        <SendDialog
          p={p}
          totals={totals}
          onClose={() => setDialog(null)}
          onSent={() => {
            setP((c) => ({ ...c, status: "Sent" }));
            onStatus(p.id, "Sent");
            setDialog(null);
            showToast(`${p.id} sent · link expires in ${p.validDays} days`);
          }}
        />
      ) : null}
      {dialog === "accept" ? (
        <ConfirmDialog
          title="Mark as accepted?"
          confirm="Mark accepted"
          body={`Use this when ${p.business} signed on paper. The lead becomes Signed, a client is created and the kickoff invoice (${usd(totals.schedule[0].amount)}) goes out.`}
          onClose={() => setDialog(null)}
          onConfirm={() => setStatus("Accepted", "Accepted · client created, kickoff invoice sent")}
        />
      ) : null}
      {dialog === "decline" ? (
        <ConfirmDialog
          danger
          title="Mark as declined?"
          confirm="Mark declined"
          body={`${p.business} passed on this one. The proposal closes and the reason is saved on the lead. You can resend it later to reopen it.`}
          onClose={() => setDialog(null)}
          onConfirm={() => setStatus("Declined", "Marked declined · reason saved on the lead")}
        />
      ) : null}
      <Toast toast={toast} />
    </>
  );
}

export { totalsOf };
function totalsOf(p) {
  return computeTotals({ offerCode: p.offerCode, addOns: p.addOns, monthly: p.monthly, quote: p.quote });
}
