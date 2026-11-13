"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHead, btnPrimary, btnSecondary } from "@/components/admin/ui";
import { Dialog, Toast, useToast, DevBar, Alert, Row, Segmented, fieldCls } from "@/components/admin/leads/Overlay";
import { api, dev } from "@/components/admin/leads/api";
import { BUILD_STEPS, getDemo } from "@/lib/admin/sample-outreach";

const devSelect = "min-h-8 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-xs text-fg font-[inherit]";
const card = "bg-surface border border-border rounded-admin px-6 py-5 flex flex-col gap-3 min-w-0 box-border";
const inputBig = "w-full min-h-11 rounded-[14px] border border-border-2 bg-surface-2 px-4 text-[15px] text-fg font-[inherit] box-border focus:border-fg";
const labelBig = "text-[13px] text-muted-2";
const statusMsg = "m-0 text-[13px] leading-[1.6] text-muted-2 bg-surface-2 border border-border rounded-[14px] px-4 py-3.5";

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
        <Link href="/admin/outreach" className={btnSecondary}>
          ← Back to outreach
        </Link>
      </PageHead>

      <DevBar>
        <label className="inline-flex items-center gap-2">
          State
          <select value={force} onChange={(e) => (setCancelled(false), setForce(e.target.value))} className={devSelect}>
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
        <section role="alert" className="bg-surface border border-border rounded-admin px-7 py-12 flex flex-col items-center text-center gap-3 max-w-[760px] box-border">
          <span className="font-display text-[56px] leading-none text-muted-2">404</span>
          <h2 className="text-xl font-medium m-0">No demo with that id</h2>
          <p className="m-0 text-[13px] text-muted-2 max-w-[420px] leading-[1.6]">It may have been sent and archived after 30 days, or the link was copied wrong. Demos that are still open are listed in the Outreach approval queue.</p>
          <div className="flex gap-2 mt-1.5">
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
  const pct = Math.round(((step - 1) / 5) * 100) + 10;
  return (
    <section aria-live="polite" className="bg-surface border border-border rounded-admin px-7 pt-7 pb-6 flex flex-col gap-4 max-w-[760px] box-border">
      <div className="flex justify-between items-center gap-3">
        <h2 className="text-[17px] font-medium m-0 inline-flex items-center gap-2.5">
          <span aria-hidden="true" className="w-4 h-4 border-2 border-border-2 border-t-fg rounded-full animate-spin inline-block" />
          Claude is building the demo
        </h2>
        <span className="text-[13px] text-muted tabular-nums">
          step {step} of 5 · started {demo.startedAt}
        </span>
      </div>
      <div role="progressbar" aria-label="Build progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1 rounded-sm bg-border">
        <div className="h-full rounded-sm bg-fg transition-[width] duration-[400ms]" style={{ width: `${pct}%` }} />
      </div>
      <ol className="list-none p-0 m-0 flex flex-col gap-2.5 text-[13px]">
        {BUILD_STEPS.map((b, i) => {
          const n = i + 1;
          const done = n < step;
          const cur = n === step;
          return (
            <li key={b.label} aria-current={cur ? "step" : undefined} className={`flex gap-3 items-start ${done || cur ? "text-fg" : "text-muted"}`}>
              <span aria-hidden="true" className={`w-5 h-5 rounded-full border inline-flex items-center justify-center text-[11px] flex-none ${done ? "border-success" : cur ? "border-fg" : "border-border-2"}`}>
                {done ? "✓" : n}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">{b.label}</span>
                <span className="text-muted">{b.note}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="m-0 text-[13px] text-muted-2 leading-[1.6]">Usually 6–10 minutes. Reload to check progress; you’ll also get a bell notification and it appears in the Outreach approval queue when it is ready.</p>
      <div className="flex gap-2">
        <Link href="/admin/outreach" className={btnSecondary}>
          Back to outreach
        </Link>
        <button type="button" className={btnSecondary} onClick={onCancel}>
          Cancel the build
        </button>
      </div>
    </section>
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
    <div className="flex flex-wrap gap-5 items-start">
      <section aria-labelledby="prev-h" className="flex-[3_1_560px] min-w-0 flex flex-col gap-3">
        <div className="flex flex-wrap justify-between items-center gap-2.5">
          <h2 id="prev-h" className="text-[17px] font-medium m-0">
            Preview ·{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="text-accent-light font-normal">
              {demo.url} ↗
            </a>
          </h2>
          <Segmented label="Preview size" size="md" value={vp} onChange={setVp} options={[["desk", "Desktop"], ["phone", "Phone"]]} />
        </div>
        <div className="bg-surface border border-border rounded-admin overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-2 border-b border-border">
            {[1, 2, 3].map((i) => (
              <span key={i} aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-border-2" />
            ))}
            <span className="ml-2.5 text-xs text-muted">{demo.url.replace(/[[\]]/g, "")} · not public</span>
          </div>
          <div className="flex justify-center p-6 bg-bg-deep overflow-x-auto">
            {/* The demo is the prospect's own page, so it keeps fixed dark colours in both themes. */}
            <div className="max-w-full rounded-[14px] overflow-hidden border border-border-2 bg-[#0a0a0a] text-[#f5f5f5]" style={{ width: phone ? 390 : "100%" }}>
              <div className="flex justify-between items-center px-[18px] py-3.5 text-xs text-[#b5b5b5]">
                <span className="font-display italic text-lg text-[#f5f5f5]">{name}</span>
                <span>Book now</span>
              </div>
              <div className="flex flex-col gap-3" style={{ padding: phone ? "28px 18px" : "48px 32px", background: "radial-gradient(60% 70% at 70% 20%, rgba(78,133,191,.3), transparent 70%)" }}>
                <span className="text-[11px] tracking-[.3em] uppercase text-[#b5b5b5]">[Neighborhood] · Charlotte</span>
                <span className="font-display italic leading-[.95]" style={{ fontSize: phone ? 34 : 48 }}>
                  {tagline || "Add a headline"}
                </span>
                <span className="text-[13px] text-[#b5b5b5] max-w-[420px]">{demo.hoursLine}</span>
                <span className="self-start rounded-full bg-[#f5f5f5] text-[#0a0a0a] text-[13px] font-medium px-[18px] py-2.5">Book an appointment</span>
              </div>
              <div className={`p-[18px] grid gap-2.5 ${phone ? "grid-cols-1" : "grid-cols-3"}`}>
                {demo.services.map((s) => (
                  <div key={s.n} className="border border-[#1f1f1f] rounded-[14px] px-3.5 py-3 flex justify-between gap-2 text-[13px]">
                    <span>{s.n}</span>
                    <span className="text-[#b5b5b5]">{s.p}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 px-[18px] pb-[18px]">
                <span className="flex-1 aspect-[4/3] rounded-[10px] bg-[rgba(137,170,204,.18)] flex items-center justify-center text-[11px] text-[#b5b5b5]">[Photo from Instagram]</span>
                <span className="flex-1 aspect-[4/3] rounded-[10px] bg-[rgba(78,133,191,.18)] flex items-center justify-center text-[11px] text-[#b5b5b5]">[Photo from Instagram]</span>
              </div>
            </div>
          </div>
        </div>
        <p className="m-0 text-[13px] text-muted">Built on the Website + Booking offer with placeholder prices. The booking flow works but takes no money. The demo link is unlisted and expires 30 days after it is sent.</p>
      </section>

      <aside aria-labelledby="src-h" className="flex-[2_1_340px] min-w-0 flex flex-col gap-4">
        <section className={card}>
          <h2 id="src-h" className="text-[17px] font-medium m-0">
            What Claude used
          </h2>
          <ul className="list-none p-0 m-0 flex flex-col text-[13px]">
            {demo.sources.map((s) => (
              <li key={s.k} className="flex justify-between gap-3 min-h-10 items-center border-t border-border">
                <span className="text-muted-2">{s.k}</span>
                <span className="text-right">{s.v}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-xs text-muted">Public info only. Nothing was scraped from behind a login. Prices are placeholders until the owner gives real ones.</p>
        </section>

        <section className={card}>
          <h2 className="text-[17px] font-medium m-0">Fix before sending</h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dr-name" className={labelBig}>
              Business name
            </label>
            <input id="dr-name" className={inputBig} type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dr-tag" className={labelBig}>
              Headline
            </label>
            <input id="dr-tag" className={inputBig} type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dr-note" className={labelBig}>
              Note that goes with the link
            </label>
            <textarea id="dr-note" rows={4} className={`${inputBig} !min-h-0 !py-3 !text-[13px] leading-normal resize-y`} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </section>

        <section id="changes" aria-label="Approve, change or hand off" className={`${card} !gap-2.5 scroll-mt-20`}>
          {failed ? <Alert>{failed}</Alert> : null}
          {idle ? (
            <>
              <button type="button" onClick={approve} disabled={status !== "idle" && status !== "changing"} className="min-h-[52px] rounded-full border-2 border-transparent bg-fg text-bg text-[15px] font-medium cursor-pointer inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed">
                {status === "sending" ? "Sending…" : "Approve and send demo"}
              </button>
              {status === "changing" || status === "changeSending" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="dr-ch" className={labelBig}>
                      What should change?
                    </label>
                    <textarea
                      id="dr-ch"
                      rows={3}
                      className={`${inputBig} !min-h-0 !py-3 !text-[13px] leading-normal resize-y`}
                      value={changes}
                      onChange={(e) => setChanges(e.target.value)}
                      placeholder="Use the lighter photo as the hero, drop the color service, add their Saturday hours"
                      aria-invalid={changeErr ? true : undefined}
                      aria-describedby={changeErr ? "dr-ch-err" : undefined}
                    />
                    {changeErr ? (
                      <span id="dr-ch-err" className="text-xs text-fg flex items-center gap-1.5">
                        <span aria-hidden="true">•</span>
                        {changeErr}
                      </span>
                    ) : null}
                  </div>
                  <button type="button" onClick={sendChanges} disabled={status === "changeSending"} className="min-h-12 rounded-full border-2 border-transparent bg-fg text-bg text-[13px] font-medium cursor-pointer inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed">
                    {status === "changeSending" ? "Sending…" : "Send to Claude"}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setStatus("changing")} className="min-h-12 rounded-full border border-border-2 bg-transparent text-fg text-[13px] cursor-pointer inline-flex items-center justify-center gap-2 hover:bg-surface-2">
                  Request changes from Claude
                </button>
              )}
              <div className="flex gap-2 items-center">
                <label htmlFor="dr-hand" className="sr-only">
                  Hand the demo to a person
                </label>
                <select id="dr-hand" className={`${inputBig} flex-1 !w-auto cursor-pointer`} value={hand} onChange={(e) => setHand(e.target.value)}>
                  <option value="">Hand to…</option>
                  <option>Chris</option>
                  <option>Geoffrey</option>
                  <option>Demetrius</option>
                </select>
                <button type="button" className={`${btnSecondary} !min-h-11`} disabled={!hand} aria-disabled={!hand} onClick={() => (setHandPhase("idle"), setDialog(true))}>
                  Hand off
                </button>
              </div>
              <p className="m-0 text-xs text-muted">Nothing is sent until you press Approve. Sending logs the action to the prospect’s timeline and moves it to “Demo sent”.</p>
            </>
          ) : null}
          {status === "sent" ? (
            <p role="status" className={statusMsg}>
              Sent to {demo.to} with your note. The prospect is now at “Demo sent”; a follow-up is drafted for 3 days from now.
            </p>
          ) : null}
          {status === "changed" ? (
            <p role="status" className={statusMsg}>
              Claude has your notes. The prospect is back at “Demo in progress”; a new version lands in the queue when it is ready.
            </p>
          ) : null}
          {status === "handed" ? (
            <p role="status" className={statusMsg}>
              Handed to <strong className="font-medium text-fg">{hand}</strong>. They own the prospect now; Claude stops editing this demo. The files are in the client folder.
            </p>
          ) : null}
        </section>
      </aside>

      {dialog ? (
        <Dialog
          role="alertdialog"
          describedBy="dh-p"
          width={480}
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
          <p id="dh-p" className="m-0 text-muted-2 leading-[1.6]">
            {hand} becomes the owner of {demo.business}. Claude stops editing the demo and won’t send anything for this prospect. {hand} gets the files, your “fix before sending” notes, and a task on the dashboard.
          </p>
          <Row id="dh-note" label={`Note for ${hand}`}>
            <textarea id="dh-note" rows={2} className={`${fieldCls} resize-y leading-normal`} value={handNote} onChange={(e) => setHandNote(e.target.value)} placeholder="Use their real prices if you can get them on the phone" />
          </Row>
        </Dialog>
      ) : null}
    </div>
  );
}
