import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, TrendingUp, AlertTriangle, Flame, Activity, 
  ChevronLeft, Share2, Info, X, Plus, Trash2, Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis 
} from 'recharts';

// --- Types ---

interface PlayerStats {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tpm: number; // 3PM
  fg_pct: number;
  ft_pct: number;
  tov: number;
  mpg: number; // Minutes Per Game (Season)
  ppm: number; // Points Per Minute
  usage_est: number; // Estimated Usage Score (PTS + AST + TOV)
}

interface PlayerProfile {
  id: string;
  name: string;
  team: string;
  teamId?: string;
  position: string;
  avatar: string;
  status: 'Active' | 'GTD' | 'OUT' | 'Probable';
  seasonStats: PlayerStats;
  last5Games: PlayerStats & {
    minutes: number[]; // Trend for last 5 games
  };
  evaluation: {
    trend: 'Rising' | 'Falling' | 'Stable';
    breakout: boolean;
    opportunity: boolean;
    opportunityReason?: string;
  };
}

interface RosterPlayer {
    id: string;
    displayName: string;
    position: { abbreviation: string };
    status: { type: { name: string } }; // "Active", "Injured" etc
    statistics?: {
        season?: { stats?: { name: string; value: number }[] }
    };
}

// --- Helper Functions ---

const fetchTeamRoster = async (teamId: string): Promise<RosterPlayer[]> => {
    try {
        const res = await fetch(`/api/espn/web-site/sports/basketball/nba/teams/${teamId}/roster`);
        const data = await res.json();
        return data.athletes || [];
    } catch (e) {
        console.error("Fetch Roster Error:", e);
        return [];
    }
};

const getStatValue = (names: string[], values: string[], name: string) => {
    const nameMap: Record<string, string> = {
        'PTS': 'avgPoints',
        'REB': 'avgRebounds',
        'AST': 'avgAssists',
        'STL': 'avgSteals',
        'BLK': 'avgBlocks',
        '3PM': 'threePointPct',
        'FG%': 'fieldGoalPct',
        'FT%': 'freeThrowPct',
        'TO': 'avgTurnovers',
        'MPG': 'avgMinutes',
        'GP': 'gamesPlayed'
    };
    
    const apiName = nameMap[name] || name;
    const idx = names.indexOf(apiName);
    if (idx === -1) return 0;
    return parseFloat(values[idx]);
};

const checkOpportunity = async (teamId: string, myPos: string, myId: string): Promise<{ hasOpp: boolean; reason?: string }> => {
    if (!teamId) return { hasOpp: false };
    
    const roster = await fetchTeamRoster(teamId);
    
    // Find players who are OUT and play similar position
    const injuredTeammates = roster.filter(p => 
        p.id !== myId && 
        p.status?.type?.name !== 'Active' && 
        (p.position?.abbreviation === myPos || 
         (myPos.includes('F') && p.position?.abbreviation?.includes('F')) ||
         (myPos.includes('G') && p.position?.abbreviation?.includes('G')))
    );

    if (injuredTeammates.length > 0) {
        // Check usage/impact of the injured player
        let bestReason = "";
        let maxImpact = 0;

        // Check top 3 injured candidates
        for (const teammate of injuredTeammates.slice(0, 3)) {
            try {
                const statsRes = await fetch(`/api/espn/common/sports/basketball/nba/athletes/${teammate.id}/overview`);
                const statsData = await statsRes.json();
                const statsRoot = statsData.statistics;
                const statNames = statsRoot?.names || [];
                const statValues = statsRoot?.splits?.find((s: any) => s.displayName === "Regular Season")?.stats || [];
                
                if (statNames.length > 0) {
                    const pts = getStatValue(statNames, statValues, 'PTS');
                    const ast = getStatValue(statNames, statValues, 'AST');
                    const tov = getStatValue(statNames, statValues, 'TO');
                    
                    // Est. Usage Score: PTS + AST + TOV
                    const usageScore = pts + ast + tov;
                    
                    if (usageScore > maxImpact) {
                        maxImpact = usageScore;
                        bestReason = `${teammate.displayName} is OUT (Usage: ${usageScore.toFixed(1)})`;
                    }
                } else {
                    // Fallback if no stats (e.g. rookie/no data)
                    if (maxImpact === 0) bestReason = `${teammate.displayName} is OUT`;
                }
            } catch (e) {
                if (maxImpact === 0) bestReason = `${teammate.displayName} is OUT`;
            }
        }

        if (maxImpact > 20) {
             return { hasOpp: true, reason: `High Usage: ${bestReason}` };
        }
        
        return { hasOpp: true, reason: bestReason };
    }
    
    return { hasOpp: false };
};


// --- Helper Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    'Active': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'GTD': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'OUT': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Probable': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[status as keyof typeof colors] || colors.Active}`}>
      {status}
    </span>
  );
};

const TrendSparkline = ({ data, className = "" }: { data: number[], className?: string }) => {
  const chartData = data.map((val, idx) => ({ i: idx, val }));
  return (
    <div className={`h-full w-full min-h-[32px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey="val" 
            stroke="#0d9488" 
            strokeWidth={2} 
            dot={{ r: 2, fill: "#0d9488" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const fetchPlayerById = async (playerId: string): Promise<PlayerProfile | null> => {
    try {
        // 1. Fetch Player Profile
        const profileRes = await fetch(`/api/espn/common/sports/basketball/nba/athletes/${playerId}`);
        const profileData = await profileRes.json();
        const athlete = profileData.athlete;

        if (!athlete) return null;

        // 2. Fetch Stats
        const statsRes = await fetch(`/api/espn/common/sports/basketball/nba/athletes/${playerId}/overview`);
        const statsData = await statsRes.json();

        // 3. Fetch Game Log (for accurate Last 5)
        let gameLog: any[] = [];
        try {
            const gamelogRes = await fetch(`/api/espn/common/sports/basketball/nba/athletes/${playerId}/gamelog`);
            const gamelogData = await gamelogRes.json();
            const seasonType = gamelogData.seasonTypes?.find((st: any) => st.displayName?.includes("Regular Season") || st.name === "Regular Season" || st.id === "2");
            if (seasonType?.categories) {
                // Flatten events from all months (categories)
                gameLog = seasonType.categories.flatMap((c: any) => c.events || []);
            }
        } catch (e) {
            console.error("Game Log Fetch Error:", e);
            // Fallback to overview data if gamelog fetch fails
            const rawGameLog = statsData.gameLog?.events || statsData.gameLog || statsData.athlete?.recentGames;
            gameLog = Array.isArray(rawGameLog) ? rawGameLog : [];
        }

        // Parse Season Stats
        const statsRoot = statsData.statistics;
        const statNames = statsRoot?.names || [];
        const statValues = statsRoot?.splits?.find((s: any) => s.displayName === "Regular Season")?.stats || [];
        
        const getStat = (name: string) => {
            // Map internal names to API names
            // Note: 'avg...' names are common in overview API, but test_espn.js suggests full names like 'points' or combined 'Made-Attempted'
            const nameMap: Record<string, string[]> = {
                'PTS': ['avgPoints', 'points', 'PTS'],
                'REB': ['avgRebounds', 'totalRebounds', 'REB'],
                'AST': ['avgAssists', 'assists', 'AST'],
                'STL': ['avgSteals', 'steals', 'STL'],
                'BLK': ['avgBlocks', 'blocks', 'BLK'],
                '3PM': ['avgThreePointFieldGoalsMade', 'threePointFieldGoalsMade-threePointFieldGoalsAttempted', '3PT', '3PM'],
                'FG%': ['fieldGoalPct', 'FG%'],
                'FT%': ['freeThrowPct', 'FT%'],
                'TO': ['avgTurnovers', 'turnovers', 'TO'],
                'MPG': ['avgMinutes', 'minutes', 'MIN'],
                'GP': ['gamesPlayed', 'GP']
            };
            
            const possibleNames = nameMap[name] || [name];
            let idx = -1;
            
            for (const apiName of possibleNames) {
                idx = statNames.indexOf(apiName);
                if (idx !== -1) break;
            }

            if (idx === -1) return 0;
            
            const val = statValues[idx];
            // Handle "Made-Attempted" format (e.g. "1.4-4.5")
            if (typeof val === 'string' && val.includes('-') && !name.includes('%')) {
                return parseFloat(val.split('-')[0]);
            }
            return parseFloat(val);
        };

        const pts = getStat('PTS');
        const reb = getStat('REB');
        const ast = getStat('AST');
        const stl = getStat('STL');
        const blk = getStat('BLK');
        const tpm = getStat('3PM') || getStat('3PTM');
        const fg_pct = getStat('FG%');
        const ft_pct = getStat('FT%');
        const tov = getStat('TO');
        const mpg = getStat('MPG');

        // Helper to get last 5 average for any stat
        const calcLast5Avg = (statName: string, seasonAvg: number) => {
            if (gameLog.length === 0) return seasonAvg;
            
            // Map stat names to indices for the array-based game log format
            const indexMap: Record<string, number> = {
                'MIN': 0,
                'FG': 1,
                'FG%': 2,
                '3PM': 3,
                '3P%': 4,
                'FT': 5,
                'FT%': 6,
                'REB': 7,
                'AST': 8,
                'BLK': 9,
                'STL': 10,
                'PF': 11,
                'TO': 12,
                'PTS': 13
            };

            const values = gameLog.slice(0, 5).map((g: any) => {
                // Handle array of strings format (from gamelog API)
                if (Array.isArray(g.stats) && typeof g.stats[0] === 'string') {
                    const idx = indexMap[statName];
                    if (idx !== undefined && g.stats[idx]) {
                         // For "M-A" strings (FG, 3PT, FT), parseFloat extracts the first number (Made)
                         return parseFloat(g.stats[idx]);
                    }
                    return 0;
                }

                // Handle array of objects format (fallback)
                const s = g.stats?.find((x: any) => x.name === statName || x.abbreviation === statName);
                return s ? parseFloat(s.value) : 0;
            });
            return values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : seasonAvg;
        };

        const last5Minutes = gameLog.slice(0, 5).map((g: any) => {
             if (Array.isArray(g.stats) && typeof g.stats[0] === 'string') {
                 return parseFloat(g.stats[0]);
             }
             const minStat = g.stats?.find((s: any) => s.name === 'MIN');
             return minStat ? parseFloat(minStat.value) : 0;
        });

        const last5Stats: PlayerStats = {
            pts: calcLast5Avg('PTS', pts),
            reb: calcLast5Avg('REB', reb),
            ast: calcLast5Avg('AST', ast),
            stl: calcLast5Avg('STL', stl),
            blk: calcLast5Avg('BLK', blk),
            tpm: calcLast5Avg('3PM', tpm),
            fg_pct: calcLast5Avg('FG%', fg_pct),
            ft_pct: calcLast5Avg('FT%', ft_pct),
            tov: calcLast5Avg('TO', tov),
            mpg: calcLast5Avg('MIN', mpg),
            ppm: 0,
            usage_est: 0
        };
        last5Stats.ppm = last5Stats.mpg > 0 ? last5Stats.pts / last5Stats.mpg : 0;
        last5Stats.usage_est = parseFloat((last5Stats.pts + last5Stats.ast + last5Stats.tov).toFixed(1));
        
        const last5Avg = last5Stats.mpg;

        // --- Advanced Evaluation ---
        const last3 = last5Minutes.slice(0, 3);
        const last3Avg = last3.length > 0 ? last3.reduce((a: number, b: number) => a + b, 0) / last3.length : mpg;
        
        // Trend: Last 5 vs Season (Diff > 15%)
        let trend: 'Rising' | 'Falling' | 'Stable' = 'Stable';
        if (mpg > 0) {
            const diff = (last5Avg - mpg) / mpg;
            if (diff > 0.15) trend = 'Rising';
            else if (diff < -0.15) trend = 'Falling';
        }

        // Breakout: Last 3 MPG > Season MPG + 5
        const breakout = last3Avg > (mpg + 5);

        // Opportunity: Check Roster
        let opportunity = false;
        let opportunityReason = '';
        if (athlete.team?.id) {
             const oppCheck = await checkOpportunity(athlete.team.id, athlete.position?.abbreviation || '', playerId);
             opportunity = oppCheck.hasOpp;
             opportunityReason = oppCheck.reason || '';
        }

        return {
            id: playerId,
            name: athlete.displayName,
            team: athlete.team?.displayName || 'FA',
            teamId: athlete.team?.id,
            position: athlete.position?.abbreviation || 'N/A',
            avatar: athlete.headshot?.href || `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${playerId}.png&w=350&h=254`,
            status: athlete.injuries?.length > 0 ? (athlete.injuries[0].status === 'Questionable' ? 'GTD' : 'OUT') : 'Active',
            seasonStats: {
                pts, reb, ast, stl, blk, tpm, fg_pct, ft_pct, tov, mpg,
                ppm: mpg > 0 ? pts / mpg : 0,
                usage_est: parseFloat((pts + ast + tov).toFixed(1))
            },
            last5Games: {
                ...last5Stats,
                minutes: last5Minutes.reverse()
            },
            evaluation: {
                trend,
                breakout,
                opportunity,
                opportunityReason
            }
        };
    } catch (e) {
        console.error("ESPN API Error:", e);
        return null;
    }
};

// --- Helper Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- Main Component ---

const NBAPlayerCompare: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Sync from URL on mount
  useEffect(() => {
    const loadPlayers = async () => {
        const ids: string[] = [];
        
        // Support p1, p2, ... p5 params
        for (let i = 1; i <= 5; i++) {
            const id = searchParams.get(`p${i}`);
            if (id) ids.push(id);
        }

        // Support 'players' param (comma separated)
        const playersParam = searchParams.get('players');
        if (playersParam) {
            ids.push(...playersParam.split(','));
        }

        // Deduplicate
        const uniqueIds = Array.from(new Set(ids));
        
        if (uniqueIds.length === 0) {
            // Default players if none specified
            uniqueIds.push('1966'); // LeBron
            uniqueIds.push('6450'); // Kawhi
        }

        if (uniqueIds.length > 0) {
            setLoading(true);
            const loadedPlayers: PlayerProfile[] = [];
            for (const id of uniqueIds) {
                // Check if already loaded to avoid refetch? 
                // For simplicity, just fetch. In real app, we might want to check current state.
                const p = await fetchPlayerById(id);
                if (p) loadedPlayers.push(p);
            }
            setPlayers(loadedPlayers);
            setLoading(false);
        }
    };
    
    // Only load if players state is empty (initial load) to avoid overwriting on every URL change if we sync back
    if (players.length === 0) {
        loadPlayers();
    }
  }, []); // Run once on mount

  // Sync to URL when players change
  useEffect(() => {
    if (players.length > 0) {
        const params: Record<string, string> = {};
        players.forEach((p, idx) => {
            params[`p${idx + 1}`] = p.id;
        });
        setSearchParams(params, { replace: true });
        
        const names = players.map(p => p.name).join(' vs ');
        document.title = `Compare ${names} - NBA Stats | Sport Match Watch`;
    } else {
        document.title = 'NBA Player Comparison Tool - Sport Match Watch';
    }
  }, [players, setSearchParams]);

  // Fetch Suggestions
  useEffect(() => {
    const fetchSuggestions = async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/espn/common/search?region=us&lang=en&contentonly=true&plugin=isex&limit=5&mode=prefix&type=player&sport=basketball&league=nba&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            const items = data.items || data.results?.[0]?.contents || [];
            setSuggestions(items);
        } catch (e) {
            console.error("Autocomplete Error:", e);
        } finally {
            setIsSearching(false);
        }
    };

    if (debouncedQuery) {
        fetchSuggestions(debouncedQuery);
    } else {
        setSuggestions([]);
        setIsSearching(false);
    }
  }, [debouncedQuery]);

  const handleAddPlayer = async (playerItem: any) => {
    setSearchQuery('');
    setSuggestions([]);
    setIsSearchOpen(false);
    setLoading(true);

    // Check if already added
    if (players.some(p => p.id === playerItem.id)) {
        setLoading(false);
        alert("Player already added!");
        return;
    }

    const player = await fetchPlayerById(playerItem.id);
    setLoading(false);

    if (player) {
        setPlayers(prev => [...prev, player]);
    } else {
        alert("Could not load player data.");
    }
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  // --- Render Helpers ---

  const renderStatRow = (label: string, key: keyof PlayerStats, inverse: boolean = false) => {
     // Find best value
     let bestVal = -Infinity;
     let worstVal = Infinity;
     
     players.forEach(p => {
         const val = p.seasonStats[key];
         if (val > bestVal) bestVal = val;
         if (val < worstVal) worstVal = val;
     });

     // For inverse stats (TOV), best is lowest
     const targetVal = inverse ? worstVal : bestVal;

     return (
        <tr className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
            <td className="py-4 px-4 text-left">
                <span className="font-bold text-gray-500 text-sm uppercase tracking-wide">{label}</span>
            </td>
            {players.map(p => {
                const val = p.seasonStats[key];
                const isBest = val === targetVal;
                
                // Hot Streak Logic
                const last5Val = p.last5Games[key];
                const isHot = !inverse && p.seasonStats[key] > 0 && ((last5Val - p.seasonStats[key]) / p.seasonStats[key] > 0.25);

                return (
                    <td key={p.id} className={`py-4 px-4 text-center relative ${isBest ? 'bg-green-50/30 dark:bg-green-900/10' : ''}`}>
                        <div className="flex flex-col items-center">
                            <span className={`text-lg font-bold ${isBest ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                {key.includes('pct') ? `${val.toFixed(1)}%` : val}
                            </span>
                            <span className="text-xs text-gray-400 font-medium mt-0.5">
                                L5: <span className={isHot ? 'text-amber-500 font-bold' : ''}>
                                    {key.includes('pct') ? `${last5Val.toFixed(1)}%` : last5Val}
                                </span>
                            </span>
                        </div>
                        {isHot && (
                             <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" title="Hot Streak!"></span>
                        )}
                    </td>
                );
            })}
        </tr>
     );
  };

  return (
    <div className="relative py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Player Comparison</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Compare stats, trends, and projections for up to 5 players</p>
          </div>
          <button 
             onClick={() => {
                 setPlayers([]);
                 setSearchParams({});
             }}
             className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
          >
              <Trash2 size={16} /> Clear All
          </button>
      </div>

      {loading && (
          <div className="fixed inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl flex flex-col items-center animate-pulse border border-gray-100 dark:border-white/10">
                  <Activity className="w-10 h-10 text-teal-500 mb-3" />
                  <span className="font-bold text-gray-900 dark:text-white">Scouting Players...</span>
              </div>
          </div>
      )}

      {/* Players Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {players.map(p => (
              <div key={p.id} className="relative bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm group hover:border-teal-500/30 transition-all">
                  <button 
                      onClick={() => handleRemovePlayer(p.id)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                      <X size={16} />
                  </button>
                  
                  <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                          <img 
                              src={p.avatar} 
                              alt={p.name} 
                              className="w-16 h-16 rounded-full object-cover bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-md"
                          />
                          <div className="absolute -bottom-1 -right-1">
                             <StatusBadge status={p.status} />
                          </div>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-1">{p.name}</h3>
                      <div className="text-xs text-gray-500 mb-2">{p.team} • {p.position}</div>
                      
                      {/* Mini Badges */}
                      <div className="flex flex-wrap justify-center gap-1">
                          {p.evaluation.trend === 'Rising' && <TrendingUp size={14} className="text-green-500" />}
                          {p.evaluation.trend === 'Falling' && <TrendingUp size={14} className="text-red-500 rotate-180" />}
                          {p.evaluation.breakout && <Flame size={14} className="text-purple-500" />}
                          {p.evaluation.opportunity && <Activity size={14} className="text-amber-500" />}
                      </div>
                  </div>
              </div>
          ))}

          {/* Add Player Button */}
          {players.length < 5 && (
              <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="flex flex-col items-center justify-center min-h-[160px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 hover:text-teal-600 hover:border-teal-500 hover:bg-teal-50/10 transition-all group"
              >
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 transition-colors">
                      <Plus size={24} />
                  </div>
                  <span className="font-medium text-sm">Add Player</span>
              </button>
          )}
      </div>

      {/* Search Overlay/Modal */}
      {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
              <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-3">
                      <Search className="text-gray-400" size={20} />
                      <input 
                          autoFocus
                          type="text"
                          placeholder="Search NBA player..."
                          className="flex-1 bg-transparent outline-none text-lg text-gray-900 dark:text-white placeholder:text-gray-400"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <button onClick={() => setIsSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                      {isSearching ? (
                          <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                              <Loader2 className="w-6 h-6 animate-spin mb-2 text-teal-500" />
                              <span className="text-sm">Searching...</span>
                          </div>
                      ) : (
                          <>
                              {suggestions.map((item) => (
                                  <button
                                      key={item.id}
                                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 border-b border-gray-50 dark:border-white/5 last:border-0"
                                      onClick={() => handleAddPlayer(item)}
                                  >
                                      <img 
                                          src={item.headshot?.href || (item.id ? `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${item.id}.png&w=350&h=254` : 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/0.png&w=350&h=254')}
                                          alt={item.displayName}
                                          className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                                          onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.onerror = null; // Prevent loop
                                              target.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/0.png&w=350&h=254';
                                          }}
                                      />
                                      <div>
                                          <div className="font-bold text-gray-900 dark:text-white">{item.displayName}</div>
                                          <div className="text-xs text-gray-500">{item.team?.displayName || 'NBA'}</div>
                                      </div>
                                  </button>
                              ))}
                              {searchQuery && suggestions.length === 0 && !isSearching && (
                                  <div className="p-8 text-center text-gray-400">No players found</div>
                              )}
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Comparison Content */}
      {players.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Projections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {players.map((p, idx) => (
                      <div key={p.id} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Projected Pts</div>
                          <div className="flex items-baseline gap-1 mb-4">
                              <span className="text-3xl font-black text-gray-900 dark:text-white">
                                  {(p.seasonStats.ppm * p.last5Games.mpg).toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">pts</span>
                          </div>
                          
                          <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">PPM</span>
                                  <span className="font-bold text-teal-600 dark:text-teal-400">{p.seasonStats.ppm.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">L5 Mins</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{p.last5Games.mpg}</span>
                              </div>
                          </div>

                          {p.evaluation.opportunity && (
                              <div className="mt-3 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-2 rounded-lg font-medium">
                                  {p.evaluation.opportunityReason || 'Opportunity detected'}
                              </div>
                          )}
                      </div>
                  ))}
              </div>

              {/* Comparison Table */}
              <div className="bg-white dark:bg-white/5 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
                  <div className="overflow-x-auto">
                      <table className="w-full">
                          <thead>
                              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                  <th className="py-4 px-4 text-left w-32 font-bold text-gray-400 text-xs uppercase">Stat</th>
                                  {players.map(p => (
                                      <th key={p.id} className="py-4 px-4 text-center min-w-[120px]">
                                          <div className="flex flex-col items-center gap-2">
                                              <img src={p.avatar} className="w-8 h-8 rounded-full bg-gray-100" alt="" />
                                              <span className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</span>
                                          </div>
                                      </th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody>
                              {renderStatRow('Points', 'pts')}
                              {renderStatRow('Rebounds', 'reb')}
                              {renderStatRow('Assists', 'ast')}
                              {renderStatRow('Steals', 'stl')}
                              {renderStatRow('Blocks', 'blk')}
                              {renderStatRow('3PM', 'tpm')}
                              {renderStatRow('FG %', 'fg_pct')}
                              {renderStatRow('FT %', 'ft_pct')}
                              {renderStatRow('Turnovers', 'tov', true)}
                              {renderStatRow('Usage (Est)', 'usage_est')}
                              
                              {/* Minutes Trend Row */}
                              <tr className="bg-gray-50/50 dark:bg-white/[0.02]">
                                  <td className="py-4 px-4 font-bold text-gray-500 text-sm uppercase">Mins Trend</td>
                                  {players.map(p => (
                                      <td key={p.id} className="py-4 px-4">
                                          <div className="h-10 w-full max-w-[120px] mx-auto">
                                              <TrendSparkline data={p.last5Games.minutes} />
                                          </div>
                                      </td>
                                  ))}
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default NBAPlayerCompare;
