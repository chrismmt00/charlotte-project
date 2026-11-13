"use client";

import Link from "next/link";
import { useState } from "react";

// The populated /blog list: topic filter chips, a featured first post, then a grid.
// Only rendered once src/lib/posts.js has real entries. Byline strings come from the server.
export default function BlogList({ posts, topics }) {
  const [filter, setFilter] = useState("All");
  const shown = posts.filter((p) => filter === "All" || p.topic === filter);
  const [featured, ...rest] = shown;
  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-1.5">
        {["All", ...topics].map((label) => {
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

      {featured ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          <Link
            href={`/blog/${featured.slug}`}
            className="card-post is-featured col-span-full flex flex-wrap gap-x-10 gap-y-6 border border-border rounded-tile overflow-hidden text-fg bg-surface transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(78,133,191,calc(.12*var(--shadow-k)))]"
          >
            <span aria-hidden="true" className="flex-[1_1_420px] min-w-0 min-h-[280px] bg-[radial-gradient(90%_120%_at_80%_8%,rgba(137,170,204,.32),transparent_55%),var(--bg-deep)] flex items-end p-[18px]">
              <span className="text-[11px] text-muted-2 bg-[rgba(var(--bg-rgb),.7)] rounded-full px-2.5 py-1">{featured.cover}</span>
            </span>
            <span className="flex-[1_1_380px] min-w-0 flex flex-col justify-center gap-3 px-7 pb-7 sm:pl-0 sm:pt-7">
              <span className="eyebrow !text-accent-light">{featured.topic} · featured</span>
              <span className="font-display text-[clamp(28px,3vw,40px)] leading-[1.1]">{featured.title}</span>
              <span className="text-[15px] leading-[1.65] text-muted-2">{featured.dek}</span>
              <span className="text-[13px] text-muted-2">{featured.byline}</span>
            </span>
          </Link>
          {rest.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="card-post flex flex-col gap-2.5 border border-border rounded-card p-6 text-fg bg-surface transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(78,133,191,calc(.12*var(--shadow-k)))]"
            >
              <span className="eyebrow !text-accent-light">{p.topic}</span>
              <span className="text-xl font-medium leading-[1.25]">{p.title}</span>
              <span className="text-sm leading-[1.6] text-muted-2">{p.dek}</span>
              <span className="text-[13px] text-muted-2 mt-auto pt-2">{p.byline}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="m-0 p-8 text-center text-sm text-muted border border-dashed border-border-2 rounded-card">No posts on that topic yet.</p>
      )}
    </div>
  );
}
