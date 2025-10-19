import { WorkforceOSLogo } from "./workforceos-logo";
import { Loader2 } from "lucide-react";

interface UniversalLoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * WorkforceOS branded loading component
 * Works seamlessly across mobile and desktop
 * Use for page transitions, data loading, and async operations
 */
export function UniversalLoading({ 
  message = "Loading WorkforceOS...", 
  fullScreen = false,
  size = "md" 
}: UniversalLoadingProps) {
  const logoSize = size === "sm" ? "md" : size === "md" ? "lg" : "xl";
  const spinnerSize = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";
  
  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
        data-testid="universal-loading-fullscreen"
      >
        <div className="flex flex-col items-center gap-6 px-4">
          <div className="animate-pulse">
            <WorkforceOSLogo size={logoSize} showText={true} />
          </div>
          <div className={`flex items-center gap-3 ${textSize} text-white/80 font-medium`}>
            <Loader2 className={`${spinnerSize} animate-spin text-indigo-400`} />
            <span>{message}</span>
          </div>
          <div className="mt-4 text-xs text-white/40 animate-pulse">
            Powered by WorkforceOS Platform
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]" data-testid="universal-loading">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <WorkforceOSLogo size={logoSize} showText={false} />
        </div>
        <div className={`flex items-center gap-2 ${textSize} text-muted-foreground`}>
          <Loader2 className={`${spinnerSize} animate-spin`} />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loading box for content placeholders
 */
export function LoadingBox({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-muted rounded-lg ${className}`}
      data-testid="loading-box"
    />
  );
}

/**
 * Card skeleton for list items
 */
export function LoadingCard() {
  return (
    <div className="bg-card rounded-lg border p-4 space-y-3" data-testid="loading-card">
      <div className="flex items-start gap-3">
        <LoadingBox className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <LoadingBox className="h-4 w-3/4" />
          <LoadingBox className="h-3 w-1/2" />
        </div>
      </div>
      <LoadingBox className="h-20 w-full" />
    </div>
  );
}

/**
 * Table skeleton for data tables
 */
export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" data-testid="loading-table">
      {/* Header */}
      <div className="flex gap-2 pb-2 border-b">
        <LoadingBox className="h-4 flex-1" />
        <LoadingBox className="h-4 flex-1" />
        <LoadingBox className="h-4 flex-1" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2 py-3 border-b">
          <LoadingBox className="h-4 flex-1" />
          <LoadingBox className="h-4 flex-1" />
          <LoadingBox className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}
