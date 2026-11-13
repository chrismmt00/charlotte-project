import Link from "next/link";
import { Eyebrow } from "@/components/ui/Section";
import { LEGAL_DOCS, LEGAL_UPDATED } from "@/lib/legal";

// Shared layout for /privacy and /terms: title, tabs between the two, a table of contents and numbered sections.
export default function LegalDoc({ docKey }) {
  const doc = LEGAL_DOCS[docKey];
  const sections = doc.sections.map(([id, h, paras], i) => ({
    id: `${docKey}-${id}`,
    num: String(i + 1).padStart(2, "0"),
    h,
    paras,
  }));
  return (
    <>
      <header className="px-4 sm:px-6 pt-[160px] pb-10">
        <div className="container-site">
          <Eyebrow className="mb-[22px]">Legal</Eyebrow>
          <h1 className="font-display italic font-normal text-[clamp(48px,7vw,88px)] leading-[.95] tracking-[-.02em] m-0 mb-[18px]">{doc.title}</h1>
          <p className="text-sm text-muted-2 m-0 mb-7">Last updated {LEGAL_UPDATED}</p>
          <nav aria-label="Legal pages" className="tabs-legal">
            <ul className="list-none p-0 m-0 flex flex-wrap gap-2">
              {Object.entries(LEGAL_DOCS).map(([key, d]) => {
                const on = key === docKey;
                return (
                  <li key={key}>
                    <Link
                      href={d.href}
                      aria-current={on ? "page" : undefined}
                      className={`text-sm rounded-full px-[18px] py-2.5 min-h-11 box-border inline-flex items-center border transition-colors ${
                        on ? "bg-fg text-bg border-fg" : "bg-transparent text-muted-2 border-border hover:text-fg hover:border-border-2"
                      }`}
                    >
                      {d.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <section aria-label={doc.title} className="px-4 sm:px-6 pt-6 pb-[110px]">
        <div className="container-site flex flex-wrap gap-x-16 gap-y-10 items-start">
          <nav aria-labelledby={`${docKey}-toc-h`} className="toc-legal flex-[1_1_240px] min-w-0 border-t border-border pt-[22px] lg:sticky lg:top-[100px]">
            <h2 id={`${docKey}-toc-h`} className="eyebrow font-normal m-0 mb-2.5">
              On this page
            </h2>
            <ol className="list-none p-0 m-0 flex flex-col">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-sm text-muted flex gap-3 items-center min-h-10 hover:text-fg">
                    <span className="text-[11px] tracking-[.2em] text-accent-light">{s.num}</span>
                    {s.h}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="legal-body flex-[3_1_600px] min-w-0 flex flex-col gap-2">
            <div role="note" className="flex gap-3 items-start border border-border-2 rounded-input px-[18px] py-3.5 mb-6 bg-surface">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-0.5 text-accent-light">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5" />
                <path d="M12 8h.01" />
              </svg>
              <span className="text-sm leading-[1.6] text-muted-2">[DRAFT: structure and known facts only. The legal text goes through a lawyer before launch.]</span>
            </div>
            {sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="border-t border-border pt-8 pb-5 scroll-mt-[100px]">
                <h2 id={`${s.id}-h`} className="flex gap-3.5 items-baseline text-[22px] font-medium m-0 mb-3.5">
                  <span className="text-[11px] tracking-[.2em] text-accent-light font-normal">{s.num}</span>
                  {s.h}
                </h2>
                {s.paras.map((p) => (
                  <p key={p} className="text-base leading-[1.75] text-muted-2 m-0 mb-3.5 max-w-[720px]">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
