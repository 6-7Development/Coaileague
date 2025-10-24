import { cn } from "@/lib/utils";

interface WorkforceOSLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export function WorkforceOSLogo({ 
  size = "md", 
  showText = true,
  animated = false,
  className 
}: WorkforceOSLogoProps) {
  const sizes = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64",
    xl: "w-80 h-80",
    hero: "w-96 h-96"
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)} data-testid={animated ? "logo-animated" : "logo-static"}>
      <div className={cn("relative", sizes[size])}>
        <svg
          viewBox="0 0 500 400"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Center Professional Figure - SOLID DARK NAVY */}
          <g transform="translate(250, 180)">
            {/* Head - Solid dark navy */}
            <ellipse
              cx="0"
              cy="-45"
              rx="35"
              ry="42"
              fill="#1a3a52"
              className={animated ? "animate-pulse-slow" : ""}
            />
            
            {/* Neck */}
            <rect
              x="-15"
              y="-10"
              width="30"
              height="20"
              fill="#1a3a52"
              rx="5"
            />
            
            {/* Shoulders and Suit - Solid dark navy */}
            <path
              d="M-60,10 L-70,80 L-40,100 L40,100 L70,80 L60,10 L40,10 L30,0 L-30,0 L-40,10 Z"
              fill="#1a3a52"
            />
            
            {/* White Shirt - SOLID WHITE */}
            <path
              d="M-25,10 L-15,0 L0,5 L15,0 L25,10"
              fill="#ffffff"
            />
            
            {/* Tie - Very dark */}
            <path
              d="M0,5 L-8,40 L-5,60 L0,75 L5,60 L8,40 Z"
              fill="#0f172a"
            />
          </g>

          {/* Top Left: AI Brain Head - SOLID TEAL/GREEN */}
          <g transform="translate(120, 100)" className={animated ? "animate-float" : ""}>
            {/* Head silhouette - SOLID GREEN */}
            <path
              d="M30,-25 Q45,-30 55,-20 Q60,-10 60,5 Q60,20 55,35 Q45,50 30,55 Q15,58 5,50 Q-5,40 -5,25 Q-5,10 0,0 Q5,-15 20,-25 Z"
              fill="#0d9488"
            />
            
            {/* Circuit brain elements - SOLID WHITE CIRCLES */}
            <g className={animated ? "animate-circuit-pulse" : ""}>
              <circle cx="25" cy="10" r="6" fill="#ffffff" />
              <circle cx="35" cy="5" r="4" fill="#ffffff" />
              <circle cx="30" cy="20" r="5" fill="#ffffff" />
              <circle cx="20" cy="25" r="4" fill="#ffffff" />
              
              <path d="M25,10 L35,5 M25,10 L30,20 M30,20 L20,25" 
                    stroke="#ffffff" 
                    strokeWidth="2.5" />
            </g>
          </g>

          {/* Top Right: Gear - SOLID TEAL/GREEN */}
          <g transform="translate(380, 100)" className={animated ? "animate-spin-slow" : ""}>
            {/* Main gear body - SOLID GREEN */}
            <circle cx="0" cy="0" r="35" fill="#0d9488" />
            
            {/* Gear teeth - 8 teeth - SOLID GREEN */}
            <rect x="-6" y="-45" width="12" height="15" fill="#0d9488" rx="2" />
            <rect x="-6" y="30" width="12" height="15" fill="#0d9488" rx="2" />
            <rect x="-45" y="-6" width="15" height="12" fill="#0d9488" rx="2" />
            <rect x="30" y="-6" width="15" height="12" fill="#0d9488" rx="2" />
            
            <rect x="-35" y="-35" width="12" height="12" fill="#0d9488" rx="2" transform="rotate(-45 -29 -29)" />
            <rect x="23" y="-35" width="12" height="12" fill="#0d9488" rx="2" transform="rotate(45 29 -29)" />
            <rect x="-35" y="23" width="12" height="12" fill="#0d9488" rx="2" transform="rotate(45 -29 29)" />
            <rect x="23" y="23" width="12" height="12" fill="#0d9488" rx="2" transform="rotate(-45 29 29)" />
            
            {/* Center hole - SOLID WHITE */}
            <circle cx="0" cy="0" r="18" fill="#ffffff" />
            <circle cx="0" cy="0" r="10" fill="none" stroke="#cbd5e1" strokeWidth="2" />
          </g>

          {/* Bottom Left: Circuit Brain - SOLID TEAL/GREEN */}
          <g transform="translate(120, 280)">
            {/* Brain shape - SOLID GREEN */}
            <path
              d="M30,5 Q45,0 55,10 Q60,20 58,30 Q55,42 45,50 Q30,58 15,52 Q5,45 2,32 Q0,20 5,10 Q15,0 30,5 M20,10 Q15,15 18,25 M35,10 Q40,15 37,25"
              fill="#0d9488"
            />
            
            {/* Circuit nodes - SOLID WHITE */}
            <g className={animated ? "animate-circuit-pulse" : ""}>
              <circle cx="20" cy="15" r="5" fill="#ffffff" />
              <circle cx="35" cy="15" r="5" fill="#ffffff" />
              <circle cx="28" cy="25" r="5" fill="#ffffff" />
              <circle cx="15" cy="28" r="4" fill="#ffffff" />
              <circle cx="40" cy="28" r="4" fill="#ffffff" />
              <circle cx="28" cy="38" r="5" fill="#ffffff" />
              
              <path d="M20,15 L28,25 M35,15 L28,25 M28,25 L15,28 M28,25 L40,28 M28,25 L28,38" 
                    stroke="#ffffff" 
                    strokeWidth="2.5" />
            </g>
          </g>

          {/* Bottom Right: Shield - SOLID TEAL/GREEN */}
          <g transform="translate(380, 280)" className={animated ? "animate-shield-pulse" : ""}>
            {/* Shield shape - SOLID GREEN */}
            <path
              d="M0,-30 L-35,-18 L-35,15 Q-35,30 -20,42 Q-8,50 0,55 Q8,50 20,42 Q35,30 35,15 L35,-18 Z"
              fill="#0d9488"
            />
            
            {/* Checkmark - SOLID WHITE */}
            <path
              d="M-12,8 L-4,18 L18,-10"
              stroke="#ffffff"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>

          {/* Connection Lines - VISIBLE TEAL */}
          <g stroke="#0d9488" strokeWidth="3.5">
            {/* From brain head to center */}
            <path d="M155,130 L155,150 Q155,160 165,165 L210,180" fill="none" />
            <circle cx="155" cy="130" r="5" fill="#0d9488" />
            
            {/* From gear to center */}
            <path d="M345,130 L345,150 Q345,160 335,165 L290,180" fill="none" />
            <circle cx="345" cy="130" r="5" fill="#0d9488" />
            
            {/* From circuit brain to center */}
            <path d="M155,250 L155,230 Q155,220 165,215 L210,200" fill="none" />
            <circle cx="155" cy="250" r="5" fill="#0d9488" />
            
            {/* From shield to center */}
            <path d="M345,250 L345,230 Q345,220 335,215 L290,200" fill="none" />
            <circle cx="345" cy="250" r="5" fill="#0d9488" />
          </g>
        </svg>
      </div>
      
      {showText && (
        <div className="text-2xl font-bold">
          <span className="text-[#1a3a52] dark:text-[#e8edf3]">WorkForce</span>
          <span className="text-[#0d9488]">OS</span>
        </div>
      )}
    </div>
  );
}
