import Link from "next/link";
import ThemeButton from "@/components/site/ThemeButton";
import { BrandMark } from "@/components/ui/Bits";

export const metadata = {
  title: "Your proposal",
  robots: { index: false, follow: false },
};

// Minimal layout for the public proposal: brand mark and a theme switch, no site nav, no footer.
export default function ProposalLayout({ children }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:bg-fg focus:text-bg focus:rounded-full focus:px-5 focus:py-3 focus:text-sm">
        Skip to content
      </a>
      <header className="sticky top-0 z-10 backdrop-blur-[10px] bg-[rgba(var(--bg-rgb),.8)] border-b border-border">
        <div className="mx-auto max-w-[880px] px-4 sm:px-8 py-2.5 flex items-center justify-between gap-3">
          <Link href="/" aria-label="Klyvora home" className="inline-flex items-center gap-2.5 min-h-11 text-fg">
            <BrandMark size={32} />
            <span className="font-display italic text-[22px]">Klyvora</span>
          </Link>
          <ThemeButton />
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}
