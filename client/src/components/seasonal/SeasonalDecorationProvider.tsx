/**
 * Seasonal Decoration Provider
 * 
 * Smart decoration system that:
 * - Avoids blocking text, titles, and important data
 * - Aligns decorations at edges and corners (not scattered randomly)
 * - Transitions between holidays automatically
 * - Works on all pages including workspaces, loading, error, data pages
 * - Returns to normal view during non-holiday periods
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// American holidays calendar with date ranges and transition logic
export interface HolidayDefinition {
  id: string;
  name: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  decorationType: 'snowflakes' | 'fireworks' | 'hearts' | 'flowers' | 'flags' | 'leaves' | 'pumpkins' | 'turkeys' | 'lights' | 'none';
  primaryColors: string[];
  accentColors: string[];
  nextHoliday?: string; // ID of next holiday in sequence
}

// American holidays in chronological order
export const AMERICAN_HOLIDAYS: HolidayDefinition[] = [
  {
    id: 'new_year',
    name: 'New Year',
    startMonth: 1, startDay: 1,
    endMonth: 1, endDay: 3,
    decorationType: 'fireworks',
    primaryColors: ['#FFD700', '#FFFFFF', '#C0C0C0'],
    accentColors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
    nextHoliday: 'valentines'
  },
  {
    id: 'valentines',
    name: "Valentine's Day",
    startMonth: 2, startDay: 12,
    endMonth: 2, endDay: 15,
    decorationType: 'hearts',
    primaryColors: ['#FF1493', '#FF69B4', '#FFB6C1'],
    accentColors: ['#FFFFFF', '#DC143C'],
    nextHoliday: 'spring'
  },
  {
    id: 'spring',
    name: 'Spring',
    startMonth: 3, startDay: 20,
    endMonth: 4, endDay: 15,
    decorationType: 'flowers',
    primaryColors: ['#90EE90', '#98FB98', '#FFB6C1'],
    accentColors: ['#FFFF00', '#FFA500', '#87CEEB'],
    nextHoliday: 'memorial'
  },
  {
    id: 'memorial',
    name: 'Memorial Day',
    startMonth: 5, startDay: 25,
    endMonth: 5, endDay: 28,
    decorationType: 'flags',
    primaryColors: ['#002868', '#BF0A30', '#FFFFFF'],
    accentColors: ['#C4A000'],
    nextHoliday: 'independence'
  },
  {
    id: 'independence',
    name: 'Independence Day',
    startMonth: 7, startDay: 2,
    endMonth: 7, endDay: 6,
    decorationType: 'fireworks',
    primaryColors: ['#002868', '#BF0A30', '#FFFFFF'],
    accentColors: ['#FFD700', '#FF6B6B'],
    nextHoliday: 'labor'
  },
  {
    id: 'labor',
    name: 'Labor Day',
    startMonth: 9, startDay: 1,
    endMonth: 9, endDay: 3,
    decorationType: 'flags',
    primaryColors: ['#002868', '#BF0A30', '#FFFFFF'],
    accentColors: ['#FFD700'],
    nextHoliday: 'halloween'
  },
  {
    id: 'halloween',
    name: 'Halloween',
    startMonth: 10, startDay: 25,
    endMonth: 11, endDay: 1,
    decorationType: 'pumpkins',
    primaryColors: ['#FF6600', '#000000', '#800080'],
    accentColors: ['#00FF00', '#FFFFFF'],
    nextHoliday: 'thanksgiving'
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    startMonth: 11, startDay: 21,
    endMonth: 11, endDay: 29,
    decorationType: 'leaves',
    primaryColors: ['#D2691E', '#8B4513', '#FFD700'],
    accentColors: ['#FF6600', '#8B0000'],
    nextHoliday: 'christmas'
  },
  {
    id: 'christmas',
    name: 'Christmas',
    startMonth: 12, startDay: 15,
    endMonth: 12, endDay: 26,
    decorationType: 'lights',
    primaryColors: ['#FF0000', '#00FF00', '#FFFFFF'],
    accentColors: ['#FFD700', '#C0C0C0'],
    nextHoliday: 'new_year'
  },
];

// Decoration placement zones that avoid content
export type PlacementZone = 
  | 'top-left-corner' 
  | 'top-right-corner' 
  | 'bottom-left-corner' 
  | 'bottom-right-corner'
  | 'top-edge'
  | 'bottom-edge'
  | 'left-edge'
  | 'right-edge';

export interface DecorationElement {
  id: string;
  zone: PlacementZone;
  type: string;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  opacity: number;
}

interface SeasonalContextType {
  currentHoliday: HolidayDefinition | null;
  isHolidayActive: boolean;
  decorations: DecorationElement[];
  toggleDecorations: () => void;
  decorationsEnabled: boolean;
}

const SeasonalContext = createContext<SeasonalContextType>({
  currentHoliday: null,
  isHolidayActive: false,
  decorations: [],
  toggleDecorations: () => {},
  decorationsEnabled: true
});

export function useSeasonalDecorations() {
  return useContext(SeasonalContext);
}

// Get current holiday based on date
function getCurrentHoliday(): HolidayDefinition | null {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  for (const holiday of AMERICAN_HOLIDAYS) {
    const startDate = new Date(now.getFullYear(), holiday.startMonth - 1, holiday.startDay);
    const endDate = new Date(now.getFullYear(), holiday.endMonth - 1, holiday.endDay);
    
    // Handle year wrap (e.g., Christmas -> New Year)
    if (holiday.startMonth > holiday.endMonth) {
      if ((month >= holiday.startMonth && day >= holiday.startDay) ||
          (month <= holiday.endMonth && day <= holiday.endDay)) {
        return holiday;
      }
    } else {
      if (month === holiday.startMonth && day >= holiday.startDay && month === holiday.endMonth && day <= holiday.endDay) {
        return holiday;
      }
      if (month === holiday.startMonth && day >= holiday.startDay && month < holiday.endMonth) {
        return holiday;
      }
      if (month > holiday.startMonth && month < holiday.endMonth) {
        return holiday;
      }
      if (month > holiday.startMonth && month === holiday.endMonth && day <= holiday.endDay) {
        return holiday;
      }
    }
  }
  
  return null;
}

// Generate decorations for placement zones
function generateDecorations(holiday: HolidayDefinition): DecorationElement[] {
  const decorations: DecorationElement[] = [];
  const zones: PlacementZone[] = [
    'top-left-corner', 'top-right-corner', 
    'bottom-left-corner', 'bottom-right-corner',
    'top-edge', 'bottom-edge'
  ];
  
  // Add corner and edge decorations based on holiday type
  zones.forEach((zone, index) => {
    const isCorner = zone.includes('corner');
    const count = isCorner ? 3 : 5;
    
    for (let i = 0; i < count; i++) {
      decorations.push({
        id: `${zone}-${i}`,
        zone,
        type: holiday.decorationType,
        color: holiday.primaryColors[i % holiday.primaryColors.length],
        size: isCorner ? 16 + Math.random() * 12 : 12 + Math.random() * 8,
        rotation: Math.random() * 360,
        delay: index * 0.1 + i * 0.05,
        opacity: 0.6 + Math.random() * 0.3
      });
    }
  });
  
  return decorations;
}

// Decoration renderer component
function DecorationRenderer({ decoration, zone }: { decoration: DecorationElement; zone: PlacementZone }) {
  const getZoneStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: 9998,
    };
    
    switch (zone) {
      case 'top-left-corner':
        return { ...base, top: 8 + Math.random() * 40, left: 8 + Math.random() * 40 };
      case 'top-right-corner':
        return { ...base, top: 8 + Math.random() * 40, right: 8 + Math.random() * 40 };
      case 'bottom-left-corner':
        return { ...base, bottom: 8 + Math.random() * 40, left: 8 + Math.random() * 40 };
      case 'bottom-right-corner':
        return { ...base, bottom: 8 + Math.random() * 40, right: 8 + Math.random() * 40 };
      case 'top-edge':
        return { ...base, top: 4, left: `${10 + Math.random() * 80}%` };
      case 'bottom-edge':
        return { ...base, bottom: 4, left: `${10 + Math.random() * 80}%` };
      case 'left-edge':
        return { ...base, left: 4, top: `${10 + Math.random() * 80}%` };
      case 'right-edge':
        return { ...base, right: 4, top: `${10 + Math.random() * 80}%` };
      default:
        return base;
    }
  };
  
  const getIcon = () => {
    switch (decoration.type) {
      case 'snowflakes':
        return '❄';
      case 'fireworks':
        return '✦';
      case 'hearts':
        return '♥';
      case 'flowers':
        return '✿';
      case 'flags':
        return '★';
      case 'leaves':
        return '🍂';
      case 'pumpkins':
        return '🎃';
      case 'turkeys':
        return '🦃';
      case 'lights':
        return '✦';
      default:
        return '✦';
    }
  };
  
  return (
    <motion.div
      style={{
        ...getZoneStyles(),
        fontSize: decoration.size,
        color: decoration.color,
        opacity: decoration.opacity,
        transform: `rotate(${decoration.rotation}deg)`,
        textShadow: `0 0 8px ${decoration.color}40`,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: decoration.opacity,
        scale: 1,
        y: decoration.type === 'snowflakes' ? [0, 10, 0] : 0
      }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ 
        delay: decoration.delay,
        duration: 0.5,
        y: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
      }}
    >
      {getIcon()}
    </motion.div>
  );
}

// String lights decoration for Christmas
function StringLights({ color }: { color: string }) {
  const lights = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    color: i % 2 === 0 ? '#FF0000' : '#00FF00',
    x: (i / 14) * 100
  }));
  
  return (
    <div className="fixed top-0 left-0 right-0 h-6 pointer-events-none z-[9998]">
      <svg width="100%" height="24" viewBox="0 0 100 24" preserveAspectRatio="none">
        <path
          d="M 0 8 Q 6 12 12.5 8 T 25 8 T 37.5 8 T 50 8 T 62.5 8 T 75 8 T 87.5 8 T 100 8"
          stroke="#333"
          strokeWidth="2"
          fill="none"
        />
        {lights.map((light, i) => (
          <motion.circle
            key={light.id}
            cx={`${light.x}%`}
            cy="12"
            r="4"
            fill={light.color}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              delay: i * 0.1,
              ease: 'easeInOut'
            }}
            style={{ filter: `drop-shadow(0 0 4px ${light.color})` }}
          />
        ))}
      </svg>
    </div>
  );
}

// Corner garland decoration
function CornerGarland({ position, colors }: { position: 'top-left' | 'top-right'; colors: string[] }) {
  return (
    <div 
      className={`fixed ${position === 'top-left' ? 'top-0 left-0' : 'top-0 right-0'} w-24 h-24 pointer-events-none z-[9997]`}
      style={{
        transform: position === 'top-right' ? 'scaleX(-1)' : undefined
      }}
    >
      <svg width="96" height="96" viewBox="0 0 96 96">
        <path
          d="M 0 0 Q 48 24 96 0 L 96 24 Q 48 48 0 24 Z"
          fill={`url(#garland-gradient-${position})`}
          opacity="0.8"
        />
        <defs>
          <linearGradient id={`garland-gradient-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="50%" stopColor={colors[1] || colors[0]} />
            <stop offset="100%" stopColor={colors[2] || colors[0]} />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map(i => (
          <motion.circle
            key={i}
            cx={16 + i * 20}
            cy={8 + (i % 2) * 8}
            r="5"
            fill={colors[i % colors.length]}
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            style={{ filter: `drop-shadow(0 0 4px ${colors[i % colors.length]})` }}
          />
        ))}
      </svg>
    </div>
  );
}

export function SeasonalDecorationProvider({ children }: { children: React.ReactNode }) {
  const [currentHoliday, setCurrentHoliday] = useState<HolidayDefinition | null>(null);
  const [decorationsEnabled, setDecorationsEnabled] = useState(true);
  
  // Check for current holiday on mount and daily
  useEffect(() => {
    const checkHoliday = () => {
      setCurrentHoliday(getCurrentHoliday());
    };
    
    checkHoliday();
    
    // Check every hour for holiday transitions
    const interval = setInterval(checkHoliday, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const decorations = useMemo(() => {
    if (!currentHoliday || !decorationsEnabled) return [];
    return generateDecorations(currentHoliday);
  }, [currentHoliday, decorationsEnabled]);
  
  const toggleDecorations = useCallback(() => {
    setDecorationsEnabled(prev => !prev);
  }, []);
  
  const value = useMemo(() => ({
    currentHoliday,
    isHolidayActive: !!currentHoliday && decorationsEnabled,
    decorations,
    toggleDecorations,
    decorationsEnabled
  }), [currentHoliday, decorations, toggleDecorations, decorationsEnabled]);
  
  return (
    <SeasonalContext.Provider value={value}>
      {children}
      
      <AnimatePresence>
        {currentHoliday && decorationsEnabled && (
          <>
            {/* Corner garlands for festive holidays */}
            {(currentHoliday.id === 'christmas' || currentHoliday.id === 'new_year') && (
              <>
                <CornerGarland position="top-left" colors={currentHoliday.primaryColors} />
                <CornerGarland position="top-right" colors={currentHoliday.primaryColors} />
              </>
            )}
            
            {/* String lights for Christmas */}
            {currentHoliday.id === 'christmas' && (
              <StringLights color={currentHoliday.primaryColors[0]} />
            )}
            
            {/* Individual decorations placed at edges/corners */}
            {decorations.map(decoration => (
              <DecorationRenderer 
                key={decoration.id} 
                decoration={decoration} 
                zone={decoration.zone}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </SeasonalContext.Provider>
  );
}

export default SeasonalDecorationProvider;
