/**
 * CoAIleagueLogoMark — the canonical CoAIleague brand mark.
 *
 * This is the Trinity Triquetra (three interlocking filled loops in teal /
 * cyan / blue gradients with a central glowing nexus). Matches the static
 * asset at `client/public/logo.svg` exactly, inlined as React so it can
 * be styled, sized, and animated per-instance without fetching an SVG.
 *
 * This is NOT:
 *   - `TrinityLogo` (the three-arrow Trinity sub-brand icon)
 *   - `TrinityMascotIcon` (the three-blob AI mascot flower)
 *
 * Those are Trinity-family marks used inside Trinity features. This file
 * is the platform-level CoAIleague brand mark used in splash screens,
 * loaders, and anywhere "the logo" is meant.
 *
 * `useId()` is used to namespace the SVG gradient/filter IDs so multiple
 * instances on the same page don't collide.
 */

import { useId } from "react";
import { cn } from "@/lib/utils";

interface CoAIleagueLogoMarkProps {
  size?: number | string;
  className?: string;
}

export function CoAIleagueLogoMark({
  size = 64,
  className,
}: CoAIleagueLogoMarkProps) {
  const reactId = useId();
  const id = {
    teal: `coai-teal-${reactId}`,
    cyan: `coai-cyan-${reactId}`,
    blue: `coai-blue-${reactId}`,
    core: `coai-core-${reactId}`,
    glow: `coai-glow-${reactId}`,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      data-testid="coaileague-logo-mark"
    >
      <defs>
        <linearGradient id={id.teal} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id={id.cyan} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={id.blue} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <radialGradient id={id.core} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.5" />
        </radialGradient>
        <filter id={id.glow} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Loop 1 — Top (Teal) */}
      <path
        d="M 50 12 C 70 12, 82 30, 82 48 C 82 58, 72 70, 50 50 C 28 70, 18 58, 18 48 C 18 30, 30 12, 50 12 Z"
        fill={`url(#${id.teal})`}
        opacity="0.9"
        filter={`url(#${id.glow})`}
      />

      {/* Loop 2 — Bottom Left (Cyan) */}
      <path
        d="M 22 80 C 10 68, 10 48, 22 36 C 32 26, 48 32, 50 50 C 42 64, 30 76, 22 80 C 32 92, 48 90, 50 78 Z"
        fill={`url(#${id.cyan})`}
        opacity="0.85"
        filter={`url(#${id.glow})`}
      />

      {/* Loop 3 — Bottom Right (Blue) */}
      <path
        d="M 78 80 C 90 68, 90 48, 78 36 C 68 26, 52 32, 50 50 C 58 64, 70 76, 78 80 C 68 92, 52 90, 50 78 Z"
        fill={`url(#${id.blue})`}
        opacity="0.85"
        filter={`url(#${id.glow})`}
      />

      {/* Central nexus */}
      <circle
        cx="50"
        cy="50"
        r="10"
        fill={`url(#${id.core})`}
        filter={`url(#${id.glow})`}
      />
      <circle cx="50" cy="50" r="5" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}

export default CoAIleagueLogoMark;
