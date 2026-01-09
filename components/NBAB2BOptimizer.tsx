import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Activity, 
  Flame,
  Zap,
  Filter,
  Info
} from 'lucide-react';
import { fetchWeeklySchedule, fetchGlobalFantasyPlayers, TeamScheduleInfo } from '../services/fantasyService';

// Stat ID Mapping
const STAT_MAP: Record<string, number> = {
  PTS: 0,
  BLK: 1,
  STL: 2,
  AST: 3,
  REB: 6,
  TO: 11,
  FGM: 13,
  FGA: 14,
  FTM: 15,
  FTA: 16,
  TPM: 17,
  FG_PCT: 19,
  FT_PCT: 20,
  MIN: 40
};

interface Player {
  id: string;
  name: string;
  team: string;
  teamId: string;
  position: string;
  avatar: string;
  percentOwned: number;
  injuryStatus: string;
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
    fantasyPoints: number; // Season Avg
  };
  last5Games: {
    pts: number;
    reb: number;
    ast: number;
    min: number;
    fantasyPoints: number;
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
  const [selectedPosition, setSelectedPosition] = useState('All');
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
                limit: 1500,
                sortPercOwned: { sortPriority: 1, sortAsc: false },
                filterSlotIds: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
                filterStatsForTopScoringPeriodIds: { value: 5 } // Get recent games/stats
            }
        };
        const rawPlayers = await fetchGlobalFantasyPlayers(filter);
        
        // Process Players
        const processed = rawPlayers.map((p: any) => {
            const statsArray = p.player.stats || [];
            
            // Season Stats (id "002026")
            const seasonStatEntry = statsArray.find((x: any) => x.id === "002026") || statsArray[0];
            const s = seasonStatEntry?.averageStats || {};
            
            // Simple Fantasy Points Estimate (Season)
            const fpSeason = (s.points || 0) * 1 + (s.rebounds || 0) * 1.2 + (s.assists || 0) * 1.5 + (s.steals || 0) * 3 + (s.blocks || 0) * 3 - (s.turnovers || 0) * 1;

            // Last 5 Games Stats
            const gameLogs = statsArray.filter((x: any) => x.statSplitTypeId === 5 && x.seasonId === 2026);
            gameLogs.sort((a: any, b: any) => b.scoringPeriodId - a.scoringPeriodId);
            const last5Logs = gameLogs.slice(0, 5);

            const last5Stats = { pts: 0, reb: 0, ast: 0, min: 0, fantasyPoints: 0 };
            
            if (last5Logs.length > 0) {
                let totalPts = 0, totalReb = 0, totalAst = 0, totalMin = 0, totalFP = 0;
                last5Logs.forEach((log: any) => {
                    const ls = log.stats;
                    const pts = ls[STAT_MAP.PTS] || 0;
                    const reb = ls[STAT_MAP.REB] || 0;
                    const ast = ls[STAT_MAP.AST] || 0;
                    const stl = ls[STAT_MAP.STL] || 0;
                    const blk = ls[STAT_MAP.BLK] || 0;
                    const tov = ls[STAT_MAP.TO] || 0;
                    const min = ls[STAT_MAP.MIN] || 0;

                    totalPts += pts;
                    totalReb += reb;
                    totalAst += ast;
                    totalMin += min;
                    totalFP += (pts * 1 + reb * 1.2 + ast * 1.5 + stl * 3 + blk * 3 - tov * 1);
                });
                const count = last5Logs.length;
                last5Stats.pts = totalPts / count;
                last5Stats.reb = totalReb / count;
                last5Stats.ast = totalAst / count;
                last5Stats.min = totalMin / count;
                last5Stats.fantasyPoints = totalFP / count;
            } else {
                // Fallback to season stats if no logs
                last5Stats.pts = s.points || 0;
                last5Stats.reb = s.rebounds || 0;
                last5Stats.ast = s.assists || 0;
                last5Stats.min = s.minutes || 0;
                last5Stats.fantasyPoints = fpSeason;
            }

            const posMap: Record<number, string> = { 1: 'PG', 2: 'SG', 3: 'SF', 4: 'PF', 5: 'C' };
            const position = posMap[p.player.defaultPositionId] || 'Util';

            return {
                id: p.id,
                name: p.player.fullName,
                teamId: p.player.proTeamId,
                team: "N/A", // Will map from schedule
                position: position,
                avatar: `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${p.id}.png&w=350&h=254`,
                percentOwned: p.player.ownership?.percentOwned || 0,
                injuryStatus: p.player.injuryStatus,
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
                    min: s.minutes || 0,
                    fantasyPoints: fpSeason
                },
                last5Games: last5Stats,
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

    // 2. Filter Players (Ownership < 40 + Not Injured + Position)
    const candidates = players.filter(p => 
        b2bTeamIds.includes(String(p.teamId)) && 
        p.percentOwned < 40 &&
        p.injuryStatus !== 'OUT' && // Filter out injured
        (selectedPosition === 'All' || p.position === selectedPosition)
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

    // 4. Sort by Recent Fantasy Points
    return hydrated.sort((a, b) => b.last5Games.fantasyPoints - a.last5Games.fantasyPoints);
  };

  const displayPlayers = getFilteredPlayers();

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="text-black dark:text-white" fill="currentColor" />
                B2B Streamer Optimizer
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-start gap-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>
                    Shows players (less 40% owned) with <strong>Back-to-Back games</strong> in the next 7 days. 
                    Stats based on <strong>Last 5 Games</strong> average.
                </span>
            </p>
            
            {/* Position Filter */}
            <div className="mt-4 flex items-center gap-2 overflow-x-auto hide-scrollbar">
                <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Position:</span>
                {['All', 'PG', 'SG', 'SF', 'PF', 'C'].map(pos => (
                    <button
                        key={pos}
                        onClick={() => setSelectedPosition(pos)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                            selectedPosition === pos
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-400'
                        }`}
                    >
                        {pos}
                    </button>
                ))}
            </div>
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
                <p>Scanning Schedule & Stats...</p>
            </div>
        ) : displayPlayers.length === 0 ? (
            <div className="text-center py-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg border border-dashed border-gray-300 dark:border-white/10">
                <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No B2B Streamers Found</h3>
                <p className="text-gray-500">No active players match the criteria for this window.</p>
            </div>
        ) : (
            displayPlayers.map(player => (
                <div key={player.id} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col sm:flex-row relative group hover:border-gray-300 dark:hover:border-white/20 transition-all">
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

                    {/* Final Push Badge (Absolute) */}
                    {(player as any).isWeekend && (
                        <div className="absolute top-2 right-2 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-lg z-10">
                            <Flame size={12} fill="currentColor" />
                            FINAL PUSH
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="flex-1 p-4 flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative shrink-0">
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
                            
                            {/* Stats Rows: Last 5 & Season */}
                            <div className="mt-3 flex flex-col gap-1.5">
                                {/* Ownership Line */}
                                <div className="flex items-center gap-1 text-xs text-gray-500" title="Ownership">
                                    <Users size={12} />
                                    <span>{player.percentOwned.toFixed(1)}% Owned</span>
                                </div>

                                {/* Last 5 Games Row */}
                                <div className="flex items-center text-xs gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 w-8 uppercase tracking-wider">Last 5</span>
                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded border border-gray-100 dark:border-white/5">
                                        <span className="font-bold text-gray-900 dark:text-white" title="Minutes">{player.last5Games.min.toFixed(1)} <span className="text-[9px] text-gray-400 font-normal">MIN</span></span>
                                        <span className="w-px h-3 bg-gray-200 dark:bg-white/10"></span>
                                        <span className="font-bold text-gray-900 dark:text-white" title="Points">{player.last5Games.pts.toFixed(1)} <span className="text-[9px] text-gray-400 font-normal">PTS</span></span>
                                        <span className="font-bold text-gray-900 dark:text-white" title="Rebounds">{player.last5Games.reb.toFixed(1)} <span className="text-[9px] text-gray-400 font-normal">REB</span></span>
                                        <span className="font-bold text-gray-900 dark:text-white" title="Assists">{player.last5Games.ast.toFixed(1)} <span className="text-[9px] text-gray-400 font-normal">AST</span></span>
                                    </div>
                                </div>

                                {/* Season Stats Row */}
                                <div className="flex items-center text-xs gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 w-8 uppercase tracking-wider">Season</span>
                                    <div className="flex items-center gap-3 px-2 py-1">
                                        <span className="font-medium text-gray-600 dark:text-gray-400" title="Minutes">{player.stats.min.toFixed(1)} <span className="text-[9px] text-gray-400 font-normal">MIN</span></span>
                                        <span className="w-px h-3 bg-gray-200 dark:bg-white/10"></span>
                                        <span className="font-medium text-gray-600 dark:text-gray-400" title="Points">{player.stats.pts.toFixed(1)} <span className="text-[9px] text-gray-400 font-normal">PTS</span></span>
                                        <span className="font-medium text-gray-600 dark:text-gray-400" title="Rebounds">{player.stats.reb.toFixed(1)} <span className="text-[9px] text-gray-400 font-normal">REB</span></span>
                                        <span className="font-medium text-gray-600 dark:text-gray-400" title="Assists">{player.stats.ast.toFixed(1)} <span className="text-[9px] text-gray-400 font-normal">AST</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule (Right Side) */}
                    <div className="bg-gray-50/50 dark:bg-black/20 p-4 w-full sm:w-48 flex sm:flex-col justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-white/5">
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
