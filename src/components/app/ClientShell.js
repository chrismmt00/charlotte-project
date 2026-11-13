"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { BrandMark } from "@/components/ui/Bits";
import { useTheme } from "@/lib/theme";
import { getOffer, money } from "@/lib/offers";
import { KINDS, KIND_LABEL, navFor } from "@/lib/app/kinds";
import { Icon } from "./ui";
import { useModal } from "./Dialog";
import { ToastProvider } from "./Toast";
import { IS_DEV, setDevKind, setFailNext, useBusiness, useFailNext, useKind } from "./useBusiness";

function isActive(pathname, href) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(href + "/");
}

// Development only: switch the kind of business and force the next request to fail.
function DevPanel() {
  const kind = useKind();
  const fail = useFailNext();
  if (!IS_DEV) return null;
  return (
    <div className="flex flex-col gap-2 border border-dashed border-border-2 rounded-input p-3 text-xs text-muted-2">
      <span>Development only</span>
      <label htmlFor="dev-kind" className="flex flex-col gap-1">
        Kind of business
        <select
          id="dev-kind"
          value={kind}
          onChange={(e) => setDevKind(e.target.value)}
          className="min-h-11 rounded-input border border-border-2 bg-surface-2 text-fg px-3 text-sm"
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="dev-fail" className="flex items-center gap-2 min-h-11 cursor-pointer">
        <input id="dev-fail" type="checkbox" checked={fail} onChange={(e) => setFailNext(e.target.checked)} className="w-[18px] h-[18px] accent-[#4E85BF]" />
        Fail the next request
      </label>
    </div>
  );
}

const navLink = "flex items-center gap-3 px-3 min-h-11 rounded-input text-sm text-muted-2 hover:text-fg hover:bg-surface transition-colors";

function Sheet({ items, pathname, biz, themeLabel, toggleTheme, onClose }) {
  const ref = useRef(null);
  useModal(ref, onClose);
  return (
    <div className="fixed inset-0 z-[200] bg-[rgba(var(--scrim-rgb),.6)]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        id="client-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        className="app-sheet absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto bg-surface text-fg border-t border-border rounded-t-card px-4 pt-2 pb-7 box-border flex flex-col"
      >
        <div aria-hidden="true" className="mx-auto mt-1 mb-1 w-10 h-1 rounded-full bg-border-2" />
        <div className="flex justify-between items-center min-h-11">
          <span className="min-w-0 flex items-center gap-2">
            <span className="text-lg font-medium truncate">{biz.name}</span>
            <span className="text-[11px] text-muted-2 border border-border-2 rounded-full px-2 py-0.5 whitespace-nowrap">Sample data</span>
          </span>
          <button
            type="button"
            data-autofocus=""
            data-close=""
            aria-label="Close menu"
            onClick={onClose}
            className="w-11 h-11 rounded-full border border-border-2 bg-surface-2 text-fg inline-flex items-center justify-center cursor-pointer p-0"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <ul className="list-none m-0 mt-3 p-0 flex flex-col">
          {items.map((it) => {
            const on = isActive(pathname, it.href);
            const badge = it.badgeKey ? biz.badges[it.badgeKey] : 0;
            return (
              <li key={it.key} className="border-b border-border">
                <Link
                  href={it.href}
                  aria-current={on ? "page" : undefined}
                  onClick={onClose}
                  className={`flex items-center gap-2 min-h-[52px] text-[17px] ${on ? "text-accent-light font-medium" : "text-fg"}`}
                >
                  {it.label}
                  {badge ? <span className="text-[11px] font-medium text-bg bg-accent-light rounded-full px-2 py-0.5">{badge}</span> : null}
                  <span aria-hidden="true" className="ml-auto text-muted">
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-2.5 pt-6">
          <a href={biz.liveUrl} target="_blank" rel="noreferrer" className="min-h-12 rounded-full border border-border-2 text-[15px] inline-flex items-center justify-center gap-2">
            View my site
            <Icon name="external" size={16} />
          </a>
          <button type="button" onClick={toggleTheme} className="min-h-12 rounded-full border border-border-2 bg-transparent text-fg text-[15px] cursor-pointer">
            {themeLabel}
          </button>
          <Link href="/portal" onClick={onClose} className="min-h-12 rounded-full bg-fg text-bg text-[15px] font-medium inline-flex items-center justify-center">
            Ask Klyvora for help
          </Link>
          <Link href="/portal/signin" className="min-h-12 rounded-full text-muted-2 text-[15px] inline-flex items-center justify-center">
            Sign out
          </Link>
          <DevPanel />
        </div>
      </div>
    </div>
  );
}

export default function ClientShell({ children }) {
  const pathname = usePathname() || "/app";
  const biz = useBusiness();
  const [theme, setTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const menuBtn = useRef(null);

  const light = theme === "light";
  const themeLabel = light ? "Switch to dark mode" : "Switch to light mode";
  const toggleTheme = () => setTheme(light ? "dark" : "light");
  const items = navFor(biz.kind);
  const offer = getOffer(biz.offerCode);
  const planLabel = `${offer.name} · ${money(offer.monthly)}/mo`;

  return (
    <ToastProvider>
      <div data-density="client" className="app min-h-screen bg-bg text-fg">
        <a
          href="#app-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[500] focus:bg-fg focus:text-bg focus:rounded-full focus:px-5 focus:py-3 focus:text-sm"
        >
          Skip to content
        </a>

        {/* Sidebar (900px and up) */}
        <nav
          aria-label="Your site"
          className="app-sidebar hidden min-[900px]:flex fixed inset-y-0 left-0 w-60 z-50 flex-col gap-1.5 bg-surface-2 border-r border-border px-3.5 py-5 box-border overflow-y-auto"
        >
          <div className="flex items-center gap-2.5 px-2.5 pt-1.5 pb-[18px]">
            <span aria-hidden="true" className="w-9 h-9 rounded-[12px] bg-surface border border-border-2 inline-flex items-center justify-center text-sm font-medium flex-none">
              {biz.initials}
            </span>
            <span className="flex flex-col leading-tight min-w-0">
              <span className="text-[15px] font-medium truncate">{biz.name}</span>
              <span className="text-xs text-muted-2">{planLabel}</span>
              <span className="mt-1 self-start text-[11px] text-muted-2 border border-border-2 rounded-full px-2 py-0.5">Sample data</span>
            </span>
          </div>
          {items.map((it) => {
            const on = isActive(pathname, it.href);
            const badge = it.badgeKey ? biz.badges[it.badgeKey] : 0;
            return (
              <Link
                key={it.key}
                href={it.href}
                aria-current={on ? "page" : undefined}
                className={`app-nav-item flex items-center gap-3 px-3 min-h-11 rounded-input text-sm transition-colors ${
                  on ? "bg-surface text-fg font-medium" : "text-muted-2 hover:text-fg hover:bg-surface"
                }`}
              >
                <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full flex-none ${on ? "bg-accent-light" : "bg-border-2"}`} />
                {it.label}
                {badge ? (
                  <span aria-label={`${badge} open`} className="ml-auto text-[11px] font-medium text-bg bg-accent-light rounded-full px-2 py-0.5">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <div className="mt-auto flex flex-col gap-1.5 pt-4">
            <a href={biz.liveUrl} target="_blank" rel="noreferrer" className={`app-nav-site ${navLink}`}>
              <Icon name="external" />
              View my site
            </a>
            <Link href="/portal" className={navLink}>
              <Icon name="help" />
              Ask Klyvora for help
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={themeLabel}
              className="btn-theme flex items-center gap-3 px-3 min-h-11 rounded-input text-sm text-muted-2 bg-transparent border border-border cursor-pointer text-left w-full hover:text-fg"
            >
              <Icon name={light ? "moon" : "sun"} />
              {themeLabel}
            </button>
            <Link href="/portal/signin" className={`app-nav-signout ${navLink}`}>
              <Icon name="signout" />
              Sign out
            </Link>
            <DevPanel />
            <div className="flex items-center gap-2 px-3 pt-3 mt-1.5 border-t border-border text-xs text-muted-2">
              <BrandMark size={18} />
              <span>
                Run by Klyvora ·{" "}
                <Link href="/" className="text-muted-2 underline">
                  klyvora.ai
                </Link>
              </span>
            </div>
          </div>
        </nav>

        {/* Top bar (under 900px) */}
        <header className="app-topbar min-[900px]:hidden fixed top-0 inset-x-0 h-[60px] box-border z-50 bg-[rgba(var(--surface-rgb),.86)] backdrop-blur-[14px] border-b border-border flex items-center justify-between pl-4 pr-3">
          <Link href="/app" className="text-[15px] font-medium truncate min-h-11 inline-flex items-center">
            {biz.name}
          </Link>
          <button
            ref={menuBtn}
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="client-menu"
            onClick={() => setOpen(true)}
            className="w-11 h-11 rounded-full border border-border-2 bg-transparent text-fg inline-flex items-center justify-center cursor-pointer p-0"
          >
            <Icon name="menu" size={20} />
          </button>
        </header>

        {open ? (
          <Sheet items={items} pathname={pathname} biz={biz} themeLabel={themeLabel} toggleTheme={toggleTheme} onClose={() => setOpen(false)} />
        ) : null}

        <div className="min-h-screen flex flex-col pt-[60px] min-[900px]:pt-0 min-[900px]:pl-60">{children}</div>
      </div>
    </ToastProvider>
  );
}
