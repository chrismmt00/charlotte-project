import Button from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Section";
import { CheckIcon, StatusDot } from "@/components/ui/Bits";
import Faq from "@/components/ui/Faq";
import FoundingForm from "@/components/site/FoundingForm";
import { getOffer, money } from "@/lib/offers";

export const metadata = {
  title: "Founding customers",
  description:
    "A few reduced-setup slots each quarter for independent Charlotte businesses getting online for the first time, in exchange for a case study and a referral or two.",
  alternates: { canonical: "/founding" },
};

// [SLOTS LEFT] stays a placeholder until the admin catalog serves the real count.
const SLOTS_LINE = "[SLOTS LEFT] slots left this quarter";

const ASK = [
  {
    text: "A case study after launch: the problem, what we built and how it went, in your words",
    icon: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),
  },
  {
    text: "Permission to show your site in our work",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M3 9h18" />
      </>
    ),
  },
  {
    text: "A referral or two, if you’re happy with what we built",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5" />
        <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
        <path d="M18.5 14.8c1.6.8 2.6 2.6 3 5.2" />
      </>
    ),
  },
];

const WHO = [
  ["First time online", "No website yet, or only social media."],
  ["Small by size or revenue", "A handful of people, or early in the business."],
  ["In a focus neighborhood", "[NEIGHBORHOODS]"],
  ["Independent", "Owner-run, not part of a chain or franchise."],
];

const STEPS = [
  ["Apply", "Tell us about your business with the form below."],
  ["A free call", "Thirty minutes to see what you need and whether a slot fits."],
  ["Your proposal", "The founding setup price, the scope and the case-study agreement, in writing."],
  ["Launch, then the story", "We launch, give it time to work, then write the case study with you."],
];

const FAQ = [
  {
    q: "How much lower is the setup?",
    a: "[DISCOUNT TERMS]. It’s set per slot and written into your proposal before you pay anything.",
  },
  {
    q: "Does the monthly price change?",
    a: "No. Monthly plans cost the same for every client. Only the setup fee is reduced or split.",
  },
  {
    q: "What if I don’t want a case study?",
    a: "Then regular pricing is the better fit, and it’s on the page. Same work, same terms.",
  },
];

export default function FoundingPage() {
  const starter = getOffer("W1");
  const GET = [
    <>
      A reduced or split setup fee: <span className="text-muted-2">[DISCOUNT TERMS]</span>
    </>,
    "The same scope, support and ownership terms as every client",
    `Any offer on the menu, from a ${money(starter.setup)} Starter Website up`,
    "A local team that picks up the phone",
  ];
  return (
    <>
      {/* HERO */}
      <header className="relative px-4 sm:px-6 pt-[168px] pb-[72px] overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(55%_80%_at_20%_0%,rgba(78,133,191,.26),transparent_70%),radial-gradient(40%_60%_at_85%_20%,rgba(137,170,204,.14),transparent_70%)]"
        />
        <div className="relative container-site">
          <div className="inline-flex flex-wrap items-center gap-x-[18px] gap-y-2.5 mb-[26px]">
            <Eyebrow as="span">Founding customers</Eyebrow>
            <span className="inline-flex items-center gap-2 text-[13px] text-fg border border-border bg-[rgba(var(--surface-rgb),.6)] rounded-full px-3.5 py-1.5">
              <StatusDot />
              {SLOTS_LINE}
            </span>
          </div>
          <h1 className="display-page m-0 mb-[26px] max-w-[1000px]">A few reduced-setup slots each quarter.</h1>
          <p className="text-[15px] sm:text-[17px] leading-[1.7] text-muted-2 max-w-[620px] m-0 mb-9">
            For independent Charlotte businesses getting online for the first time. You get a lower or split setup fee. We get a case study and a referral or two.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <Button href="#apply">Apply for a slot</Button>
            <Button href="/pricing" variant="secondary">
              See regular prices
            </Button>
          </div>
        </div>
      </header>

      {/* THE TRADE */}
      <section aria-labelledby="trade-h" className="px-4 sm:px-6 pt-[72px] pb-10">
        <div className="container-site">
          <h2 id="trade-h" className="display-2 m-0 mb-10">
            The trade
          </h2>
          <div className="flex flex-wrap gap-5 items-stretch">
            <div className="gradient-ring flex-[1_1_340px] min-w-0 flex">
              <div className="flex-1 min-w-0 bg-surface rounded-card-lg p-6 sm:p-9 box-border flex flex-col gap-[18px]">
                <Eyebrow accent>What you get</Eyebrow>
                <ul className="list-none p-0 m-0 flex flex-col gap-3.5 text-[15px] leading-normal">
                  {GET.map((t, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="mt-px">
                        <CheckIcon />
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm leading-[1.65] text-muted mt-auto mb-0">The monthly plan is the same price for everyone. Only the setup changes.</p>
              </div>
            </div>
            <div className="flex-[1_1_340px] min-w-0 bg-surface border border-border rounded-card-lg p-6 sm:p-9 box-border flex flex-col gap-[18px]">
              <Eyebrow>What we ask</Eyebrow>
              <ul className="list-none p-0 m-0 flex flex-col gap-3.5 text-[15px] leading-normal">
                {ASK.map((a) => (
                  <li key={a.text} className="flex gap-3 items-start">
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-px text-accent-light">
                      {a.icon}
                    </svg>
                    <span>{a.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section aria-labelledby="who-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site flex flex-wrap gap-x-16 gap-y-8">
          <div className="flex-[1_1_340px] min-w-0">
            <Eyebrow className="mb-[18px]">Who it’s for</Eyebrow>
            <h2 id="who-h" className="display-2 m-0 mb-3.5">
              Small, local, and new to this
            </h2>
            <p className="text-[15px] leading-[1.7] text-muted-2 m-0 max-w-[420px]">
              Slots go to independent Charlotte businesses that meet one or more of these. Exact criteria: [ELIGIBILITY DETAILS].
            </p>
          </div>
          <ul className="flex-[1_1_480px] min-w-0 list-none p-0 m-0 flex flex-wrap gap-x-8">
            {WHO.map(([title, body]) => (
              <li key={title} className="flex-[1_1_220px] min-w-0 border-t border-border py-[22px] flex flex-col gap-1.5">
                <span className="text-[17px] font-medium">{title}</span>
                <span className="text-sm leading-[1.6] text-muted">{body}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* STEPS */}
      <section aria-labelledby="steps-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site">
          <Eyebrow className="mb-[18px]">How it works</Eyebrow>
          <h2 id="steps-h" className="display-2 m-0 mb-10">
            From application to launch
          </h2>
          <ol className="list-none p-0 m-0 flex flex-wrap gap-[18px]">
            {STEPS.map(([title, body], i) => (
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

      {/* APPLY */}
      <section id="apply" aria-labelledby="apply-h" className="px-4 sm:px-6 pt-[110px] pb-10 scroll-mt-20">
        <div className="container-site flex flex-wrap gap-x-16 gap-y-10">
          <div className="flex-[1_1_340px] min-w-0">
            <Eyebrow className="mb-[18px]">Apply</Eyebrow>
            <h2 id="apply-h" className="display-2 italic m-0 mb-3.5">
              Ask for a slot.
            </h2>
            <p className="text-[15px] leading-[1.7] text-muted-2 m-0 max-w-[400px]">
              We reply within a day. If this quarter is full, we’ll tell you when the next slots open, or you can start at regular prices.
            </p>
          </div>
          <div className="flex-[1_1_520px] min-w-0 bg-surface border border-border rounded-card-lg p-[22px] sm:p-9 box-border">
            <FoundingForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="ffaq-h" className="px-4 sm:px-6 py-[110px]">
        <div className="container-site flex flex-wrap gap-x-16 gap-y-8">
          <div className="flex-[1_1_300px] min-w-0">
            <Eyebrow className="mb-[18px]">Questions</Eyebrow>
            <h2 id="ffaq-h" className="display-2 m-0">
              Before you apply
            </h2>
          </div>
          <div className="flex-[2_1_560px] min-w-0">
            <Faq items={FAQ} openFirst={false} />
          </div>
        </div>
      </section>
    </>
  );
}
