"use client";

import { useRef, useState } from "react";
// Shared demo styles first, so each view’s own stylesheet can build on them.
import "../beauty/beauty-demo.css";
import "./daycare-demo.css";
import FrontDesk from "./FrontDesk";
import ParentApp from "./ParentApp";
import GuestPass from "./GuestPass";
import TeacherApp from "./TeacherApp";
import OwnerAdmin from "./OwnerAdmin";
import { DaycareProvider } from "./store";
import { Icon, Toast } from "./ui";

const VIEWS = [
  {
    id: "desk",
    icon: "shield",
    label: "Front desk",
    who: "Check-in & pickup",
    try: [
      "Tap Drop-off and enter PIN 1357 to check in Arjun, who’s arriving late.",
      "Tap Pickup → I have a pickup pass. Use the code from the Guest pass view.",
      "Try “Someone not on the list” for Noah to see a custody restriction stop a release.",
    ],
    covers: [
      "Tablet or QR check-in with guardian PIN",
      "Arrival time and adult recorded",
      "Teachers and guardians notified",
      "Pickup codes that never release a child on their own",
      "Staff compare photo and ID, then approve or refuse",
      "Custody restrictions enforced",
      "Failed attempts limited and logged",
    ],
  },
  {
    id: "parent",
    icon: "heart",
    label: "Parent app",
    who: "What families see",
    try: [
      "Switch between Maya and Eli to see each child’s day.",
      "In Pickup, tap “Authorize someone else” to add a guest.",
      "Acknowledge Maya’s incident report and pay December tuition.",
    ],
    covers: [
      "Siblings in one account",
      "Live check-in status and classroom",
      "Meals, naps, diapers, activities, mood and photos",
      "Messages with teachers and the director",
      "Absence, late and early pickup notices",
      "Allergies, medical notes and routines",
      "Guest pickup authorization and revoking",
      "Tuition, autopay, invoices and receipts",
      "Calendar, forms, signatures and incident reports",
      "Classroom camera when the center allows it",
    ],
  },
  {
    id: "guest",
    icon: "key",
    label: "Guest pass",
    who: "Grandma’s phone",
    try: [
      "Open the invite Danielle sent to Grandma Linda.",
      "Fill in the form and add a face photo (or use the sample).",
      "Get the pickup pass, then enter the code at the front desk.",
    ],
    covers: [
      "Secure invite from a verified parent",
      "Legal name, phone and relationship",
      "Face photo and ID check at the desk",
      "Pickup procedures confirmed",
      "Code tied to one child, one date and a time window",
      "Expires, can’t be reused, can be revoked",
    ],
  },
  {
    id: "teacher",
    icon: "book",
    label: "Teacher app",
    who: "What staff see",
    try: [
      "Select several children and log lunch or outdoor play at once.",
      "Record Jayden’s 12:30 PM medication.",
      "Draft end-of-day summaries from what was logged.",
    ],
    covers: [
      "Roster, attendance and ratios",
      "Allergy and care alerts",
      "Group activity logging",
      "Meals, naps, diapers and photos with permissions",
      "Medication records by qualified staff",
      "Incident reports sent to guardians",
      "Parent messages and supply requests",
      "Clock in, schedule and time off",
    ],
  },
  {
    id: "owner",
    icon: "chart",
    label: "Owner dashboard",
    who: "What you see",
    try: [
      "Open Pickups to review Grandma Linda’s verification and the refusal log.",
      "Approve or waitlist an application in Enrollment.",
      "In Cameras, turn on parent viewing, then watch the classroom in the parent app.",
    ],
    covers: [
      "Attendance, occupancy and ratios",
      "Secure pickup review and audit history",
      "Enrollment, waitlists and documents",
      "Children, families and custody flags",
      "Classrooms, staff, certifications and time off",
      "Tuition plans, balances and reminders",
      "Announcements, closures and emergencies",
      "Reports, exports, compliance and audit logs",
      "Cameras, multiple locations and feature requests",
    ],
  },
];

export default function DaycareDemo() {
  const [view, setView] = useState("desk");
  const stageRef = useRef(null);
  const v = VIEWS.find((x) => x.id === view);
  const goTo = (id) => {
    setView(id);
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <DaycareProvider>
      <div className="bd dc" ref={stageRef}>
        <div className="bd-views" role="tablist" aria-label="Demo views">
          {VIEWS.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              id={`dc-tab-${x.id}`}
              aria-selected={view === x.id}
              aria-controls="dc-stage"
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
          id="dc-stage"
          role="tabpanel"
          aria-labelledby={`dc-tab-${view}`}
          className={`bd-stage is-${view}`}
        >
          <div className="bd-device">
            {view === "desk" && <FrontDesk goTo={goTo} />}
            {view === "parent" && <ParentApp goTo={goTo} />}
            {view === "guest" && <GuestPass goTo={goTo} />}
            {view === "teacher" && <TeacherApp goTo={goTo} />}
            {view === "owner" && <OwnerAdmin goTo={goTo} />}
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
              Sample center and invented families. Children are shown as
              initials and illustrations, never real photos. Nothing here sends
              a message or moves money, and it resets when you leave the page.
            </p>
          </aside>
        </div>
        <Toast />
      </div>
    </DaycareProvider>
  );
}
