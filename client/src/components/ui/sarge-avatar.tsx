/**
 * SARGEAvatar — gold-tinted Trinity arms.
 * Visually distinct from Trinity (purple) so users know who they're talking to.
 * Same three-arm shape, gold color palette.
 */

import { cn } from "@/lib/utils";

const ARM = "M60 43 C55 34,53 19,60 6 C67 19,65 34,60 43 Z";

interface SARGEAvatarProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function SARGEAvatar({ size = 28, className, animate = false }: SARGEAvatarProps) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-label="SARGE"
      role="img"
    >
      {/* All three arms in CoAIleague gold */}
      <path d={ARM} fill="#F59E0B" opacity="0.92">
        {animate && <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>}
      </path>
      <g transform="rotate(120 60 60)">
        <path d={ARM} fill="#FBBF24" opacity="0.88">
          {animate && <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" begin="0.5s" repeatCount="indefinite"/>}
        </path>
      </g>
      <g transform="rotate(240 60 60)">
        <path d={ARM} fill="#FCD34D" opacity="0.85">
          {animate && <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" begin="1s" repeatCount="indefinite"/>}
        </path>
      </g>
      {/* Gold core */}
      <circle cx="60" cy="60" r="9" fill="#FEF3C7" opacity="0.95" />
      <circle cx="58" cy="58" r="4" fill="white" opacity="0.8" />
    </svg>
  );
}
