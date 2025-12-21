import React, { useState } from 'react';
import { MatchDetailData } from '../types';
import { Calendar, MapPin } from 'lucide-react';
import { DEFAULT_TEAM_LOGO } from '../constants';
import NewsSection from './NewsSection';

interface BasketballMatchDetailProps {
    match: MatchDetailData;
    onBack: () => void;
}

const BasketballMatchDetail: React.FC<BasketballMatchDetailProps> = ({ match, onBack }) => {
    const [activeTab, setActiveTab] = useState<'stats' | 'players' | 'news'>(() => {
        if (match.status === 'SCHEDULED') return 'news';
        return 'players';
    });

    const renderPlayerStats = (players: any[], title: string, teamName: string, teamLogo: string) => (
        <div className="mb-6">

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-white/5">
                        <tr>
                            <th className="px-3 py-2 rounded-l-xl">
                                <span>
                                    <img 
                                        src={teamLogo || DEFAULT_TEAM_LOGO} 
                                        alt={teamName} 
                                        className="w-8 h-8 object-contain" 
                                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                                    /> 
                                </span>
                            </th>
                            <th className="px-2 py-2 text-center">MIN</th>
                            <th className="px-2 py-2 text-center font-bold">PTS</th>
                            <th className="px-2 py-2 text-center">REB</th>
                            <th className="px-2 py-2 text-center">AST</th>
                            <th className="px-2 py-2 text-center">STL</th>
                            <th className="px-2 py-2 text-center">BLK</th>
                            <th className="px-2 py-2 text-center">TO</th>
                            <th className="px-2 py-2 text-center">PF</th>
                            <th className="px-2 py-2 text-center rounded-r-xl">+/-</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {players.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition">
                                <td className="px-3 py-2 font-medium flex items-center gap-2">
                                    {p.headshot ? (
                                        <img src={p.headshot} alt={p.name} className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                            {p.jersey}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-gray-900 dark:text-white">{p.name}</span>
                                        <span className="text-[10px] text-gray-400">{p.position}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-2 text-center text-gray-500">{p.stats.MIN || '--'}</td>
                                <td className="px-2 py-2 text-center font-bold text-gray-900 dark:text-white">{p.stats.PTS || '0'}</td>
                                <td className="px-2 py-2 text-center">{p.stats.REB || '0'}</td>
                                <td className="px-2 py-2 text-center">{p.stats.AST || '0'}</td>
                                <td className="px-2 py-2 text-center">{p.stats.STL || '0'}</td>
                                <td className="px-2 py-2 text-center">{p.stats.BLK || '0'}</td>
                                <td className="px-2 py-2 text-center">{p.stats.TO || '0'}</td>
                                <td className="px-2 py-2 text-center">{p.stats.PF || '0'}</td>
                                <td className="px-2 py-2 text-center">{p.stats['+/-'] || '--'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderTeamBoxscore = (teamName: string, players: any[], teamLogo?: string, record?: string) => {
        const starters = players.filter(p => p.isStarter);
        const bench = players.filter(p => !p.isStarter && (p.stats.MIN && p.stats.MIN !== '0' && p.stats.MIN !== '--'));

        return (
            <div className="glass-card rounded-3xl overflow-hidden mb-8">
                <div className="bg-gray-50/50 dark:bg-white/5 px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
                   <div className="flex items-center gap-3">
                        <img 
                            src={teamLogo || DEFAULT_TEAM_LOGO} 
                            alt={teamName} 
                            className="w-8 h-8 object-contain" 
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                        />
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{teamName}</h3>
                            {record && <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{record}</span>}
                        </div>
                   </div>
                </div>
                <div className="p-6">
                    {renderPlayerStats(starters, 'Starters', teamName, teamLogo || DEFAULT_TEAM_LOGO)}
                    {bench.length > 0 && renderPlayerStats(bench, 'Bench', teamName, teamLogo || DEFAULT_TEAM_LOGO)}
                    {players.length === 0 && <div className="text-center text-gray-400 py-4">No player data available.</div>}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
            {/* Banner */}
            <div className="glass-card p-0 rounded-3xl overflow-hidden mb-8 relative group">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-900/80 to-black z-0">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/basketball.png')] opacity-20"></div>
                </div>

                <div className="relative z-10 p-8 flex flex-col items-center text-white">
                    <div className="text-xs font-bold tracking-[0.2em] text-orange-300 mb-8 uppercase border border-orange-500/30 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md">
                        {match.leagueId} Basketball
                    </div>

                    <div className="flex justify-between items-center w-full max-w-5xl">
                        {/* Home Team */}
                        <div className="flex flex-col items-center flex-1">
                            <img 
                                src={match.homeTeam.logo || DEFAULT_TEAM_LOGO} 
                                alt={match.homeTeam.name} 
                                className="h-24 w-24 md:h-32 md:w-32 object-contain mb-4 drop-shadow-2xl" 
                                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                            />
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-center">{match.homeScore}</h2>
                            {match.leagueId === 'nba' && (
                                <div className="text-sm text-white/80 font-bold mt-1 mb-1">
                                    {match.homeTeam.record || ''}
                                </div>
                            )}
                            <span className="text-lg font-bold text-orange-200">{match.homeTeam.shortName}</span>
                        </div>

                        {/* Center Info */}
                        <div className="flex flex-col items-center px-8">
                            {match.status !== 'SCHEDULED' && match.status !== 'FINISHED' ? (
                                <div className="flex items-center gap-2 mb-4 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30 backdrop-blur-md">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    <span className="text-sm font-bold text-white tracking-widest uppercase">{match.status}</span>
                                </div>
                            ) : (
                                <div className="text-sm font-bold text-white/60 mb-4 uppercase tracking-widest">{match.status}</div>
                            )}

                            {/* Quarter Scoreboard */}
                            {(match.homeTeam.linescores && match.awayTeam.linescores) && (
                                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <table className="text-sm text-center">
                                        <thead>
                                            <tr className="text-white/40 text-xs border-b border-white/10">
                                                <th className="px-2 pb-2"></th>
                                                {match.homeTeam.linescores.map((_, i) => (
                                                    <th key={i} className="px-2 pb-2 w-8">
                                                        {i < 4 ? `Q${i + 1}` : `OT${i - 3}`}
                                                    </th>
                                                ))}
                                                <th className="px-2 pb-2 font-bold text-white">T</th>
                                            </tr>
                                        </thead>
                                        <tbody className="font-mono">
                                            <tr className="border-b border-white/5">
                                                <td className="px-2 py-2 text-left font-bold text-orange-400">{match.homeTeam.shortName}</td>
                                                {match.homeTeam.linescores.map((s, i) => (
                                                    <td key={i} className="px-2 py-2">{s.displayValue || s.value}</td>
                                                ))}
                                                <td className="px-2 py-2 font-bold">{match.homeScore}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-2 py-2 text-left font-bold text-white">{match.awayTeam.shortName}</td>
                                                {match.awayTeam.linescores.map((s, i) => (
                                                    <td key={i} className="px-2 py-2">{s.displayValue || s.value}</td>
                                                ))}
                                                <td className="px-2 py-2 font-bold">{match.awayScore}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center flex-1">
                            <img 
                                src={match.awayTeam.logo || DEFAULT_TEAM_LOGO} 
                                alt={match.awayTeam.name} 
                                className="h-24 w-24 md:h-32 md:w-32 object-contain mb-4 drop-shadow-2xl" 
                                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                            />
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-center">{match.awayScore}</h2>
                            {match.leagueId === 'nba' && (
                                <div className="text-sm text-white/80 font-bold mt-1 mb-1">
                                    {match.awayTeam.record || ''}
                                </div>
                            )}
                            <span className="text-lg font-bold text-white/80">{match.awayTeam.shortName}</span>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-6 text-sm text-white/60 font-medium">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-orange-400" />
                            <span>{match.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-orange-400" />
                            <span>{match.stadium}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6">
                <div className="w-full overflow-x-auto py-2 pl-2 md:pl-0">
                    <div className="flex space-x-3 min-w-max pr-4 items-center justify-center">
                        {[
                            { key: 'stats', label: 'Team Stats' },
                            { key: 'players', label: 'Player Stats' },
                            { key: 'news', label: 'News' },
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

            {/* Content Area */}
            <div className="max-w-6xl mx-auto">
                {/* Team Stats Tab */}
                <div style={{ display: activeTab === 'stats' ? 'block' : 'none' }}>
                    
                    {/* Game Leaders Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Game Leaders Section */}
                        <div className="glass-card p-6 rounded-3xl h-full">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-white/10 pb-4">
                                <div className="flex items-center gap-2">
                                    <img 
                                        src={match.homeTeam.logo || DEFAULT_TEAM_LOGO} 
                                        alt={match.homeTeam.name} 
                                        className="w-8 h-8 object-contain" 
                                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                                    />
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{match.homeTeam.shortName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{match.awayTeam.shortName}</span>
                                    <img 
                                        src={match.awayTeam.logo || DEFAULT_TEAM_LOGO} 
                                        alt={match.awayTeam.name} 
                                        className="w-8 h-8 object-contain" 
                                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                                    />
                                </div>
                            </div>
                            
                            {/* Leaders Logic */}
                            {(() => {
                                const getLeader = (players: any[], key: string) => {
                                    if (!players || players.length === 0) return null;
                                    return players.reduce((prev, current) => {
                                        const prevVal = parseFloat(prev.stats[key] || '0');
                                        const currVal = parseFloat(current.stats[key] || '0');
                                        return (currVal > prevVal) ? current : prev;
                                    }, players[0]);
                                };

                                const categories = [
                                    { key: 'PTS', label: 'Points' }, 
                                    { key: 'REB', label: 'Rebounds' },
                                    { key: 'AST', label: 'Assists' },
                                    { key: '3PM', label: '3-Pointers' },
                                    { key: 'STL', label: 'Steals' },
                                    { key: 'BLK', label: 'Blocks' }
                                ];

                                return categories.map(cat => {
                                    const homeLeader = getLeader(match.homePlayers, cat.key);
                                    const awayLeader = getLeader(match.awayPlayers, cat.key);
                                    
                                    if (!homeLeader || !awayLeader) return null;

                                    return (
                                        <div key={cat.key} className="flex items-center justify-between mb-8 last:mb-0">
                                            {/* Home Player */}
                                            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                                <div className="relative flex-shrink-0">
                                                    <img 
                                                        src={homeLeader.headshot || DEFAULT_TEAM_LOGO} 
                                                        alt={homeLeader.name} 
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-lg bg-gray-100 dark:bg-white/5"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm border border-gray-100 dark:border-white/5">
                                                        #{homeLeader.jersey}
                                                    </div>
                                                    <img 
                                                        src={match.homeTeam.logo || DEFAULT_TEAM_LOGO} 
                                                        alt="Team" 
                                                        className="absolute -top-1 -left-1 w-5 h-5 rounded-full border border-white dark:border-zinc-900 bg-white dark:bg-zinc-900 object-contain p-0.5 shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">{homeLeader.stats[cat.key]}</span>
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{homeLeader.name}</span>
                                                    
                                                    {/* Additional Stats */}
                                                    {cat.key === 'PTS' && (
                                                        <div className="flex gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                            <span>FG: {homeLeader.stats.FG || '--'}</span>
                                                            <span>FT: {homeLeader.stats.FT || '--'}</span>
                                                        </div>
                                                    )}
                                                    {cat.key === 'REB' && (
                                                        <div className="flex gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                            <span>Def: {homeLeader.stats.DREB || '--'}</span>
                                                            <span>Off: {homeLeader.stats.OREB || '--'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Category Label */}
                                            <div className="px-2 flex flex-col items-center justify-center w-16">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{cat.label}</span>
                                            </div>

                                            {/* Away Player */}
                                            <div className="flex items-center gap-3 flex-1 justify-end text-right overflow-hidden">
                                                <div className="flex flex-col items-end min-w-0">
                                                    <span className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">{awayLeader.stats[cat.key]}</span>
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{awayLeader.name}</span>
                                                    
                                                    {/* Additional Stats */}
                                                    {cat.key === 'PTS' && (
                                                        <div className="flex gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 justify-end">
                                                            <span>FG: {awayLeader.stats.FG || '--'}</span>
                                                            <span>FT: {awayLeader.stats.FT || '--'}</span>
                                                        </div>
                                                    )}
                                                    {cat.key === 'REB' && (
                                                        <div className="flex gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 justify-end">
                                                            <span>Def: {awayLeader.stats.DREB || '--'}</span>
                                                            <span>Off: {awayLeader.stats.OREB || '--'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="relative flex-shrink-0">
                                                    <img 
                                                        src={awayLeader.headshot || DEFAULT_TEAM_LOGO} 
                                                        alt={awayLeader.name} 
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-lg bg-gray-100 dark:bg-white/5"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                                                    />
                                                    <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm border border-gray-100 dark:border-white/5">
                                                        #{awayLeader.jersey}
                                                    </div>
                                                    <img 
                                                        src={match.awayTeam.logo || DEFAULT_TEAM_LOGO} 
                                                        alt="Team" 
                                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full border border-white dark:border-zinc-900 bg-white dark:bg-zinc-900 object-contain p-0.5 shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {/* Team Stats Section */}
                        <div className="glass-card p-6 rounded-3xl h-full">
                            {/* Team Header Row */}
                            <div className="flex justify-between items-center mb-8 px-2">
                                <div className="flex items-center gap-2">
                                    <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-8 h-8 object-contain" />
                                    <span className="text-sm font-bold">{match.homeTeam.shortName}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">{match.awayTeam.shortName}</span>
                                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-8 h-8 object-contain" />
                                </div>
                            </div>

                            <div className="space-y-8">
                                {[
                                    'Field Goal %',
                                    'Three Point %',
                                    'Free Throw %',
                                    'Rebounds',
                                    'Turnovers',
                                    'Percent Led',
                                    'Largest Lead'
                                ].map((statName, idx) => {
                                    const stat = match.stats.find(s => s.name.toLowerCase() === statName.toLowerCase()) || 
                                                match.stats.find(s => s.name.toLowerCase().includes(statName.toLowerCase()));
                                    
                                    if (!stat) return null;

                                    const isPercentage = statName.includes('%') || statName === 'Percent Led';
                                    const homeVal = parseFloat(String(stat.homeValue).replace('%', ''));
                                    const awayVal = parseFloat(String(stat.awayValue).replace('%', ''));
                                    
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
                                                <span className="text-xl font-black text-gray-900 dark:text-white">
                                                    {stat.homeValue}{isPercentage && !String(stat.homeValue).includes('%') ? '%' : ''}
                                                </span>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{statName}</span>
                                                <span className="text-xl font-black text-gray-900 dark:text-white">
                                                    {stat.awayValue}{isPercentage && !String(stat.awayValue).includes('%') ? '%' : ''}
                                                </span>
                                            </div>
                                            
                                            {/* Comparative Bars */}
                                            <div className="flex items-center gap-2 w-full h-2.5">
                                                {/* Home Track (Right Aligned) */}
                                                <div className="flex-1 h-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden flex justify-end">
                                                    <div 
                                                        className="h-full bg-orange-500 rounded-full" 
                                                        style={{ width: `${homePercent}%` }}
                                                    />
                                                </div>

                                                {/* Away Track (Left Aligned) */}
                                                <div className="flex-1 h-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden flex justify-start">
                                                    <div 
                                                        className="h-full bg-blue-600 rounded-full" 
                                                        style={{ width: `${awayPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {match.stats.length === 0 && <p className="text-center text-gray-500">No stats available</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Player Stats Tab */}
                <div style={{ display: activeTab === 'players' ? 'block' : 'none' }}>
                    {renderTeamBoxscore(match.homeTeam.shortName, match.homePlayers, match.homeTeam.logo, match.homeTeam.record)}
                    {renderTeamBoxscore(match.awayTeam.shortName, match.awayPlayers, match.awayTeam.logo, match.awayTeam.record)}
                </div>

                {/* News Tab */}
                <div style={{ display: activeTab === 'news' ? 'block' : 'none' }}>
                     <div className="glass-card bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-6 md:p-8">
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
                </div>
            </div>
        </div>
    );
};

export default BasketballMatchDetail;
