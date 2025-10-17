import { useEffect, useState } from 'react';

type Season = 'christmas' | 'halloween' | 'valentines' | 'newyear' | 'spring' | 'summer' | 'fall' | 'winter' | 'none';

interface SeasonalBackgroundProps {
  enabled: boolean;
}

function getCurrentSeason(): Season {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Christmas: Dec 1 - Jan 5
  if ((month === 12) || (month === 1 && day <= 5)) {
    return 'christmas';
  }
  
  // Valentine's: Feb 1 - Feb 20
  if (month === 2 && day <= 20) {
    return 'valentines';
  }
  
  // Halloween: Oct 15 - Nov 2
  if ((month === 10 && day >= 15) || (month === 11 && day <= 2)) {
    return 'halloween';
  }
  
  // New Year: Dec 26 - Jan 2
  if ((month === 12 && day >= 26) || (month === 1 && day <= 2)) {
    return 'newyear';
  }
  
  // Spring: Mar 20 - Jun 20
  if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day <= 20)) {
    return 'spring';
  }
  
  // Summer: Jun 21 - Sep 21
  if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day <= 21)) {
    return 'summer';
  }
  
  // Fall: Sep 22 - Dec 20
  if ((month === 9 && day >= 22) || month === 10 || month === 11 || (month === 12 && day <= 20)) {
    return 'fall';
  }
  
  return 'none';
}

export function SeasonalBackground({ enabled }: SeasonalBackgroundProps) {
  const [season, setSeason] = useState<Season>(getCurrentSeason());
  
  useEffect(() => {
    setSeason(getCurrentSeason());
    
    // Check daily for season changes
    const interval = setInterval(() => {
      setSeason(getCurrentSeason());
    }, 1000 * 60 * 60 * 24); // Check every 24 hours
    
    return () => clearInterval(interval);
  }, []);
  
  if (!enabled) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {season === 'christmas' && <ChristmasSnowflakes />}
      {season === 'halloween' && <HalloweenElements />}
      {season === 'valentines' && <ValentineHearts />}
      {season === 'newyear' && <NewYearConfetti />}
      {season === 'spring' && <SpringFlowers />}
      {season === 'fall' && <FallingLeaves />}
    </div>
  );
}

function ChristmasSnowflakes() {
  const snowflakes = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDuration: 10 + Math.random() * 20,
    opacity: 0.3 + Math.random() * 0.4,
    size: 8 + Math.random() * 12,
  }));
  
  return (
    <>
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="absolute animate-fall"
          style={{
            left: `${flake.left}%`,
            top: '-20px',
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${Math.random() * 10}s`,
            opacity: flake.opacity,
          }}
        >
          <div 
            className="text-white drop-shadow-lg"
            style={{ fontSize: `${flake.size}px` }}
          >
            ❄️
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); }
          100% { transform: translateY(100vh) rotate(360deg); }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}} />
    </>
  );
}

function HalloweenElements() {
  const elements = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    emoji: ['🎃', '👻', '🦇', '🕷️'][Math.floor(Math.random() * 4)],
    left: Math.random() * 100,
    animationDuration: 12 + Math.random() * 18,
    opacity: 0.2 + Math.random() * 0.3,
    size: 12 + Math.random() * 16,
  }));
  
  return (
    <>
      {elements.map(elem => (
        <div
          key={elem.id}
          className="absolute animate-float-down"
          style={{
            left: `${elem.left}%`,
            top: '-30px',
            animationDuration: `${elem.animationDuration}s`,
            animationDelay: `${Math.random() * 8}s`,
            opacity: elem.opacity,
          }}
        >
          <div style={{ fontSize: `${elem.size}px` }}>
            {elem.emoji}
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-down {
          0% { transform: translateY(-30px) translateX(0); }
          50% { transform: translateY(50vh) translateX(20px); }
          100% { transform: translateY(100vh) translateX(-10px); }
        }
        .animate-float-down {
          animation: float-down ease-in-out infinite;
        }
      `}} />
    </>
  );
}

function ValentineHearts() {
  const hearts = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDuration: 8 + Math.random() * 15,
    opacity: 0.15 + Math.random() * 0.25,
    size: 10 + Math.random() * 14,
  }));
  
  return (
    <>
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute animate-rise"
          style={{
            left: `${heart.left}%`,
            bottom: '-30px',
            animationDuration: `${heart.animationDuration}s`,
            animationDelay: `${Math.random() * 6}s`,
            opacity: heart.opacity,
          }}
        >
          <div 
            className="text-pink-400"
            style={{ fontSize: `${heart.size}px` }}
          >
            ❤️
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rise {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-100vh) scale(1.2); opacity: 0; }
        }
        .animate-rise {
          animation: rise ease-in-out infinite;
        }
      `}} />
    </>
  );
}

function NewYearConfetti() {
  const confetti = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    emoji: ['🎊', '🎉', '✨', '⭐'][Math.floor(Math.random() * 4)],
    left: Math.random() * 100,
    animationDuration: 6 + Math.random() * 10,
    opacity: 0.3 + Math.random() * 0.4,
    size: 12 + Math.random() * 18,
  }));
  
  return (
    <>
      {confetti.map(item => (
        <div
          key={item.id}
          className="absolute animate-confetti"
          style={{
            left: `${item.left}%`,
            top: '-40px',
            animationDuration: `${item.animationDuration}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: item.opacity,
          }}
        >
          <div style={{ fontSize: `${item.size}px` }}>
            {item.emoji}
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes confetti {
          0% { transform: translateY(-40px) rotate(0deg); }
          100% { transform: translateY(100vh) rotate(720deg); }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}} />
    </>
  );
}

function SpringFlowers() {
  const flowers = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    emoji: ['🌸', '🌼', '🌺', '🌻'][Math.floor(Math.random() * 4)],
    left: Math.random() * 100,
    animationDuration: 15 + Math.random() * 20,
    opacity: 0.2 + Math.random() * 0.3,
    size: 14 + Math.random() * 16,
  }));
  
  return (
    <>
      {flowers.map(flower => (
        <div
          key={flower.id}
          className="absolute animate-drift"
          style={{
            left: `${flower.left}%`,
            top: '-30px',
            animationDuration: `${flower.animationDuration}s`,
            animationDelay: `${Math.random() * 10}s`,
            opacity: flower.opacity,
          }}
        >
          <div style={{ fontSize: `${flower.size}px` }}>
            {flower.emoji}
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drift {
          0% { transform: translateY(-30px) translateX(0) rotate(0deg); }
          50% { transform: translateY(50vh) translateX(-30px) rotate(180deg); }
          100% { transform: translateY(100vh) translateX(10px) rotate(360deg); }
        }
        .animate-drift {
          animation: drift ease-in-out infinite;
        }
      `}} />
    </>
  );
}

function FallingLeaves() {
  const leaves = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    emoji: ['🍂', '🍁'][Math.floor(Math.random() * 2)],
    left: Math.random() * 100,
    animationDuration: 12 + Math.random() * 18,
    opacity: 0.2 + Math.random() * 0.3,
    size: 12 + Math.random() * 16,
  }));
  
  return (
    <>
      {leaves.map(leaf => (
        <div
          key={leaf.id}
          className="absolute animate-leaf-fall"
          style={{
            left: `${leaf.left}%`,
            top: '-30px',
            animationDuration: `${leaf.animationDuration}s`,
            animationDelay: `${Math.random() * 8}s`,
            opacity: leaf.opacity,
          }}
        >
          <div style={{ fontSize: `${leaf.size}px` }}>
            {leaf.emoji}
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes leaf-fall {
          0% { transform: translateY(-30px) rotate(0deg) translateX(0); }
          25% { transform: translateY(25vh) rotate(90deg) translateX(15px); }
          50% { transform: translateY(50vh) rotate(180deg) translateX(-15px); }
          75% { transform: translateY(75vh) rotate(270deg) translateX(10px); }
          100% { transform: translateY(100vh) rotate(360deg) translateX(0); }
        }
        .animate-leaf-fall {
          animation: leaf-fall ease-in-out infinite;
        }
      `}} />
    </>
  );
}
