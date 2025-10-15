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
  // Generate unique ID for this logo instance to prevent SVG ID conflicts
  const uniqueId = Math.random().toString(36).substr(2, 9);
  
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
      {/* Modern Workforce Logo - Represents people, time, and growth */}
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
            {/* Brand gradient - unique per instance */}
            <linearGradient id={`brandGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            
            {/* Glow effect - unique per instance */}
            <filter id={`glow-${uniqueId}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Outer ring - represents system/platform */}
          <circle 
            cx="50" 
            cy="50" 
            r="42" 
            stroke={`url(#brandGradient-${uniqueId})`}
            strokeWidth="4" 
            fill="none"
            opacity="0.5"
          >
            <animate
              attributeName="stroke-dasharray"
              from="0,264"
              to="264,0"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>

          {/* People icons - workforce */}
          <g filter={`url(#glow-${uniqueId})`}>
            {/* Person 1 */}
            <circle cx="35" cy="38" r="5" fill={`url(#brandGradient-${uniqueId})`}>
              <animate
                attributeName="opacity"
                values="0.7;1;0.7"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <path 
              d="M 35 45 Q 29 47, 29 52 L 41 52 Q 41 47, 35 45" 
              fill={`url(#brandGradient-${uniqueId})`}
            >
              <animate
                attributeName="opacity"
                values="0.7;1;0.7"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>

            {/* Person 2 - Center */}
            <circle cx="50" cy="34" r="6" fill={`url(#brandGradient-${uniqueId})`}>
              <animate
                attributeName="opacity"
                values="1;0.7;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <path 
              d="M 50 42 Q 43 44, 43 50 L 57 50 Q 57 44, 50 42" 
              fill={`url(#brandGradient-${uniqueId})`}
            >
              <animate
                attributeName="opacity"
                values="1;0.7;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>

            {/* Person 3 */}
            <circle cx="65" cy="38" r="5" fill={`url(#brandGradient-${uniqueId})`}>
              <animate
                attributeName="opacity"
                values="0.7;1;0.7"
                dur="2s"
                begin="0.5s"
                repeatCount="indefinite"
              />
            </circle>
            <path 
              d="M 65 45 Q 59 47, 59 52 L 71 52 Q 71 47, 65 45" 
              fill={`url(#brandGradient-${uniqueId})`}
            >
              <animate
                attributeName="opacity"
                values="0.7;1;0.7"
                dur="2s"
                begin="0.5s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Clock element - time tracking */}
          <circle 
            cx="50" 
            cy="70" 
            r="11" 
            stroke={`url(#brandGradient-${uniqueId})`}
            strokeWidth="2.5" 
            fill="none"
          />
          <line 
            x1="50" 
            y1="70" 
            x2="50" 
            y2="64" 
            stroke={`url(#brandGradient-${uniqueId})`}
            strokeWidth="2.5" 
            strokeLinecap="round"
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 50 70"
              to="360 50 70"
              dur="4s"
              repeatCount="indefinite"
            />
          </line>
          <line 
            x1="50" 
            y1="70" 
            x2="55" 
            y2="70" 
            stroke={`url(#brandGradient-${uniqueId})`}
            strokeWidth="2" 
            strokeLinecap="round"
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 50 70"
              to="360 50 70"
              dur="48s"
              repeatCount="indefinite"
            />
          </line>

          {/* Growth arrow - analytics/progress */}
          <path 
            d="M 78 82 L 84 76 L 90 82" 
            stroke={`url(#brandGradient-${uniqueId})`}
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="translate"
              values="0,2; 0,0; 0,2"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div 
          className={cn(
            "font-black tracking-tight",
            "bg-gradient-to-br from-white to-white/80",
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
