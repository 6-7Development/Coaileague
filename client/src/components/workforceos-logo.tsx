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
          className="w-full h-full object-contain rounded-xl"
          style={{
            mixBlendMode: 'normal',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
          }}
        />
      </div>
    );
  }

  // Navigation variant - prominent with text and subtle rounded background
  return (
    <div 
      className={cn(
        "flex items-center gap-4 px-4 py-2 rounded-xl bg-card/30 border border-border/50 backdrop-blur-sm",
        className
      )} 
      data-testid="logo-nav"
    >
      <div className="relative w-14 h-14 flex-shrink-0">
        <img 
          src={logoImage} 
          alt="" 
          className="w-full h-full object-contain rounded-xl"
          style={{
            mixBlendMode: 'normal',
            filter: 'drop-shadow(0 2px 4px rgba(13, 148, 136, 0.2))'
          }}
        />
      </div>
      <div className="text-xl font-bold leading-tight">
        <span className="text-foreground">WorkForce</span>
        <span className="text-[#0d9488]">OS</span>
      </div>
    </div>
  );
}
