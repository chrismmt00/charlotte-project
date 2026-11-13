import { Suspense } from "react";
import { Eyebrow } from "@/components/ui/Section";
import QuoteEstimator from "@/components/quote/QuoteEstimator";
import QuoteFromParams from "@/components/quote/QuoteFromParams";

export const metadata = {
  title: "Instant estimate",
  description:
    "Build an estimate from our real prices in five short steps: pick an offer, add what you need, see the setup and monthly totals with the 50/30/20 payment split, and we email it to you.",
  alternates: { canonical: "/quote" },
};

export default function QuotePage() {
  return (
    <>
      <header className="px-4 sm:px-6 pt-[150px] pb-6">
        <div className="max-w-[920px] mx-auto">
          <Eyebrow className="mb-5">Instant estimate</Eyebrow>
          <h1 className="font-display italic font-normal text-[clamp(44px,7vw,88px)] leading-[.95] tracking-[-.02em] m-0 mb-[18px]">
            See the number before you talk to anyone.
          </h1>
          <p className="text-base leading-[1.7] text-muted-2 max-w-[620px] m-0">
            Real prices from our menu, nothing invented. Five short steps; the estimate is emailed to you and a copy lands with us so we
            can pick up where you left off.
          </p>
        </div>
      </header>

      <section aria-label="Estimator" className="px-4 sm:px-6 pt-4 pb-[110px]">
        <div className="max-w-[920px] mx-auto">
          {/* The fallback is the estimator with the default offer, so the static shell is usable before ?offer= is read. */}
          <Suspense fallback={<QuoteEstimator />}>
            <QuoteFromParams />
          </Suspense>
        </div>
      </section>
    </>
  );
}
