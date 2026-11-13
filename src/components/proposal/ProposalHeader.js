import Link from "next/link";
import ThemeButton from "@/components/site/ThemeButton";

const TONE = { accent: "text-accent-light", success: "text-success", warning: "text-warning", muted: "text-muted-2" };

// Board header: sticky, blurred bg, Klyvora wordmark (serif italic 22px), status chip and the theme switch.
export default function ProposalHeader({ chip, tone = "muted" }) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur-[10px] bg-[rgba(var(--bg-rgb),.8)] border-b border-border">
      <div className="mx-auto max-w-[880px] px-[clamp(16px,4vw,32px)] py-3.5 flex items-center justify-between gap-3 text-[13px]">
        <Link href="/" aria-label="Klyvora home" className="font-display italic text-[22px] text-fg">
          Klyvora
        </Link>
        <span className="flex items-center gap-3 text-muted-2">
          {chip ? <span className={`border border-border-2 rounded-full px-2.5 py-1 text-xs ${TONE[tone] || TONE.muted}`}>{chip}</span> : null}
          <ThemeButton />
        </span>
      </div>
    </header>
  );
}
