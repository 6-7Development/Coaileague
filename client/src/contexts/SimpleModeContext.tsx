// SimpleModeContext — simple mode permanently retired.
// This stub preserves import compatibility across the codebase.
// All components using useSimpleMode will receive isSimpleMode=false
// (full-featured mode always active).

import { createContext, useContext, type ReactNode } from 'react';

interface SimpleModeContextType {
  isSimpleMode: boolean;
  toggleSimpleMode: () => void;
  setSimpleMode: (value: boolean) => void;
}

const SimpleModeContext = createContext<SimpleModeContextType>({
  isSimpleMode: false,        // Always full mode
  toggleSimpleMode: () => {},  // No-op
  setSimpleMode: () => {},     // No-op
});

export function SimpleModeProvider({ children }: { children: ReactNode }) {
  return (
    <SimpleModeContext.Provider value={{ isSimpleMode: false, toggleSimpleMode: () => {}, setSimpleMode: () => {} }}>
      {children}
    </SimpleModeContext.Provider>
  );
}

// Always returns { isSimpleMode: false } — mode switching retired.
export function useSimpleMode(): SimpleModeContextType {
  return useContext(SimpleModeContext);
}
