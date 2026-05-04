/**
 * trinityState — Global Trinity logo state bridge.
 *
 * Any component that knows Trinity/HelpAI is acting imports this and calls
 * dispatchTrinityState(). The TrinityOrbitalAvatar in the ThoughtBar listens
 * via useTrinityGlobalState() and reacts immediately.
 *
 * States:
 *   idle      → logo calm, soft comet arc only
 *   thinking  → user sent message, waiting for AI response
 *   speaking  → HelpAI/Trinity is streaming or typing a response
 *   listening → PTT transmission recording in progress
 *   loading   → file upload, import parse, heavy background task
 *   success   → action completed successfully (auto-resets to idle after 2s)
 *   error     → something failed (auto-resets to idle after 3s)
 */

export type TrinityLogoState =
  | "idle" | "thinking" | "speaking" | "listening"
  | "loading" | "success" | "error" | "focused";

let resetTimer: ReturnType<typeof setTimeout> | null = null;

export function dispatchTrinityState(state: TrinityLogoState): void {
  if (resetTimer) {
    clearTimeout(resetTimer);
    resetTimer = null;
  }

  window.dispatchEvent(
    new CustomEvent("trinity-state-change", { detail: { state } })
  );

  // Auto-reset transient states so the logo never gets stuck
  if (state === "success") {
    resetTimer = setTimeout(() => dispatchTrinityState("idle"), 2000);
  } else if (state === "error") {
    resetTimer = setTimeout(() => dispatchTrinityState("idle"), 3000);
  }
}
