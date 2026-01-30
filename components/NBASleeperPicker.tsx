import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchGlobalFantasyPlayers, fetchScheduleForDateRange } from '../services/fantasyService';

interface PlayerData {
  id: string;
  name: string;
  team: string;
  teamId: string;
  position: string;
  avatar: string;
  percentOwned: number;
  seasonStats: Stats9Cat;
  last3Games: Stats9Cat;
  nextWeekGames: number;
  surgeScore: number;
  meetsCriteria: boolean;
}

interface Stats9Cat {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tpm: number;
  fg_pct: number;
  ft_pct: number;
  to: number;
  min: number;
}

// Stat ID Mapping based on dev.md and standard ESPN Fantasy
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
  MIN: 40 // Using 40 for minutes based on observation
};

const NBASleeperPicker: React.FC = () => {
  // SEO Meta Tags
  useEffect(() => {
    document.title = "NBA Sleeper Picker - Fantasy Basketball Waiver Wire Tool | SportsLive";
    
    const setMeta = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('name', name);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    setMeta('description', 'Find the best NBA Fantasy sleeper picks and waiver wire gems. Filter players by ownership percentage and identify minutes surges.');
    setMeta('keywords', 'NBA Sleeper Picker, Fantasy Basketball Waiver Wire, NBA Free Agents, Fantasy Basketball Sleepers, Minutes Surge Tool');
  }, []);

  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [ownershipLimit, setOwnershipLimit] = useState(40);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [totalToAnalyze, setTotalToAnalyze] = useState(0);

  // Helper to extract stats from the raw map
  const extractStats = (statsMap: Record<string, number>): Stats9Cat => {
    return {
      pts: statsMap[STAT_MAP.PTS] || 0,
      reb: statsMap[STAT_MAP.REB] || 0,
      ast: statsMap[STAT_MAP.AST] || 0,
      stl: statsMap[STAT_MAP.STL] || 0,
      blk: statsMap[STAT_MAP.BLK] || 0,
      tpm: statsMap[STAT_MAP.TPM] || 0,
      fg_pct: statsMap[STAT_MAP.FG_PCT] || 0,
      ft_pct: statsMap[STAT_MAP.FT_PCT] || 0,
      to: statsMap[STAT_MAP.TO] || 0,
      min: statsMap[STAT_MAP.MIN] || 0,
    };
  };

  const loadData = async () => {
    setLoading(true);
    setPlayers([]);
    setAnalyzedCount(0);
    setTotalToAnalyze(0);

    try {
      // 1. Schedule Logic
      const today = new Date();
      const dayOfWeek = today.getDay(); 
      const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const nextMondayStr = nextMonday.toISOString().split('T')[0].replace(/-/g, '');
      
      const teamScheduleMap = await fetchScheduleForDateRange(nextMondayStr, 7);

      // 2. Fetch Players with League Defaults Endpoint
      const filter = {
        players: {
          limit: 1500, // Fetch a large pool
          sortPercOwned: { sortPriority: 1, sortAsc: false },
          filterSlotIds: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }
        }
      };

      const rawPlayers = await fetchGlobalFantasyPlayers(filter);
      
      // 3. Filter & Process
      // Filter by Ownership first
      const candidates = rawPlayers.filter((p: any) => p.player.ownership?.percentOwned < ownershipLimit);
      setTotalToAnalyze(candidates.length);

      const processedPlayers: PlayerData[] = [];
      
      // Process in chunks to avoid blocking UI too much, though local processing is fast
      const chunk = 50;
      for (let i = 0; i < candidates.length; i += chunk) {
        const batch = candidates.slice(i, i + chunk);
        
        const processedBatch = batch.map((p: any) => {
            const playerId = p.id;
            const name = p.player.fullName;
            const teamId = p.player.proTeamId; 
            const positionId = p.player.defaultPositionId;
            const percentOwned = p.player.ownership?.percentOwned || 0;

            const posMap: Record<number, string> = { 1: 'PG', 2: 'SG', 3: 'SF', 4: 'PF', 5: 'C' };
            const position = posMap[positionId] || 'Util';

            const teamInfo = teamScheduleMap[teamId] || { count: 0, abbrev: "N/A" };
            const nextWeekGames = teamInfo.count;
            const teamAbbrev = teamInfo.abbrev !== "N/A" ? teamInfo.abbrev : "FA";

            // Stats Processing
            const statsArray = p.player.stats || [];
            
            // Season Stats (id "002026")
            const seasonStatEntry = statsArray.find((s: any) => s.id === "002026") || statsArray[0];
            const seasonStatsRaw = seasonStatEntry?.averageStats || seasonStatEntry?.stats || {};
            const seasonStats = extractStats(seasonStatsRaw);

            // Game Log Stats (statSplitTypeId: 5)
            // Filter for Season 2026 and Type 5
            const gameLogs = statsArray.filter((s: any) => s.statSplitTypeId === 5 && s.seasonId === 2026);
            
            // Sort by date (scoringPeriodId is usually a good proxy, higher is later)
            // Or externalId if it contains date info, but scoringPeriodId is safer
            gameLogs.sort((a: any, b: any) => b.scoringPeriodId - a.scoringPeriodId);

            const last3Logs = gameLogs.slice(0, 3);
            
            // Calculate Last 3 Averages
            const last3Stats: Stats9Cat = {
                pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tpm: 0, fg_pct: 0, ft_pct: 0, to: 0, min: 0
            };
            
            if (last3Logs.length > 0) {
                let totalFGM = 0, totalFGA = 0, totalFTM = 0, totalFTA = 0;

                last3Logs.forEach((log: any) => {
                    const s = log.stats;
                    last3Stats.pts += (s[STAT_MAP.PTS] || 0);
                    last3Stats.reb += (s[STAT_MAP.REB] || 0);
                    last3Stats.ast += (s[STAT_MAP.AST] || 0);
                    last3Stats.stl += (s[STAT_MAP.STL] || 0);
                    last3Stats.blk += (s[STAT_MAP.BLK] || 0);
                    last3Stats.tpm += (s[STAT_MAP.TPM] || 0);
                    last3Stats.to += (s[STAT_MAP.TO] || 0);
                    last3Stats.min += (s[STAT_MAP.MIN] || 0);
                    
                    totalFGM += (s[STAT_MAP.FGM] || 0);
                    totalFGA += (s[STAT_MAP.FGA] || 0);
                    totalFTM += (s[STAT_MAP.FTM] || 0);
                    totalFTA += (s[STAT_MAP.FTA] || 0);
                });

                const count = last3Logs.length;
                last3Stats.pts /= count;
                last3Stats.reb /= count;
                last3Stats.ast /= count;
                last3Stats.stl /= count;
                last3Stats.blk /= count;
                last3Stats.tpm /= count;
                last3Stats.to /= count;
                last3Stats.min /= count;
                
                last3Stats.fg_pct = totalFGA > 0 ? totalFGM / totalFGA : 0;
                last3Stats.ft_pct = totalFTA > 0 ? totalFTM / totalFTA : 0;
            } else {
                // Fallback if no game logs found in this endpoint
                // We could just use season stats or zeros
                // For now, zeros, so they won't likely meet criteria
            }

            // Surge Criteria
            // 1. Minutes Surge: Last 3 Min > Season Min + 5 (User's original favorite)
            // 2. Production Surge: Significant improvement in key cats
            
            const minSurge = last3Stats.min > (seasonStats.min + 5);
            
            // Simple Surge Score: Count how many categories are > 10% better than season avg
            let surgeCount = 0;
            if (last3Stats.pts > seasonStats.pts * 1.15) surgeCount++;
            if (last3Stats.reb > seasonStats.reb * 1.15) surgeCount++;
            if (last3Stats.ast > seasonStats.ast * 1.15) surgeCount++;
            if (last3Stats.stl > seasonStats.stl * 1.15) surgeCount++;
            if (last3Stats.blk > seasonStats.blk * 1.15) surgeCount++;
            if (last3Stats.tpm > seasonStats.tpm * 1.15) surgeCount++;
            
            // Criteria: Must have Minutes Surge OR (Minutes Stable and High Production Surge)
            // User asked for "Algorithm based on 9 cats and recent 3 games surge"
            // Let's be permissive but sort by "Surge Score"
            
            // Let's filter out players who barely play
            const meaningful = last3Stats.min > 15;
            
            // Final Filter
            const meets = meaningful && (minSurge || surgeCount >= 2);

            return {
                id: playerId,
                name: name,
                team: teamAbbrev,
                teamId: teamId,
                position: position,
                avatar: `https://a.espncdn.com/i/headshots/nba/players/full/${playerId}.png`,
                percentOwned: percentOwned,
                seasonStats,
                last3Games: last3Stats,
                nextWeekGames,
                surgeScore: surgeCount + (minSurge ? 2 : 0),
                meetsCriteria: meets
            };
        });

        processedPlayers.push(...processedBatch.filter((p: any) => p.meetsCriteria));
        setAnalyzedCount(prev => prev + batch.length);
        
        // Small delay to allow UI update if needed, but pure JS is fast enough here
        await new Promise(r => setTimeout(r, 0));
      }

      // Sort by Surge Score desc
      processedPlayers.sort((a, b) => b.surgeScore - a.surgeScore);

      setPlayers(processedPlayers);
    } catch (e) {
      console.error("Error loading sleeper data", e);
    } finally {
      setLoading(false);
    }
  };

  const displayedPlayers = selectedPosition === 'All' 
    ? players 
    : players.filter(p => p.position === selectedPosition);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
        <span>🏀</span> NBA Sleeper Picker
      </h1>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
            <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Ownership: <span className="text-black font-bold">{ownershipLimit}%</span>
                </label>
                <span className="text-xs text-gray-500">Found: {displayedPlayers.length} players</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={ownershipLimit} 
                onChange={(e) => setOwnershipLimit(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black dark:bg-gray-700"
            />
            </div>

            <div className="w-full md:w-32">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position</label>
                 <select 
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                 >
                    <option value="All">All</option>
                    <option value="PG">PG</option>
                    <option value="SG">SG</option>
                    <option value="SF">SF</option>
                    <option value="PF">PF</option>
                    <option value="C">C</option>
                 </select>
            </div>

            <button 
                onClick={loadData}
                disabled={loading}
                className="w-full md:w-auto bg-black hover:bg-gray-800 text-white font-bold py-2 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 h-10"
            >
                {loading ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Scanning...
                </>
                ) : (
                'Find Sleepers'
                )}
            </button>
        </div>
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md text-xs text-gray-800 dark:text-gray-200">
            <strong>Filtering Logic (Surge Score):</strong> Players must have &gt;15 min/game recently AND either (1) Last 3 games minutes &gt; Season Avg + 5 (Minutes Surge) OR (2) at least 2 categories &gt; 15% better than Season Avg.
            <br/>
            <strong>Table Legend:</strong> <span className="font-bold">Bold Value</span> = Last 3 Games Avg, <span className="text-gray-500">(Value)</span> = Season Avg.
        </div>
      </div>

      {/* Results Table */}
      {displayedPlayers.length > 0 ? (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">Player</th>
                <th className="px-2 py-3 text-center">Owned</th>
                <th className="px-2 py-3 text-center">Next Wk</th>
                <th className="px-2 py-3 text-center bg-gray-100 dark:bg-gray-700/50" title="Minutes">MIN</th>
                <th className="px-2 py-3 text-center" title="Points">PTS</th>
                <th className="px-2 py-3 text-center" title="Rebounds">REB</th>
                <th className="px-2 py-3 text-center" title="Assists">AST</th>
                <th className="px-2 py-3 text-center" title="Steals">STL</th>
                <th className="px-2 py-3 text-center" title="Blocks">BLK</th>
                <th className="px-2 py-3 text-center" title="3-Pointers Made">3PM</th>
                <th className="px-2 py-3 text-center" title="Field Goal %">FG%</th>
                <th className="px-2 py-3 text-center" title="Free Throw %">FT%</th>
                <th className="px-2 py-3 text-center" title="Turnovers (Lower is better)">TO</th>
              </tr>
            </thead>
            <tbody>
              {displayedPlayers.map((p) => {
                  const isSurge = (cat: keyof Stats9Cat) => p.last3Games[cat] > p.seasonStats[cat] * 1.1;
                  return (
                    <tr key={p.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-4 py-3 sticky left-0 bg-white dark:bg-gray-800 z-10 min-w-[150px]">
                        <Link to={`/game-tools/fantasy-nba/player/${p.id}`} className="flex items-center gap-3 group">
                        <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full bg-gray-100 object-cover border border-gray-200 group-hover:ring-2 ring-blue-500 transition-all" />
                        <div>
                        <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[120px] group-hover:text-blue-500 transition-colors" title={p.name}>{p.name}</div>
                        <div className="text-[10px] text-gray-500">{p.position} - {p.team}</div>
                        </div>
                        </Link>
                    </td>
                    <td className="px-2 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${p.percentOwned < 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {p.percentOwned.toFixed(1)}%
                        </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                        <span className={`font-bold ${p.nextWeekGames >= 4 ? 'text-green-600' : 'text-gray-600'}`}>
                        {p.nextWeekGames}
                        </span>
                    </td>
                    
                    {/* Stats Columns: Display Last 3 (Season) */}
                    <td className="px-2 py-3 text-center bg-gray-100 dark:bg-gray-700 border-l border-r border-gray-200 dark:border-gray-600">
                        <div className={`font-bold ${isSurge('min') ? 'text-green-600' : ''}`}>{p.last3Games.min.toFixed(1)}</div>
                        <div className="text-[10px] text-gray-400">({p.seasonStats.min.toFixed(1)})</div>
                    </td>

                    {['pts', 'reb', 'ast', 'stl', 'blk', 'tpm'].map((cat) => (
                        <td key={cat} className="px-2 py-3 text-center">
                            <div className={`font-bold ${isSurge(cat as keyof Stats9Cat) ? 'text-green-600' : ''}`}>
                                {p.last3Games[cat as keyof Stats9Cat].toFixed(1)}
                            </div>
                            <div className="text-[10px] text-gray-400">
                                ({p.seasonStats[cat as keyof Stats9Cat].toFixed(1)})
                            </div>
                        </td>
                    ))}

                    <td className="px-2 py-3 text-center">
                        <div className={p.last3Games.fg_pct > p.seasonStats.fg_pct ? 'text-green-600 font-bold' : ''}>{(p.last3Games.fg_pct * 100).toFixed(1)}%</div>
                        <div className="text-[10px] text-gray-400">({(p.seasonStats.fg_pct * 100).toFixed(1)}%)</div>
                    </td>
                    <td className="px-2 py-3 text-center">
                        <div className={p.last3Games.ft_pct > p.seasonStats.ft_pct ? 'text-green-600 font-bold' : ''}>{(p.last3Games.ft_pct * 100).toFixed(1)}%</div>
                        <div className="text-[10px] text-gray-400">({(p.seasonStats.ft_pct * 100).toFixed(1)}%)</div>
                    </td>
                    <td className="px-2 py-3 text-center">
                        <div className={p.last3Games.to < p.seasonStats.to ? 'text-green-600 font-bold' : ''}>{p.last3Games.to.toFixed(1)}</div>
                        <div className="text-[10px] text-gray-400">({p.seasonStats.to.toFixed(1)})</div>
                    </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
            {loading ? 'Scanning player pool...' : 'No sleepers found. Try increasing the ownership limit.'}
        </div>
      )}
    </div>
  );
};

export default NBASleeperPicker;
