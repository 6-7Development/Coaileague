/**
 * HeroBadge — Officer of the Month / Year Award Display
 * ─────────────────────────────────────────────────────────────────────────────
 * Displayed on:
 *   - Officer profile page
 *   - ChatDock shift room header (when current winner)
 *   - Honor Roll public page
 *   - Employee shift card (small badge variant)
 *
 * Award is system-selected by CoAIleague platform based on enduser score.
 * Score floor: 85 (favorable+) maintained for 6 months (monthly) or 12 months (yearly).
 * No nominations, no voting — pure meritocracy from performance data.
 */
import { cn } from "@/lib/utils";
import { Star, Award, Shield } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type HeroBadgeVariant = "officer_of_month" | "officer_of_year";
export type HeroBadgeSize = "xs" | "sm" | "md" | "lg";

interface HeroBadgeProps {
  variant: HeroBadgeVariant;
  periodLabel: string;   // "2026-05" or "2026"
  officerName?: string;
  size?: HeroBadgeSize;
  showLabel?: boolean;
  className?: string;
}

const SIZE_CONFIG: Record<HeroBadgeSize, { icon: string; wrap: string; text: string; star: string }> = {
  xs: { icon: "w-3 h-3", wrap: "h-5 px-1.5 gap-1", text: "text-[10px]", star: "w-2.5 h-2.5" },
  sm: { icon: "w-4 h-4", wrap: "h-6 px-2 gap-1.5", text: "text-xs",    star: "w-3 h-3"   },
  md: { icon: "w-5 h-5", wrap: "h-8 px-3 gap-2",   text: "text-sm",    star: "w-3.5 h-3.5" },
  lg: { icon: "w-7 h-7", wrap: "h-12 px-4 gap-2.5", text: "text-base", star: "w-4 h-4"   },
};

export function HeroBadge({
  variant,
  periodLabel,
  officerName,
  size = "sm",
  showLabel = true,
  className,
}: HeroBadgeProps) {
  const sz = SIZE_CONFIG[size];
  const isYearly = variant === "officer_of_year";

  const label = isYearly ? `Officer of the Year ${periodLabel}` : `Officer of the Month`;
  const sublabel = isYearly
    ? "Top-performing officer of the year — earned by meritocracy"
    : `Highest-scoring officer for ${periodLabel} — CoAIleague Honor Roll`;

  const gradientClass = isYearly
    ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
    : "bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600";

  const iconClass = isYearly ? "text-amber-900" : "text-violet-50";
  const Icon = isYearly ? Award : Star;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center rounded-full font-semibold shadow-sm cursor-default select-none",
              gradientClass,
              sz.wrap,
              className
            )}
            role="img"
            aria-label={label}
          >
            {/* Animated shimmer for yearly */}
            {isYearly && (
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
              </div>
            )}
            <Icon className={cn(sz.icon, iconClass)} />
            {showLabel && (
              <span className={cn(sz.text, iconClass, "font-bold tracking-tight whitespace-nowrap")}>
                {isYearly ? "Officer of the Year" : "Officer of the Month"}
              </span>
            )}
            {/* Decorative stars for yearly */}
            {isYearly && size !== "xs" && (
              <Star className={cn(sz.star, "text-amber-900 fill-amber-900")} />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-semibold">{label}</p>
          {officerName && <p className="text-muted-foreground text-xs mt-0.5">{officerName}</p>}
          <p className="text-xs mt-1 text-muted-foreground">{sublabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Compact shield variant for ChatDock room headers */
export function HeroShield({
  variant,
  periodLabel,
  size = "xs",
}: Pick<HeroBadgeProps, "variant" | "periodLabel" | "size">) {
  const sz = SIZE_CONFIG[size];
  const isYearly = variant === "officer_of_year";
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        isYearly ? "bg-amber-500/20 text-amber-500" : "bg-violet-500/20 text-violet-500",
        sz.wrap
      )}
      title={isYearly ? `Officer of the Year ${periodLabel}` : `Officer of the Month ${periodLabel}`}
    >
      <Shield className={sz.icon} />
    </div>
  );
}
