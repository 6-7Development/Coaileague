/** Mascot system purged — safe stubs */
export function useTrinityMode(..._args: unknown[]) { return { mode: "standard" }; }
export function useBusinessBuddyTier(..._args: unknown[]) { return {}; }
<<<<<<< Updated upstream
export function deriveTrinityModeFromUser(..._args: unknown[]) { return "standard"; }
=======

/** Returns the Trinity experience tier for a given user object. */
export function deriveTrinityModeFromUser(user: unknown): string {
  if (!user || typeof user !== "object") return "standard";
  const u = user as Record<string, unknown>;
  if (u.platformRole === "root_admin" || u.platformRole === "deputy_admin") return "guru";
  if (u.subscriptionTier === "enterprise") return "guru";
  if (u.subscriptionTier === "professional") return "advanced";
  return "standard";
}
>>>>>>> Stashed changes
