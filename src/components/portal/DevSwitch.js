"use client";

import { useState } from "react";
import { STAGES } from "@/lib/portal/sample";
import { usePortal } from "./PortalContext";

const sel = "min-h-11 rounded-input border border-border-2 bg-surface-2 text-fg px-3 text-sm w-full";

// Development only (the shell renders it when NODE_ENV !== "production"): switch the project stage,
// the offer (to preview the restaurant required-plan note), list states, and make stub requests fail.
export default function DevSwitch() {
  const p = usePortal();
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed left-3 bottom-3 z-[350] flex flex-col items-start gap-2">
      {open ? (
        <div id="portal-dev" className="w-[260px] bg-surface border border-border-2 rounded-card p-4 flex flex-col gap-3 shadow-[0_20px_50px_rgba(0,0,0,calc(.4*var(--shadow-k)))]">
          <div className="eyebrow">Dev only · not in production</div>
          <label className="flex flex-col gap-1 text-[13px] text-muted-2">
            Project stage
            <select className={sel} value={p.stage} onChange={(e) => p.setStage(e.target.value)}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-muted-2">
            Offer
            <select className={sel} value={p.offerCode} onChange={(e) => p.patch({ offerCode: e.target.value, planCanceled: false })}>
              <option value="WB">WB · plan optional</option>
              <option value="RC">RC · plan required</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-muted-2">
            Lists
            <select className={sel} value={p.dev.lists} onChange={(e) => p.setDev({ lists: e.target.value })}>
              {["live", "loading", "empty", "error"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2.5 min-h-11 text-sm">
            <input type="checkbox" checked={p.dev.fail} onChange={(e) => p.setDev({ fail: e.target.checked })} className="w-[18px] h-[18px] accent-[#4E85BF]" />
            Requests fail (declined card, upload, send)
          </label>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="portal-dev"
        className="min-h-11 px-4 rounded-full border border-dashed border-border-2 bg-surface text-muted-2 text-[13px] cursor-pointer hover:text-fg"
      >
        {open ? "Close dev" : `Dev · ${p.stage}`}
      </button>
    </div>
  );
}
