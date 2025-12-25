import React, { useState } from 'react';
import { MatchDetailData, MatchEvent, MatchStat } from '../types';
import { LEAGUES, DEFAULT_TEAM_LOGO } from '../constants';
import { Clock, MapPin, ArrowUp, ArrowDown } from 'lucide-react';
import NewsSection from './NewsSection';

interface SoccerMatchDetailProps {
  match: MatchDetailData;
  onBack: () => void;
}

const SoccerMatchDetail: React.FC<SoccerMatchDetailProps> = ({ match, onBack }) => {
  const isLive = match.status === 'LIVE' || match.status === 'HT';
  const [activeTab, setActiveTab] = useState<'detail' | 'lineup' | 'statics' | 'news'>(() => {
    if (match.status === 'SCHEDULED') return 'news';
    if (match.status === 'LIVE' || match.status === 'HT') return 'detail';
    if (match.status === 'FINISHED') return 'statics';
    return 'detail';
  });
  const homeStarters = match.homePlayers.filter(p => p.isStarter);
  const awayStarters = match.awayPlayers.filter(p => p.isStarter);
  const posKey = (p: any) => {
    const abbr = String(p.position || '').toUpperCase();
    if (abbr) {
      if (abbr.startsWith('G')) return 'G';
      if (abbr.startsWith('D')) return 'D';
      if (abbr.startsWith('M')) return 'M';
      if (abbr.startsWith('F')) return 'F';
    }
    const name = String(p.positionName || '').toLowerCase();
    if (name.includes('goal')) return 'G';
    if (name.includes('defend') || name.includes('back')) return 'D';
    if (name.includes('mid')) return 'M';
    if (name.includes('forward') || name.includes('striker') || name.includes('wing')) return 'F';
    return 'M';
  };
  const groupBy = (arr: any[]) => ({
    G: arr.filter((p: any) => posKey(p) === 'G'),
    D: arr.filter((p: any) => posKey(p) === 'D'),
    M: arr.filter((p: any) => posKey(p) === 'M'),
    F: arr.filter((p: any) => posKey(p) === 'F'),
  });
  const homeByPos = groupBy(homeStarters);
  const awayByPos = groupBy(awayStarters);

  const getGoalEvents = (teamId: string) => {
    return match.events.filter(e =>
      e.teamId === teamId &&
      e.type.toLowerCase().includes('goal')
    );
  };

  const league = LEAGUES.find(l => l.id === match.leagueId);
  const leagueName = league ? league.name : match.leagueId.toUpperCase();
  const isNfl = match.leagueId === 'nfl';
  
  const hasGoals = match.events.some(e => e.type.toLowerCase().includes('goal'));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">

      {/* Match Banner */}
      <div className={`relative w-full h-auto ${hasGoals ? 'min-h-[22rem]' : 'min-h-[16rem]'} rounded-3xl overflow-hidden shadow-2xl mb-8 group`}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-black">
          {/* Optional: Add league specific background or team colors if available */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className={`relative z-10 h-full flex flex-col justify-center items-center text-white px-4 py-10 ${hasGoals ? 'pb-16' : ''}`}>

          {/* League Badge */}
          <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
            {leagueName}
          </div>

          {/* Score Board */}
          <div className="w-full max-w-4xl">
            {/* Mobile Layout */}
            <div className="flex flex-col items-center w-full md:hidden mb-6">
                <div className="flex items-center justify-between w-full px-2 mb-4">
                    {/* Home Team */}
                    <div className="flex flex-col items-center flex-1">
                        <img 
                            src={match.homeTeam.logo || DEFAULT_TEAM_LOGO} 
                            alt={match.homeTeam.name} 
                            className="h-16 w-16 object-contain drop-shadow-2xl mb-2" 
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                        />
                        <h3 className="text-lg font-bold text-center leading-tight">{match.homeTeam.name}</h3>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-4 px-2">
                        {match.status === 'SCHEDULED' ? (
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-black opacity-80">VS</span>
                                <div className="text-xs font-mono mt-1">
                                    {match.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </div>
                            </div>
                        ) : (
                            <>
                                <span className="text-4xl font-black font-mono">{match.homeScore}</span>
                                <span className="text-xl opacity-50 font-light">-</span>
                                <span className="text-4xl font-black font-mono">{match.awayScore}</span>
                            </>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center flex-1">
                        <img 
                            src={match.awayTeam.logo || DEFAULT_TEAM_LOGO} 
                            alt={match.awayTeam.name} 
                            className="h-16 w-16 object-contain drop-shadow-2xl mb-2" 
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                        />
                        <h3 className="text-lg font-bold text-center leading-tight">{match.awayTeam.name}</h3>
                    </div>
                </div>

                {/* Mobile Status */}
                {isLive ? (
                    <div className="flex items-center gap-2 bg-red-500/20 px-4 py-1.5 rounded-full border border-red-500/30 backdrop-blur-md">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                        <span className="text-sm font-bold text-white tracking-widest uppercase">
                            {match.status === 'LIVE' ? `LIVE • ${match.minute}'` : match.status}
                        </span>
                    </div>
                ) : (
                    <div className="px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase border bg-white/10 border-white/20">
                        {match.status}
                    </div>
                )}
            </div>

            {/* Desktop Layout */}
            <div className={`hidden md:flex items-center w-full ${hasGoals ? 'justify-between' : 'justify-center gap-16 md:gap-32'}`}>
            {/* Home Team */}
            <div className="flex flex-col items-center flex-1">
              <img 
                src={match.homeTeam.logo || DEFAULT_TEAM_LOGO} 
                alt={match.homeTeam.name} 
                className="h-20 w-20 md:h-28 md:w-28 object-contain drop-shadow-2xl mb-4" 
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
              />
              <h2 className="text-2xl md:text-4xl font-bold text-center tracking-tight">{match.homeTeam.name}</h2>
            </div>

            {/* Score / Time */}
            <div className="flex flex-col items-center px-8">
              {match.status === 'SCHEDULED' ? (
                <div className="flex flex-col items-center">
                  <span className="text-6xl font-black tracking-tighter opacity-80">VS</span>
                  <div className="mt-4 flex items-center space-x-2 text-white/80">
                    <Clock size={16} />
                    <span className="font-mono text-lg">
                      {match.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4 md:space-x-8">
                  <span className="text-5xl md:text-7xl font-black font-mono tracking-tighter">{match.homeScore}</span>
                  <span className="text-4xl opacity-50 font-light">:</span>
                  <span className="text-5xl md:text-7xl font-black font-mono tracking-tighter">{match.awayScore}</span>
                </div>
              )}

              {/* Status / Minute */}
              {isLive ? (
                <div className="mt-4 flex items-center gap-2 bg-red-500/20 px-4 py-1.5 rounded-full border border-red-500/30 backdrop-blur-md">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-sm font-bold text-white tracking-widest uppercase">
                    {match.status === 'LIVE' ? `LIVE • ${match.minute}'` : match.status}
                  </span>
                </div>
              ) : (
                <div className="mt-4 px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase border bg-white/10 border-white/20">
                  {match.status}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center flex-1">
              <img 
                src={match.awayTeam.logo || DEFAULT_TEAM_LOGO} 
                alt={match.awayTeam.name} 
                className="h-20 w-20 md:h-28 md:w-28 object-contain drop-shadow-2xl mb-4" 
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
              />
              <h2 className="text-2xl md:text-4xl font-bold text-center tracking-tight">{match.awayTeam.name}</h2>
            </div>
          </div>
          </div>

          {/* Goals List */}
          {hasGoals && (
            <div className="flex justify-between w-full max-w-4xl mt-6 px-4">
              {/* Home Goals */}
              <div className="flex flex-col items-center flex-1">
                <div className="space-y-1">
                  {getGoalEvents(match.homeTeam.id).map(e => (
                    <div key={e.id} className="text-sm text-white/90 flex items-center justify-center gap-1.5 font-medium">
                      <span>{e.player}</span>
                      <span className="text-xs opacity-75 font-mono">{e.minute}'</span>
                      <span className="text-xs">⚽</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacer */}
              <div className="w-16 md:w-32"></div>

              {/* Away Goals */}
              <div className="flex flex-col items-center flex-1">
                <div className="space-y-1">
                  {getGoalEvents(match.awayTeam.id).map(e => (
                    <div key={e.id} className="text-sm text-white/90 flex items-center justify-center gap-1.5 font-medium">
                      <span className="text-xs">⚽</span>
                      <span className="text-xs opacity-75 font-mono">{e.minute}'</span>
                      <span>{e.player}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stadium Info */}
          {match.stadium && (
            <div className="absolute bottom-6 flex items-center space-x-2 text-white/60 text-sm font-medium">
              <MapPin size={14} />
              <span>{match.stadium}</span>
            </div>
          )}
        </div>
      </div>
      <div className="mb-6">
        <div className="w-full overflow-x-auto py-2 pl-2 md:pl-0">
          <div className="flex space-x-3 min-w-max pr-4 items-center justify-center">
            {[
              { key: 'lineup', label: 'Line-Ups' },
              { key: 'statics', label: 'Stats' },
              { key: 'detail', label: 'Commentary' },
              { key: 'news', label: 'Reports' },
            ].map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`
                    relative group flex items-center space-x-2.5 px-5 py-2.5 rounded-full transition-all duration-300 overflow-hidden
                    backdrop-blur-md border select-none
                    ${isActive
                      ? 'border-white/40 dark:border-white/20 text-gray-900 dark:text-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/30 to-white/5 dark:from-white/20 dark:via-white/5 dark:to-transparent opacity-100" />
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none transform -skew-x-12 ${isActive ? 'opacity-50' : 'opacity-0 group-hover:opacity-20'}`} />
                  <span className="relative z-10 text-sm font-medium tracking-wide">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">

        {/* Left Column: Timeline */}
        <div className={activeTab === 'detail' ? 'lg:col-span-12 flex flex-col' : 'hidden'}>
          <div className="glass-card bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-6 md:p-8 flex-1 h-full min-h-[500px]">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
              <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
              Match Timeline
            </h3>

            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gray-200 dark:bg-white/10"></div>

              <div className="space-y-8">
                {match.events.length === 0 ? (
                  <div className="text-center text-gray-400 py-4">No events available yet.</div>
                ) : (
                  match.events
                    .filter((event) => {
                      const t = String(event.type).toLowerCase();
                      return !t.includes('kickoff') && !t.includes('start 2nd half') && !t.includes('start second half');
                    })
                    .map((event) => {
                      const isHome = event.teamId === match.homeTeam.id;
                      const t = String(event.type).toLowerCase();
                      const d = String(event.text || '').toLowerCase();
                      const isSub = t.includes('substitution');
                      const hasYellow = t.includes('yellow');
                      const hasRed = t.includes('red');
                      const hasGoal = t.includes('goal');
                      
                      const isOwnGoal = t.includes('own goal');
                      
                      // Penalty Goal: type includes 'goal' AND description/type indicates penalty
                      const isPenaltyGoal = ( (d.includes('penalty goal') || d.includes('penalty - scored') || t.includes('penalty'))) && !isOwnGoal;
                      
                      // Missed Penalty: type indicates missed penalty
                      const isMissedPenalty = t.includes('penalty - missed') || t.includes('penalty - saved') || 
                                              (t.includes('penalty') && (t.includes('missed') || t.includes('saved')));

                      const typeIcon = (hasYellow || hasRed || hasGoal || isMissedPenalty) ? (
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {hasYellow && <span className="inline-block w-3 h-4 bg-yellow-400 border border-yellow-600 rounded-[1px] shadow-sm" title="Yellow Card" />}
                          {hasRed && <span className="inline-block w-3 h-4 bg-red-500 border border-red-700 rounded-[1px] shadow-sm" title="Red Card" />}
                          {hasGoal && !isPenaltyGoal && !isOwnGoal && <span className="flex items-center" title="Goal">⚽</span>}
                          {isOwnGoal && <span className="flex items-center text-red-500" title="Own Goal">⚽<span className="text-[10px] ml-0.5">(OG)</span></span>}
                          {isPenaltyGoal && <span className="flex items-center" title="Penalty Goal">⚽<span className="text-[10px] ml-0.5">(P)</span></span>}
                          {isMissedPenalty && <span className="flex items-center text-red-500" title="Penalty Missed">❌<span className="text-[10px] ml-0.5">(P)</span></span>}
                        </div>
                      ) : null;
                      return (
                        <div key={event.id} className={`flex items-center justify-between w-full ${isHome ? 'flex-row-reverse' : ''}`}>
                          <div className="w-5/12"></div>
                          <div className="z-10 w-8 h-6 md:w-12 md:h-7 rounded-lg bg-white dark:bg-zinc-800 border-2 border-gray-200 dark:border-white/10 flex items-center justify-center text-[10px] md:text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                            {event.minute}'
                          </div>
                          <div className={`w-5/12 flex ${isHome ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                                  p-2 md:p-3 rounded-2xl border shadow-sm w-full max-w-[240px] transition-all hover:scale-105
                                                  ${isHome
                                ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-500/20'
                                : 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-500/20'
                              }
                                              `}>
                              <div className="flex items-center justify-between">
                                {isHome ? (
                                  <div className="flex-1 text-left min-w-0">
                                    <div className="font-bold text-gray-900 dark:text-white text-[10px] md:text-xs mb-0.5 truncate">{event.type}</div>
                                    <div className="text-gray-600 dark:text-gray-300 text-[9px] md:text-[10px] font-medium truncate">
                                      {event.participants && event.participants.length > 0 ? (
                                        <div className="space-y-0.5">
                                          {event.participants.map((p, i) => {
                                            const role = String(p.role || '').toLowerCase();
                                            const showArrow = isSub && (role.includes('in') || role.includes('out'));
                                            return (
                                              <div key={i} className="truncate flex items-center gap-1 md:gap-2 justify-between">
                                                <span className="truncate">{p.name}{(!isSub && p.role) ? ` · ${p.role}` : ''}</span>
                                                <span className="inline-flex items-center gap-1 shrink-0">
                                                  {showArrow && role.includes('in') && <ArrowUp size={12} strokeWidth={3} className="text-green-500" />}
                                                  {showArrow && role.includes('out') && <ArrowDown size={12} strokeWidth={3} className="text-yellow-500" />}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <span className="truncate block">{event.player}</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="shrink-0 mr-1.5 md:mr-2">{typeIcon}</div>
                                )}

                                {isHome ? (
                                  <div className="shrink-0 ml-1.5 md:ml-2">{typeIcon}</div>
                                ) : (
                                  <div className="flex-1 text-right min-w-0">
                                    <div className="font-bold text-gray-900 dark:text-white text-[10px] md:text-xs mb-0.5 truncate">{event.type}</div>
                                    <div className="text-gray-600 dark:text-gray-300 text-[9px] md:text-[10px] font-medium truncate">
                                      {event.participants && event.participants.length > 0 ? (
                                        <div className="space-y-0.5">
                                          {event.participants.map((p, i) => {
                                            const role = String(p.role || '').toLowerCase();
                                            const showArrow = isSub && (role.includes('in') || role.includes('out'));
                                            return (
                                              <div key={i} className="truncate flex items-center gap-1 md:gap-2 justify-between">
                                                <span className="inline-flex items-center gap-1 shrink-0">
                                                  {showArrow && role.includes('in') && <ArrowUp size={12} strokeWidth={3} className="text-green-500" />}
                                                  {showArrow && role.includes('out') && <ArrowDown size={12} strokeWidth={3} className="text-yellow-500" />}
                                                </span>
                                                <span className="truncate">{p.name}{(!isSub && p.role) ? ` · ${p.role}` : ''}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <span className="truncate block">{event.player}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Stats */}
        <div className={activeTab !== 'detail' ? 'lg:col-span-12 flex flex-col gap-8' : 'hidden'}>

          {/* Starting Lineups */}
          <div className={activeTab === 'lineup' ? '' : 'hidden'}>
            <div className="glass-card rounded-3xl p-6 backdrop-blur-md bg-white/50 dark:bg-black/40 border border-white/20 dark:border-white/5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                Starting Lineups
              </h3>
              <div className="w-full">
                {/* Horizontal Field Header */}
                <div className="flex justify-between items-center mb-8 px-4 md:px-12">
                    {/* Home Team */}
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 md:w-16 md:h-16 relative group">
                                {typeof match.homeTeam.logo === 'string' ? (
                                    <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="relative w-full h-full object-contain drop-shadow-2xl transform transition-transform group-hover:scale-110 duration-500" />
                                ) : (
                                    match.homeTeam.logo
                                )}
                            </div>
                            <h4 className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">{match.homeTeam.name}</h4>
                        </div>
                        <div className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-[0.2em]">
                            {`${homeByPos.D.length} - ${homeByPos.M.length} - ${homeByPos.F.length}`}
                        </div>
                    </div>

                    {/* VS Badge */}
                    <div className="hidden md:flex flex-col items-center px-6">
                        <div className="text-5xl font-black text-gray-200 dark:text-white/10 italic tracking-widest">VS</div>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-4 mb-2 flex-row-reverse">
                            <div className="w-12 h-12 md:w-16 md:h-16 relative group">
                                {typeof match.awayTeam.logo === 'string' ? (
                                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="relative w-full h-full object-contain drop-shadow-2xl transform transition-transform group-hover:scale-110 duration-500" />
                                ) : (
                                    match.awayTeam.logo
                                )}
                            </div>
                            <h4 className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">{match.awayTeam.name}</h4>
                        </div>
                        <div className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-[0.2em]">
                            {`${awayByPos.D.length} - ${awayByPos.M.length} - ${awayByPos.F.length}`}
                        </div>
                    </div>
                </div>

                {/* 3D Horizontal Field */}
                <div className="group perspective-[1500px] h-[350px] md:h-[500px] mb-8 w-full overflow-hidden">
                    <div className="relative w-full h-full bg-[#38a038] rounded-3xl shadow-2xl transform-style-3d rotate-x-[25deg] scale-[0.85] md:scale-[0.95] origin-center border-[4px] border-[#328c32] overflow-visible">
                        
                        {/* Field Texture */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_49px,rgba(0,0,0,0.05)_50px)] rounded-xl opacity-30"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)] rounded-xl"></div>

                        {/* Field Markings */}
                        <div className="absolute inset-4 border-2 border-white/60 rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.2)]"></div> 
                        
                        {/* Center Circle & Line */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 border-2 border-white/60 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                        <div className="absolute top-4 bottom-4 left-1/2 w-0.5 bg-white/60 shadow-[0_0_10px_rgba(255,255,255,0.2)]"></div>

                        {/* Left Penalty Area (Home GK) */}
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 w-24 h-48 md:w-32 md:h-64 border-r-2 border-y-2 border-white/60 shadow-[0_0_5px_rgba(255,255,255,0.2)]"></div>
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 w-10 h-20 md:w-12 md:h-32 border-r-2 border-y-2 border-white/60"></div>
                        <div className="absolute top-1/2 left-28 md:left-36 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                        
                        {/* Right Penalty Area (Away GK) */}
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 w-24 h-48 md:w-32 md:h-64 border-l-2 border-y-2 border-white/60 shadow-[0_0_5px_rgba(255,255,255,0.2)]"></div>
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 w-10 h-20 md:w-12 md:h-32 border-l-2 border-y-2 border-white/60"></div>
                        <div className="absolute top-1/2 right-28 md:right-36 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>

                        {/* Corner Arcs */}
                        <div className="absolute top-4 left-4 w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br-full"></div>
                        <div className="absolute top-4 right-4 w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl-full"></div>
                        <div className="absolute bottom-4 left-4 w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr-full"></div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl-full"></div>

                        {/* Players Layer */}
                        <div className="absolute inset-0 transform-style-3d translate-z-[20px] py-4">
                            
                            {/* HOME TEAM (Left Side) */}
                            {/* GK */}
                            <div className="absolute top-1/2 left-[5%] -translate-y-1/2 flex flex-col items-center transform -rotate-x-[25deg] hover:scale-110 hover:-translate-y-2 z-20 cursor-pointer group/player transition-transform duration-300">
                                {homeByPos.G.map(p => (
                                    <div key={`hgk-${p.id}`} className="flex flex-col items-center">
                                        <div className="relative transform-style-3d transition-transform duration-500 group-hover/player:rotate-y-[180deg]">
                                            <div className="backface-hidden">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7 text-yellow-400 fill-current drop-shadow-md"><path d="M12,12c2.2,0,4-1.8,4-4s-1.8-4-4-4S8,5.8,8,8S9.8,12,12,12z M12,14c-2.7,0-8,1.3-8,4v2h16v-2C20,15.3,14.7,14,12,14z"/></svg>
                                            </div>
                                            <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-yellow-400 rounded-full w-4 h-4 md:w-6 md:h-6 border-2 border-white shadow-md mx-auto mt-0.5">
                                                <span className="text-black/80 font-black text-[9px] md:text-[11px]">{p.jersey}</span>
                                            </div>
                                        </div>
                                        <div className="mt-0.5 md:mt-1 flex items-center justify-center gap-1 px-1.5 py-0.5 bg-blue-900/80 backdrop-blur-sm rounded text-[6px] md:text-[8px] font-bold text-white text-center shadow-md border border-white/10 whitespace-nowrap">
                                            {p.subbedOut && <ArrowDown size={8} className="text-red-400" strokeWidth={3} />}
                                            {p.name.split(' ').pop()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* DEF */}
                            <div className="absolute top-0 bottom-0 left-[15%] w-[10%] flex flex-col justify-center items-center gap-1 md:gap-4 max-h-[90%] my-auto">
                                {homeByPos.D.map(p => (
                                    <div key={`hdef-${p.id}`} className="flex flex-col items-center transform -rotate-x-[25deg] hover:scale-110 hover:-translate-y-2 z-20 cursor-pointer group/player transition-transform duration-300">
                                        <div className="relative transform-style-3d transition-transform duration-500 group-hover/player:rotate-y-[180deg]">
                                            <div className="backface-hidden">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7 text-blue-600 fill-current drop-shadow-md"><path d="M16,4.9L16,4.9v-0.7C16,3.4,15.5,2.7,14.8,2.3C13.9,1.9,13,1.7,12,1.7c-1,0-1.9,0.2-2.8,0.7C8.5,2.7,8,3.4,8,4.2v0.7l0,0l-1.6,1L4.8,7.5c-0.4,0.3-0.5,0.8-0.2,1.2l0.9,1.3c0.3,0.4,0.8,0.5,1.2,0.2l1.3-0.9V18c0,0.6,0.4,1,1,1h6c0.6,0,1-0.4,1-1V9.4l1.3,0.9c0.4,0.3,0.9,0.2,1.2-0.2l0.9-1.3c0.3-0.4,0.2-0.9-0.2-1.2L17.6,5.9L16,4.9z"/></svg>
                                            </div>
                                            <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-blue-600 rounded-full w-4 h-4 md:w-6 md:h-6 border-2 border-white shadow-md mx-auto mt-0.5">
                                                <span className="text-white font-black text-[9px] md:text-[11px]">{p.jersey}</span>
                                            </div>
                                        </div>
                                        <div className="mt-0.5 md:mt-1 flex items-center justify-center gap-1 px-1.5 py-0.5 bg-blue-900/80 backdrop-blur-sm rounded text-[6px] md:text-[8px] font-bold text-white text-center shadow-md border border-white/10 whitespace-nowrap">
                                            {p.subbedOut && <ArrowDown size={8} className="text-red-400" strokeWidth={3} />}
                                            {p.name.split(' ').pop()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* MID */}
                            <div className="absolute top-0 bottom-0 left-[26%] w-[10%] flex flex-col justify-center items-center gap-1 md:gap-4 max-h-[90%] my-auto">
                                {homeByPos.M.map(p => (
                                    <div key={`hmid-${p.id}`} className="flex flex-col items-center transform -rotate-x-[25deg] hover:scale-110 hover:-translate-y-2 z-20 cursor-pointer group/player transition-transform duration-300">
                                        <div className="relative transform-style-3d transition-transform duration-500 group-hover/player:rotate-y-[180deg]">
                                            <div className="backface-hidden">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7 text-blue-600 fill-current drop-shadow-md"><path d="M16,4.9L16,4.9v-0.7C16,3.4,15.5,2.7,14.8,2.3C13.9,1.9,13,1.7,12,1.7c-1,0-1.9,0.2-2.8,0.7C8.5,2.7,8,3.4,8,4.2v0.7l0,0l-1.6,1L4.8,7.5c-0.4,0.3-0.5,0.8-0.2,1.2l0.9,1.3c0.3,0.4,0.8,0.5,1.2,0.2l1.3-0.9V18c0,0.6,0.4,1,1,1h6c0.6,0,1-0.4,1-1V9.4l1.3,0.9c0.4,0.3,0.9,0.2,1.2-0.2l0.9-1.3c0.3-0.4,0.2-0.9-0.2-1.2L17.6,5.9L16,4.9z"/></svg>
                                            </div>
                                            <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-blue-600 rounded-full w-4 h-4 md:w-6 md:h-6 border-2 border-white shadow-md mx-auto mt-0.5">
                                                <span className="text-white font-black text-[9px] md:text-[11px]">{p.jersey}</span>
                                            </div>
                                        </div>
                                        <div className="mt-0.5 md:mt-1 flex items-center justify-center gap-1 px-1.5 py-0.5 bg-blue-900/80 backdrop-blur-sm rounded text-[6px] md:text-[8px] font-bold text-white text-center shadow-md border border-white/10 whitespace-nowrap">
                                            {p.subbedOut && <ArrowDown size={8} className="text-red-400" strokeWidth={3} />}
                                            {p.name.split(' ').pop()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* FWD */}
                            <div className="absolute top-0 bottom-0 left-[32%] w-[10%] flex flex-col justify-center items-center gap-1 md:gap-4 max-h-[90%] my-auto">
                                {homeByPos.F.map(p => (
                                    <div key={`hfor-${p.id}`} className="flex flex-col items-center transform -rotate-x-[25deg] hover:scale-110 hover:-translate-y-2 z-20 cursor-pointer group/player transition-transform duration-300">
                                        <div className="relative transform-style-3d transition-transform duration-500 group-hover/player:rotate-y-[180deg]">
                                            <div className="backface-hidden">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7 text-blue-600 fill-current drop-shadow-md"><path d="M16,4.9L16,4.9v-0.7C16,3.4,15.5,2.7,14.8,2.3C13.9,1.9,13,1.7,12,1.7c-1,0-1.9,0.2-2.8,0.7C8.5,2.7,8,3.4,8,4.2v0.7l0,0l-1.6,1L4.8,7.5c-0.4,0.3-0.5,0.8-0.2,1.2l0.9,1.3c0.3,0.4,0.8,0.5,1.2,0.2l1.3-0.9V18c0,0.6,0.4,1,1,1h6c0.6,0,1-0.4,1-1V9.4l1.3,0.9c0.4,0.3,0.9,0.2,1.2-0.2l0.9-1.3c0.3-0.4,0.2-0.9-0.2-1.2L17.6,5.9L16,4.9z"/></svg>
                                            </div>
                                            <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-blue-600 rounded-full w-4 h-4 md:w-6 md:h-6 border-2 border-white shadow-md mx-auto mt-0.5">
                                                <span className="text-white font-black text-[9px] md:text-[11px]">{p.jersey}</span>
                                            </div>
                                        </div>
                                        <div className="mt-0.5 md:mt-1 flex items-center justify-center gap-1 px-1.5 py-0.5 bg-blue-900/80 backdrop-blur-sm rounded text-[6px] md:text-[8px] font-bold text-white text-center shadow-md border border-white/10 whitespace-nowrap">
                                            {p.subbedOut && <ArrowDown size={8} className="text-red-400" strokeWidth={3} />}
                                            {p.name.split(' ').pop()}
                                        </div>
                                    </div>
                                ))}
                            </div>


                            {/* AWAY TEAM (Right Side) */}
                            {/* FWD */}
                            <div className="absolute top-0 bottom-0 right-[32%] w-[10%] flex flex-col justify-center items-center gap-1 md:gap-4 max-h-[90%] my-auto">
                                {awayByPos.F.map(p => (
                                    <div key={`afor-${p.id}`} className="flex flex-col items-center transform -rotate-x-[25deg] hover:scale-110 hover:-translate-y-2 z-20 cursor-pointer group/player transition-transform duration-300">
                                        <div className="relative transform-style-3d transition-transform duration-500 group-hover/player:rotate-y-[180deg]">
                                            <div className="backface-hidden">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7 text-orange-500 fill-current drop-shadow-md"><path d="M16,4.9L16,4.9v-0.7C16,3.4,15.5,2.7,14.8,2.3C13.9,1.9,13,1.7,12,1.7c-1,0-1.9,0.2-2.8,0.7C8.5,2.7,8,3.4,8,4.2v0.7l0,0l-1.6,1L4.8,7.5c-0.4,0.3-0.5,0.8-0.2,1.2l0.9,1.3c0.3,0.4,0.8,0.5,1.2,0.2l1.3-0.9V18c0,0.6,0.4,1,1,1h6c0.6,0,1-0.4,1-1V9.4l1.3,0.9c0.4,0.3,0.9,0.2,1.2-0.2l0.9-1.3c0.3-0.4,0.2-0.9-0.2-1.2L17.6,5.9L16,4.9z"/></svg>
                                            </div>
                                            <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-orange-500 rounded-full w-4 h-4 md:w-6 md:h-6 border-2 border-white shadow-md mx-auto mt-0.5">
                                                <span className="text-white font-black text-[9px] md:text-[11px]">{p.jersey}</span>
                                            </div>
                                        </div>
                                        <div className="mt-0.5 md:mt-1 flex items-center justify-center gap-1 px-1.5 py-0.5 bg-orange-900/80 backdrop-blur-sm rounded text-[6px] md:text-[8px] font-bold text-white text-center shadow-md border border-white/10 whitespace-nowrap">
                                            {p.subbedOut && <ArrowDown size={8} className="text-red-400" strokeWidth={3} />}
                                            {p.name.split(' ').pop()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* MID */}
                            <div className="absolute top-0 bottom-0 right-[26%] w-[10%] flex flex-col justify-center items-center gap-1 md:gap-4 max-h-[90%] my-auto">
                                {awayByPos.M.map(p => (
                                    <div key={`amid-${p.id}`} className="flex flex-col items-center transform -rotate-x-[25deg] hover:scale-110 hover:-translate-y-2 z-20 cursor-pointer group/player transition-transform duration-300">
                                        <div className="relative transform-style-3d transition-transform duration-500 group-hover/player:rotate-y-[180deg]">
                                            <div className="backface-hidden">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7 text-orange-500 fill-current drop-shadow-md"><path d="M16,4.9L16,4.9v-0.7C16,3.4,15.5,2.7,14.8,2.3C13.9,1.9,13,1.7,12,1.7c-1,0-1.9,0.2-2.8,0.7C8.5,2.7,8,3.4,8,4.2v0.7l0,0l-1.6,1L4.8,7.5c-0.4,0.3-0.5,0.8-0.2,1.2l0.9,1.3c0.3,0.4,0.8,0.5,1.2,0.2l1.3-0.9V18c0,0.6,0.4,1,1,1h6c0.6,0,1-0.4,1-1V9.4l1.3,0.9c0.4,0.3,0.9,0.2,1.2-0.2l0.9-1.3c0.3-0.4,0.2-0.9-0.2-1.2L17.6,5.9L16,4.9z"/></svg>
                                            </div>
                                            <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-orange-500 rounded-full w-4 h-4 md:w-6 md:h-6 border-2 border-white shadow-md mx-auto mt-0.5">
                                                <span className="text-white font-black text-[9px] md:text-[11px]">{p.jersey}</span>
                                            </div>
                                        </div>
                                        <div className="mt-0.5 md:mt-1 flex items-center justify-center gap-1 px-1.5 py-0.5 bg-orange-900/80 backdrop-blur-sm rounded text-[6px] md:text-[8px] font-bold text-white text-center shadow-md border border-white/10 whitespace-nowrap">
                                            {p.subbedOut && <ArrowDown size={8} className="text-red-400" strokeWidth={3} />}
                                            {p.name.split(' ').pop()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* DEF */}
                            <div className="absolute top-0 bottom-0 right-[15%] w-[10%] flex flex-col justify-center items-center gap-1 md:gap-4 max-h-[90%] my-auto">
                                {awayByPos.D.map(p => (
                                    <div key={`adef-${p.id}`} className="flex flex-col items-center transform -rotate-x-[25deg] hover:scale-110 hover:-translate-y-2 z-20 cursor-pointer group/player transition-transform duration-300">
                                        <div className="relative transform-style-3d transition-transform duration-500 group-hover/player:rotate-y-[180deg]">
                                            <div className="backface-hidden">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7 text-orange-500 fill-current drop-shadow-md"><path d="M16,4.9L16,4.9v-0.7C16,3.4,15.5,2.7,14.8,2.3C13.9,1.9,13,1.7,12,1.7c-1,0-1.9,0.2-2.8,0.7C8.5,2.7,8,3.4,8,4.2v0.7l0,0l-1.6,1L4.8,7.5c-0.4,0.3-0.5,0.8-0.2,1.2l0.9,1.3c0.3,0.4,0.8,0.5,1.2,0.2l1.3-0.9V18c0,0.6,0.4,1,1,1h6c0.6,0,1-0.4,1-1V9.4l1.3,0.9c0.4,0.3,0.9,0.2,1.2-0.2l0.9-1.3c0.3-0.4,0.2-0.9-0.2-1.2L17.6,5.9L16,4.9z"/></svg>
                                            </div>
                                            <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-orange-500 rounded-full w-4 h-4 md:w-6 md:h-6 border-2 border-white shadow-md mx-auto mt-0.5">
                                                <span className="text-white font-black text-[9px] md:text-[11px]">{p.jersey}</span>
                                            </div>
                                        </div>
                                        <div className="mt-0.5 md:mt-1 flex items-center justify-center gap-1 px-1.5 py-0.5 bg-orange-900/80 backdrop-blur-sm rounded text-[6px] md:text-[8px] font-bold text-white text-center shadow-md border border-white/10 whitespace-nowrap">
                                            {p.subbedOut && <ArrowDown size={8} className="text-red-400" strokeWidth={3} />}
                                            {p.name.split(' ').pop()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* GK */}
                            <div className="absolute top-1/2 right-[5%] -translate-y-1/2 flex flex-col items-center transform -rotate-x-[25deg] hover:scale-110 hover:-translate-y-2 z-20 cursor-pointer group/player transition-transform duration-300">
                                {awayByPos.G.map(p => (
                                    <div key={`agk-${p.id}`} className="flex flex-col items-center">
                                        <div className="relative transform-style-3d transition-transform duration-500 group-hover/player:rotate-y-[180deg]">
                                            <div className="backface-hidden">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7 text-yellow-500 fill-current drop-shadow-md"><path d="M12,12c2.2,0,4-1.8,4-4s-1.8-4-4-4S8,5.8,8,8S9.8,12,12,12z M12,14c-2.7,0-8,1.3-8,4v2h16v-2C20,15.3,14.7,14,12,14z"/></svg>
                                            </div>
                                            <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-yellow-500 rounded-full w-4 h-4 md:w-6 md:h-6 border-2 border-white shadow-md mx-auto mt-0.5">
                                                <span className="text-white font-black text-[9px] md:text-[11px]">{p.jersey}</span>
                                            </div>
                                        </div>
                                        <div className="mt-1 flex items-center justify-center gap-1 px-1.5 py-0.5 bg-orange-900/80 backdrop-blur-sm rounded text-[6px] md:text-[8px] font-bold text-white text-center shadow-md border border-white/10 whitespace-nowrap">
                                            {p.subbedOut && <ArrowDown size={8} className="text-red-400" strokeWidth={3} />}
                                            {p.name.split(' ').pop()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>

                {/* Squad Lists Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Home Squad List */}
                  <div>
                    {/* Starters */}
                    <div>
                      <h5 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2">Home Starters</h5>
                      <div className="space-y-1">
                        {match.homePlayers.filter(p => p.isStarter).map(p => (
                          <div key={`hstart-${p.id}`} className="flex items-center gap-3 text-sm px-3 py-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition">
                            <span className="w-6 text-center font-bold text-gray-500 dark:text-gray-400 text-xs">{p.jersey}</span>
                            {p.headshot ? (
                              <img src={p.headshot} alt={p.name} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                                <span className="text-xs">👤</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="font-semibold text-gray-900 dark:text-white hover:underline truncate block">
                                {p.name}
                              </a>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400">{p.position}</div>
                            </div>
                            {p.subbedOut && <ArrowDown size={14} className="text-red-500" />}
                            {(p.goals || 0) > 0 && <span className="text-xs">⚽ {p.goals > 1 ? `x${p.goals}` : ''}</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Substitutes */}
                    <div className="mt-4">
                      <h5 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2">Home Substitutes</h5>
                      <div className="space-y-1">
                        {match.homePlayers.filter(p => !p.isStarter).map(p => (
                          <div key={`hsub-${p.id}`} className="flex items-center gap-3 text-sm px-3 py-2 rounded-xl bg-white/20 dark:bg-white/5 border border-white/10 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/10 transition opacity-80 hover:opacity-100">
                            <span className="w-6 text-center font-bold text-gray-500 dark:text-gray-400 text-xs">{p.jersey}</span>
                            {p.headshot ? (
                              <img src={p.headshot} alt={p.name} className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 object-cover ${!isNfl ? 'grayscale' : ''}`} />
                            ) : (
                              <div className={`w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center ${!isNfl ? 'grayscale' : ''}`}>
                                <span className="text-xs">👤</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="font-medium text-gray-700 dark:text-gray-300 hover:underline truncate block">
                                {p.name}
                              </a>
                              <div className="text-[10px] text-gray-500 dark:text-gray-500">{p.position}</div>
                            </div>
                            {p.subbedIn && <ArrowUp size={14} className="text-green-500" />}
                            {(p.goals || 0) > 0 && <span className="text-xs">⚽ {p.goals > 1 ? `x${p.goals}` : ''}</span>}
                          </div>
                        ))}
                        {match.homePlayers.filter(p => !p.isStarter).length === 0 && <div className="text-xs text-gray-400 italic px-2">No substitutes listed</div>}
                      </div>
                    </div>
                  </div>

                  {/* Away Squad List */}
                  <div>
                    {/* Starters */}
                    <div>
                      <h5 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2">Away Starters</h5>
                      <div className="space-y-1">
                        {match.awayPlayers.filter(p => p.isStarter).map(p => (
                          <div key={`astart-${p.id}`} className="flex items-center gap-3 text-sm px-3 py-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition">
                            <span className="w-6 text-center font-bold text-gray-500 dark:text-gray-400 text-xs">{p.jersey}</span>
                            {p.headshot ? (
                              <img src={p.headshot} alt={p.name} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                                <span className="text-xs">👤</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="font-semibold text-gray-900 dark:text-white hover:underline truncate block">
                                {p.name}
                              </a>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400">{p.position}</div>
                            </div>
                            {p.subbedOut && <ArrowDown size={14} className="text-red-500" />}
                            {(p.goals || 0) > 0 && <span className="text-xs">⚽ {p.goals > 1 ? `x${p.goals}` : ''}</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Substitutes */}
                    <div className="mt-4">
                      <h5 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2">Away Substitutes</h5>
                      <div className="space-y-1">
                        {match.awayPlayers.filter(p => !p.isStarter).map(p => (
                          <div key={`asub-${p.id}`} className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-white/20 dark:bg-white/5 border border-white/10 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/10 transition opacity-80 hover:opacity-100">
                            <span className="w-6 text-center font-bold text-gray-500 dark:text-gray-400 text-xs">{p.jersey}</span>
                            {p.headshot ? (
                              <img src={p.headshot} alt={p.name} className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 object-cover ${!isNfl ? 'grayscale' : ''}`} />
                            ) : (
                              <div className={`w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center ${!isNfl ? 'grayscale' : ''}`}>
                                <span className="text-xs">👤</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="font-medium text-gray-700 dark:text-gray-300 hover:underline truncate block">
                                {p.name}
                              </a>
                              <div className="text-[10px] text-gray-500 dark:text-gray-500">{p.position}</div>
                            </div>
                            {p.subbedIn && <ArrowUp size={14} className="text-green-500" />}
                            {(p.goals || 0) > 0 && <span className="text-xs">⚽ {p.goals > 1 ? `x${p.goals}` : ''}</span>}
                          </div>
                        ))}
                        {match.awayPlayers.filter(p => !p.isStarter).length === 0 && <div className="text-xs text-gray-400 italic px-2">No substitutes listed</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >

      {/* Team Stats (Stacked below timeline) */}
      <div style={{ display: activeTab === 'statics' ? 'block' : 'none' }} className="space-y-6">
        {match.status === 'SCHEDULED' ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-400 dark:text-gray-500 font-medium mb-1">Match Not Started</p>
            <p className="text-gray-300 dark:text-gray-600 text-xs">Team stats will be available after kick-off</p>
          </div>
        ) : (
          <>
        {/* Possession Card */}
        {(() => {
            const possessionStat = match.stats.find(s => s.name.toLowerCase().includes('possession'));
            if (!possessionStat) return null;

            const homeVal = parseFloat(String(possessionStat.homeValue).replace('%', ''));
            const awayVal = parseFloat(String(possessionStat.awayValue).replace('%', ''));
            const total = homeVal + awayVal;
            const homePercent = total === 0 ? 50 : (homeVal / total) * 100;

            const radius = 46;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (awayVal / 100) * circumference;

            return (
                <div className="glass-card bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-4 md:p-6 flex flex-col items-center">
                     <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 md:mb-6">Possession</h3>
                     <div className="flex items-center justify-center gap-2 md:gap-12 w-full">
                        {/* Home Team */}
                        <div className="flex items-center gap-2 md:gap-4 text-right">
                            <div className="text-xl md:text-4xl font-black text-gray-900 dark:text-white">{homeVal}%</div>
                            <img 
                                src={match.homeTeam.logo || DEFAULT_TEAM_LOGO} 
                                alt={match.homeTeam.name} 
                                className="w-8 h-8 md:w-14 md:h-14 object-contain" 
                                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                            />
                        </div>

                        {/* Chart */}
                        <div className="relative w-20 h-20 md:w-36 md:h-36 flex items-center justify-center">
                             <svg className="transform -rotate-90 w-full h-full drop-shadow-xl">
                                {/* Background (Home - Left side naturally if Away fills Right) */}
                                <circle 
                                    cx="50%" cy="50%" r={radius} 
                                    stroke="currentColor" 
                                    strokeWidth="8" 
                                    fill="transparent" 
                                    className="text-blue-600" 
                                />
                                {/* Foreground (Away - Fills Clockwise from Top -> Right) */}
                                <circle 
                                    cx="50%" cy="50%" r={radius} 
                                    stroke="currentColor" 
                                    strokeWidth="8" 
                                    fill="transparent" 
                                    strokeDasharray={circumference} 
                                    strokeDashoffset={offset} 
                                    strokeLinecap="round"
                                    className="text-orange-500 transition-all duration-1000 ease-out" 
                                />
                             </svg>
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="text-[10px] md:text-xs font-bold text-gray-400">VS</span>
                             </div>
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center gap-2 md:gap-4 text-left">
                            <img 
                                src={match.awayTeam.logo || DEFAULT_TEAM_LOGO} 
                                alt={match.awayTeam.name} 
                                className="w-8 h-8 md:w-14 md:h-14 object-contain" 
                                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                            />
                            <div className="text-xl md:text-4xl font-black text-gray-900 dark:text-white">{awayVal}%</div>
                        </div>
                     </div>
                </div>
            );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Stats Card */}
            <div className="glass-card bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                  Key Stats
                </h3>

                <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <img 
                            src={match.homeTeam.logo || DEFAULT_TEAM_LOGO} 
                            alt={match.homeTeam.name} 
                            className="w-10 h-10 object-contain" 
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                        />
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{match.homeTeam.shortName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{match.awayTeam.shortName}</span>
                        <img 
                            src={match.awayTeam.logo || DEFAULT_TEAM_LOGO} 
                            alt={match.awayTeam.name} 
                            className="w-10 h-10 object-contain" 
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                  {(() => {
                    const getKeyStatOrder = (name: string) => {
                        const n = name.toLowerCase();
                        if (n.includes('expected goals') || n.includes('xg')) return 1;
                        if (n.includes('big chances')) return 2;
                        if (n === 'shots' || n === 'total shots') return 3;
                        if (n.includes('saves')) return 4;
                        if (n.includes('corner')) return 5;
                        if (n.includes('foul')) return 6;
                        if (n.includes('pass')) return 7;
                        if (n.includes('free kick')) return 8;
                        if (n.includes('tackle')) return 9;
                        if (n.includes('yellow card')) return 10;
                        if (n.includes('red card')) return 11;
                        return 100;
                    };

                    const keyStats = match.stats
                        .filter(s => getKeyStatOrder(s.name) < 100 && !s.name.toLowerCase().includes('possession'))
                        .sort((a, b) => getKeyStatOrder(a.name) - getKeyStatOrder(b.name));
                    
                    if (keyStats.length === 0) return <div className="text-center text-gray-400 py-4">No key statistics available.</div>;

                    return keyStats.map((stat, idx) => {
                      const isPercentage = stat.isPercentage || stat.name.toLowerCase().includes('%') || stat.name.toLowerCase().includes('accuracy');
                      let homeVal = parseFloat(String(stat.homeValue).replace('%', ''));
                      let awayVal = parseFloat(String(stat.awayValue).replace('%', ''));

                      // Decimal to Percentage conversion (e.g. 0.85 -> 85)
                      if (isPercentage && homeVal <= 1 && homeVal > 0 && awayVal <= 1 && awayVal > 0) {
                          homeVal = Math.round(homeVal * 100);
                          awayVal = Math.round(awayVal * 100);
                      }
                      
                      let homePercent = 0;
                      let awayPercent = 0;

                      if (isPercentage) {
                          homePercent = homeVal;
                          awayPercent = awayVal;
                      } else {
                          const max = Math.max(homeVal, awayVal);
                          if (max > 0) {
                              homePercent = (homeVal / max) * 100;
                              awayPercent = (awayVal / max) * 100;
                          }
                      }

                      return (
                        <div key={idx} className="flex flex-col gap-2">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-base md:text-lg font-black text-gray-900 dark:text-white">
                                    {homeVal}{isPercentage && !String(homeVal).includes('%') ? '%' : ''}
                                </span>
                                <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-center truncate px-2">{stat.name}</span>
                                <span className="text-base md:text-lg font-black text-gray-900 dark:text-white">
                                    {awayVal}{isPercentage && !String(awayVal).includes('%') ? '%' : ''}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full h-2">
                                <div className="flex-1 h-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex justify-end">
                                    <div 
                                        className="h-full bg-blue-600 rounded-full" 
                                        style={{ width: `${homePercent}%` }}
                                    />
                                </div>
                                <div className="flex-1 h-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex justify-start">
                                    <div 
                                        className="h-full bg-orange-500 rounded-full" 
                                        style={{ width: `${awayPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                      );
                    });
                  })()}
                </div>
            </div>

            {/* Other Stats Card */}
            <div className="glass-card bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <span className="w-1 h-6 bg-gray-400 rounded-full mr-3"></span>
                  Other Stats
                </h3>

                <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <img 
                            src={match.homeTeam.logo || DEFAULT_TEAM_LOGO} 
                            alt={match.homeTeam.name} 
                            className="w-10 h-10 object-contain" 
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                        />
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{match.homeTeam.shortName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{match.awayTeam.shortName}</span>
                        <img 
                            src={match.awayTeam.logo || DEFAULT_TEAM_LOGO} 
                            alt={match.awayTeam.name} 
                            className="w-10 h-10 object-contain" 
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                  {(() => {
                    const getKeyStatOrder = (name: string) => {
                        const n = name.toLowerCase();
                        if (n.includes('expected goals') || n.includes('xg')) return 1;
                        if (n.includes('big chances')) return 2;
                        if (n === 'shots' || n === 'total shots') return 3;
                        if (n.includes('saves')) return 4;
                        if (n.includes('corner')) return 5;
                        if (n.includes('foul')) return 6;
                        if (n.includes('pass')) return 7;
                        if (n.includes('free kick')) return 8;
                        if (n.includes('tackle')) return 9;
                        if (n.includes('yellow card')) return 10;
                        if (n.includes('red card')) return 11;
                        return 100;
                    };

                    const otherStats = match.stats
                        .filter(s => getKeyStatOrder(s.name) === 100 && !s.name.toLowerCase().includes('possession'));
                    
                    if (otherStats.length === 0) return <div className="text-center text-gray-400 py-4">No other statistics available.</div>;

                    return otherStats.map((stat, idx) => {
                      const isPercentage = stat.isPercentage || stat.name.toLowerCase().includes('%') || stat.name.toLowerCase().includes('accuracy');
                      let homeVal = parseFloat(String(stat.homeValue).replace('%', ''));
                      let awayVal = parseFloat(String(stat.awayValue).replace('%', ''));

                      // Decimal to Percentage conversion (e.g. 0.85 -> 85)
                      if (isPercentage && homeVal <= 1 && homeVal > 0 && awayVal <= 1 && awayVal > 0) {
                          homeVal = Math.round(homeVal * 100);
                          awayVal = Math.round(awayVal * 100);
                      }
                      
                      let homePercent = 0;
                      let awayPercent = 0;

                      if (isPercentage) {
                          homePercent = homeVal;
                          awayPercent = awayVal;
                      } else {
                          const max = Math.max(homeVal, awayVal);
                          if (max > 0) {
                              homePercent = (homeVal / max) * 100;
                              awayPercent = (awayVal / max) * 100;
                          }
                      }

                      return (
                        <div key={idx} className="flex flex-col gap-2">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-base md:text-lg font-black text-gray-900 dark:text-white">
                                    {homeVal}{isPercentage && !String(homeVal).includes('%') ? '%' : ''}
                                </span>
                                <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-center truncate px-2">{stat.name}</span>
                                <span className="text-base md:text-lg font-black text-gray-900 dark:text-white">
                                    {awayVal}{isPercentage && !String(awayVal).includes('%') ? '%' : ''}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full h-2">
                                <div className="flex-1 h-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex justify-end">
                                    <div 
                                        className="h-full bg-blue-600 rounded-full" 
                                        style={{ width: `${homePercent}%` }}
                                    />
                                </div>
                                <div className="flex-1 h-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex justify-start">
                                    <div 
                                        className="h-full bg-orange-500 rounded-full" 
                                        style={{ width: `${awayPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                      );
                    });
                  })()}
                </div>
            </div>
        </div>
          </>
        )}
      </div>
      <div style={{ display: activeTab === 'news' ? 'block' : 'none' }} className="glass-card bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-6 md:p-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
          <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
          Match News
        </h3>
        {activeTab === 'news' && (
          <NewsSection 
            leagueId={match.leagueId} 
            matchId={match.id} 
            hideHeader 
            className="!p-0 !bg-transparent !shadow-none !border-none"
          />
        )}
      </div>
    </div >


  );
};

export default SoccerMatchDetail;
