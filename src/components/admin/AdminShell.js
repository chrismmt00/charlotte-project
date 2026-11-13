"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { BrandMark } from "@/components/ui/Bits";
import { useTheme } from "@/lib/theme";
import { ADMIN_NAV, CMDK_GROUPS, APPROVALS_WAITING } from "@/lib/admin/nav";

const COLLAPSE_KEY = "klyvora-admin-collapsed";
const COLLAPSE_EVENT = "klyvora-admin-collapse";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}
function subscribeCollapsed(cb) {
  window.addEventListener(COLLAPSE_EVENT, cb);
  return () => window.removeEventListener(COLLAPSE_EVENT, cb);
}
function setCollapsed(v) {
  try {
    localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
  } catch {}
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}

function isActive(pathname, href) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function Icon({ name, size = 18 }) {
  const P = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
    leads: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>,
    outreach: <><path d="M4 12l16-8-6 16-2.5-6.5z" /></>,
    clients: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
    proposals: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
    projects: <><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="10" rx="1.5" /><rect x="17" y="4" width="4" height="13" rx="1.5" /></>,
    invoices: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
    subscriptions: <><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></>,
    support: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></>,
    reports: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    collapse: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
    menu: <><path d="M4 8h16M4 16h16" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
    moon: <><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></>,
    close: <><path d="M6 6l12 12M18 6L6 18" /></>,
    portal: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
      {P[name]}
    </svg>
  );
}

function CommandPalette({ onClose }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  const input = useRef(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    let k = 0;
    return CMDK_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !s || i.label.toLowerCase().includes(s)) }))
      .filter((g) => g.items.length)
      .map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, k: k++ })) }));
  }, [q]);
  const flat = groups.flatMap((g) => g.items);
  const go = (item) => {
    onClose();
    router.push(item.href);
  };
  const onKey = (e) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && flat[idx]) {
      e.preventDefault();
      go(flat[idx]);
    }
  };
  return (
    <div className="fixed inset-0 z-[400] bg-[rgba(var(--scrim-rgb),.6)] flex items-start justify-center px-4 pt-[12vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onKeyDown={onKey}
        onClick={(e) => e.stopPropagation()}
        className="cmdk w-[min(640px,100%)] bg-surface border border-border-2 rounded-admin shadow-[0_30px_80px_rgba(0,0,0,calc(.5*var(--shadow-k)))] overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-4 border-b border-border text-muted-2">
          <Icon name="search" />
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-activedescendant={flat[idx] ? `cmdk-${idx}` : undefined}
            aria-label="Search leads, clients, actions"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            placeholder="Search leads, clients, invoices, or type an action"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none min-h-[52px] text-[15px] text-fg"
          />
          <button type="button" onClick={onClose} className="font-mono text-[11px] text-muted border border-border-2 rounded-md px-1.5 py-px cursor-pointer bg-transparent">
            esc
          </button>
        </div>
        <div id="cmdk-list" role="listbox" className="max-h-[50vh] overflow-y-auto px-1 py-2 flex flex-col gap-0.5">
          {groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-0.5">
              <span className="text-[11px] tracking-[.15em] uppercase text-muted px-3 pt-2 pb-1">{g.label}</span>
              {g.items.map((i) => (
                <a
                  key={i.label}
                  id={`cmdk-${i.k}`}
                  role="option"
                  aria-selected={i.k === idx}
                  href={i.href}
                  onClick={(e) => {
                    e.preventDefault();
                    go(i);
                  }}
                  onMouseEnter={() => setIdx(i.k)}
                  className={`flex items-center gap-2.5 min-h-10 px-3 rounded-[10px] text-[13px] text-fg ${i.k === idx ? "bg-surface-2" : ""}`}
                >
                  {i.label}
                  <span className="ml-auto font-mono text-[11px] text-muted">{i.hint}</span>
                </a>
              ))}
            </div>
          ))}
          {!groups.length ? (
            <p className="px-3 py-6 text-[13px] text-muted-2 text-center m-0">
              Nothing for &ldquo;{q}&rdquo;.
              <br />
              Try a business, a person or an action like &ldquo;new lead&rdquo;.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function UserMenu({ onClose, themeLabel, toggleTheme }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector("[role=menuitem]")?.focus();
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  const item = "flex items-center gap-2.5 min-h-10 px-3 rounded-[10px] text-[13px] text-fg bg-transparent border-0 w-full text-left cursor-pointer hover:bg-surface-2";
  return (
    <div ref={ref} role="menu" aria-label="Account" className="menu-user absolute right-0 top-11 w-60 bg-surface border border-border-2 rounded-admin p-1.5 shadow-[0_20px_50px_rgba(0,0,0,calc(.45*var(--shadow-k)))] flex flex-col gap-0.5 z-[60]">
      <div className="px-3 pt-2.5 pb-2 flex flex-col gap-0.5">
        <span className="text-[13px] font-medium">Chris [Last name]</span>
        <span className="text-xs text-muted">Owner · [email]</span>
      </div>
      <span role="separator" className="h-px bg-border my-0.5" />
      <Link href="/admin/settings?tab=team" role="menuitem" className={item} onClick={onClose}>
        Profile and password
      </Link>
      <Link href="/admin/settings" role="menuitem" className={item} onClick={onClose}>
        Settings
      </Link>
      <button type="button" role="menuitem" className={item} onClick={toggleTheme}>
        {themeLabel}
      </button>
      <Link href="/portal" role="menuitem" className={item} onClick={onClose}>
        View client portal
      </Link>
      <span role="separator" className="h-px bg-border my-0.5" />
      <Link href="/admin/signin" role="menuitem" className={item} onClick={onClose}>
        Sign out
      </Link>
    </div>
  );
}

function Wordmark({ collapsed }) {
  return (
    <>
      <span className="w-8 h-8 rounded-full p-0.5 bg-[linear-gradient(135deg,#89AACC,#4E85BF)] flex box-border flex-none">
        <span className="w-full h-full rounded-full bg-bg flex items-center justify-center font-display italic text-lg">K</span>
      </span>
      {!collapsed ? (
        <span className="flex flex-col leading-[1.15]">
          <span className="font-display italic text-xl">Klyvora</span>
          <span className="text-[11px] tracking-[.2em] uppercase text-muted-2">Admin</span>
        </span>
      ) : null}
    </>
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname() || "/admin";
  const [theme, setTheme] = useTheme();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [cmdk, setCmdk] = useState(false);
  const [user, setUser] = useState(false);
  const [sheet, setSheet] = useState(false);
  const sheetClose = useRef(null);

  const dark = theme !== "light";
  const themeLabel = dark ? "Light mode" : "Dark mode";
  const toggleTheme = () => setTheme(dark ? "light" : "dark");
  const current = ADMIN_NAV.find((n) => isActive(pathname, n.href));
  const crumb = current ? current.label : "Admin";

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setUser(false);
        setCmdk((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetClose.current?.focus();
    const onKey = (e) => e.key === "Escape" && setSheet(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  // Sign-in screens render without the shell.
  if (pathname.startsWith("/admin/signin")) return <>{children}</>;

  const sideW = collapsed ? "lg:w-[72px]" : "lg:w-[240px]";
  const sideLeft = collapsed ? "lg:left-[72px]" : "lg:left-[240px]";
  const mainPad = collapsed ? "lg:pl-[72px]" : "lg:pl-[240px]";
  const navItem = "flex items-center gap-3 px-3 min-h-10 rounded-[12px] text-[13px]";

  return (
    <div data-density="admin" className="admin min-h-screen bg-bg-deep text-fg text-[13px]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[500] focus:bg-fg focus:text-bg focus:rounded-full focus:px-4 focus:py-2.5">
        Skip to content
      </a>

      {/* Sidebar (1024+) */}
      <nav aria-label="Admin" className={`sidebar hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col gap-1.5 bg-surface-2 border-r border-border py-5 px-3.5 box-border transition-[width] duration-200 ${sideW}`}>
        <Link href="/admin" className="flex items-center gap-2.5 px-2.5 pt-1.5 pb-[18px] text-fg" aria-label="Klyvora admin home">
          <Wordmark collapsed={collapsed} />
        </Link>
        {ADMIN_NAV.map((it) => {
          const on = isActive(pathname, it.href);
          return (
            <Link
              key={it.key}
              href={it.href}
              aria-current={on ? "page" : undefined}
              title={collapsed ? it.label : undefined}
              className={`${navItem} ${on ? "bg-surface text-fg font-medium" : "text-muted-2 hover:text-fg"} ${collapsed ? "justify-center px-0" : ""}`}
            >
              {!collapsed ? <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full flex-none ${on ? "bg-accent-light" : "bg-border-2"}`} /> : null}
              {!collapsed ? it.label : <span aria-hidden="true" className="text-xs font-medium">{it.label[0]}</span>}
              {collapsed ? <span className="sr-only">{it.label}</span> : null}
              {it.key === "outreach" && APPROVALS_WAITING && !collapsed ? (
                <span aria-label={`${APPROVALS_WAITING} awaiting approval`} className="ml-auto text-[11px] font-medium text-bg bg-accent-light rounded-full px-2 py-0.5 tabular-nums">
                  {APPROVALS_WAITING}
                </span>
              ) : null}
            </Link>
          );
        })}
        <div className="mt-auto flex flex-col gap-1.5">
          <Link href="/portal" className={`${navItem} text-muted-2 hover:text-fg ${collapsed ? "justify-center px-0" : ""}`}>
            <Icon name="portal" />
            {!collapsed ? "View client portal" : <span className="sr-only">View client portal</span>}
          </Link>
          <button
            type="button"
            aria-label={themeLabel}
            onClick={toggleTheme}
            className={`${navItem} text-muted-2 bg-transparent border border-border cursor-pointer text-left w-full ${collapsed ? "justify-center px-0" : ""}`}
          >
            <Icon name={dark ? "sun" : "moon"} />
            {!collapsed ? themeLabel : null}
          </button>
          {!collapsed ? (
            <div className="flex items-center gap-3 px-3 pt-2.5 border-t border-border mt-1.5">
              <span aria-hidden="true" className="w-8 h-8 rounded-full bg-surface border border-border-2 flex items-center justify-center text-[13px] font-medium">
                C
              </span>
              <span className="flex flex-col leading-[1.2] min-w-0">
                <span className="text-sm">Chris</span>
                <span className="text-xs text-muted-2">Owner · [email]</span>
              </span>
            </div>
          ) : null}
        </div>
      </nav>

      {/* Mobile header (under 1024) */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-[60px] box-border bg-[rgba(var(--surface-rgb),.86)] backdrop-blur-[14px] border-b border-border flex items-center justify-between pl-4 pr-3 z-50">
        <Link href="/admin" className="flex items-center gap-2.5 text-fg">
          <span className="font-display italic text-xl">Klyvora</span>
          <span className="text-[11px] tracking-[.2em] uppercase text-muted-2">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setSheet(true)}
          aria-label="Open admin menu"
          aria-expanded={sheet}
          aria-controls="admin-menu"
          className="w-11 h-11 rounded-full border border-border-2 bg-transparent text-fg inline-flex items-center justify-center cursor-pointer p-0"
        >
          <Icon name="menu" size={20} />
        </button>
      </header>

      {/* Topbar (1024+) */}
      <header className={`topbar hidden lg:flex fixed top-0 right-0 z-40 h-16 box-border bg-[rgba(var(--bg-rgb),.85)] backdrop-blur-[14px] border-b border-border items-center justify-between gap-3 px-6 ${sideLeft}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            className="w-9 h-9 rounded-full border border-border-2 bg-transparent text-muted-2 hover:text-fg inline-flex items-center justify-center cursor-pointer"
          >
            <Icon name="collapse" />
          </button>
          <span className="text-[13px] text-muted-2 whitespace-nowrap overflow-hidden text-ellipsis">Klyvora Admin · {crumb}</span>
        </div>
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => {
              setUser(false);
              setCmdk(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={cmdk}
            className="btn-search inline-flex items-center gap-2.5 min-h-9 pl-2.5 pr-3 rounded-full border border-border-2 bg-surface-2 text-muted-2 text-[13px] cursor-pointer hover:text-fg"
          >
            <Icon name="search" size={16} />
            Search
            <span className="font-mono text-[11px] text-muted border border-border-2 rounded-md px-1.5 py-px ml-1.5">⌘K</span>
          </button>
          <Link
            href="/admin/outreach"
            aria-label={`${APPROVALS_WAITING} items awaiting approval`}
            className="relative w-9 h-9 rounded-full border border-border-2 bg-transparent text-muted-2 hover:text-fg inline-flex items-center justify-center"
          >
            <Icon name="bell" />
            {APPROVALS_WAITING ? (
              <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-light text-bg text-[10px] font-medium inline-flex items-center justify-center">
                {APPROVALS_WAITING}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => {
              setCmdk(false);
              setUser((v) => !v);
            }}
            aria-haspopup="menu"
            aria-expanded={user}
            aria-label="Account menu"
            className="btn-user w-9 h-9 rounded-full border border-border-2 bg-surface text-fg text-[13px] font-medium cursor-pointer"
          >
            C
          </button>
          {user ? <UserMenu onClose={() => setUser(false)} themeLabel={themeLabel} toggleTheme={toggleTheme} /> : null}
        </div>
      </header>

      <main id="admin-main" className={`pt-[60px] lg:pt-16 min-h-screen box-border bg-bg-deep ${mainPad} transition-[padding] duration-200`}>
        <div className="max-w-[1200px] mx-auto px-[clamp(16px,3vw,32px)] pt-7 pb-16 flex flex-col gap-6">{children}</div>
      </main>

      {cmdk ? <CommandPalette onClose={() => setCmdk(false)} /> : null}

      {sheet ? (
        <div id="admin-menu" role="dialog" aria-modal="true" aria-label="Admin menu" className="fixed inset-0 z-[300] bg-[rgba(var(--bg-rgb),.97)] text-fg flex flex-col px-4 pt-2 pb-7 box-border overflow-y-auto">
          <div className="flex justify-between items-center min-h-11">
            <span className="font-display italic text-[26px]">Klyvora</span>
            <button ref={sheetClose} type="button" aria-label="Close menu" onClick={() => setSheet(false)} className="w-11 h-11 rounded-full border border-border-2 bg-surface text-fg inline-flex items-center justify-center cursor-pointer p-0">
              <Icon name="close" size={20} />
            </button>
          </div>
          <ul className="list-none p-0 mt-6 mb-0 flex flex-col">
            {ADMIN_NAV.map((it) => {
              const on = isActive(pathname, it.href);
              return (
                <li key={it.key} className="border-b border-border">
                  <Link href={it.href} aria-current={on ? "page" : undefined} onClick={() => setSheet(false)} className={`flex items-center justify-between gap-3 min-h-12 px-1 text-[15px] ${on ? "text-fg font-medium" : "text-muted-2"}`}>
                    {it.label}
                    <span aria-hidden="true" className="text-muted">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex flex-col gap-2">
            <button type="button" onClick={toggleTheme} className="min-h-11 rounded-full border border-border-2 bg-transparent text-fg text-sm cursor-pointer">
              {themeLabel}
            </button>
            <Link href="/portal" onClick={() => setSheet(false)} className="min-h-11 rounded-full border border-border-2 text-sm inline-flex items-center justify-center">
              View client portal
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
