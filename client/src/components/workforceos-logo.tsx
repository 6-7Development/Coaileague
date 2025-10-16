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
            {/* Fortune-500 Corporate Blue Gradient */}
            <linearGradient id={`corp-blue-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="50%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            
            {/* Secondary blue for "OS" */}
            <linearGradient id={`light-blue-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            
            {/* Glow effect for premium feel */}
            <filter id={`glow-${uniqueId}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Fortune-500 "W" with "OS" trademark - Corporate Blue */}
          <g filter={`url(#glow-${uniqueId})`}>
            {/* Rounded square badge - corporate blue */}
            <rect
              x="15"
              y="15"
              width="90"
              height="90"
              rx="18"
              fill={`url(#corp-blue-${uniqueId})`}
            />
            
            {/* Big "W" in white - bold and dominant */}
            <text
              x="60"
              y="75"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="38"
              fontWeight="900"
              fill="white"
              letterSpacing="1"
            >
              W
            </text>
            
            {/* Small "OS" superscript merged next to W - lighter blue */}
            <text
              x="83"
              y="52"
              textAnchor="start"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="14"
              fontWeight="900"
              fill={`url(#light-blue-${uniqueId})`}
              letterSpacing="0.5"
            >
              OS
            </text>
          </g>
        </svg>
      </div>

      {/* Company Name */}
      {showText && (
        <div className="flex flex-col items-center gap-1">
          <div 
            className={cn(
              "font-black tracking-tight text-center leading-none",
              "bg-gradient-to-br from-blue-600 to-blue-800",
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
