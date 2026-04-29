/** Seasonal themes removed — safe stubs */
export type SeasonalTheme = "default" | "christmas" | "halloween" | "valentines" | "easter";
export interface SeasonalThemeConfig {
  primaryColor: string;
  accentColor: string;
  name: string;
  enabled: boolean;
}
const DEFAULT_CONFIG: SeasonalThemeConfig = {
  primaryColor: "#38bdf8",
  accentColor: "#a855f7",
  name: "Default",
  enabled: false,
};
export const SEASONAL_THEMES: Record<SeasonalTheme, SeasonalThemeConfig> = {
  default:    DEFAULT_CONFIG,
  christmas:  DEFAULT_CONFIG,
  halloween:  DEFAULT_CONFIG,
  valentines: DEFAULT_CONFIG,
  easter:     DEFAULT_CONFIG,
};
export function getCurrentSeasonalTheme(): SeasonalTheme { return "default"; }
export function getThemeConfig(_theme?: SeasonalTheme): SeasonalThemeConfig { return DEFAULT_CONFIG; }
export const SEASONAL_EFFECTS_CONFIG = {};
export default SEASONAL_THEMES;
