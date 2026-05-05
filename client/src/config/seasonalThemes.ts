/** Seasonal theme configurations — public-page-only visual effects */
export type SeasonalTheme = "default" | "christmas" | "halloween" | "valentines" | "easter";
export interface SeasonalThemeConfig {
  primaryColor: string;
  accentColor: string;
  name: string;
  enabled: boolean;
}
export const SEASONAL_THEMES: Record<SeasonalTheme, SeasonalThemeConfig> = {
  default:    { primaryColor: "#38bdf8", accentColor: "#a855f7", name: "Default",    enabled: false },
  christmas:  { primaryColor: "#dc2626", accentColor: "#16a34a", name: "Christmas",  enabled: true  },
  halloween:  { primaryColor: "#f97316", accentColor: "#7c3aed", name: "Halloween",  enabled: true  },
  valentines: { primaryColor: "#ec4899", accentColor: "#be185d", name: "Valentines", enabled: true  },
  easter:     { primaryColor: "#a855f7", accentColor: "#22c55e", name: "Easter",     enabled: true  },
};
export function getActiveTheme(): SeasonalThemeConfig {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  if (month === 12 || (month === 1 && day <= 5)) return SEASONAL_THEMES.christmas;
  if (month === 2 && day <= 20) return SEASONAL_THEMES.valentines;
  if ((month === 10 && day >= 15) || (month === 11 && day <= 2)) return SEASONAL_THEMES.halloween;
  if ((month === 3 && day >= 25) || (month === 4 && day <= 15)) return SEASONAL_THEMES.easter;
  return SEASONAL_THEMES.default;
}

// Backwards-compatible aliases for providers that import old function names
export const getCurrentSeasonalTheme = getActiveTheme;
export function getThemeConfig(theme: SeasonalTheme): SeasonalThemeConfig {
  return SEASONAL_THEMES[theme] ?? SEASONAL_THEMES.default;
}
