/**
 * Haptics Utility — Native-feel vibration feedback for mobile.
 *
 * Three-tier delivery:
 *   1. On a native Capacitor app (iOS/Android) we call @capacitor/haptics
 *      because iOS Safari does NOT honour the Web Vibration API. Same call
 *      site, same feel as native Messenger / WhatsApp.
 *   2. On Android browsers + PWAs we fall back to navigator.vibrate.
 *   3. On desktop / unsupported browsers we no-op.
 *
 * The Capacitor module is loaded lazily so the bundle stays light for users
 * on the web build who never install the native shell.
 */

import { Capacitor } from '@capacitor/core';

type ImpactStyle = 'light' | 'medium' | 'heavy';

let capHapticsModule: Promise<typeof import('@capacitor/haptics')> | null = null;
function getCapacitorHaptics() {
  if (!capHapticsModule) {
    capHapticsModule = import('@capacitor/haptics').catch(() => null as any);
  }
  return capHapticsModule;
}

const isNative = (() => {
  try { return Capacitor.isNativePlatform?.() ?? false; }
  catch { return false; }
})();

function nativeImpact(style: ImpactStyle) {
  // Fire-and-forget: do not await. Haptics must not block the click handler.
  getCapacitorHaptics().then(mod => {
    try {
      const enumStyle = mod?.ImpactStyle?.[style.charAt(0).toUpperCase() + style.slice(1) as 'Light' | 'Medium' | 'Heavy'];
      mod?.Haptics?.impact?.({ style: enumStyle ?? mod?.ImpactStyle?.Light }).catch(() => {});
    } catch { /* swallow — haptics failure must not break UX */ }
  }).catch(() => {});
}

function nativeNotification(type: 'SUCCESS' | 'WARNING' | 'ERROR') {
  getCapacitorHaptics().then(mod => {
    try {
      const enumType = mod?.NotificationType?.[type as keyof typeof mod.NotificationType];
      mod?.Haptics?.notification?.({ type: enumType }).catch(() => {});
    } catch { /* swallow */ }
  }).catch(() => {});
}

function webVibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch { /* swallow */ }
  }
}

export const haptics = {
  light: () => {
    if (isNative) nativeImpact('light');
    else webVibrate(10);
  },

  medium: () => {
    if (isNative) nativeImpact('medium');
    else webVibrate(20);
  },

  heavy: () => {
    if (isNative) nativeImpact('heavy');
    else webVibrate([30, 10, 30]);
  },

  success: () => {
    if (isNative) nativeNotification('SUCCESS');
    else webVibrate([10, 50, 20]);
  },

  error: () => {
    if (isNative) nativeNotification('ERROR');
    else webVibrate([50, 30, 50, 30, 50]);
  },

  warning: () => {
    if (isNative) nativeNotification('WARNING');
    else webVibrate([30, 20, 30]);
  },

  clockIn: () => {
    if (isNative) nativeImpact('medium');
    else webVibrate([30, 10, 30, 50, 10, 50, 20]);
  },

  duress: () => {
    if (isNative) nativeImpact('heavy');
    else webVibrate([100, 50, 100, 50, 100]);
  },
};

export default haptics;
