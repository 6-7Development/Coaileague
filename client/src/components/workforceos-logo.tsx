import { cn } from "@/lib/utils";
import logoImage from "@assets/image_1761703297679.png";

interface WorkforceOSLogoProps {
  variant?: "nav" | "icon" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
}

export function WorkforceOSLogo({ 
  variant = "nav",
  size = "md",
  animated = false,
  className 
}: WorkforceOSLogoProps) {
  
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48",
    xl: "w-64 h-64"
  };
  
  // Full logo variant - complete branded image with text
  if (variant === "full") {
    return (
      <div className={cn("relative flex items-center justify-center", className)} data-testid="logo-full">
        <img 
          src={logoImage} 
          alt="WorkforceOS - Full Workforce Optimization Operating System" 
          className={cn(
            "object-contain",
            sizeClasses[size],
            animated && "animate-pulse-slow"
          )}
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(13, 148, 136, 0.25))'
          }}
        />
      </div>
    );
  }
  
  // Icon only variant - just the image, no text wrapper
  if (variant === "icon") {
    return (
      <div className={cn("relative", className)} data-testid="logo-icon">
        <img 
          src={logoImage} 
          alt="WorkforceOS" 
          className={cn(
            "object-contain",
            sizeClasses[size],
            animated && "animate-pulse-slow"
          )}
          style={{
            filter: 'drop-shadow(0 2px 8px rgba(13, 148, 136, 0.2))'
          }}
        />
      </div>
    );
  }

  // Navigation variant - compact with background
  return (
    <div 
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg bg-card/30 border border-border/50 backdrop-blur-sm",
        className
      )} 
      data-testid="logo-nav"
    >
      <div className="relative w-12 h-12 flex-shrink-0">
        <img 
          src={logoImage} 
          alt="" 
          className={cn(
            "w-full h-full object-contain",
            animated && "animate-pulse-slow"
          )}
          style={{
            filter: 'drop-shadow(0 2px 6px rgba(13, 148, 136, 0.25))'
          }}
        />
      </div>
    </div>
  );
}
