"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/ui/Bits";
import { useTheme } from "@/lib/theme";
import { PortalProvider } from "./PortalContext";
import DevSwitch from "./DevSwitch";
import { Icon } from "./ui";

const NAV = [
  { href: "/portal/project", label: "Project" },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/support", label: "Support" },
  { href: "/portal/account", label: "Account" },
];

const SHOW_DEV = process.env.NODE_ENV !== "production";

// The client portal's own chrome: no public nav or footer. One sticky top bar with the portal nav;
// on a phone the nav drops to a second, scrollable row under the logo. Sign-in renders bare.
export default function PortalShell({ children }) {
  const pathname = usePathname() || "/portal";
  const [theme, setTheme] = useTheme();
  const dark = theme !== "light";
  const themeLabel = dark ? "Switch to light mode" : "Switch to dark mode";

  if (pathname.startsWith("/portal/signin")) return <>{children}</>;

  return (
    <PortalProvider>
      <div data-density="portal" className="portal flex-1 flex flex-col min-h-screen bg-bg text-fg text-[15px] overflow-x-clip">
        <a href="#portal-main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[500] focus:bg-fg focus:text-bg focus:rounded-full focus:px-5 focus:py-3 focus:text-sm">
          Skip to content
        </a>
        <header className="sticky top-0 z-50 bg-[rgba(var(--surface-rgb),.86)] backdrop-blur-[14px] border-b border-border">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-[clamp(16px,3vw,32px)] min-h-16 flex flex-wrap items-center justify-between gap-x-3">
            <Link href="/portal" aria-label="Klyvora client portal home" className="order-1 flex items-center gap-2.5 min-h-16 text-fg">
              <BrandMark size={32} />
              <span className="font-display italic text-xl">Klyvora</span>
              <span className="hidden min-[400px]:inline text-[11px] tracking-[.2em] uppercase text-muted-2">Client portal</span>
            </Link>
            <nav aria-label="Portal" className="order-3 sm:order-2 w-full sm:w-auto -mx-1 sm:mx-0 pb-2 sm:pb-0 overflow-x-auto">
              <ul className="list-none m-0 p-0 px-1 sm:px-0 flex items-center gap-1">
                {NAV.map((n) => {
                  const on = pathname === n.href || pathname.startsWith(n.href + "/");
                  return (
                    <li key={n.href} className="flex-none">
                      <Link
                        href={n.href}
                        aria-current={on ? "page" : undefined}
                        className={`inline-flex items-center min-h-11 px-3.5 rounded-full text-sm font-medium transition-colors duration-150 ${on ? "bg-surface-2 text-fg" : "text-muted-2 hover:text-fg"}`}
                      >
                        {n.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="order-2 sm:order-3 flex items-center gap-1.5">
              <button
                type="button"
                aria-label={themeLabel}
                title={themeLabel}
                onClick={() => setTheme(dark ? "light" : "dark")}
                className="w-11 h-11 rounded-full border border-border-2 bg-transparent text-muted-2 inline-flex items-center justify-center cursor-pointer p-0 hover:text-fg hover:border-fg"
              >
                <Icon name={dark ? "sun" : "moon"} size={18} strokeWidth={1.6} />
              </button>
              <Link
                href="/portal/signin"
                aria-label="[First name] · account · sign out"
                title="Sign out"
                className="w-11 h-11 rounded-full bg-surface-2 border border-border-2 inline-flex items-center justify-center text-[13px] font-medium text-fg"
              >
                B
              </Link>
            </div>
          </div>
        </header>

        <main id="portal-main" className="flex-1 w-full max-w-[1200px] mx-auto box-border px-4 sm:px-[clamp(16px,3vw,32px)] pt-7 sm:pt-9 pb-20">
          {children}
        </main>

        <footer className="border-t border-border px-4 sm:px-[clamp(16px,3vw,32px)] py-6">
          <div className="max-w-[1200px] mx-auto flex flex-wrap justify-between items-center gap-x-6 gap-y-1 text-[13px] text-muted-2">
            <span>© 2026 Klyvora · Charlotte, NC</span>
            <div className="flex gap-5">
              <Link href="/privacy" className="min-h-11 inline-flex items-center hover:text-fg">
                Privacy
              </Link>
              <Link href="/terms" className="min-h-11 inline-flex items-center hover:text-fg">
                Terms
              </Link>
              <Link href="/" className="min-h-11 inline-flex items-center hover:text-fg">
                klyvora.ai
              </Link>
            </div>
          </div>
        </footer>
        {SHOW_DEV ? <DevSwitch /> : null}
      </div>
    </PortalProvider>
  );
}
