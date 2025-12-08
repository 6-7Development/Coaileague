/**
 * Universal Logout Handler
 * Single source of truth for ALL logout functionality
 * 
 * Usage: Call performLogout() from any component
 * No hardcoded values - everything from config
 */

import { LOGOUT_CONFIG } from "@/config/logout";
import { queryClient } from "@/lib/queryClient";

// Global animation context reference (set by logout trigger)
let animationContextRef: any = null;

export function setLogoutAnimationContext(context: any) {
  animationContextRef = context;
}

/**
 * Perform logout across the entire application
 * Handles API call, cache clearing, and redirect
 * Optimized for IMMEDIATE visual feedback
 * 
 * Usage: await performLogout()
 */
export async function performLogout() {
  // STEP 1: Show IMMEDIATE visual feedback - don't wait for anything
  const showAnimation = animationContextRef?.show;
  if (showAnimation) {
    showAnimation({
      mode: 'warp',
      mainText: 'Signing Out...',
      subText: 'See you soon!',
      duration: 1200,
      source: 'system'
    });
  }

  // STEP 2: Clear auth cache IMMEDIATELY (synchronous, fast)
  LOGOUT_CONFIG.cacheKeysToClear.forEach((key) => {
    queryClient.setQueryData([key], null);
  });

  // STEP 3: Clear cookies immediately (synchronous)
  document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // STEP 4: Start redirect timer EARLY - don't wait for API
  const redirectDelay = showAnimation ? 1000 : 200;
  setTimeout(() => {
    window.location.href = LOGOUT_CONFIG.redirectPath;
  }, redirectDelay);

  // STEP 5: Fire API call in background (don't await - user already sees feedback)
  fetch(LOGOUT_CONFIG.endpoint, {
    method: LOGOUT_CONFIG.method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  }).catch((error) => {
    console.warn('Logout API call failed (user already redirected):', error);
  });

  // STEP 6: Invalidate queries in background (non-blocking)
  queryClient.invalidateQueries().catch(() => {});
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
