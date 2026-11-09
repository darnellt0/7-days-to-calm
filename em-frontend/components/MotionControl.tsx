"use client";

import { useEffect, useState } from "react";

export function useAmbientMotion() {
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    try { setPaused(localStorage.getItem("em_motion_paused") === "true"); }
    catch { setPaused(true); }
    setReady(true);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  function toggle() {
    const next = !paused;
    setPaused(next);
    try { localStorage.setItem("em_motion_paused", String(next)); }
    catch { /* The preference still applies for this visit. */ }
  }

  return { enabled: ready && !reduced && !paused, ready, reduced, toggle };
}

export default function MotionControl({ enabled, ready, reduced, onToggle }: {
  enabled: boolean;
  ready: boolean;
  reduced: boolean;
  onToggle: () => void;
}) {
  const label = reduced ? "Motion reduced" : enabled ? "Pause motion" : "Play motion";
  return <button className="motion-control" disabled={!ready || reduced} onClick={onToggle}
    title={reduced ? "Your device is set to reduce motion" : label}>
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      {enabled ? <><rect x="3" y="2" width="3" height="12" rx="1" /><rect x="10" y="2" width="3" height="12" rx="1" /></> : <path d="M4 2.5v11L13 8z" />}
    </svg>
    <span className="sr-only">{label}</span>
  </button>;
}
