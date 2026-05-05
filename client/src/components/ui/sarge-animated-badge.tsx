/**
 * SargeAnimatedBadge — SARGE's visual identity component
 * ─────────────────────────────────────────────────────────────────────────────
 * Three gold sergeant chevrons that animate based on SARGE's operational state.
 * Geometry: three upward-pointing V-shapes stacked vertically — actual military
 * E-5 Sergeant rank insignia, not Trinity's arms in gold.
 *
 * STATES:
 *   idle         → chevrons sit solid, slow amber pulse (at ease)
 *   listening    → chevrons spread apart, glow brightens at tips
 *   deliberating → chevrons dissolve upward (consulting Trinity), brief
 *                  purple wash on the particles, reform in gold
 *   executing    → heartbeat pulse ring radiates from chevrons on each beat
 *   warning      → chevrons briefly invert (point down), red-amber flash, snap back
 *   confirmed    → single sharp gold flash, chevrons lock solid, settle to idle
 *
 * SIZES: 20px (typing bubble), 32px (message avatar), 64px (ThoughtBar)
 * At 20px: simplified to 2 thick strokes. At 32px+: full chevron geometry.
 *
 * DESIGN RULES:
 *   - Never spin (Trinity orbits, SARGE does not rotate)
 *   - Motion axis is always vertical (rank flows upward)
 *   - Three chevrons always readable — never merge into one shape
 *   - Gold palette: amber-400 rest, amber-300 peak, amber-600 shadow
 *   - Color shift only during deliberation (→ purple) and warning (→ red-amber)
 */

import { cn } from "@/lib/utils";

export type SargeState =
  | "idle"
  | "listening"
  | "deliberating"
  | "executing"
  | "warning"
  | "confirmed";

interface SargeAnimatedBadgeProps {
  state?: SargeState;
  size?: number;
  className?: string;
}

// Chevron path for a single V-shape at a given vertical position
// Each chevron is a V pointing upward, centered at x=60
function chevronPath(midY: number, height = 10, width = 32): string {
  const half = width / 2;
  const top = midY - height;
  return `M${60 - half} ${midY} L60 ${top} L${60 + half} ${midY}`;
}

// Animation duration constants (ms converted to s for SVG)
const DUR = {
  idlePulse:    "3s",
  listenSpread: "0.4s",
  executeBeat:  "0.6s",
  warnFlash:    "0.5s",
  confirmFlash: "0.08s",
  deliberate:   "1.8s",
};

export function SargeAnimatedBadge({
  state = "idle",
  size = 32,
  className,
}: SargeAnimatedBadgeProps) {
  const uid = `sarge-${size}-${state}`;

  // At 20px, simplified 2-stroke rendering
  const simplified = size <= 22;

  // Color mapping per state
  const colors = {
    idle:        { primary: "#F59E0B", glow: "#FCD34D", shadow: "#D97706" },
    listening:   { primary: "#FBBF24", glow: "#FDE68A", shadow: "#F59E0B" },
    deliberating:{ primary: "#A78BFA", glow: "#C4B5FD", shadow: "#7C3AED" }, // purple during consult
    executing:   { primary: "#F59E0B", glow: "#FEF3C7", shadow: "#92400E" },
    warning:     { primary: "#EF4444", glow: "#FCA5A5", shadow: "#B91C1C" }, // red-amber
    confirmed:   { primary: "#FEF3C7", glow: "#FFFFFF", shadow: "#F59E0B" },
  };
  const c = colors[state];

  // Chevron vertical positions in the 120×120 viewBox
  const yPositions = simplified ? [52, 68] : [42, 58, 74];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-label={`SARGE — ${state}`}
      role="img"
    >
      <defs>
        {/* Glow filter */}
        <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Pulse ring gradient */}
        <radialGradient id={`${uid}-ring`} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor={c.glow} stopOpacity="0.6" />
          <stop offset="100%" stopColor={c.glow} stopOpacity="0" />
        </radialGradient>

        {/* Sharp confirm flash gradient */}
        <radialGradient id={`${uid}-flash`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor={c.primary} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── PULSE RING (executing state) ─────────────────────────────── */}
      {state === "executing" && (
        <circle cx="60" cy="58" r="35" fill={`url(#${uid}-ring)`} opacity="0">
          <animate attributeName="r"       values="20;50;20"     dur={DUR.executeBeat} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.7;0"      dur={DUR.executeBeat} repeatCount="indefinite" />
        </circle>
      )}

      {/* ── DELIBERATION PARTICLES (dissolve upward → reform) ─────────── */}
      {state === "deliberating" && [0, 1, 2, 3, 4, 5].map(i => (
        <circle
          key={i}
          cx={50 + i * 4}
          cy={58}
          r="3"
          fill={i % 2 === 0 ? "#A78BFA" : "#F59E0B"}
          opacity="0"
        >
          <animate
            attributeName="cy"
            values={`58;${20 + i * 3};58`}
            dur={DUR.deliberate}
            begin={`${i * 0.08}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.9;0"
            dur={DUR.deliberate}
            begin={`${i * 0.08}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* ── CONFIRM FLASH ────────────────────────────────────────────── */}
      {state === "confirmed" && (
        <circle cx="60" cy="58" r="50" fill={`url(#${uid}-flash)`} opacity="0">
          <animate attributeName="opacity" values="0;0.95;0" dur={DUR.confirmFlash} repeatCount="1" />
        </circle>
      )}

      {/* ── CHEVRONS ──────────────────────────────────────────────────── */}
      {yPositions.map((y, idx) => {
        const strokeW = simplified ? 5 : 4.5 - idx * 0.3;

        // Warning: chevrons invert (point down) briefly then snap back
        const warningPath = state === "warning"
          ? chevronPath(120 - y, 10, 32)
          : chevronPath(y, 10, 32);

        // Listening: chevrons spread apart (increase gap)
        const listenY = state === "listening"
          ? y + (idx - 1) * 4
          : y;

        const finalPath = state === "warning"
          ? warningPath
          : chevronPath(listenY, 10, simplified ? 28 : 32);

        return (
          <path
            key={idx}
            d={finalPath}
            stroke={c.primary}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${uid}-glow)`}
          >
            {/* IDLE: slow amber breathe */}
            {state === "idle" && (
              <animate
                attributeName="opacity"
                values="0.75;1;0.75"
                dur={DUR.idlePulse}
                begin={`${idx * 0.4}s`}
                repeatCount="indefinite"
              />
            )}

            {/* EXECUTING: heartbeat opacity sync with ring */}
            {state === "executing" && (
              <animate
                attributeName="opacity"
                values="1;0.6;1"
                dur={DUR.executeBeat}
                begin={`${idx * 0.05}s`}
                repeatCount="indefinite"
              />
            )}

            {/* DELIBERATING: fade out while particles dissolve */}
            {state === "deliberating" && (
              <animate
                attributeName="opacity"
                values="1;0.15;1"
                dur={DUR.deliberate}
                repeatCount="indefinite"
              />
            )}

            {/* WARNING: flash red then snap gold */}
            {state === "warning" && (
              <animate
                attributeName="stroke"
                values={`${c.primary};#EF4444;${c.primary}`}
                dur={DUR.warnFlash}
                repeatCount="indefinite"
              />
            )}

            {/* CONFIRMED: bright flash */}
            {state === "confirmed" && (
              <animate
                attributeName="opacity"
                values="0.4;1;0.9"
                dur={DUR.confirmFlash}
                repeatCount="1"
                fill="freeze"
              />
            )}

            {/* LISTENING: tip glow intensifies */}
            {state === "listening" && (
              <animate
                attributeName="stroke"
                values={`${c.primary};${c.glow};${c.primary}`}
                dur="1.2s"
                begin={`${idx * 0.15}s`}
                repeatCount="indefinite"
              />
            )}
          </path>
        );
      })}

      {/* ── RANK PIP (center dot — the "reporting to Trinity" marker) ── */}
      <circle
        cx="60"
        cy="58"
        r={simplified ? 2.5 : 3.5}
        fill={state === "deliberating" ? "#A78BFA" : "#FEF3C7"}
        opacity={state === "idle" ? 0.7 : 0.95}
      >
        {state === "deliberating" && (
          <animate attributeName="fill" values="#F59E0B;#A78BFA;#F59E0B" dur={DUR.deliberate} repeatCount="indefinite" />
        )}
      </circle>
    </svg>
  );
}

// ── Static variant (no animation — for lists, headers, non-chat contexts) ────

export function SargeStaticBadge({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <SargeAnimatedBadge state="idle" size={size} className={className} />
  );
}
