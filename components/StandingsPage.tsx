import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchStandings, fetchPlayerStats } from '../services/api';
import { StandingEntry, PlayerStatCategory } from '../types';
import { LEAGUES, DEFAULT_TEAM_LOGO } from '../constants';
import { CalendarDays, Loader2, Trophy, User } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import TennisRankingsPanel from './TennisRankingsPanel';
import TennisTourPanel from './TennisTourPanel';

interface StandingsPageProps {
    toggleTheme: () => void;
    darkMode: boolean;
}

const StandingsPage: React.FC<StandingsPageProps> = ({ toggleTheme, darkMode }) => {
    const { leagueId } = useParams<{ leagueId: string }>();
    const isNba = leagueId === 'nba';
    const isNfl = leagueId === 'nfl';
    const isTennis = leagueId === 'tennis.atp';
    const isWorldCup = leagueId === 'fifa.world';
    const currentLeague = LEAGUES.find(l => l.id === leagueId);
    
    // For NBA, we use tabs. For Soccer, we show side-by-side.
    // 'both' is a special state for side-by-side view (default for soccer)
    const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'both' | 'knockout'>(
        isWorldCup ? 'both' : (isNba || isNfl) ? 'teams' : 'both'
    );
    const [worldCupView, setWorldCupView] = useState<'groups' | 'knockout'>('groups');
    
    const [standings, setStandings] = useState<StandingEntry[]>([]);
    const [playerStats, setPlayerStats] = useState<PlayerStatCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [conferenceTab, setConferenceTab] = useState<'Eastern Conference' | 'Western Conference'>('Western Conference');

    useEffect(() => {
        // Reset tab when league changes
        setActiveTab((leagueId === 'nba' || leagueId === 'nfl') ? 'teams' : 'both');
    }, [leagueId]);

    useEffect(() => {
        if (!leagueId) return;

        const loadData = async () => {
            if (isTennis) {
                setStandings([]);
                setPlayerStats([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const [standingsData, playerData] = await Promise.all([
                    fetchStandings(leagueId),
                    fetchPlayerStats(leagueId)
                ]);
                setStandings(standingsData);
                setPlayerStats(playerData);
            } catch (error) {
                console.error("Failed to load standings data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [leagueId, isTennis]);

    return (
        <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'
            }`}>
            {/* Ambient Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-orange-100/40 dark:bg-orange-900/10 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
                <Header
                    darkMode={darkMode}
                    toggleTheme={toggleTheme}
                    onOpenCalendar={() => { }}
                    isCalendarOpen={false}
                    hideCalendarButton
                />

                <div className="mt-6 mb-8">
                    {/* Header Section */}
                    <div className="flex items-center space-x-4 mb-8">
                        {currentLeague && (
                            typeof currentLeague.logo === 'string' ? (
                                <img
                                    src={currentLeague.logo}
                                    alt={`${leagueId} logo`}
                                    className="w-16 h-16 object-contain"
                                />
                            ) : (
                                <div className="w-16 h-16 flex items-center justify-center text-yellow-500">
                                    {currentLeague.logo}
                                </div>
                            )
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {isTennis ? 'ATP & WTA Player Rankings' : isNba ? 'NBA' : leagueId?.toUpperCase()} {isTennis ? '' : 'Standings & Stats'}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                {isTennis ? 'Live ATP and WTA player rankings with movement and points' : 'Current season statistics and rankings'}
                            </p>
                        </div>
                    </div>

                    {/* Tabs for NBA only */}
                    {isNba && (
                        <div className="flex border-b border-gray-200 dark:border-white/10 mb-8">
                            <button
                                onClick={() => setActiveTab('teams')}
                                className={`pb-3 px-1 mr-8 font-medium text-lg transition-colors relative ${activeTab === 'teams'
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                Team Standings
                                {activeTab === 'teams' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black dark:bg-white rounded-t-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('players')}
                                className={`pb-3 px-1 mr-8 font-medium text-lg transition-colors relative ${activeTab === 'players'
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                Player Stats
                                {activeTab === 'players' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black dark:bg-white rounded-t-full" />
                                )}
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-gray-400" size={40} />
                        </div>
                    ) : isWorldCup ? (
                        <div>
                            {/* World Cup View Toggle */}
                            <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit mb-6">
                                <button
                                    onClick={() => setWorldCupView('groups')}
                                    className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${worldCupView === 'groups'
                                        ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    Group Stage
                                </button>
                                <button
                                    onClick={() => setWorldCupView('knockout')}
                                    className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${worldCupView === 'knockout'
                                        ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    Knockout Stage
                                </button>
                            </div>

                            {worldCupView === 'groups' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {(() => {
                                        const groupMap = new Map<string, StandingEntry[]>();
                                        standings.forEach((entry) => {
                                            const group = entry.group || 'Group';
                                            if (!groupMap.has(group)) groupMap.set(group, []);
                                            groupMap.get(group)!.push(entry);
                                        });
                                        const sortedGroups = Array.from(groupMap.entries()).sort(([a], [b]) => a.localeCompare(b));

                                        if (sortedGroups.length === 0) {
                                            return (
                                                <div className="col-span-full text-center py-20 text-gray-500">
                                                    Group stage standings not yet available. Check back once the tournament begins.
                                                </div>
                                            );
                                        }

                                        return sortedGroups.map(([groupName, entries]) => (
                                            <div key={groupName} className="bg-white dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-4 py-3">
                                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                                        {groupName}
                                                    </h3>
                                                </div>
                                                <table className="w-full text-xs">
                                                    <thead className="bg-gray-50/80 dark:bg-white/5">
                                                        <tr className="text-gray-500 dark:text-gray-400 font-medium">
                                                            <th className="py-2.5 pl-3 w-6 text-left">#</th>
                                                            <th className="py-2.5 text-left">Team</th>
                                                            <th className="py-2.5 text-center w-7">P</th>
                                                            <th className="py-2.5 text-center w-7">W</th>
                                                            <th className="py-2.5 text-center w-7">D</th>
                                                            <th className="py-2.5 text-center w-7">L</th>
                                                            <th className="py-2.5 text-center w-7">GD</th>
                                                            <th className="py-2.5 text-center w-9 pr-3 font-bold">Pts</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50/80 dark:divide-white/5">
                                                        {entries.map((entry, idx) => {
                                                            const isQualified = idx < 2;
                                                            const isThirdPlace = idx === 2;
                                                            return (
                                                                <tr key={entry.team.id} className={`transition-colors ${isQualified ? 'border-l-3 border-l-green-500' : isThirdPlace ? 'border-l-3 border-l-yellow-400' : 'border-l-3 border-l-transparent'}`}>
                                                                    <td className="py-2 pl-3 font-medium text-gray-500 dark:text-gray-400">
                                                                        {idx + 1}
                                                                    </td>
                                                                    <td className="py-2">
                                                                        <div className="flex items-center space-x-2">
                                                                            <img
                                                                                src={entry.team.logo || DEFAULT_TEAM_LOGO}
                                                                                alt={entry.team.shortName}
                                                                                className="w-5 h-5 object-contain"
                                                                                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                                                                            />
                                                                            <span className={`font-semibold truncate max-w-[100px] ${isQualified ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                                                {entry.team.shortName}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 text-center text-gray-500">{entry.stats.gamesPlayed}</td>
                                                                    <td className="py-2 text-center text-gray-500">{entry.stats.wins}</td>
                                                                    <td className="py-2 text-center text-gray-500">{entry.stats.draws}</td>
                                                                    <td className="py-2 text-center text-gray-500">{entry.stats.losses}</td>
                                                                    <td className="py-2 text-center text-gray-500">
                                                                        {(entry.stats.goalDiff || 0) > 0 ? `+${entry.stats.goalDiff}` : entry.stats.goalDiff}
                                                                    </td>
                                                                    <td className="py-2 text-center pr-3 font-bold text-gray-900 dark:text-white">{entry.stats.points}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                                <div className="px-3 py-2 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
                                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Qualified</span>
                                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>Best 3rd</span>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-white/5 p-6 md:p-10 shadow-sm">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Knockout Stage Bracket</h2>
                                    <div className="overflow-x-auto">
                                        <div className="min-w-[900px]">
                                            <div className="grid grid-cols-6 gap-3 items-center">
                                                {/* Round of 32 */}
                                                <div className="space-y-2">
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">Round of 32</h4>
                                                    {[
                                                        ['1A', '3C/D/E/F'], ['1B', '3A/C/D/E'],
                                                        ['1C', '3A/B/D/E'], ['1D', '3A/B/C/E'],
                                                        ['1E', '3A/B/C/D'], ['1F', '2A'],
                                                        ['1G', '3A/B/C/F'], ['1H', '3A/B/D/F'],
                                                        ['1I', '3A/B/E/F'], ['1J', '3A/C/E/F'],
                                                        ['1K', '3B/C/D/F'], ['1L', '3B/C/D/E'],
                                                        ['2B', '2E'], ['2C', '2F'],
                                                        ['2D', '1E'], ['3rd', '3rd'],
                                                    ].map(([home, away], i) => (
                                                        <div key={i} className="bg-gray-50 dark:bg-white/5 rounded-xl p-2 border border-gray-100 dark:border-white/5">
                                                            <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 text-center py-1">{home}</div>
                                                            <div className="border-t border-gray-200 dark:border-white/10 my-1"></div>
                                                            <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 text-center py-1">{away}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Round of 16 */}
                                                <div className="space-y-4 pt-8">
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">Round of 16</h4>
                                                    {Array.from({ length: 8 }, (_, i) => (
                                                        <div key={i} className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-2.5 border border-blue-100 dark:border-blue-500/20 h-[52px]">
                                                            <div className="text-[10px] text-gray-400 text-center py-1">TBD</div>
                                                            <div className="border-t border-blue-200/50 dark:border-blue-500/20 my-1"></div>
                                                            <div className="text-[10px] text-gray-400 text-center py-1">TBD</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Quarter Finals */}
                                                <div className="space-y-8 pt-16">
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">Quarter Finals</h4>
                                                    {Array.from({ length: 4 }, (_, i) => (
                                                        <div key={i} className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-2.5 border border-orange-100 dark:border-orange-500/20 h-[52px]">
                                                            <div className="text-[10px] text-gray-400 text-center py-1">TBD</div>
                                                            <div className="border-t border-orange-200/50 dark:border-orange-500/20 my-1"></div>
                                                            <div className="text-[10px] text-gray-400 text-center py-1">TBD</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Semi Finals */}
                                                <div className="space-y-16 pt-28">
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">Semi Finals</h4>
                                                    {Array.from({ length: 2 }, (_, i) => (
                                                        <div key={i} className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-2.5 border border-purple-100 dark:border-purple-500/20 h-[52px]">
                                                            <div className="text-[10px] text-gray-400 text-center py-1">TBD</div>
                                                            <div className="border-t border-purple-200/50 dark:border-purple-500/20 my-1"></div>
                                                            <div className="text-[10px] text-gray-400 text-center py-1">TBD</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Third Place */}
                                                <div className="space-y-8 pt-36">
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">3rd Place</h4>
                                                    <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-2.5 border border-yellow-200 dark:border-yellow-500/20 h-[52px]">
                                                        <div className="text-[10px] text-gray-400 text-center py-1">TBD</div>
                                                        <div className="border-t border-yellow-200/50 dark:border-yellow-500/20 my-1"></div>
                                                        <div className="text-[10px] text-gray-400 text-center py-1">TBD</div>
                                                    </div>
                                                </div>

                                                {/* Final */}
                                                <div className="space-y-8 pt-36">
                                                    <h4 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-1">
                                                        <Trophy size={12} /> Final
                                                    </h4>
                                                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-3 border-2 border-amber-300 dark:border-amber-500/30 h-[56px] shadow-lg">
                                                        <div className="text-[10px] font-bold text-gray-400 text-center py-1">TBD</div>
                                                        <div className="border-t border-amber-300/50 dark:border-amber-500/30 my-1"></div>
                                                        <div className="text-[10px] font-bold text-gray-400 text-center py-1">TBD</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
                                        The knockout bracket will populate as group stage matches are completed.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : isTennis ? (
                        <div className="space-y-8">
                            <div className="rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900/50 backdrop-blur-md p-6 shadow-sm">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                    <div className="max-w-3xl">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                            ATP/WTA Tennis Rankings and Tour Coverage
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300 leading-7">
                                            Follow live ATP and WTA player rankings, movement by position, ranking points,
                                            and this month&apos;s active tour events in one place. This page focuses on singles
                                            rankings and current tournament context, while the main tennis page tracks live ATP/WTA match cards.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Link
                                            to="/tennis"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-semibold transition-all"
                                        >
                                            <CalendarDays size={16} />
                                            View Tennis Matches
                                        </Link>
                                        <Link
                                            to="/schedule"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                        >
                                            <Trophy size={16} />
                                            View Full Schedule
                                        </Link>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4">
                                        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Rankings</div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            ATP and WTA player rankings with top 20 placement, points, and movement since the previous update.
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4">
                                        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Tour Events</div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            Monthly ATP and WTA tournament coverage with level, surface, venue, and current event status.
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4">
                                        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Live Coverage</div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            Use the tennis page for live singles match cards, round labels, set-by-set scores, and match detail pages.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                <div className="w-full lg:w-3/5">
                                    <TennisRankingsPanel />
                                </div>
                                <div className="w-full lg:w-2/5">
                                    <TennisTourPanel />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Team Standings (Shown if activeTab is 'teams' or 'both') */}
                            {(activeTab === 'teams' || activeTab === 'both') && (
                                <div className={`w-full ${activeTab === 'both' ? 'lg:w-3/4' : ''}`}>
                                    <h2 className="text-xl font-bold mb-4 flex items-center">
                                        <span className="bg-black dark:bg-white w-1 h-6 rounded-full mr-3"></span>
                                        Team Standings
                                    </h2>
                                    
                                    <div className="space-y-6">
                                        {isNba && (
                                            <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit mb-4">
                                                {(['Western Conference', 'Eastern Conference'] as const).map((conf) => (
                                                    <button
                                                        key={conf}
                                                        onClick={() => setConferenceTab(conf)}
                                                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${conferenceTab === conf
                                                            ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                            }`}
                                                    >
                                                        {conf.replace(' Conference', '')}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto w-full">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-gray-50/50 dark:bg-white/5 text-xs text-gray-500 font-medium uppercase tracking-wider">
                                                        <tr>
                                                            <th className="px-6 py-4 w-16">Rank</th>
                                                            <th className="px-6 py-4">Team</th>
                                                            <th className="px-6 py-4 text-center">Played</th>
                                                            <th className="px-6 py-4 text-center">Wins</th>
                                                            <th className="px-6 py-4 text-center">Losses</th>
                                                            {!isNba && !isNfl ? (
                                                                <>
                                                                    <th className="px-6 py-4 text-center">Draws</th>
                                                                    <th className="px-6 py-4 text-center">GD</th>
                                                                    <th className="px-6 py-4 text-center font-bold">Points</th>
                                                                </>
                                                            ) : isNfl ? (
                                                                <>
                                                                    <th className="px-4 py-4 text-center">Ties</th>
                                                                    <th className="px-4 py-4 text-center">Pct</th>
                                                                    <th className="px-4 py-4 text-center">PF</th>
                                                                    <th className="px-4 py-4 text-center">PA</th>
                                                                    <th className="px-4 py-4 text-center">Diff</th>
                                                                    <th className="px-4 py-4 text-center">Strk</th>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <th className="px-6 py-4 text-center">Pct</th>
                                                                    <th className="px-6 py-4 text-center">GB</th>
                                                                </>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                        {standings
                                                            .filter(s => !isNba || s.group === conferenceTab)
                                                            .map((entry, idx) => (
                                                                <tr key={entry.team.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                                    <td className="px-6 py-4 font-semibold text-gray-500 text-center">
                                                                        {entry.stats.rank || idx + 1}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center space-x-3">
                                                                            <img 
                                                                                src={entry.team.logo || DEFAULT_TEAM_LOGO} 
                                                                                alt="" 
                                                                                className="w-8 h-8 object-contain" 
                                                                                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                                                                            />
                                                                            <span className="font-semibold text-gray-900 dark:text-white text-base">
                                                                                {entry.team.name}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                        {entry.stats.gamesPlayed || (entry.stats.wins || 0) + (entry.stats.losses || 0)}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                        {entry.stats.wins}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                        {entry.stats.losses}
                                                                    </td>
                                                                    {!isNba && !isNfl ? (
                                                                        <>
                                                                            <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                                {entry.stats.draws}
                                                                            </td>
                                                                            <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                                {entry.stats.goalDiff}
                                                                            </td>
                                                                            <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white text-lg">
                                                                                {entry.stats.points}
                                                                            </td>
                                                                        </>
                                                                    ) : isNfl ? (
                                                                        <>
                                                                            <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                                {entry.stats.draws}
                                                                            </td>
                                                                            <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                                {entry.stats.winPct?.toFixed(2)}
                                                                            </td>
                                                                            <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                                {entry.stats.pf}
                                                                            </td>
                                                                            <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                                {entry.stats.pa}
                                                                            </td>
                                                                            <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                                {entry.stats.diff}
                                                                            </td>
                                                                            <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                                {entry.stats.streak}
                                                                            </td>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                                {entry.stats.winPct?.toFixed(3)}
                                                                            </td>
                                                                            <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                                                                {entry.stats.gamesBehind}
                                                                            </td>
                                                                        </>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Player Stats (Shown if activeTab is 'players' or 'both') */}
                            {(activeTab === 'players' || activeTab === 'both') && (
                                <div className={`w-full ${activeTab === 'both' ? 'lg:w-1/4' : ''}`}>
                                    <h2 className="text-xl font-bold mb-4 flex items-center">
                                        <span className="bg-orange-500 w-1 h-6 rounded-full mr-3"></span>
                                        Player Stats
                                    </h2>
                                    <div className={`grid gap-6 ${activeTab === 'players' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-6'}`}>
                                        {playerStats.map((category) => (
                                            <div key={category.name} className="bg-white dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm p-5">
                                                <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-gray-500 border-b border-gray-100 dark:border-white/5 pb-2">
                                                    {category.displayName} Leaders
                                                </h3>
                                                <div className="space-y-4">
                                                    {category.leaders.slice(0, 5).map((player, idx) => (
                                                        <div key={player.id} className="flex items-center justify-between group">
                                                            <div className="flex items-center space-x-3 min-w-0">
                                                                <span className={`w-5 text-center font-mono text-sm font-bold ${idx === 0 ? 'text-yellow-500' : 'text-gray-400'}`}>
                                                                    {player.rank}
                                                                </span>
                                                                <div className="relative flex-shrink-0">
                                                                    {isNba ? (
                                                                        <img src={player.headshot} alt="" className="w-8 h-8 rounded-full bg-gray-100 object-cover" />
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                                                            <User size={18} />
                                                                        </div>
                                                                    )}
                                                                    <img 
                                                                        src={player.teamLogo || DEFAULT_TEAM_LOGO} 
                                                                        alt="" 
                                                                        className="w-3 h-3 absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 border shadow-sm" 
                                                                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-black dark:group-hover:text-white transition-colors">
                                                                        {player.name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 truncate">
                                                                        {player.team}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-lg font-bold text-gray-900 dark:text-white flex-shrink-0 ml-2">
                                                                {player.displayValue}
                                                                {(category.displayName.toLowerCase().includes('pct') ||
                                                                    category.displayName.toLowerCase().includes('percentage') ||
                                                                    category.displayName.includes('%')) &&
                                                                    !player.displayValue.includes('%') ? '%' : ''}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {playerStats.length === 0 && (
                                            <div className="text-gray-500 text-center py-10 bg-gray-50 dark:bg-white/5 rounded-3xl w-full">
                                                No player stats available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default StandingsPage;
