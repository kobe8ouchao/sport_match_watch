import React, { useState, useEffect } from 'react';
import { 
  fetchNFLScheduleForWeeks, 
  fetchNFLDefenseRankings, 
  getDifficultyColor,
  NFLTeamSchedule,
  fetchNFLTeams
} from '../services/nflFantasyService';
import { 
  Calendar, AlertTriangle, TrendingUp, 
  Info, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

// --- Types ---
type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'DST' | 'K';
type TimeRange = 'Next 5' | 'ROS' | 'Playoffs';

interface AlertItem {
  type: 'sleeper' | 'regression';
  player: string;
  team: string;
  position: Position;
  reason: string;
}

// --- Component ---
const NFLScheduleDifficulty: React.FC = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState<NFLTeamSchedule[]>([]);
  const [defenseRanks, setDefenseRanks] = useState<Record<string, Record<string, number>>>({});
  
  const [selectedPosition, setSelectedPosition] = useState<Position>('WR');
  const [timeRange, setTimeRange] = useState<TimeRange>('Next 5');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightTeamId, setHighlightTeamId] = useState<string | null>(null);

  // Constants
  const CURRENT_WEEK = 10; // TODO: Fetch dynamically or from context
  const PLAYOFF_WEEKS = [15, 16, 17];
  
  // Calculate target weeks based on range
  const getTargetWeeks = () => {
    if (timeRange === 'Playoffs') return PLAYOFF_WEEKS;
    if (timeRange === 'Next 5') return Array.from({ length: 5 }, (_, i) => CURRENT_WEEK + i);
    // ROS (Rest of Season) - simplify to next 8 weeks for display or up to 18
    return Array.from({ length: 18 - CURRENT_WEEK + 1 }, (_, i) => CURRENT_WEEK + i);
  };

  const targetWeeks = getTargetWeeks();

  // Load Data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1. Fetch Defense Rankings (DvP)
        const ranks = await fetchNFLDefenseRankings();
        setDefenseRanks(ranks);

        // 2. Fetch Schedule
        // Fetch enough weeks to cover max range (e.g. up to 18)
        const sched = await fetchNFLScheduleForWeeks(CURRENT_WEEK, 18);
        setScheduleData(sched);
      } catch (e) {
        console.error("Failed to load SOS data", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter & Sort Data
  const filteredData = scheduleData
    .filter(team => {
      if (!searchQuery) return true;
      return team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) || 
             team.teamAbbrev.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .map(team => {
      // Enrich games with difficulty for selected position
      const enrichedGames = team.games
        .filter(g => targetWeeks.includes(g.week))
        .map(g => {
          const opponentId = g.opponentId;
          const rank = defenseRanks[opponentId]?.[selectedPosition] || 16; // Default to mid
          return {
            ...g,
            difficultyRank: rank,
            sosColor: getDifficultyColor(rank)
          };
        });
        
      // Calculate Avg Difficulty
      const avgRank = enrichedGames.reduce((sum, g) => sum + g.difficultyRank, 0) / (enrichedGames.length || 1);
      
      return {
        ...team,
        games: enrichedGames,
        avgRank
      };
    })
    .sort((a, b) => b.avgRank - a.avgRank); 

  // Alerts Generation (Mock Logic for Demo)
  const alerts: AlertItem[] = [
    { type: 'sleeper', player: 'J. Smith-Njigba', team: 'SEA', position: 'WR', reason: 'Faces 3 Bottom-5 Defenses' },
    { type: 'regression', player: 'D. Adams', team: 'LV', position: 'WR', reason: 'Faces Top-3 Secondary next 2 weeks' },
  ];

  // Render Helpers
  const renderCell = (game: any) => {
    if (!game) return <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded m-1" />;
    return (
      <div 
        key={game.week}
        className="group relative flex flex-col items-center justify-center w-12 h-12 m-1 rounded cursor-pointer transition-transform hover:scale-105 border border-black/5 dark:border-white/5"
        style={{ backgroundColor: game.sosColor }}
        title={`Week ${game.week} vs ${game.opponentAbbrev} (Rank ${game.difficultyRank})`}
      >
        <span className="text-[10px] font-bold text-black/80">{game.opponentAbbrev}</span>
        <span className="text-[8px] font-bold text-black/60">@{game.isHome ? 'H' : 'A'}</span>
        
        {/* Hover Tooltip */}
        <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-xl border border-gray-700">
           <div className="font-bold border-b border-gray-700 pb-1 mb-1">Week {game.week} vs {game.opponentName}</div>
           <div className="grid grid-cols-2 gap-1">
             <span className="text-gray-400">DvP Rank:</span>
             <span className={game.difficultyRank <= 5 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>
               #{game.difficultyRank}
             </span>
             <span className="text-gray-400">Avg Pts Allowed:</span>
             <span>24.5 (Est)</span>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 md:pb-8">
      
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  <Calendar className="text-green-600" size={32} />
                  NFL Schedule Difficulty
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Analyze Strength of Schedule (SOS) to find Start/Sit & Trade targets.
                </p>
            </div>
            
            {/* Search */}
            <div className="relative w-full md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
               <input 
                 type="text" 
                 placeholder="Search Team..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 placeholder-gray-500 dark:placeholder-gray-400"
               />
            </div>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap gap-8">
            {/* Position Selector */}
            <div>
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Position</label>
                 <div className="flex flex-wrap gap-2">
                  {(['QB', 'RB', 'WR', 'TE', 'DST', 'K'] as Position[]).map(pos => (
                    <button
                      key={pos}
                      onClick={() => setSelectedPosition(pos)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        selectedPosition === pos 
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-md scale-105' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
            </div>

            {/* Time Range */}
             <div>
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Time Range</label>
                 <div className="flex flex-wrap gap-2">
                  {(['Next 5', 'ROS', 'Playoffs'] as TimeRange[]).map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        timeRange === range 
                        ? 'bg-green-600 text-white shadow-md scale-105' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
            </div>
        </div>
      </div>

      {/* Legend / Info */}
      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-sm">
        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Info size={16} />
            Understanding the Matrix
        </h4>
        <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded bg-[#2ECC71]"></div>
                 <span className="text-gray-700 dark:text-gray-300">Top Matchup (Rank 28-32)</span>
            </div>
            <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded bg-[#ABEBC6]"></div>
                 <span className="text-gray-700 dark:text-gray-300">Good (20-27)</span>
            </div>
            <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded bg-[#F7F9F9] border border-gray-400"></div>
                 <span className="text-gray-700 dark:text-gray-300">Neutral (13-19)</span>
            </div>
            <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded bg-[#FAD7A0]"></div>
                 <span className="text-gray-700 dark:text-gray-300">Tough (6-12)</span>
            </div>
            <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded bg-[#E74C3C]"></div>
                 <span className="text-gray-700 dark:text-gray-300">Nightmare (1-5)</span>
            </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {alerts.map((alert, idx) => (
           <div key={idx} className={`p-4 rounded-xl border-l-4 ${
             alert.type === 'sleeper' 
               ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
               : 'bg-red-50 dark:bg-red-900/20 border-red-500'
           } flex items-start gap-3 shadow-sm`}>
              <div className={`p-2 rounded-full ${
                alert.type === 'sleeper' 
                  ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {alert.type === 'sleeper' ? <TrendingUp size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div>
                 <div className="flex items-center gap-2 mb-1">
                   <span className="font-bold text-gray-900 dark:text-white">{alert.type === 'sleeper' ? 'Sleeper Alert' : 'Regression Warning'}</span>
                   <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold">{alert.position}</span>
                 </div>
                 <div className="text-sm text-gray-600 dark:text-gray-300">
                   <span className="font-bold text-gray-900 dark:text-white">{alert.player} ({alert.team})</span>: {alert.reason}
                 </div>
              </div>
           </div>
         ))}
      </div>

      {/* Heatmap Matrix Card */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                   <th className="p-3 sticky left-0 bg-gray-50 dark:bg-gray-800 z-20 font-bold text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Team</th>
                   <th className="p-3 font-bold text-sm text-gray-500 dark:text-gray-400 text-center align-middle">SOS Rank</th>
                   {targetWeeks.map(w => (
                     <th key={w} className="p-2  text-xs font-bold text-gray-500 dark:text-gray-400 align-middle">W{w}</th>
                   ))}
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                 {filteredData.map((team, idx) => (
                   <tr 
                     key={team.teamId} 
                     className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                       highlightTeamId === team.teamId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                     }`}
                     onClick={() => setHighlightTeamId(team.teamId)}
                   >
                     {/* Team Column - Sticky */}
                     <td className="p-3 sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-3 min-w-[140px]">
                            <span className="text-gray-400 text-xs w-4">#{idx + 1}</span>
                            <img src={team.logo} alt={team.teamAbbrev} className="w-8 h-8 object-contain" />
                            <div>
                              <div className="font-bold text-sm text-gray-900 dark:text-white">{team.teamAbbrev}</div>
                              <div className="text-[10px] text-gray-500 hidden md:block">{team.teamName}</div>
                            </div>
                        </div>
                     </td>
                     
                     {/* Rank Summary */}
                     <td className="p-3 text-center">
                        <div className={`text-lg font-black ${
                          team.avgRank >= 20 ? 'text-green-500' : team.avgRank <= 12 ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                          {Math.round(team.avgRank)}
                        </div>
                        <div className="text-[10px] text-gray-400">Avg Diff</div>
                     </td>

                     {/* Weekly Cells */}
                     {targetWeeks.map(week => {
                       const game = team.games.find(g => g.week === week);
                       return (
                         <td key={week} className="p-1 text-center">
                           {game ? renderCell(game) : (
                               <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800/50 rounded m-1 flex items-center justify-center text-[10px] text-gray-400 border border-gray-200 dark:border-gray-700">
                                   BYE
                               </div>
                           )}
                         </td>
                       );
                     })}
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default NFLScheduleDifficulty;
