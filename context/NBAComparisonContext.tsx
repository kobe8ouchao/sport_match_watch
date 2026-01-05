import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// --- Types ---

export interface PlayerStats {
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

export interface PlayerProfile {
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
    status: { type: { name: string } };
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
        '3PM': 'threePointPct', // Note: API often uses different keys, checked in main fetch
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
        let bestReason = "";
        let maxImpact = 0;

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
                    
                    const usageScore = pts + ast + tov;
                    
                    if (usageScore > maxImpact) {
                        maxImpact = usageScore;
                        bestReason = `${teammate.displayName} is OUT (Usage: ${usageScore.toFixed(1)})`;
                    }
                } else {
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

        // 3. Fetch Game Log
        let gameLog: any[] = [];
        try {
            const gamelogRes = await fetch(`/api/espn/common/sports/basketball/nba/athletes/${playerId}/gamelog`);
            const gamelogData = await gamelogRes.json();
            const seasonType = gamelogData.seasonTypes?.find((st: any) => st.displayName?.includes("Regular Season") || st.name === "Regular Season" || st.id === "2");
            if (seasonType?.categories) {
                gameLog = seasonType.categories.flatMap((c: any) => c.events || []);
            }
        } catch (e) {
            console.error("Game Log Fetch Error:", e);
            const rawGameLog = statsData.gameLog?.events || statsData.gameLog || statsData.athlete?.recentGames;
            gameLog = Array.isArray(rawGameLog) ? rawGameLog : [];
        }

        // Parse Season Stats
        const statsRoot = statsData.statistics;
        const statNames = statsRoot?.names || [];
        const statValues = statsRoot?.splits?.find((s: any) => s.displayName === "Regular Season")?.stats || [];
        
        const getStat = (name: string) => {
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

        const calcLast5Avg = (statName: string, seasonAvg: number) => {
            if (gameLog.length === 0) return seasonAvg;
            
            const indexMap: Record<string, number> = {
                'MIN': 0, 'FG': 1, 'FG%': 2, '3PM': 3, '3P%': 4,
                'FT': 5, 'FT%': 6, 'REB': 7, 'AST': 8, 'BLK': 9,
                'STL': 10, 'PF': 11, 'TO': 12, 'PTS': 13
            };

            const values = gameLog.slice(0, 5).map((g: any) => {
                if (Array.isArray(g.stats) && typeof g.stats[0] === 'string') {
                    const idx = indexMap[statName];
                    if (idx !== undefined && g.stats[idx]) {
                         return parseFloat(g.stats[idx]);
                    }
                    return 0;
                }
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
        const last3 = last5Minutes.slice(0, 3);
        const last3Avg = last3.length > 0 ? last3.reduce((a: number, b: number) => a + b, 0) / last3.length : mpg;
        
        let trend: 'Rising' | 'Falling' | 'Stable' = 'Stable';
        if (mpg > 0) {
            const diff = (last5Avg - mpg) / mpg;
            if (diff > 0.15) trend = 'Rising';
            else if (diff < -0.15) trend = 'Falling';
        }

        const breakout = last3Avg > (mpg + 5);

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

// --- Context ---

interface NBAComparisonContextType {
  players: PlayerProfile[];
  loading: boolean;
  addPlayer: (id: string) => Promise<void>;
  removePlayer: (id: string) => void;
  clearPlayers: () => void;
  refreshPlayers: () => Promise<void>;
  setPlayers: (players: PlayerProfile[]) => void;
}

const NBAComparisonContext = createContext<NBAComparisonContextType | undefined>(undefined);

export const useNBAComparison = () => {
  const context = useContext(NBAComparisonContext);
  if (!context) {
    throw new Error('useNBAComparison must be used within a NBAComparisonProvider');
  }
  return context;
};

export const NBAComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const addPlayer = useCallback(async (id: string) => {
    // Check if already exists
    if (players.some(p => p.id === id)) return;

    setLoading(true);
    const player = await fetchPlayerById(id);
    if (player) {
      setPlayers(prev => [...prev, player]);
    }
    setLoading(false);
  }, [players]);

  const removePlayer = useCallback((id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearPlayers = useCallback(() => {
    setPlayers([]);
  }, []);

  const refreshPlayers = useCallback(async () => {
    if (players.length === 0) return;
    setLoading(true);
    
    // Re-fetch all current players
    const updatedPlayers: PlayerProfile[] = [];
    for (const p of players) {
        try {
            const freshData = await fetchPlayerById(p.id);
            if (freshData) {
                updatedPlayers.push(freshData);
            } else {
                updatedPlayers.push(p); // Keep old data if fetch fails
            }
        } catch (e) {
            console.error(`Failed to refresh player ${p.name}`, e);
            updatedPlayers.push(p);
        }
    }
    
    setPlayers(updatedPlayers);
    setLoading(false);
  }, [players]);

  return (
    <NBAComparisonContext.Provider value={{ players, loading, addPlayer, removePlayer, clearPlayers, refreshPlayers, setPlayers }}>
      {children}
    </NBAComparisonContext.Provider>
  );
};
