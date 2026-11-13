// Small display pieces: StatusDot, Marquee, Check list, brand mark, icons.

export function StatusDot({ on = true }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-2 h-2 rounded-full ${on ? "bg-success animate-pulse-dot" : "bg-muted"}`}
    />
  );
}

export function Marquee({ items }) {
  const row = (p) =>
    items.flatMap((t, i) => [<span key={`${p}t${i}`}>{t}</span>, <span key={`${p}d${i}`}>•</span>]);
  return (
    <div aria-hidden="true" className="overflow-hidden border-y border-border py-4 whitespace-nowrap">
      <div className="inline-flex gap-10 pr-10 text-xs tracking-[.25em] uppercase text-muted-2 animate-marquee">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

export function CheckIcon({ size = 20, className = "text-success" }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-none ${className}`}>
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export function DashList({ items, className = "" }) {
  return (
    <ul className={`list-none p-0 m-0 mt-2 flex flex-col gap-2 text-sm text-muted-2 ${className}`}>
      {items.map((t) => (
        <li key={t}>— {t}</li>
      ))}
    </ul>
  );
}

export function BrandMark({ size = 36 }) {
  return (
    <span
      className="rounded-full p-[2px] flex box-border bg-[linear-gradient(135deg,#89AACC,#4E85BF)]"
      style={{ width: size, height: size }}
    >
      <span className="w-full h-full rounded-full bg-bg flex items-center justify-center font-display italic text-fg" style={{ fontSize: size * 0.56 }}>
        K
      </span>
    </span>
  );
}

const ICONS = {
  websites: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 9h18" />
      <path d="M7 6.5h.01" />
    </>
  ),
  booking: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M9 15l2 2 4-4" />
    </>
  ),
  ecommerce: (
    <>
      <path d="M4 6h16l-1.5 9h-13z" />
      <path d="M4 6L3 3H1" />
      <circle cx="8" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </>
  ),
  restaurants: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h3" />
    </>
  ),
  ai: (
    <>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <circle cx="12" cy="12" r="4" />
      <path d="M5.6 5.6l2.1 2.1" />
      <path d="M16.3 16.3l2.1 2.1" />
      <path d="M18.4 5.6l-2.1 2.1" />
      <path d="M7.7 16.3l-2.1 2.1" />
    </>
  ),
  custom: (
    <>
      <path d="M8 7l-5 5 5 5" />
      <path d="M16 7l5 5-5 5" />
      <path d="M14 4l-4 16" />
    </>
  ),
};

export function ServiceIcon({ slug, size = 28 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-accent-light flex-none">
      {ICONS[slug]}
    </svg>
  );
}
