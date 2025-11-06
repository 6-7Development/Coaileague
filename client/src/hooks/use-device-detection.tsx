import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  orientation: Orientation;
  width: number;
  height: number;
  touchEnabled: boolean;
}

/**
 * useDeviceDetection - Comprehensive device detection hook
 * 
 * Detects:
 * - Mobile (< 768px)
 * - Tablet (768px - 1023px)
 * - Desktop (>= 1024px)
 * - Portrait/Landscape orientation
 * - Touch capability
 * - Screen dimensions
 * 
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, deviceType, orientation } = useDeviceDetection();
 * 
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * 
 * if (deviceType === 'tablet') {
 *   return <TabletLayout />;
 * }
 * ```
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop' as DeviceType,
        orientation: 'landscape' as Orientation,
        width: 1024,
        height: 768,
        touchEnabled: false,
      };
    }

    return getDeviceInfo();
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    const handleOrientationChange = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
}

function getDeviceInfo(): DeviceInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Device type detection (matching Tailwind breakpoints)
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const deviceType: DeviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  // Orientation detection
  const orientation: Orientation = height > width ? 'portrait' : 'landscape';

  // Touch capability detection
  const touchEnabled =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0;

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    orientation,
    width,
    height,
    touchEnabled,
  };
}

/**
 * useOrientation - Simple hook for portrait/landscape detection
 */
export function useOrientation(): Orientation {
  const { orientation } = useDeviceDetection();
  return orientation;
}

/**
 * useIsTouchDevice - Simple hook to detect touch-enabled devices
 */
export function useIsTouchDevice(): boolean {
  const { touchEnabled } = useDeviceDetection();
  return touchEnabled;
}

/**
 * useScreenSize - Hook for getting screen dimensions
 */
export function useScreenSize(): { width: number; height: number } {
  const { width, height } = useDeviceDetection();
  return { width, height };
}
