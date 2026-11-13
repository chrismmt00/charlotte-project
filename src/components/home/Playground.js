"use client";

import { useEffect, useRef } from "react";

const LEFT = [
  { r: -4, bg: "conic-gradient(from 120deg at 60% 40%, rgba(137,170,204,.4), var(--bg-deep) 45%), var(--bg-deep)" },
  {
    r: 3,
    bg: "repeating-linear-gradient(45deg, rgba(137,170,204,.1) 0 3px, transparent 3px 16px), radial-gradient(70% 70% at 70% 80%, rgba(78,133,191,.35), transparent 60%), var(--bg-deep)",
  },
  {
    r: -2,
    bg: "radial-gradient(50% 50% at 50% 50%, rgba(137,170,204,.3), transparent 70%), repeating-radial-gradient(circle at 50% 50%, rgba(78,133,191,.12) 0 2px, transparent 2px 18px), var(--bg-deep)",
  },
];
const RIGHT = [
  { r: 3, bg: "radial-gradient(80% 100% at 20% 10%, rgba(78,133,191,.4), transparent 55%), var(--bg-deep)" },
  {
    r: -3,
    bg: "conic-gradient(from 300deg at 30% 70%, rgba(137,170,204,.35), var(--bg-deep) 40%), repeating-linear-gradient(90deg, rgba(137,170,204,.06) 0 1px, transparent 1px 10px), var(--bg-deep)",
  },
  {
    r: 2,
    bg: "linear-gradient(135deg, rgba(137,170,204,.18), transparent 60%), repeating-linear-gradient(0deg, rgba(78,133,191,.1) 0 1px, transparent 1px 14px), var(--bg-deep)",
  },
];

function Column({ tiles, side, colRef }) {
  return (
    <div
      ref={colRef}
      aria-hidden="true"
      className={`absolute top-1/2 z-[2] flex flex-col gap-11 pointer-events-none will-change-transform ${side === "left" ? "left-[5vw]" : "right-[5vw]"}`}
      style={{ transform: "translateY(-300px)" }}
    >
      {tiles.map((t, i) => (
        <div
          key={i}
          className="w-[min(260px,22vw)] aspect-square rounded-card border border-border"
          style={{ transform: `rotate(${t.r}deg)`, background: t.bg }}
        />
      ))}
    </div>
  );
}

// 260vh section with a 100vh sticky inner; left tiles rise and right tiles sink with scroll progress.
export default function Playground() {
  const section = useRef(null);
  const left = useRef(null);
  const right = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = section.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
      const travel = vh * 0.9;
      if (left.current) left.current.style.transform = `translateY(${Math.round((0.5 - p) * travel - 300)}px)`;
      if (right.current) right.current.style.transform = `translateY(${Math.round((p - 0.5) * travel - 300)}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={section} aria-labelledby="playground-h" className="relative h-[260vh] bg-bg">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        <div className="relative z-[1] text-center max-w-[560px] px-6">
          <div className="flex items-center gap-3 mb-[18px] justify-center">
            <span aria-hidden="true" className="w-8 h-px bg-border-2" />
            <span className="eyebrow">Explorations</span>
            <span aria-hidden="true" className="w-8 h-px bg-border-2" />
          </div>
          <h2 id="playground-h" className="font-normal text-[clamp(36px,5vw,58px)] leading-[1.05] m-0 mb-3.5 tracking-[-.01em]">
            Visual <em className="font-display font-normal">playground</em>
          </h2>
          <p className="text-muted text-[15px] leading-[1.6] m-0">Off-hours experiments in motion, interface and AI-generated form. Keep scrolling.</p>
        </div>
        <Column tiles={LEFT} side="left" colRef={left} />
        <Column tiles={RIGHT} side="right" colRef={right} />
      </div>
    </section>
  );
}
