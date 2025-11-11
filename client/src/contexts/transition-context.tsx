import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { ProgressLoadingOverlay, ProgressScenario } from "@/components/progress-loading-overlay";

export type TransitionStatus = "loading" | "success" | "error" | "info";

interface TransitionOptions {
  status?: TransitionStatus;
  message?: string;
  submessage?: string;
  duration?: number;
  onComplete?: () => void;
  scenario?: ProgressScenario;
}

interface TransitionContextType {
  showTransition: (options?: TransitionOptions) => void;
  hideTransition: () => void;
  updateTransition: (options: TransitionOptions) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [options, setOptions] = useState<TransitionOptions>({
    status: "loading",
    message: "Loading...",
  });

  const showTransition = useCallback((opts?: TransitionOptions) => {
    setOptions({
      status: "loading",
      message: "Loading...",
      ...opts
    });
    setIsVisible(true);
  }, []);

  const hideTransition = useCallback(() => {
    setIsVisible(false);
  }, []);

  const updateTransition = useCallback((opts: TransitionOptions) => {
    setOptions(prev => ({ ...prev, ...opts }));
  }, []);

  const handleComplete = useCallback(() => {
    if (options.onComplete) {
      options.onComplete();
    }
    hideTransition();
  }, [options, hideTransition]);

  // Auto-hide and trigger onComplete after duration
  // Triggers on: success/error states, OR loading state with explicit duration
  useEffect(() => {
    if (!isVisible) return;
    
    const shouldAutoHide = 
      options.status === "success" || 
      options.status === "error" ||
      (options.status === "loading" && options.duration !== undefined);
    
    if (shouldAutoHide) {
      const timer = setTimeout(() => {
        handleComplete();
      }, options.duration || 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, options.status, options.duration, handleComplete]);

  return (
    <TransitionContext.Provider value={{ showTransition, hideTransition, updateTransition }}>
      {children}
      <ProgressLoadingOverlay
        isVisible={isVisible}
        status={options.status}
        scenario={options.scenario}
        title={options.message}
        duration={options.duration}
      />
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useTransition must be used within TransitionProvider");
  }
  return context;
}
