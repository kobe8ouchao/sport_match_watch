import React, { useState } from 'react';
import { MatchDetailData } from '../types';
import { Calendar, MapPin } from 'lucide-react';

interface BasketballMatchDetailProps {
    match: MatchDetailData;
    onBack: () => void;
}

const BasketballMatchDetail: React.FC<BasketballMatchDetailProps> = ({ match, onBack }) => {
    const [activeTab, setActiveTab] = useState<'stats' | 'players'>('stats');

    const renderPlayerStats = (players: any[], title: string, teamName: string, teamLogo: string) => (
        <div className="mb-6">

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-white/5">
                        <tr>
                            <th className="px-3 py-2 rounded-l-lg"><span><img src={teamLogo} alt={teamName} className="w-8 h-8 object-contain" /> </span></th>
                            <th className="px-2 py-2 text-center">MIN</th>
                            <th className="px-2 py-2 text-center font-bold">PTS</th>
                            <th className="px-2 py-2 text-center">REB</th>
                            <th className="px-2 py-2 text-center">AST</th>
                            <th className="px-2 py-2 text-center">STL</th>
                            <th className="px-2 py-2 text-center">BLK</th>
                            <th className="px-2 py-2 text-center">TO</th>
                            <th className="px-2 py-2 text-center">PF</th>
                            <th className="px-2 py-2 text-center rounded-r-lg">+/-</th>
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

    const renderTeamBoxscore = (teamName: string, players: any[], teamLogo?: string) => {
        const starters = players.filter(p => p.isStarter);
        const bench = players.filter(p => !p.isStarter && (p.stats.MIN && p.stats.MIN !== '0' && p.stats.MIN !== '--'));

        return (
            <div className="glass-card rounded-3xl overflow-hidden mb-8">
                {/* <div className="bg-gray-50/50 dark:bg-white/5 px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
                    {teamLogo && <img src={teamLogo} alt={teamName} className="w-8 h-8 object-contain" />}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{teamName}</h3>
                </div> */}
                <div className="p-6">
                    {renderPlayerStats(starters, 'Starters', teamName, teamLogo)}
                    {bench.length > 0 && renderPlayerStats(bench, 'Bench', teamName, teamLogo)}
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
                            <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="h-24 w-24 md:h-32 md:w-32 object-contain mb-4 drop-shadow-2xl" />
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-center">{match.homeScore}</h2>
                            <span className="text-lg font-bold text-orange-200 mt-2">{match.homeTeam.shortName}</span>
                        </div>

                        {/* Center Info */}
                        <div className="flex flex-col items-center px-8">
                            <div className="text-sm font-bold text-white/60 mb-4 uppercase tracking-widest">{match.status}</div>

                            {/* Quarter Scoreboard */}
                            {(match.homeTeam.linescores && match.awayTeam.linescores) && (
                                <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                    <table className="text-sm text-center">
                                        <thead>
                                            <tr className="text-white/40 text-xs border-b border-white/10">
                                                <th className="px-2 pb-2"></th>
                                                {match.homeTeam.linescores.map((_, i) => (
                                                    <th key={i} className="px-2 pb-2 w-8">Q{i + 1}</th>
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
                            <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="h-24 w-24 md:h-32 md:w-32 object-contain mb-4 drop-shadow-2xl" />
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-center">{match.awayScore}</h2>
                            <span className="text-lg font-bold text-white/80 mt-2">{match.awayTeam.shortName}</span>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-6 text-sm text-white/60 font-medium">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-orange-400" />
                            <span>{match.startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
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
            <div className="max-w-4xl mx-auto">
                {/* Team Stats Tab */}
                <div style={{ display: activeTab === 'stats' ? 'block' : 'none' }}>
                    <div className="glass-card p-6 rounded-3xl">
                        <h3 className="text-lg font-bold mb-6 flex items-center">
                            <span className="w-1 h-5 bg-orange-500 rounded-full mr-3"></span>
                            Team Stats
                        </h3>

                        {/* Team Header Row */}
                        <div className="flex justify-between items-center mb-6 px-2">
                            <div className="flex flex-col items-center w-16">
                                <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-10 h-10 object-contain mb-2" />
                                <span className="text-xs font-bold text-center leading-tight">{match.homeTeam.shortName}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-400">VS</span>
                            <div className="flex flex-col items-center w-16">
                                <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-10 h-10 object-contain mb-2" />
                                <span className="text-xs font-bold text-center leading-tight">{match.awayTeam.shortName}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {match.stats.map((stat, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 py-3 last:border-0">
                                    <span className="font-bold w-16 text-center text-lg">{stat.homeValue}</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wider flex-1 text-center font-medium whitespace-nowrap px-2">{stat.name}</span>
                                    <span className="font-bold w-16 text-center text-lg">{stat.awayValue}</span>
                                </div>
                            ))}
                            {match.stats.length === 0 && <p className="text-center text-gray-500">No stats available</p>}
                        </div>
                    </div>
                </div>

                {/* Player Stats Tab */}
                <div style={{ display: activeTab === 'players' ? 'block' : 'none' }}>
                    {renderTeamBoxscore(match.homeTeam.shortName, match.homePlayers, match.homeTeam.logo)}
                    {renderTeamBoxscore(match.awayTeam.shortName, match.awayPlayers, match.awayTeam.logo)}
                </div>
            </div>
        </div>
    );
};

export default BasketballMatchDetail;
