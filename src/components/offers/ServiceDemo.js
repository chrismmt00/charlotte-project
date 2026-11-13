"use client";

import { useState } from "react";
import { DEMO_DAYS, DEMO_SERVICES, DEMO_SLOTS } from "@/lib/services";

const chip = (on) =>
  `min-h-11 rounded-input border px-3.5 py-2 text-sm text-left cursor-pointer transition-colors duration-200 ${
    on ? "border-accent-light bg-[rgba(78,133,191,.12)] text-fg" : "border-border bg-surface-2 text-muted-2 hover:border-border-2"
  }`;

function Frame({ children }) {
  return <div className="bg-bg border border-border rounded-card p-5 sm:p-6 flex flex-col gap-4 min-w-0">{children}</div>;
}

function Row({ left, right, sub }) {
  return (
    <div className="flex justify-between items-center gap-3 border-t border-border pt-3 text-sm">
      <span className="flex flex-col min-w-0">
        <span className="text-fg">{left}</span>
        {sub ? <span className="text-xs text-muted-2">{sub}</span> : null}
      </span>
      <span className="text-muted-2 flex-none">{right}</span>
    </div>
  );
}

function Booking() {
  const [svc, setSvc] = useState(0);
  const [day, setDay] = useState(1);
  const [slot, setSlot] = useState(4);
  const [booked, setBooked] = useState(false);
  return (
    <Frame>
      <div className="flex justify-between items-baseline gap-3">
        <span className="font-medium">[Business name]</span>
        <span className="text-xs text-muted-2">Book an appointment</span>
      </div>
      <div role="group" aria-label="Service" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {DEMO_SERVICES.map(([name, len], i) => (
          <button key={name} type="button" aria-pressed={i === svc} onClick={() => setSvc(i)} className={chip(i === svc)}>
            <span className="block">{name}</span>
            <span className="block text-xs text-muted-2">{len}</span>
          </button>
        ))}
      </div>
      <div role="group" aria-label="Day" className="flex flex-wrap gap-2">
        {DEMO_DAYS.map((d, i) => (
          <button key={d} type="button" aria-pressed={i === day} onClick={() => setDay(i)} className={chip(i === day)}>
            {d}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Time" className="flex flex-wrap gap-2">
        {DEMO_SLOTS.map((t, i) => (
          <button key={t} type="button" aria-pressed={i === slot} onClick={() => setSlot(i)} className={chip(i === slot)}>
            {t}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="text-sm text-muted-2 m-0">
        {booked
          ? "Demo only: no money moved. On your site this step opens your own Stripe checkout."
          : `${DEMO_SERVICES[svc][0]} · ${DEMO_DAYS[day]} ${DEMO_SLOTS[slot]} · deposit set by you`}
      </p>
      <button
        type="button"
        onClick={() => setBooked(true)}
        className="rounded-full text-sm font-medium px-6 py-3 bg-fg text-bg min-h-11 cursor-pointer self-start"
      >
        Pay deposit and book
      </button>
    </Frame>
  );
}

function Sms() {
  const [sent, setSent] = useState(false);
  const bubble = (who, text) => (
    <div className={`max-w-[85%] rounded-[18px] px-4 py-2.5 text-sm leading-normal ${who === "us" ? "self-start bg-surface border border-border" : "self-end bg-accent text-white"}`}>
      {text}
    </div>
  );
  return (
    <Frame>
      <span className="text-xs text-muted-2">Missed call · (704) 555-0142 · 2:14 PM</span>
      <div className="flex flex-col gap-2">
        {bubble("us", "Hi, this is [Business name]. Sorry we missed your call. Want to book? Reply with a day that works.")}
        {bubble("them", "Thursday after 5?")}
        {bubble("us", "Thursday at 5:30 is open. Tap to confirm: [booking link]")}
        {bubble("them", "Do you do color too?")}
        <span className="text-xs text-muted-2 flex items-center gap-1.5">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
          Handed off to [Owner name]: question outside its guardrails
        </span>
      </div>
      <form
        className="flex flex-wrap gap-2 items-end border-t border-border pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <label htmlFor="demo-phone" className="w-full text-xs text-muted-2">
          Try it on your phone
        </label>
        <input
          id="demo-phone"
          type="tel"
          placeholder="(704) 555-0100"
          className="flex-[1_1_180px] min-w-0 bg-surface-2 border border-border rounded-input px-4 py-3 text-sm text-fg min-h-11"
        />
        <button type="submit" className="rounded-full text-sm font-medium px-5 py-3 bg-fg text-bg min-h-11 cursor-pointer">
          Text me the demo
        </button>
        <span aria-live="polite" className="w-full text-xs text-muted-2">
          {sent ? "[DEMO TEXTING NOT CONNECTED YET] Once messaging is live, the demo text arrives here." : ""}
        </span>
      </form>
    </Frame>
  );
}

function Site() {
  return (
    <Frame>
      <div className="flex justify-between items-center">
        <span className="font-medium">[Business name]</span>
        <span className="rounded-full text-xs px-3 py-1.5 bg-fg text-bg">Book</span>
      </div>
      <div>
        <div className="font-display italic text-[28px] leading-tight">[Your headline]</div>
        <div className="text-sm text-muted-2">[One line on what you do and where]</div>
      </div>
      <div className="flex gap-2">
        <span className="rounded-full text-xs px-3 py-1.5 border border-border-2">Call</span>
        <span className="rounded-full text-xs px-3 py-1.5 border border-border-2">Directions</span>
      </div>
      <Row left="Hours" right="[Mon–Sat hours]" />
      <Row left="Location" right="[Street address]" />
      <Row left="Reviews" right="[Google rating]" />
    </Frame>
  );
}

function Store() {
  return (
    <Frame>
      <div className="flex justify-between items-center">
        <span className="font-medium">[Shop name]</span>
        <span className="text-xs text-muted-2">Cart · 2</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="aspect-square rounded-input bg-[radial-gradient(70%_70%_at_30%_30%,rgba(137,170,204,.3),transparent_70%),var(--bg-deep)] border border-border" />
            <span className="text-xs">[Product name]</span>
            <span className="text-xs text-muted-2">[Price]</span>
          </div>
        ))}
      </div>
      <Row left="2 items" right="[Subtotal]" />
      <span className="rounded-full text-sm font-medium px-5 py-3 bg-fg text-bg self-start">Checkout</span>
      <span className="text-xs text-muted-2">Payment goes to [Shop name]&apos;s own Stripe account.</span>
    </Frame>
  );
}

function Menu() {
  return (
    <Frame>
      <div className="flex justify-between items-baseline">
        <span className="font-medium">[Restaurant name]</span>
        <span className="text-xs text-muted-2">Order for pickup</span>
      </div>
      <div className="flex gap-2 flex-wrap text-xs">
        {["Popular", "Mains", "Sides", "Drinks"].map((t, i) => (
          <span key={t} className={`rounded-full px-3 py-1.5 border ${i === 0 ? "border-fg text-fg" : "border-border-2 text-muted-2"}`}>
            {t}
          </span>
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <Row key={i} left="[Menu item]" sub="[Short description]" right="[Price]" />
      ))}
      <Row left="2 items · pickup" right={<span className="rounded-full text-xs px-3 py-1.5 bg-fg text-bg">Place order</span>} />
    </Frame>
  );
}

function Dash() {
  return (
    <Frame>
      <div className="flex justify-between items-center">
        <span className="font-medium">[Your app]</span>
        <span className="text-xs text-muted-2">Jobs · Customers · Schedule</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-input p-3">
            <div className="text-xs text-muted-2">[Metric]</div>
            <div className="font-display text-2xl">[0]</div>
          </div>
        ))}
      </div>
      <Row left="[Job] · [Customer]" right="Scheduled" />
      <Row left="[Job] · [Customer]" right="In progress" />
      <Row left="[Job] · [Customer]" right="Done" />
    </Frame>
  );
}

const DEMOS = { site: Site, booking: Booking, store: Store, menu: Menu, sms: Sms, dash: Dash };

export default function ServiceDemo({ kind }) {
  const D = DEMOS[kind] || Site;
  return <D />;
}
