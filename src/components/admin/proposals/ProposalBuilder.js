"use client";

import Link from "next/link";
import { useState } from "react";
import { Panel, Chip, btnPrimary, btnSecondary, btnGhost, btnDanger } from "@/components/admin/ui";
import { CheckRow, Dialog, EMAIL_RE, FailBanner, FieldRow, Toast, api, inputCls, useToast } from "@/components/admin/clients/kit";
import { OFFERS, getOffer, money } from "@/lib/offers";
import { LEADS } from "@/lib/admin/sample";
import { BILLED_SEPARATELY, NEEDS_CONNECT, OWNERSHIP_TERMS, PROPOSAL_TONE, SCOPE_CAPS, addOnsFor, computeTotals, defaultCaps, isRestaurant, monthlyNote, usd } from "@/components/proposal/model";

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

function Section({ n, title, note, children }) {
  return (
    <section className="bg-surface border border-border rounded-admin p-5 flex flex-col gap-4 min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-medium m-0">
          {n} · {title}
        </h2>
        {note ? <span className="text-xs text-muted-2">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Timeline({ p }) {
  const s = p.status;
  const end = s === "Declined" ? "Declined" : s === "Expired" ? "Expired" : "Accepted";
  const steps = ["Draft", "Sent", "Viewed", end];
  const idx = { Draft: 0, Sent: 1, Viewed: 2, Accepted: 3, Declined: 3, Expired: 3 }[s];
  const note = (step, i) => {
    if (i === 0) return `[date] · ${p.created.split("· ")[1] || "Chris"}`;
    if (i === 1) return s === "Draft" ? "not yet" : "[date] · to the primary contact";
    if (i === 2) return s === "Draft" ? "—" : s === "Sent" ? "not opened yet · nudge on day 3" : p.views ? `[date] · opened ${p.views}× · 4 min on the price table` : "[date] · opened";
    if (s === "Accepted") return "[date] · typed signature · IP logged";
    if (s === "Declined") return `[date] · “${p.declinedReason || "not now"}” · check back in 90 days`;
    if (s === "Expired") return "[date] · resend to reopen";
    return "waiting";
  };
  return (
    <ol className="list-none p-0 m-0 flex flex-col" aria-label="Proposal status">
      {steps.map((st, i) => {
        const done = i <= idx;
        const here = i === idx;
        const bad = here && (s === "Declined" || s === "Expired");
        return (
          <li key={st} aria-current={here ? "step" : undefined} className="flex gap-3 items-start">
            <span className="flex flex-col items-center self-stretch">
              <span
                aria-hidden="true"
                className={`w-6 h-6 rounded-full border inline-flex items-center justify-center text-[11px] flex-none ${
                  bad ? "border-border-2 text-muted-2" : done ? (here && s !== "Accepted" ? "border-fg text-fg" : "border-success text-success") : "border-border-2 text-muted-2"
                }`}
              >
                {done && !bad ? "✓" : i + 1}
              </span>
              {i < steps.length - 1 ? <span className={`w-px flex-1 my-1 ${i < idx ? "bg-success" : "bg-border"}`} /> : null}
            </span>
            <span className="flex flex-col gap-0.5 pb-3 min-w-0">
              <span className={`text-[13px] ${done ? "text-fg" : "text-muted-2"}`}>{st}</span>
              <span className="text-xs text-muted-2">{note(st, i)}</span>
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
        <FieldRow id="ps-to" label="To" error={error}>
          <input id="ps-to" data-autofocus type="email" value={to} onChange={(e) => setTo(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "ps-to-err" : undefined} className={inputCls} />
        </FieldRow>
        <FieldRow id="ps-cc" label="Cc">
          <input id="ps-cc" type="email" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="partner, bookkeeper" className={inputCls} />
        </FieldRow>
        <FieldRow id="ps-msg" label="Message">
          <textarea id="ps-msg" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} className={`${inputCls} py-2.5 leading-relaxed`} />
        </FieldRow>
        <div className="rounded-input border border-border bg-surface-2 p-3.5 text-xs text-muted-2 leading-relaxed">
          Link: klyvora.ai/p/{p.token || "[token]"} · expires in {p.validDays} days · views are tracked.
          <br />
          On signature: lead → Signed, client created, kickoff invoice ({usd(totals.schedule[0].amount)}) sent, portal invite sent.
        </div>
        <CheckRow checked={nudge} onChange={() => setNudge((v) => !v)}>
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
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted-2 mb-4">
        <Link href="/admin/leads" className="hover:text-fg">Leads</Link>
        <span aria-hidden="true">/</span>
        <button type="button" onClick={onBack} className="bg-transparent border-0 p-0 text-[13px] text-muted-2 hover:text-fg cursor-pointer">Proposals</button>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-fg">{p.id || "New"}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="text-[11px] tracking-[.3em] uppercase text-muted-2 mb-2">
            {eyebrow} <span className="md:hidden normal-case tracking-normal ml-2 border border-border-2 rounded-full px-2 py-0.5">Sample data</span>
          </div>
          <h1 className="font-display font-normal text-[clamp(32px,4vw,44px)] leading-none m-0 break-words">{p.name || "New proposal"}</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={onBack} className={btnSecondary}>← All proposals</button>
          {p.token ? (
            <Link href={`/p/${p.token}`} target="_blank" className={btnSecondary}>
              Preview as the client <span aria-hidden="true">↗</span>
            </Link>
          ) : null}
          {p.token && p.status !== "Draft" ? <button type="button" onClick={copyLink} className={btnSecondary}>Copy link</button> : null}
          {!frozen ? (
            <button type="button" onClick={saveDraft} disabled={saving} className={`${btnSecondary} disabled:opacity-60`}>
              {saving ? "Saving…" : "Save draft"}
            </button>
          ) : null}
          {canSend ? (
            <button type="button" onClick={openSend} disabled={saving} className={`${btnPrimary} disabled:opacity-60`}>
              {p.status === "Draft" ? "Send proposal" : "Resend"}
            </button>
          ) : null}
        </div>
      </div>

      {frozen ? (
        <p role="note" className="m-0 mb-4 text-[13px] text-muted-2 border border-border-2 rounded-input px-3.5 py-2.5">
          Prices are frozen once a proposal is sent. {p.status === "Expired" || p.status === "Declined" ? "Resend to reopen it at the same numbers." : "Changes need a new proposal."}
        </p>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <fieldset disabled={frozen} className="border-0 p-0 m-0 min-w-0 flex flex-col gap-4">
          <Section n="1" title="Who it’s for">
            <FieldRow id="pb-lead" label="Lead or client" error={errors.lead}>
              <select id="pb-lead" value={p.leadId} onChange={pickLead} aria-invalid={!!errors.lead} aria-describedby={errors.lead ? "pb-lead-err" : undefined} className={inputCls}>
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
          </Section>

          <Section n="2" title="Offer" note="Prices from the catalog">
            <div role="radiogroup" aria-label="Offer" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OFFERS.map((o) => {
                const on = o.code === p.offerCode;
                return (
                  <label key={o.code} className={`flex gap-2.5 items-start p-3 rounded-input border cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-fg has-[:disabled]:cursor-default ${on ? "border-fg bg-surface-2" : "border-border-2"}`}>
                    <input type="radio" name="offer" checked={on} onChange={() => pickOffer(o.code)} className="mt-0.5 accent-[var(--accent)]" />
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-fg">
                        {o.name} <span className="text-muted-2">({o.code})</span>
                      </span>
                      <span className="text-xs text-muted-2">
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
          </Section>

          <Section n="3" title="Scope" note="Pre-filled from the offer; edit freely">
            <ul className="list-none p-0 m-0 flex flex-col gap-1">
              {offer.includes.map((t, i) => {
                const off = p.scopeOff.includes(i);
                return (
                  <li key={t}>
                    <CheckRow checked={!off} onChange={() => setP((c) => ({ ...c, scopeOff: off ? c.scopeOff.filter((x) => x !== i) : [...c.scopeOff, i] }))}>
                      <span className={off ? "line-through text-muted-2" : ""}>{t}</span>
                    </CheckRow>
                  </li>
                );
              })}
            </ul>
            <FieldRow id="pb-extra" label="Anything extra (shows under “Also included”)">
              <textarea id="pb-extra" rows={2} value={p.extras} onChange={set("extras")} placeholder="Migrate the 40 photos from Instagram · Set up the Google Business link" className={`${inputCls} py-2.5`} />
            </FieldRow>
            <fieldset className="border-0 p-0 m-0 min-w-0">
              <legend className="text-[13px] text-muted-2 mb-2">Caps. Every proposal limits these; the founders fill the [PLACEHOLDER] values.</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SCOPE_CAPS.map((c) => (
                  <FieldRow key={c.key} id={`cap-${c.key}`} label={c.label}>
                    <input id={`cap-${c.key}`} value={p.caps[c.key]} onChange={(e) => setP((cur) => ({ ...cur, caps: { ...cur.caps, [c.key]: e.target.value } }))} className={inputCls} />
                  </FieldRow>
                ))}
              </div>
            </fieldset>
          </Section>

          <Section n="4" title="Add-ons and the monthly">
            {addOns.length ? (
              <ul className="list-none p-0 m-0 flex flex-col gap-2">
                {addOns.map((a) => {
                  const qty = Number(p.addOns[a.code] || 0);
                  return (
                    <li key={a.code} className="flex flex-wrap items-center gap-3">
                      <CheckRow
                        className="flex-1 min-w-[220px]"
                        checked={qty > 0}
                        onChange={() => setP((c) => ({ ...c, addOns: { ...c.addOns, [a.code]: qty > 0 ? 0 : 1 } }))}
                      >
                        {a.name}
                        {a.help ? <span className="block text-xs text-muted-2">{a.help}</span> : null}
                      </CheckRow>
                      {a.perDevice && qty > 0 ? (
                        <label className="flex items-center gap-2 text-xs text-muted-2">
                          Devices
                          <input type="number" min={1} max={20} value={qty} onChange={(e) => setP((c) => ({ ...c, addOns: { ...c.addOns, [a.code]: Math.max(1, Number(e.target.value) || 1) } }))} className={`${inputCls} !w-20`} />
                        </label>
                      ) : null}
                      <span className="text-[13px] tabular-nums text-muted-2">
                        {a.setupFrom ? "from " : ""}
                        {usd(a.setup)} + {usd(a.monthly)}/mo{a.perDevice ? " per device" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="m-0 text-[13px] text-muted-2">No add-ons for this offer.</p>
            )}
            <CheckRow checked={totals.monthlyOn} disabled={totals.monthlyRequired} onChange={() => setP((c) => ({ ...c, monthly: !c.monthly }))}>
              Monthly plan · {usd(totals.monthlyAmount)}/mo{totals.usage ? " + usage" : ""}
              <span className="block text-xs text-muted-2 mt-0.5">{monthlyNote(offer)}</span>
            </CheckRow>
          </Section>

          <Section n="5" title="Terms and validity">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldRow id="pb-terms" label="Terms template">
                <select id="pb-terms" value={p.termsTemplate} onChange={set("termsTemplate")} className={inputCls}>
                  {TERMS.map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow id="pb-valid" label="Valid for">
                <select id="pb-valid" value={p.validDays} onChange={(e) => setP((c) => ({ ...c, validDays: Number(e.target.value) }))} className={inputCls}>
                  {[14, 7, 30].map((d) => (
                    <option key={d} value={d}>{d} days</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow id="pb-start" label="Earliest start">
                <input id="pb-start" type="date" value={p.earliestStart} onChange={set("earliestStart")} className={inputCls} />
              </FieldRow>
            </div>
            <div className="rounded-input border border-border bg-surface-2 p-4 flex flex-col gap-3">
              <div className="text-xs text-muted-2">Ownership terms · fixed text from the brief, edited in the template in Settings, not here. [DRAFT until the lawyer’s text lands.]</div>
              {OWNERSHIP_TERMS.map((t) => (
                <div key={t.title} className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium">{t.title}</span>
                  <span className="text-[13px] text-muted-2 leading-relaxed">{t.body}</span>
                </div>
              ))}
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium">Billed separately</span>
                <span className="text-[13px] text-muted-2 leading-relaxed">{BILLED_SEPARATELY.join("; ")}.</span>
              </div>
            </div>
          </Section>
        </fieldset>

        <aside className="flex flex-col gap-4 min-w-0 xl:sticky xl:top-20">
          <Panel title="Totals the client sees" titleId="tot-h" action={<Chip tone={PROPOSAL_TONE[p.status]}>{p.status}</Chip>}>
            <ul className="list-none p-0 m-0 mb-3 flex flex-col gap-1 text-[13px]">
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
            <div className="flex justify-between items-baseline border-t border-border pt-3">
              <span className="text-[13px] text-muted-2">Build</span>
              <span className="text-[22px] font-medium tabular-nums">
                {totals.buildFrom ? "from " : ""}
                {usd(totals.build)}
              </span>
            </div>
            <ul className="list-none p-0 m-0 mt-3 flex flex-col gap-1.5 text-[13px]" aria-label="Payment schedule">
              {totals.schedule.map((m) => (
                <li key={m.label} className="flex justify-between gap-3">
                  <span className="text-muted-2">
                    {m.label} · {m.percent}% · {m.when}
                  </span>
                  <span className="tabular-nums">{usd(m.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-baseline border-t border-border pt-3 mt-3 text-[13px]">
              <span className="text-muted-2">Monthly</span>
              <span className="tabular-nums">{totals.monthlyOn ? `${usd(totals.monthlyAmount)}/mo${totals.usage ? " + usage" : ""}` : "none · self-managed"}</span>
            </div>
            {connect ? <p className="m-0 mt-3 text-xs text-muted-2">After signing they connect their own Stripe account for payments. Klyvora takes $0 of their sales.</p> : null}
            {p.token ? (
              <Link href={`/p/${p.token}`} target="_blank" className="inline-block mt-3 text-[13px] text-accent-light hover:text-fg">
                Open the client page ↗
              </Link>
            ) : null}
          </Panel>

          <Panel title="Status" titleId="st-h">
            <Timeline p={p} />
            {p.status === "Sent" || p.status === "Viewed" ? (
              <div className="flex flex-wrap gap-2 mt-2">
                <button type="button" className={btnSecondary} onClick={() => setStatus("Sent", "Nudge sent · “Did the proposal land?”").catch(() => showToast("Couldn’t send the nudge.", { tone: "error" }))}>
                  Send a nudge
                </button>
                <button type="button" className={btnSecondary} onClick={() => setDialog("accept")}>
                  Mark accepted (signed on paper)
                </button>
                <button type="button" className={btnGhost} onClick={() => setDialog("decline")}>
                  Mark declined
                </button>
              </div>
            ) : null}
            {p.status === "Accepted" ? (
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href={p.clientId ? `/admin/clients/${p.clientId}` : "/admin/clients"} className={btnSecondary}>
                  Open the client
                </Link>
                <Link href="/admin/invoices" className={btnSecondary}>
                  Kickoff invoice
                </Link>
              </div>
            ) : null}
          </Panel>
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
