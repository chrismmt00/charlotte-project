"use client";

import { useState } from "react";

// Checkable task list. Ticking is local until PATCH /api/admin/tasks/[id] { done } exists.
export default function TaskList({ tasks }) {
  const [done, setDone] = useState({});
  const open = tasks.filter((_, i) => !done[i]).length;
  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 px-6 pt-[18px] pb-2.5">
        <h2 id="tasks-h" className="text-base font-medium m-0">
          This week&apos;s tasks
        </h2>
        <span className="text-[13px] text-muted">{open} open · next actions from leads, projects and outreach</span>
      </div>
      <ul className="list-none m-0 p-0 px-2 pb-2">
        {tasks.map((t, i) => (
          <li key={t.text} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-2 rounded-[12px] min-h-12 box-border">
            <label className="inline-flex items-center gap-3 flex-[1_1_300px] min-w-0 cursor-pointer text-[13px]">
              <input
                type="checkbox"
                checked={!!done[i]}
                onChange={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                aria-label={`Mark done: ${t.text}`}
                className="w-[18px] h-[18px] accent-[#4E85BF] flex-none"
              />
              <span className={done[i] ? "line-through text-muted" : "text-fg"}>{t.text}</span>
            </label>
            <span className="text-xs text-muted-2 border border-border-2 rounded-full px-[9px] py-[3px] whitespace-nowrap">{t.from}</span>
            <span className="text-xs text-muted min-w-14">{t.who}</span>
            <span className={`text-xs min-w-16 text-right ${t.urgent && !done[i] ? "text-accent-light" : "text-muted"}`}>{t.due}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
