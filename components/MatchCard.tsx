import React from 'react';
import { Match } from '../types';
import { LEAGUES, DEFAULT_TEAM_LOGO, DEFAULT_TENNIS_HEADSHOT } from '../constants';
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
  const isTennis = match.leagueId === 'tennis.atp' || match.leagueId === 'tennis.wta';
  const topLabel = isTennis
    ? [match.tournamentName, match.roundName].filter(Boolean).join(' · ')
    : null;

  // Format time for scheduled matches
  const timeString = match.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatTennisName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 1) return name;
    return `${parts[0].charAt(0)}. ${parts.slice(1).join(' ')}`;
  };
  const homeDisplayName = isTennis ? formatTennisName(match.homeTeam.name) : match.homeTeam.name;
  const awayDisplayName = isTennis ? formatTennisName(match.awayTeam.name) : match.awayTeam.name;
  const homeImage = isTennis ? (match.homeTeam.headshot || DEFAULT_TENNIS_HEADSHOT) : (match.homeTeam.logo || DEFAULT_TEAM_LOGO);
  const awayImage = isTennis ? (match.awayTeam.headshot || DEFAULT_TENNIS_HEADSHOT) : (match.awayTeam.logo || DEFAULT_TEAM_LOGO);
  const homeFlag = isTennis ? match.homeTeam.logo : '';
  const awayFlag = isTennis ? match.awayTeam.logo : '';
  const setScores = isTennis && match.setScores?.length ? match.setScores : [];
  const liveGameScoreText = isTennis && match.liveGameScore
    ? `${match.liveGameScore.home}:${match.liveGameScore.away}`
    : '';
  const tennisCurrentSet =
    typeof match.minute === 'number'
      ? match.minute
      : typeof match.minute === 'string'
        ? parseInt(match.minute, 10)
        : NaN;
  const tennisLiveLabel = isTennis
    ? Number.isFinite(tennisCurrentSet) && tennisCurrentSet > 0
      ? `LIVE · Set ${tennisCurrentSet}`
      : 'LIVE'
    : '';
  const homeServing = isTennis && match.servingSide === 'home';
  const awayServing = isTennis && match.servingSide === 'away';
  const finishedLabel = isTennis ? 'Final' : (match.minute ? `${match.minute}'` : 'FT');
  const parseTennisSetDisplay = (value: string | number) => {
    const stringValue = String(value ?? '').trim();
    const matched = stringValue.match(/^(.+?)\((.+)\)$/);

    if (!matched) {
      return { score: stringValue, tiebreak: '' };
    }

    return {
      score: matched[1].trim(),
      tiebreak: matched[2].trim(),
    };
  };
  const tennisSetColumns = setScores.length > 0 ? (
    <div className="mt-2 w-full rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 px-2 py-1.5">
      <div
        className="grid gap-2 text-center"
        style={{ gridTemplateColumns: `repeat(${setScores.length}, minmax(0, 1fr))` }}
      >
        {setScores.map((setScore, index) => {
          const homeSet = parseTennisSetDisplay(setScore.home);
          const awaySet = parseTennisSetDisplay(setScore.away);

          return (
            <div key={`${match.id}-set-${index}`} className="min-w-0 flex flex-col items-center gap-1">
              <div className="relative flex w-full justify-center text-[11px] md:text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none">
                <span>{homeSet.score}</span>
                {homeSet.tiebreak && (
                  <span className="absolute -top-1 -right-1.5 text-[8px] font-semibold leading-none text-gray-400 dark:text-gray-500">
                    {homeSet.tiebreak}
                  </span>
                )}
              </div>
              <div className="relative flex w-full justify-center text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 leading-none">
                <span>{awaySet.score}</span>
                {awaySet.tiebreak && (
                  <span className="absolute -top-1 -right-1.5 text-[8px] font-semibold leading-none text-gray-400 dark:text-gray-500">
                    {awaySet.tiebreak}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div
      onClick={onClick}
      title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
      aria-label={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
      className="glass-card rounded-3xl p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 group flex flex-col justify-between min-h-[140px] border border-white/40 dark:border-white/5 hover:border-white/60 dark:hover:border-white/20 cursor-pointer"
    >

      {/* Top Meta: League & Status Indicator */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          {isTennis ? (
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate max-w-[180px]" title={topLabel || undefined}>
              {topLabel}
            </span>
          ) : showLeagueLogo && (() => {
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
              {isTennis ? tennisLiveLabel : (match.status === 'HT' ? 'HT' : `${match.minute}'`)}
            </span>
          </div>
        )}
        {/* Removed time from top-right for scheduled matches as requested */}
      </div>

      {/* Teams & Score Section */}
      <div className="flex items-center justify-between flex-1 relative z-10 w-full">
        {/* Home */}
        <div className="flex flex-col items-center flex-1 min-w-0 space-y-2 px-1">
          <div className={`h-10 w-10 md:h-12 md:w-12 relative transition-transform duration-300 transform group-hover:scale-110 filter drop-shadow-sm ${isTennis ? 'rounded-full overflow-hidden border border-gray-200 dark:border-white/10 bg-white' : ''}`}>
            <img
              src={homeImage}
              alt={match.homeTeam.name}
              className={`w-full h-full ${isTennis ? 'object-cover' : 'object-contain'}`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = isTennis ? DEFAULT_TENNIS_HEADSHOT : DEFAULT_TEAM_LOGO;
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-1 min-w-0 w-full">
            {homeFlag && (
              <img
                src={homeFlag}
                alt={`${match.homeTeam.name} flag`}
                className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
              />
            )}
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center leading-tight truncate min-w-0" title={match.homeTeam.name}>
              {homeDisplayName}
            </span>
          </div>
          {homeServing && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Serving
            </span>
          )}
        </div>

        {/* Center Score / VS */}
        <div className={`flex flex-col items-center justify-center shrink-0 ${isTennis ? 'w-32 md:w-36' : 'w-16 md:w-20'}`}>
          {isScheduled ? (
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{timeString}</span>
              <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 dark:text-gray-500">
                VS
              </div>
              {tennisSetColumns}
              {liveGameScoreText && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20">
                  Game {liveGameScoreText}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {isFinished && (
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-0.5">
                  {finishedLabel}
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
              {tennisSetColumns}
              {isLive && liveGameScoreText && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20">
                  Game {liveGameScoreText}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center flex-1 min-w-0 space-y-2 px-1">
          <div className={`h-10 w-10 md:h-12 md:w-12 relative transition-transform duration-300 transform group-hover:scale-110 filter drop-shadow-sm ${isTennis ? 'rounded-full overflow-hidden border border-gray-200 dark:border-white/10 bg-white' : ''}`}>
            <img
              src={awayImage}
              alt={match.awayTeam.name}
              className={`w-full h-full ${isTennis ? 'object-cover' : 'object-contain'}`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = isTennis ? DEFAULT_TENNIS_HEADSHOT : DEFAULT_TEAM_LOGO;
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-1 min-w-0 w-full">
            {awayFlag && (
              <img
                src={awayFlag}
                alt={`${match.awayTeam.name} flag`}
                className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
              />
            )}
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center leading-tight truncate min-w-0" title={match.awayTeam.name}>
              {awayDisplayName}
            </span>
          </div>
          {awayServing && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Serving
            </span>
          )}
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
