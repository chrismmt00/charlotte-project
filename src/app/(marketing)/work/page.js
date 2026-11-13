import Link from "next/link";
import { Eyebrow } from "@/components/ui/Section";
import WorkList from "@/components/site/WorkList";
import { CASES, SERVICE_FILTERS } from "@/lib/cases";

export const metadata = {
  title: "Work",
  description:
    "Klyvora case studies: the problem, what we built and the result in the owner’s own numbers. Our first launches are in progress; case studies follow each launch.",
  alternates: { canonical: "/work" },
};

const PARTS = [
  ["The problem", "What was costing the owner time or money before."],
  ["What we built", "The offer used, with real screenshots."],
  ["The result", "Measured in the owner’s numbers, before and after."],
  ["In their words", "A quote from the owner, not from us."],
];

// Shown while CASES is empty. "[Client name]" stays until each owner agrees to be named.
const IN_PROGRESS = [
  {
    kind: "Restaurant pilot",
    title: "[Client name] — ordering and kiosk",
    cls: "flex-[7_1_520px] bg-[radial-gradient(90%_120%_at_80%_8%,rgba(137,170,204,.3),transparent_55%),radial-gradient(70%_90%_at_12%_88%,rgba(78,133,191,.24),transparent_60%),var(--bg-deep)]",
  },
  {
    kind: "Website + booking",
    title: "[Client name] — site and booking",
    cls: "flex-[5_1_360px] bg-[conic-gradient(from_210deg_at_70%_65%,rgba(78,133,191,.28),var(--bg-deep)_42%),var(--bg-deep)]",
  },
];

export default function WorkPage() {
  const populated = CASES.length > 0;
  return (
    <>
      {/* HERO */}
      <header className="relative px-4 sm:px-6 pt-[168px] pb-14 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(55%_80%_at_70%_0%,rgba(78,133,191,.22),transparent_70%)]" />
        <div className="relative container-site">
          <Eyebrow className="mb-[26px]">Work</Eyebrow>
          <h1 className="display-page m-0 mb-[26px] max-w-[900px]">{populated ? "Work that paid for itself." : "Case studies are coming."}</h1>
          <p className="text-[15px] sm:text-[17px] leading-[1.7] text-muted-2 max-w-[600px] m-0">
            {populated
              ? "Each case study shows the problem, what we built and the result in the owner’s own numbers."
              : "Our first launches are in progress. Each case study will show the problem, what we built and the result in the owner’s own numbers. Until then, we’d rather show nothing than show mockups dressed up as client work."}
          </p>
        </div>
      </header>

      {populated ? (
        <section aria-label="Case studies" className="section-work-list px-4 sm:px-6 pt-6 pb-10">
          <div className="container-site">
            <WorkList cases={CASES} filters={SERVICE_FILTERS} />
          </div>
        </section>
      ) : (
        <section aria-label="Launches in progress" className="px-4 sm:px-6 pt-6 pb-10">
          <div className="container-site flex flex-wrap gap-5">
            {IN_PROGRESS.map((p) => (
              <div
                key={p.kind}
                className={`${p.cls} min-w-0 border border-border rounded-tile overflow-hidden min-h-[360px] flex flex-col justify-between p-[30px] box-border`}
              >
                <span className="self-start inline-flex items-center gap-2 text-xs text-fg border border-border-2 bg-[rgba(var(--bg-rgb),.5)] rounded-full px-3 py-1.5">
                  <span aria-hidden="true" className="w-[7px] h-[7px] rounded-full bg-accent-light inline-block" />
                  In progress
                </span>
                <div className="flex flex-col gap-1.5">
                  <Eyebrow as="span">{p.kind}</Eyebrow>
                  <span className="text-2xl font-medium">{p.title}</span>
                  <span className="text-sm text-muted-2">Case study after launch</span>
                </div>
              </div>
            ))}
            <Link
              href="/founding"
              className="basis-full min-w-0 border border-dashed border-border-2 rounded-tile p-[30px] box-border flex flex-wrap justify-between items-center gap-4 text-fg transition-colors hover:border-accent-light"
            >
              <span className="flex flex-col gap-1.5 min-w-0">
                <span className="font-display italic text-[32px] leading-[1.1]">Your business could be the next one here.</span>
                <span className="text-sm text-muted-2">Founding customers get a reduced setup in exchange for a case study.</span>
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-accent-light min-h-11">
                See founding slots <span aria-hidden="true">→</span>
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* WHAT EACH WILL SHOW */}
      <section aria-labelledby="show-h" className="px-4 sm:px-6 py-[110px]">
        <div className="container-site">
          <Eyebrow className="mb-[18px]">What you’ll see</Eyebrow>
          <h2 id="show-h" className="display-2 m-0 mb-10">
            Every case study, the same four parts
          </h2>
          <ol className="list-none p-0 m-0 flex flex-wrap gap-[18px]">
            {PARTS.map(([title, body], i) => (
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
    </>
  );
}
