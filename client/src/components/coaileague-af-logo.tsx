import { cn } from "@/lib/utils";
import { logoConfig, getLogoSize } from "@/config/logoConfig";
import { Sparkles } from "lucide-react";

interface CoAIleagueAFLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  variant?: "icon" | "full" | "wordmark";
  animated?: boolean;
  className?: string;
}

/**
 * CoAIleague Gradient Logo - Professional AI-themed gradient badge
 * Uses Sparkles icon instead of text for cleaner branding
 */
export function CoAIleagueAFLogo({
  size = "md",
  variant = "icon",
  animated = true,
  className,
}: CoAIleagueAFLogoProps) {
  const sizeConfig = getLogoSize(size);

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
    hero: "h-8 w-8",
  };

  if (variant === "wordmark") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="font-black text-slate-900 dark:text-white text-xl">
          {logoConfig.brand.name}
        </span>
        <span className="text-xs align-super text-slate-900 dark:text-white">
          {logoConfig.brand.trademark}
        </span>
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center",
          "rounded-full",
          "bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600",
          "shadow-lg border border-cyan-300/30",
          "group hover:shadow-xl hover:shadow-cyan-500/30 transition-shadow",
          sizeConfig.container,
          className
        )}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-40 bg-gradient-to-tr from-cyan-300 to-transparent transition-opacity duration-500 rounded-full blur-lg" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-40" />
        <Sparkles className={cn("relative text-white z-10", iconSizes[size])} />
      </div>
    );
  }

  // Full variant with text
  return (
    <div className={cn("flex items-center gap-3 md:gap-4", className)}>
      <div
        className={cn(
          "relative inline-flex items-center justify-center shrink-0",
          "rounded-full",
          "bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600",
          "shadow-lg border border-cyan-300/30",
          "group hover:shadow-xl hover:shadow-cyan-500/30 transition-all",
          sizeConfig.container,
        )}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-40 bg-gradient-to-tr from-cyan-300 to-transparent transition-opacity duration-500 rounded-full blur-lg" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-40" />
        <Sparkles className={cn("relative text-white z-10", iconSizes[size])} />
      </div>

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-baseline gap-1 md:gap-2 flex-wrap">
          <span className="font-black text-slate-900 dark:text-white text-lg md:text-2xl truncate">
            {logoConfig.brand.name}
          </span>
          <span className="text-xs text-slate-900 dark:text-white">™</span>
        </div>
        <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
          {logoConfig.brand.taglineAlt}
        </p>
      </div>
    </div>
  );
}

export { CoAIleagueAFLogo as AnimatedCoAIleagueLogo };
