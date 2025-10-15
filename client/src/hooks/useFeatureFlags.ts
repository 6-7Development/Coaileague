import { useQuery } from "@tanstack/react-query";
import { getFeatureFlags, hasFeature, getUpgradeMessage, getTierDisplayName } from "@/lib/featureFlags";
import type { FeatureFlags } from "@/lib/featureFlags";

interface Workspace {
  id: string;
  name: string;
  subscriptionTier?: string | null;
  maxEmployees?: number;
  maxClients?: number;
}

/**
 * Hook to access feature flags based on current workspace subscription tier
 */
export function useFeatureFlags() {
  const { data: workspace } = useQuery<Workspace>({
    queryKey: ["/api/workspaces/current"],
  });

  const tier = workspace?.subscriptionTier || 'free';
  const flags = getFeatureFlags(tier);

  return {
    tier,
    tierName: getTierDisplayName(tier),
    flags,
    hasFeature: (feature: keyof FeatureFlags) => hasFeature(tier, feature),
    getUpgradeMessage: (feature: keyof FeatureFlags) => getUpgradeMessage(tier, feature),
    workspace,
  };
}
