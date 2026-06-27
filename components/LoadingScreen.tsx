"use client";

import { useEffect, useState } from "react";
import { useBudget } from "@/lib/store";

// Aperture mark as three arcs (matches the logo) so each can draw in.
const rad = (d: number) => (d * Math.PI) / 180;
// Round coordinates so the server (Node) and client (Chrome) emit byte-identical
// path strings — raw Math.sin/cos differ in the last fp digit and trip hydration.
const pt = (n: number) => Number(n.toFixed(3));
const arc = (a1: number, a2: number, r = 44, cx = 60, cy = 60) =>
  `M ${pt(cx + r * Math.cos(rad(a1)))} ${pt(cy + r * Math.sin(rad(a1)))} A ${r} ${r} 0 0 1 ${pt(
    cx + r * Math.cos(rad(a2)),
  )} ${pt(cy + r * Math.sin(rad(a2)))}`;
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
    // Hold the drawn logo (~0.7s draw) a beat, then run a *sequenced* exit:
    // the veil fades fully out first, and only then does the app fade in — so
    // the logo is gone before content appears, never overlapping.
    const HOLD = 980; // min veil time (0.28s pause + 0.7s draw + 0s hold)
    const VEIL_FADE = 340; // matches the .bf-loading opacity transition (0.32s)
    let revealed = false;
    let minPassed = false;
    let t2 = 0;
    let t3 = 0;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setFade(true); // 1) veil starts fading out
      t2 = window.setTimeout(() => {
        // 2) veil is gone — now let the app fade in (staggered via [data-loaded])
        document.documentElement.dataset.loaded = "true";
        t3 = window.setTimeout(() => setShow(false), 80);
      }, VEIL_FADE);
    };
    const maybe = () => {
      if (minPassed && useBudget.getState().hasHydrated) reveal();
    };
    const minT = window.setTimeout(() => {
      minPassed = true;
      maybe();
    }, HOLD);
    const unsub = useBudget.subscribe(maybe);
    const cap = window.setTimeout(reveal, 2800);
    return () => {
      window.clearTimeout(minT);
      window.clearTimeout(cap);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
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
