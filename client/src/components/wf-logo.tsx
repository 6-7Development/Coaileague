// WorkforceOS Logo Component
// Realistic neon-style "W" with glowing "OS" superscript

interface WFLogoProps {
  className?: string;
  size?: number;
}

export function WFLogo({ className = "", size = 24 }: WFLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur3"/>
          <feMerge>
            <feMergeNode in="blur3"/>
            <feMergeNode in="blur2"/>
            <feMergeNode in="blur1"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      
      {/* Main "W" Letter */}
      <path
        d="M 15 20 L 25 75 L 35 35 L 45 75 L 55 20"
        stroke="url(#blue-gradient)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#neon-glow)"
      />
      
      {/* "OS" Superscript */}
      <text
        x="60"
        y="35"
        fill="url(#blue-gradient)"
        fontSize="20"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        filter="url(#neon-glow)"
      >
        OS
      </text>
      
      {/* Additional glow for depth */}
      <path
        d="M 15 20 L 25 75 L 35 35 L 45 75 L 55 20"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

// Compact version for inline use - Enhanced visibility
export function WFLogoCompact({ className = "", size = 20 }: WFLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="compact-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur2"/>
          <feMerge>
            <feMergeNode in="blur2"/>
            <feMergeNode in="blur1"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="compact-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
      </defs>
      
      {/* Main "W" Letter - Bigger and Thicker */}
      <path
        d="M 2 4 L 6 20 L 10 8 L 14 20 L 18 4"
        stroke="url(#compact-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#compact-glow)"
      />
      
      {/* "OS" Superscript - Visible and merged */}
      <text
        x="19"
        y="10"
        fill="url(#compact-gradient)"
        fontSize="9"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        filter="url(#compact-glow)"
      >
        OS
      </text>
      
      {/* Additional bright core for contrast */}
      <path
        d="M 2 4 L 6 20 L 10 8 L 14 20 L 18 4"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}
