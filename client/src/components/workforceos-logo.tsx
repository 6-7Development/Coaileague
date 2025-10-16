import { cn } from "@/lib/utils";

interface WorkforceOSLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  showText?: boolean;
  className?: string;
}

/**
 * WorkforceOS Wordmark Logo - Fortune 500 Grade
 * Iconic "W" letterform design - bold, geometric, memorable
 * Like Dollar General's "DG" or McDonald's golden arches
 */
export function WorkforceOSLogo({ 
  size = "md", 
  showText = true,
  className 
}: WorkforceOSLogoProps) {
  const uniqueId = Math.random().toString(36).substr(2, 9);
  
  const sizes = {
    sm: {
      container: "w-10 h-10",
      text: "text-sm",
      tagline: "text-[8px]"
    },
    md: {
      container: "w-16 h-16",
      text: "text-lg",
      tagline: "text-[10px]"
    },
    lg: {
      container: "w-24 h-24",
      text: "text-2xl",
      tagline: "text-xs"
    },
    xl: {
      container: "w-32 h-32",
      text: "text-3xl",
      tagline: "text-sm"
    },
    hero: {
      container: "w-48 h-48",
      text: "text-5xl",
      tagline: "text-base"
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Iconic "W" Logo - Bold Geometric Letterform */}
      <div 
        className={cn(
          "relative flex items-center justify-center",
          sizes[size].container
        )}
        data-testid="logo-icon"
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Premium emerald gradient */}
            <linearGradient id={`emerald-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            
            {/* Glow effect for premium feel */}
            <filter id={`glow-${uniqueId}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Bold "W" - Geometric, Modern, Iconic */}
          <g filter={`url(#glow-${uniqueId})`}>
            {/* Outer circle/badge background */}
            <circle 
              cx="60" 
              cy="60" 
              r="54" 
              fill="none"
              stroke={`url(#emerald-${uniqueId})`}
              strokeWidth="4"
              opacity="0.3"
            />
            
            {/* The "W" - Bold geometric design */}
            <path
              d="M 25 35 L 35 75 L 45 50 L 55 75 L 65 50 L 75 75 L 85 35 L 75 35 L 65 65 L 55 40 L 45 65 L 35 35 Z"
              fill={`url(#emerald-${uniqueId})`}
              stroke={`url(#emerald-${uniqueId})`}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            
            {/* Accent line underneath for depth */}
            <line
              x1="25"
              y1="80"
              x2="85"
              y2="80"
              stroke={`url(#emerald-${uniqueId})`}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.5"
            />
          </g>
        </svg>
      </div>

      {/* Company Name */}
      {showText && (
        <div className="flex flex-col items-center gap-1">
          <div 
            className={cn(
              "font-black tracking-tight text-center leading-none",
              "bg-gradient-to-br from-emerald-500 to-emerald-600",
              "bg-clip-text text-transparent",
              sizes[size].text
            )}
            data-testid="logo-text"
          >
            WorkforceOS
          </div>
          {size === "hero" && (
            <div className={cn("font-medium text-slate-400 tracking-wide text-center", sizes[size].tagline)}>
              Elite Workforce Management
            </div>
          )}
        </div>
      )}
    </div>
  );
}
