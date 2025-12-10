import React from 'react';
import { Match } from '../types';
import { MapPin, Clock } from 'lucide-react';

interface MatchCardProps {
  match: Match;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const isLive = match.status === 'LIVE' || match.status === 'HT';
  const isScheduled = match.status === 'SCHEDULED';
  const isFinished = match.status === 'FINISHED';

  // Format time for scheduled matches
  const timeString = match.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 group flex flex-col justify-between min-h-[160px] border border-white/40 dark:border-white/5 hover:border-white/60 dark:hover:border-white/20">
      
      {/* Top Meta: League & Status Indicator */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
           <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 uppercase tracking-widest border border-gray-200 dark:border-white/5 transition-colors group-hover:border-gray-300 dark:group-hover:border-white/20">
              {match.leagueId === 'uefa.champions' ? 'UCL' : match.leagueId}
           </span>
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
        {isFinished && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full border border-gray-100 dark:border-white/5">
                Full Time
            </span>
        )}
        {isScheduled && (
             <div className="flex items-center text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-500/20">
                <Clock size={10} className="mr-1" />
                <span className="text-[10px] font-bold">{timeString}</span>
             </div>
        )}
      </div>

      {/* Teams & Score Section */}
      <div className="flex items-center justify-between flex-1 relative z-10">
        {/* Home */}
        <div className="flex flex-col items-center w-[35%] space-y-3">
            <div className="h-12 w-12 md:h-14 md:w-14 relative transition-transform duration-300 transform group-hover:scale-110 filter drop-shadow-sm">
                <img 
                  src={match.homeTeam.logo} 
                  alt={match.homeTeam.name} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=?';
                  }}
                />
            </div>
            <span className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 text-center leading-tight line-clamp-2 w-full px-1">
                {match.homeTeam.name}
            </span>
        </div>

        {/* Center Score / VS */}
        <div className="flex flex-col items-center justify-center w-[30%]">
            {isScheduled ? (
                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1">
                    VS
                </div>
            ) : (
                <div className="flex items-center space-x-2">
                    <span className="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white font-mono tracking-tighter group-hover:text-black dark:group-hover:text-white transition-colors">
                        {match.homeScore}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600 font-light text-xl">-</span>
                    <span className="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white font-mono tracking-tighter group-hover:text-black dark:group-hover:text-white transition-colors">
                        {match.awayScore}
                    </span>
                </div>
            )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center w-[35%] space-y-3">
            <div className="h-12 w-12 md:h-14 md:w-14 relative transition-transform duration-300 transform group-hover:scale-110 filter drop-shadow-sm">
                 <img 
                  src={match.awayTeam.logo} 
                  alt={match.awayTeam.name} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=?';
                  }}
                />
            </div>
            <span className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 text-center leading-tight line-clamp-2 w-full px-1">
                {match.awayTeam.name}
            </span>
        </div>
      </div>

      {/* Footer: Stadium Info */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500">
         <MapPin size={10} className="mr-1.5 opacity-70" />
         <span className="text-[10px] font-medium tracking-wide truncate max-w-[90%] text-center">
            {match.stadium || 'Unknown Venue'}
         </span>
      </div>
    </div>
  );
};

export default MatchCard;
