"use client";

import { useEffect, useState } from "react";
import { useBudget } from "@/lib/store";

// Aperture mark as three arcs (matches the logo) so each can draw in.
const rad = (d: number) => (d * Math.PI) / 180;
const arc = (a1: number, a2: number, r = 44, cx = 60, cy = 60) =>
  `M ${cx + r * Math.cos(rad(a1))} ${cy + r * Math.sin(rad(a1))} A ${r} ${r} 0 0 1 ${
    cx + r * Math.cos(rad(a2))
  } ${cy + r * Math.sin(rad(a2))}`;
const ARCS = [0, 1, 2].map((i) => arc(-90 + i * 120 + 12, -90 + i * 120 + 108));

/**
 * Full-screen loading veil: the aperture arcs draw in, then the veil fades and
 * the app reveals with a light stagger (via html[data-loaded]). Shows for at
 * least the draw duration, waits for hydration, and hard-caps so it never sticks.
 */
export default function LoadingScreen() {
  const [fade, setFade] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    let revealed = false;
    let minPassed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      document.documentElement.dataset.loaded = "true";
      setFade(true);
      window.setTimeout(() => setShow(false), 360);
    };
    const maybe = () => {
      if (minPassed && useBudget.getState().hasHydrated) reveal();
    };
    const minT = window.setTimeout(() => {
      minPassed = true;
      maybe();
    }, 820);
    const unsub = useBudget.subscribe(maybe);
    const cap = window.setTimeout(reveal, 2500);
    return () => {
      window.clearTimeout(minT);
      window.clearTimeout(cap);
      unsub();
    };
  }, []);

  if (!show) return null;
  return (
    <div className={`bf-loading${fade ? " is-done" : ""}`} aria-hidden>
      <svg viewBox="0 0 120 120" className="bf-loading-mark">
        {ARCS.map((d, i) => (
          <path key={i} d={d} pathLength={100} className="bf-loading-arc" />
        ))}
      </svg>
    </div>
  );
}
