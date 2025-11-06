/**
 * AutoForce™ Responsive Utility Functions
 * Helper functions for responsive design
 */

/**
 * Get current device type based on window width
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Check if device is tablet
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 768 && width < 1024;
}

/**
 * Check if device is desktop
 */
export function isDesktopDevice(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= 1024;
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get responsive font size based on base size and device
 */
export function getResponsiveFontSize(baseSize: number): string {
  const device = getDeviceType();
  
  switch (device) {
    case 'mobile':
      return `${baseSize * 0.875}px`; // 87.5% on mobile
    case 'tablet':
      return `${baseSize}px`; // 100% on tablet
    case 'desktop':
      return `${baseSize * 1.125}px`; // 112.5% on desktop
    default:
      return `${baseSize}px`;
  }
}

/**
 * Get responsive spacing based on base spacing and device
 */
export function getResponsiveSpacing(baseSpacing: number): number {
  const device = getDeviceType();
  
  switch (device) {
    case 'mobile':
      return baseSpacing * 0.75; // 75% on mobile
    case 'tablet':
      return baseSpacing; // 100% on tablet
    case 'desktop':
      return baseSpacing * 1.25; // 125% on desktop
    default:
      return baseSpacing;
  }
}

/**
 * Get responsive number of columns for grid
 */
export function getResponsiveColumns(desktopColumns: number): number {
  const device = getDeviceType();
  
  switch (device) {
    case 'mobile':
      return 1; // Always 1 column on mobile
    case 'tablet':
      return Math.min(2, desktopColumns); // Max 2 columns on tablet
    case 'desktop':
      return desktopColumns; // Full columns on desktop
    default:
      return desktopColumns;
  }
}

/**
 * Format image URL for responsive loading (add size parameters if supported)
 */
export function getResponsiveImageUrl(url: string, width?: number): string {
  if (!url) return url;
  
  const device = getDeviceType();
  const deviceWidth = width || (device === 'mobile' ? 640 : device === 'tablet' ? 768 : 1280);
  
  // If URL supports query parameters for resizing (e.g., imgix, cloudinary)
  const hasQuery = url.includes('?');
  const separator = hasQuery ? '&' : '?';
  
  // Add width parameter if URL looks like it might support it
  if (url.includes('cloudinary') || url.includes('imgix') || url.includes('imagekit')) {
    return `${url}${separator}w=${deviceWidth}&auto=format,compress`;
  }
  
  return url;
}

/**
 * Clamp text length based on device (shorter on mobile)
 */
export function getResponsiveTextLength(
  text: string,
  mobileLength: number,
  tabletLength: number,
  desktopLength: number
): string {
  const device = getDeviceType();
  const maxLength =
    device === 'mobile' ? mobileLength : device === 'tablet' ? tabletLength : desktopLength;
  
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get optimal image dimensions for device
 */
export function getOptimalImageDimensions(aspectRatio: 'video' | 'square' | 'portrait' | 'landscape' = 'video'): {
  width: number;
  height: number;
} {
  const device = getDeviceType();
  
  const baseWidths = {
    mobile: 640,
    tablet: 768,
    desktop: 1280,
  };
  
  const width = baseWidths[device];
  
  const aspectRatios = {
    video: 16 / 9,
    square: 1,
    portrait: 3 / 4,
    landscape: 4 / 3,
  };
  
  const ratio = aspectRatios[aspectRatio];
  const height = Math.round(width / ratio);
  
  return { width, height };
}
