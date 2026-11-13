"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHead, Panel, btnPrimary, btnSecondary } from "@/components/admin/ui";
import { Dialog, Toast, useToast, DevBar, Alert, Row, Icon, fieldCls } from "@/components/admin/leads/Overlay";
import { api, dev } from "@/components/admin/leads/api";
import { BUILD_STEPS, getDemo } from "@/lib/admin/sample-outreach";

const selectCls = "min-h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-[13px] text-fg font-[inherit] max-w-full";

// Demo review. Claude builds the demo; a person reviews it and approves before it is sent.
// States: ready, building, notfound. Approve/request changes call POST /api/admin/outreach/approvals/[approvalId];
// cancel and hand off call POST /api/admin/outreach/demos/[id].
export default function DemoReview({ demo }) {
  const [force, setForce] = useState("auto"); // dev-only: auto | ready | building | notfound
  const [cancelled, setCancelled] = useState(false);
  const [toast, showToast] = useToast();

  const sample = force === "ready" ? getDemo("dm_1") : force === "building" ? getDemo("dm_2") : null;
  const d = force === "notfound" ? null : sample || demo;
  const view = cancelled ? "notfound" : !d ? "notfound" : d.status;

  return (
    <>
      <PageHead eyebrow={`Outreach · demo review${d ? ` · ${d.business}` : ""}`} title="Review Claude’s demo">
        <Link href="/admin/outreach" className="text-[13px] text-accent-light hover:text-fg inline-flex items-center min-h-9">
          ← Back to outreach
        </Link>
      </PageHead>

      <DevBar>
        <label className="inline-flex items-center gap-2">
          State
          <select value={force} onChange={(e) => (setCancelled(false), setForce(e.target.value))} className={selectCls}>
            <option value="auto">from the id</option>
            <option value="ready">ready</option>
            <option value="building">building</option>
            <option value="notfound">notfound</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" onChange={(e) => (dev.fail = e.target.checked)} className="accent-[var(--accent)]" />
          Next request fails
        </label>
      </DevBar>

      {view === "building" ? (
        <Building
          // keyed so a new demo restarts the tracker
          key={d.id}
          demo={d}
          onCancel={async () => {
            const res = await api("POST", `/api/admin/outreach/demos/${d.id}`, { action: "cancel" });
            if (!res.ok) return showToast("Couldn’t cancel the build. Nothing was changed.", { tone: "error" });
            setCancelled(true);
            showToast("Build cancelled · prospect back at Replied");
          }}
        />
      ) : null}
      {view === "notfound" ? (
        <section role="alert" className="border border-border rounded-admin bg-surface p-10 flex flex-col items-center text-center gap-3">
          <span className="font-display text-[48px] leading-none text-muted-2">404</span>
          <h2 className="text-[18px] font-medium m-0">No demo with that id</h2>
          <p className="m-0 text-muted-2 max-w-[460px] leading-relaxed">It may have been sent and archived after 30 days, or the link was copied wrong. Demos that are still open are listed in the Outreach approval queue.</p>
          <div className="flex gap-2.5 mt-1">
            <Link href="/admin/outreach" className={btnPrimary}>
              Open the queue
            </Link>
            <Link href="/admin/support" className={btnSecondary}>
              Report a problem
            </Link>
          </div>
        </section>
      ) : null}
      {view === "ready" ? <Ready key={d.id} demo={d} showToast={showToast} /> : null}

      <Toast toast={toast} />
    </>
  );
}

function Building({ demo, onCancel }) {
  const step = demo.step;
  return (
    <Panel title="Claude is building the demo" titleId="build-h" action={<span className="text-[12px] text-muted-2">step {step} of 5 · started {demo.startedAt}</span>} aria-live="polite">
      <ol className="list-none p-0 m-0 flex flex-col gap-3 mb-5">
        {BUILD_STEPS.map((b, i) => {
          const n = i + 1;
          const done = n < step;
          const cur = n === step;
          return (
            <li key={b.label} aria-current={cur ? "step" : undefined} className="flex items-start gap-3">
              <span aria-hidden="true" className={`w-6 h-6 rounded-full border inline-flex items-center justify-center text-[11px] flex-none ${done ? "border-success text-success" : cur ? "border-fg text-fg" : "border-border-2 text-muted-2"}`}>
                {done ? "✓" : n}
              </span>
              <span className={done || cur ? "text-fg" : "text-muted"}>
                {b.label}
                <span className="block text-[12px] text-muted-2">
                  {b.note}
                  {done ? " · done" : cur ? " · in progress" : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="m-0 mb-4 text-muted-2">Usually 6–10 minutes. Reload to check progress; you’ll also get a bell notification and it appears in the Outreach approval queue when it is ready.</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/outreach" className={btnSecondary}>
          Back to outreach
        </Link>
        <button type="button" className={btnSecondary} onClick={onCancel}>
          Cancel the build
        </button>
      </div>
    </Panel>
  );
}

function Ready({ demo, showToast }) {
  const [vp, setVp] = useState("desk");
  const [name, setName] = useState(demo.business);
  const [tagline, setTagline] = useState(demo.tagline);
  const [note, setNote] = useState(`Hi [First name], here’s a quick look at what a booking page for ${demo.business} could be: your services, your hours, deposits straight to you. Prices are placeholders. Want us to make it real? Reply or book a call.`);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | changing | changeSending | changed | handed
  const [changes, setChanges] = useState("");
  const [changeErr, setChangeErr] = useState("");
  const [failed, setFailed] = useState("");
  const [hand, setHand] = useState("");
  const [dialog, setDialog] = useState(false);
  const [handNote, setHandNote] = useState("");
  const [handPhase, setHandPhase] = useState("idle");
  const phone = vp === "phone";
  const idle = status === "idle" || status === "sending" || status === "changing" || status === "changeSending";
  const base = { kind: "demo", prospectId: demo.prospectId };
  const approvalPath = `/api/admin/outreach/approvals/${demo.approvalId || demo.id}`;

  const approve = async () => {
    setFailed("");
    setStatus("sending");
    const res = await api("POST", approvalPath, { ...base, action: "approve", note, name, tagline });
    if (!res.ok) {
      setStatus("idle");
      return setFailed("The demo wasn’t sent. Nothing left the building. Check the connection and try again.");
    }
    setStatus("sent");
    showToast(`Demo sent to ${demo.to} · follow-up drafted for 3 days`);
  };
  const sendChanges = async () => {
    if (!changes.trim()) return setChangeErr("Tell Claude what to change");
    setChangeErr("");
    setFailed("");
    setStatus("changeSending");
    const res = await api("POST", approvalPath, { ...base, action: "reject", note: changes });
    if (!res.ok) {
      setStatus("changing");
      return setFailed("Claude didn’t get your notes. Try again.");
    }
    setStatus("changed");
    showToast("Notes sent to Claude · new version lands in the queue");
  };
  const handoff = async () => {
    setHandPhase("submitting");
    const res = await api("POST", `/api/admin/outreach/demos/${demo.id}`, { action: "handoff", to: hand, note: handNote, name, tagline });
    if (!res.ok) return setHandPhase("failed");
    setDialog(false);
    setStatus("handed");
    showToast(`Handed to ${hand} · they own ${demo.business} now`);
  };

  return (
    <div className="grid grid-cols-1 min-[1180px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
      <section aria-labelledby="prev-h" className="bg-surface border border-border rounded-admin p-5 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 id="prev-h" className="text-[15px] font-medium m-0">
            Preview ·{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="text-accent-light">
              {demo.url} ↗
            </a>
          </h2>
          <div role="group" aria-label="Preview size" className="inline-flex gap-1 p-1 border border-border-2 rounded-full">
            {[
              ["desk", "Desktop"],
              ["phone", "Phone"],
            ].map(([k, l]) => (
              <button key={k} type="button" aria-pressed={vp === k} onClick={() => setVp(k)} className={`min-h-8 px-4 rounded-full border-0 text-[13px] font-medium cursor-pointer ${vp === k ? "bg-fg text-bg" : "bg-transparent text-muted-2 hover:text-fg"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center bg-surface-2 border border-border rounded-admin p-3 overflow-x-auto">
          <div className="rounded-[12px] border border-border-2 bg-bg overflow-hidden w-full" style={{ maxWidth: phone ? 390 : "100%" }}>
            <div className="text-[11px] text-muted-2 px-3 py-2 border-b border-border truncate">{demo.url.replace(/[[\]]/g, "")} · not public</div>
            <div className={`flex items-center justify-between gap-3 ${phone ? "px-4" : "px-8"} py-4 border-b border-border`}>
              <span className="font-medium">{name}</span>
              <span className="text-[12px] bg-fg text-bg rounded-full px-3 py-1.5">Book now</span>
            </div>
            <div className={`${phone ? "px-4 py-7" : "px-8 py-12"} flex flex-col gap-3`}>
              <span className="text-[11px] tracking-[.25em] uppercase text-muted-2">[Neighborhood] · Charlotte</span>
              <div className="font-display leading-[1.05]" style={{ fontSize: phone ? 34 : 48 }}>
                {tagline || "Add a headline"}
              </div>
              <div className="text-muted-2">{demo.hoursLine}</div>
              <span className="self-start text-[13px] bg-fg text-bg rounded-full px-4 py-2.5 mt-1">Book an appointment</span>
            </div>
            <div className={`grid gap-2.5 ${phone ? "px-4" : "px-8"} pb-6 ${phone ? "grid-cols-1" : "grid-cols-3"}`}>
              {demo.services.map((s) => (
                <div key={s.n} className="flex justify-between gap-2 border border-border rounded-[12px] px-3.5 py-3">
                  <span>{s.n}</span>
                  <span className="text-muted-2">{s.p}</span>
                </div>
              ))}
            </div>
            <div className={`grid grid-cols-2 gap-2.5 ${phone ? "px-4" : "px-8"} pb-6`}>
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-[12px] bg-surface-2 border border-border text-[11px] text-muted-2 inline-flex items-center justify-center">
                  [Photo from Instagram]
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="m-0 mt-3 text-[12px] text-muted-2">Built on the Website + Booking offer with placeholder prices. The booking flow works but takes no money. The demo link is unlisted and expires 30 days after it is sent.</p>
      </section>

      <aside className="flex flex-col gap-4 min-w-0">
        <Panel title="What Claude used" titleId="src-h">
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {demo.sources.map((s) => (
              <li key={s.k} className="flex justify-between gap-3">
                <span className="text-muted-2">{s.k}</span>
                <span className="text-right">{s.v}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 text-[12px] text-muted-2">Public info only. Nothing was scraped from behind a login. Prices are placeholders until the owner gives real ones.</p>
        </Panel>

        <Panel title="Fix before sending" titleId="fix-h">
          <div className="flex flex-col gap-3.5">
            <Row id="dr-name" label="Business name">
              <input id="dr-name" className={fieldCls} type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </Row>
            <Row id="dr-tag" label="Headline">
              <input id="dr-tag" className={fieldCls} type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </Row>
            <Row id="dr-note" label="Note that goes with the link">
              <textarea id="dr-note" rows={4} className={`${fieldCls} resize-y leading-relaxed`} value={note} onChange={(e) => setNote(e.target.value)} />
            </Row>
          </div>
        </Panel>

        <section id="changes" aria-label="Approve, change or hand off" className="bg-surface border border-border rounded-admin p-5 flex flex-col gap-3">
          {failed ? <Alert>{failed}</Alert> : null}
          {idle ? (
            <>
              <button type="button" className={btnPrimary} onClick={approve} disabled={status !== "idle" && status !== "changing"}>
                <Icon name="send" /> {status === "sending" ? "Sending…" : "Approve and send demo"}
              </button>
              {status === "changing" || status === "changeSending" ? (
                <div className="flex flex-col gap-2.5">
                  <Row id="dr-ch" label="What should change?" error={changeErr}>
                    <textarea id="dr-ch" rows={3} className={`${fieldCls} resize-y`} value={changes} onChange={(e) => setChanges(e.target.value)} placeholder="Use the lighter photo as the hero, drop the color service, add their Saturday hours" aria-invalid={changeErr ? true : undefined} aria-describedby={changeErr ? "dr-ch-err" : undefined} />
                  </Row>
                  <button type="button" className={btnSecondary} onClick={sendChanges} disabled={status === "changeSending"}>
                    {status === "changeSending" ? "Sending…" : "Send to Claude"}
                  </button>
                </div>
              ) : (
                <button type="button" className={btnSecondary} onClick={() => setStatus("changing")}>
                  Request changes from Claude
                </button>
              )}
              <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                <label htmlFor="dr-hand" className="text-[12px] text-muted-2">
                  Hand the demo to a person
                </label>
                <div className="flex gap-2">
                  <select id="dr-hand" className={`${fieldCls} flex-1`} value={hand} onChange={(e) => setHand(e.target.value)}>
                    <option value="">Hand to…</option>
                    <option>Chris</option>
                    <option>Geoffrey</option>
                    <option>Demetrius</option>
                  </select>
                  <button type="button" className={`${btnSecondary} disabled:opacity-50`} disabled={!hand} onClick={() => (setHandPhase("idle"), setDialog(true))}>
                    Hand off
                  </button>
                </div>
              </div>
              <p className="m-0 text-[12px] text-muted-2">Nothing is sent until you press Approve. Sending logs the action to the prospect’s timeline and moves it to “Demo sent”.</p>
            </>
          ) : null}
          {status === "sent" ? (
            <p role="status" className="m-0 leading-relaxed">
              Sent to {demo.to} with your note. The prospect is now at “Demo sent”; a follow-up is drafted for 3 days from now.
            </p>
          ) : null}
          {status === "changed" ? (
            <p role="status" className="m-0 leading-relaxed">
              Claude has your notes. The prospect is back at “Demo in progress”; a new version lands in the queue when it is ready.
            </p>
          ) : null}
          {status === "handed" ? (
            <p role="status" className="m-0 leading-relaxed">
              Handed to <strong>{hand}</strong>. They own the prospect now; Claude stops editing this demo. The files are in the client folder.
            </p>
          ) : null}
        </section>
      </aside>

      {dialog ? (
        <Dialog
          role="alertdialog"
          describedBy="dh-p"
          size="sm"
          title={`Hand this demo to ${hand}?`}
          onClose={() => setDialog(false)}
          busy={handPhase === "submitting"}
          footer={
            <>
              <button type="button" className={btnSecondary} onClick={() => setDialog(false)} disabled={handPhase === "submitting"}>
                Cancel
              </button>
              <button type="button" className={btnPrimary} onClick={handoff} disabled={handPhase === "submitting"}>
                {handPhase === "submitting" ? "Handing off…" : "Hand off"}
              </button>
            </>
          }
        >
          {handPhase === "failed" ? <Alert>We couldn’t hand it off. Nothing was changed. Try again.</Alert> : null}
          <p id="dh-p" className="m-0 text-muted-2 leading-relaxed">
            {hand} becomes the owner of {demo.business}. Claude stops editing the demo and won’t send anything for this prospect. {hand} gets the files, your “fix before sending” notes, and a task on the dashboard.
          </p>
          <Row id="dh-note" label={`Note for ${hand}`}>
            <textarea id="dh-note" rows={2} className={`${fieldCls} resize-y`} value={handNote} onChange={(e) => setHandNote(e.target.value)} placeholder="Use their real prices if you can get them on the phone" />
          </Row>
        </Dialog>
      ) : null}
    </div>
  );
}
