import { cn } from "@/lib/utils";

interface WorkforceOSLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function WorkforceOSLogo({ 
  size = "md", 
  showText = true,
  className 
}: WorkforceOSLogoProps) {
  const sizes = {
    sm: {
      container: "w-8 h-8",
      text: "text-lg"
    },
    md: {
      container: "w-12 h-12",
      text: "text-2xl"
    },
    lg: {
      container: "w-16 h-16",
      text: "text-3xl"
    },
    xl: {
      container: "w-24 h-24",
      text: "text-4xl"
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Modern Workforce Logo - 3 People Circles Representing Teams */}
      <div 
        className={cn(
          "relative flex items-center justify-center",
          sizes[size].container
        )}
        data-testid="logo-icon"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Emerald gradient for workforce theme */}
            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            
            {/* Subtle glow effect */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Three interconnected circles representing team/workforce */}
          <g filter="url(#glow)">
            {/* Left person circle */}
            <circle 
              cx="30" 
              cy="50" 
              r="18" 
              stroke="url(#emeraldGradient)"
              strokeWidth="3.5" 
              fill="none"
              opacity="0.9"
            />
            
            {/* Center person circle (slightly larger - leader/manager) */}
            <circle 
              cx="50" 
              cy="35" 
              r="20" 
              stroke="url(#emeraldGradient)"
              strokeWidth="4" 
              fill="none"
            />
            
            {/* Right person circle */}
            <circle 
              cx="70" 
              cy="50" 
              r="18" 
              stroke="url(#emeraldGradient)"
              strokeWidth="3.5" 
              fill="none"
              opacity="0.9"
            />
            
            {/* Connection lines showing teamwork */}
            <line 
              x1="30" 
              y1="50" 
              x2="50" 
              y2="35" 
              stroke="url(#emeraldGradient)"
              strokeWidth="2" 
              opacity="0.5"
            />
            <line 
              x1="50" 
              y1="35" 
              x2="70" 
              y2="50" 
              stroke="url(#emeraldGradient)"
              strokeWidth="2" 
              opacity="0.5"
            />
            
            {/* Small dots in center of circles representing people */}
            <circle cx="30" cy="50" r="4" fill="url(#emeraldGradient)" />
            <circle cx="50" cy="35" r="5" fill="url(#emeraldGradient)" />
            <circle cx="70" cy="50" r="4" fill="url(#emeraldGradient)" />
          </g>

          {/* Time/productivity accent - small clock icon at bottom */}
          <g opacity="0.7">
            <circle 
              cx="50" 
              cy="75" 
              r="8" 
              stroke="url(#emeraldGradient)"
              strokeWidth="2" 
              fill="none"
            />
            <line 
              x1="50" 
              y1="75" 
              x2="50" 
              y2="70" 
              stroke="url(#emeraldGradient)"
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            <line 
              x1="50" 
              y1="75" 
              x2="53" 
              y2="75" 
              stroke="url(#emeraldGradient)"
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div 
          className={cn(
            "font-black tracking-tight",
            "bg-gradient-to-br from-emerald-500 to-emerald-400",
            "bg-clip-text text-transparent",
            sizes[size].text
          )}
          data-testid="logo-text"
        >
          WorkforceOS
        </div>
      )}
    </div>
  );
}
