"use client";

import { useEffect, useState } from "react";

const WORDS = ["Design", "Build", "Automate"];

// Full-screen intro on the first Home visit of a session (about 2.2s, then fades over .6s).
// The root layout's head script marks <html data-seen> on repeat visits, and CSS hides the loader before paint.
export default function Loader() {
  const [n, setN] = useState(0);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (html.dataset.seen || still) {
      html.dataset.seen = "1";
      return;
    }
    let count = 0;
    const timers = [];
    const t = setInterval(() => {
      count += 1;
      setN(count);
      if (count >= 100) {
        clearInterval(t);
        timers.push(setTimeout(() => setFading(true), 250));
        timers.push(
          setTimeout(() => {
            html.dataset.seen = "1";
            setGone(true);
          }, 900)
        );
      }
    }, 22);
    return () => {
      clearInterval(t);
      timers.forEach(clearTimeout);
    };
  }, []);

  if (gone) return null;
  const word = WORDS[Math.min(2, Math.floor(n / 34))];
  return (
    <div
      aria-hidden="true"
      className={`site-loader fixed inset-0 z-[9999] bg-bg flex items-center justify-center transition-opacity duration-[600ms] ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute top-8 left-9 eyebrow">Klyvora</div>
      <div key={word} className="text-center font-display italic text-[clamp(44px,6vw,76px)] text-[rgba(var(--fg-rgb),.85)] animate-role-fade">
        {word}
      </div>
      <div className="absolute bottom-[52px] right-10 font-display text-[clamp(72px,10vw,130px)] leading-none text-fg tabular-nums">
        {n}
      </div>
      <div className="absolute bottom-0 inset-x-0 h-[3px] bg-border">
        <div
          className="h-full bg-gradient-to-r from-accent-light to-accent shadow-[0_0_8px_rgba(78,133,191,.5)] transition-[width] duration-100 ease-linear"
          style={{ width: `${n}%` }}
        />
      </div>
    </div>
  );
}
