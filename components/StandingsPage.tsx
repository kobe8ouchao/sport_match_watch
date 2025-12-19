import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchStandings, fetchPlayerStats } from '../services/api';
import { StandingEntry, PlayerStatCategory } from '../types';
import { LEAGUES, DEFAULT_TEAM_LOGO } from '../constants';
import { Loader2, User } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface StandingsPageProps {
    toggleTheme: () => void;
    darkMode: boolean;
}

const StandingsPage: React.FC<StandingsPageProps> = ({ toggleTheme, darkMode }) => {
    const { leagueId } = useParams<{ leagueId: string }>();
    const isNba = leagueId === 'nba';
    const isNfl = leagueId === 'nfl';
    const currentLeague = LEAGUES.find(l => l.id === leagueId);
    
    // For NBA, we use tabs. For Soccer, we show side-by-side.
    // 'both' is a special state for side-by-side view (default for soccer)
    const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'both'>((isNba || isNfl) ? 'teams' : 'both');
    
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
    }, [leagueId]);

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
                                {isNba ? 'NBA' : leagueId?.toUpperCase()} Standings & Stats
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Current season statistics and rankings
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
