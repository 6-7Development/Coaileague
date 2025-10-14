interface ClockworkLogoProps {
  size?: number;
  variant?: "icon" | "full" | "wordmark";
  className?: string;
}

export function ClockworkLogo({ size = 32, variant = "icon", className = "" }: ClockworkLogoProps) {
  if (variant === "wordmark") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <ClockworkLogo size={size} variant="icon" />
        <span className="text-xl font-semibold tracking-tight">Clockwork</span>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <ClockworkLogo size={size} variant="icon" />
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-tight">Clockwork</span>
          <span className="text-xs text-[hsl(var(--cad-text-tertiary))] tracking-wide uppercase">
            Workforce Management
          </span>
        </div>
      </div>
    );
  }

  // Icon variant - precision gear design
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer gear */}
      <path
        d="M32 8L35 12H29L32 8Z M32 56L35 52H29L32 56Z M8 32L12 29V35L8 32Z M56 32L52 29V35L56 32Z M14 14L17 18L13 18L14 14Z M50 14L47 18L51 18L50 14Z M14 50L17 46L13 46L14 50Z M50 50L47 46L51 46L50 50Z"
        fill="currentColor"
        className="text-[hsl(var(--cad-blue))]"
      />
      
      {/* Main gear circle */}
      <circle
        cx="32"
        cy="32"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-[hsl(var(--cad-blue))]"
      />
      
      {/* Gear teeth */}
      <path
        d="M32 14L34 16H30L32 14Z M32 50L34 48H30L32 50Z M14 32L16 30V34L14 32Z M50 32L48 30V34L50 32Z"
        fill="currentColor"
        className="text-[hsl(var(--cad-blue))]"
      />
      
      {/* Inner precision circle */}
      <circle
        cx="32"
        cy="32"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-[hsl(var(--cad-cyan))]"
      />
      
      {/* Center precision point */}
      <circle
        cx="32"
        cy="32"
        r="3"
        fill="currentColor"
        className="text-[hsl(var(--cad-cyan))]"
      />
      
      {/* Precision indicators (clock hands suggesting time/scheduling) */}
      <line
        x1="32"
        y1="32"
        x2="32"
        y2="22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-[hsl(var(--cad-green))]"
      />
      <line
        x1="32"
        y1="32"
        x2="40"
        y2="32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-[hsl(var(--cad-green))]"
      />
    </svg>
  );
}
