import { useState, useEffect } from "react";
import { WorkforceOSLogo } from "@/components/workforceos-logo";
import { Shield, Wifi, Users, CheckCircle2, Lock } from "lucide-react";

interface MobileLoadingTransitionProps {
  onComplete: () => void;
  loadingDuration?: number; // milliseconds
  showTermsAfter?: boolean; // Show terms acceptance after loading
}

export function MobileLoadingTransition({ 
  onComplete, 
  loadingDuration = 8000,
  showTermsAfter = false 
}: MobileLoadingTransitionProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [statusColor, setStatusColor] = useState('text-red-400'); // Start red, turn green
  const [dots, setDots] = useState('');

  // AI thinking dots animation
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 400);

    return () => clearInterval(dotsInterval);
  }, []);

  // Progress bar and stage management
  useEffect(() => {
    const increment = 100 / (loadingDuration / 100); // Update every 100ms
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        
        // Stage transitions based on progress
        if (newProgress >= 15 && stage < 1) setStage(1);
        if (newProgress >= 35 && stage < 2) setStage(2);
        if (newProgress >= 55 && stage < 3) setStage(3);
        if (newProgress >= 75 && stage < 4) {
          setStage(4);
          setStatusColor('text-emerald-400'); // Turn green when staff found
        }
        if (newProgress >= 95 && stage < 5) setStage(5);
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          // Trigger completion after brief delay
          setTimeout(() => {
            onComplete();
          }, 500);
          return 100;
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [loadingDuration, onComplete, stage]);

  // Get current stage message
  const getStageMessage = () => {
    switch (stage) {
      case 0:
        return { text: `Initializing HelpDesk - DC360.5${dots}`, icon: Shield, color: 'text-blue-400' };
      case 1:
        return { text: `Connecting to server${dots}`, icon: Wifi, color: 'text-cyan-400' };
      case 2:
        return { text: `Checking to see if there is support staff${dots}`, icon: Users, color: 'text-indigo-400' };
      case 3:
        return { text: `Staff found entering chat${dots}`, icon: CheckCircle2, color: 'text-emerald-400' };
      case 4:
        return { text: `Entered chat view terms and accept${dots}`, icon: Lock, color: 'text-green-400' };
      case 5:
        return { text: 'chatroom service server is go', icon: CheckCircle2, color: 'text-emerald-500' };
      default:
        return { text: `Initializing${dots}`, icon: Shield, color: 'text-blue-400' };
    }
  };

  const currentStage = getStageMessage();
  const StageIcon = currentStage.icon;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-3 sm:p-6 overflow-hidden z-[9999]">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* WorkForceOS™ Logo */}
      <div className="mb-4 sm:mb-6 transition-all duration-1000 w-full max-w-[200px] sm:max-w-xs relative">
        <div className="relative px-2 sm:px-4 flex items-center justify-center">
          <WorkforceOSLogo className="relative z-10" size="sm" showText={true} />
          {/* Pulsing glow */}
          <div className="absolute inset-0 animate-ping opacity-20">
            <div className="w-full h-full rounded-full bg-blue-500 blur-xl" />
          </div>
        </div>
      </div>

      {/* Loading Card */}
      <div className="max-w-[340px] sm:max-w-sm w-full bg-slate-900/60 backdrop-blur-xl border border-blue-500/30 rounded-lg p-3 sm:p-6 space-y-3 sm:space-y-4 relative z-10">
        
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent animate-pulse leading-tight">
            Mobile Device<br className="sm:hidden" /> Detected
          </h2>
        </div>

        {/* GateKeeper & Status Box */}
        <div className="bg-slate-950/50 rounded-lg p-2 sm:p-3 border border-blue-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] text-slate-500">System Authenticator</span>
              <span className="text-[10px] sm:text-xs font-bold text-blue-400">GateKeeper</span>
              <span className="text-[8px] sm:text-[9px] text-slate-600">MOMJJ-ODtm</span>
            </div>
            <div className="text-right">
              <div className={`text-xs sm:text-sm font-bold transition-all duration-500 ${statusColor} animate-pulse`}>
                {stage < 4 ? 'Loading Help Desk...' : 'Help Desk Ready'}
              </div>
            </div>
          </div>
          
          {/* Animated divider line */}
          <div className="flex items-center justify-center py-1">
            <div className="relative w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent">
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 transition-all duration-300"
                style={{ left: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] text-slate-500">Mobile Interface</span>
            <span className={`text-[10px] sm:text-xs font-semibold transition-colors duration-500 ${stage >= 4 ? 'text-emerald-400' : 'text-blue-400'}`}>
              DC360.5
            </span>
          </div>
        </div>

        {/* Enhanced Loading Bar */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className="text-slate-400">Status</span>
            <span className="text-blue-400 font-mono font-bold">{Math.round(progress)}%</span>
          </div>
          
          {/* Alive Loading Bar */}
          <div className="relative w-full h-2 sm:h-2.5 bg-slate-950 rounded-full overflow-hidden border border-blue-500/20">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Multiple shimmer layers for "alive" effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow" />
              
              {/* Pulsing glow effect */}
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-400/30 via-cyan-400/30 to-blue-400/30" />
              
              {/* Leading edge glow */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/40 to-transparent" />
            </div>
            
            {/* Scanning line effect */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white/60 transition-all duration-300"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stage Status with Icon */}
        <div className="bg-slate-950/30 rounded-lg p-2 sm:p-3 border border-blue-500/10">
          <div className="flex items-center gap-2">
            <StageIcon className={`w-4 h-4 ${currentStage.color} animate-pulse`} />
            <p className={`text-[10px] sm:text-xs ${currentStage.color} leading-snug flex-1 font-medium`}>
              {currentStage.text}
            </p>
          </div>
        </div>

        {/* Animated Activity Indicator */}
        <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 py-1">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes shimmer-slow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(150%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        .animate-shimmer-slow {
          animation: shimmer-slow 2.5s infinite;
        }
      `}</style>
    </div>
  );
}
