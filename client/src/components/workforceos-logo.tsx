import { cn } from "@/lib/utils";
import logoImage from "@assets/ChatGPT Image Oct 23, 2025, 06_25_54 PM_1761270587120.png";

interface WorkforceOSLogoProps {
  variant?: "nav" | "icon";
  className?: string;
}

export function WorkforceOSLogo({ 
  variant = "nav",
  className 
}: WorkforceOSLogoProps) {
  
  // Icon only variant - just the image, no text
  if (variant === "icon") {
    return (
      <div className={cn("relative", className)} data-testid="logo-icon">
        <img 
          src={logoImage} 
          alt="WorkforceOS" 
          className="w-full h-full object-contain"
          style={{
            mixBlendMode: 'normal',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
          }}
        />
      </div>
    );
  }

  // Navigation variant - compact with text
  return (
    <div 
      className={cn("flex items-center gap-3", className)} 
      data-testid="logo-nav"
    >
      <div className="relative w-10 h-10 flex-shrink-0">
        <img 
          src={logoImage} 
          alt="" 
          className="w-full h-full object-contain"
          style={{
            mixBlendMode: 'normal',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
          }}
        />
      </div>
      <div className="text-lg font-bold leading-tight">
        <span className="text-foreground">WorkForce</span>
        <span className="text-[#0d9488]">OS</span>
      </div>
    </div>
  );
}
