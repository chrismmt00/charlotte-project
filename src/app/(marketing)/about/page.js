import Button from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Section";
import { CheckIcon } from "@/components/ui/Bits";
import { getOffer, money } from "@/lib/offers";

export const metadata = {
  title: "About",
  description:
    "Klyvora is a Charlotte software company of three engineers. We build websites, booking, ordering and AI tools for independent businesses on code we wrote ourselves.",
  alternates: { canonical: "/about" },
};

// Founder copy from the design canvas. Bracketed values are for the founders to fill in.
const TEAM = [
  {
    name: "Chris [Last name]",
    role: "Founder · Product and sales",
    body: "Full-stack development, product direction and AI harnesses. Usually the first person you’ll talk to.",
    bg: "bg-[radial-gradient(90%_120%_at_80%_8%,rgba(137,170,204,.38),transparent_55%),radial-gradient(70%_90%_at_12%_88%,rgba(78,133,191,.3),transparent_60%),var(--bg-deep)]",
  },
  {
    name: "Geoffrey Fylak",
    role: "Founder · [Role]",
    body: "Computer science, NC State. [One line on what Geoffrey builds or owns.]",
    bg: "bg-[conic-gradient(from_210deg_at_70%_65%,rgba(78,133,191,.32),var(--bg-deep)_42%),var(--bg-deep)]",
  },
  {
    name: "Demetrius Brown",
    role: "Founder · [Role]",
    body: "Computer science, UNC Charlotte. [One line on what Demetrius builds or owns.]",
    bg: "bg-[radial-gradient(50%_50%_at_50%_50%,rgba(137,170,204,.3),transparent_70%),repeating-radial-gradient(circle_at_50%_50%,rgba(78,133,191,.12)_0_2px,transparent_2px_18px),var(--bg-deep)]",
  },
];

const RULES = [
  [
    "Prices on the page",
    "Every offer shows setup and monthly, and the monthly is optional except for restaurants. Custom work gets a fixed quote before we start.",
  ],
  ["Pay as it’s built", "50% at kickoff, 30% at a working demo, 20% at launch. You see it before you pay for it."],
  ["No cut of your sales", "Checkout runs through your own Stripe account. We never take a per-order commission."],
  ["Plain English", "No jargon in proposals, invoices or calls. If we can’t explain it simply, we rethink it."],
];

const PROMISES = [
  "No per-order commissions, ever",
  "Checkout through your own Stripe account",
  "Your site and its code are yours at final payment",
  "Cancel any time and keep your data",
];

function BlocksIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-accent-light">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <path d="M17 13v8" />
      <path d="M13 17h8" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-accent-light">
      <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export default function AboutPage() {
  const starter = getOffer("W1");
  return (
    <>
      {/* HERO */}
      <header className="relative px-4 sm:px-6 pt-[168px] pb-[72px] overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(55%_80%_at_50%_0%,rgba(78,133,191,.24),transparent_70%)]" />
        <div className="relative container-site">
          <Eyebrow className="mb-[26px]">About</Eyebrow>
          <h1 className="display-page m-0 mb-[26px] max-w-[1000px]">A Charlotte software company of three.</h1>
          <p className="text-[15px] sm:text-[17px] leading-[1.7] text-muted-2 max-w-[600px] m-0">
            We build websites, booking, ordering and AI tools for independent businesses, on code we wrote ourselves. When you call, one of us answers.
          </p>
        </div>
      </header>

      {/* MISSION */}
      <section aria-labelledby="mission-h" className="px-4 sm:px-6 pt-[72px] pb-10">
        <div className="container-site border-t border-border pt-14 flex flex-wrap gap-x-16 gap-y-8">
          <div className="flex-[1_1_340px] min-w-0">
            <Eyebrow className="mb-[18px]">Why we exist</Eyebrow>
            <h2 id="mission-h" className="display-2 m-0">
              Software that runs your business, owned by you.
            </h2>
          </div>
          <div className="flex-[1_1_440px] min-w-0 flex flex-col gap-[18px] text-base leading-[1.75] text-muted-2">
            <p className="m-0">
              Independent businesses get sold templates that look fine and do little, or marketplaces that take a cut of every booking and order. A barbershop, a bakery or a food truck deserves the kind of software a chain has, at a price that makes sense, without handing over its customers to get it.
            </p>
            <p className="m-0">
              So we talk about your numbers, not our technology: fewer missed bookings, less paid to delivery apps, fewer hours lost to DMs. The technology is our problem.
            </p>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section aria-labelledby="team-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site">
          <Eyebrow className="mb-[18px]">The team</Eyebrow>
          <h2 id="team-h" className="display-2 m-0 mb-3.5">
            The people you’ll talk to
          </h2>
          <p className="text-[15px] leading-[1.7] text-muted-2 max-w-[560px] m-0 mb-12">
            Three founders, all engineers. The person who builds your system is the person who picks up when it needs to change.
          </p>
          <div className="flex flex-wrap gap-5">
            {TEAM.map((p) => (
              <article key={p.name} className="flex-[1_1_300px] min-w-0 bg-surface border border-border rounded-card-lg overflow-hidden flex flex-col">
                {/* Swap for a next/image portrait once photos exist. */}
                <div className={`aspect-[4/3] ${p.bg} flex items-end px-[22px] py-[18px] box-border`}>
                  <span className="text-[13px] text-muted-2">[Photo · 4:3 · 1200×900]</span>
                </div>
                <div className="px-7 pt-[26px] pb-[30px] flex flex-col gap-2">
                  <h3 className="text-[21px] font-medium m-0">{p.name}</h3>
                  <Eyebrow accent as="span">
                    {p.role}
                  </Eyebrow>
                  <p className="text-sm leading-[1.65] text-muted mt-1.5 mb-0">{p.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* OWN CODE */}
      <section aria-labelledby="code-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site flex flex-wrap gap-5">
          <div className="flex-[7_1_520px] min-w-0 border border-border rounded-tile p-7 sm:p-12 box-border bg-[radial-gradient(90%_120%_at_80%_8%,rgba(137,170,204,.3),transparent_55%),radial-gradient(70%_90%_at_12%_88%,rgba(78,133,191,.24),transparent_60%),var(--bg-deep)] flex flex-col justify-end gap-3.5 min-h-[380px]">
            <Eyebrow accent>How we keep prices reachable</Eyebrow>
            <h2 id="code-h" className="font-display italic font-normal text-[clamp(40px,5.5vw,64px)] leading-none tracking-[-.01em] m-0">
              We write our own code.
            </h2>
            <p className="text-[15px] leading-[1.7] text-muted-2 m-0 max-w-[560px]">
              Every site and system runs on foundations we built and keep improving: booking, ordering, menus, payments and admin. That’s how a Starter Website can be {money(starter.setup)}. Your project gets custom work where it counts and proven parts everywhere else.
            </p>
          </div>
          <div className="flex-[5_1_360px] min-w-0 flex flex-col gap-5">
            <div className="flex-1 bg-surface border border-border rounded-card p-7 box-border flex flex-col gap-2.5">
              <BlocksIcon />
              <h3 className="text-lg font-medium mt-1 mb-0">Not Wix, not Squarespace</h3>
              <p className="text-sm leading-[1.65] text-muted m-0">
                Custom code on our own foundations, so your site does what your business needs instead of what a page builder allows.
              </p>
            </div>
            <div className="flex-1 bg-surface border border-border rounded-card p-7 box-border flex flex-col gap-2.5">
              <PinIcon />
              <h3 className="text-lg font-medium mt-1 mb-0">Built and supported here</h3>
              <p className="text-sm leading-[1.65] text-muted m-0">We’re in Charlotte. We can come by, and a local person answers when you call.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section aria-labelledby="how-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site">
          <Eyebrow className="mb-[18px]">How we work</Eyebrow>
          <h2 id="how-h" className="display-2 m-0 mb-12">
            Four rules we don’t break
          </h2>
          <ol className="list-none p-0 m-0 flex flex-wrap gap-[18px]">
            {RULES.map(([title, body], i) => (
              <li key={title} className="flex-[1_1_250px] min-w-0 border-t border-border pt-7 flex flex-col gap-2">
                <Eyebrow accent as="span">
                  {String(i + 1).padStart(2, "0")}
                </Eyebrow>
                <h3 className="text-xl font-medium m-0">{title}</h3>
                <p className="text-sm leading-[1.65] text-muted m-0">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* OWNERSHIP */}
      <section aria-labelledby="own-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site border border-border rounded-tile px-6 sm:px-11 py-8 sm:py-[54px] box-border bg-[radial-gradient(90%_120%_at_80%_8%,rgba(137,170,204,.22),transparent_55%),radial-gradient(70%_90%_at_12%_88%,rgba(78,133,191,.18),transparent_60%),var(--bg-deep)] flex flex-wrap gap-10 items-center justify-between">
          <div className="flex-[1_1_420px] min-w-0">
            <Eyebrow accent className="mb-[18px]">
              Our promise
            </Eyebrow>
            <h2 id="own-h" className="display-2 m-0 mb-3.5">
              You own it.
            </h2>
            <p className="text-[15px] leading-[1.7] text-muted-2 max-w-[520px] m-0">
              Your domain, content, customer list, data and Stripe account are yours from day one. The site we build and its code are yours on final payment; if your site uses one of our templates, that template is licensed rather than sold. If you ever leave, you get a full export.
            </p>
          </div>
          <ul className="flex-[1_1_320px] min-w-0 list-none p-0 m-0 flex flex-col gap-3.5 text-[15px] text-fg">
            {PROMISES.map((t) => (
              <li key={t} className="flex gap-3 items-center">
                <CheckIcon />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="about-cta-h" className="px-4 sm:px-6 py-[110px]">
        <div className="container-site bg-surface border border-border rounded-card-lg p-7 sm:p-11 box-border flex flex-wrap gap-8 items-center justify-between">
          <div className="flex-[1_1_480px] min-w-0">
            <h2 id="about-cta-h" className="font-display italic font-normal text-[clamp(32px,4vw,44px)] leading-[1.1] m-0 mb-3">
              Come build with us early.
            </h2>
            <p className="text-[15px] text-muted-2 leading-[1.65] m-0">
              A few reduced-setup slots open each quarter for businesses getting online for the first time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3.5">
            <Button href="/founding">Founding customers</Button>
            <Button href="/contact" variant="secondary">
              Get a quote
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
