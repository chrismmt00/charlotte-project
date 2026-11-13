"use client";

import { Empty, Skeleton, btnSecondary } from "@/components/admin/ui";

// Small pieces shared by the Settings tabs and dialogs. Admin density: 13px body, 16px radius.

export const fieldInput =
  "min-h-10 w-full rounded-[12px] border bg-surface-2 text-fg px-3 text-[13px] box-border font-[inherit] disabled:opacity-60 disabled:cursor-not-allowed";

export function Card({ title, id, children, className = "", action }) {
  return (
    <section aria-labelledby={id} className={`bg-surface border border-border rounded-admin px-5 py-[18px] flex flex-col gap-3.5 min-w-0 ${className}`}>
      {title ? (
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h2 id={id} className="text-[15px] font-medium m-0">
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function ErrorLine({ id, children }) {
  return (
    <span id={id} role="alert" className="text-[12px] text-danger">
      {children}
    </span>
  );
}

// Label + input/textarea with hint and error. Controlled; `onChange` receives the string value.
export function TextField({ id, label, value, onChange, error, hint, textarea, rows = 3, disabled, className = "", required, ...rest }) {
  const Tag = textarea ? "textarea" : "input";
  const err = error ? `${id}-err` : undefined;
  const hid = hint && !error ? `${id}-hint` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <label htmlFor={id} className="text-[12px] text-muted-2">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-accent-light">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <Tag
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-required={required ? true : undefined}
        aria-describedby={err || hid}
        rows={textarea ? rows : undefined}
        className={`${fieldInput} ${error ? "border-danger" : "border-border-2"} ${textarea ? "py-2.5 leading-normal resize-y min-h-0" : ""}`}
        {...rest}
      />
      {error ? <ErrorLine id={err}>{error}</ErrorLine> : null}
      {hint && !error ? (
        <span id={hid} className="text-[12px] text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

// role="switch" row: label and note on the left, the switch on the right.
export function SwitchRow({ id, label, note, on, onChange, disabled, locked }) {
  return (
    <div className="flex items-center justify-between gap-4 min-h-12 py-2.5 border-t border-border">
      <div className="min-w-0">
        <div id={`${id}-l`} className="text-[13px]">
          {label}
        </div>
        {note ? (
          <div id={`${id}-n`} className="text-[12px] text-muted mt-0.5">
            {note}
          </div>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={`${id}-l`}
        aria-describedby={note ? `${id}-n` : undefined}
        disabled={disabled}
        onClick={() => onChange(!on)}
        className={`relative flex-none w-12 h-7 rounded-full border border-border-2 p-0 box-border transition-colors ${on ? "bg-accent" : "bg-border"} ${disabled ? "opacity-55 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span aria-hidden="true" className={`absolute top-[3px] w-5 h-5 rounded-full bg-fg transition-[left] duration-200 motion-reduce:transition-none ${on ? "left-[25px]" : "left-[3px]"}`} />
        {locked ? <span className="sr-only">Locked</span> : null}
      </button>
    </div>
  );
}

export function LockNote({ ownerName = "the owner" }) {
  return (
    <div role="note" className="flex items-center gap-2.5 px-4 py-3 rounded-[12px] border border-border-2 bg-surface-2 text-[13px] text-muted-2">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      Only the owner can change this. You can read it; ask {ownerName} to edit.
    </div>
  );
}

// Four list states for the Team, Catalog and Templates tabs: loading, error, empty, live (children).
export function ListGate({ state, onRetry, emptyTitle, emptyText, emptyAction, rows = 4, pad = "", children }) {
  if (state === "loading") {
    return (
      <div aria-busy="true" className={`flex flex-col gap-2.5 ${pad}`} role="status">
        <span className="sr-only">Loading</span>
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-11 rounded-[10px]" />
        ))}
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className={pad}>
      <div role="alert" className="border border-fg rounded-admin bg-surface p-5 flex flex-col sm:flex-row sm:items-center gap-3.5">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="flex-none">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium">We couldn&rsquo;t load this.</div>
          <p className="m-0 mt-0.5 text-[13px] text-muted-2">Your settings are safe. Try again in a moment.</p>
        </div>
        <button type="button" className={btnSecondary} onClick={onRetry}>
          Try again
        </button>
      </div>
      </div>
    );
  }
  if (state === "empty") {
    return (
      <div className={pad}>
        <Empty title={emptyTitle} action={emptyAction}>
          {emptyText}
        </Empty>
      </div>
    );
  }
  return children;
}

export const th = "text-left font-medium text-muted-2 px-4 py-3 whitespace-nowrap";

// 36px outlined row button used inside tables and lists (board: "Edit", "Edit price…"); ghost = no border (Change role, Remove).
export const rowBtn =
  "inline-flex items-center justify-center gap-2 min-h-9 px-3.5 rounded-full border border-border-2 bg-transparent text-fg text-[13px] font-medium cursor-pointer box-border whitespace-nowrap hover:bg-surface-2 disabled:opacity-45 disabled:cursor-not-allowed";
export const rowGhost =
  "inline-flex items-center justify-center gap-2 min-h-9 px-3.5 rounded-full border border-transparent bg-transparent text-[13px] font-medium cursor-pointer box-border whitespace-nowrap hover:bg-surface-2 disabled:opacity-45 disabled:cursor-not-allowed";
