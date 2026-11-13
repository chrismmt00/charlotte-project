import { getCatalog } from "@/lib/server/catalog";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Section, { Eyebrow, PageHeader } from "@/components/ui/Section";
import Faq from "@/components/ui/Faq";
import { CheckIcon } from "@/components/ui/Bits";
import { MILESTONES, RESTAURANT_ADD_ONS, SERVICE_GROUPS, getOffer, money, offersFor } from "@/lib/offers";

export const metadata = {
  title: "Pricing",
  description:
    "Every Klyvora price on one page: setup and optional monthly for websites, booking, ecommerce, restaurants, AI and custom apps, plus add-ons and what's billed separately.",
  alternates: { canonical: "/pricing" },
};

const LINKS = {
  websites: "Website details",
  booking: "Booking details",
  ecommerce: "Ecommerce details",
  restaurants: "Restaurant details",
  ai: "AI details",
  custom: "Custom app details",
};

const SEPARATE = [
  ["Hardware", "Kiosks, tablets, printers. Paid in full before we order."],
  ["Onsite installation and travel", "When a setup needs us in the building."],
  ["Payment processing", "Billed by Stripe, on your own account."],
  ["Delivery services", "Couriers and shipping, billed by the provider."],
  ["Third-party subscriptions", "Tools you choose to add, at their own price."],
  ["AI and messaging usage", "Texts sent and AI processed, billed monthly."],
];

const MS_NOTES = [
  "Work starts once the first invoice is paid.",
  "You see the real thing running before you pay more.",
  "You sign off on the launch. If you took the monthly plan, it starts here.",
];
const MS_LABELS = ["At kickoff", "At a working demo", "At acceptance"];

const OWNERSHIP_FAQ = [
  ["Who owns my domain, content and customer list?", "You do, from day one. That includes your branding, your data and your Stripe account."],
  [
    "Do I own the code?",
    "Yes. The site, its code and its data are yours on final payment. The one exception is our templates: if your site uses one, that template is licensed to you rather than sold. Everything built or added for you is still yours.",
  ],
  [
    "What happens if I cancel?",
    "You keep everything: domain, branding, content, data, customer list and the code of anything built for you, with a full export. If your site uses one of our templates, the license continues.",
  ],
  ["Do you take a cut of my sales?", "No. Checkout runs through your own Stripe account. We charge setup and a flat monthly plan, never a per-order commission."],
  [
    "What does the monthly plan pay for?",
    "Hosting, our admin to edit your site, support from a local person and small changes, each capped in your proposal. It is optional on everything except restaurants, and starts when you accept the launch.",
  ],
  [
    "Why is the monthly required for restaurants?",
    "Ordering, kiosks and kitchen screens need someone watching them every day. That daily care is the monthly, so it is part of every restaurant plan.",
  ],
  ["What if I need something that isn't listed?", "Tell us. Substantial new functionality gets its own fixed quote before any work starts."],
];

function cents(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PricingPage() {
  const catalog = await getCatalog();
  const getOffer = code => catalog.find(o => o.code === code);
  const offersFor = slug => catalog.filter(o => o.slug === slug && !o.addOnOf);
  const RESTAURANT_ADD_ONS = catalog.filter(o => o.addOnOf);
  const wb = getOffer("WB");
  const split = MILESTONES.map((m) => (wb.setup * m.percent) / 100);
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Every price, on the page."
        lede="Setup once. The monthly plan is optional on everything except restaurants: it covers hosting, our admin, support and small changes, or you take the code and run it yourself. No “contact us for pricing.”"
      >
        <ul className="list-none p-0 m-0 mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm text-fg">
          {["No per-order commissions", "Your data and your Stripe account", "Setup paid 50 / 30 / 20"].map((t) => (
            <li key={t} className="flex items-center gap-2.5">
              <CheckIcon size={18} />
              {t}
            </li>
          ))}
        </ul>
      </PageHeader>

      <section aria-labelledby="menu-h" className="px-4 sm:px-6 pt-20 pb-10">
        <div className="container-site">
          <div className="flex flex-wrap justify-between items-baseline gap-3 mb-8">
            <h2 id="menu-h" className="display-2 m-0">
              The full menu
            </h2>
            <span className="text-[13px] text-muted-2">All prices in US dollars.</span>
          </div>
          <div className="flex flex-col gap-10">
            {SERVICE_GROUPS.map((g) => (
              <div key={g.slug}>
                <div className="flex flex-wrap justify-between items-baseline gap-3 border-b border-border pb-3">
                  <h3 className="text-lg font-medium m-0">{g.name}</h3>
                  <Link href={`/services/${g.slug}`} className="text-sm text-accent-light min-h-11 inline-flex items-center hover:text-fg">
                    {LINKS[g.slug]} →
                  </Link>
                </div>
                <ul className="list-none p-0 m-0">
                  {offersFor(g.slug).map((o) => (
                    <li
                      key={o.code}
                      id={`offer-${o.code.toLowerCase()}`}
                      className="scroll-mt-[110px] border-b border-border py-5 px-3 -mx-3 rounded-input flex flex-wrap items-center gap-x-8 gap-y-3 target:bg-[rgba(78,133,191,.1)] target:outline target:outline-1 target:outline-accent-light"
                    >
                      <span className="flex-[2_1_300px] min-w-0 flex flex-col gap-1">
                        <span className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[11px] tracking-[.2em] text-muted-2 border border-border-2 rounded-full px-2.5 py-1">
                            {o.code === "AH" || o.code === "CA" ? "Custom" : o.code}
                          </span>
                          <span className="text-[17px] font-medium">{o.name}</span>
                          {o.featured ? (
                            <span className="text-[11px] text-bg bg-accent-light rounded-full px-2.5 py-1 font-medium">Most popular</span>
                          ) : null}
                          {o.setupFrom ? (
                            <span className="text-[11px] text-muted-2 border border-border-2 rounded-full px-2.5 py-1">Founding price</span>
                          ) : null}
                        </span>
                        <span className="text-sm text-muted">{o.bestFor}</span>
                      </span>
                      <span className="flex-[1_1_120px] min-w-0 flex flex-col">
                        <span className="text-xs text-muted-2">Setup</span>
                        <span className="text-[17px]">
                          {o.setupFrom ? "from " : ""}
                          {money(o.setup)}
                        </span>
                      </span>
                      <span className="flex-[1_1_160px] min-w-0 flex flex-col">
                        <span className="text-xs text-muted-2">Monthly</span>
                        <span className="text-[17px]">
                          {money(o.monthly)}
                          <span className="text-sm text-muted-2">
                            {o.usage ? " + usage" : ""} · {o.monthlyRequired ? "required" : "optional"}
                          </span>
                        </span>
                      </span>
                      <Link
                        href={`/contact?offer=${o.code}`}
                        aria-label={`Get a quote for ${o.name}`}
                        className="text-sm text-fg border border-border-2 rounded-full px-[18px] min-h-11 inline-flex items-center gap-1.5 hover:bg-fg hover:text-bg hover:border-fg transition-colors duration-200"
                      >
                        Get a quote <span aria-hidden="true">↗</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Pricing rules" className="px-4 sm:px-6 pt-16 pb-10">
        <div className="container-site flex flex-wrap gap-5">
          <div className="flex-[1_1_420px] min-w-0 bg-surface border border-border rounded-card-lg p-8 flex flex-col gap-3">
            <h3 className="text-xl font-medium m-0">Adding booking later</h3>
            <p className="text-sm leading-[1.7] text-muted-2 m-0">
              Booking on a site we built is <strong className="text-fg font-medium">+$500 setup and +$30/month</strong>. That&apos;s how Website + Booking is a Starter Website plus booking. A Standard Website client adding booking pays +$500 and moves to $79/month. The Booking add-on is only for owners keeping a site someone else built.
            </p>
          </div>
          <div className="flex-[1_1_420px] min-w-0 bg-surface border border-border rounded-card-lg p-8 flex flex-col gap-3">
            <h3 className="text-xl font-medium m-0">Kiosks</h3>
            <p className="text-sm leading-[1.7] text-muted-2 m-0">
              Restaurant core + 1 kiosk is Restaurant core ($1,499, $149/month) plus one kiosk ($299, $29/month). Each extra kiosk is{" "}
              <strong className="text-fg font-medium">another $299 setup and $29/month</strong>. Kiosk hardware is billed separately and paid in full before we order it.
            </p>
          </div>
        </div>
      </section>

      <Section
        id="restaurant-add-ons"
        eyebrow="Restaurants"
        title="Add-on modules"
        lede="Add any of these to Restaurant core. Mobile-friendly web ordering is already included. The branded app price assumes our shared mobile foundation; ask us about timing."
      >
        <div className="overflow-x-auto border border-border rounded-card" tabIndex={0} role="region" aria-label="Restaurant add-on prices">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <caption className="sr-only">Restaurant add-on prices</caption>
            <thead>
              <tr className="text-left">
                <th scope="col" className="p-4 font-medium">Add-on</th>
                <th scope="col" className="p-4 font-medium">Setup</th>
                <th scope="col" className="p-4 font-medium">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {RESTAURANT_ADD_ONS.map((a) => (
                <tr key={a.code} className="border-t border-border">
                  <td className="p-4 text-fg">{a.name}</td>
                  <td className="p-4 text-muted-2">
                    {a.setupFrom ? "from " : ""}
                    {money(a.setup)}
                    {a.setupNote ? ` ${a.setupNote}` : ""}
                  </td>
                  <td className="p-4 text-muted-2">
                    {money(a.monthly)}
                    {a.monthlyNote ? ` ${a.monthlyNote}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        id="billed-separately"
        eyebrow="Not in the price"
        title="Billed separately"
        lede="These cost what they cost, and we say so up front. Every proposal also caps pages, design rounds, integrations, hosting, support hours and minor changes. Substantial new features get their own quote."
      >
        <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {SEPARATE.map(([t, d]) => (
            <li key={t} className="border-t border-border pt-6 flex flex-col gap-1.5">
              <span className="text-[17px] font-medium">{t}</span>
              <span className="text-sm text-muted leading-[1.6]">{d}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="milestones"
        eyebrow="How you pay"
        title="Paid as it gets built"
        lede="Setup is split across three milestones, so you never pay for work you haven't seen."
      >
        <ol className="list-none p-0 m-0 flex flex-wrap gap-[18px]">
          {MILESTONES.map((m, i) => (
            <li key={m.percent} className="flex-[1_1_250px] min-w-0 bg-surface border border-border rounded-card p-7 flex flex-col gap-2">
              <span className="font-display text-[52px] leading-none">{m.percent}%</span>
              <span className="text-[17px] font-medium">{MS_LABELS[i]}</span>
              <span className="text-sm text-muted leading-[1.6]">{MS_NOTES[i]}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col gap-2 text-sm text-muted-2 leading-[1.7]">
          <p className="m-0">
            <strong className="text-fg font-medium">Example, Website + Booking at {money(wb.setup)}:</strong> {cents(split[0])} at kickoff,{" "}
            {cents(split[1])} at the demo and {cents(split[2])} at acceptance, then {money(wb.monthly)}/month from launch if you take the monthly plan.
          </p>
          <p className="m-0">
            <strong className="text-fg font-medium">Hardware:</strong> 100% up front, before we order it.
          </p>
        </div>
      </Section>

      <section aria-labelledby="founding-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site bg-surface border border-border rounded-card-lg p-7 sm:p-11 flex flex-wrap gap-8 items-center justify-between">
          <div className="flex-[1_1_480px] min-w-0">
            <Eyebrow className="mb-3.5">Founding prices</Eyebrow>
            <h2 id="founding-h" className="font-display font-normal text-[34px] leading-[1.1] m-0 mb-3">
              Custom work costs less for our first few clients.
            </h2>
            <p className="text-sm text-muted-2 leading-[1.65] m-0">
              Custom AI harnesses start at $1,499 and custom web apps at $2,499 for now. After our first few clients they move to $2,499 and $3,499. Separately, a few reduced-setup slots open each quarter for first-time-online businesses.
            </p>
          </div>
          <Link href="/founding" className="text-sm text-accent-light min-h-11 inline-flex items-center hover:text-fg">
            Founding customer program →
          </Link>
        </div>
      </section>

      <section aria-labelledby="faq-h" className="px-4 sm:px-6 pt-[110px] pb-10">
        <div className="container-site flex flex-wrap gap-x-16 gap-y-10 items-start">
          <div className="flex-[1_1_320px] min-w-0">
            <Eyebrow className="mb-[18px]">Ownership</Eyebrow>
            <h2 id="faq-h" className="display-2 m-0 mb-3.5">
              Who owns what
            </h2>
            <p className="text-[15px] leading-[1.7] text-muted-2 m-0">
              The short version: your business stays yours. The long version is in every proposal.
            </p>
          </div>
          <div className="flex-[2_1_520px] min-w-0">
            <Faq items={OWNERSHIP_FAQ.map(([q, a]) => ({ q, a }))} />
          </div>
        </div>
      </section>

      <section aria-labelledby="cta-h" className="px-4 sm:px-6 pt-[110px] pb-20">
        <div className="container-site text-center flex flex-col items-center gap-4">
          <h2 id="cta-h" className="display-2 italic m-0">
            Not sure which line is you?
          </h2>
          <p className="text-[15px] leading-[1.7] text-muted-2 max-w-[560px] m-0">
            Pick an offer and add what you need; the estimator shows the number and emails it to you. Or tell us what&apos;s eating your time and we&apos;ll point you at the right line.
          </p>
          <div className="flex flex-wrap gap-3.5 justify-center mt-4">
            <Button href="/quote">
              Build an estimate <span aria-hidden="true">→</span>
            </Button>
            <Button href="/contact" variant="secondary">
              Ask us
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
