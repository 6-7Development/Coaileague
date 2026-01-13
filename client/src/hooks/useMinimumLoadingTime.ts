/**
 * useMinimumLoadingTime - Ensures loading states display for at least a minimum duration
 * This allows users to appreciate the Trinity mascot animation before content appears
 * 
 * Premium SaaS apps (Slack, Notion, Linear) use 2.5-3.5 second loading animations
 * to create a polished, premium feel and let users enjoy branded animations.
 */

import { useState, useEffect, useRef } from 'react';

const DEFAULT_MIN_DURATION = 2800; // 2.8 seconds - premium feel

export function useMinimumLoadingTime(
  isActuallyLoading: boolean,
  minDurationMs: number = DEFAULT_MIN_DURATION
): boolean {
  const [showLoading, setShowLoading] = useState(isActuallyLoading);
  const loadingStartTime = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActuallyLoading) {
      // Loading started - record start time
      loadingStartTime.current = Date.now();
      setShowLoading(true);
      
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else if (loadingStartTime.current !== null) {
      // Loading finished - check if minimum time has passed
      const elapsed = Date.now() - loadingStartTime.current;
      const remaining = minDurationMs - elapsed;

      if (remaining > 0) {
        // Need to wait longer for premium feel
        timeoutRef.current = setTimeout(() => {
          setShowLoading(false);
          loadingStartTime.current = null;
        }, remaining);
      } else {
        // Minimum time already passed
        setShowLoading(false);
        loadingStartTime.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActuallyLoading, minDurationMs]);

  return showLoading;
}

/**
 * Loading duration tiers for different contexts
 * Aligned with premium SaaS UX patterns
 */
export const LOADING_DURATIONS = {
  quick: 1500,       // Inline actions, subtle transitions
  standard: 2800,    // Default - enjoy Trinity animation
  extended: 3200,    // Major page loads, route changes
  initial: 3500,     // First app load - full branded experience
  showcase: 4000,    // Marketing/demo screens - maximum impact
} as const;

/**
 * Progressive loading messages for premium feel
 */
export const LOADING_MESSAGES = {
  default: [
    "Trinity is preparing your experience...",
    "Loading your workspace...",
    "Almost ready...",
  ],
  dashboard: [
    "Gathering your insights...",
    "Analyzing your data...",
    "Preparing your dashboard...",
  ],
  schedule: [
    "Optimizing your schedule...",
    "Finding the best shifts...",
    "Trinity is working her magic...",
  ],
  auth: [
    "Securing your session...",
    "Verifying credentials...",
    "Welcome back...",
  ],
} as const;
