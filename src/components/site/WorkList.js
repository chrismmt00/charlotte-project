"use client";

import Link from "next/link";
import { useState } from "react";

const BACKDROPS = [
  "bg-[conic-gradient(from_210deg_at_70%_65%,rgba(78,133,191,.3),var(--bg-deep)_42%),var(--bg-deep)]",
  "bg-[radial-gradient(90%_120%_at_80%_8%,rgba(137,170,204,.32),transparent_55%),var(--bg-deep)]",
  "bg-[repeating-linear-gradient(45deg,rgba(137,170,204,.1)_0_3px,transparent_3px_16px),radial-gradient(70%_70%_at_70%_80%,rgba(78,133,191,.3),transparent_60%),var(--bg-deep)]",
];

// The populated /work list: service filter chips over a grid of case cards.
// Only rendered once src/lib/cases.js has real entries.
export default function WorkList({ cases, filters }) {
  const [filter, setFilter] = useState("All");
  const shown = cases.filter((c) => filter === "All" || c.service === filter);
  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Filter by service" className="flex flex-wrap gap-1.5">
        {["All", ...filters].map((label) => {
          const on = label === filter;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(label)}
              className={`chip-filter min-h-11 px-4 rounded-full border text-[13px] cursor-pointer font-[inherit] transition-colors ${
                on ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border-2 hover:text-fg"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {shown.length ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-5">
          {shown.map((c, i) => (
            <Link
              key={c.slug}
              href={`/work/${c.slug}`}
              className="card-case flex flex-col border border-border rounded-tile overflow-hidden text-fg bg-surface transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(78,133,191,calc(.12*var(--shadow-k)))]"
            >
              <span aria-hidden="true" className={`aspect-[16/10] ${BACKDROPS[i % BACKDROPS.length]} flex items-end p-[18px]`}>
                <span className="text-[11px] text-muted-2 bg-[rgba(var(--bg-rgb),.7)] rounded-full px-2.5 py-1">{c.media?.[0]?.label}</span>
              </span>
              <span className="flex flex-col gap-2 px-6 pt-[22px] pb-[26px]">
                <span className="flex flex-wrap gap-1.5 text-[11px] tracking-[.2em] uppercase">
                  <span className="text-accent-light">{c.service}</span>
                  <span className="text-muted-2">· {c.area}</span>
                </span>
                <span className="text-[22px] font-medium leading-[1.2]">
                  {c.client}: {c.headline}
                </span>
                <span className="text-sm leading-[1.6] text-muted-2">{c.summary}</span>
                <span className="text-sm text-accent-light mt-1.5 min-h-11 inline-flex items-center">
                  Read the case study <span aria-hidden="true">&nbsp;→</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="m-0 p-8 text-center text-sm text-muted border border-dashed border-border-2 rounded-card">
          No case studies for that service yet.{" "}
          <Link href="/founding" className="text-accent-light hover:text-fg">
            Yours could be the first.
          </Link>
        </p>
      )}
    </div>
  );
}
