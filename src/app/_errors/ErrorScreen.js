// Shared layout for the 404, error boundary and global error pages (design: Error.dc.html).
// No hooks, so it renders from Server Components (not-found) and Client Components (error, global-error).
// Lives in a private folder (_errors) so it never becomes a route.

import Link from "next/link";
import { BrandMark } from "@/components/ui/Bits";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full text-[15px] font-medium px-[30px] py-[15px] min-h-[52px] box-border bg-fg text-bg border-2 border-transparent cursor-pointer transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(78,133,191,.25)]";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full text-[15px] font-medium px-[30px] py-[15px] min-h-[52px] box-border bg-transparent text-fg border-2 border-border cursor-pointer transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-border-2";

// Standalone pages (404, global error) render outside the marketing layout, so they get a brand pill linking home.
export function BrandHeader() {
  return (
    <header className="error-header fixed top-0 inset-x-0 z-10 flex justify-center px-4 pt-5 pointer-events-none">
      <div className="pointer-events-auto inline-flex items-center rounded-full glass px-2 py-[7px]">
        <Link href="/" className="inline-flex items-center gap-2.5 text-fg pr-3 min-h-11 hover:text-accent-light">
          <BrandMark size={36} />
          <span className="font-display italic text-xl">Klyvora</span>
          <span className="sr-only"> home</span>
        </Link>
      </div>
    </header>
  );
}

export default function ErrorScreen({ as: Tag = "main", code, title, text, actions, note, standalone = true, kind = "404" }) {
  return (
    <Tag
      id={Tag === "main" ? "main" : undefined}
      className={`page-error error-${kind} relative overflow-hidden flex items-center justify-center text-center box-border px-4 sm:px-6 ${
        standalone ? "min-h-screen pt-[120px] pb-20" : "min-h-[80vh] pt-[150px] pb-20"
      }`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(45%_55%_at_50%_40%,rgba(78,133,191,.22),transparent_70%)]"
      />
      <div className="relative max-w-[640px] min-w-0 flex flex-col items-center gap-[22px]">
        <span aria-hidden="true" className="error-code font-display text-[clamp(96px,18vw,180px)] leading-[.9] tracking-[-.03em] text-border-2">
          {code}
        </span>
        <h1 className="error-title font-display italic font-normal text-[clamp(36px,6vw,60px)] leading-none m-0">{title}</h1>
        <p className="m-0 text-[17px] leading-[1.7] text-muted-2 max-w-[460px]">{text}</p>
        <div className="error-actions flex flex-wrap justify-center gap-3">{actions}</div>
        {note ? <p className="m-0 text-[13px] leading-relaxed text-muted-2">{note}</p> : null}
      </div>
    </Tag>
  );
}
