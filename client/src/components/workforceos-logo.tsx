import { cn } from "@/lib/utils";
import logoImage from "@assets/ChatGPT Image Oct 23, 2025, 06_25_54 PM_1761270587120.png";

interface WorkforceOSLogoProps {
  variant?: "nav" | "hero";
  animated?: boolean;
  className?: string;
}

export function WorkforceOSLogo({ 
  variant = "nav",
  animated = false,
  className 
}: WorkforceOSLogoProps) {
  
  // Navigation variant - compact with text
  if (variant === "nav") {
    return (
      <div 
        className={cn("flex items-center gap-3", className)} 
        data-testid="logo-nav"
      >
        <div className="relative w-12 h-12 flex-shrink-0">
          <img 
            src={logoImage} 
            alt="WorkforceOS" 
            className="w-full h-full object-contain drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 2px 8px rgba(13, 148, 136, 0.3))'
            }}
          />
        </div>
        <div className="text-xl font-bold leading-tight hidden sm:block">
          <span className="text-foreground">WorkForce</span>
          <span className="text-[#0d9488]">OS</span>
        </div>
      </div>
    );
  }

  // Hero variant - large, prominent, with glassmorphism frame and animations
  return (
    <div 
      className={cn("flex flex-col items-center gap-6", className)} 
      data-testid="logo-hero"
    >
      {/* Glassmorphism container with glow effect */}
      <div className="relative group">
        {/* Animated glow ring */}
        {animated && (
          <>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0d9488]/20 via-[#14b8a6]/30 to-[#0d9488]/20 blur-3xl animate-pulse-glow" />
            <div className="absolute inset-0 rounded-full bg-[#0d9488]/10 blur-2xl animate-pulse-slow" />
          </>
        )}
        
        {/* Glass card background */}
        <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-white/[0.02] rounded-3xl p-12 border border-white/20 dark:border-white/10 shadow-2xl">
          {/* Logo image with professional presentation */}
          <div className={cn(
            "relative w-64 h-64 flex items-center justify-center",
            animated && "animate-float"
          )}>
            <img 
              src={logoImage} 
              alt="WorkforceOS - Complete Workforce Management Platform" 
              className="w-full h-full object-contain"
              style={{
                filter: 'drop-shadow(0 8px 24px rgba(13, 148, 136, 0.4))'
              }}
            />
            
            {/* Subtle orbiting particles for animation */}
            {animated && (
              <>
                <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-[#0d9488] animate-orbit-1 opacity-60" />
                <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-[#14b8a6] animate-orbit-2 opacity-50" />
                <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-[#0d9488] animate-orbit-3 opacity-60" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Professional wordmark */}
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          <span className="text-foreground">WorkForce</span>
          <span className="text-[#0d9488]">OS</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-2 font-medium">
          Enterprise Workforce Management Platform
        </p>
      </div>
    </div>
  );
}
