import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, ArrowRight } from "lucide-react";
import HelpDeskCab from "./HelpDeskCab";
import HelpDesk5 from "./HelpDesk5";

// Device detection wrapper that loads correct chat interface
export default function LiveChatroom() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRedirectInfo, setShowRedirectInfo] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Detect mobile device
    const checkDevice = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      const isMobileDetected = isMobileDevice || isSmallScreen;
      
      setIsMobile(isMobileDetected);
      setIsLoading(false);
      
      // Show friendly redirect info for mobile users
      if (isMobileDetected) {
        setShowRedirectInfo(true);
      }
    };

    checkDevice();

    // Re-check on resize
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 768;
      const isMobileDetected = isSmallScreen || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDetected);
      if (isMobileDetected) {
        setShowRedirectInfo(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show friendly mobile redirect info
  if (isMobile && showRedirectInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <Card className="max-w-md w-full border-emerald-500/30 bg-slate-900/80 backdrop-blur">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
            <CardTitle className="text-2xl text-emerald-400">📱 Mobile Device Detected</CardTitle>
            <CardDescription className="text-slate-300">
              You're trying to access the desktop version (Help360) on a mobile device. 
              Let me redirect you to our mobile-optimized version!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-950/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Current:</span>
                <span className="text-emerald-400 font-medium">Help360 (Desktop)</span>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Redirecting to:</span>
                <span className="text-emerald-400 font-medium">Help360.5 (Mobile)</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation("/mobile-chat")}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                data-testid="button-go-mobile"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Take Me to Mobile Version
              </Button>
              
              <Button 
                onClick={() => setShowRedirectInfo(false)}
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                data-testid="button-stay-desktop"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Stay on Desktop (Not Recommended)
              </Button>
            </div>
            
            <p className="text-center text-xs text-slate-500">
              💡 Mobile version is optimized for touch and smaller screens
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return isMobile ? <HelpDesk5 /> : <HelpDeskCab />;
}
