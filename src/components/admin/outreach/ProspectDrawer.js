"use client";

import Link from "next/link";
import { Drawer, Initial, drawerFieldCls } from "@/components/admin/leads/Overlay";
import { OUTREACH_OWNERS, PHASES } from "@/lib/admin/sample-outreach";

const labelCls = "text-[13px] text-muted-2";
const pillBtn = "min-h-12 rounded-full border border-border-2 bg-transparent text-fg text-[13px] cursor-pointer inline-flex items-center justify-center gap-2 flex-[1_1_150px] hover:bg-surface-2 disabled:opacity-60 disabled:cursor-not-allowed";

// Prospect drawer (board: 480px): why Claude picked them, the activity timeline, phase/owner, demo assignment.
export default function ProspectDrawer({ p, builder, onBuilder, onClose, onChange, onStartDemo, onLog, onConvert, onNotFit }) {
  const final = p.phase === "Became a lead" || p.phase === "Not a fit";
  return (
    <Drawer
      width={480}
      eyebrow={`Prospect · found ${p.found}`}
      title={p.business}
      subtitle={
        <span>
          {p.kind} · {p.area} ·{" "}
          <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="text-accent-light">
            maps ↗
          </a>{" "}
          ·{" "}
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-accent-light">
            instagram ↗
          </a>
        </span>
      }
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="sel-phase" className={labelCls}>
            Phase
          </label>
          <select id="sel-phase" className={`${drawerFieldCls} cursor-pointer`} value={p.phase} onChange={(e) => onChange(p.id, { phase: e.target.value })}>
            {PHASES.map((ph) => (
              <option key={ph}>{ph}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="sel-owner" className={labelCls}>
            Owner
          </label>
          <select id="sel-owner" className={`${drawerFieldCls} cursor-pointer`} value={p.owner} onChange={(e) => onChange(p.id, { owner: e.target.value }, `Owner set to ${e.target.value}`)}>
            {OUTREACH_OWNERS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      <section aria-labelledby="why-h" className="flex flex-col gap-2">
        <span id="why-h" className="text-xs text-muted">
          Why Claude picked them
        </span>
        <ul className="list-none m-0 px-4 py-3.5 flex flex-col gap-1.5 text-sm leading-normal text-muted-2 bg-surface-2 border border-border rounded-[14px]">
          {p.why.map((w) => (
            <li key={w} className="flex gap-2.5">
              <span aria-hidden="true" className="text-accent-light">
                ·
              </span>
              {w}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="hist-h" className="flex flex-col gap-2.5">
        <span id="hist-h" className="text-xs text-muted">
          What’s happened so far
        </span>
        <ol className="list-none p-0 m-0 flex flex-col">
          {p.activity.map((a, i) => (
            <li key={i} className="flex gap-3 py-2.5 border-t border-border">
              <span className="mt-px">
                <Initial owner={a.who} variant="owner" />
              </span>
              <span className="flex flex-col gap-0.5 text-sm leading-normal">
                <span>{a.text}</span>
                <span className="text-xs text-muted">
                  {a.who} · {a.when}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col gap-2">
        <label htmlFor="sel-next" className={labelCls}>
          Next step
        </label>
        <input id="sel-next" key={p.next} className={drawerFieldCls} type="text" defaultValue={p.next} onBlur={(e) => e.target.value !== p.next && onChange(p.id, { next: e.target.value })} />
      </div>

      <div className="flex flex-wrap gap-2.5">
        <div className="flex-[1_1_100%] flex flex-wrap gap-2.5 items-end px-4 py-3.5 bg-surface-2 border border-border rounded-[14px]">
          <div className="flex-[1_1_160px] flex flex-col gap-1.5">
            <label htmlFor="sel-builder" className={labelCls}>
              Who builds the demo
            </label>
            <select id="sel-builder" className={`${drawerFieldCls} !bg-surface cursor-pointer`} value={builder} onChange={(e) => onBuilder(e.target.value)}>
              <option value="Claude">Claude Cowork</option>
              {OUTREACH_OWNERS.filter((o) => o !== "Claude").map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <button type="button" disabled={final} onClick={() => onStartDemo(p.id)} className="flex-[1_1_150px] min-h-11 rounded-full border-2 border-transparent bg-fg text-bg text-[13px] font-medium cursor-pointer inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed">
            Start a demo
          </button>
          <span className="flex-[1_1_100%] text-xs text-muted">{builder === "Claude" ? "Claude builds it from what it found. The demo lands in the approval queue; nothing is sent until you approve it." : "Assigned to a person. They send it when it is ready."}</span>
        </div>
        <button type="button" onClick={() => onLog(p.id)} className={pillBtn}>
          Log outreach
        </button>
        {p.phase === "Became a lead" ? (
          <Link href="/admin/leads" className={pillBtn}>
            Open in Leads ↗
          </Link>
        ) : (
          <button type="button" disabled={p.phase === "Not a fit"} onClick={() => onConvert(p)} className={pillBtn}>
            Convert to lead <span aria-hidden="true">↗</span>
          </button>
        )}
        <button type="button" disabled={final} onClick={() => onNotFit(p)} className="flex-[1_1_100%] min-h-11 rounded-full border border-border bg-transparent text-muted-2 text-[13px] cursor-pointer inline-flex items-center justify-center hover:bg-surface-2 disabled:opacity-60 disabled:cursor-not-allowed">
          Not a fit
        </button>
      </div>
    </Drawer>
  );
}
