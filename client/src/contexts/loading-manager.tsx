import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { ProgressLoadingOverlay, type ProgressScenario } from "@/components/progress-loading-overlay";

// Scenario rotation order
const SCENARIO_ROTATION: ProgressScenario[] = [
  "login",
  "dashboardLoading",
  "dataSync",
  "aiProcessing",
  "heavyOperation",
  "logout",
];

// Minimum display time for professional UX (2.5 seconds)
const MIN_DISPLAY_TIME_MS = 2500;

interface LoadingRequest {
  id: string;
  scenario?: ProgressScenario;
  minDuration?: number;
  startTime: number;
}

interface LoadingManagerContextValue {
  beginLoading: (options?: { scenario?: ProgressScenario; minDuration?: number }) => string;
  endLoading: (id: string) => void;
  isLoading: boolean;
}

const LoadingManagerContext = createContext<LoadingManagerContextValue | null>(null);

export function LoadingManagerProvider({ children }: { children: React.ReactNode }) {
  const [activeRequest, setActiveRequest] = useState<LoadingRequest | null>(null);
  const [queue, setQueue] = useState<LoadingRequest[]>([]);
  const scenarioIndexRef = useRef(0);
  const requestCounterRef = useRef(0);

  // Load last used scenario index from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("autoforce_loading_scenario_index");
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        scenarioIndexRef.current = parsed;
      }
    }
  }, []);

  // Get next scenario in rotation
  const getNextScenario = useCallback(() => {
    const scenario = SCENARIO_ROTATION[scenarioIndexRef.current];
    scenarioIndexRef.current = (scenarioIndexRef.current + 1) % SCENARIO_ROTATION.length;
    // Persist to sessionStorage
    sessionStorage.setItem("autoforce_loading_scenario_index", scenarioIndexRef.current.toString());
    return scenario;
  }, []);

  // Begin loading - returns request ID
  const beginLoading = useCallback((options?: { scenario?: ProgressScenario; minDuration?: number }) => {
    const id = `loading-${++requestCounterRef.current}`;
    const scenario = options?.scenario || getNextScenario();
    const minDuration = options?.minDuration || MIN_DISPLAY_TIME_MS;
    
    const request: LoadingRequest = {
      id,
      scenario,
      minDuration,
      startTime: Date.now(),
    };

    // If no active request, make this one active immediately
    if (!activeRequest) {
      setActiveRequest(request);
    } else {
      // Queue it
      setQueue((prev) => [...prev, request]);
    }

    return id;
  }, [activeRequest, getNextScenario]);

  // End loading - enforces minimum display time
  const endLoading = useCallback((id: string) => {
    if (activeRequest?.id === id) {
      const elapsed = Date.now() - activeRequest.startTime;
      const remaining = Math.max(0, (activeRequest.minDuration || MIN_DISPLAY_TIME_MS) - elapsed);

      setTimeout(() => {
        setActiveRequest(null);
        // Process queue
        setQueue((prev) => {
          if (prev.length > 0) {
            const [next, ...rest] = prev;
            setActiveRequest(next);
            return rest;
          }
          return prev;
        });
      }, remaining);
    }
  }, [activeRequest]);

  return (
    <LoadingManagerContext.Provider value={{ beginLoading, endLoading, isLoading: !!activeRequest }}>
      {children}
      <ProgressLoadingOverlay
        isVisible={!!activeRequest}
        scenario={activeRequest?.scenario || "login"}
        status="loading"
      />
    </LoadingManagerContext.Provider>
  );
}

export function useLoadingManager() {
  const context = useContext(LoadingManagerContext);
  if (!context) {
    throw new Error("useLoadingManager must be used within LoadingManagerProvider");
  }
  return context;
}

// Convenience hook for wrapping async operations
export function useLoadingOperation() {
  const { beginLoading, endLoading } = useLoadingManager();

  return useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      options?: { scenario?: ProgressScenario; minDuration?: number }
    ): Promise<T> => {
      const id = beginLoading(options);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        endLoading(id);
      }
    },
    [beginLoading, endLoading]
  );
}
