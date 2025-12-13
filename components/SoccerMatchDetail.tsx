import React, { useState, useEffect } from 'react';
import { MatchDetailData, MatchEvent, MatchStat } from '../types';
import { LEAGUES } from '../constants';
import { Clock, MapPin, ArrowUp, ArrowDown } from 'lucide-react';

interface SoccerMatchDetailProps {
  match: MatchDetailData;
  onBack: () => void;
}

const SoccerMatchDetail: React.FC<SoccerMatchDetailProps> = ({ match, onBack }) => {
  const isLive = match.status === 'LIVE' || match.status === 'HT';
  const [activeTab, setActiveTab] = useState<'detail' | 'lineup' | 'statics' | 'news'>('detail');
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
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

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        const league = match.leagueId;
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/news?event=${match.id}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed to fetch news');
        const data = await resp.json();
        const articles = Array.isArray(data?.articles) ? data.articles : [];
        setNews(articles);
      } catch (e) {
        setNews([]);
      } finally {
        setNewsLoading(false);
      }
    };
    if (activeTab === 'news') fetchNews();
  }, [activeTab, match.id, match.leagueId]);

  const getGoalEvents = (teamId: string) => {
    return match.events.filter(e =>
      e.teamId === teamId &&
      e.type.toLowerCase().includes('goal')
    );
  };

  const league = LEAGUES.find(l => l.id === match.leagueId);
  const leagueName = league ? league.name : match.leagueId.toUpperCase();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">

      {/* Match Banner */}
      <div className="relative w-full h-auto min-h-[22rem] rounded-3xl overflow-hidden shadow-2xl mb-8 group">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-black">
          {/* Optional: Add league specific background or team colors if available */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white px-4 py-10 pb-16">

          {/* League Badge */}
          <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
            {leagueName}
          </div>

          {/* Score Board */}
          <div className="flex items-center justify-between w-full max-w-4xl">
            {/* Home Team */}
            <div className="flex flex-col items-center flex-1">
              <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="h-20 w-20 md:h-28 md:w-28 object-contain drop-shadow-2xl mb-4" />
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
              <div className={`mt-4 px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase border ${isLive ? 'bg-red-500 border-red-400 animate-pulse' : 'bg-white/10 border-white/20'
                }`}>
                {match.status === 'LIVE' ? `LIVE • ${match.minute}'` : match.status}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center flex-1">
              <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="h-20 w-20 md:h-28 md:w-28 object-contain drop-shadow-2xl mb-4" />
              <h2 className="text-2xl md:text-4xl font-bold text-center tracking-tight">{match.awayTeam.name}</h2>
            </div>
          </div>

          {/* Goals List */}
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
                      const isSub = t.includes('substitution');
                      const typeIcon = t.includes('yellow')
                        ? <span className="inline-block w-4 h-5 bg-yellow-400 border border-yellow-600 rounded-sm" />
                        : t.includes('red')
                          ? <span className="inline-block w-4 h-5 bg-red-500 border border-red-700 rounded-sm" />
                          : isSub ? null
                            // ? <span className="inline-flex items-center gap-1"><ArrowUp size={16} strokeWidth={3} className="text-green-500" /><ArrowDown size={16} strokeWidth={3} className="text-yellow-500" /></span>
                            : t.includes('goal')
                              ? <span>⚽</span>
                              : null;
                      return (
                        <div key={event.id} className={`flex items-center justify-between w-full ${isHome ? 'flex-row-reverse' : ''}`}>
                          <div className="w-5/12"></div>
                          <div className="z-10 w-12 h-7 rounded-lg bg-white dark:bg-zinc-800 border-2 border-gray-200 dark:border-white/10 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                            {event.minute}'
                          </div>
                          <div className={`w-5/12 flex ${isHome ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                                  p-3 rounded-2xl border shadow-sm w-full max-w-[240px] transition-all hover:scale-105
                                                  ${isHome
                                ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-500/20'
                                : 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-500/20'
                              }
                                              `}>
                              <div className="flex items-center justify-between">
                                {isHome ? (
                                  <div className="flex-1 text-left">
                                    <div className="font-bold text-gray-900 dark:text-white text-xs mb-0.5">{event.type}</div>
                                    <div className="text-gray-600 dark:text-gray-300 text-[10px] font-medium">
                                      {event.participants && event.participants.length > 0 ? (
                                        <div className="space-y-0.5">
                                          {event.participants.map((p, i) => {
                                            const role = String(p.role || '').toLowerCase();
                                            const showArrow = isSub && (role.includes('in') || role.includes('out'));
                                            return (
                                              <div key={i} className="truncate flex items-center gap-2 justify-between">
                                                <span className="truncate">{p.name}{(!isSub && p.role) ? ` · ${p.role}` : ''}</span>
                                                <span className="inline-flex items-center gap-1">
                                                  {showArrow && role.includes('in') && <ArrowUp size={14} strokeWidth={3} className="text-green-500" />}
                                                  {showArrow && role.includes('out') && <ArrowDown size={14} strokeWidth={3} className="text-yellow-500" />}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <span className="truncate">{event.player}</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="shrink-0 mr-2">{typeIcon}</div>
                                )}

                                {isHome ? (
                                  <div className="shrink-0 ml-2">{typeIcon}</div>
                                ) : (
                                  <div className="flex-1 text-right">
                                    <div className="font-bold text-gray-900 dark:text-white text-xs mb-0.5">{event.type}</div>
                                    <div className="text-gray-600 dark:text-gray-300 text-[10px] font-medium">
                                      {event.participants && event.participants.length > 0 ? (
                                        <div className="space-y-0.5">
                                          {event.participants.map((p, i) => {
                                            const role = String(p.role || '').toLowerCase();
                                            const showArrow = isSub && (role.includes('in') || role.includes('out'));
                                            return (
                                              <div key={i} className="truncate flex items-center gap-2 justify-between">
                                                <span className="inline-flex items-center gap-1">
                                                  {showArrow && role.includes('in') && <ArrowUp size={14} strokeWidth={3} className="text-green-500" />}
                                                  {showArrow && role.includes('out') && <ArrowDown size={14} strokeWidth={3} className="text-yellow-500" />}
                                                </span>
                                                <span className="truncate">{p.name}{(!isSub && p.role) ? ` · ${p.role}` : ''}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <span className="truncate">{event.player}</span>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Home Team Lineup - Vertical Soccer Field */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">{match.homeTeam.name}</h4>

                  {/* Soccer Field - Home (Attacking Up -> GK at Bottom) */}
                  <div className="relative h-[600px] bg-[#2c8f2c] rounded-3xl overflow-hidden shadow-2xl mb-6 select-none">
                    {/* Field Texture (Stripes) */}
                    <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(90deg,transparent,transparent_49px,#000000_50px)]"></div>

                    {/* Field Markings */}
                    <div className="absolute inset-4 border-2 border-white/40 rounded-sm"></div> {/* Touchline */}

                    {/* Center Circle (Halfway) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/40 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full"></div>
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/40"></div> {/* Halfway Line */}

                    {/* Top Penalty Area (Attacking End) */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-32 border-b-2 border-x-2 border-white/40"></div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-12 border-b-2 border-x-2 border-white/40"></div>
                    <div className="absolute top-28 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/40 rounded-full"></div> {/* Penalty Spot */}
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 w-16 h-8 border-b-2 border-white/40 rounded-b-full opacity-50"></div> {/* D-Arc */}

                    {/* Bottom Penalty Area (Defending End - GK) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-32 border-t-2 border-x-2 border-white/40"></div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-12 border-t-2 border-x-2 border-white/40"></div>
                    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/40 rounded-full"></div> {/* Penalty Spot */}
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-16 h-8 border-t-2 border-white/40 rounded-t-full opacity-50"></div> {/* D-Arc */}

                    {/* Corner Arcs */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-b-2 border-r-2 border-white/40 rounded-br-full"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-b-2 border-l-2 border-white/40 rounded-bl-full"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-t-2 border-r-2 border-white/40 rounded-tr-full"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-t-2 border-l-2 border-white/40 rounded-tl-full"></div>

                    <div className="absolute inset-0 flex flex-col justify-between py-8">
                      {/* Forwards (Top) */}
                      <div className="flex justify-center items-center gap-6 flex-1 pt-4">
                        {homeByPos.F.map(p => (
                          <div key={`hfor-${p.id}`} className="flex flex-col items-center z-10">
                            <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="relative group">
                              <div className="w-9 h-9 rounded-full bg-blue-600 border border-white/80 flex items-center justify-center text-white font-bold text-[10px] shadow-sm group-hover:scale-110 transition-transform">
                                {p.headshot ? (
                                  <img src={p.headshot} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span>{p.jersey}</span>
                                )}
                              </div>
                              {p.subbedOut && <ArrowDown size={10} className="absolute -bottom-1 -right-1 bg-white rounded-full text-red-500 p-0.5" />}
                            </a>
                            <div className="text-[9px] text-white mt-0.5 font-bold bg-black/40 px-1.5 py-px rounded-full backdrop-blur-[2px] truncate max-w-[70px]">{p.name.split(' ').pop()}</div>
                          </div>
                        ))}
                      </div>

                      {/* Midfielders */}
                      <div className="flex justify-center items-center gap-6 flex-1">
                        {homeByPos.M.map(p => (
                          <div key={`hmid-${p.id}`} className="flex flex-col items-center z-10">
                            <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="relative group">
                              <div className="w-9 h-9 rounded-full bg-blue-600 border border-white/80 flex items-center justify-center text-white font-bold text-[10px] shadow-sm group-hover:scale-110 transition-transform">
                                {p.headshot ? (
                                  <img src={p.headshot} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span>{p.jersey}</span>
                                )}
                              </div>
                              {p.subbedOut && <ArrowDown size={10} className="absolute -bottom-1 -right-1 bg-white rounded-full text-red-500 p-0.5" />}
                            </a>
                            <div className="text-[9px] text-white mt-0.5 font-bold bg-black/40 px-1.5 py-px rounded-full backdrop-blur-[2px] truncate max-w-[70px]">{p.name.split(' ').pop()}</div>
                          </div>
                        ))}
                      </div>

                      {/* Defenders */}
                      <div className="flex justify-center items-center gap-6 flex-1">
                        {homeByPos.D.map(p => (
                          <div key={`hdef-${p.id}`} className="flex flex-col items-center z-10">
                            <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="relative group">
                              <div className="w-9 h-9 rounded-full bg-blue-600 border border-white/80 flex items-center justify-center text-white font-bold text-[10px] shadow-sm group-hover:scale-110 transition-transform">
                                {p.headshot ? (
                                  <img src={p.headshot} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span>{p.jersey}</span>
                                )}
                              </div>
                              {p.subbedOut && <ArrowDown size={10} className="absolute -bottom-1 -right-1 bg-white rounded-full text-red-500 p-0.5" />}
                            </a>
                            <div className="text-[9px] text-white mt-0.5 font-bold bg-black/40 px-1.5 py-px rounded-full backdrop-blur-[2px] truncate max-w-[70px]">{p.name.split(' ').pop()}</div>
                          </div>
                        ))}
                      </div>

                      {/* Goalkeeper (Bottom) */}
                      <div className="flex justify-center items-center flex-1 pb-4">
                        {homeByPos.G.map(p => (
                          <div key={`hgk-${p.id}`} className="flex flex-col items-center z-10">
                            <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="relative group">
                              <div className="w-10 h-10 rounded-full bg-yellow-500 border border-white/80 flex items-center justify-center text-white font-bold text-[10px] shadow-sm group-hover:scale-110 transition-transform">
                                {p.headshot ? (
                                  <img src={p.headshot} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span>{p.jersey}</span>
                                )}
                              </div>
                              {p.subbedOut && <ArrowDown size={10} className="absolute -bottom-1 -right-1 bg-white rounded-full text-red-500 p-0.5" />}
                            </a>
                            <div className="text-[9px] text-white mt-0.5 font-bold bg-black/40 px-1.5 py-px rounded-full backdrop-blur-[2px] truncate max-w-[70px]">{p.name.split(' ').pop()}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Formation Indicator */}
                    <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-white/90 border border-white/10">
                      {`${homeByPos.D.length}-${homeByPos.M.length}-${homeByPos.F.length}`}
                    </div>
                  </div>

                  {/* Squad List (Starters + Substitutes) */}
                  <div className="mt-6 space-y-4">
                    {/* Starters */}
                    <div>
                      <h5 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2">Starters</h5>
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
                    <div>
                      <h5 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2">Substitutes</h5>
                      <div className="space-y-1">
                        {match.homePlayers.filter(p => !p.isStarter).map(p => (
                          <div key={`hsub-${p.id}`} className="flex items-center gap-3 text-sm px-3 py-2 rounded-xl bg-white/20 dark:bg-white/5 border border-white/10 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/10 transition opacity-80 hover:opacity-100">
                            <span className="w-6 text-center font-bold text-gray-500 dark:text-gray-400 text-xs">{p.jersey}</span>
                            {p.headshot ? (
                              <img src={p.headshot} alt={p.name} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 object-cover grayscale" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center grayscale">
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
                </div>

                {/* Away Team Lineup - Vertical Soccer Field */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">{match.awayTeam.name}</h4>

                  {/* Soccer Field - Away (Attacking Down -> GK at Top) */}
                  <div className="relative h-[600px] bg-[#2c8f2c] rounded-3xl overflow-hidden shadow-2xl mb-6 select-none">
                    {/* Field Texture (Stripes) */}
                    <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(90deg,transparent,transparent_49px,#000000_50px)]"></div>

                    {/* Field Markings */}
                    <div className="absolute inset-4 border-2 border-white/40 rounded-sm"></div> {/* Touchline */}

                    {/* Center Circle (Halfway) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/40 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full"></div>
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/40"></div> {/* Halfway Line */}

                    {/* Top Penalty Area (Defending End - GK) */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-32 border-b-2 border-x-2 border-white/40"></div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-12 border-b-2 border-x-2 border-white/40"></div>
                    <div className="absolute top-28 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/40 rounded-full"></div> {/* Penalty Spot */}
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 w-16 h-8 border-b-2 border-white/40 rounded-b-full opacity-50"></div> {/* D-Arc */}

                    {/* Bottom Penalty Area (Attacking End) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-32 border-t-2 border-x-2 border-white/40"></div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-12 border-t-2 border-x-2 border-white/40"></div>
                    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/40 rounded-full"></div> {/* Penalty Spot */}
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-16 h-8 border-t-2 border-white/40 rounded-t-full opacity-50"></div> {/* D-Arc */}

                    {/* Corner Arcs */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-b-2 border-r-2 border-white/40 rounded-br-full"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-b-2 border-l-2 border-white/40 rounded-bl-full"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-t-2 border-r-2 border-white/40 rounded-tr-full"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-t-2 border-l-2 border-white/40 rounded-tl-full"></div>

                    <div className="absolute inset-0 flex flex-col justify-between py-8">
                      {/* Goalkeeper (Top) */}
                      <div className="flex justify-center items-center flex-1 pt-4">
                        {awayByPos.G.map(p => (
                          <div key={`agk-${p.id}`} className="flex flex-col items-center z-10">
                            <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="relative group">
                              <div className="w-10 h-10 rounded-full bg-yellow-500 border border-white/80 flex items-center justify-center text-white font-bold text-[10px] shadow-sm group-hover:scale-110 transition-transform">
                                {p.headshot ? (
                                  <img src={p.headshot} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span>{p.jersey}</span>
                                )}
                              </div>
                              {p.subbedOut && <ArrowDown size={10} className="absolute -bottom-1 -right-1 bg-white rounded-full text-red-500 p-0.5" />}
                            </a>
                            <div className="text-[9px] text-white mt-0.5 font-bold bg-black/40 px-1.5 py-px rounded-full backdrop-blur-[2px] truncate max-w-[70px]">{p.name.split(' ').pop()}</div>
                          </div>
                        ))}
                      </div>

                      {/* Defenders */}
                      <div className="flex justify-center items-center gap-6 flex-1">
                        {awayByPos.D.map(p => (
                          <div key={`adef-${p.id}`} className="flex flex-col items-center z-10">
                            <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="relative group">
                              <div className="w-9 h-9 rounded-full bg-orange-500 border border-white/80 flex items-center justify-center text-white font-bold text-[10px] shadow-sm group-hover:scale-110 transition-transform">
                                {p.headshot ? (
                                  <img src={p.headshot} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span>{p.jersey}</span>
                                )}
                              </div>
                              {p.subbedOut && <ArrowDown size={10} className="absolute -bottom-1 -right-1 bg-white rounded-full text-red-500 p-0.5" />}
                            </a>
                            <div className="text-[9px] text-white mt-0.5 font-bold bg-black/40 px-1.5 py-px rounded-full backdrop-blur-[2px] truncate max-w-[70px]">{p.name.split(' ').pop()}</div>
                          </div>
                        ))}
                      </div>

                      {/* Midfielders */}
                      <div className="flex justify-center items-center gap-6 flex-1">
                        {awayByPos.M.map(p => (
                          <div key={`amid-${p.id}`} className="flex flex-col items-center z-10">
                            <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="relative group">
                              <div className="w-9 h-9 rounded-full bg-orange-500 border border-white/80 flex items-center justify-center text-white font-bold text-[10px] shadow-sm group-hover:scale-110 transition-transform">
                                {p.headshot ? (
                                  <img src={p.headshot} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span>{p.jersey}</span>
                                )}
                              </div>
                              {p.subbedOut && <ArrowDown size={10} className="absolute -bottom-1 -right-1 bg-white rounded-full text-red-500 p-0.5" />}
                            </a>
                            <div className="text-[9px] text-white mt-0.5 font-bold bg-black/40 px-1.5 py-px rounded-full backdrop-blur-[2px] truncate max-w-[70px]">{p.name.split(' ').pop()}</div>
                          </div>
                        ))}
                      </div>

                      {/* Forwards (Bottom) */}
                      <div className="flex justify-center items-center gap-6 flex-1 pb-4">
                        {awayByPos.F.map(p => (
                          <div key={`afor-${p.id}`} className="flex flex-col items-center z-10">
                            <a href={`https://www.espn.com/soccer/player/_/id/${p.id}`} target="_blank" rel="noreferrer" className="relative group">
                              <div className="w-9 h-9 rounded-full bg-orange-500 border border-white/80 flex items-center justify-center text-white font-bold text-[10px] shadow-sm group-hover:scale-110 transition-transform">
                                {p.headshot ? (
                                  <img src={p.headshot} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span>{p.jersey}</span>
                                )}
                              </div>
                              {p.subbedOut && <ArrowDown size={10} className="absolute -bottom-1 -right-1 bg-white rounded-full text-red-500 p-0.5" />}
                            </a>
                            <div className="text-[9px] text-white mt-0.5 font-bold bg-black/40 px-1.5 py-px rounded-full backdrop-blur-[2px] truncate max-w-[70px]">{p.name.split(' ').pop()}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Formation Indicator */}
                    <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-white/90 border border-white/10">
                      {`${awayByPos.D.length}-${awayByPos.M.length}-${awayByPos.F.length}`}
                    </div>
                  </div>

                  {/* Squad List (Starters + Substitutes) */}
                  <div className="mt-6 space-y-4">
                    {/* Starters */}
                    <div>
                      <h5 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2">Starters</h5>
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
                    <div>
                      <h5 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2">Substitutes</h5>
                      <div className="space-y-1">
                        {match.awayPlayers.filter(p => !p.isStarter).map(p => (
                          <div key={`asub-${p.id}`} className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-white/20 dark:bg-white/5 border border-white/10 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/10 transition opacity-80 hover:opacity-100">
                            <span className="w-6 text-center font-bold text-gray-500 dark:text-gray-400 text-xs">{p.jersey}</span>
                            {p.headshot ? (
                              <img src={p.headshot} alt={p.name} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 object-cover grayscale" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center grayscale">
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
      <div style={{ display: activeTab === 'statics' ? 'block' : 'none' }} className="glass-card bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-6 md:p-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
          <span className="w-1 h-6 bg-orange-500 rounded-full mr-3"></span>
          Team Stats
        </h3>
        <div className="space-y-6">
          {match.stats.length === 0 ? (
            <div className="text-center text-gray-400 py-4">No statistics available.</div>
          ) : (
            match.stats.map((stat, idx) => {
              const homeVal = parseFloat(String(stat.homeValue).replace('%', ''));
              const awayVal = parseFloat(String(stat.awayValue).replace('%', ''));
              const total = homeVal + awayVal;
              const homePercent = total === 0 ? 50 : (homeVal / total) * 100;
              const awayPercent = total === 0 ? 50 : (awayVal / total) * 100;

              const homePct = Math.max(0, Math.min(100, stat.isPercentage ? homeVal : homePercent));
              const awayPct = Math.max(0, Math.min(100, stat.isPercentage ? awayVal : awayPercent));

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-gray-800 dark:text-gray-200">
                    <span>{stat.isPercentage ? `${homeVal}%` : stat.homeValue}</span>
                    <span className="text-gray-400 font-medium text-xs uppercase tracking-wide">{stat.name}</span>
                    <span>{stat.isPercentage ? `${awayVal}%` : stat.awayValue}</span>
                  </div>
                  {stat.isPercentage ? (
                    <div className="relative h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
                      <div
                        className="absolute top-0 h-full bg-blue-500 transition-all duration-1000 ease-out"
                        style={{ width: `${homePct}%`, right: '50%' }}
                      />
                      <div
                        className="absolute top-0 h-full bg-orange-500 transition-all duration-1000 ease-out"
                        style={{ width: `${awayPct}%`, left: '50%' }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
                      <div
                        className="bg-blue-500 transition-all duration-1000 ease-out"
                        style={{ width: `${homePct}%` }}
                      />
                      <div
                        className="bg-orange-500 transition-all duration-1000 ease-out"
                        style={{ width: `${awayPct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div style={{ display: activeTab === 'news' ? 'block' : 'none' }} className="glass-card bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-6 md:p-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
          <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
          Match News
        </h3>
        {newsLoading ? (
          <div className="text-center text-gray-400 py-6">Loading news…</div>
        ) : news.length === 0 ? (
          <div className="text-center text-gray-400 py-6">No news available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((a: any) => {
              const img = a.images?.[0]?.url;
              const link = a.links?.web?.href || a.links?.web?.self?.href || a.links?.api?.self?.href;
              return (
                <a key={a.id} href={link} target="_blank" rel="noreferrer" className="group rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 shadow-sm hover:shadow-md transition-all hover:bg-white/20 dark:hover:bg-white/10">
                  <div className="aspect-video bg-gray-100/10 dark:bg-white/5 overflow-hidden">
                    {img ? (
                      <img src={img} alt={a.headline || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📰</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug min-h-[2.5rem]">
                      {a.headline}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(a.published).toLocaleDateString()}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div >


  );
};

export default SoccerMatchDetail;
