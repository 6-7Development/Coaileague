/**
 * Staff Authority Icon
 * Subtle static logo next to platform staff names in chat
 * NO ANIMATION - Clean, readable, professional
 */

interface StaffGavelIconProps {
  className?: string;
}

export function StaffGavelIcon({ className = "" }: StaffGavelIconProps) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 40 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
      style={{ verticalAlign: 'middle', marginRight: '4px' }}
      data-testid="icon-staff-logo"
    >
      <defs>
        {/* Subtle single-layer glow */}
        <filter id="staff-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Static corporate blue gradient - NO ANIMATION */}
        <linearGradient id="staff-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      {/* Simple "W" Letter - Clean and Readable */}
      <path
        d="M 8 10 L 12 26 L 16 14 L 20 26 L 24 10"
        stroke="url(#staff-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#staff-glow)"
      />
      
      {/* "OS" Superscript - Subtle */}
      <text
        x="25"
        y="14"
        fill="url(#staff-gradient)"
        fontSize="9"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        OS
      </text>
    </svg>
  );
}
