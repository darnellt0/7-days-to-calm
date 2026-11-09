import type { ReactNode } from "react";

// Small, static illustrations reinforce the written theme without adding controls.
const motifs: ReactNode[] = [
  <g key="arrive"><circle cx="32" cy="24" r="5" /><path d="M20 34c-12 3-10 10 12 10s24-7 12-10M14 42c-13 5-5 12 18 12s31-7 18-12" /></g>,
  <g key="exhale"><path d="M10 22h27c14 0 14-14 4-14-5 0-7 3-7 6M10 32h39c13 0 13 17 2 17-5 0-7-3-7-6M10 42h15c12 0 12 14 3 14" /></g>,
  <g key="body"><circle cx="32" cy="14" r="6" /><path d="M23 53l2-17-8 8M41 53l-2-17 8 8M25 28c0-7 14-7 14 0v9M32 29v24" /><path d="M11 18h7M46 18h7M10 29h7M47 29h7" /></g>,
  <g key="thoughts"><path d="M17 37a9 9 0 0 1 0-18 13 13 0 0 1 25-3 10 10 0 1 1 4 21H17Z" /><path d="M18 47h28M25 55h14" /></g>,
  <g key="box"><rect x="13" y="13" width="38" height="38" rx="9" /><path d="M24 23h16v18H24Z" /><circle cx="13" cy="32" r="3" fill="currentColor" stroke="none" /><circle cx="51" cy="32" r="3" fill="currentColor" stroke="none" /></g>,
  <g key="awareness"><circle cx="32" cy="32" r="10" /><path d="M32 7v9M32 48v9M7 32h9M48 32h9M14 14l6 6M44 44l6 6M14 50l6-6M44 20l6-6" /></g>,
  <g key="integration"><circle cx="24" cy="32" r="16" /><circle cx="40" cy="32" r="16" /><path d="m26 32 4 4 9-9" /></g>,
];

export default function PracticeSymbol({ day, className = "" }: { day: number; className?: string }) {
  return <svg className={`practice-symbol ${className}`} aria-hidden="true" focusable="false" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{motifs[day - 1] ?? motifs[0]}</svg>;
}
