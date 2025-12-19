import React, { useState } from 'react';
import { MatchDetailData, PlayerStat } from '../types';
import { Calendar, ArrowRight, Clock, Shield, Award, Activity, Route, Newspaper } from 'lucide-react';
import { DEFAULT_TEAM_LOGO } from '../constants';
import NewsSection from './NewsSection';

interface NFLMatchDetailProps {
    match: MatchDetailData;
    onBack: () => void;
}

const NFLMatchDetail: React.FC<NFLMatchDetailProps> = ({ match, onBack }) => {
    const [activeTab, setActiveTab] = useState(() => {
        if (match.status === 'SCHEDULED') return 'news';
        return 'summary';
    });

    // Helper to group players by category
    const groupPlayersByCategory = (players: PlayerStat[]) => {
        const groups: Record<string, PlayerStat[]> = {};
        players.forEach(p => {
            const cat = p.category || 'other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });
        return groups;
    };

    const homePlayerGroups = groupPlayersByCategory(match.homePlayers);
    const awayPlayerGroups = groupPlayersByCategory(match.awayPlayers);
    
    // Common categories in order
    const statCategories = ['passing', 'rushing', 'receiving', 'defensive', 'kicking', 'returns', 'punting'];

    // Render Player Table
    const renderPlayerTable = (players: PlayerStat[], category: string) => {
        if (!players || players.length === 0) return null;

        // Define columns based on category
        let columns: { key: string; label: string }[] = [];
        
        switch (category) {
            case 'passing':
                columns = [
                    { key: 'C/ATT', label: 'C/ATT' },
                    { key: 'YDS', label: 'YDS' },
                    { key: 'AVG', label: 'AVG' },
                    { key: 'TD', label: 'TD' },
                    { key: 'INT', label: 'INT' },
                    { key: 'QBR', label: 'QBR' }
                ];
                break;
            case 'rushing':
                columns = [
                    { key: 'CAR', label: 'CAR' },
                    { key: 'YDS', label: 'YDS' },
                    { key: 'AVG', label: 'AVG' },
                    { key: 'TD', label: 'TD' },
                    { key: 'LONG', label: 'LNG' }
                ];
                break;
            case 'receiving':
                columns = [
                    { key: 'REC', label: 'REC' },
                    { key: 'YDS', label: 'YDS' },
                    { key: 'AVG', label: 'AVG' },
                    { key: 'TD', label: 'TD' },
                    { key: 'LONG', label: 'LNG' },
                    { key: 'TGTS', label: 'TGT' }
                ];
                break;
            case 'defensive':
                columns = [
                    { key: 'TOT', label: 'TOT' },
                    { key: 'SOLO', label: 'SOLO' },
                    { key: 'SACKS', label: 'SACK' },
                    { key: 'TFL', label: 'TFL' },
                    { key: 'PD', label: 'PD' },
                    { key: 'QB HTS', label: 'QB HTS' },
                    { key: 'TD', label: 'TD' }
                ];
                break;
             case 'kicking':
                columns = [
                    { key: 'FG', label: 'FG' },
                    { key: 'PCT', label: 'PCT' },
                    { key: 'LONG', label: 'LNG' },
                    { key: 'XP', label: 'XP' },
                    { key: 'PTS', label: 'PTS' }
                ];
                break;
             case 'punting':
                columns = [
                    { key: 'NO', label: 'NO' },
                    { key: 'YDS', label: 'YDS' },
                    { key: 'AVG', label: 'AVG' },
                    { key: 'TB', label: 'TB' },
                    { key: 'In 20', label: 'In 20' },
                    { key: 'LONG', label: 'LNG' }
                ];
                break;
             case 'returns':
                columns = [
                    { key: 'NO', label: 'NO' },
                    { key: 'YDS', label: 'YDS' },
                    { key: 'AVG', label: 'AVG' },
                    { key: 'LONG', label: 'LNG' },
                    { key: 'TD', label: 'TD' }
                ];
                break;
            default:
                // Fallback generic columns
                const firstPlayer = players[0];
                if (firstPlayer && firstPlayer.stats) {
                    columns = Object.keys(firstPlayer.stats).slice(0, 5).map(k => ({ key: k, label: k }));
                }
        }

        return (
            <div className="mb-6 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-white/5">
                        <tr>
                            <th className="px-3 py-2 rounded-l-lg">Player</th>
                            {columns.map(col => (
                                <th key={col.key} className="px-2 py-2 text-center whitespace-nowrap">{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {players.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition">
                                <td className="px-3 py-2 font-medium flex items-center gap-2 min-w-[140px]">
                                    <span className="text-xs font-bold text-gray-400 w-4">{p.jersey}</span>
                                    <div className="flex flex-col">
                                        <span className="text-gray-900 dark:text-white font-semibold">{p.name}</span>
                                        <span className="text-[10px] text-gray-500">{p.position}</span>
                                    </div>
                                </td>
                                {columns.map(col => (
                                    <td key={col.key} className="px-2 py-2 text-center font-medium text-gray-700 dark:text-gray-300">
                                        {p.stats[col.key] || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="w-full">
            {/* Header / Scoreboard */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 to-black text-white shadow-2xl mb-6">
                <div className="absolute inset-0 bg-[url('https://wallpapercave.com/wp/wp1854239.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                
                <div className="relative z-10 p-6 md:p-8">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center mb-8 text-sm font-medium text-gray-300">
                       
                        <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{match.startTime.toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Score Board */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 max-w-6xl mx-auto">
                        {/* Home Team */}
                        <div className="flex flex-col items-center flex-1 order-1 md:order-1">
                            <img 
                                src={match.homeTeam.logo || DEFAULT_TEAM_LOGO} 
                                alt={match.homeTeam.name} 
                                className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-lg mb-4"
                            />
                            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-center">{match.homeScore}</h2>
                            <h3 className="text-xl md:text-2xl font-bold text-center leading-tight mt-2">{match.homeTeam.name}</h3>
                            <div className="text-sm text-gray-400 font-bold mt-1">{match.homeTeam.record}</div>
                        </div>

                        {/* Center Info */}
                        <div className="flex flex-col items-center px-4 order-3 md:order-2 w-full md:w-auto mt-6 md:mt-0">
                             {/* Status */}
                            <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-6">
                                <span className="text-sm font-bold tracking-widest uppercase text-yellow-400">
                                    {match.status} {match.minute ? `• ${match.minute}` : ''}
                                </span>
                            </div>

                            {/* Quarter Scoreboard */}
                            {(match.homeTeam.linescores && match.awayTeam.linescores) && (
                                <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10 w-full md:w-auto mb-4">
                                    <table className="text-sm text-center w-full md:w-auto">
                                        <thead>
                                            <tr className="text-white/40 text-xs border-b border-white/10">
                                                <th className="px-2 pb-2 text-left min-w-[60px]">Team</th>
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
                                                <td className="px-2 py-2 text-left font-bold text-white">{match.homeTeam.shortName}</td>
                                                {match.homeTeam.linescores.map((s, i) => (
                                                    <td key={i} className="px-2 py-2 text-gray-300">{s.displayValue || s.value}</td>
                                                ))}
                                                <td className="px-2 py-2 font-bold text-white">{match.homeScore}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-2 py-2 text-left font-bold text-white">{match.awayTeam.shortName}</td>
                                                {match.awayTeam.linescores.map((s, i) => (
                                                    <td key={i} className="px-2 py-2 text-gray-300">{s.displayValue || s.value}</td>
                                                ))}
                                                <td className="px-2 py-2 font-bold text-white">{match.awayScore}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            
                            {/* Game Info Box */}
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center gap-1 bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[140px]">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Game Info</div>
                                    {match.stadium && <div className="text-xs font-bold text-white">{match.stadium}</div>}
                                    {match.gameInfo?.venue?.address?.city && (
                                        <div className="text-[10px] text-gray-300">{match.gameInfo.venue.address.city}, {match.gameInfo.venue.address.state}</div>
                                    )}
                                    {match.gameInfo?.attendance && (
                                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 justify-center">
                                            <span>👥</span> {match.gameInfo.attendance.toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                {match.gameInfo?.odds && match.gameInfo.odds.length > 0 && (
                                    <div className="flex flex-col items-center gap-1 bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[120px]">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Odds</div>
                                        <div className="text-xs font-bold text-white">
                                            {match.gameInfo.odds[0].details}
                                        </div>
                                        <div className="text-[10px] text-gray-300">
                                            O/U: {match.gameInfo.odds[0].overUnder}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center flex-1 order-2 md:order-3">
                            <img 
                                src={match.awayTeam.logo || DEFAULT_TEAM_LOGO} 
                                alt={match.awayTeam.name} 
                                className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-lg mb-4"
                            />
                            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-center">{match.awayScore}</h2>
                            <h3 className="text-xl md:text-2xl font-bold text-center leading-tight mt-2">{match.awayTeam.name}</h3>
                            <div className="text-sm text-gray-400 font-bold mt-1">{match.awayTeam.record}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto space-x-2 mb-6 pb-2">
                {[
                    { id: 'summary', label: 'Summary', icon: <Activity size={16} /> },
                    { id: 'stats', label: 'Team Stats', icon: <Activity size={16} /> },
                    { id: 'boxscore', label: 'Player Stats', icon: <Award size={16} /> },
                    { id: 'drives', label: 'Drives', icon: <Route size={16} /> },
                    { id: 'news', label: 'News', icon: <Newspaper size={16} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                            : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            {/* Content Sections */}
            <div className="grid grid-cols-1 gap-6">
                
                {/* Main Content (Full Width) */}
                <div className="w-full space-y-6">
                    
                    {/* SUMMARY TAB */}
                    {activeTab === 'summary' && (
                        <>
                            {/* Scoring Summary */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Activity size={18} className="text-blue-500" />
                                    Scoring Summary
                                </h3>
                                <div className="space-y-6">
                                    {match.scoringPlays && match.scoringPlays.length > 0 ? (
                                        match.scoringPlays.map((play) => (
                                            <div key={play.id} className="flex gap-4 relative">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 p-1 flex items-center justify-center shrink-0">
                                                        <img src={play.team.logo} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="h-full w-px bg-gray-200 dark:bg-white/10 my-2"></div>
                                                </div>
                                                <div className="flex-1 pb-6">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                                                            Q{play.period.number} • {play.clock.displayValue}
                                                        </span>
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {play.awayScore} - {play.homeScore}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                                                        {play.text}
                                                    </p>
                                                    <div className="mt-2 inline-block px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold rounded">
                                                        {play.type.text}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">No scoring plays available yet.</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* TEAM STATS TAB */}
                    {activeTab === 'stats' && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                             <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Activity size={18} className="text-blue-500" />
                                Team Stats
                            </h3>
                            <div className="space-y-4">
                                {match.stats.map((stat, idx) => {
                                    const homeVal = parseFloat(String(stat.homeValue).replace('%', ''));
                                    const awayVal = parseFloat(String(stat.awayValue).replace('%', ''));
                                    // Simple logic for bar width
                                    const total = homeVal + awayVal;
                                    const homePct = total === 0 ? 50 : (homeVal / total) * 100;
                                    const awayPct = total === 0 ? 50 : (awayVal / total) * 100;

                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-sm font-semibold">
                                                <span className="w-12 text-left">{stat.homeValue}</span>
                                                <span className="text-gray-500 uppercase text-xs tracking-wider">{stat.name}</span>
                                                <span className="w-12 text-right">{stat.awayValue}</span>
                                            </div>
                                            <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
                                                <div className="bg-blue-600" style={{ width: `${homePct}%` }}></div>
                                                <div className="bg-red-600" style={{ width: `${awayPct}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* BOXSCORE TAB */}
                    {activeTab === 'boxscore' && (
                        <div className="space-y-8">
                            {/* Home Team Stats */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
                                    <img src={match.homeTeam.logo} className="w-8 h-8 object-contain" alt="" />
                                    <h3 className="text-xl font-bold">{match.homeTeam.name} Stats</h3>
                                </div>
                                {statCategories.map(cat => (
                                    homePlayerGroups[cat] && (
                                        <div key={cat} className="mb-8 last:mb-0">
                                            <h4 className="text-sm font-bold uppercase text-gray-500 mb-3 tracking-wider">{cat}</h4>
                                            {renderPlayerTable(homePlayerGroups[cat], cat)}
                                        </div>
                                    )
                                ))}
                            </div>

                             {/* Away Team Stats */}
                             <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
                                    <img src={match.awayTeam.logo} className="w-8 h-8 object-contain" alt="" />
                                    <h3 className="text-xl font-bold">{match.awayTeam.name} Stats</h3>
                                </div>
                                {statCategories.map(cat => (
                                    awayPlayerGroups[cat] && (
                                        <div key={cat} className="mb-8 last:mb-0">
                                            <h4 className="text-sm font-bold uppercase text-gray-500 mb-3 tracking-wider">{cat}</h4>
                                            {renderPlayerTable(awayPlayerGroups[cat], cat)}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DRIVES TAB */}
                    {activeTab === 'drives' && (
                         <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <ArrowRight size={18} className="text-blue-500" />
                                Drive Chart
                            </h3>
                            <div className="space-y-4">
                                {match.drives && match.drives.length > 0 ? (
                                    match.drives.map((drive) => (
                                        <div key={drive.id} className="border border-gray-200 dark:border-white/10 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <img src={drive.team.logo} className="w-6 h-6 object-contain" alt="" />
                                                    <span className="font-bold text-sm">{drive.team.shortDisplayName}</span>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                                                    drive.result === 'Touchdown' ? 'bg-green-100 text-green-700' : 
                                                    drive.result === 'Field Goal' ? 'bg-blue-100 text-blue-700' :
                                                    drive.result === 'Punt' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {drive.result}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{drive.description}</p>
                                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-medium">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    <span>{drive.timeElapsed}</span>
                                                </div>
                                                <div>{drive.plays} Plays</div>
                                                <div>{drive.yards} Yards</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 py-8">No drive data available.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* NEWS TAB */}
                    {activeTab === 'news' && (
                        <NewsSection leagueId="nfl" matchId={match.id} />
                    )}

                </div>
            </div>
        </div>
    );
};

export default NFLMatchDetail;
