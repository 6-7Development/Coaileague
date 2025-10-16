/**
 * Interactive Chat Announcement Banner
 * Full-width rotating banner with links, emoticons, and live updates
 * Editable by support staff only
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  AlertCircle, Clock, Users, Zap, TrendingUp, 
  Award, Bell, MessageCircle, Star, Heart 
} from "lucide-react";

interface BannerMessage {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'success' | 'promo' | 'queue';
  link?: string;
  icon?: string;
  emoticon?: string;
}

interface ChatAnnouncementBannerProps {
  queuePosition?: number;
  queueWaitTime?: string;
  onlineStaff?: number;
  customMessages?: BannerMessage[];
}

export function ChatAnnouncementBanner({ 
  queuePosition, 
  queueWaitTime = "2-3 minutes",
  onlineStaff = 0,
  customMessages = []
}: ChatAnnouncementBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seasonalEffect, setSeasonalEffect] = useState<'snow' | 'fireworks' | 'hearts' | 'halloween' | 'none'>('none');

  // Determine seasonal effect based on current date
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();

    // January 1-7: Fireworks (New Year)
    if (month === 1 && day <= 7) {
      setSeasonalEffect('fireworks');
    }
    // February: Hearts (Valentine's)
    else if (month === 2) {
      setSeasonalEffect('hearts');
    }
    // October: Halloween
    else if (month === 10) {
      setSeasonalEffect('halloween');
    }
    // December: Snow (Winter/Christmas)
    else if (month === 12) {
      setSeasonalEffect('snow');
    }
    // July 1-7: Fireworks (Independence Day)
    else if (month === 7 && day <= 7) {
      setSeasonalEffect('fireworks');
    }
    else {
      setSeasonalEffect('none');
    }
  }, []);

  // Emoticon mapping
  const emoticons: Record<string, string> = {
    wave: "👋",
    star: "⭐",
    fire: "🔥",
    rocket: "🚀",
    party: "🎉",
    heart: "❤️",
    check: "✅",
    clock: "⏰",
    bell: "🔔",
    trophy: "🏆"
  };

  // Icon mapping
  const iconMap: Record<string, any> = {
    alert: AlertCircle,
    clock: Clock,
    users: Users,
    zap: Zap,
    trending: TrendingUp,
    award: Award,
    bell: Bell,
    message: MessageCircle,
    star: Star,
    heart: Heart
  };

  // Default rotating messages
  const defaultMessages: BannerMessage[] = [
    {
      id: '1',
      text: `Queue Position: You are #${queuePosition || 1} in line - Estimated wait: ${queueWaitTime}`,
      type: 'queue',
      icon: 'clock',
      emoticon: 'clock'
    },
    {
      id: '2',
      text: `${onlineStaff} Support Agents Online - We're here to help!`,
      type: 'info',
      icon: 'users',
      emoticon: 'wave'
    },
    {
      id: '3',
      text: 'Type /staff to see online support agents',
      type: 'info',
      icon: 'message',
      emoticon: 'star'
    },
    {
      id: '4',
      text: 'New Feature: AI-Powered Quick Responses!',
      type: 'promo',
      link: '/features',
      icon: 'zap',
      emoticon: 'rocket'
    },
    {
      id: '5',
      text: '✨ WorkforceOS Elite - Upgrade for Priority Support',
      type: 'promo',
      link: '/pricing',
      icon: 'award',
      emoticon: 'trophy'
    }
  ];

  const messages = customMessages.length > 0 ? customMessages : defaultMessages;

  // Auto-rotate messages every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages[currentIndex];
  const IconComponent = currentMessage.icon ? iconMap[currentMessage.icon] : null;
  const emoticon = currentMessage.emoticon ? emoticons[currentMessage.emoticon] : null;

  // Color schemes based on message type
  const colorSchemes = {
    info: 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-blue-400/30 text-blue-100',
    warning: 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-400/30 text-amber-100',
    success: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-400/30 text-emerald-100',
    promo: 'bg-gradient-to-r from-purple-500/20 to-pink-600/10 border-purple-400/30 text-purple-100',
    queue: 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 border-cyan-400/30 text-cyan-100'
  };

  const BannerContent = (
    <div className={`
      w-full border-b backdrop-blur-sm transition-all duration-500 ease-in-out relative overflow-hidden
      ${colorSchemes[currentMessage.type]}
      animate-in fade-in slide-in-from-top-2
    `}>
      {/* Seasonal Effects Overlay */}
      {seasonalEffect === 'snow' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute text-white/60 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}px`,
                animation: `fall ${3 + Math.random() * 2}s linear infinite`,
                animationDelay: `${Math.random() * 3}s`,
                fontSize: `${8 + Math.random() * 6}px`
              }}
            >
              ❄️
            </div>
          ))}
        </div>
      )}
      {seasonalEffect === 'fireworks' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${1 + Math.random()}s`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}
      {seasonalEffect === 'hearts' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute text-pink-300/50"
              style={{
                left: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${10 + Math.random() * 8}px`
              }}
            >
              💕
            </div>
          ))}
        </div>
      )}
      {seasonalEffect === 'halloween' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-orange-400/40 animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${2 + Math.random()}s`,
                animationDelay: `${Math.random() * 1.5}s`,
                fontSize: `${12 + Math.random() * 6}px`
              }}
            >
              🎃
            </div>
          ))}
        </div>
      )}
      <div className="max-w-full px-4 py-2.5 flex items-center justify-center gap-2.5 relative z-10">
        {/* Icon */}
        {IconComponent && (
          <IconComponent className="w-4 h-4 flex-shrink-0 animate-pulse" />
        )}
        
        {/* Emoticon */}
        {emoticon && (
          <span className="text-lg leading-none animate-bounce" style={{ animationDuration: '2s' }}>
            {emoticon}
          </span>
        )}
        
        {/* Message Text */}
        <span className="text-sm font-medium text-center">
          {currentMessage.text}
        </span>

        {/* Progress Dots */}
        <div className="hidden sm:flex items-center gap-1 ml-auto">
          {messages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`
                w-1.5 h-1.5 rounded-full transition-all duration-300
                ${index === currentIndex ? 'bg-current w-4' : 'bg-current/40'}
              `}
              data-testid={`banner-dot-${index}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Wrap with link if provided
  if (currentMessage.link) {
    return (
      <Link href={currentMessage.link} className="block hover:opacity-90 transition-opacity">
        {BannerContent}
      </Link>
    );
  }

  return BannerContent;
}
