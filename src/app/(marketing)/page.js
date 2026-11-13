import { getCatalog } from "@/lib/server/catalog";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card, { FeaturedCard } from "@/components/ui/Card";
import Section, { Eyebrow } from "@/components/ui/Section";
import Faq from "@/components/ui/Faq";
import { CheckIcon, DashList, Marquee, ServiceIcon, StatusDot } from "@/components/ui/Bits";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import RotatingWord from "@/components/home/RotatingWord";
import Loader from "@/components/home/Loader";
import Playground from "@/components/home/Playground";
import LeadForm from "@/components/site/LeadForm";
import { HOME_FAQ } from "@/lib/faq";
import { CONTACT, SITE_URL } from "@/lib/site";
import { getOffer, money } from "@/lib/offers";

export const metadata = {
  title: { absolute: "Klyvora · Software that runs your business" },
  description:
    "Websites, booking, online ordering and AI automation for Charlotte's independent businesses. Real prices on every page, a working system in weeks, and you own your data.",
  alternates: { canonical: "/" },
};

const ROLES = ["websites", "booking", "online ordering", "AI automation", "custom software"];

const SERVICES = [
  {
    slug: "websites",
    title: "Websites",
    body: "A fast, mobile-first site that answers the questions your customers call about. A Starter landing page from $499, a full Standard site from $1,499. Monthly hosting and admin optional.",
  },
  {
    slug: "booking",
    title: "Online booking",
    body: "Customers book and pay deposits on your own site instead of DMs or a marketplace that charges you. Reminders, no-show protection, your calendar.",
  },
  {
    slug: "ecommerce",
    title: "Ecommerce",
    body: "A small store for the products you sell by DM and Cash App today. Checkout runs through your own Stripe account; we take nothing per order.",
  },
  {
    slug: "restaurants",
    title: "Restaurant ordering and kiosks",
    body: "Your menu, online ordering and self-serve kiosks on one system, with staff permissions and reporting. No delivery-app commissions on your own orders.",
  },
  {
    slug: "ai",
    title: "AI automation",
    body: "Missed-call text-back, review requests, intake and follow-ups handled by an agent with guardrails and a human handoff. From $499 plus usage.",
  },
  {
    slug: "custom",
    title: "Custom web apps and AI harnesses",
    body: "One focused workflow with login, roles and a dashboard, or an agent wired to your tools with permissions, logs and testing. Fixed quote, and the custom code is yours.",
  },
];

const STEPS = [
  ["Discover", "A free 30-minute call. You talk, we map where hours and money are leaking out of your operation."],
  [
    "Blueprint",
    "A fixed-price proposal in plain English: what gets built, what it costs, what you own. 50% at kickoff, 30% at a working demo, 20% at launch.",
  ],
  ["Build", "Weekly demos of the real thing running on real data. No mockups pretending to be progress."],
  [
    "Run and improve",
    "We stay on if you want us to. The optional monthly plan covers hosting, our admin, support and small changes, and we train your staff either way.",
  ],
];

function Price({ amount, note }) {
  return (
    <div className="flex items-baseline gap-2.5 flex-wrap">
      <span className="font-display text-[52px] leading-none">{amount}</span>
      <span className="text-sm text-muted">{note}</span>
    </div>
  );
}

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Klyvora",
    url: SITE_URL,
    description: "Websites, online booking, ecommerce, restaurant ordering and AI automation for independent businesses.",
    areaServed: { "@type": "City", name: "Charlotte" },
    address: { "@type": "PostalAddress", addressLocality: "Charlotte", addressRegion: "NC", addressCountry: "US" },
    priceRange: "$$",
    email: CONTACT.email,
    telephone: "+19193910982",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export default async function Home() {
  const catalog = await getCatalog();
  const getOffer = code => catalog.find(o => o.code === code);
  const offersFor = slug => catalog.filter(o => o.slug === slug && !o.addOnOf);
  const RESTAURANT_ADD_ONS = catalog.filter(o => o.addOnOf);
  const w1 = getOffer("W1");
  const wb = getOffer("WB");
  const rc = getOffer("RC");
  return (
    <>
      <JsonLd />
      <Loader />

      {/* HERO */}
      <header id="top" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-bg">
        <HeroBackdrop />
        <div className="relative z-[2] text-center px-4 sm:px-6 pt-[120px] pb-20 max-w-[960px] flex flex-col items-center">
          <div className="inline-flex items-center gap-2.5 eyebrow !tracking-[.32em] mb-[34px]">
            <StatusDot />
            <span>Klyvora — taking new projects in Charlotte</span>
          </div>
          <h1 className="display-1 m-0 mb-[26px] text-fg">Software that runs your business.</h1>
          <p className="text-[clamp(16px,2vw,20px)] text-muted-2 m-0 mb-5">
            We build <RotatingWord words={ROLES} /> for Charlotte&apos;s independent businesses.
          </p>
          <p className="text-[15px] leading-[1.7] text-muted-2 max-w-[520px] mx-auto m-0 mb-11">
            Real prices on every page, a working system in weeks, and you own your data, your customers and your Stripe account.
          </p>
          <div className="inline-flex gap-3.5 flex-wrap justify-center">
            <Button href="#pricing">See prices</Button>
            <Button href="/contact" variant="secondary">
              Start a project <span aria-hidden="true">↗</span>
            </Button>
          </div>
          <div className="mt-[72px] flex flex-col items-center gap-2.5">
            <span className="eyebrow">Scroll</span>
            <span aria-hidden="true" className="w-px h-10 bg-border relative overflow-hidden block">
              <span className="absolute left-0 top-0 w-px h-[40%] bg-gradient-to-b from-accent-light to-accent animate-scroll-down block" />
            </span>
          </div>
        </div>
      </header>

      <Marquee
        items={[
          "Building the future for small business",
          "Websites",
          "Booking",
          "Ecommerce",
          "Restaurant ordering and kiosks",
          "AI automation",
          "Custom web apps",
        ]}
      />

      {/* SERVICES */}
      <Section
        id="services"
        eyebrow="Services"
        title="Things we build"
        lede="Not page builders. Sites and systems shaped around how your business actually runs, built on software we wrote and reuse so the price stays reachable."
      >
        <div className="flex flex-wrap gap-[18px]">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="card-service flex-[1_1_340px] min-w-0 bg-surface border border-border rounded-card p-[30px] box-border flex flex-col gap-2.5 text-fg transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-border-2 hover:shadow-[0_18px_40px_rgba(78,133,191,calc(.12*var(--shadow-k)))]"
            >
              <ServiceIcon slug={s.slug} />
              <h3 className="text-[21px] font-medium mt-1.5 mb-0">{s.title}</h3>
              <p className="text-sm text-muted leading-[1.65] m-0">{s.body}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* PROCESS */}
      <Section
        id="process"
        eyebrow="Process"
        title="How it works"
        lede="No jargon, no surprise invoices. You always know what is being built, what it costs and when it goes live."
      >
        <ol className="list-none p-0 m-0 flex flex-wrap gap-[18px]">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex-[1_1_250px] min-w-0 border-t border-border pt-7 flex flex-col gap-2">
              <Eyebrow accent>{String(i + 1).padStart(2, "0")}</Eyebrow>
              <h3 className="text-xl font-medium m-0">{title}</h3>
              <p className="text-sm text-muted leading-[1.65] m-0">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* PRICING */}
      <Section
        id="pricing"
        eyebrow="Pricing"
        title="Honest numbers"
        lede="Setup once. The monthly plan is optional on everything except restaurants: hosting, our admin, support and small changes. Every proposal says exactly what is included."
      >
        <div className="flex flex-wrap gap-5 items-stretch">
          <Card className="flex-[1_1_320px] !rounded-card-lg !p-[34px] !gap-3.5">
            <Eyebrow>Starter website</Eyebrow>
            <Price amount={money(w1.setup)} note="setup" />
            <div className="text-sm text-muted-2">
              optional <strong className="text-fg font-medium">{money(w1.monthly)}/month</strong> hosting and admin
            </div>
            <p className="text-sm text-muted leading-[1.65] mt-1.5 mb-0">{w1.summary}</p>
            <DashList items={["Landing page or up to 5 pages", "Contact form, map, hours, reviews", "Your domain and content stay yours", "Add booking later: +$500, +$30/mo"]} />
            <Button href="/contact?offer=W1" variant="secondary" className="mt-auto w-full !px-6 !py-3.5">
              Start with a site
            </Button>
          </Card>

          <FeaturedCard className="flex-[1_1_320px]">
            <div className="flex justify-between items-center gap-2.5 flex-wrap">
              <Eyebrow>Website + booking</Eyebrow>
              <span className="text-[11px] text-bg bg-accent-light rounded-full px-2.5 py-1 font-medium">Most popular</span>
            </div>
            <Price amount={money(wb.setup)} note="setup" />
            <div className="text-sm text-muted-2">
              optional <strong className="text-fg font-medium">{money(wb.monthly)}/month</strong>
            </div>
            <p className="text-sm text-muted leading-[1.65] mt-1.5 mb-0">
              For barbers, salons, detailers, trainers and anyone booking by DM or on a marketplace that charges them.
            </p>
            <DashList
              items={[
                "Starter site plus online booking",
                "Deposits through your own Stripe",
                "Text and email reminders",
                "Already have a good site? Booking only: $799 / $79",
              ]}
            />
            <Button href="/contact?offer=WB" className="mt-auto w-full !px-6 !py-3.5">
              Get booking on my site
            </Button>
          </FeaturedCard>

          <Card className="flex-[1_1_320px] !rounded-card-lg !p-[34px] !gap-3.5">
            <Eyebrow>Restaurant platform</Eyebrow>
            <Price amount={money(rc.setup)} note="setup" />
            <div className="text-sm text-muted-2">
              then <strong className="text-fg font-medium">{money(rc.monthly)}/month</strong> · required
            </div>
            <p className="text-sm text-muted leading-[1.65] mt-1.5 mb-0">
              For counter-service and takeout spots living on delivery apps and phone orders.
            </p>
            <DashList
              items={[
                "Site, menu admin and online ordering",
                "Customer records, staff roles, reports",
                "Self-serve kiosk: +$299 and +$29/mo per device",
                "Kitchen, inventory, loyalty and app add-ons",
              ]}
            />
            <Button href="/contact?offer=RC" variant="secondary" className="mt-auto w-full !px-6 !py-3.5">
              Book a restaurant demo
            </Button>
          </Card>
        </div>

        <div className="mt-5 bg-[rgba(var(--surface-rgb),.5)] border border-border rounded-card-lg px-6 sm:px-[34px] py-7 flex flex-wrap gap-7 justify-between items-center">
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted-2">
            <span>
              <strong className="text-fg font-medium">Standard website</strong> $1,499 · $49/mo, full site
            </span>
            <span>
              <strong className="text-fg font-medium">Ecommerce store</strong> $999 · $99/mo
            </span>
            <span>
              <strong className="text-fg font-medium">AI automation</strong> $499 · $49/mo + usage
            </span>
            <span>
              <strong className="text-fg font-medium">Custom AI harness</strong> from $1,499
            </span>
            <span>
              <strong className="text-fg font-medium">Custom web app</strong> from $2,499
            </span>
          </div>
          <Link href="/pricing" className="text-sm text-accent-light inline-flex items-center gap-1.5 min-h-11 hover:text-fg">
            Full price list <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="text-[13px] text-muted-2 leading-[1.6] mt-[18px] mb-0">
          Monthly plans are optional except for restaurants. Hardware, onsite installation, payment processing and AI or messaging usage are billed separately. Founding prices on custom work for the first few clients.
        </p>
      </Section>

      {/* OWNERSHIP */}
      <section aria-labelledby="own-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site border border-border rounded-tile px-6 sm:px-11 py-[54px] box-border bg-[radial-gradient(90%_120%_at_80%_8%,rgba(137,170,204,.22),transparent_55%),radial-gradient(70%_90%_at_12%_88%,rgba(78,133,191,.18),transparent_60%),var(--bg-deep)] flex flex-wrap gap-10 items-center justify-between">
          <div className="flex-[1_1_420px] min-w-0">
            <Eyebrow accent className="mb-[18px]">
              Our promise
            </Eyebrow>
            <h2 id="own-h" className="display-2 m-0 mb-3.5">
              You own it.
            </h2>
            <p className="text-[15px] leading-[1.7] text-muted-2 max-w-[520px] m-0">
              Your domain, your content, your customer list, your data and your Stripe account are yours from day one. The site we build and its code are yours on final payment; if your site uses one of our templates, that template is licensed rather than sold. If you ever leave, you get a full export.
            </p>
          </div>
          <ul className="flex-[1_1_320px] min-w-0 list-none p-0 m-0 flex flex-col gap-3.5 text-sm text-fg">
            {[
              "No per-order commissions, ever",
              "Checkout through your own Stripe account",
              "Your site and its code are yours at final payment",
              "Cancel any time and keep everything",
            ].map((t) => (
              <li key={t} className="flex gap-3 items-center">
                <CheckIcon />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WORK */}
      <section id="work" aria-labelledby="work-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site">
          <Eyebrow className="mb-[18px]">Selected work</Eyebrow>
          <div className="flex flex-wrap justify-between items-end gap-4 mb-12">
            <h2 id="work-h" className="display-2 m-0">
              First launches
            </h2>
            <Link href="/work" className="text-sm text-accent-light min-h-11 inline-flex items-center hover:text-fg">
              See our work →
            </Link>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link
              href="/work"
              className="card-work flex-[7_1_520px] min-w-0 relative border border-border rounded-tile overflow-hidden min-h-[360px] bg-[radial-gradient(90%_120%_at_80%_8%,rgba(137,170,204,.38),transparent_55%),radial-gradient(70%_90%_at_12%_88%,rgba(78,133,191,.3),transparent_60%),var(--bg-deep)] flex flex-col justify-end p-[30px] box-border text-fg transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="eyebrow mb-2">Restaurant pilot</span>
              <span className="text-2xl font-medium">[Client name] — ordering and kiosk</span>
              <span className="text-sm text-muted-2 mt-1.5">Case study coming after launch</span>
            </Link>
            <Link
              href="/work"
              className="card-work flex-[5_1_360px] min-w-0 relative border border-border rounded-tile overflow-hidden min-h-[360px] bg-[conic-gradient(from_210deg_at_70%_65%,rgba(78,133,191,.32),var(--bg-deep)_42%),var(--bg-deep)] flex flex-col justify-end p-[30px] box-border text-fg transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="eyebrow mb-2">Website + booking</span>
              <span className="text-2xl font-medium">[Client name] — site and booking</span>
              <span className="text-sm text-muted-2 mt-1.5">Case study coming after launch</span>
            </Link>
          </div>
        </div>
      </section>

      <Playground />

      {/* TOOLS */}
      <section id="tools" aria-labelledby="tools-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site">
          <Eyebrow className="mb-[18px]">Two minutes, no call</Eyebrow>
          <h2 id="tools-h" className="display-2 m-0 mb-9">
            Find out where you stand
          </h2>
          <div className="flex flex-wrap gap-5">
            {[
              {
                href: "/check",
                eyebrow: "Check my site",
                title: "Is your site dead, slow or not mobile-friendly?",
                body: "Paste your address. We check whether it loads, redirects, works on a phone and takes bookings, then email you the report.",
                cta: "Run the check",
              },
              {
                href: "/quote",
                eyebrow: "Instant estimate",
                title: "Pick an offer, add what you need, see the number.",
                body: "Five steps, real prices from this page, emailed to you. No sales call unless you want one.",
                cta: "Build my estimate",
              },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="card-tool flex-[1_1_400px] min-w-0 bg-surface border border-border rounded-card-lg p-8 box-border flex flex-col gap-3 text-fg transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(78,133,191,calc(.12*var(--shadow-k)))]"
              >
                <Eyebrow accent as="span">
                  {t.eyebrow}
                </Eyebrow>
                <span className="font-display italic text-[30px] leading-[1.1]">{t.title}</span>
                <span className="text-sm leading-[1.65] text-muted-2">{t.body}</span>
                <span className="inline-flex items-center gap-2 text-sm text-accent-light mt-1.5 min-h-11">
                  {t.cta} <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDING */}
      <section aria-labelledby="founding-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site bg-surface border border-border rounded-card-lg p-7 sm:p-11 box-border flex flex-wrap gap-8 items-center justify-between">
          <div className="flex-[1_1_480px] min-w-0">
            <Eyebrow className="mb-3.5">Founding customers</Eyebrow>
            <h2 id="founding-h" className="font-display font-normal text-[34px] leading-[1.1] m-0 mb-3">
              A few reduced-setup slots each quarter.
            </h2>
            <p className="text-sm text-muted-2 leading-[1.65] m-0">
              For first-time-online businesses in Charlotte. In exchange we ask for a case study and a referral or two. [SLOTS LEFT] left this quarter.
            </p>
          </div>
          <Button href="/founding">Apply for a slot</Button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site flex flex-wrap gap-x-16 gap-y-10 items-start">
          <div className="flex-[1_1_320px] min-w-0">
            <Eyebrow className="mb-[18px]">Questions</Eyebrow>
            <h2 id="faq-h" className="display-2 m-0 mb-3.5">
              The six we get most
            </h2>
            <p className="text-[15px] leading-[1.7] text-muted-2 m-0">
              Everything else is on the{" "}
              <Link href="/pricing" className="text-accent-light hover:text-fg">
                pricing page
              </Link>
              , or ask below.
            </p>
          </div>
          <div className="flex-[2_1_520px] min-w-0">
            <Faq items={HOME_FAQ} />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" aria-labelledby="contact-h" className="px-4 sm:px-6 pt-[110px] pb-20">
        <div className="container-site flex flex-wrap gap-12">
          <div className="flex-[1_1_380px] min-w-0">
            <Eyebrow className="mb-[18px]">Contact</Eyebrow>
            <h2 id="contact-h" className="display-2 italic m-0 mb-3.5">
              Let&apos;s build yours.
            </h2>
            <p className="text-[15px] leading-[1.7] text-muted-2 max-w-[440px] m-0 mb-7">
              Tell us what is eating your time. We reply within a day with a straight answer, even if the answer is &quot;you don&apos;t need custom software.&quot;
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-muted-2">
              <span>{CONTACT.city}</span>
              <a href={CONTACT.emailHref} className="text-accent-light min-h-11 inline-flex items-center hover:text-fg self-start">
                {CONTACT.email}
              </a>
              <a href={CONTACT.phoneHref} className="text-accent-light min-h-11 inline-flex items-center hover:text-fg self-start">
                {CONTACT.phone}
              </a>
            </div>
          </div>
          <LeadForm source="home" />
        </div>
      </section>
    </>
  );
}
