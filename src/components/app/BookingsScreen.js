"use client";

import { useEffect, useRef, useState } from "react";
import { BOOKINGS_COPY, NEXT_STEP } from "@/lib/app/kinds";

import { Card, CardTitle, DevStateSwitch, EmptyState, ErrorState, FieldError, FormGroup, Icon, Page, PageHeader, SkeletonRows, Spinner, StatusPill, Switch, btnPrimary, btnSecondary, inputCls } from "./ui";
import { AddBookingDialog, BlockDialog, CancelBookingDialog, DiscountDialog, PauseDialog, RESUME_OPTIONS } from "./BookingDialogs";
import RefundDialog from "./RefundDialog";
import { useToast } from "./Toast";
import { useAction, useListStatus } from "./hooks";
import { api, download } from "./api";
import { useBusiness } from "./useBusiness";

export default function BookingsScreen() {
  const biz = useBusiness();
  return <Bookings key={biz.kind} biz={biz} />;
}

// Row menu: call, text, reschedule (or print), no-show (or refund), cancel. Escape and outside click close it.
function RowMenu({ row, copy, onClose, onReschedule, onNoShow, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    const trigger = node.parentElement.querySelector(".btn-more");
    node.querySelector('[role="menuitem"]')?.focus();
    const onDoc = (e) => {
      if (!node.contains(e.target) && !trigger.contains(e.target)) onClose(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  const onKey = (e) => {
    const items = Array.from(ref.current.querySelectorAll('[role="menuitem"]'));
    const i = items.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      onClose(true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length].focus();
    } else if (e.key === "Tab") {
      onClose(false);
    }
  };

  const item = "flex items-center w-full min-h-11 px-3 rounded-[10px] text-sm text-fg bg-transparent border-0 font-[inherit] cursor-pointer text-left hover:bg-surface-2";
  return (
    <div
      ref={ref}
      role="menu"
      aria-label={`Actions for ${row.who}`}
      onKeyDown={onKey}
      className="row-menu absolute right-0 top-12 z-[60] min-w-[220px] bg-surface border border-border-2 rounded-[16px] p-1.5 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,calc(.4*var(--shadow-k)))]"
    >
      <a href={`tel:${row.phone || "+1"}`} role="menuitem" className={item}>
        Call {row.who}
      </a>
      <a href={`sms:${row.phone || "+1"}`} role="menuitem" className={item}>
        Text {row.who}
      </a>
      <button type="button" role="menuitem" className={item} onClick={onReschedule}>
        {copy.reschedule}
      </button>
      <button type="button" role="menuitem" className={item} onClick={onNoShow}>
        {copy.noShow}
      </button>
      <button type="button" role="menuitem" className={`${item} text-danger border-t border-border rounded-b-[10px] rounded-t-none`} onClick={onCancel}>
        {copy.cancel}
      </button>
    </div>
  );
}

function initialLists(biz) {
  if (biz.kind === "booking") return Object.fromEntries(biz.days.map((d, i) => [i, d.rows]));
  return { 0: biz.orders };
}

function Bookings({ biz }) {
  const BOOKING_DAYS = biz.days;
  const BOOKING_TODAY = (new Date().getDay() + 6) % 7;
  const kind = biz.kind;
  const copy = BOOKINGS_COPY[kind];
  const toast = useToast();
  const [status, setStatus, retry] = useListStatus("live");
  const [lists, setLists] = useState(() => initialLists(biz));
  const [day, setDay] = useState(BOOKING_TODAY);
  const [dialog, setDialog] = useState(null); // { type, id?, name?, showError? }
  const [menuId, setMenuId] = useState(null);
  const [moving, setMoving] = useState(null); // row id being rescheduled
  const [pending, setPending] = useState(null);
  const [paused, setPaused] = useState(null); // restaurants: { resume } while online ordering is paused
  const [rules, setRules] = useState(() => Object.fromEntries(biz.rules.map((r) => [r.id, r.value])));
  const [ruleState, setRuleState] = useState("idle"); // idle | dirty | saved
  const rulesAction = useAction();
  const exportAction = useAction();
  const menuTrigger = useRef(null);

  const key = kind === "booking" ? day : 0;
  const rows = lists[key] || [];
  const dayInfo = BOOKING_DAYS[day];
  const next = NEXT_STEP[kind];

  const updateRow = (id, patch) => setLists((l) => ({ ...l, [key]: l[key].map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const closeDialog = () => setDialog(null);
  const dialogRow = dialog && dialog.id ? rows.find((r) => r.id === dialog.id) : null;

  const closeMenu = (refocus) => {
    setMenuId(null);
    if (refocus) menuTrigger.current?.focus();
  };

  const advance = async (row) => {
    const step = next[row.status];
    if (!step) return;
    if (!step[1]) {
      // Rebook a finished appointment: open Add a booking with the name filled in.
      setDialog({ type: "add", name: row.who });
      return;
    }
    setPending(row.id);
    try {
      await api(`/api/app/bookings/${encodeURIComponent(row.id)}`, { method: "PATCH", body: { action: "status", status: step[1] } });
      updateRow(row.id, { status: step[1] });
    } catch {
      toast("Couldn’t update that. Nothing changed. Try again.");
    }
    setPending(null);
  };

  const noShow = async (row) => {
    setMenuId(null);
    if (kind !== "booking") {
      setDialog({ type: "refund", id: row.id });
      return;
    }
    try {
      await api(`/api/app/bookings/${encodeURIComponent(row.id)}`, { method: "PATCH", body: { action: "no-show" } });
      updateRow(row.id, { status: "No-show" });
      toast(`${row.who} marked no-show`);
    } catch {
      toast("Couldn’t mark that no-show. Try again.");
    }
  };

  const reschedule = (row) => {
    setMenuId(null);
    if (kind === "booking") {
      setMoving(row.id);
      return;
    }
    window.print();
  };

  const moveTo = async (i) => {
    const row = rows.find((r) => r.id === moving);
    if (!row || i === day || BOOKING_DAYS[i].closed) return;
    try {
      await api(`/api/app/bookings/${encodeURIComponent(row.id)}`, { method: "PATCH", body: { action: "reschedule", day: i } });
      setLists((l) => ({ ...l, [day]: l[day].filter((r) => r.id !== row.id), [i]: [...(l[i] || []), row] }));
      toast(`${row.who} moved to ${BOOKING_DAYS[i].label}`);
      setMoving(null);
    } catch {
      toast("Couldn’t move that booking. It’s still where it was. Try again.");
    }
  };

  const onPrimary = () => setDialog({ type: kind === "booking" ? "block" : kind === "restaurant" ? "pause" : "discount" });

  const onSecondary = async () => {
    if (kind === "booking") setDialog({ type: "add" });
    else if (kind === "restaurant") window.print();
    else {
      const r = await exportAction.run(() => download("/api/app/bookings/export", "orders.csv"), "Couldn’t export the orders. Try again.");
      if (r.ok) toast("orders.csv downloaded");
    }
  };

  const toggleOrdering = async (on) => {
    if (!on) {
      setDialog({ type: "pause" });
      return;
    }
    try {
      await api("/api/app/bookings/ordering", { body: { paused: false } });
      setPaused(null);
      toast("Online ordering is back on");
    } catch {
      toast("Couldn’t turn ordering back on. It’s still paused. Try again.");
    }
  };

  const saveRules = async () => {
    const r = await rulesAction.run(() => api("/api/app/bookings/rules", { method: "PUT", body: { rules } }), "Couldn’t save the rules. Nothing changed. Try again.");
    if (r.ok) {
      setRuleState("saved");
      toast(copy.rulesSaved);
    }
  };

  // Which of the four list states shows.
  const shown = status === "live" && rows.length === 0 ? "empty" : status;
  const listTitle = kind === "booking" ? dayInfo.label : copy.listTitle;
  const kitchen = rows.filter((r) => r.status === "New" || r.status === "Preparing").length;
  const ready = rows.filter((r) => r.status === "Ready").length;
  const toShip = rows.filter((r) => r.status === "To ship" || r.status === "New").length;
  const listNote =
    kind === "booking" ? `${rows.length} booked` : kind === "restaurant" ? `${kitchen} in the kitchen · ${ready} ready` : `${toShip} to ship`;
  const emptyText = kind === "booking" && dayInfo.closed ? ["Closed this day", "Change opening days under Hours, info and photos. The booking page follows right away."] : copy.empty;
  const bookableDays = BOOKING_DAYS.filter((d) => !d.closed).map((d) => d.label);
  const resumeLabel = paused ? RESUME_OPTIONS.find(([v]) => v === paused.resume)?.[1] : "";

  return (
    <Page className="page-app-bookings">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title}>
        {kind === "restaurant" ? (
          <span className="inline-flex items-center gap-1 text-[13px] text-muted-2">
            <span id="ordering-label">Online ordering {paused ? "paused" : "on"}</span>
            <Switch on={!paused} onChange={toggleOrdering} label="Online ordering" />
          </span>
        ) : null}
        <button type="button" className={btnSecondary} onClick={onSecondary} disabled={exportAction.busy}>
          {exportAction.busy ? <Spinner /> : null}
          {copy.secondary}
        </button>
        {kind !== "restaurant" ? (
          <button type="button" className={btnPrimary} onClick={onPrimary}>
            {copy.primary}
          </button>
        ) : null}
      </PageHeader>

      {exportAction.error ? <FieldError>{exportAction.error}</FieldError> : null}

      {paused ? (
        <div role="status" className="flex flex-wrap items-center gap-3 justify-between border border-warning/40 bg-warning/10 rounded-input px-4 py-3 text-sm">
          <span>Online ordering is paused. Your site says “Not taking online orders right now”; the kiosk keeps running. Resumes: {resumeLabel.toLowerCase()}.</span>
          <button type="button" className={btnSecondary} onClick={() => toggleOrdering(true)}>
            Turn it back on
          </button>
        </div>
      ) : null}

      {kind === "booking" ? (
        <>
          {moving ? (
            <div role="status" className="flex flex-wrap items-center gap-3 justify-between border border-border-2 rounded-input px-4 py-3 text-sm">
              <span>Pick a new day for {rows.find((r) => r.id === moving)?.who}.</span>
              <button type="button" className={btnSecondary} onClick={() => setMoving(null)}>
                Never mind
              </button>
            </div>
          ) : null}
          <div role="group" aria-label="Pick a day" className="day-picker flex gap-1.5 overflow-x-auto pb-1">
            {BOOKING_DAYS.map((d, i) => {
              const on = day === i;
              const n = (lists[i] || []).length;
              return (
                <button
                  key={d.dow}
                  type="button"
                  aria-pressed={on}
                  onClick={() => (moving ? moveTo(i) : setDay(i))}
                  className={`flex-[1_0_96px] min-h-16 rounded-input border flex flex-col items-center justify-center gap-0.5 text-[13px] cursor-pointer ${
                    on ? "bg-fg text-bg border-fg" : "bg-surface text-fg border-border"
                  }`}
                >
                  <span className={`text-[11px] tracking-[.15em] uppercase ${on ? "text-bg" : "text-muted-2"}`}>{d.dow}</span>
                  <span className="text-lg font-medium">{d.num}</span>
                  <span className={`text-[11px] ${on ? "text-bg" : "text-muted-2"}`}>{d.closed ? "Closed" : `${n} booked`}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      <div className="flex flex-wrap gap-4 items-start">
        <Card aria-labelledby="list-h" className="card-list flex-[3_1_520px] overflow-visible">
          <div className="flex justify-between items-center gap-3 px-6 pt-5 pb-3">
            <CardTitle id="list-h">{listTitle}</CardTitle>
            <span className="text-[13px] text-muted-2">{listNote}</span>
          </div>
          {shown === "loading" ? <SkeletonRows /> : null}
          {shown === "error" ? (
            <div className="px-4 pb-4">
              <ErrorState onRetry={retry} />
            </div>
          ) : null}
          {shown === "empty" ? (
            <div className="px-4 pb-4">
              <EmptyState
                title={emptyText[0]}
                action={
                  <button type="button" className={btnSecondary} onClick={onSecondary}>
                    {copy.secondary}
                  </button>
                }
              >
                {emptyText[1]}
              </EmptyState>
            </div>
          ) : null}
          {shown === "live" ? (
            <ul className="booking-list list-none m-0 px-2 pb-2">
              {rows.map((b) => {
                const menuOpen = menuId === b.id;
                const step = next[b.status];
                return (
                  <li key={b.id} className={`booking-row relative flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-input min-h-[60px] box-border border-t border-border ${menuOpen ? "bg-surface-2" : ""}`}>
                    <span className="text-sm tabular-nums min-w-16 text-muted-2">{b.time}</span>
                    <span className="flex-[1_1_220px] min-w-0 flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{b.who}</span>
                      <span className="text-[13px] text-muted-2">{b.what}</span>
                    </span>
                    <StatusPill status={b.status} />
                    <div className="relative flex gap-1.5">
                      {step ? (
                        <button type="button" className={btnSecondary} onClick={() => advance(b)} disabled={pending === b.id}>
                          {pending === b.id ? <Spinner size={14} /> : null}
                          {step[0]}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        ref={menuOpen ? menuTrigger : null}
                        className="btn-more w-11 h-11 rounded-full border border-border-2 bg-transparent text-fg inline-flex items-center justify-center cursor-pointer p-0 hover:bg-surface-2"
                        aria-label={`More actions for ${b.who}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuId(menuOpen ? null : b.id)}
                      >
                        <Icon name="more" />
                      </button>
                      {menuOpen ? (
                        <RowMenu
                          row={b}
                          copy={copy}
                          onClose={closeMenu}
                          onReschedule={() => reschedule(b)}
                          onNoShow={() => noShow(b)}
                          onCancel={() => {
                            setMenuId(null);
                            setDialog({ type: "cancel", id: b.id });
                          }}
                        />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </Card>

        <Card aria-labelledby="rules-h" className="card-rules flex-[2_1_320px] px-6 pt-5 pb-6 flex flex-col gap-3.5">
          <CardTitle id="rules-h">{copy.rulesTitle}</CardTitle>
          {biz.rules.map((r) => (
            <FormGroup key={r.id} id={r.id} label={r.label} hint={r.hint}>
              <input
                id={r.id}
                type="text"
                value={rules[r.id]}
                aria-describedby={`${r.id}-hint`}
                onChange={(e) => {
                  setRules((v) => ({ ...v, [r.id]: e.target.value }));
                  setRuleState("dirty");
                }}
                className={inputCls}
              />
            </FormGroup>
          ))}
          {rulesAction.error ? <FieldError>{rulesAction.error}</FieldError> : null}
          <button type="button" className={`${btnPrimary} self-start`} onClick={saveRules} disabled={rulesAction.busy}>
            {rulesAction.busy ? <Spinner /> : null}
            {rulesAction.busy ? "Saving…" : ruleState === "saved" ? "Saved" : "Save rules"}
          </button>
        </Card>
      </div>

      <p className="m-0 text-[13px] text-muted-2">{copy.footnote}</p>

      <DevStateSwitch value={status} onChange={setStatus} />

      {dialog?.type === "block" ? (
        <BlockDialog
          days={bookableDays}
          defaultDay={dayInfo.label}
          onClose={closeDialog}
          onDone={({ from, to }) => {
            closeDialog();
            toast(`Availability block saved: ${from}–${to}`);
          }}
        />
      ) : null}
      {dialog?.type === "add" ? (
        <AddBookingDialog
          key={dialog.name || "new"}
          initialName={dialog.name || ""}
          showError={!!dialog.showError}
          onClose={closeDialog}
          onDone={({ name, service, slot, depositInPerson, id, savedRow }) => {
            const target = (new Date(slot).getDay() + 6) % 7;
            const row = savedRow || { id, time: new Date(slot).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}), who: name, what: `${service} · added by you`, status: depositInPerson ? "Deposit paid" : "No deposit", phone: "+1" };
            setLists((l) => ({ ...l, [target]: [row, ...(l[target] || [])] }));
            setDay(target);
            closeDialog();
            toast(`Added ${name} at ${row.time}`);
          }}
        />
      ) : null}
      {dialog?.type === "cancel" && dialogRow ? (
        <CancelBookingDialog
          row={dialogRow}
          kind={kind}
          onClose={closeDialog}
          onDone={({ refund }) => {
            setLists((l) => ({ ...l, [key]: l[key].filter((r) => r.id !== dialogRow.id) }));
            closeDialog();
            toast(`${dialogRow.who} canceled`);
          }}
        />
      ) : null}
      {dialog?.type === "pause" ? (
        <PauseDialog
          onClose={closeDialog}
          onDone={({ resume }) => {
            setPaused({ resume });
            closeDialog();
            toast("Online ordering paused; the kiosk is still on");
          }}
        />
      ) : null}
      {dialog?.type === "discount" ? (
        <DiscountDialog
          onClose={closeDialog}
          onDone={({ code }) => {
            closeDialog();
            toast(`${code} created in Stripe`);
          }}
        />
      ) : null}
      {dialog?.type === "refund" && dialogRow ? (
        <RefundDialog
          payment={{ id: dialogRow.id, who: dialogRow.who, what: dialogRow.what, amount: dialogRow.amount }}
          onClose={closeDialog}
          onDone={(p) => {
            closeDialog();
            toast(`${p.amount} refunded to ${p.who} via Stripe`);
          }}
        />
      ) : null}
    </Page>
  );
}
