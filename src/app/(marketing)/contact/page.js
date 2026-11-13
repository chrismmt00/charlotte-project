import { Suspense } from "react";
import { Eyebrow } from "@/components/ui/Section";
import LeadForm from "@/components/site/LeadForm";
import ContactForm from "@/components/site/ContactForm";
import { CONTACT } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description: "Tell us what's eating your time. A person in Charlotte replies within a day with a straight answer and, if it fits, a fixed-price proposal.",
  alternates: { canonical: "/contact" },
};

const NEXT = [
  ["We reply within a day", "A real reply from one of us, not an autoresponder."],
  ["A free 30-minute call", "You talk, we map where hours and money are leaking out of your week."],
  ["A fixed-price proposal", "Plain English: what gets built, what it costs, what you own. Nothing starts until you say yes."],
];

function Icon({ d }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-accent-light flex-none">
      {d}
    </svg>
  );
}

export default function ContactPage() {
  return (
    <>
      <section className="px-4 sm:px-6 pt-[150px] pb-10">
        <div className="container-site flex flex-wrap gap-12 items-start">
          <div className="flex-[1_1_380px] min-w-0 flex flex-col">
            <Eyebrow className="mb-6">Contact</Eyebrow>
            <h1 className="display-page m-0 mb-6">Let&apos;s build yours.</h1>
            <p className="text-[15px] leading-[1.7] text-muted-2 max-w-[460px] m-0 mb-8">
              Tell us what&apos;s eating your time. We reply within a day with a straight answer, even if the answer is &ldquo;you don&apos;t need custom software.&rdquo;
            </p>
            <ul className="list-none p-0 m-0 flex flex-col gap-1 text-sm text-muted-2">
              <li className="flex items-center gap-3 min-h-11">
                <Icon d={<><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>} />
                {CONTACT.city}
              </li>
              <li className="flex items-center gap-3 min-h-11">
                <Icon d={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>} />
                <a href={CONTACT.emailHref} className="text-accent-light hover:text-fg">
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-center gap-3 min-h-11">
                <Icon d={<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />} />
                {CONTACT.phoneHref ? (
                  <a href={CONTACT.phoneHref} className="text-accent-light hover:text-fg">
                    {CONTACT.phone}
                  </a>
                ) : (
                  <span>{CONTACT.phone}</span>
                )}
              </li>
              <li className="flex items-center gap-3 min-h-11">
                <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />
                [Business hours]
              </li>
            </ul>

            <div id="call" className="mt-12 scroll-mt-[110px] border-t border-border pt-8">
              <Eyebrow className="mb-3">Prefer to talk?</Eyebrow>
              <h2 className="font-display font-normal text-[34px] leading-[1.1] m-0 mb-2.5">Book a free 30-minute call.</h2>
              <p className="text-sm text-muted-2 leading-[1.65] m-0 mb-5">You talk, we map where hours and money are leaking out. No slides.</p>
              <div className="border border-dashed border-border-2 rounded-card p-6 flex gap-3 items-start text-sm text-muted-2 leading-[1.6]">
                <span className="text-[11px] tracking-[.2em] uppercase text-muted-2 border border-border-2 rounded-full px-2.5 py-1 flex-none">Embed</span>
                <span>
                  [Calendar embed: Cal.com or Calendly] · 30-minute slots. Until it&apos;s connected,{" "}
                  <a href={`${CONTACT.emailHref}?subject=Book%20a%20call`} className="text-accent-light hover:text-fg">
                    book by email
                  </a>
                  .
                </span>
              </div>
            </div>
          </div>

          <div id="form" className="flex-[1_1_480px] min-w-0 scroll-mt-[110px] bg-surface border border-border rounded-tile p-6 sm:p-9 flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-medium m-0 mb-1">Get a quote</h2>
              <p className="text-[13px] text-muted-2 m-0">Fields marked * are required.</p>
            </div>
            <Suspense fallback={<LeadForm source="contact" showOffer showSiteUrl />}>
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </section>

      <section aria-labelledby="next-h" className="px-4 sm:px-6 pt-20 pb-20">
        <div className="container-site">
          <Eyebrow className="mb-[18px]">After you send it</Eyebrow>
          <h2 id="next-h" className="display-2 m-0 mb-10">
            What happens next
          </h2>
          <ol className="list-none p-0 m-0 flex flex-wrap gap-[18px]">
            {NEXT.map(([t, d], i) => (
              <li key={t} className="flex-[1_1_280px] min-w-0 border-t border-border pt-7 flex flex-col gap-2">
                <Eyebrow accent>{String(i + 1).padStart(2, "0")}</Eyebrow>
                <h3 className="text-xl font-medium m-0">{t}</h3>
                <p className="text-sm text-muted leading-[1.65] m-0">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
