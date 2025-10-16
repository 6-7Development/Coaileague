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
      {/* Iconic WorkforceOS Logo - Clock with Person (Time + People) */}
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
            {/* Emerald gradient - brand color */}
            <linearGradient id={`emeraldGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            
            {/* Pulsing glow effect - makes it feel alive */}
            <filter id={`glow-${uniqueId}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Radial gradient for depth */}
            <radialGradient id={`radial-${uniqueId}`}>
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#059669" stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* Pulsing background circle - "heartbeat" of the system */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill={`url(#radial-${uniqueId})`}
            opacity="0.6"
          >
            <animate
              attributeName="r"
              values="42;48;42"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.3;0.6;0.3"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Main clock circle - represents time tracking */}
          <circle 
            cx="50" 
            cy="50" 
            r="38" 
            stroke={`url(#emeraldGradient-${uniqueId})`}
            strokeWidth="4" 
            fill="none"
            filter={`url(#glow-${uniqueId})`}
          />

          {/* Clock hour markers - 12, 3, 6, 9 positions */}
          <g opacity="0.8">
            <circle cx="50" cy="16" r="2.5" fill={`url(#emeraldGradient-${uniqueId})`} /> {/* 12 */}
            <circle cx="84" cy="50" r="2.5" fill={`url(#emeraldGradient-${uniqueId})`} /> {/* 3 */}
            <circle cx="50" cy="84" r="2.5" fill={`url(#emeraldGradient-${uniqueId})`} /> {/* 6 */}
            <circle cx="16" cy="50" r="2.5" fill={`url(#emeraldGradient-${uniqueId})`} /> {/* 9 */}
          </g>

          {/* Person silhouette as clock hand - THE ICONIC ELEMENT */}
          {/* This is what makes it memorable: workforce = people on the clock */}
          <g 
            filter={`url(#glow-${uniqueId})`}
            transform-origin="50 50"
          >
            {/* Person head */}
            <circle 
              cx="50" 
              cy="38" 
              r="5" 
              fill={`url(#emeraldGradient-${uniqueId})`}
            />
            
            {/* Person body/arms - pointing like clock hand */}
            <path 
              d="M 50 44 L 48 52 L 52 52 Z M 50 52 L 48 65 L 50 66 L 52 65 Z M 48 52 L 43 56 M 52 52 L 57 56" 
              stroke={`url(#emeraldGradient-${uniqueId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={`url(#emeraldGradient-${uniqueId})`}
            />
            
            {/* Rotation animation - person "works around the clock" */}
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 50 50"
              to="360 50 50"
              dur="8s"
              repeatCount="indefinite"
            />
          </g>

          {/* Center dot - pivot point */}
          <circle 
            cx="50" 
            cy="50" 
            r="3" 
            fill={`url(#emeraldGradient-${uniqueId})`}
          >
            <animate
              attributeName="r"
              values="3;4;3"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Subtle "W" watermark in background for brand recognition */}
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fontSize="24"
            fontWeight="900"
            fill={`url(#emeraldGradient-${uniqueId})`}
            opacity="0.15"
          >
            W
          </text>
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
