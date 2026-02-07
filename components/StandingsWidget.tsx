import React, { useEffect, useState } from 'react';
import { fetchStandings } from '../services/api';
import { StandingEntry } from '../types';
import { Loader2, ChevronRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LEAGUES, DEFAULT_TEAM_LOGO } from '../constants';

interface StandingsWidgetProps {
    leagueId: string;
    highlightTeamIds?: Set<string>;
}

const StandingsWidget: React.FC<StandingsWidgetProps> = ({ leagueId, highlightTeamIds }) => {
    const navigate = useNavigate();
    const [standings, setStandings] = useState<StandingEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadStandings = async () => {
            if (leagueId === 'top' || leagueId === 'following') {
                setStandings([]);
                return;
            }
            setLoading(true);
            try {
                const data = await fetchStandings(leagueId);
                setStandings(data);
            } catch (error) {
                console.error("Failed to load standings", error);
            } finally {
                setLoading(false);
            }
        };

        loadStandings();
    }, [leagueId]);

    // Determine if we should show tabs (only for NBA)
    const isNba = leagueId === 'nba';
    const isNfl = leagueId === 'nfl';
    const currentLeague = LEAGUES.find(l => l.id === leagueId);

    if (leagueId === 'following' || leagueId === 'top') {
        // We handle 'top' and 'following' in the parent by rendering multiple widgets
        // But if this component is mistakenly called with those IDs, return null
        return null;
    }

    const isHighlighted = (team: { id: string, name: string }) => {
        if (!highlightTeamIds) return false;
        if (highlightTeamIds.has(team.id)) return true;
        
        // Fallback: check by name (similar to match filtering logic)
        // Check if any followed ID (which might be 'nba_lakers') contains part of the team ID
        // or check name inclusion
        for (const followedId of highlightTeamIds) {
             const baseId = followedId.split('_')[1] || followedId;
             if (team.id.includes(baseId)) return true;
        }
        return false;
    };

    const renderTable = (data: StandingEntry[], title: string) => (
        <div key={title} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 h-fit sticky top-24 mb-6 last:mb-0">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    {currentLeague && (
                         <div className="h-6 w-6 flex items-center justify-center">
                            {typeof currentLeague.logo === 'string' ? (
                                <img 
                                    src={currentLeague.logo} 
                                    alt={`${currentLeague.name} Logo`} 
                                    className="h-full w-full object-contain" 
                                />
                            ) : (
                                <span className="text-yellow-500">{currentLeague.logo}</span>
                            )}
                         </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        {title}
                    </h3>
                </div>
                <a
                    href={`/standings/${leagueId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                    title={`View full ${currentLeague?.name || ''} standings`}
                >
                    View All <ChevronRight size={14} />
                </a>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
            ) : data.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 font-medium border-b border-gray-100 dark:border-white/5">
                            <tr>
                                <th className="pb-2 pl-1 w-8">#</th>
                                <th className="pb-2">Team</th>
                                <th className="pb-2 text-center">{isNba || isNfl ? 'W' : 'P'}</th>
                                <th className="pb-2 text-center">{isNba ? 'L' : isNfl ? 'L' : ''}</th>
                                <th className="pb-2 text-right">{isNba ? 'Pct' : isNfl ? '' : 'Pts'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/50 dark:divide-white/5">
                            {data.map((entry, index) => {
                                const highlighted = isHighlighted(entry.team);
                                return (
                                <tr key={entry.team.id} className={`transition-colors ${highlighted ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                    <td className="py-2.5 pl-1 font-medium w-8 text-gray-500 dark:text-gray-400">
                                        {entry.stats.rank || index + 1}
                                    </td>
                                    <td className="py-2.5">
                                        <div className="flex items-center space-x-2">
                                            <div className="relative">
                                                <img
                                                    src={entry.team.logo || DEFAULT_TEAM_LOGO}
                                                    alt={entry.team.shortName}
                                                    className="w-6 h-6 object-contain"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO; }}
                                                />
                                                {highlighted && (
                                                    <div className="absolute -top-1 -right-1">
                                                        <Star size={8} className="fill-yellow-400 text-yellow-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`font-semibold truncate max-w-[120px] ${highlighted ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                                {entry.team.shortName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-2.5 text-center text-gray-500">
                                        {isNba || isNfl ? entry.stats.wins : entry.stats.gamesPlayed}
                                    </td>
                                    <td className="py-2.5 text-center text-gray-500">
                                        {(isNba || isNfl) ? entry.stats.losses : ''}
                                    </td>
                                    <td className="py-2.5 text-right font-bold text-gray-900 dark:text-white">
                                        {isNba
                                            ? entry.stats.winPct?.toFixed(3).replace(/^0+/, '')
                                            : isNfl
                                                ? ''
                                                : entry.stats.points
                                        }
                                    </td>
                                </tr>
                            );})}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No standings available
                </div>
            )}
        </div>
    );

    if (isNba) {
        // Filter and show two cards for NBA (East/West Top 8)
        const west = standings.filter(s => s.group === 'Western Conference').slice(0, 8);
        const east = standings.filter(s => s.group === 'Eastern Conference').slice(0, 8);

        return (
            <div className="space-y-6">
                {renderTable(west, 'Western Conference')}
                {renderTable(east, 'Eastern Conference')}
            </div>
        );
    }

    // Determine limit based on league
    const getLimit = () => {
        if (leagueId === 'eng.1') return 6; // Premier League: Top 6
        if (['esp.1', 'ita.1', 'ger.1', 'fra.1'].includes(leagueId)) return 4; // Others: Top 4
        return 10; // Default
    };

    return renderTable(standings.slice(0, getLimit()), currentLeague ? `${currentLeague.name} Standings` : 'Standings');
};

export default StandingsWidget;
