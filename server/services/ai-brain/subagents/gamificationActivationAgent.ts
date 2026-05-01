/**
 * GamificationActivationAgent — STUB
 * Gamification removed per product decision. Stub preserves onboardingOrchestrator types.
 */

export interface ActivationResult {
  success: boolean;
  achievementsCreated: number;
  automationGatesUnlocked: number;
  errors: string[];
}

export const AUTOMATION_GATES: Record<string, string> = {};

export const gamificationActivationAgent = {
  activateForOrg: async (_params: unknown): Promise<ActivationResult> => ({
    success: true,
    achievementsCreated: 0,
    automationGatesUnlocked: 0,
    errors: [],
  }),
  /** Whether gamification is active for this workspace. */
  isGamificationEnabled: (_workspaceId: string): boolean => false,
  /** Returns current automation gate status for a workspace. */
  getAutomationGateStatus: async (_workspaceId: string): Promise<{ gates: Array<{ unlocked: boolean }> }> =>
    ({ gates: [] }),
};
