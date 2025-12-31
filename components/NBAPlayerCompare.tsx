import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, TrendingUp, AlertTriangle, Flame, Activity, 
  ChevronLeft, Share2, Info, X
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
  
  const [query1, setQuery1] = useState('');
  const [query2, setQuery2] = useState('');
  
  // Suggestions State
  const [suggestions1, setSuggestions1] = useState<any[]>([]);
  const [suggestions2, setSuggestions2] = useState<any[]>([]);
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [showSuggestions2, setShowSuggestions2] = useState(false);

  const debouncedQuery1 = useDebounce(query1, 300);
  const debouncedQuery2 = useDebounce(query2, 300);
  
  const [player1, setPlayer1] = useState<PlayerProfile | null>(null);
  const [player2, setPlayer2] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Cache all players for search
  const [allPlayers, setAllPlayers] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllPlayers = async () => {
        try {
            // Fetch all teams, try to include roster if supported by API
            const res = await fetch('/api/espn/web-site/sports/basketball/nba/teams?limit=30&enable=roster');
            const data = await res.json();
            const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
            
            const promises = teams.map(async (t: any) => {
                // If athletes are included in the teams response, use them
                if (t.team.athletes) {
                    return t.team.athletes;
                }
                // Otherwise fetch roster individually
                return fetchTeamRoster(t.team.id);
            });
            
            const rosters = await Promise.all(promises);
            
            const flatPlayers = rosters.flat();
            setAllPlayers(flatPlayers);
        } catch (e) {
            console.error("Failed to load all players:", e);
        }
    };
    fetchAllPlayers();
  }, []);

  // Fetch Suggestions
  useEffect(() => {
    const fetchSuggestions = async (query: string, setSuggestions: any) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            const res = await fetch(`/api/espn/common/search?region=us&lang=en&contentonly=true&plugin=isex&limit=5&mode=prefix&type=player&sport=basketball&league=nba&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            const items = data.items || data.results?.[0]?.contents || [];
            setSuggestions(items);
        } catch (e) {
            console.error("Autocomplete Error:", e);
        }
    };

    if (debouncedQuery1) fetchSuggestions(debouncedQuery1, setSuggestions1);
  }, [debouncedQuery1]);

  useEffect(() => {
    const fetchSuggestions = async (query: string, setSuggestions: any) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            const res = await fetch(`/api/espn/common/search?region=us&lang=en&contentonly=true&plugin=isex&limit=5&mode=prefix&type=player&sport=basketball&league=nba&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            const items = data.items || data.results?.[0]?.contents || [];
            setSuggestions(items);
        } catch (e) {
            console.error("Autocomplete Error:", e);
        }
    };

    if (debouncedQuery2) fetchSuggestions(debouncedQuery2, setSuggestions2);
  }, [debouncedQuery2]);

  // Sync from URL on mount
  useEffect(() => {
    const loadPlayers = async () => {
        // Default to LeBron (1966) vs Kawhi (6450)
        const p1Id = searchParams.get('p1') || '1966';
        const p2Id = searchParams.get('p2') || '6450';
        
        setLoading(true);

        if (p1Id && (!player1 || player1.id !== p1Id)) {
            const p1 = await fetchPlayerById(p1Id);
            if (p1) setPlayer1(p1);
        }
        if (p2Id && (!player2 || player2.id !== p2Id)) {
            const p2 = await fetchPlayerById(p2Id);
            if (p2) setPlayer2(p2);
        }
        setLoading(false);
    };
    loadPlayers();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update Page Title for SEO
  useEffect(() => {
    if (player1 && player2) {
      document.title = `Compare ${player1.name} vs ${player2.name} - NBA Stats Comparison | Sport Match Watch`;
    } else {
      document.title = 'NBA Player Comparison Tool - Compare Stats & Trends | Sport Match Watch';
    }
  }, [player1, player2]);

  // Sync to URL when players change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (player1) params.p1 = player1.id;
    if (player2) params.p2 = player2.id;
    setSearchParams(params, { replace: true });
  }, [player1, player2, setSearchParams]);

  const handleSelectSuggestion = async (
    playerItem: any, 
    idx: number, 
    setPlayer: (p: PlayerProfile) => void,
    setQuery: (q: string) => void,
    setShowSuggestions: (s: boolean) => void
  ) => {
    setQuery(playerItem.displayName);
    setShowSuggestions(false);
    setLoading(true);
    
    // Use ID directly to fetch player, skipping search
    const player = await fetchPlayerById(playerItem.id);
    setLoading(false);
    
    if (player) {
      setPlayer(player);
    } else {
      alert(`Could not load stats for ${playerItem.displayName}`);
    }
  };

  const handleSearch = async (query: string, setPlayer: (p: PlayerProfile) => void) => {
    if (!query) return;
    setLoading(true);
    
    // Check local cache first
    const localMatch = allPlayers.find(p => p.displayName.toLowerCase() === query.toLowerCase());
    if (localMatch) {
         const player = await fetchPlayerById(localMatch.id);
         setLoading(false);
         if (player) setPlayer(player);
         else alert(`Could not load stats for ${query}`);
         return;
    }

    // Fallback to API search
    try {
        const searchUrl = `/api/espn/common/search?region=us&lang=en&contentonly=true&plugin=isex&limit=5&mode=prefix&type=player&sport=basketball&league=nba&query=${encodeURIComponent(query)}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        const playerItem = searchData.items?.[0] || searchData.results?.[0]?.contents?.[0];
        
        if (playerItem) {
            const player = await fetchPlayerById(playerItem.id);
            setLoading(false);
            if (player) setPlayer(player);
            else alert(`Could not load stats for ${query}`);
        } else {
            setLoading(false);
            alert(`Player "${query}" not found.`);
        }
    } catch (e) {
        console.error("Search Error:", e);
        setLoading(false);
        alert("Search failed.");
    }
  };

  const renderComparisonRow = (label: string, key: keyof PlayerStats, inverse: boolean = false) => {
    if (!player1 || !player2) return null;
    const val1 = player1.seasonStats[key];
    const val2 = player2.seasonStats[key];
    
    const last5Val1 = player1.last5Games[key];
    const last5Val2 = player2.last5Games[key];

    // Check for hot streak (Last 5 > Season Avg * 1.2 or something significant)
    // User said "obviously higher" - let's use 20% or absolute value for small numbers
    const isHot = (val: number, avg: number) => {
        if (avg === 0) return val > 0;
        return (val - avg) / avg > 0.25; // 25% increase
    };
    
    const hot1 = isHot(last5Val1, val1);
    const hot2 = isHot(last5Val2, val2);

    let win1 = val1 > val2;
    let win2 = val2 > val1;
    
    if (inverse) { // For TOV (Turnovers), lower is better
       win1 = val1 < val2;
       win2 = val2 < val1;
    }

    const formatValue = (v: number) => {
        if (key === 'fg_pct' || key === 'ft_pct') {
            return `${v.toFixed(2)}%`;
        }
        return v;
    };

    return (
      <tr className="border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
        <td className={`py-3 px-4 text-center relative`}>
          <div className="flex flex-col items-center">
              <span className={`text-lg font-bold ${win1 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatValue(val1)}
              </span>
              <span className="text-xs text-gray-400 font-medium mt-0.5">
                  L5: <span className={hot1 ? 'text-amber-500 font-bold' : ''}>{formatValue(last5Val1)}</span>
              </span>
          </div>
          {hot1 && (
             <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" title="Hot Streak! (Last 5 > Season Avg)"></span>
          )}
        </td>
        <td className="py-3 px-4 text-center">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Season</div>
            <div className="text-sm font-black text-gray-700 dark:text-gray-300">{label}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Last 5</div>
        </td>
        <td className={`py-3 px-4 text-center relative`}>
          <div className="flex flex-col items-center">
              <span className={`text-lg font-bold ${win2 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatValue(val2)}
              </span>
              <span className="text-xs text-gray-400 font-medium mt-0.5">
                  L5: <span className={hot2 ? 'text-amber-500 font-bold' : ''}>{formatValue(last5Val2)}</span>
              </span>
          </div>
          {hot2 && (
             <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" title="Hot Streak! (Last 5 > Season Avg)"></span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="relative py-4">
      <div className="relative">
        {/* Page Title for SEO */}
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Player Comparison</h2>

        {loading && (
            <div className="absolute inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                <div className="flex flex-col items-center animate-pulse">
                    <Activity className="w-12 h-12 text-teal-500 mb-2" />
                    <span className="font-bold text-teal-600 dark:text-teal-400">Scouting Player...</span>
                </div>
            </div>
        )}

        {/* Search Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2].map((idx) => {
            const query = idx === 1 ? query1 : query2;
            const setQuery = idx === 1 ? setQuery1 : setQuery2;
            const setPlayer = idx === 1 ? setPlayer1 : setPlayer2;
            const suggestions = idx === 1 ? suggestions1 : suggestions2;
            const showSuggestions = idx === 1 ? showSuggestions1 : showSuggestions2;
            const setShowSuggestions = idx === 1 ? setShowSuggestions1 : setShowSuggestions2;

            return (
            <div key={idx} className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 relative z-10">
              <div className="relative mb-4 z-20">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={`Search Player ${idx}...`}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  value={query}
                  onChange={(e) => {
                      setQuery(e.target.value);
                      setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(query, setPlayer);
                      setShowSuggestions(false);
                    }
                  }}
                />
                
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
                
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden z-50">
                        {suggestions.map((item: any) => (
                            <button
                              key={item.id}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between group transition-colors"
                              onClick={() => handleSelectSuggestion(item, idx, setPlayer, setQuery, setShowSuggestions)}
                            >
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={item.headshot?.href || `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${item.id}.png&w=350&h=254`}
                                        alt={item.displayName}
                                        className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-700"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/0.png&w=350&h=254';
                                        }}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 dark:text-gray-100">{item.displayName}</span>
                                        <span className="text-xs text-gray-500">{item.subtitle || item.description || item.team?.displayName || 'NBA'}</span>
                                    </div>
                                </div>
                                <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                )}
              </div>

              {/* Player Card */}
              {(idx === 1 ? player1 : player2) ? (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="relative">
                     <img 
                        src={(idx === 1 ? player1 : player2)?.avatar} 
                        alt="Player" 
                        className="w-20 h-20 rounded-full object-cover bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-600 shadow-md"
                     />
                     <div className="absolute -bottom-2 -right-2">
                        <StatusBadge status={(idx === 1 ? player1 : player2)?.status || 'Active'} />
                     </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                      {(idx === 1 ? player1 : player2)?.name}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                      {(idx === 1 ? player1 : player2)?.team} • {(idx === 1 ? player1 : player2)?.position}
                    </div>
                    {/* Evaluation Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                       {(() => {
                          const p = idx === 1 ? player1 : player2;
                          if (!p) return null;
                          return (
                            <>
                              {/* Trend */}
                              {p.evaluation.trend === 'Rising' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                   <TrendingUp size={12} /> Rising
                                </span>
                              )}
                              {p.evaluation.trend === 'Falling' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                   <TrendingUp size={12} className="rotate-180" /> Falling
                                </span>
                              )}
                              
                              {/* Breakout */}
                              {p.evaluation.breakout && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 animate-pulse">
                                   <Flame size={12} fill="currentColor" /> Breakout
                                </span>
                              )}
                              
                              {/* Opportunity */}
                              {p.evaluation.opportunity && (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                     <Activity size={12} /> Opportunity
                                  </span>
                                  {p.evaluation.opportunityReason && (
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                                      {p.evaluation.opportunityReason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          );
                       })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                  Select a player to compare
                </div>
              )}
            </div>
            );
          })}
        </div>

        {player1 && player2 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Real-time Prediction Cards - Grid for 2 players */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[player1, player2].map((p, idx) => (
                  <div key={p.id} className={`p-6 rounded-3xl border ${idx === 0 ? 'bg-sky-50 border-sky-100 dark:bg-sky-900/10 dark:border-sky-900/30' : 'bg-violet-50 border-violet-100 dark:bg-violet-900/10 dark:border-violet-900/30'}`}>
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Today's Projection
                    </h4>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-black text-gray-900 dark:text-white">
                        {(p.seasonStats.ppm * p.last5Games.mpg).toFixed(1)}
                      </span>
                      <span className="text-sm font-bold text-gray-500">Est. Pts</span>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                        <span className="text-gray-500 font-medium">Season PPM</span>
                        <span className="font-black text-xl text-teal-600 dark:text-teal-400">{p.seasonStats.ppm.toFixed(2)}</span>
                      </div>
                      
                      <div className="pt-2">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-gray-500 font-medium">Usage Time (Minutes)</span>
                          </div>
                          <div className="bg-white dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                             <div className="flex justify-between items-center mb-1.5">
                                 <span className="text-xs text-gray-400">Season Avg</span>
                                 <span className="font-bold text-gray-600 dark:text-gray-300">{p.seasonStats.mpg} min</span>
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase">Last 5 Games</span>
                                 <span className="font-black text-lg text-gray-900 dark:text-white">{p.last5Games.mpg} min</span>
                             </div>
                             
                          </div>
                      </div>
                    </div>

                    {p.last5Games.mpg > p.seasonStats.mpg * 1.05 && (
                      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-600 dark:text-green-400 bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                        <TrendingUp size={14} />
                        Trending Up: Minutes +{((p.last5Games.mpg - p.seasonStats.mpg)/p.seasonStats.mpg * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* 2. Detailed Comparison Table */}
            <div className="bg-white dark:bg-white/5 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
              <div className="p-6 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-lg font-bold">Head-to-Head Stats</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 font-bold">
                      <th className="py-3 px-4 w-1/3 text-center">{player1.name}</th>
                      <th className="py-3 px-4 w-1/3 text-center">Stat</th>
                      <th className="py-3 px-4 w-1/3 text-center">{player2.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderComparisonRow('Points', 'pts')}
                    {renderComparisonRow('Rebounds', 'reb')}
                    {renderComparisonRow('Assists', 'ast')}
                    {renderComparisonRow('Steals', 'stl')}
                    {renderComparisonRow('Blocks', 'blk')}
                    {renderComparisonRow('3PM', 'tpm')}
                    {renderComparisonRow('FG %', 'fg_pct')}
                    {renderComparisonRow('FT %', 'ft_pct')}
                    {renderComparisonRow('Turnovers', 'tov', true)}
                    
                    {/* Minutes Trend Row */}
                    <tr className="border-b border-gray-100 dark:border-white/5 last:border-0 bg-teal-50/30 dark:bg-teal-900/10">
                       <td className="py-4 px-4 align-middle">
                         <div className="flex flex-col items-center gap-1">
                           <div className="h-10 w-32">
                             <TrendSparkline data={player1.last5Games.minutes} />
                           </div>
                           <span className="text-sm font-bold text-gray-700 dark:text-gray-300">L5: {player1.last5Games.mpg} min</span>
                         </div>
                       </td>
                       <td className="py-4 px-4 text-center">
                         <div className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-white dark:bg-black/20 py-1.5 px-3 rounded-full shadow-sm inline-block border border-teal-100 dark:border-teal-900/30">
                            Minutes Trend
                         </div>
                       </td>
                       <td className="py-4 px-4 align-middle">
                         <div className="flex flex-col items-center gap-1">
                           <div className="h-10 w-32">
                             <TrendSparkline data={player2.last5Games.minutes} />
                           </div>
                           <span className="text-sm font-bold text-gray-700 dark:text-gray-300">L5: {player2.last5Games.mpg} min</span>
                         </div>
                       </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-center text-sm text-gray-400 italic">
               * Data updated 10 minutes ago via NBA Official API
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default NBAPlayerCompare;
