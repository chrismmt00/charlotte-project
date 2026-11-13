"use client";

import { useEffect, useState } from "react";

// Swaps the word every 2.2s with a fade and 10px rise. Frozen under reduced motion.
export default function RotatingWord({ words }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2200);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <span className="inline-block min-w-[2ch] text-fg">
      <span key={i} className="inline-block animate-role-fade">
        {words[i]}
      </span>
    </span>
  );
}
