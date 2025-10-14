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
      icon: "w-8 h-8 text-lg rounded-lg",
      text: "text-lg"
    },
    md: {
      icon: "w-12 h-12 text-2xl rounded-xl",
      text: "text-2xl"
    },
    lg: {
      icon: "w-16 h-16 text-3xl rounded-2xl",
      text: "text-3xl"
    },
    xl: {
      icon: "w-20 h-20 text-4xl rounded-2xl",
      text: "text-4xl"
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Icon with shimmer effect */}
      <div 
        className={cn(
          "relative flex items-center justify-center font-black overflow-hidden",
          "bg-gradient-to-br from-[#ef4444] to-[#dc2626]",
          "shadow-[0_10px_35px_rgba(239,68,68,0.4)]",
          sizes[size].icon
        )}
        data-testid="logo-icon"
      >
        {/* Shimmer overlay */}
        <div 
          className="absolute inset-0 w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/40 to-transparent animate-shimmer"
          style={{
            animation: "shimmer 4s infinite",
          }}
        />
        <span className="relative z-10 text-white">W</span>
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
