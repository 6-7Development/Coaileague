/**
 * MascotThoughtBubble - Readable thought bubble that stays near mascot
 * 
 * Features:
 * - Stays positioned near mascot (not scattered)
 * - Glassmorphism background for visibility on any background
 * - Proper text contrast on light and dark backgrounds
 * - Longer display time for reading
 * - Smooth enter/exit animations
 * - Mobile responsive
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import type { Thought } from '@/lib/mascot/ThoughtManager';

interface MascotThoughtBubbleProps {
  thought: Thought | null;
  mascotPosition: { x: number; y: number };
  mascotSize: number;
  isMobile?: boolean;
}

export function MascotThoughtBubble({
  thought,
  mascotPosition,
  mascotSize,
  isMobile = false,
}: MascotThoughtBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [displayedThought, setDisplayedThought] = useState<Thought | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  // Calculate position relative to mascot
  const bubblePosition = useMemo(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    // Mascot uses bottom-right positioning
    const mascotRight = mascotPosition.x;
    const mascotBottom = mascotPosition.y;
    
    // Convert to screen coordinates
    const mascotScreenX = viewportWidth - mascotRight - mascotSize / 2;
    const mascotScreenY = viewportHeight - mascotBottom - mascotSize / 2;
    
    // Bubble sizing
    const bubbleMaxWidth = isMobile ? 200 : 280;
    const bubbleMargin = isMobile ? 10 : 15;
    
    // Default: position above and to the left of mascot
    let style: React.CSSProperties = {
      position: 'fixed',
      bottom: mascotBottom + mascotSize + bubbleMargin,
      right: mascotRight - 20,
      maxWidth: bubbleMaxWidth,
    };
    
    // If mascot is near top, show bubble below
    if (mascotScreenY < 150) {
      style = {
        position: 'fixed',
        top: viewportHeight - mascotBottom + bubbleMargin,
        right: mascotRight - 20,
        maxWidth: bubbleMaxWidth,
      };
    }
    
    // If mascot is near left edge (mascotScreenX is small), shift bubble more right
    // mascotScreenX represents the mascot's X position from left side of screen
    if (mascotScreenX < 200) {
      // Mascot is on left side, ensure bubble doesn't go off-screen
      style.right = Math.max(10, mascotRight - bubbleMaxWidth);
    }
    
    // Ensure bubble stays on screen
    if (typeof style.right === 'number' && style.right < 10) {
      style.right = 10;
    }
    
    return style;
  }, [mascotPosition.x, mascotPosition.y, mascotSize, isMobile]);

  // Handle thought changes
  useEffect(() => {
    // Clear existing timers
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    if (thought) {
      setDisplayedThought(thought);
      setIsExiting(false);
      setIsVisible(true);
      
      // Calculate display duration - minimum 5 seconds, scales with text length
      const textLength = thought.text.length;
      const baseDuration = 5000; // 5 seconds minimum
      const readingTime = Math.max(baseDuration, textLength * 80); // ~80ms per character
      const maxDuration = 12000; // Max 12 seconds
      const displayDuration = Math.min(readingTime, maxDuration);
      
      // Start exit animation before hiding
      exitTimerRef.current = setTimeout(() => {
        setIsExiting(true);
      }, displayDuration - 500);
      
      // Hide completely after animation
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setDisplayedThought(null);
      }, displayDuration);
    } else {
      setIsExiting(true);
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setDisplayedThought(null);
      }, 500);
    }

    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [thought?.id]);

  if (!isVisible || !displayedThought) return null;

  return (
    <>
      <style>{`
        @keyframes bubbleEnter {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes bubbleExit {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.9) translateY(-5px);
          }
        }
        @keyframes bubblePulse {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 
                        0 0 30px rgba(147, 51, 234, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 4px 25px rgba(0, 0, 0, 0.2), 
                        0 0 40px rgba(147, 51, 234, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
        }
      `}</style>
      
      <div
        style={{
          ...bubblePosition,
          zIndex: 10000,
          pointerEvents: 'none',
        }}
        data-testid="mascot-thought-bubble"
      >
        {/* Main bubble */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.92) 0%, rgba(20, 20, 30, 0.95) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: isMobile ? '14px' : '16px',
            padding: isMobile ? '12px 14px' : '14px 18px',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), 0 0 30px rgba(147, 51, 234, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            animation: isExiting 
              ? 'bubbleExit 0.4s ease-out forwards' 
              : 'bubbleEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, bubblePulse 3s ease-in-out infinite 0.4s',
          }}
        >
          {/* Message text */}
          <p
            style={{
              margin: 0,
              fontSize: isMobile ? '13px' : '14px',
              lineHeight: 1.5,
              color: '#ffffff',
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              letterSpacing: '0.01em',
            }}
          >
            {displayedThought.text}
          </p>
          
          {/* Emoticon if present */}
          {displayedThought.emoticon && (
            <div
              style={{
                marginTop: '6px',
                fontSize: isMobile ? '16px' : '18px',
                opacity: 0.9,
              }}
            >
              {displayedThought.emoticon}
            </div>
          )}
        </div>
        
        {/* Tail pointing toward mascot */}
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            right: '20px',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '10px solid rgba(25, 25, 35, 0.93)',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
          }}
        />
      </div>
    </>
  );
}

export default MascotThoughtBubble;
