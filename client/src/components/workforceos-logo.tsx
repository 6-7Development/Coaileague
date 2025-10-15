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
      container: "w-20 h-20",
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
            {/* Brand gradient */}
            <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            
            {/* Glow effect */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
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
            r="45" 
            stroke="url(#brandGradient)" 
            strokeWidth="3" 
            fill="none"
            opacity="0.3"
          >
            <animate
              attributeName="stroke-dasharray"
              from="0,283"
              to="283,0"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>

          {/* People icons - workforce */}
          <g filter="url(#glow)">
            {/* Person 1 */}
            <circle cx="35" cy="40" r="6" fill="url(#brandGradient)">
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <path 
              d="M 35 48 Q 28 50, 28 56 L 42 56 Q 42 50, 35 48" 
              fill="url(#brandGradient)"
            >
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>

            {/* Person 2 */}
            <circle cx="50" cy="35" r="7" fill="url(#brandGradient)">
              <animate
                attributeName="opacity"
                values="1;0.6;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <path 
              d="M 50 44 Q 42 46, 42 53 L 58 53 Q 58 46, 50 44" 
              fill="url(#brandGradient)"
            >
              <animate
                attributeName="opacity"
                values="1;0.6;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>

            {/* Person 3 */}
            <circle cx="65" cy="40" r="6" fill="url(#brandGradient)">
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="2s"
                begin="0.5s"
                repeatCount="indefinite"
              />
            </circle>
            <path 
              d="M 65 48 Q 58 50, 58 56 L 72 56 Q 72 50, 65 48" 
              fill="url(#brandGradient)"
            >
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="2s"
                begin="0.5s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Clock element - time tracking */}
          <circle 
            cx="50" 
            cy="72" 
            r="12" 
            stroke="url(#brandGradient)" 
            strokeWidth="2.5" 
            fill="none"
          />
          <line 
            x1="50" 
            y1="72" 
            x2="50" 
            y2="65" 
            stroke="url(#brandGradient)" 
            strokeWidth="2.5" 
            strokeLinecap="round"
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 50 72"
              to="360 50 72"
              dur="4s"
              repeatCount="indefinite"
            />
          </line>
          <line 
            x1="50" 
            y1="72" 
            x2="56" 
            y2="72" 
            stroke="url(#brandGradient)" 
            strokeWidth="2" 
            strokeLinecap="round"
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 50 72"
              to="360 50 72"
              dur="48s"
              repeatCount="indefinite"
            />
          </line>

          {/* Growth arrow - analytics/progress */}
          <path 
            d="M 75 82 L 82 75 L 89 82" 
            stroke="url(#brandGradient)" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <animate
              attributeName="opacity"
              values="0.4;1;0.4"
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="translate"
              values="0,3; 0,0; 0,3"
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
