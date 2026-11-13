"use client";

import { useTheme } from "@/lib/theme";

export function SunIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  );
}

// Sun/moon button in the nav pill. Shows the sun in dark mode (switch to light) and the moon in light mode.
export default function ThemeButton({ className = "" }) {
  const [theme, setTheme] = useTheme();
  const dark = theme !== "light";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={`w-9 h-9 flex-none rounded-full border border-border-2 bg-transparent text-muted-2 inline-flex items-center justify-center cursor-pointer p-0 transition-colors duration-200 hover:text-fg hover:border-fg ${className}`}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

// Dark / Light segmented control for the mobile sheet.
export function ThemeSegment() {
  const [theme, setTheme] = useTheme();
  const opt = (value, label) => {
    const on = theme === value;
    return (
      <button
        type="button"
        aria-pressed={on}
        onClick={() => setTheme(value)}
        className={`min-h-11 min-w-[76px] px-[18px] rounded-full border-0 text-sm font-medium cursor-pointer ${
          on ? "bg-fg text-bg" : "bg-transparent text-muted-2"
        }`}
      >
        {label}
      </button>
    );
  };
  return (
    <div role="group" aria-label="Appearance" className="inline-flex gap-1 p-1 border border-border-2 rounded-full">
      {opt("dark", "Dark")}
      {opt("light", "Light")}
    </div>
  );
}
