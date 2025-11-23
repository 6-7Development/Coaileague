/**
 * Universal Logout Handler
 * Single source of truth for ALL logout functionality
 * 
 * Usage: Call performLogout() from any component
 * No hardcoded values - everything from config
 */

import { LOGOUT_CONFIG } from "@/config/logout";
import { queryClient } from "@/lib/queryClient";

/**
 * Perform logout across the entire application
 * Handles API call, cache clearing, and redirect
 * 
 * Usage: await performLogout()
 */
export async function performLogout() {
  try {
    // 1. Call logout API endpoint (from centralized config)
    await fetch(LOGOUT_CONFIG.endpoint, {
      method: LOGOUT_CONFIG.method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 2. Clear all cached auth data IMMEDIATELY
    LOGOUT_CONFIG.cacheKeysToClear.forEach((key) => {
      queryClient.setQueryData([key], null);
    });

    // 3. Invalidate all queries to force refetch
    await queryClient.invalidateQueries();

    // 4. Redirect user (from centralized config)
    if (LOGOUT_CONFIG.fullPageReload) {
      window.location.href = LOGOUT_CONFIG.redirectPath;
    } else {
      // SPA navigation
      window.location.href = LOGOUT_CONFIG.redirectPath;
    }
  } catch (error) {
    console.error(LOGOUT_CONFIG.logoutErrorMessage, error);

    // Still clear cache and redirect even if API call fails
    LOGOUT_CONFIG.cacheKeysToClear.forEach((key) => {
      queryClient.setQueryData([key], null);
    });

    // Force redirect to home
    window.location.href = LOGOUT_CONFIG.redirectPath;
  }
}

/**
 * Get the logout endpoint from config
 * Use this if you need the endpoint for other purposes
 */
export function getLogoutEndpoint() {
  return LOGOUT_CONFIG.endpoint;
}

/**
 * Get the logout redirect path from config
 */
export function getLogoutRedirectPath() {
  return LOGOUT_CONFIG.redirectPath;
}
