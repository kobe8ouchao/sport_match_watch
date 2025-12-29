import React, { useRef, useState, useEffect } from 'react';
import { League } from '../types';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface LeagueNavProps {
  leagues: League[];
  selectedLeagueId: string;
  onSelectLeague: (id: string) => void;
}

const LeagueNav: React.FC<LeagueNavProps> = ({ leagues, selectedLeagueId, onSelectLeague }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Show arrow if there is content to scroll to (with a small buffer)
      setShowRightArrow(scrollWidth > clientWidth && scrollLeft + clientWidth < scrollWidth - 10);
      setShowLeftArrow(scrollLeft > 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [leagues]);

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full group">
       {/* Left Fade & Button */}
       <div 
        className={`absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#F0EEE9] via-[#F0EEE9]/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90 pointer-events-none flex items-center justify-start pl-2 transition-opacity duration-300 z-20 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}
      >
        <button
          onClick={scrollLeft}
          className="pointer-events-auto p-2 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div 
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="w-full overflow-x-auto py-2 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex flex-nowrap items-center md:justify-center min-w-max px-4 gap-3">
          {leagues.map((league, index) => {
            const isActive = selectedLeagueId === league.id;
            
            return (
              <button
                key={`${league.id}-${index}`}
                onClick={() => onSelectLeague(league.id)}
                className={`
                  relative group flex items-center space-x-2.5 px-5 py-2.5 rounded-full transition-all duration-300 overflow-hidden
                  backdrop-blur-md border select-none
                  ${isActive 
                    ? 'border-white/40 dark:border-white/20 text-gray-900 dark:text-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/10'
                  }
                `}
              >
                {/* Liquid Glass Background (Active) */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/30 to-white/5 dark:from-white/20 dark:via-white/5 dark:to-transparent opacity-100" />
                )}
                
                {/* 45-degree Specular Highlight */}
                <div className={`absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none transform -skew-x-12
                    ${isActive ? 'opacity-50' : 'opacity-0 group-hover:opacity-20'}
                `} />

                {/* Content Layer */}
                <div className="relative z-10 flex items-center space-x-2.5">
                  <div className={`flex items-center justify-center h-5 w-5 transition-transform duration-300 dark:brightness-0 dark:invert ${isActive ? 'scale-110' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                    {typeof league.logo === 'string' ? (
                      <img src={league.logo} alt={league.name} className="h-full w-full object-contain" />
                    ) : (
                      league.logo
                    )}
                  </div>
                  <span className="text-sm font-medium tracking-wide">
                    {league.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Fade & Button */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#F0EEE9] via-[#F0EEE9]/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90 pointer-events-none flex items-center justify-end pr-2 transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`}
      >
        <button
          onClick={scrollRight}
          className="pointer-events-auto p-2 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default LeagueNav;
