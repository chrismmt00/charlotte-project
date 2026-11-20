import Button from "@/components/ui/Button";
import { FinalCta, Section } from "@/components/marketing/Parts";
import DaycareDemo from "@/components/demos/daycare/DaycareDemo";
import { Icon } from "@/components/demos/kit";
import { INDUSTRIES, money, quoteHref } from "@/lib/marketing/catalog";
import { SetupAmount, LaunchOffer } from "@/components/marketing/SetupPrice";
import { pageMetadata } from "@/lib/marketing/seo";

const daycare = INDUSTRIES.find((s) => s.id === "daycare");

export const metadata = pageMetadata(
  "Daycare Software Demo | Klyvora Studio",
  "Try a live demo of the Klyvora childcare system: front-desk check-in, secure guest pickup, the parent app, the teacher app and the owner dashboard, all connected.",
  "/demo/daycare",
);

const SAFETY = [
  [
    "key",
    "A pickup code or QR pass never releases a child on its own. It only starts the check.",
  ],
  [
    "id",
    "Staff compare the adult with their submitted photo and check a photo ID before approving.",
  ],
  [
    "shield",
    "Custody restrictions come first. If anything doesn’t match, the child stays with staff and the attempt is logged.",
  ],
];

const GROUPS = [
  {
    title: "For parents",
    items: [
      "Siblings in one secure account",
      "Live check-in status, classroom and teachers",
      "Meals, naps, diapers, activities, mood and photos",
      "Milestones, progress and end-of-day summaries",
      "Messages with teachers and the director",
      "Absence, late arrival, early pickup and vacation notices",
      "Allergies, care instructions, routines and emergency contacts",
      "Tuition, autopay, invoices and receipts",
      "Calendar, permission slips, signatures and incident reports",
    ],
  },
  {
    title: "Secure check-in & pickup",
    items: [
      "Tablet or QR check-in with a family PIN",
      "Arrival time and adult recorded, teachers and guardians notified",
      "Parents authorize guests for a date and time window",
      "Guests verify with a face photo and ID details",
      "One-time or recurring passes that expire and can be revoked",
      "Staff verify identity before approving release",
      "Custody restrictions and unexpected pickups handled by staff",
      "Failed attempts limited, logged and reported",
    ],
  },
  {
    title: "For teachers",
    items: [
      "Roster, attendance and child-to-staff ratios",
      "Allergy and care alerts",
      "Log one activity for several children at once",
      "Photos that respect each family’s permission",
      "Medication records by qualified staff",
      "Incident reports sent to guardians",
      "Parent messages, supply requests and announcements",
      "Clock in, schedule, breaks and time off",
    ],
  },
  {
    title: "For the owner",
    items: [
      "Attendance, occupancy, staffing and alerts at a glance",
      "Enrollment applications, waitlists and documents",
      "Child, family, pickup and custody records",
      "Classrooms, capacity and ratio limits you configure",
      "Staff accounts, permissions and certification dates",
      "Tuition plans, sibling rates, balances and reminders",
      "Announcements, closures and emergency messages",
      "Reports, exports, compliance tracking and audit logs",
    ],
  },
  {
    title: "Extras",
    items: [
      "AI help drafting daily summaries and newsletters from real entries, reviewed before sending",
      "Camera integrations with role-based access, after a separate review",
      "Multiple locations under one owner account",
      "Custom pickup procedures, forms, programs and billing",
      "A feature-request page that tracks progress",
    ],
  },
  {
    title: "Security & privacy",
    items: [
      "Role-based access for families, staff and admins",
      "Extra confirmation for sensitive actions",
      "Photo permissions per child",
      "Encrypted data and protected identity records",
      "Retention and deletion policies you set",
      "Access and change logs for sensitive records",
    ],
  },
];

export default function DaycareDemoPage() {
  return (
    <>
      <header className="dc-hero">
        <div className="dc-hero-glow" aria-hidden="true" />
        <div className="container-site dc-hero-inner">
          <p className="eyebrow mk-eyebrow">Live demo · Daycare & childcare</p>
          <h1 className="mk-h1 dc-hero-title">
            Happy families. <em>Safer</em> pickups.
          </h1>
          <p className="mk-intro">
            One connected system for the front desk, parents, teachers and you.
            Check in a child, follow their day in the parent app, authorize
            Grandma for pickup, and watch staff verify her before anyone is
            released.
          </p>
          <LaunchOffer />
          <ul className="mk-intro-chips">
            <li className="mk-chip">5 connected views</li>
            <li className="mk-chip">
              Setup from <SetupAmount service={daycare} />
            </li>
            <li className="mk-chip">
              <strong>{money(daycare.monthly)}</strong>/month
            </li>
            <li className="mk-chip">Tablet included</li>
          </ul>
          <div className="mk-actions">
            <Button href="#demo">
              Try the demo <span aria-hidden="true">↓</span>
            </Button>
            <Button href={quoteHref(daycare)} variant="secondary">
              {daycare.cta}
            </Button>
          </div>
        </div>
      </header>

      <section
        id="demo"
        className="bd-demo-section"
        aria-label="Interactive daycare demo"
      >
        <div className="container-site">
          <DaycareDemo />
        </div>
      </section>

      <Section
        id="safety"
        eyebrow="Pickup safety"
        title="Software that supports staff, never replaces them."
        intro="The pickup workflow guides your team through the right checks and keeps a record of every release. Your policies, staff judgment and legal requirements always come first."
      >
        <div className="dc-safety">
          {SAFETY.map(([icon, text]) => (
            <div key={icon}>
              <Icon name={icon} size={22} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="everything"
        eyebrow="Everything in the demo"
        title="Built for the way a center really runs."
        intro="These are the tools shown above. Your setup is configured around your classrooms, staff and policies, with the features, integrations and any separately quoted items confirmed in your written proposal."
      >
        <div className="dc-groups">
          {GROUPS.map((g) => (
            <div key={g.title} className="bd-group-card">
              <h3 className="mk-h3">{g.title}</h3>
              <ul>
                {g.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mk-note mk-note-callout mt-8">
          <h3 className="mk-h3">Careful with what matters most.</h3>
          <p>{daycare.caution}</p>
          <p>{daycare.dataCare}</p>
        </div>
      </Section>

      <FinalCta service={daycare} />
    </>
  );
}
