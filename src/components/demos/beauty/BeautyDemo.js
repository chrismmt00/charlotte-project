"use client";

import { useRef, useState } from "react";
import ClientApp from "./ClientApp";
import Kiosk from "./Kiosk";
import OwnerAdmin from "./OwnerAdmin";
import TechApp from "./TechApp";
import { DemoProvider } from "./store";
import { Icon, Toast } from "./ui";
import "./beauty-demo.css";

const VIEWS = [
  {
    id: "kiosk",
    icon: "sparkle",
    label: "Walk-in kiosk",
    who: "What walk-ins see",
    try: [
      "Tap “I’m a walk-in”, add your name and pick a few services.",
      "Choose a favourite technician or first available.",
      "Switch to the waiting-room screen to see yourself in line.",
    ],
    covers: [
      "Tablet or QR check-in",
      "Name, services and preferred tech",
      "Live queue with wait estimates",
      "Text me when I’m next",
      "Visit statuses from waiting to completed",
    ],
  },
  {
    id: "client",
    icon: "heart",
    label: "Client app",
    who: "What your clients see",
    try: [
      "Book a gel manicure, or turn on group booking for a birthday.",
      "Open Me → New design request and upload some inspo.",
      "Tap the bell to see the reminder texts.",
    ],
    covers: [
      "Services, prices and times",
      "Pick a tech or first available",
      "Group bookings and waitlist",
      "Deposits and cancellation policy up front",
      "Reschedule, cancel and rebook",
      "Saved shapes, colours and notes",
      "Custom design quotes",
      "Reviews and private notes to the owner",
    ],
  },
  {
    id: "tech",
    icon: "user",
    label: "Technician app",
    who: "What your team sees",
    try: [
      "Open Amara’s appointment to see the inspiration photo and notes.",
      "Add an upgrade, say you’re running late, or call the front desk.",
      "Finish the service and it lands in the owner’s checkout.",
      "In Schedule, switch to Month, open a future day to see who’s booked, then add a break or block off time.",
    ],
    covers: [
      "Daily and weekly schedule",
      "Client photos, preferences and prep notes",
      "Start, finish, delays and help requests",
      "Approved upgrades and price changes",
      "Commission, tips and completed services",
      "Week and month calendar with advance bookings",
      "Breaks, blocked time and hours for any future day",
      "Weekly hours and day-off requests",
      "Clock in, time off, announcements and shift notes",
    ],
  },
  {
    id: "owner",
    icon: "chart",
    label: "Owner dashboard",
    who: "What you see",
    try: [
      "Check in on the kiosk, then come back and press “Assign next”.",
      "Approve Tina’s time off from Team.",
      "Browse Reports, Inventory, Marketing and Requests.",
    ],
    covers: [
      "Calendar, queue and team availability",
      "Services, durations and tech pricing",
      "Staff accounts, permissions and rotation rules",
      "Client profiles and history",
      "Deposits, checkout, tips and receipts",
      "Sales, cancellations and tech performance",
      "Inventory, loyalty, gift cards and campaigns",
      "Settings, data exports and feature requests",
    ],
  },
];

export default function BeautyDemo() {
  const [view, setView] = useState("kiosk");
  const stageRef = useRef(null);
  const v = VIEWS.find((x) => x.id === view);
  const goTo = (id) => {
    setView(id);
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <DemoProvider>
      <div className="bd" ref={stageRef}>
        <div className="bd-views" role="tablist" aria-label="Demo views">
          {VIEWS.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              id={`bd-tab-${x.id}`}
              aria-selected={view === x.id}
              aria-controls="bd-stage"
              onClick={() => setView(x.id)}
            >
              <span className="bd-views-icon" aria-hidden="true">
                <Icon name={x.icon} size={20} />
              </span>
              <span>
                <strong>{x.label}</strong>
                <span>{x.who}</span>
              </span>
            </button>
          ))}
        </div>
        <div
          id="bd-stage"
          role="tabpanel"
          aria-labelledby={`bd-tab-${view}`}
          className={`bd-stage is-${view}`}
        >
          <div className="bd-device">
            {view === "kiosk" && <Kiosk goTo={goTo} />}
            {view === "client" && <ClientApp />}
            {view === "tech" && <TechApp />}
            {view === "owner" && <OwnerAdmin />}
          </div>
          <aside className="bd-guide">
            <p className="bd-eyebrow">Try this</p>
            <ol className="bd-try">
              {v.try.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            <p className="bd-eyebrow">In this view</p>
            <ul className="bd-covers">
              {v.covers.map((c) => (
                <li key={c}>
                  <Icon name="check" size={15} strokeWidth={2.2} /> {c}
                </li>
              ))}
            </ul>
            <p className="bd-hint">
              Sample salon and data. Nothing you do here sends a text or moves
              money, and it resets when you leave the page.
            </p>
          </aside>
        </div>
        <Toast />
      </div>
    </DemoProvider>
  );
}
