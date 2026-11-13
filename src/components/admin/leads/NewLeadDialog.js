"use client";

import { useState } from "react";
import { Dialog, Row, Alert, fieldCls } from "./Overlay";
import { api } from "./api";
import { btnPrimary, btnSecondary } from "@/components/admin/ui";
import { OFFERS } from "@/lib/offers";
import { LEAD_SOURCES, OWNERS } from "@/lib/admin/sample-leads";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_NAMES = { business: "business", name: "contact name", email: "a valid email" };

// New lead dialog. Five states: idle, validation error, submitting, success (closes + toast), failed (server).
// POST /api/admin/leads -> 201 { lead } | 422 { error: "invalid", fields }
export default function NewLeadDialog({ onClose, onCreated }) {
  const [v, setV] = useState({ business: "", name: "", email: "", phone: "", offerCode: "", source: "Walk-in", owner: "Chris", status: "New", notes: "", runSiteCheck: true });
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState("idle"); // idle | submitting | failed
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (open = false) => {
    const errs = {};
    if (!v.business.trim()) errs.business = "Enter the business name";
    if (!v.name.trim()) errs.name = "Enter a contact name";
    if (!EMAIL.test(v.email.trim())) errs.email = v.email.includes("@") ? "That email is missing its domain" : "Enter a valid email";
    setErrors(errs);
    if (Object.keys(errs).length) {
      setPhase("idle");
      document.getElementById(`nl-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setPhase("submitting");
    const offer = OFFERS.find((o) => o.code === v.offerCode);
    const res = await api("POST", "/api/admin/leads", { ...v, business: v.business.trim(), name: v.name.trim(), email: v.email.trim(), offerCode: v.offerCode || null, offer: offer ? offer.name : "Not sure yet" });
    if (!res.ok) {
      if (res.status === 422 && res.data?.fields) {
        setErrors(res.data.fields);
        setPhase("idle");
      } else setPhase("failed");
      return;
    }
    onCreated({ ...res.data.lead, offerCode: v.offerCode || null, offer: offer ? offer.name : "Not sure yet" }, open);
  };

  const busy = phase === "submitting";
  const keys = Object.keys(errors);
  return (
    <Dialog
      eyebrow="Leads"
      title="New lead"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnSecondary} onClick={() => submit(true)} disabled={busy}>
            Save and open
          </button>
          <button type="button" className={btnPrimary} onClick={() => submit(false)} disabled={busy}>
            {busy ? "Saving…" : "Save lead"}
          </button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
        className="flex flex-col gap-4"
      >
        {keys.length ? (
          <Alert>
            {keys.length === 1 ? "One field needs a look" : `${keys.length} fields need a look`}: <strong>{keys.map((k) => FIELD_NAMES[k] || k).reduce((acc, n, i, a) => (i === 0 ? n : i === a.length - 1 ? `${acc} and ${n}` : `${acc}, ${n}`), "")}</strong>. Nothing was saved.
          </Alert>
        ) : null}
        {phase === "failed" ? <Alert>We couldn’t save the lead. Nothing was saved. Check the connection and try again.</Alert> : null}
        <Row id="nl-business" label="Business" required error={errors.business}>
          <input id="nl-business" className={fieldCls} type="text" value={v.business} onChange={set("business")} placeholder="Barbershop on Central" aria-invalid={errors.business ? true : undefined} aria-describedby={errors.business ? "nl-business-err" : undefined} />
        </Row>
        <Row id="nl-name" label="Contact name" required error={errors.name}>
          <input id="nl-name" className={fieldCls} type="text" value={v.name} onChange={set("name")} placeholder="Owner or manager" aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "nl-name-err" : undefined} />
        </Row>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Row id="nl-email" label="Email" required error={errors.email}>
            <input id="nl-email" className={fieldCls} type="email" value={v.email} onChange={set("email")} placeholder="name@business.com" aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? "nl-email-err" : undefined} />
          </Row>
          <Row id="nl-phone" label="Phone">
            <input id="nl-phone" className={fieldCls} type="tel" value={v.phone} onChange={set("phone")} placeholder="(704) 555-0100" />
          </Row>
        </div>
        <Row id="nl-offer" label="Offer they asked about">
          <select id="nl-offer" className={fieldCls} value={v.offerCode} onChange={set("offerCode")}>
            <option value="">Not sure yet</option>
            {OFFERS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name} ({o.code})
              </option>
            ))}
          </select>
        </Row>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Row id="nl-source" label="Source">
            <select id="nl-source" className={fieldCls} value={v.source} onChange={set("source")}>
              {LEAD_SOURCES.filter((s) => !["Site form", "Estimator", "Check my site", "Workbook import"].includes(s)).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Row>
          <Row id="nl-owner" label="Owner">
            <select id="nl-owner" className={fieldCls} value={v.owner} onChange={set("owner")}>
              {OWNERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Row>
          <Row id="nl-status" label="Status">
            <select id="nl-status" className={fieldCls} value={v.status} onChange={set("status")}>
              <option>New</option>
              <option>Contacted</option>
              <option>Demo booked</option>
            </select>
          </Row>
        </div>
        <Row id="nl-notes" label="What they need">
          <textarea id="nl-notes" rows={3} className={`${fieldCls} resize-y`} value={v.notes} onChange={set("notes")} placeholder="What they said, what you noticed about their current site" />
        </Row>
        <label className="flex items-center gap-2.5 text-muted-2 cursor-pointer min-h-9">
          <input type="checkbox" checked={v.runSiteCheck} onChange={set("runSiteCheck")} className="w-4 h-4 accent-[var(--accent)]" />
          Run “Check my site” on their current site after saving
        </label>
      </form>
    </Dialog>
  );
}
