import React from 'react';
import { Match } from '../types';
import { LEAGUES } from '../constants';
import { MapPin, Clock } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
  showLeagueLogo?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onClick, showLeagueLogo = false }) => {
  const isLive = match.status === 'LIVE' || match.status === 'HT';
  const isScheduled = match.status === 'SCHEDULED';
  const isFinished = match.status === 'FINISHED';

  // Format time for scheduled matches
  const timeString = match.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div
      onClick={onClick}
      className="glass-card rounded-3xl p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 group flex flex-col justify-between min-h-[140px] border border-white/40 dark:border-white/5 hover:border-white/60 dark:hover:border-white/20 cursor-pointer"
    >

      {/* Top Meta: League & Status Indicator */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          {showLeagueLogo && (() => {
             const league = LEAGUES.find(l => l.id === match.leagueId);
             if (league) {
                return (
                  <>
                    {typeof league.logo === 'string' && (
                      <img src={league.logo} alt={league.name} className="h-5 w-5 object-contain" />
                    )}
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {league.name}
                    </span>
                  </>
                );
             }
             return null; 
          })()}
        </div>

        {/* Status Badge */}
        {isLive && (
          <div className="flex items-center space-x-1.5 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold text-red-500 tracking-wide">
              {match.status === 'HT' ? 'HT' : `${match.minute}'`}
            </span>
          </div>
        )}
        {/* Removed time from top-right for scheduled matches as requested */}
      </div>

      {/* Teams & Score Section */}
      <div className="flex items-center justify-between flex-1 relative z-10 w-full">
        {/* Home */}
        <div className="flex flex-col items-center flex-1 min-w-0 space-y-2 px-1">
          <div className="h-10 w-10 md:h-12 md:w-12 relative transition-transform duration-300 transform group-hover:scale-110 filter drop-shadow-sm">
            <img
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=?';
              }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center leading-tight truncate w-full" title={match.homeTeam.name}>
            {match.homeTeam.name}
          </span>
        </div>

        {/* Center Score / VS */}
        <div className="flex flex-col items-center justify-center w-16 md:w-20 shrink-0">
          {isScheduled ? (
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{timeString}</span>
              <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 dark:text-gray-500">
                VS
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {isFinished && (
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-0.5">
                  {match.minute ? `${match.minute}'` : 'FT'}
                </span>
              )}
              <div className="flex items-center space-x-1">
                <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-mono tracking-tighter group-hover:text-black dark:group-hover:text-white transition-colors">
                  {match.homeScore}
                </span>
                <span className="text-gray-300 dark:text-gray-600 font-light text-lg">-</span>
                <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-mono tracking-tighter group-hover:text-black dark:group-hover:text-white transition-colors">
                  {match.awayScore}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center flex-1 min-w-0 space-y-2 px-1">
          <div className="h-10 w-10 md:h-12 md:w-12 relative transition-transform duration-300 transform group-hover:scale-110 filter drop-shadow-sm">
            <img
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=?';
              }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center leading-tight truncate w-full" title={match.awayTeam.name}>
            {match.awayTeam.name}
          </span>
        </div>
      </div>

      {/* Footer: Stadium Info */}
      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <MapPin size={10} className="mr-1.5 opacity-70" />
        <span className="text-[10px] font-medium tracking-wide truncate max-w-[90%] text-center">
          {match.stadium || 'Unknown Venue'}
        </span>
      </div>
    </div>
  );
};

export default MatchCard;
