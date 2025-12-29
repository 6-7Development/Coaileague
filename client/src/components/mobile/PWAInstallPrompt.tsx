/**
 * PWAInstallPrompt - Prompt for mobile users to install the app
 * 
 * Features:
 * - Detects if PWA can be installed
 * - Shows install prompt for Android/Chrome
 * - Shows iOS add-to-home-screen instructions
 * - Remembers dismissal for 7 days
 * - Non-intrusive bottom sheet design
 */

import { useState, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Download, X, Smartphone, Share, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISS_KEY = 'coaileague_pwa_prompt_dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallPrompt() {
  const { isPWA, isIOS, isAndroid, isMobile, canInstallPWA, promptPWAInstall } = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if already dismissed
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) {
        setDismissed(true);
        return;
      }
    }
    setDismissed(false);
    
    // Show prompt after 5 seconds for mobile non-PWA users
    const timer = setTimeout(() => {
      if (isMobile && !isPWA && (canInstallPWA || isIOS)) {
        setIsOpen(true);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isMobile, isPWA, canInstallPWA, isIOS]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
    setIsOpen(false);
  };

  const handleInstall = async () => {
    if (canInstallPWA) {
      await promptPWAInstall();
    }
    handleDismiss();
  };

  if (dismissed || isPWA || !isMobile) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-2xl bg-slate-900 border-slate-700 px-4 pt-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 24px)' }}
      >
        <SheetTitle className="sr-only">Install CoAIleague App</SheetTitle>
        
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
          data-testid="button-dismiss-pwa-prompt"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            Install CoAIleague
          </h2>
          <p className="text-slate-400 text-sm mb-6 max-w-[280px]">
            Add to your home screen for quick access to clock in, view your schedule, and report incidents.
          </p>
          
          {isIOS ? (
            <>
              <div className="w-full p-4 bg-slate-800/50 rounded-xl mb-4">
                <div className="flex items-start gap-3 text-left">
                  <div className="p-2 bg-slate-700 rounded-lg">
                    <Share className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Tap the Share button</p>
                    <p className="text-xs text-slate-400">At the bottom of your browser</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left mt-3">
                  <div className="p-2 bg-slate-700 rounded-lg">
                    <Plus className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Tap "Add to Home Screen"</p>
                    <p className="text-xs text-slate-400">Then tap "Add" to confirm</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleDismiss}
                className="w-full h-12 bg-cyan-600 hover:bg-cyan-700"
                data-testid="button-got-it"
              >
                Got it
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={handleInstall}
                className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 mb-3"
                data-testid="button-install-app"
              >
                <Download className="w-5 h-5 mr-2" />
                Install App
              </Button>
              <button
                onClick={handleDismiss}
                className="text-sm text-slate-400 hover:text-white"
                data-testid="button-not-now"
              >
                Not now
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default PWAInstallPrompt;
