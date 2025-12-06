/**
 * FestiveDialogueBubble - Holiday-themed mascot dialogue with crisp canvas effects
 * 
 * Features:
 * - White background with black text (high contrast, readable)
 * - Festive holiday frame with decorative elements
 * - Typewriter text entry (chronological letter/word appearance)
 * - Creative disappear effects (shatter, scatter, dissolve, sparkle-out)
 * - Canvas-based crisp animations (no blur/glow)
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import type { Thought } from '@/lib/mascot/ThoughtManager';
import { THOUGHT_BUBBLE_BOUNDARY_CONFIG } from '@/config/mascotConfig';

interface FestiveDialogueBubbleProps {
  thought: Thought | null;
  mascotPosition: { x: number; y: number };
  mascotSize: number;
  isMobile?: boolean;
}

interface LetterState {
  char: string;
  x: number;
  y: number;
  visible: boolean;
  exiting: boolean;
  exitEffect: ExitEffect;
  exitProgress: number;
  exitVelocity: { x: number; y: number; rotation: number; scale: number };
}

type ExitEffect = 'shatter' | 'scatter' | 'dissolve' | 'sparkle' | 'snowfall' | 'confetti';

const EXIT_EFFECTS: ExitEffect[] = ['shatter', 'scatter', 'dissolve', 'sparkle', 'snowfall', 'confetti'];

const HOLIDAY_FRAME_COLORS = {
  primary: '#c41e3a',
  secondary: '#165b33',
  gold: '#ffd700',
  white: '#ffffff',
  snow: '#f0f8ff',
};

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const calculatePosition = (
  mascotPos: { x: number; y: number },
  mascotSize: number,
  isMobile: boolean,
  bubbleWidth: number,
  bubbleHeight: number
): { top: number; left: number } => {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  
  const mascotCenterX = viewportWidth - mascotPos.x - (mascotSize / 2);
  const mascotTopY = viewportHeight - mascotPos.y - mascotSize;
  const mascotLeftX = mascotCenterX - (mascotSize / 2);
  const mascotRightX = mascotCenterX + (mascotSize / 2);
  
  const clearanceGap = isMobile ? 12 : 16;
  const padding = 8;
  
  let bubbleLeftX = mascotLeftX - bubbleWidth - clearanceGap;
  let bubbleTop = mascotTopY + (mascotSize / 2) - (bubbleHeight / 2);
  
  if (bubbleLeftX < padding) {
    bubbleLeftX = mascotCenterX - (bubbleWidth / 2);
    bubbleTop = mascotTopY - clearanceGap - bubbleHeight;
    bubbleLeftX = Math.max(padding, Math.min(bubbleLeftX, viewportWidth - bubbleWidth - padding));
    
    if (bubbleTop < padding) {
      const rightSpace = viewportWidth - mascotRightX - padding;
      if (rightSpace >= bubbleWidth + clearanceGap) {
        bubbleLeftX = mascotRightX + clearanceGap;
        bubbleTop = mascotTopY + (mascotSize / 2) - (bubbleHeight / 2);
      }
    }
  }
  
  bubbleTop = Math.max(padding, Math.min(bubbleTop, viewportHeight - bubbleHeight - padding));
  bubbleLeftX = Math.max(padding, Math.min(bubbleLeftX, viewportWidth - bubbleWidth - padding));
  
  return { top: bubbleTop, left: bubbleLeftX };
};

export const FestiveDialogueBubble = memo(function FestiveDialogueBubble({
  thought,
  mascotPosition,
  mascotSize,
  isMobile = false,
}: FestiveDialogueBubbleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [letters, setLetters] = useState<LetterState[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastThoughtIdRef = useRef<string | null>(null);
  const phaseRef = useRef<'entering' | 'displaying' | 'exiting' | 'done'>('done');
  const entryProgressRef = useRef(0);
  const exitStartTimeRef = useRef(0);
  
  const fontSize = isMobile ? 14 : 18;
  const lineHeight = fontSize * 1.4;
  const padding = isMobile ? 16 : 24;
  const frameWidth = isMobile ? 6 : 8;
  const maxWidth = isMobile ? 220 : 320;
  
  const measureText = useCallback((ctx: CanvasRenderingContext2D, text: string) => {
    ctx.font = `bold ${fontSize}px 'Inter', 'Segoe UI', system-ui, sans-serif`;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxTextWidth = maxWidth - (padding * 2) - (frameWidth * 2);
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    const textHeight = lines.length * lineHeight;
    const bubbleWidth = Math.min(maxWidth, Math.max(...lines.map(l => ctx.measureText(l).width)) + (padding * 2) + (frameWidth * 2));
    const bubbleHeight = textHeight + (padding * 2) + (frameWidth * 2);
    
    return { lines, bubbleWidth, bubbleHeight };
  }, [fontSize, lineHeight, padding, frameWidth, maxWidth]);
  
  const initLetterStates = useCallback((text: string, ctx: CanvasRenderingContext2D, bubbleWidth: number) => {
    ctx.font = `bold ${fontSize}px 'Inter', 'Segoe UI', system-ui, sans-serif`;
    const { lines } = measureText(ctx, text);
    const newLetters: LetterState[] = [];
    
    let charIndex = 0;
    const startX = frameWidth + padding;
    let y = frameWidth + padding + fontSize;
    
    for (const line of lines) {
      let x = startX;
      for (const char of line) {
        newLetters.push({
          char,
          x,
          y,
          visible: false,
          exiting: false,
          exitEffect: pickRandom(EXIT_EFFECTS),
          exitProgress: 0,
          exitVelocity: {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8 - 2,
            rotation: (Math.random() - 0.5) * 720,
            scale: Math.random() * 0.5 + 0.5,
          },
        });
        x += ctx.measureText(char).width;
        charIndex++;
      }
      if (lines.indexOf(line) < lines.length - 1) {
        newLetters.push({
          char: ' ',
          x: 0,
          y: 0,
          visible: false,
          exiting: false,
          exitEffect: 'dissolve',
          exitProgress: 0,
          exitVelocity: { x: 0, y: 0, rotation: 0, scale: 1 },
        });
      }
      y += lineHeight;
    }
    
    return newLetters;
  }, [fontSize, lineHeight, padding, frameWidth, measureText]);
  
  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    
    ctx.fillStyle = HOLIDAY_FRAME_COLORS.white;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    
    const radius = 12;
    ctx.beginPath();
    ctx.roundRect(frameWidth / 2, frameWidth / 2, width - frameWidth, height - frameWidth, radius);
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, HOLIDAY_FRAME_COLORS.primary);
    gradient.addColorStop(0.25, HOLIDAY_FRAME_COLORS.secondary);
    gradient.addColorStop(0.5, HOLIDAY_FRAME_COLORS.gold);
    gradient.addColorStop(0.75, HOLIDAY_FRAME_COLORS.secondary);
    gradient.addColorStop(1, HOLIDAY_FRAME_COLORS.primary);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = frameWidth;
    ctx.beginPath();
    ctx.roundRect(frameWidth / 2, frameWidth / 2, width - frameWidth, height - frameWidth, radius);
    ctx.stroke();
    
    const ornamentRadius = isMobile ? 4 : 5;
    const ornamentPositions = [
      { x: radius + frameWidth, y: frameWidth / 2 },
      { x: width - radius - frameWidth, y: frameWidth / 2 },
      { x: radius + frameWidth, y: height - frameWidth / 2 },
      { x: width - radius - frameWidth, y: height - frameWidth / 2 },
      { x: width / 2, y: frameWidth / 2 },
      { x: width / 2, y: height - frameWidth / 2 },
    ];
    
    ornamentPositions.forEach((pos, i) => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ornamentRadius, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? HOLIDAY_FRAME_COLORS.primary : HOLIDAY_FRAME_COLORS.gold;
      ctx.fill();
      ctx.strokeStyle = HOLIDAY_FRAME_COLORS.white;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    
    ctx.restore();
  }, [frameWidth, isMobile]);
  
  const drawLetter = useCallback((
    ctx: CanvasRenderingContext2D,
    letter: LetterState,
    _index: number,
  ) => {
    if (!letter.visible || letter.char === ' ') return;
    
    ctx.save();
    ctx.font = `bold ${fontSize}px 'Inter', 'Segoe UI', system-ui, sans-serif`;
    
    if (letter.exiting) {
      const p = letter.exitProgress;
      const { x: vx, y: vy, rotation: vr, scale: vs } = letter.exitVelocity;
      
      switch (letter.exitEffect) {
        case 'shatter':
          ctx.globalAlpha = 1 - p;
          ctx.translate(letter.x + vx * p * 20, letter.y + vy * p * 20 + p * p * 50);
          ctx.rotate((vr * p * Math.PI) / 180);
          ctx.scale(1 - p * 0.5, 1 - p * 0.5);
          break;
          
        case 'scatter':
          ctx.globalAlpha = 1 - p * p;
          ctx.translate(
            letter.x + Math.sin(p * Math.PI * 4) * 10 + vx * p * 30,
            letter.y + vy * p * 40 - p * 20
          );
          ctx.rotate((vr * p * Math.PI) / 180);
          break;
          
        case 'dissolve':
          ctx.globalAlpha = (1 - p) * (1 - p);
          ctx.translate(letter.x, letter.y);
          ctx.scale(1 + p * 0.3, 1 + p * 0.3);
          break;
          
        case 'sparkle':
          ctx.globalAlpha = p < 0.5 ? 1 : (1 - p) * 2;
          ctx.translate(letter.x, letter.y - p * 30);
          ctx.scale(1 + Math.sin(p * Math.PI * 3) * 0.2, 1 + Math.sin(p * Math.PI * 3) * 0.2);
          break;
          
        case 'snowfall':
          ctx.globalAlpha = 1 - p;
          ctx.translate(
            letter.x + Math.sin(p * Math.PI * 6) * 15,
            letter.y + p * 60
          );
          ctx.rotate((Math.sin(p * Math.PI * 2) * 20 * Math.PI) / 180);
          break;
          
        case 'confetti':
          ctx.globalAlpha = 1 - p * p;
          ctx.translate(
            letter.x + vx * p * 25,
            letter.y + vy * p * 15 + p * p * 80
          );
          ctx.rotate((vr * p * 2 * Math.PI) / 180);
          ctx.scale(1 - p * 0.3, 1 - p * 0.3);
          break;
      }
    } else {
      ctx.translate(letter.x, letter.y);
    }
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText(letter.char, 0, 0);
    
    ctx.restore();
  }, [fontSize]);
  
  useEffect(() => {
    if (!thought || thought.id === lastThoughtIdRef.current) return;
    
    lastThoughtIdRef.current = thought.id;
    phaseRef.current = 'entering';
    entryProgressRef.current = 0;
    exitStartTimeRef.current = 0;
    setIsActive(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { bubbleWidth, bubbleHeight } = measureText(ctx, thought.text);
    canvas.width = bubbleWidth * 2;
    canvas.height = bubbleHeight * 2;
    canvas.style.width = `${bubbleWidth}px`;
    canvas.style.height = `${bubbleHeight}px`;
    ctx.scale(2, 2);
    
    const newLetters = initLetterStates(thought.text, ctx, bubbleWidth);
    setLetters(newLetters);
    
    const totalChars = newLetters.length;
    const entryDuration = Math.min(totalChars * 50, 2000);
    const displayDuration = Math.max(3000, thought.text.length * 80);
    const exitDuration = 1500;
    
    let startTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      
      const { bubbleWidth, bubbleHeight } = measureText(ctx, thought.text);
      
      ctx.clearRect(0, 0, bubbleWidth, bubbleHeight);
      drawFrame(ctx, bubbleWidth, bubbleHeight);
      
      if (phaseRef.current === 'entering') {
        const progress = Math.min(elapsed / entryDuration, 1);
        entryProgressRef.current = progress;
        
        const charsToShow = Math.floor(progress * totalChars);
        setLetters(prev => prev.map((l, i) => ({
          ...l,
          visible: i < charsToShow,
        })));
        
        if (progress >= 1) {
          phaseRef.current = 'displaying';
          exitStartTimeRef.current = elapsed + displayDuration;
        }
      } else if (phaseRef.current === 'displaying') {
        if (elapsed >= exitStartTimeRef.current) {
          phaseRef.current = 'exiting';
          setLetters(prev => prev.map(l => ({
            ...l,
            exiting: true,
            exitProgress: 0,
          })));
        }
      } else if (phaseRef.current === 'exiting') {
        const exitElapsed = elapsed - exitStartTimeRef.current;
        const exitProgress = Math.min(exitElapsed / exitDuration, 1);
        
        setLetters(prev => prev.map((l, i) => ({
          ...l,
          exitProgress: Math.min((exitElapsed - i * 30) / 800, 1),
        })));
        
        if (exitProgress >= 1) {
          phaseRef.current = 'done';
          setIsActive(false);
          lastThoughtIdRef.current = null;
          return;
        }
      }
      
      setLetters(currentLetters => {
        currentLetters.forEach((letter, i) => drawLetter(ctx, letter, i));
        return currentLetters;
      });
      
      animFrameRef.current = requestAnimationFrame(animate);
    };
    
    animFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [thought?.id, thought?.text, measureText, initLetterStates, drawFrame, drawLetter]);
  
  useEffect(() => {
    if (!isActive || !containerRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !thought) return;
    
    const { bubbleWidth, bubbleHeight } = measureText(ctx, thought.text);
    const pos = calculatePosition(mascotPosition, mascotSize, isMobile, bubbleWidth, bubbleHeight);
    
    containerRef.current.style.top = `${pos.top}px`;
    containerRef.current.style.left = `${pos.left}px`;
  }, [isActive, mascotPosition, mascotSize, isMobile, thought, measureText]);
  
  if (!isActive || !thought) return null;
  
  return (
    <div
      ref={containerRef}
      className="pointer-events-none"
      style={{
        position: 'fixed',
        zIndex: 9990,
        transition: 'top 0.1s ease-out, left 0.1s ease-out',
      }}
      data-testid="festive-dialogue-bubble"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
        }}
      />
    </div>
  );
});

export default FestiveDialogueBubble;
