"use client";

import { useState } from "react";
import { BOOKING_SERVICES, BOOKING_SLOTS } from "@/lib/app/sample";
import Dialog, { CancelButton } from "./Dialog";
import { Checkbox, FieldError, FormGroup, Spinner, btnDestructive, btnPrimary, inputCls } from "./ui";
import { useAction } from "./hooks";
import { api } from "./api";

function Submit({ busy, label, busyLabel, className = btnPrimary }) {
  return (
    <button type="submit" className={className} disabled={busy}>
      {busy ? <Spinner /> : null}
      {busy ? busyLabel : label}
    </button>
  );
}

// Block time (booking kind). onDone({ from, to, day }).
export function BlockDialog({ days, defaultDay, onClose, onDone }) {
  const [day, setDay] = useState(defaultDay);
  const [from, setFrom] = useState("12:00");
  const [to, setTo] = useState("13:00");
  const [note, setNote] = useState("");
  const [bad, setBad] = useState("");
  const { busy, error, run } = useAction();

  const submit = async (e) => {
    e.preventDefault();
    if (!from || !to || to <= from) {
      setBad("The end time has to be after the start time.");
      return;
    }
    setBad("");
    const r = await run(() => api("/api/app/bookings/block", { body: { day, from, to, note: note.trim() || undefined } }), "Couldn’t block that time. Nothing changed on your booking page. Try again.");
    if (r.ok) onDone({ day, from, to });
  };

  return (
    <Dialog
      size="small"
      eyebrow="Bookings"
      title="Block time"
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      footer={
        <>
          <CancelButton onClick={onClose} disabled={busy} />
          <Submit busy={busy} label="Block it" busyLabel="Blocking…" />
        </>
      }
    >
      <FormGroup id="bk-day" label="Day">
        <select id="bk-day" value={day} onChange={(e) => setDay(e.target.value)} className={`${inputCls} cursor-pointer`}>
          {days.map((d) => (
            <option key={d}>{d}</option>
          ))}
          <option>Every week on this day</option>
        </select>
      </FormGroup>
      <div className="grid grid-cols-2 gap-3">
        <FormGroup id="bk-from" label="From">
          <input id="bk-from" type="time" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} aria-invalid={bad ? true : undefined} />
        </FormGroup>
        <FormGroup id="bk-to" label="To">
          <input id="bk-to" type="time" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} aria-invalid={bad ? true : undefined} />
        </FormGroup>
      </div>
      {bad ? <FieldError>{bad}</FieldError> : null}
      <FormGroup id="bk-why" label="Note to yourself (optional)">
        <input id="bk-why" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lunch, supply run, family" className={inputCls} />
      </FormGroup>
      <p className="m-0 text-[13px] text-muted-2">Customers can’t book this window online. Anything already booked inside it stays; we flag it so you can reschedule.</p>
      {error ? <FieldError>{error}</FieldError> : null}
    </Dialog>
  );
}

// Add a booking (walk-in or phone). `initialName` prefills for Rebook. `showError` opens with the name error showing.
// onDone({ name, service, slot, depositInPerson, id }).
export function AddBookingDialog({ initialName = "", showError = false, onClose, onDone }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(BOOKING_SERVICES[0]);
  const [slot, setSlot] = useState(BOOKING_SLOTS[0]);
  const [deposit, setDeposit] = useState(true);
  const [bad, setBad] = useState(showError);
  const { busy, error, run } = useAction();

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setBad(true);
      return;
    }
    const r = await run(
      () => api("/api/app/bookings", { body: { name: name.trim(), phone: phone.trim() || undefined, service, slot, depositInPerson: deposit } }),
      "Couldn’t add that booking. The reminder text wasn’t sent. Try again."
    );
    if (r.ok) onDone({ name: name.trim(), service, slot, depositInPerson: deposit, id: r.data.id });
  };

  return (
    <Dialog
      size="medium"
      eyebrow="Walk-in or phone"
      title="Add a booking"
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      footer={
        <>
          <CancelButton onClick={onClose} disabled={busy} />
          <Submit busy={busy} label="Add booking" busyLabel="Adding…" />
        </>
      }
    >
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <FormGroup id="ab-name" label="Customer" error={bad ? "Add a name so it shows in the list." : ""}>
          <input
            id="ab-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setBad(false);
            }}
            placeholder="Name"
            aria-invalid={bad ? true : undefined}
            aria-describedby={bad ? "ab-name-err" : undefined}
            className={inputCls}
          />
        </FormGroup>
        <FormGroup id="ab-phone" label="Phone (for the reminder text)">
          <input id="ab-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(704) 555-0100" className={inputCls} />
        </FormGroup>
      </div>
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <FormGroup id="ab-svc" label="Service">
          <select id="ab-svc" value={service} onChange={(e) => setService(e.target.value)} className={`${inputCls} cursor-pointer`}>
            {BOOKING_SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup id="ab-time" label="Time">
          <select id="ab-time" value={slot} onChange={(e) => setSlot(e.target.value)} className={`${inputCls} cursor-pointer`}>
            {BOOKING_SLOTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FormGroup>
      </div>
      <Checkbox id="ab-dep" checked={deposit} onChange={(e) => setDeposit(e.target.checked)}>
        Deposit collected in person (no online charge)
      </Checkbox>
      {error ? <FieldError>{error}</FieldError> : null}
    </Dialog>
  );
}

// Cancel a booking, or an order (restaurant, store). onDone({ refund, reason }).
export function CancelBookingDialog({ row, kind, onClose, onDone }) {
  const isBooking = kind === "booking";
  const [reason, setReason] = useState("We had to close");
  const [refund, setRefund] = useState(true);
  const { busy, error, run } = useAction();

  const submit = async (e) => {
    e.preventDefault();
    const r = await run(() => api(`/api/app/bookings/${encodeURIComponent(row.id)}/cancel`, { body: { reason, refund } }), `Couldn’t cancel it. ${isBooking ? "The customer wasn’t texted" : "Nothing was refunded"}. Try again.`);
    if (r.ok) onDone({ refund, reason });
  };

  return (
    <Dialog
      size="small"
      eyebrow={isBooking ? "Bookings" : "Orders"}
      title={`Cancel ${row.who}’s ${isBooking ? "booking" : "order"}?`}
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      footer={
        <>
          <CancelButton onClick={onClose} disabled={busy}>
            Keep it
          </CancelButton>
          <Submit busy={busy} className={btnDestructive} label={isBooking ? "Cancel the booking" : "Cancel the order"} busyLabel="Canceling…" />
        </>
      }
    >
      <p className="m-0 text-muted-2">
        {isBooking
          ? `${row.what} · ${row.time}. They get a text right away with your reason.`
          : `${row.what}. The customer is refunded through your Stripe account and gets a text.`}
      </p>
      <FormGroup id="cb-why" label="Reason (they see this in the text)">
        <select id="cb-why" value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} cursor-pointer`}>
          <option>We had to close</option>
          <option>Staff out sick</option>
          <option>Customer asked</option>
          <option>Other</option>
        </select>
      </FormGroup>
      <Checkbox id="cb-refund" checked={refund} onChange={(e) => setRefund(e.target.checked)}>
        {isBooking ? "Refund the deposit through Stripe" : "Refund the payment through Stripe"}
      </Checkbox>
      {error ? <FieldError>{error}</FieldError> : null}
    </Dialog>
  );
}

export const RESUME_OPTIONS = [
  ["30m", "In 30 minutes"],
  ["1h", "In 1 hour"],
  ["tomorrow", "At tomorrow’s opening"],
  ["manual", "When I turn it back on"],
];

// Restaurants: pause online ordering. onDone({ resume }).
export function PauseDialog({ onClose, onDone }) {
  const [resume, setResume] = useState("30m");
  const { busy, error, run } = useAction();

  const submit = async (e) => {
    e.preventDefault();
    const r = await run(() => api("/api/app/bookings/ordering", { body: { paused: true, resume } }), "Couldn’t pause ordering. It’s still on. Try again.");
    if (r.ok) onDone({ resume });
  };

  return (
    <Dialog
      size="small"
      eyebrow="Orders"
      title="Pause online ordering?"
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      footer={
        <>
          <CancelButton onClick={onClose} disabled={busy} />
          <Submit busy={busy} label="Pause ordering" busyLabel="Pausing…" />
        </>
      }
    >
      <p className="m-0 text-muted-2">Your site shows “Not taking online orders right now” and the kiosk keeps running. Orders already placed stay in the list.</p>
      <FormGroup id="ps-until" label="Resume">
        <select id="ps-until" value={resume} onChange={(e) => setResume(e.target.value)} className={`${inputCls} cursor-pointer`}>
          {RESUME_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </FormGroup>
      {error ? <FieldError>{error}</FieldError> : null}
    </Dialog>
  );
}

// Stores: create a discount (a coupon in the owner's Stripe account). onDone({ code }).
export function DiscountDialog({ onClose, onDone }) {
  const [code, setCode] = useState("WELCOME10");
  const [amount, setAmount] = useState("10% off");
  const [min, setMin] = useState("");
  const [ends, setEnds] = useState("");
  const [bad, setBad] = useState(false);
  const { busy, error, run } = useAction();

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setBad(true);
      return;
    }
    const r = await run(() => api("/api/app/bookings/discount", { body: { code: code.trim(), amount, minimum: min.trim() || undefined, ends: ends || undefined } }), "Couldn’t create the discount in Stripe. Try again.");
    if (r.ok) onDone({ code: r.data.code });
  };

  return (
    <Dialog
      size="medium"
      eyebrow="Store"
      title="Create a discount"
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      footer={
        <>
          <CancelButton onClick={onClose} disabled={busy} />
          <Submit busy={busy} label="Create discount" busyLabel="Creating…" />
        </>
      }
    >
      <FormGroup id="dc-code" label="Code" error={bad ? "Give the discount a code." : ""}>
        <input
          id="dc-code"
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setBad(false);
          }}
          aria-invalid={bad ? true : undefined}
          aria-describedby={bad ? "dc-code-err" : undefined}
          className={inputCls}
        />
      </FormGroup>
      <FormGroup id="dc-amt" label="Amount">
        <select id="dc-amt" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} cursor-pointer`}>
          <option>10% off</option>
          <option>15% off</option>
          <option>$5 off</option>
          <option>Free shipping</option>
        </select>
      </FormGroup>
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <FormGroup id="dc-min" label="Minimum order">
          <input id="dc-min" type="text" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} placeholder="$0" className={inputCls} />
        </FormGroup>
        <FormGroup id="dc-end" label="Ends">
          <input id="dc-end" type="date" value={ends} onChange={(e) => setEnds(e.target.value)} className={inputCls} />
        </FormGroup>
      </div>
      <p className="m-0 text-[13px] text-muted-2">Created in your Stripe account as a coupon; the checkout applies it.</p>
      {error ? <FieldError>{error}</FieldError> : null}
    </Dialog>
  );
}
