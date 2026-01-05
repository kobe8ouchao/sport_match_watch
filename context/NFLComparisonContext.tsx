import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// --- Types ---

export interface NFLPlayerStats {
  // Passing
  pass_yds: number;
  pass_td: number;
  pass_int: number;
  pass_sacks: number;
  // Rushing
  rush_yds: number;
  rush_td: number;
  rush_carries: number;
  // Receiving
  rec_yds: number;
  rec_td: number;
  receptions: number;
  targets: number;
  // Opportunity Metrics (Advanced)
  snap_share?: number;
  target_share?: number;
  red_zone_touches?: number;
  routes_run?: number;
  // Efficiency Metrics (Advanced)
  yprr?: number;
  xfp?: number;
  air_yards?: number;
  // General
  games_played: number;
  fantasy_points: number; // Estimated PPR
}

export interface NFLPlayerProfile {
  id: string;
  name: string;
  team: string;
  teamId?: string;
  position: string;
  avatar: string;
  status: 'Active' | 'Questionable' | 'Doubtful' | 'OUT' | 'IR';
  seasonStats: NFLPlayerStats;
  last5Games: NFLPlayerStats & {
    fantasy_trend: number[]; // Trend for last 5 games fantasy points
  };
  evaluation: {
    trend: 'Rising' | 'Falling' | 'Stable';
    boom_potential: boolean; // High ceiling check
  };
}

// --- Helper Functions ---

const calculateFantasyPoints = (stats: NFLPlayerStats) => {
    let pts = 0;
    pts += stats.pass_yds * 0.04;
    pts += stats.pass_td * 4;
    pts -= stats.pass_int * 2;
    pts += stats.rush_yds * 0.1;
    pts += stats.rush_td * 6;
    pts += stats.rec_yds * 0.1;
    pts += stats.rec_td * 6;
    pts += stats.receptions * 1; // PPR
    return parseFloat(pts.toFixed(1));
};

const fetchPlayerById = async (playerId: string): Promise<NFLPlayerProfile | null> => {
    try {
        // 1. Fetch Player Profile
        const profileRes = await fetch(`/api/espn/common/sports/football/nfl/athletes/${playerId}`);
        const profileData = await profileRes.json();
        const athlete = profileData.athlete;

        if (!athlete) return null;

        // 2. Fetch Stats
        const statsRes = await fetch(`/api/espn/common/sports/football/nfl/athletes/${playerId}/overview`);
        const statsData = await statsRes.json();

        // 3. Fetch Game Log
        const gameMap = new Map<string, any>();

        try {
            const gamelogRes = await fetch(`/api/espn/common/sports/football/nfl/athletes/${playerId}/gamelog`);
            const gamelogData = await gamelogRes.json();
            const seasonType = gamelogData.seasonTypes?.find((st: any) => st.displayName?.includes("Regular Season") || st.name === "Regular Season" || st.id === "2");
            
            if (seasonType?.categories) {
                for (const cat of seasonType.categories) {
                    const headers = cat.names || cat.labels || [];
                    const events = cat.events || [];
                    const catName = (cat.name || 'general').toLowerCase();
                    
                    for (const event of events) {
                        const gameId = event.eventId;
                        if (!gameId) continue;

                        if (!gameMap.has(gameId)) {
                            gameMap.set(gameId, {
                                gameDate: event.gameDate,
                                opponent: event.opponent,
                                stats: {}
                            });
                        }
                        
                        const gameEntry = gameMap.get(gameId);
                        // event.stats is array of values matching headers
                        if (event.stats && Array.isArray(event.stats)) {
                            event.stats.forEach((val: string, idx: number) => {
                                const header = headers[idx];
                                if (header) {
                                    // Store with category prefix to avoid collisions (e.g. passingYds vs rushingYds)
                                    // Also store raw header for fallback if unique
                                    const valNum = parseFloat(val);
                                    gameEntry.stats[`${catName}_${header}`] = valNum;
                                    gameEntry.stats[header] = valNum;
                                }
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Game Log Fetch Error:", e);
        }

        // Parse Season Stats
        const statsRoot = statsData.statistics;
        const statNames = statsRoot?.names || [];
        const statValues = statsRoot?.splits?.find((s: any) => s.displayName === "Regular Season")?.stats || [];
        
        const getStat = (name: string) => {
            const nameMap: Record<string, string[]> = {
                'PASS_YDS': ['passingYards', 'passYards', 'passingYds', 'passYds', 'avgPassingYards'],
                'PASS_TD': ['passingTouchdowns', 'passTouchdowns', 'passTD', 'passingTD', 'avgPassingTouchdowns'],
                'PASS_INT': ['interceptions', 'passingInterceptions', 'ints', 'avgInterceptions'],
                'PASS_SACK': ['sacks', 'passingSacks'],
                'RUSH_YDS': ['rushingYards', 'rushYards', 'rushingYds', 'rushYds', 'avgRushingYards'],
                'RUSH_TD': ['rushingTouchdowns', 'rushTouchdowns', 'rushTD', 'rushingTD', 'avgRushingTouchdowns'],
                'RUSH_ATT': ['rushingAttempts', 'rushAttempts', 'carries'],
                'REC_YDS': ['receivingYards', 'recYards', 'receivingYds', 'recYds', 'avgReceivingYards'],
                'REC_TD': ['receivingTouchdowns', 'recTouchdowns', 'recTD', 'receivingTD', 'avgReceivingTouchdowns'],
                'REC': ['receptions', 'totalReceptions', 'rec', 'avgReceptions'],
                'REC_TGT': ['receivingTargets', 'targets', 'totalTargets'],
                'GP': ['gamesPlayed', 'totalGamesPlayed', 'GP']
            };
            
            const possibleNames = nameMap[name] || [name];
            let idx = -1;
            
            for (const apiName of possibleNames) {
                idx = statNames.indexOf(apiName);
                if (idx !== -1) break;
            }

            if (idx === -1) return 0;
            return parseFloat(statValues[idx]);
        };

        const seasonStats: NFLPlayerStats = {
            pass_yds: getStat('PASS_YDS'),
            pass_td: getStat('PASS_TD'),
            pass_int: getStat('PASS_INT'),
            pass_sacks: getStat('PASS_SACK'),
            rush_yds: getStat('RUSH_YDS'),
            rush_td: getStat('RUSH_TD'),
            rush_carries: getStat('RUSH_ATT'),
            rec_yds: getStat('REC_YDS'),
            rec_td: getStat('REC_TD'),
            receptions: getStat('REC'),
            targets: getStat('REC_TGT'),
            games_played: getStat('GP'),
            fantasy_points: 0
        };
        seasonStats.fantasy_points = calculateFantasyPoints(seasonStats);

        // Parse Last 5 Games
        // Sort by date descending
        const fullGameLog = Array.from(gameMap.values()).sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime());
        const last5GamesLog = fullGameLog.slice(0, 5);
        
        const last5Fantasy: number[] = [];

        // Helper to extract stats from game log entry
        const getGameLogStat = (gameEntry: any, statName: string) => {
             // Try variations
             const variations = {
                 'passingYards': ['passing_YDS', 'passing_passingYards', 'passingYards', 'passYards'],
                 'passingTouchdowns': ['passing_TD', 'passing_passingTouchdowns', 'passingTouchdowns', 'passTD'],
                 'interceptions': ['passing_INT', 'interceptions', 'ints'],
                 'rushingYards': ['rushing_YDS', 'rushing_rushingYards', 'rushingYards', 'rushYards'],
                 'rushingTouchdowns': ['rushing_TD', 'rushing_rushingTouchdowns', 'rushingTouchdowns', 'rushTD'],
                 'receivingYards': ['receiving_YDS', 'receiving_receivingYards', 'receivingYards', 'recYards'],
                 'receivingTouchdowns': ['receiving_TD', 'receiving_receivingTouchdowns', 'receivingTouchdowns', 'recTD'],
                 'receptions': ['receiving_REC', 'receiving_receptions', 'receptions', 'rec']
             };
             
             const possibleNames = variations[statName as keyof typeof variations] || [statName];
             for (const name of possibleNames) {
                 if (gameEntry.stats[name] !== undefined) {
                     return gameEntry.stats[name];
                 }
             }
             return 0;
        };

        const last5Agg: NFLPlayerStats = {
            pass_yds: 0, pass_td: 0, pass_int: 0, pass_sacks: 0,
            rush_yds: 0, rush_td: 0, rush_carries: 0,
            rec_yds: 0, rec_td: 0, receptions: 0, targets: 0,
            games_played: last5GamesLog.length,
            fantasy_points: 0
        };

        last5GamesLog.forEach(g => {
            const stats = {
                pass_yds: getGameLogStat(g, 'passingYards'),
                pass_td: getGameLogStat(g, 'passingTouchdowns'),
                pass_int: getGameLogStat(g, 'interceptions'),
                pass_sacks: getGameLogStat(g, 'sacks'),
                rush_yds: getGameLogStat(g, 'rushingYards'),
                rush_td: getGameLogStat(g, 'rushingTouchdowns'),
                rush_carries: getGameLogStat(g, 'rushingAttempts'),
                rec_yds: getGameLogStat(g, 'receivingYards'),
                rec_td: getGameLogStat(g, 'receivingTouchdowns'),
                receptions: getGameLogStat(g, 'receptions'),
                targets: getGameLogStat(g, 'receivingTargets'),
                games_played: 1,
                fantasy_points: 0
            };
            const fp = calculateFantasyPoints(stats);
            last5Fantasy.push(fp);

            last5Agg.pass_yds += stats.pass_yds;
            last5Agg.pass_td += stats.pass_td;
            last5Agg.pass_int += stats.pass_int;
            last5Agg.pass_sacks += stats.pass_sacks;
            last5Agg.rush_yds += stats.rush_yds;
            last5Agg.rush_td += stats.rush_td;
            last5Agg.rush_carries += stats.rush_carries;
            last5Agg.rec_yds += stats.rec_yds;
            last5Agg.rec_td += stats.rec_td;
            last5Agg.receptions += stats.receptions;
            last5Agg.targets += stats.targets;
        });

        // Average them for "Last 5"
        const div = last5Agg.games_played || 1;
        const last5Avg: NFLPlayerStats = {
            pass_yds: parseFloat((last5Agg.pass_yds / div).toFixed(1)),
            pass_td: parseFloat((last5Agg.pass_td / div).toFixed(1)),
            pass_int: parseFloat((last5Agg.pass_int / div).toFixed(1)),
            pass_sacks: parseFloat((last5Agg.pass_sacks / div).toFixed(1)),
            rush_yds: parseFloat((last5Agg.rush_yds / div).toFixed(1)),
            rush_td: parseFloat((last5Agg.rush_td / div).toFixed(1)),
            rush_carries: parseFloat((last5Agg.rush_carries / div).toFixed(1)),
            rec_yds: parseFloat((last5Agg.rec_yds / div).toFixed(1)),
            rec_td: parseFloat((last5Agg.rec_td / div).toFixed(1)),
            receptions: parseFloat((last5Agg.receptions / div).toFixed(1)),
            targets: parseFloat((last5Agg.targets / div).toFixed(1)),
            games_played: last5Agg.games_played,
            fantasy_points: parseFloat((last5Fantasy.reduce((a, b) => a + b, 0) / div).toFixed(1))
        };

        // Evaluation
        let trend: 'Rising' | 'Falling' | 'Stable' = 'Stable';
        const seasonAvgFP = seasonStats.games_played > 0 ? seasonStats.fantasy_points / seasonStats.games_played : 0;
        const last5AvgFP = last5Avg.fantasy_points;
        
        if (seasonAvgFP > 0) {
            const diff = (last5AvgFP - seasonAvgFP) / seasonAvgFP;
            if (diff > 0.15) trend = 'Rising';
            else if (diff < -0.15) trend = 'Falling';
        }

        const boom_potential = last5Fantasy.some(fp => fp >= 25); // Has had a 25+ pt game recently

        return {
            id: playerId,
            name: athlete.displayName,
            team: athlete.team?.displayName || 'FA',
            teamId: athlete.team?.id,
            position: athlete.position?.abbreviation || 'N/A',
            avatar: athlete.headshot?.href || `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${playerId}.png&w=350&h=254`,
            status: athlete.injuries?.length > 0 ? athlete.injuries[0].status : 'Active',
            seasonStats: seasonStats,
            last5Games: {
                ...last5Avg,
                fantasy_trend: last5Fantasy.reverse()
            },
            evaluation: {
                trend,
                boom_potential
            }
        };
    } catch (e) {
        console.error("ESPN API Error:", e);
        return null;
    }
};

// --- Context ---

interface NFLComparisonContextType {
  players: NFLPlayerProfile[];
  loading: boolean;
  addPlayer: (id: string) => Promise<void>;
  removePlayer: (id: string) => void;
  clearPlayers: () => void;
  refreshPlayers: () => Promise<void>;
  setPlayers: (players: NFLPlayerProfile[]) => void;
}

const NFLComparisonContext = createContext<NFLComparisonContextType | undefined>(undefined);

export const useNFLComparison = () => {
  const context = useContext(NFLComparisonContext);
  if (!context) {
    throw new Error('useNFLComparison must be used within a NFLComparisonProvider');
  }
  return context;
};

export const NFLComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<NFLPlayerProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const addPlayer = useCallback(async (id: string) => {
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
    
    const updatedPlayers: NFLPlayerProfile[] = [];
    for (const p of players) {
        try {
            const freshData = await fetchPlayerById(p.id);
            if (freshData) {
                updatedPlayers.push(freshData);
            } else {
                updatedPlayers.push(p);
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
    <NFLComparisonContext.Provider value={{ players, loading, addPlayer, removePlayer, clearPlayers, refreshPlayers, setPlayers }}>
      {children}
    </NFLComparisonContext.Provider>
  );
};
