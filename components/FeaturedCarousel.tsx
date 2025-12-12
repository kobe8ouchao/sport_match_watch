import React, { useState, useEffect, useRef } from 'react';
import { MatchWithHot, LEAGUES } from '../constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedCarouselProps {
  matches: MatchWithHot[];
  onMatchClick?: (match: MatchWithHot) => void;
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ matches, onMatchClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === matches.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000); 

    return () => resetTimeout();
  }, [currentIndex, matches.length]);

  // Sync state if out of bounds
  useEffect(() => {
    if (currentIndex >= matches.length) {
        setCurrentIndex(0);
    }
  }, [matches.length, currentIndex]);

  const nextSlide = () => {
    setCurrentIndex(prev => prev === matches.length - 1 ? 0 : prev + 1);
  };

  const prevSlide = () => {
    setCurrentIndex(prev => prev === 0 ? matches.length - 1 : prev - 1);
  };

  // Ensure safe access to matches
  const safeIndex = currentIndex >= matches.length ? 0 : currentIndex;
  const currentMatch = matches[safeIndex];

  if (!currentMatch) return null;

  const isLive = currentMatch.status === 'LIVE';
  const hasImage = !!currentMatch.bannerImage;
  const status = currentMatch.status;

  const statusBadge = () => {
    if (status === 'LIVE') return { label: `LIVE • ${currentMatch.minute || ''}`.trim(), className: 'bg-red-500 text-white' };
    if (status === 'FINISHED') return { label: 'FINISHED', className: 'bg-gray-900/80 text-white border border-white/10' };
    return { label: 'UPCOMING', className: 'bg-white/80 text-gray-900' };
  };

  return (
    <div className="relative w-full h-48 md:h-56 group rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-3xl">
      
      {/* Background Layer */}
      <div className="absolute inset-0 transition-colors duration-500 bg-gray-200 dark:bg-gray-900">
        
        {/* Conditional Rendering: Image vs Themed Gradient */}
        {hasImage ? (
           <>
             {/* The Image */}
             <div 
               className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] ease-linear transform scale-100 group-hover:scale-105"
               style={{ backgroundImage: `url(${currentMatch.bannerImage})` }}
             />
             {/* Dark Gradient Overlay for text readability (Always dark overlay for image) */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
           </>
        ) : (
           /* Fallback Themed Gradient (if no image) */
           <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-white to-gray-300 dark:from-zinc-900 dark:via-zinc-800 dark:to-black">
              {/* Decorative shapes for fallback */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 mix-blend-multiply dark:mix-blend-normal"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/20 dark:bg-orange-500/10 rounded-full blur-3xl -ml-16 -mb-16 mix-blend-multiply dark:mix-blend-normal"></div>
           </div>
        )}
      </div>

      {/* Content Container */}
      <div 
        className="relative h-full flex flex-col justify-center px-6 md:px-12 z-10 cursor-pointer"
        onClick={() => onMatchClick && onMatchClick(currentMatch)}
      >
        
      {/* Status Badge */}
      <div className="absolute top-6 left-6 flex items-center space-x-2 z-20">
        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg ${statusBadge().className}`}>
          {statusBadge().label}
        </span>
      </div>

        {/* Match Info */}
        <div className={`flex items-center justify-between w-full max-w-5xl mx-auto transition-colors duration-300 ${hasImage ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            
            {/* Home Team */}
            <div className="flex flex-col items-center gap-2 text-center flex-1 justify-end min-w-0">
                <span className="relative flex items-center justify-center filter drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                  {typeof currentMatch.homeTeam.logo === 'string' ? (
                    <img src={currentMatch.homeTeam.logo} alt={currentMatch.homeTeam.name} className="h-12 w-12 md:h-16 md:w-16 object-contain" />
                  ) : currentMatch.homeTeam.logo}
                </span>
                <span className="text-sm md:text-base font-bold tracking-tight drop-shadow-sm truncate w-full px-2">
                    {currentMatch.homeTeam.name}
                </span>
            </div>

            {/* Score / VS */}
            <div className="px-2 md:px-8 flex flex-col items-center justify-center shrink-0">
                <div className="text-3xl md:text-5xl font-black tracking-tighter drop-shadow-xl whitespace-nowrap">
                    {currentMatch.status === 'SCHEDULED' 
                        ? <span className="text-4xl md:text-5xl text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] font-black tracking-widest"></span>
                        : `${currentMatch.homeScore} : ${currentMatch.awayScore}`
                    }
                </div>
                
                {/* Match Details for Scheduled Games */}
                {currentMatch.status === 'SCHEDULED' && (
                    <div className={`mt-2 flex flex-col items-center space-y-0.5 text-center ${hasImage ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}`}>
                         <div className="text-sm md:text-base font-bold tracking-wide">
                            {currentMatch.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                         </div>
                         <div className="text-xs font-medium opacity-80 max-w-[150px] truncate hidden md:block">
                            {currentMatch.stadium}
                         </div>
                         <div className="text-[10px] uppercase tracking-widest opacity-70">
                             {currentMatch.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                         </div>
                    </div>
                )}

                <div className={`mt-2 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full backdrop-blur-md shadow-inner hidden sm:block
                    ${hasImage ? 'bg-black/30 text-white/90 border border-white/10' : 'bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/10'}`}>
                    {LEAGUES.find(l => l.id === currentMatch.leagueId)?.name || currentMatch.leagueId}
                </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-2 text-center flex-1 justify-start min-w-0">
                <span className="relative flex items-center justify-center filter drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                  {typeof currentMatch.awayTeam.logo === 'string' ? (
                    <img src={currentMatch.awayTeam.logo} alt={currentMatch.awayTeam.name} className="h-12 w-12 md:h-16 md:w-16 object-contain" />
                  ) : currentMatch.awayTeam.logo}
                </span>
                <span className="text-sm md:text-base font-bold tracking-tight drop-shadow-sm truncate w-full px-2">
                    {currentMatch.awayTeam.name}
                </span>
            </div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2.5 z-20">
        {matches.map((_, idx) => {
          const isActive = idx === safeIndex;
          const activeClass = hasImage ? 'bg-white w-8' : 'bg-gray-800 dark:bg-white w-8';
          const inactiveClass = hasImage ? 'bg-white/40 hover:bg-white/60' : 'bg-gray-400/50 dark:bg-white/30 hover:bg-gray-500 dark:hover:bg-white/50';

          return (
            <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${isActive ? activeClass : `${inactiveClass} w-1.5`}`}
                onClick={() => setCurrentIndex(idx)}
            />
          );
        })}
      </div>

      {/* Arrows (Desktop Only) */}
      {/* <button 
        onClick={prevSlide}
        className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full backdrop-blur-md transition-all hidden md:flex hover:scale-110 active:scale-95
            ${hasImage ? 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white' : 'bg-white/30 dark:bg-black/30 text-gray-600 dark:text-white/70 hover:bg-white/50 dark:hover:bg-black/50'}`}
      >
        <ChevronLeft size={10} />
      </button> */}
      {/* <button 
        onClick={nextSlide}
        className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full backdrop-blur-md transition-all hidden md:flex hover:scale-110 active:scale-95
            ${hasImage ? 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white' : 'bg-white/30 dark:bg-black/30 text-gray-600 dark:text-white/70 hover:bg-white/50 dark:hover:bg-black/50'}`}
      >
        <ChevronRight size={10} />
      </button> */}
    </div>
  );
};

export default FeaturedCarousel;