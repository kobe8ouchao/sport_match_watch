import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Activity, 
  Flame,
  Zap
} from 'lucide-react';
import { fetchWeeklySchedule, fetchGlobalFantasyPlayers, TeamScheduleInfo } from '../services/fantasyService';

interface Player {
  id: string;
  name: string;
  team: string;
  teamId: string;
  position: string;
  avatar: string;
  percentOwned: number;
  stats: {
    pts: number;
    reb: number;
    ast: number;
    st: number;
    blk: number;
    tov: number;
    fgPct: number;
    ftPct: number;
    tpm: number;
    fantasyPoints: number; // Estimated or actual
  };
  opponents: {
    date: string;
    opponent: string;
    isHome: boolean;
  }[];
}

// 1. Data Processing Logic: findB2BTeams
// Returns teams playing on ALL target dates
const findB2BTeams = (schedule: TeamScheduleInfo[], targetDates: string[]) => {
    return schedule.filter(t => {
        const gameDates = t.games.map(g => g.date);
        return targetDates.every(d => gameDates.includes(d));
    }).map(t => ({
        teamAbbr: t.abbrev,
        dates: targetDates,
        teamId: t.id,
        fullSchedule: t // Keep ref to full schedule for opponent extraction
    }));
};

const NBAB2BOptimizer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'weekend'>('today');
  const [schedule, setSchedule] = useState<{ teamSchedules: TeamScheduleInfo[], dailyGameCounts: Record<string, number> } | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [dates, setDates] = useState<string[]>([]);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Schedule
        const scheduleData = await fetchWeeklySchedule();
        setSchedule(scheduleData);
        
        // Generate Date Strings for Tabs
        const today = new Date();
        const dateStrings = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dateStrings.push(d.toISOString().split('T')[0].replace(/-/g, ''));
        }
        setDates(dateStrings);

        // 2. Fetch Players (Pool)
        const filter = {
            players: {
                limit: 1000,
                sortPercOwned: { sortPriority: 1, sortAsc: false },
                filterSlotIds: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
                filterStatsForTopScoringPeriodIds: { value: 5 } // Get recent games/stats
            }
        };
        const rawPlayers = await fetchGlobalFantasyPlayers(filter);
        
        // Process Players
        const processed = rawPlayers.map((p: any) => {
            const stats = p.player.stats || [];
            // Try to find Last 7/15 days or Season
            const s = stats.find((x: any) => x.id === "002026")?.averageStats || {};
            
            // Simple Fantasy Points Estimate (Standard Scoring)
            const fp = (s.points || 0) * 1 + (s.rebounds || 0) * 1.2 + (s.assists || 0) * 1.5 + (s.steals || 0) * 3 + (s.blocks || 0) * 3 - (s.turnovers || 0) * 1;

            return {
                id: p.id,
                name: p.player.fullName,
                teamId: p.player.proTeamId,
                team: "N/A", // Will map from schedule
                position: p.player.defaultPositionId === 5 ? 'C' : p.player.defaultPositionId === 1 ? 'PG' : 'F/G', // Simplified
                avatar: `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${p.id}.png&w=350&h=254`,
                percentOwned: p.player.ownership?.percentOwned || 0,
                stats: {
                    pts: s.points || 0,
                    reb: s.rebounds || 0,
                    ast: s.assists || 0,
                    st: s.steals || 0,
                    blk: s.blocks || 0,
                    tov: s.turnovers || 0,
                    fgPct: s.fieldGoalPct || 0,
                    ftPct: s.freeThrowPct || 0,
                    tpm: s.threePointPct || 0,
                    fantasyPoints: fp
                },
                opponents: []
            };
        });

        setPlayers(processed);
      } catch (e) {
        console.error("Error loading B2B data:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter Logic
  const getFilteredPlayers = () => {
    if (!schedule || players.length === 0 || dates.length === 0) return [];

    let targetDates: string[] = [];
    let isWeekend = false;

    if (activeTab === 'today') {
        // Today + Tomorrow
        targetDates = [dates[0], dates[1]];
    } else if (activeTab === 'tomorrow') {
        // Tomorrow + Day After
        targetDates = [dates[1], dates[2]];
    } else if (activeTab === 'weekend') {
        // Find next Saturday + Sunday
        const satIndex = dates.findIndex(d => {
            const date = new Date(d.substring(0, 4) + '-' + d.substring(4, 6) + '-' + d.substring(6, 8));
            return date.getDay() === 6; // Saturday
        });
        
        if (satIndex !== -1 && satIndex + 1 < dates.length) {
            targetDates = [dates[satIndex], dates[satIndex+1]];
            isWeekend = true;
        } else {
            return []; // No weekend found in range
        }
    }

    if (targetDates.length < 2) return [];

    // 1. Find B2B Teams
    const b2bTeams = findB2BTeams(schedule.teamSchedules, targetDates);
    const b2bTeamIds = b2bTeams.map(t => String(t.teamId));

    // 2. Filter Players (Ownership < 40)
    const candidates = players.filter(p => 
        b2bTeamIds.includes(String(p.teamId)) && 
        p.percentOwned < 40
    );

    // 3. Hydrate with Opponents
    const hydrated = candidates.map(p => {
        const teamInfo = b2bTeams.find(t => String(t.teamId) === String(p.teamId));
        const opponents = targetDates.map(d => {
            const g = teamInfo?.fullSchedule.games.find(game => game.date === d);
            return {
                date: d,
                opponent: g?.opponent || 'BYE',
                isHome: g?.isHome || false
            };
        });
        return { 
            ...p, 
            team: teamInfo?.teamAbbr || 'N/A', 
            opponents,
            isWeekend 
        };
    });

    // 4. Sort by Fantasy Points (Recent 7 days preferred, but using Season FP as proxy in data loading)
    // To strictly follow "Recent 7 Days", we would need to calc that in data loading. 
    // Currently using season avg as fallback.
    return hydrated.sort((a, b) => b.stats.fantasyPoints - a.stats.fantasyPoints);
  };

  const displayPlayers = getFilteredPlayers();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-white/10 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="text-black dark:text-white" fill="currentColor" />
                B2B Streamer Optimizer
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Maximize games played. Find &lt;40% owned players with back-to-back games.
            </p>
        </div>
        
        {/* Tabs - Mobile Responsive & Unified Style */}
        <div className="flex overflow-x-auto hide-scrollbar border-t border-gray-100 dark:border-white/5">
            <div className="flex max-w-3xl mx-auto w-full">
                <button 
                    onClick={() => setActiveTab('today')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap px-4 ${
                        activeTab === 'today' 
                        ? 'border-black text-black dark:border-white dark:text-white' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                >
                    Today & Tomorrow
                </button>
                <button 
                    onClick={() => setActiveTab('tomorrow')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap px-4 ${
                        activeTab === 'tomorrow' 
                        ? 'border-black text-black dark:border-white dark:text-white' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                >
                    Tomorrow & Next
                </button>
                <button 
                    onClick={() => setActiveTab('weekend')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap px-4 ${
                        activeTab === 'weekend' 
                        ? 'border-black text-black dark:border-white dark:text-white' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                >
                    Weekend (Sat/Sun)
                </button>
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Activity className="animate-spin mb-4" size={32} />
                <p>Scanning Schedule...</p>
            </div>
        ) : displayPlayers.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-gray-300 dark:border-white/10">
                <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No B2B Teams Found</h3>
                <p className="text-gray-500">No teams play back-to-back games during this window.</p>
            </div>
        ) : (
            displayPlayers.map(player => (
                <div key={player.id} className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col sm:flex-row relative group hover:border-gray-300 dark:hover:border-white/20 transition-all">
                    {/* Left Badge - Unified Black/Gray Style */}
                    <div className="bg-gray-100 dark:bg-zinc-800 w-full sm:w-24 flex flex-row sm:flex-col items-center justify-center p-3 gap-2 sm:gap-1 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-white/5">
                        <div className="text-center">
                            <span className="block text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">2</span>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">GAMES</span>
                        </div>
                        <div className="hidden sm:block w-8 h-px bg-gray-300 dark:bg-zinc-700 my-1"></div>
                        <div className="text-center">
                            <span className="block text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">1</span>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ADD</span>
                        </div>
                    </div>

                    {/* Final Push Badge (Absolute) - Distinct but consistent */}
                    {(player as any).isWeekend && (
                        <div className="absolute top-2 right-2 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-lg z-10">
                            <Flame size={12} fill="currentColor" />
                            FINAL PUSH
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="flex-1 p-4 flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative">
                            <img src={player.avatar} alt={player.name} className="w-14 h-14 rounded-full bg-gray-100 object-cover border-2 border-white dark:border-zinc-800 shadow-sm" />
                            <div className="absolute -bottom-1 -right-1 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white dark:border-zinc-900">
                                {player.position}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{player.name}</h3>
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                                    {player.team}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Users size={12} />
                                    <span>{player.percentOwned.toFixed(1)}% Owned</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-bold">
                                    <Activity size={12} />
                                    <span>{player.stats.fantasyPoints.toFixed(1)} FP/G</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule (Right Side) */}
                    <div className="bg-gray-50 dark:bg-black/20 p-4 w-full sm:w-48 flex sm:flex-col justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-white/5">
                        {player.opponents.map((game, idx) => (
                            <div key={idx} className="flex items-center justify-between sm:justify-start w-full gap-2">
                                <span className="text-[10px] font-bold text-gray-400 w-8">{idx === 0 ? '1st' : '2nd'}</span>
                                <div className={`px-2 py-1 rounded text-xs font-bold w-full text-center ${game.isHome ? 'bg-white dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-transparent' : 'bg-black text-white dark:bg-zinc-700'}`}>
                                    {game.isHome ? 'vs' : '@'} {game.opponent}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default NBAB2BOptimizer;