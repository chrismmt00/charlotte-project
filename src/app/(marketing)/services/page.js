import { getCatalog } from "@/lib/server/catalog";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Section, { Eyebrow, PageHeader } from "@/components/ui/Section";
import { ServiceIcon } from "@/components/ui/Bits";
import OfferCard, { DemoLink } from "@/components/offers/OfferCard";
import { getOffer, money } from "@/lib/offers";

export const metadata = {
  title: "Services",
  description:
    "Websites, online booking, ecommerce, restaurant ordering and kiosks, AI automation and custom web apps, each with its setup price on the page.",
  alternates: { canonical: "/services" },
};

const BLURB = {
  W1: "A landing page or a few pages: what you do, hours, where you are, how to reach you. No booking or payments. For a business that needs to be found, not a full site.",
  W2: "A full site with more pages, more content and design rounds. For when the site has to sell what you do, not just say where you are.",
  WB: "For appointment businesses booking by DM or on a marketplace.",
  BK: "For a decent site someone else built, where booking still happens by call or DM.",
  EC: "For products sold by DM or Cash App, with no store yet.",
  RC: "Site, menu admin and online ordering, for spots on delivery apps only.",
  RK: "For counter service with lines. Each extra kiosk is $299 setup and $29/month.",
  AI: "For a business with a good site whose follow-ups are still manual.",
  AH: "One workflow run by an agent. Rises to $2,499 after our first few clients.",
  CA: "Fixed quote before we build. Rises to $3,499 after our first few clients.",
};

const GROUPS = [
  {
    slug: "websites",
    title: "Websites",
    body: "A fast, mobile-first site that answers what customers call to ask: hours, prices, where you are, how to reach you. Starter is a landing page or a few pages. Standard is a full site. Neither takes bookings or payments.",
    link: "Website details",
    codes: ["W1", "W2"],
    demo: ["Live demo · example layout", "A one-page site with hours, services, map and a contact form, resized for a phone."],
  },
  {
    slug: "booking",
    title: "Online booking",
    body: "Customers book and pay a deposit on your own site, not in your DMs or on a marketplace that charges you.",
    link: "Booking details",
    codes: ["WB", "BK"],
    demo: ["Live demo · booking flow", "Pick a service, a day and a time; see the deposit step. Takes no money."],
  },
  {
    slug: "ecommerce",
    title: "Ecommerce",
    body: "A small store for the products you sell by DM and Cash App today.",
    link: "Ecommerce details",
    codes: ["EC"],
    demo: ["Live demo · small store", "Products, cart and a Stripe test checkout."],
  },
  {
    slug: "restaurants",
    title: "Restaurant ordering and kiosks",
    body: "Your menu, online ordering and self-serve kiosks on one system, with staff roles and reporting.",
    link: "Restaurant details",
    codes: ["RC", "RK"],
    demo: ["Live demo · menu and ordering", "Browse a menu, build an order, see the kitchen view and the kiosk screen."],
  },
  {
    slug: "ai",
    title: "AI automation",
    body: "Missed-call text-back, review requests, intake and follow-ups, with guardrails and a human handoff.",
    link: "AI details",
    codes: ["AI", "AH"],
    demo: ["Live demo · missed-call text-back", "Type a message as a customer; watch the reply, the booking link and the handoff."],
  },
  {
    slug: "custom",
    title: "Custom web apps",
    body: "One focused workflow with login, roles and a dashboard, for the job you run on spreadsheets and group texts.",
    link: "Custom app details",
    codes: ["CA"],
    demo: ["Live demo · admin dashboard", "A login, a role, a dashboard. The shape every custom app starts from."],
  },
];

const COMPARE = [
  ["What it is", "Landing page or a few pages", "Full site, more content", "Starter site + booking system", "Store on our platform"],
  ["Pages", "Up to 5", "[PAGE CAP]", "Up to 5 + booking", "Products, cart, checkout"],
  ["Takes appointments and deposits", "No", "No", "Yes", "No"],
  ["Sells products with checkout", "No", "No", "No", "Yes"],
  ["Setup", "$499", "$1,499", "$999", "$999"],
  ["Monthly, optional", "$49", "$49", "$79", "$99"],
];

const PROBLEMS = [
  ["We don't have a website, or it's just Instagram.", "W1", "websites"],
  ["Our site is old, broken, or sends people somewhere strange.", "W2", "websites"],
  ["Clients book in my DMs, and some of them don't show.", "WB", "booking"],
  ["We sell by DM and Cash App, and it's a mess.", "EC", "ecommerce"],
  ["The delivery apps take a cut of every order.", "RC", "restaurants"],
  ["Missed calls and follow-ups fall through the cracks.", "AI", "ai"],
];

const MONTHLY = [
  ["Hosting and our admin", "Your site stays up and loads fast, and you change hours, prices and photos yourself in our admin."],
  ["Support", "A local person answers. Support hours are capped per plan and written in your proposal."],
  ["Small changes", "New hours, new photos, a price change. How many per month is in your proposal."],
  [
    "Restaurants: required",
    "Ordering, kiosks and kitchen screens need someone watching them every day, so restaurant plans include the monthly.",
  ],
];

function priceLine(o) {
  const m = `${money(o.monthly)}/month${o.usage ? " + usage" : ""}`;
  return `${money(o.setup)} · ${o.monthlyRequired ? `${m} required` : `optional ${m}`}`;
}

function Extra({ slug }) {
  if (slug === "websites") {
    return (
      <div className="flex-[1_1_100%] min-w-0 flex flex-col gap-4">
        <div>
          <h3 className="text-[17px] font-medium m-0 mb-1.5">Which one do I need?</h3>
          <p className="text-sm leading-[1.6] text-muted-2 m-0 max-w-[640px]">
            A website tells customers what you do and how to reach you. It does not take appointments or payments. Those are separate systems, priced on their own.
          </p>
        </div>
        <div className="overflow-x-auto border border-border rounded-card" tabIndex={0} role="region" aria-label="Website offers compared">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">How the website offers differ</caption>
            <thead>
              <tr className="text-left">
                <th scope="col" className="p-4 font-medium text-muted-2">
                  <span className="sr-only">Feature</span>
                </th>
                {["Starter", "Standard", "Website + Booking", "Ecommerce"].map((h) => (
                  <th key={h} scope="col" className="p-4 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, ...cells]) => (
                <tr key={label} className="border-t border-border">
                  <th scope="row" className="p-4 text-left font-normal text-muted-2">
                    {label}
                  </th>
                  {cells.map((c, i) => (
                    <td key={i} className="p-4 text-fg">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  if (slug === "ecommerce") {
    return (
      <div className="flex-[1_1_260px] min-w-0 border border-border rounded-card p-7 box-border flex flex-col gap-2 bg-[rgba(var(--surface-rgb),.5)]">
        <span className="font-display text-[44px] leading-none">$0</span>
        <span className="text-sm text-fg">per order, from us</span>
        <span className="text-sm text-muted-2 leading-[1.6]">
          Checkout runs through your own Stripe account. Stripe bills its own processing fee.
        </span>
      </div>
    );
  }
  if (slug === "restaurants") {
    return (
      <p className="flex-[1_1_100%] text-sm text-muted-2 m-0">
        <strong className="text-fg font-medium">Add-ons:</strong> branded customer app, employee management, kitchen operations, basic inventory, loyalty and retention.{" "}
        <Link href="/pricing#restaurant-add-ons" className="text-accent-light hover:text-fg">
          Add-on prices →
        </Link>
      </p>
    );
  }
  if (slug === "custom") {
    return (
      <div className="flex-[1_1_260px] min-w-0 border border-border rounded-card p-7 box-border flex flex-col gap-2 bg-[rgba(var(--surface-rgb),.5)]">
        <span className="text-[17px] font-medium">The custom code is yours.</span>
        <span className="text-sm text-muted-2 leading-[1.6]">
          Everything we build for you, the site, its code and its data, is yours on final payment. If your site uses one of our templates, that template is licensed to you rather than sold.
        </span>
      </div>
    );
  }
  return null;
}

export default async function ServicesPage() {
  const catalog = await getCatalog();
  const getOffer = code => catalog.find(o => o.code === code);
  const offersFor = slug => catalog.filter(o => o.slug === slug && !o.addOnOf);
  const RESTAURANT_ADD_ONS = catalog.filter(o => o.addOnOf);
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Six things we build."
        lede="Websites, booking, online stores, restaurant ordering, AI automation and custom web apps for independent businesses. Each has its setup price on the page. The monthly plan is optional on everything but restaurants."
      >
        <div className="flex flex-wrap gap-3.5 mt-9">
          <Button href="/pricing">See all prices</Button>
          <Button href="/contact" variant="secondary">
            Get a quote <span aria-hidden="true">↗</span>
          </Button>
        </div>
      </PageHeader>

      <nav aria-label="Jump to a service" className="px-4 sm:px-6 mt-10">
        <div className="container-site flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <a
              key={g.slug}
              href={`#${g.slug}`}
              className="chip-jump text-[13px] text-muted-2 border border-border rounded-full px-4 py-2.5 min-h-11 box-border inline-flex items-center hover:text-fg hover:border-border-2"
            >
              {g.slug === "restaurants" ? "Restaurants" : g.title}
            </a>
          ))}
        </div>
      </nav>

      <section aria-label="All services" className="px-4 sm:px-6 pt-16 pb-10">
        <div className="container-site flex flex-col">
          {GROUPS.map((g, i) => (
            <div key={g.slug} id={g.slug} className="border-t border-border py-12 flex flex-wrap gap-x-12 gap-y-7 scroll-mt-[100px]">
              <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-3 items-start">
                <div className="flex items-center gap-3.5">
                  <ServiceIcon slug={g.slug} />
                  <Eyebrow accent as="span">
                    {String(i + 1).padStart(2, "0")}
                  </Eyebrow>
                </div>
                <h2 className="font-display font-normal text-[clamp(32px,4vw,44px)] leading-[1.05] tracking-[-.01em] m-0">{g.title}</h2>
                <p className="text-[15px] leading-[1.7] text-muted-2 m-0 max-w-[380px]">{g.body}</p>
                <Link href={`/services/${g.slug}`} className="text-sm text-accent-light inline-flex items-center gap-1.5 min-h-11 hover:text-fg">
                  {g.link} <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="flex-[2_1_560px] min-w-0 flex flex-wrap gap-[18px]">
                {g.codes.map((c) => (
                  <OfferCard key={c} offer={getOffer(c)} blurb={BLURB[c]} />
                ))}
                <Extra slug={g.slug} />
                <DemoLink href={`/services/${g.slug}#demo`} title={g.demo[0]} body={g.demo[1]} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <Section id="start" eyebrow="Not sure which?" title="Start from the problem." lede="Find the line that sounds like your week. That's usually the right place to start.">
        <div className="flex flex-col border-b border-border -mt-2">
          {PROBLEMS.map(([quote, code, slug]) => {
            const o = getOffer(code);
            return (
              <Link
                key={quote}
                href={`/services/${slug}`}
                className="flex flex-wrap items-center gap-x-8 gap-y-3 py-[26px] border-t border-border text-fg group"
              >
                <span className="flex-[2_1_340px] min-w-0 font-display italic text-[clamp(22px,2.4vw,30px)] leading-[1.25]">
                  &ldquo;{quote}&rdquo;
                </span>
                <span className="flex-[1_1_220px] min-w-0 flex flex-col gap-1">
                  <span className="text-[15px] font-medium">{o.name}</span>
                  <span className="text-sm text-muted-2">{priceLine(o)}</span>
                </span>
                <span aria-hidden="true" className="text-accent-light text-lg transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section
        id="monthly"
        eyebrow="The monthly plan"
        title="What the monthly covers"
        lede="Setup builds it. The monthly plan is optional on everything except restaurants. Pay it and we host the site, you edit it in our admin, and a person in Charlotte answers when you call. Skip it and you take the code and run it yourself."
      >
        <ul className="list-none p-0 m-0 flex flex-wrap gap-[18px]">
          {MONTHLY.map(([t, b]) => (
            <li key={t} className="flex-[1_1_250px] min-w-0 border-t border-border pt-7 flex flex-col gap-2">
              <h3 className="text-lg font-medium m-0">{t}</h3>
              <p className="text-sm text-muted leading-[1.65] m-0">{b}</p>
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-muted-2 leading-[1.6] mt-8 mb-0">
          Billed separately: hardware, onsite installation and travel, payment processing, delivery services, third-party subscriptions, and AI or messaging usage.{" "}
          <Link href="/pricing" className="text-accent-light hover:text-fg">
            See the full price list
          </Link>
          .
        </p>
      </Section>

      <section aria-labelledby="cta-h" className="px-4 sm:px-6 pt-[110px] pb-20">
        <div className="container-site text-center flex flex-col items-center gap-4">
          <h2 id="cta-h" className="display-2 italic m-0">
            Tell us what&apos;s eating your time.
          </h2>
          <p className="text-[15px] leading-[1.7] text-muted-2 max-w-[520px] m-0">
            We reply within a day with a straight answer, even if the answer is that you don&apos;t need custom software.
          </p>
          <div className="flex flex-wrap gap-3.5 justify-center mt-4">
            <Button href="/contact">Get a quote</Button>
            <Button href="/contact#call" variant="secondary">
              Book a free call
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
