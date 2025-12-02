/**
 * useMascotMouseFollow - Mouse following behavior for the Trinity mascot
 * 
 * Features:
 * - Tracks mouse position in real-time
 * - Provides gentle attraction toward cursor when user is idle
 * - Respects drag state and autonomous roaming
 * - Configurable attraction strength and follow distance
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import MASCOT_CONFIG from '@/config/mascotConfig';

interface Position {
  x: number;
  y: number;
}

interface MouseFollowConfig {
  enabled: boolean;
  attractionStrength: number;
  followDistance: number;
  idleThreshold: number;
  maxMoveSpeed: number;
}

const DEFAULT_CONFIG: MouseFollowConfig = {
  enabled: true,
  attractionStrength: 0.02,
  followDistance: 200,
  idleThreshold: 3000,
  maxMoveSpeed: 3,
};

interface MouseFollowState {
  mousePosition: Position;
  isFollowing: boolean;
  targetInfluence: Position;
  lastActivityTime: number;
}

export function useMascotMouseFollow(
  currentPosition: Position,
  bubbleSize: number,
  isDragging: boolean,
  isRoaming: boolean,
  config: Partial<MouseFollowConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<MouseFollowState>({
    mousePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    isFollowing: false,
    targetInfluence: { x: 0, y: 0 },
    lastActivityTime: Date.now(),
  });
  
  const stateRef = useRef(state);
  stateRef.current = state;
  
  const currentPositionRef = useRef(currentPosition);
  currentPositionRef.current = currentPosition;
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setState(prev => ({
      ...prev,
      mousePosition: { x: e.clientX, y: e.clientY },
      lastActivityTime: Date.now(),
    }));
  }, []);
  
  const handleMouseActivity = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastActivityTime: Date.now(),
    }));
  }, []);
  
  useEffect(() => {
    if (!mergedConfig.enabled) return;
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleMouseActivity);
    window.addEventListener('keydown', handleMouseActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseActivity);
      window.removeEventListener('keydown', handleMouseActivity);
    };
  }, [mergedConfig.enabled, handleMouseMove, handleMouseActivity]);
  
  useEffect(() => {
    if (!mergedConfig.enabled || isDragging || isRoaming) {
      setState(prev => ({
        ...prev,
        isFollowing: false,
        targetInfluence: { x: 0, y: 0 },
      }));
      return;
    }
    
    const calculateInfluence = () => {
      const current = currentPositionRef.current;
      const { mousePosition, lastActivityTime } = stateRef.current;
      
      const mascotCenterX = window.innerWidth - current.x - bubbleSize / 2;
      const mascotCenterY = window.innerHeight - current.y - bubbleSize / 2;
      
      const dx = mousePosition.x - mascotCenterX;
      const dy = mousePosition.y - mascotCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const timeSinceActivity = Date.now() - lastActivityTime;
      const isIdle = timeSinceActivity > mergedConfig.idleThreshold;
      
      if (!isIdle || distance < 50 || distance > mergedConfig.followDistance * 2) {
        setState(prev => ({
          ...prev,
          isFollowing: false,
          targetInfluence: { x: 0, y: 0 },
        }));
        return;
      }
      
      const distanceFactor = Math.min(1, (distance - 50) / mergedConfig.followDistance);
      const attraction = mergedConfig.attractionStrength * distanceFactor;
      
      const influenceX = Math.min(mergedConfig.maxMoveSpeed, (dx / distance) * attraction * 10);
      const influenceY = Math.min(mergedConfig.maxMoveSpeed, (dy / distance) * attraction * 10);
      
      setState(prev => ({
        ...prev,
        isFollowing: Math.abs(influenceX) > 0.1 || Math.abs(influenceY) > 0.1,
        targetInfluence: { x: -influenceX, y: -influenceY },
      }));
    };
    
    const intervalId = setInterval(calculateInfluence, 100);
    
    return () => clearInterval(intervalId);
  }, [mergedConfig, bubbleSize, isDragging, isRoaming]);
  
  return {
    mousePosition: state.mousePosition,
    isFollowing: state.isFollowing,
    targetInfluence: state.targetInfluence,
    getMouseDistance: useCallback(() => {
      const current = currentPositionRef.current;
      const { mousePosition } = stateRef.current;
      
      const mascotCenterX = window.innerWidth - current.x - bubbleSize / 2;
      const mascotCenterY = window.innerHeight - current.y - bubbleSize / 2;
      
      const dx = mousePosition.x - mascotCenterX;
      const dy = mousePosition.y - mascotCenterY;
      
      return Math.sqrt(dx * dx + dy * dy);
    }, [bubbleSize]),
  };
}

export default useMascotMouseFollow;
