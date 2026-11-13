"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";

const LABELS = ["Order placed", "Kitchen ticket", "New lead", "AI reply sent", "Invoice paid", "Books updated"];
const SEEDS = [
  [0.14, 0.3],
  [0.3, 0.68],
  [0.5, 0.22],
  [0.66, 0.7],
  [0.84, 0.36],
  [0.78, 0.84],
];
const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 3],
  [2, 4],
  [0, 2],
];

// Hero background, back to front: gradient fallback, looping video, scrim, the "AI workflow" network canvas, bottom fade.
export default function HeroBackdrop() {
  const [theme] = useTheme();
  const light = theme === "light";
  const video = useRef(null);
  const canvas = useRef(null);
  const lightRef = useRef(light);

  useEffect(() => {
    lightRef.current = light;
  }, [light]);

  // Video: muted autoplay, paused off-screen and under reduced motion (the poster frame stays).
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.muted = true;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      el.pause();
      return;
    }
    const play = () => {
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : el.pause()), { threshold: 0 });
    io.observe(el);
    play();
    return () => io.disconnect();
  }, [light]);

  // Network: six pill nodes, thin edges, pulses travelling along edges; nodes drift and lean toward the cursor.
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = LABELS.map((label, i) => ({ label, fx: SEEDS[i][0], fy: SEEDS[i][1], ph: i * 1.3, x: 0, y: 0 }));
    const pulses = [];
    const mouse = { x: -9999, y: -9999 };
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let lastSpawn = 0;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    };
    const parent = c.parentElement;
    const onMove = (e) => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const draw = (ts) => {
      if (!still) raf = requestAnimationFrame(draw);
      if (!visible && !still) return;
      const t = ts / 1000;
      const pal = lightRef.current
        ? { line: "rgba(78,133,191,.3)", pill: "rgba(255,255,255,.94)", text: "#4a4a4a", pulse: "#4E85BF" }
        : { line: "rgba(137,170,204,.22)", pill: "rgba(16,18,22,.85)", text: "rgba(157,184,210,.75)", pulse: "#89AACC" };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      nodes.forEach((n) => {
        let x = n.fx * w + Math.sin(t * 0.35 + n.ph) * 14;
        let y = n.fy * h + Math.cos(t * 0.28 + n.ph) * 10;
        const dx = mouse.x - x;
        const dy = mouse.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist < 220 && dist > 0) {
          const k = (1 - dist / 220) * 18;
          x += (dx / dist) * k;
          y += (dy / dist) * k;
        }
        n.x = x;
        n.y = y;
      });
      ctx.lineWidth = 1;
      ctx.strokeStyle = pal.line;
      EDGES.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.stroke();
      });
      if (!still && ts - lastSpawn > 700) {
        lastSpawn = ts;
        const e = EDGES[Math.floor(Math.random() * EDGES.length)];
        pulses.push({ a: e[0], b: e[1], p: 0, sp: 0.004 + Math.random() * 0.004 });
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pu = pulses[i];
        pu.p += pu.sp * 16;
        if (pu.p >= 1) {
          pulses.splice(i, 1);
          continue;
        }
        const x = nodes[pu.a].x + (nodes[pu.b].x - nodes[pu.a].x) * pu.p;
        const y = nodes[pu.a].y + (nodes[pu.b].y - nodes[pu.a].y) * pu.p;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = pal.pulse;
        ctx.shadowColor = "#4E85BF";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.font = "11px Inter, sans-serif";
      ctx.textBaseline = "middle";
      nodes.forEach((n) => {
        const tw = ctx.measureText(n.label).width;
        const pw = tw + 30;
        const ph = 24;
        const x = n.x - pw / 2;
        const y = n.y - ph / 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, pw, ph, 12);
        else ctx.rect(x, y, pw, ph);
        ctx.fillStyle = pal.pill;
        ctx.fill();
        ctx.strokeStyle = pal.line;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + 11, n.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#4E85BF";
        ctx.fill();
        ctx.fillStyle = pal.text;
        ctx.fillText(n.label, x + 20, n.y + 0.5);
      });
    };

    resize();
    window.addEventListener("resize", resize);
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(c);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const src = light ? "/media/klyvora-hero-light.mp4" : "/media/klyvora-hero-dark.mp4";
  const poster = light ? "/media/klyvora-hero-light-poster.jpg" : "/media/klyvora-hero-dark-poster.jpg";

  return (
    <>
      <div
        aria-hidden="true"
        className="absolute -inset-[10%] opacity-90 animate-drift bg-[radial-gradient(45%_55%_at_30%_35%,rgba(78,133,191,.28),transparent_70%),radial-gradient(40%_50%_at_75%_65%,rgba(137,170,204,.18),transparent_65%),var(--bg)]"
      />
      <video
        key={src}
        ref={video}
        className="hero-video absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[rgba(var(--scrim-rgb),.35)]" />
      <canvas ref={canvas} aria-hidden="true" className="hero-canvas absolute inset-0 w-full h-full" />
      <div aria-hidden="true" className="absolute bottom-0 inset-x-0 h-[180px] bg-gradient-to-t from-bg to-transparent" />
    </>
  );
}
