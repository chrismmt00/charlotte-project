import Button from "@/components/ui/Button";
import { FinalCta, Section } from "@/components/marketing/Parts";
import BeautyDemo from "@/components/demos/beauty/BeautyDemo";
import { INDUSTRIES, money, quoteHref } from "@/lib/marketing/catalog";
import { pageMetadata } from "@/lib/marketing/seo";

const beauty = INDUSTRIES.find((s) => s.id === "beauty");

export const metadata = pageMetadata(
  "Nail Salon Software Demo | Klyvora Studio",
  "Try a live demo of the Klyvora salon system: walk-in kiosk, client booking app, technician app and owner dashboard, all connected.",
  "/demo/beauty",
);

const GROUPS = [
  {
    title: "For clients",
    items: [
      "Online booking with services, prices, durations and open times",
      "Preferred technician or first available",
      "Several services in one booking",
      "Guest booking or a client account",
      "Upcoming visits, history and one-tap rebooking",
      "Reschedule or cancel by link",
      "Saved shapes, colours and service notes",
      "Text and email reminders",
      "Deposits and cancellation policy shown before booking",
      "Inspiration photos and custom design quotes",
      "Group bookings for birthdays and bridal parties",
      "Waitlist for earlier openings",
      "Reviews, plus private notes to the owner",
    ],
  },
  {
    title: "For walk-ins",
    items: [
      "Check in on a tablet or by QR code",
      "Name, services and preferred technician",
      "Live queue next to booked appointments",
      "Wait estimates you can adjust",
      "Technician rotation with your own rules",
      "Skills and client requests respected",
      "“You’re next” texts so guests can step out",
      "Waiting, assigned, in service, checkout and completed",
    ],
  },
  {
    title: "For technicians",
    items: [
      "Their own login and daily or weekly schedule",
      "Appointments, walk-ins and breaks in one list",
      "Client photos, preferences and prep notes",
      "Start, finish, delays and front-desk requests",
      "Approved upgrades and permitted price changes",
      "Commission, tips and completed services",
      "Clock in and out, availability and time off",
      "Team announcements and shift notes",
    ],
  },
  {
    title: "For the owner",
    items: [
      "Salon calendar, queue and team availability",
      "Services, prices, durations and cleanup time",
      "Technician-specific pricing",
      "Staff accounts, permissions and schedules",
      "Time-off approvals and rotation rules",
      "Client profiles, history and preferences",
      "Deposits, balances, tips and receipts",
      "Sales, cancellations, popular services and tech performance",
      "Supplies, retail stock and low-stock alerts",
      "Loyalty, gift cards, promotions and rebooking reminders",
      "Hours, booking rules and client messages",
      "Customer, appointment and report exports",
    ],
  },
];

export default function BeautyDemoPage() {
  return (
    <>
      <header className="bd-hero">
        <div className="bd-hero-glow" aria-hidden="true" />
        <div className="container-site bd-hero-inner">
          <p className="eyebrow mk-eyebrow">Live demo · Nail salons & beauty</p>
          <h1 className="mk-h1 bd-hero-title">
            Your salon, <em>beautifully</em> organized.
          </h1>
          <p className="mk-intro">
            One connected system for the front desk, your clients, your team and
            you. Tap around: check in as a walk-in, book a set, run a
            technician’s day, and watch it all land in the owner dashboard.
          </p>
          <ul className="mk-intro-chips">
            <li className="mk-chip">4 connected views</li>
            <li className="mk-chip">
              Setup from <strong>{money(beauty.setup)}</strong>
            </li>
            <li className="mk-chip">
              <strong>{money(beauty.monthly)}</strong>/month
            </li>
            <li className="mk-chip">Tablet included</li>
          </ul>
          <div className="mk-actions">
            <Button href="#demo">
              Try the demo <span aria-hidden="true">↓</span>
            </Button>
            <Button href={quoteHref(beauty)} variant="secondary">
              {beauty.cta}
            </Button>
          </div>
        </div>
      </header>

      <section
        id="demo"
        className="bd-demo-section"
        aria-label="Interactive salon demo"
      >
        <div className="container-site">
          <BeautyDemo />
        </div>
      </section>

      <Section
        id="everything"
        eyebrow="Everything in the demo"
        title="Built for the way a salon really runs."
        intro="These are the tools shown above. Your setup is configured around your services, team and booking rules, with the features and integrations confirmed in your written proposal."
      >
        <div className="bd-groups">
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
          <h3 className="mk-h3">Made around your salon.</h3>
          <p>
            Need your own rotation rules, station assignments, commission
            structure, VIP treatment, packages, design approvals or staff
            workflow? Ask for it from the Requests page in your dashboard and
            follow its progress there. New features are quoted separately.
          </p>
        </div>
      </Section>

      <FinalCta service={beauty} />
    </>
  );
}
