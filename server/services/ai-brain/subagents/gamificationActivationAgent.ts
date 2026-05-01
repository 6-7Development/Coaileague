/**
 * GamificationActivationAgent — STUB
 * Gamification removed per product decision. Stub preserves onboardingOrchestrator types.
 *
 * The shape (achievementsCreated, automationGatesUnlocked: string[], errors)
 * matches what the orchestrator threads into its summary so any future
 * re-introduction can drop in a real implementation without touching callers.
 */

export interface ActivationResult {
  success: boolean;
  achievementsCreated: number;
  automationGatesUnlocked: string[];
  errors: string[];
}

export interface AutomationGate {
  id: string;
  name: string;
  unlocked: boolean;
  requiredLevel: number;
}

export interface AutomationGateStatus {
  gates: AutomationGate[];
  currentLevel: number;
}

export const AUTOMATION_GATES: Record<string, string> = {};

export const gamificationActivationAgent = {
  activateForOrg: async (_params: any): Promise<ActivationResult> => ({
    success: true,
    achievementsCreated: 0,
    automationGatesUnlocked: [],
    errors: [],
  }),
  isGamificationEnabled: (_workspaceId: string): boolean => false,
  getAutomationGateStatus: async (_workspaceId: string): Promise<AutomationGateStatus> => ({
    gates: [],
    currentLevel: 0,
  }),
};
