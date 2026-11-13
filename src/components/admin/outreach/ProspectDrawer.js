"use client";

import Link from "next/link";
import { Drawer, Row, Initial, fieldCls } from "@/components/admin/leads/Overlay";
import { Chip, btnPrimary, btnSecondary } from "@/components/admin/ui";
import { OUTREACH_OWNERS, PHASES, PHASE_TONE } from "@/lib/admin/sample-outreach";

// Prospect drawer: why Claude picked them, the activity timeline, phase/owner, demo assignment.
export default function ProspectDrawer({ p, builder, onBuilder, onClose, onChange, onStartDemo, onLog, onConvert, onNotFit }) {
  const final = p.phase === "Became a lead" || p.phase === "Not a fit";
  return (
    <Drawer
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
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={() => onLog(p.id)}>
            Log outreach
          </button>
          {p.phase === "Became a lead" ? (
            <Link href="/admin/leads" className={btnSecondary}>
              Open in Leads ↗
            </Link>
          ) : (
            <button type="button" className={btnPrimary} disabled={p.phase === "Not a fit"} onClick={() => onConvert(p)}>
              Convert to lead
            </button>
          )}
          <button type="button" className={btnSecondary} disabled={final} onClick={() => onNotFit(p)}>
            Not a fit
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Row id="sel-phase" label="Phase">
          <select id="sel-phase" className={fieldCls} value={p.phase} onChange={(e) => onChange(p.id, { phase: e.target.value })}>
            {PHASES.map((ph) => (
              <option key={ph}>{ph}</option>
            ))}
          </select>
        </Row>
        <Row id="sel-owner" label="Owner">
          <select id="sel-owner" className={fieldCls} value={p.owner} onChange={(e) => onChange(p.id, { owner: e.target.value }, `Owner set to ${e.target.value}`)}>
            {OUTREACH_OWNERS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Row>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-muted-2">
        <Chip tone={PHASE_TONE[p.phase]}>{p.phase}</Chip>
        <span className="inline-flex items-center gap-1.5">
          <Initial owner={p.owner} />
          {p.owner}
        </span>
        <span>· suggested offer: {p.offer}</span>
      </div>

      <section aria-labelledby="why-h">
        <h3 id="why-h" className="text-[13px] font-medium m-0 mb-2">
          Why Claude picked them
        </h3>
        <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
          {p.why.map((w) => (
            <li key={w} className="flex gap-2 text-muted-2">
              <span aria-hidden="true">·</span>
              {w}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="hist-h">
        <h3 id="hist-h" className="text-[13px] font-medium m-0 mb-3">
          What’s happened so far
        </h3>
        <ol className="list-none p-0 m-0 flex flex-col gap-3">
          {p.activity.map((a, i) => (
            <li key={i} className="flex gap-3">
              <Initial owner={a.who} />
              <div className="min-w-0">
                <div>{a.text}</div>
                <div className="text-[12px] text-muted-2">
                  {a.who} · {a.when}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Row id="sel-next" label="Next step">
        <input id="sel-next" key={p.next} className={fieldCls} type="text" defaultValue={p.next} onBlur={(e) => e.target.value !== p.next && onChange(p.id, { next: e.target.value })} />
      </Row>

      <section aria-labelledby="demo-h" className="border border-border rounded-admin p-4 flex flex-col gap-3">
        <h3 id="demo-h" className="text-[13px] font-medium m-0">
          Demo
        </h3>
        <Row id="sel-builder" label="Who builds the demo">
          <select id="sel-builder" className={fieldCls} value={builder} onChange={(e) => onBuilder(e.target.value)}>
            <option value="Claude">Claude Cowork</option>
            {OUTREACH_OWNERS.filter((o) => o !== "Claude").map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Row>
        <div>
          <button type="button" className={btnSecondary} disabled={final} onClick={() => onStartDemo(p.id)}>
            Start a demo
          </button>
        </div>
        <p className="m-0 text-[12px] text-muted-2">{builder === "Claude" ? "Claude builds it from what it found. The demo lands in the approval queue; nothing is sent until you approve it." : "Assigned to a person. They send it when it is ready."}</p>
      </section>
    </Drawer>
  );
}
