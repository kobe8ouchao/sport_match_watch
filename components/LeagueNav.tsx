import React from 'react';
import { League } from '../types';

interface LeagueNavProps {
  leagues: League[];
  selectedLeagueId: string;
  onSelectLeague: (id: string) => void;
}

const LeagueNav: React.FC<LeagueNavProps> = ({ leagues, selectedLeagueId, onSelectLeague }) => {
  return (
    <div className="w-full py-2 overflow-x-auto no-scrollbar">
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
                <div className={`flex items-center justify-center h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}>
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
  );
};

export default LeagueNav;