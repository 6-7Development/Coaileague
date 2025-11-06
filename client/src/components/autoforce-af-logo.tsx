import { cn } from "@/lib/utils";

interface AutoForceAFLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  variant?: "icon" | "full" | "wordmark";
  animated?: boolean;
  showF?: boolean;
  className?: string;
}

/**
 * Polished AutoForce™ AF Logo Component
 * Features sharp, tech-style "A" and "F" with professional animations
 * Based on the AF Core Scan design
 */
export function AutoForceAFLogo({
  size = "md",
  variant = "icon",
  animated = true,
  showF = false,
  className
}: AutoForceAFLogoProps) {
  
  // Size mappings
  const iconSizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
    hero: "w-48 h-48"
  };

  const containerSizes = {
    sm: "w-20 h-20",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-44 h-44",
    hero: "w-64 h-64"
  };

  // Icon only - just the AF symbol
  if (variant === "icon") {
    return (
      <div 
        className={cn(
          "relative flex items-center justify-center",
          containerSizes[size],
          className
        )}
        data-testid="autoforce-af-logo-icon"
      >
        {/* Outer ring spinner */}
        {animated && (
          <div 
            className="absolute inset-1 rounded-full border-2 border-transparent border-t-purple-500/80 border-r-purple-500/80 animate-spin-slow"
            style={{ filter: 'drop-shadow(0 0 5px rgba(155, 93, 229, 0.5))' }}
          />
        )}

        {/* Glow effects */}
        {animated && (
          <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full animate-pulse-slow" />
        )}

        {/* AF Symbol */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Sharp "A" SVG */}
          <svg 
            className={cn(
              iconSizes[size],
              animated && "animate-af-spin"
            )}
            viewBox="0 0 100 100" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
              transformOrigin: 'center',
              filter: 'drop-shadow(0 0 5px rgb(245, 122, 67)) drop-shadow(0 0 10px rgba(245, 122, 67, 0.8))'
            }}
          >
            {/* Polished tech-style A */}
            <path 
              d="M 50 10 L 10 90 L 30 90 L 38 70 L 62 70 L 70 90 L 90 90 L 50 10 Z M 43 55 L 50 35 L 57 55 Z" 
              fill="#F57A43"
              className="transition-all duration-300"
            />
          </svg>

          {/* "F" - appears when showF is true */}
          {showF && (
            <span
              className={cn(
                "absolute font-bold transition-all duration-500",
                size === "sm" && "text-3xl translate-x-6",
                size === "md" && "text-4xl translate-x-8",
                size === "lg" && "text-5xl translate-x-12",
                size === "xl" && "text-6xl translate-x-16",
                size === "hero" && "text-8xl translate-x-24",
                showF ? "opacity-100 scale-100" : "opacity-0 scale-50"
              )}
              style={{
                color: '#00DFFF',
                textShadow: '0 0 5px #00DFFF, 0 0 15px rgba(0, 223, 255, 0.8), 0 0 25px rgba(0, 223, 255, 0.3)',
                fontFamily: 'Teko, sans-serif'
              }}
            >
              F
            </span>
          )}
        </div>
      </div>
    );
  }

  // Wordmark - just text
  if (variant === "wordmark") {
    return (
      <div 
        className={cn("flex items-center gap-1", className)}
        data-testid="autoforce-af-logo-wordmark"
      >
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          AUTO
        </span>
        <span 
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(90deg, #00DFFF 0%, #9B5DE5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          FORCE
        </span>
        <span className="text-sm align-super text-foreground">™</span>
      </div>
    );
  }

  // Full - icon + text
  return (
    <div 
      className={cn("flex items-center gap-3", className)}
      data-testid="autoforce-af-logo-full"
    >
      <AutoForceAFLogo 
        variant="icon" 
        size={size} 
        animated={animated} 
        showF={showF}
      />
      <div className="flex flex-col">
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-none">
          <span className="text-foreground">AUTO</span>
          <span 
            style={{
              background: 'linear-gradient(90deg, #00DFFF 0%, #9B5DE5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            FORCE
          </span>
          <span className="text-xs align-super text-foreground">™</span>
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground font-medium tracking-wide mt-0.5">
          Autonomous Workforce Management
        </div>
      </div>
    </div>
  );
}
