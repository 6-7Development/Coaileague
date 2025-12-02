/**
 * OrnamentExclusionScanner - Detects protected UI zones for ornament placement
 * 
 * Scans header/nav regions to identify:
 * - Logo elements (brand identity - must never be covered)
 * - Navigation links (Pricing, Features, Contact, etc.)
 * - CTA buttons (Start Free, Login, etc.)
 * - Interactive controls (search, menu toggles, notifications)
 * 
 * Returns exclusion rectangles with padding that ornaments must avoid.
 */

export interface ExclusionZone {
  id: string;
  type: 'logo' | 'nav-item' | 'cta' | 'control' | 'mascot';
  rect: DOMRect;
  padding: number;
  priority: number;
}

export interface SafeOrnamentSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

const EXCLUSION_SELECTORS = {
  logo: [
    '[data-testid*="logo"]',
    '[data-testid*="brand"]',
    '.logo',
    'header a[href="/"]',
    'header img[alt*="logo" i]',
    'header svg[data-logo]',
    '.animated-word-logo',
    '[class*="logo" i]',
  ],
  navItem: [
    'header nav a',
    'header nav button',
    '[role="navigation"] a',
    '[data-testid*="nav-link"]',
    'header a[href*="pricing"]',
    'header a[href*="features"]',
    'header a[href*="contact"]',
  ],
  cta: [
    'header button[data-testid*="start"]',
    'header a[data-testid*="start"]',
    'header button[data-testid*="cta"]',
    'header .cta',
    'header a[href*="signup"]',
    'header a[href*="login"]',
    '[data-testid*="login"]',
    '[data-testid*="get-started"]',
  ],
  control: [
    'header button[data-testid*="menu"]',
    'header button[data-testid*="search"]',
    'header button[data-testid*="notification"]',
    'header button[data-testid*="theme"]',
    '[data-testid*="sidebar-toggle"]',
    '.notification-bell',
    '.theme-toggle',
  ],
  mascot: [
    '[data-testid*="mascot"]',
    '.coai-twin-mascot',
    '.trinity-mascot',
  ],
};

const PADDING_BY_TYPE: Record<ExclusionZone['type'], number> = {
  logo: 24,
  'nav-item': 16,
  cta: 20,
  control: 16,
  mascot: 30,
};

const PRIORITY_BY_TYPE: Record<ExclusionZone['type'], number> = {
  logo: 100,
  cta: 90,
  'nav-item': 70,
  control: 60,
  mascot: 80,
};

class OrnamentExclusionScanner {
  private exclusionZones: ExclusionZone[] = [];
  private lastScanTime: number = 0;
  private scanInterval: number = 500;
  private listeners: Set<(zones: ExclusionZone[]) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.scan();
      window.addEventListener('resize', this.handleResize);
    }
  }

  private handleResize = () => {
    this.scan();
  };

  scan(): ExclusionZone[] {
    if (typeof document === 'undefined') return [];

    const now = Date.now();
    if (now - this.lastScanTime < this.scanInterval && this.exclusionZones.length > 0) {
      return this.exclusionZones;
    }
    this.lastScanTime = now;

    const zones: ExclusionZone[] = [];
    let zoneId = 0;

    for (const [type, selectors] of Object.entries(EXCLUSION_SELECTORS)) {
      const zoneType = type as ExclusionZone['type'];
      
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && rect.top < 120) {
              const existingZone = zones.find(z => 
                Math.abs(z.rect.left - rect.left) < 10 && 
                Math.abs(z.rect.top - rect.top) < 10
              );
              
              if (!existingZone) {
                zones.push({
                  id: `zone-${zoneId++}`,
                  type: zoneType,
                  rect,
                  padding: PADDING_BY_TYPE[zoneType],
                  priority: PRIORITY_BY_TYPE[zoneType],
                });
              }
            }
          });
        } catch (e) {
          // Invalid selector, skip
        }
      }
    }

    this.exclusionZones = zones;
    this.notifyListeners();
    return zones;
  }

  getExclusionZones(): ExclusionZone[] {
    return this.exclusionZones;
  }

  isPointInExclusionZone(x: number, y: number): boolean {
    return this.exclusionZones.some(zone => {
      const left = zone.rect.left - zone.padding;
      const right = zone.rect.right + zone.padding;
      const top = zone.rect.top - zone.padding;
      const bottom = zone.rect.bottom + zone.padding;
      return x >= left && x <= right && y >= top && y <= bottom;
    });
  }

  isRectInExclusionZone(rect: { x: number; y: number; width: number; height: number }): boolean {
    return this.exclusionZones.some(zone => {
      const zoneLeft = zone.rect.left - zone.padding;
      const zoneRight = zone.rect.right + zone.padding;
      const zoneTop = zone.rect.top - zone.padding;
      const zoneBottom = zone.rect.bottom + zone.padding;

      const rectRight = rect.x + rect.width;
      const rectBottom = rect.y + rect.height;

      return !(rect.x > zoneRight || rectRight < zoneLeft || 
               rect.y > zoneBottom || rectBottom < zoneTop);
    });
  }

  findSafeSlots(
    containerRect: { left: number; top: number; right: number; bottom: number },
    slotSize: { width: number; height: number },
    maxSlots: number = 10
  ): SafeOrnamentSlot[] {
    const slots: SafeOrnamentSlot[] = [];
    const step = Math.max(slotSize.width, 60);
    
    for (let x = containerRect.left; x < containerRect.right - slotSize.width; x += step) {
      for (let y = containerRect.top; y < containerRect.bottom - slotSize.height; y += step) {
        const testRect = { x, y, width: slotSize.width, height: slotSize.height };
        
        if (!this.isRectInExclusionZone(testRect)) {
          let score = 100;
          
          for (const zone of this.exclusionZones) {
            const centerX = x + slotSize.width / 2;
            const centerY = y + slotSize.height / 2;
            const zoneCenter = {
              x: zone.rect.left + zone.rect.width / 2,
              y: zone.rect.top + zone.rect.height / 2,
            };
            const distance = Math.sqrt(
              Math.pow(centerX - zoneCenter.x, 2) + 
              Math.pow(centerY - zoneCenter.y, 2)
            );
            score = Math.min(score, distance / 10);
          }
          
          slots.push({ x, y, width: slotSize.width, height: slotSize.height, score });
        }
      }
    }

    return slots
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSlots);
  }

  findSafeLightPositions(
    headerHeight: number = 50,
    lightSpacing: number = 80,
    lightSize: number = 20
  ): number[] {
    if (typeof window === 'undefined') return [];
    
    const windowWidth = window.innerWidth;
    const safePositions: number[] = [];
    
    for (let x = lightSpacing / 2; x < windowWidth - lightSpacing / 2; x += lightSpacing) {
      const testRect = {
        x: x - lightSize / 2,
        y: 5,
        width: lightSize,
        height: headerHeight - 10,
      };
      
      if (!this.isRectInExclusionZone(testRect)) {
        safePositions.push(x);
      }
    }
    
    return safePositions;
  }

  subscribe(callback: (zones: ExclusionZone[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.exclusionZones);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.exclusionZones));
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
    this.listeners.clear();
  }
}

export const ornamentExclusionScanner = new OrnamentExclusionScanner();

export function useOrnamentExclusionZones() {
  const [zones, setZones] = useState<ExclusionZone[]>([]);

  useEffect(() => {
    const unsubscribe = ornamentExclusionScanner.subscribe(setZones);
    ornamentExclusionScanner.scan();
    return unsubscribe;
  }, []);

  return zones;
}

import { useState, useEffect } from 'react';
