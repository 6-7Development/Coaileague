/**
 * UniversalSpinner — ONE loading spinner, everywhere.
 *
 * Renders the same TrinityOrbitalAvatar that drives the thought bar:
 * spinning trifecta + halo + dual orbital arcs. State defaults to
 * "thinking" so a standalone page-load feels alive (cyan/indigo, fast
 * rings). The outer wrapper carries only an ambient gold drop-shadow
 * pulse (`coai-glow`) — no more rigid `coai-dance` rotation, since the
 * avatar's own SMIL animations already provide motion.
 *
 * Sizes (pixel size of the avatar — orbital arcs scale with it):
 *   sm  →  40px  — inline in buttons, table rows, small card fallbacks
 *   md  →  72px  — auth screens, Suspense page fallbacks, rbac-route
 *   lg  → 128px  — SplashScreen, LoadingScreen, TransitionLoader
 */

import "@/styles/universal-spinner.css";
import { TrinityOrbitalAvatar } from "@/components/ui/trinity-animated-logo";
import { cn } from "@/lib/utils";

export type UniversalSpinnerSize = "sm" | "md" | "lg";

export interface UniversalSpinnerProps {
  size?: UniversalSpinnerSize;
  className?: string;
  /** Optional caption rendered under the mark. Hidden at size="sm". */
  label?: string;
}

const SIZE_PX: Record<UniversalSpinnerSize, number> = {
  sm: 40,
  md: 72,
  lg: 128,
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
        <TrinityOrbitalAvatar size={px} state="thinking" />
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
