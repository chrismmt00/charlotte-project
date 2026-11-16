"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/ui/Bits";
import { CONTACT } from "@/lib/site";
import ThemeButton, { ThemeSegment } from "./ThemeButton";

const LINKS = [
  { key: "solutions", label: "Industry Solutions", href: "/solutions" },
  { key: "websites", label: "Custom Websites", href: "/websites" },
  { key: "ai-software", label: "AI & Software", href: "/ai-software" },
  { key: "pricing", label: "Pricing", href: "/pricing" },
];

function isCurrent(pathname, href) {
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SiteNav() {
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuBtn = useRef(null);
  const closeBtn = useRef(null);
  const sheet = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sheet: lock page scroll, focus the close button, Escape closes, Tab stays inside, focus returns to the menu button.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const btn = menuBtn.current;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !sheet.current) return;
      const f = sheet.current.querySelectorAll(
        "a[href], button:not([disabled])",
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      btn?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav
        aria-label="Main"
        className={`site-nav fixed top-0 inset-x-0 z-[100] flex justify-center px-4 pointer-events-none transition-[padding] duration-300 ${
          scrolled ? "pt-3" : "pt-5"
        }`}
      >
        <div
          className={`nav-pill pointer-events-auto flex items-center justify-between gap-1 w-full md:w-auto max-w-full box-border rounded-full border border-[rgba(var(--hair-rgb),.08)] backdrop-blur-[14px] transition-[padding,background-color,box-shadow] duration-300 ${
            scrolled
              ? "bg-[rgba(var(--surface-rgb),.9)] py-[5px] px-1.5 shadow-[0_4px_18px_rgba(0,0,0,calc(.25*var(--shadow-k)))]"
              : "bg-[rgba(var(--surface-rgb),.72)] py-[7px] px-2 shadow-[0_8px_30px_rgba(0,0,0,calc(.35*var(--shadow-k)))]"
          }`}
        >
          <Link
            href="/"
            aria-label="Klyvora home"
            className="nav-mark flex-none flex items-center justify-center rounded-full mr-1.5 w-11 h-11 md:w-9 md:h-9"
          >
            <BrandMark size={scrolled ? 32 : 36} />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => {
              const cur = isCurrent(pathname, l.href);
              return (
                <Link
                  key={l.key}
                  href={l.href}
                  aria-current={cur ? "page" : undefined}
                  className={`nav-link text-[13px] rounded-full px-4 inline-flex items-center whitespace-nowrap box-border transition-colors duration-200 hover:text-fg hover:bg-border ${
                    scrolled ? "min-h-11" : "min-h-11"
                  } ${cur ? "text-fg bg-border" : "text-muted-2"}`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hidden md:inline-flex ml-1">
              <ThemeButton />
            </span>
            <Link
              href="/contact"
              aria-current={pathname === "/contact" ? "page" : undefined}
              className={`nav-cta text-[13px] text-fg rounded-full px-[18px] border border-border-2 inline-flex gap-1.5 items-center ml-1 box-border whitespace-nowrap transition-colors duration-200 hover:bg-fg hover:text-bg hover:border-fg min-h-11 ${
                scrolled ? "md:min-h-11" : "md:min-h-11"
              } ${pathname === "/contact" ? "bg-border" : ""}`}
            >
              Start Project <span aria-hidden="true">↗</span>
            </Link>
            <button
              ref={menuBtn}
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen(true)}
              className="nav-menu-btn md:hidden w-11 h-11 flex-none rounded-full border border-border-2 bg-transparent text-fg inline-flex items-center justify-center cursor-pointer p-0"
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M4 8h16" />
                <path d="M4 16h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {open ? (
        <div
          id="site-menu"
          ref={sheet}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="nav-sheet fixed inset-0 z-[200] bg-[rgba(var(--bg-rgb),.97)] backdrop-blur-[14px] text-fg flex flex-col px-4 pt-[27px] pb-7 box-border overflow-y-auto"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-[radial-gradient(70%_45%_at_85%_0%,rgba(78,133,191,.22),transparent_70%)]"
          />
          <div className="relative flex justify-between items-center px-2">
            <span className="font-display italic text-[26px] leading-none">
              Klyvora
            </span>
            <button
              ref={closeBtn}
              type="button"
              aria-label="Close menu"
              onClick={close}
              className="w-11 h-11 rounded-full border border-border-2 bg-surface text-fg inline-flex items-center justify-center cursor-pointer p-0"
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>
          <ul className="relative list-none mt-10 mb-0 px-2 flex flex-col">
            {LINKS.map((l) => {
              const cur = isCurrent(pathname, l.href);
              return (
                <li key={l.key} className="border-b border-border">
                  <Link
                    href={l.href}
                    onClick={close}
                    aria-current={cur ? "page" : undefined}
                    className={`flex justify-between items-center gap-4 py-4 min-h-11 font-display italic text-[40px] leading-[1.1] ${cur ? "text-accent-light" : "text-fg"}`}
                  >
                    {l.label}
                    <span
                      aria-hidden="true"
                      className="font-sans not-italic text-lg text-muted"
                    >
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="relative flex flex-wrap gap-x-5 gap-y-1 pt-[18px] px-2">
            <Link
              href="/about"
              onClick={close}
              className="text-[15px] text-muted-2 min-h-11 inline-flex items-center"
            >
              About
            </Link>
          </div>
          <div className="relative flex justify-between items-center gap-3 pt-[18px] px-2">
            <span className="text-sm text-muted">Appearance</span>
            <ThemeSegment />
          </div>
          <div className="relative mt-auto pt-8 px-2 flex flex-col gap-[18px]">
            <Link
              href="/contact"
              onClick={close}
              className="rounded-full text-[15px] font-medium px-[30px] py-[15px] bg-fg text-bg flex items-center justify-center gap-2 min-h-[52px] box-border"
            >
              Start Project <span aria-hidden="true">↗</span>
            </Link>
            <div className="flex flex-wrap justify-between gap-2 text-sm text-muted">
              <span>Charlotte, NC</span>
              <span>{CONTACT.email}</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
