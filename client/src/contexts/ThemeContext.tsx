import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WorkspaceTheme } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface ThemeContextValue {
  theme: WorkspaceTheme | null;
  isLoading: boolean;
  applyTheme: (theme: WorkspaceTheme | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [appliedTheme, setAppliedTheme] = useState<WorkspaceTheme | null>(null);

  // Only fetch workspace theme when user is authenticated
  const { data: theme, isLoading } = useQuery<WorkspaceTheme | null>({
    queryKey: ["/api/workspace/theme"],
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const applyTheme = (newTheme: WorkspaceTheme | null) => {
    if (!newTheme) {
      document.documentElement.removeAttribute("data-workspace");
      return;
    }

    setAppliedTheme(newTheme);

    document.documentElement.setAttribute(
      "data-workspace",
      newTheme.workspaceId
    );

    if (newTheme.primaryColor) {
      document.documentElement.style.setProperty(
        "--cad-blue",
        newTheme.primaryColor
      );
      document.documentElement.style.setProperty(
        "--primary",
        newTheme.primaryColor
      );
    }

    if (newTheme.successColor) {
      document.documentElement.style.setProperty(
        "--cad-green",
        newTheme.successColor
      );
    }

    if (newTheme.warningColor) {
      document.documentElement.style.setProperty(
        "--cad-orange",
        newTheme.warningColor
      );
    }

    if (newTheme.errorColor) {
      document.documentElement.style.setProperty(
        "--cad-red",
        newTheme.errorColor
      );
      document.documentElement.style.setProperty(
        "--destructive",
        newTheme.errorColor
      );
    }

    if (newTheme.secondaryColor) {
      document.documentElement.style.setProperty(
        "--secondary",
        newTheme.secondaryColor
      );
    }

    if (newTheme.fontFamily) {
      document.documentElement.style.setProperty(
        "--font-sans",
        newTheme.fontFamily
      );
    }

    if (newTheme.faviconUrl) {
      const link =
        document.querySelector<HTMLLinkElement>("link[rel*='icon']") ||
        document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = newTheme.faviconUrl;
      if (!document.querySelector("link[rel*='icon']")) {
        document.head.appendChild(link);
      }
    }
  };

  useEffect(() => {
    if (theme) {
      applyTheme(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme: appliedTheme || theme || null, isLoading, applyTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
