import { Eyebrow } from "@/components/ui/Section";
import SiteCheck from "@/components/check/SiteCheck";

export const metadata = {
  title: "Check my site",
  description:
    "Paste your website address and get a plain-English report in seconds: does it load, where does it redirect, how fast is it, does it work on a phone, and can customers book or order online.",
  alternates: { canonical: "/check" },
};

export default function CheckPage() {
  return (
    <>
      <header className="px-4 sm:px-6 pt-[150px] pb-6">
        <div className="max-w-[920px] mx-auto">
          <Eyebrow className="mb-5">Check my site</Eyebrow>
          <h1 className="font-display italic font-normal text-[clamp(44px,7vw,88px)] leading-[.95] tracking-[-.02em] m-0 mb-[18px]">
            Is your website doing its job?
          </h1>
          <p className="text-base leading-[1.7] text-muted-2 max-w-[620px] m-0">
            Paste your address. In about ten seconds we check whether it loads, where it redirects, how fast it is, whether it works on a
            phone and whether anyone can book or order. Public information only, nothing stored until you ask for the report.
          </p>
        </div>
      </header>

      <section aria-label="Site check" className="px-4 sm:px-6 pt-4 pb-[110px]">
        <div className="max-w-[920px] mx-auto flex flex-col gap-5">
          <SiteCheck />
          <p className="m-0 text-[13px] text-muted-2 text-center leading-relaxed">
            How it works: our server fetches the address, follows up to 5 redirects, times the page, reads the viewport tag, and looks for
            booking or ordering links and a tappable phone number. Nothing is stored unless you ask for the report.
          </p>
        </div>
      </section>
    </>
  );
}
