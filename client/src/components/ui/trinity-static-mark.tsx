/**
 * TrinityStaticMark — canonical static Trinity orbital arms.
 * Three sizes only: sm (20px), md (32px), lg (48px).
 *
 * REPLACES: CoAIleagueAFLogo, CoAIleagueLogo, CoAIleagueStaticLogo,
 *           UnifiedBrandLogo, WFLogo, LogoMark, CoAIleagueLogoMark wrappers.
 *
 * USAGE:
 *   Header/chrome:       <TrinityStaticMark size="sm" />   ← 20px, no animation
 *   Login/auth pages:    <TrinityStaticMark size="md" />   ← 32px
 *   Brand/marketing:     <TrinityStaticMark size="lg" />   ← 48px
 *
 * For the animated version with halo, use TrinityOrbitalAvatar.
 * For full loading screens, use LoadingScreen.
 */

import { cn } from "@/lib/utils";

const ARM = "M60 43 C55 34,53 19,60 6 C67 19,65 34,60 43 Z";

const SIZES = { sm: 20, md: 32, lg: 48 } as const;

interface TrinityStaticMarkProps {
  size?: keyof typeof SIZES | number;
  className?: string;
  /** Optional opacity override (default 0.9) */
  opacity?: number;
}

export function TrinityStaticMark({ size = "md", className, opacity = 0.9 }: TrinityStaticMarkProps) {
  const px = typeof size === "number" ? size : SIZES[size];
  return (
    <svg
      width={px} height={px}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-label="CoAIleague"
      role="img"
    >
      {/* Arm — blue — 12 o'clock */}
      <path d={ARM} fill="#93C5FD" opacity={opacity} />
      <circle cx="60" cy="6" r="3.5" fill="#93C5FD" opacity={opacity} />
      {/* Arm — gold — 4 o'clock */}
      <g transform="rotate(120 60 60)">
        <path d={ARM} fill="#FED7AA" opacity={opacity} />
        <circle cx="60" cy="6" r="3.5" fill="#FED7AA" opacity={opacity} />
      </g>
      {/* Arm — purple — 8 o'clock */}
      <g transform="rotate(240 60 60)">
        <path d={ARM} fill="#C4B5FD" opacity={opacity} />
        <circle cx="60" cy="6" r="3.5" fill="#C4B5FD" opacity={opacity} />
      </g>
      {/* Core */}
      <circle cx="60" cy="60" r="9" fill="white" opacity={0.92} />
    </svg>
  );
}

// ── Convenience exports for specific use cases ────────────────────────────────

/** 20px static mark — for the top chrome header */
export function HeaderMark({ className }: { className?: string }) {
  return <TrinityStaticMark size="sm" className={className} />;
}

/** 32px static mark — for login / auth pages */
export function BrandMark({ className }: { className?: string }) {
  return <TrinityStaticMark size="md" className={className} />;
}

// ── Legacy aliases (keep for backward compat, all render the same thing) ─────
export { TrinityStaticMark as CoAIleagueLogoMark };
export { TrinityStaticMark as TrinityLogo };
export { TrinityStaticMark as LogoMark };
export { TrinityStaticMark as CoAIleagueAFLogo };
export { TrinityStaticMark as CoAIleagueLogo };
export { TrinityStaticMark as CoAIleagueStaticLogo };
export { TrinityStaticMark as UnifiedBrandLogo };
export { TrinityStaticMark as HeaderLogo };
export { TrinityStaticMark as LoginLogo };
export { TrinityStaticMark as FooterLogo };
export { TrinityStaticMark as IconLogo };
export { TrinityStaticMark as WFLogo };
