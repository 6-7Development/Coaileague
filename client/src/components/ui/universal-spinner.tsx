/**
 * UniversalSpinner — ONE loading spinner, everywhere.
 *
 * Wraps <CoAIleagueLogoMark> (the Trinity Triquetra brand mark) and drives
 * a rich CSS-only animation defined in `client/src/styles/universal-spinner.css`.
 *
 * Animation is pure CSS keyframes — no framer-motion, no JS driver, no
 * external dependencies. The 2.5-second cycle is designed to be SLOW enough
 * for users to actually appreciate:
 *   - Clockwise 180° rotation (0.8s)
 *   - Pause at 180° (0.2s)
 *   - Counter-clockwise 90° (0.6s)
 *   - Y-axis tilt / flip (0.5s)
 *   - Return to center with scale pulse 1.0 → 1.08 → 1.0 (0.4s)
 * Plus a parallel gold (#F59E0B) drop-shadow glow pulse.
 *
 * Sizes:
 *   sm  →  32px  — inline in buttons, table rows, small card fallbacks
 *   md  →  64px  — auth screens (Signing In), Suspense page fallbacks,
 *                  rbac-route loading, homepage auth redirect
 *   lg  → 120px  — SplashScreen, LoadingScreen, TransitionLoader
 *
 * Accessibility: role="status" + aria-live="polite", with an optional label
 * caption rendered beneath the mark (hidden on the small variant).
 *
 * Usage:
 *   <UniversalSpinner size="lg" />
 *   <UniversalSpinner size="md" label="Loading your dashboard…" />
 */

import "@/styles/universal-spinner.css";
import { CoAIleagueLogoMark } from "@/components/ui/coaileague-logo-mark";
import { cn } from "@/lib/utils";

export type UniversalSpinnerSize = "sm" | "md" | "lg";

export interface UniversalSpinnerProps {
  size?: UniversalSpinnerSize;
  className?: string;
  /** Optional caption rendered under the mark. Hidden at size="sm". */
  label?: string;
}

const SIZE_PX: Record<UniversalSpinnerSize, number> = {
  sm: 32,
  md: 64,
  lg: 120,
};

const LABEL_SIZE_CLASS: Record<UniversalSpinnerSize, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
};

export function UniversalSpinner({
  size = "md",
  className,
  label,
}: UniversalSpinnerProps) {
  const px = SIZE_PX[size];
  const showLabel = Boolean(label) && size !== "sm";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
      data-testid="universal-spinner"
      data-size={size}
    >
      <span
        className="coai-universal-spinner"
        style={{ width: px, height: px }}
      >
        <CoAIleagueLogoMark size={px} />
      </span>

      {showLabel && (
        <span
          className={cn(
            "font-medium text-muted-foreground tracking-wide",
            LABEL_SIZE_CLASS[size],
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default UniversalSpinner;
