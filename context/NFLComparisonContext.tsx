import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// --- Types ---

export interface NFLPlayerStats {
  // Passing
  pass_yds: number;
  pass_td: number;
  pass_int: number;
  pass_sacks: number;
  pass_att: number;
  pass_cmp: number;
  // Rushing
  rush_yds: number;
  rush_td: number;
  rush_carries: number;
  // Receiving
  rec_yds: number;
  rec_td: number;
  receptions: number;
  targets: number;
  // General
  games_played: number;
  fantasy_points: number; // Estimated PPR
  
  // Derived / Advanced Metrics
  completion_pct?: number;
  yards_per_attempt?: number;
  td_int_ratio?: number;
  sack_rate?: number;
  
  yards_per_carry?: number;
  carry_share?: number;
  target_share?: number;
  catch_rate?: number;
  total_touches?: number;
  yards_per_touch?: number;
  
  yards_per_reception?: number;
  yards_per_target?: number;
  yprr?: number;
  td_per_reception?: number;
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

interface TeamTotals {
    total_targets: number;
    total_rushes: number;
    total_snaps: number;
    games: number;
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

const estimateTeamTotals = (gameLog: any[], position: string): TeamTotals => {
    let total_targets = 0;
    let total_rushes = 0;
    let games = gameLog.length;

    // Method 1: For QBs, their passing attempts are a good proxy for team targets
    if (position === 'QB') {
        gameLog.forEach(game => {
            const passAtt = game.stats['passingAttempts'] || game.stats['passAttempts'] || 0;
            total_targets += passAtt;
        });
    }

    // Method 2: Use League Averages if data not available or for non-QBs
    // NFL Avg ~33-35 pass attempts per game
    if (total_targets === 0 && games > 0) total_targets = games * 34; 
    
    // NFL Avg ~25-27 rush attempts per game
    // We cannot get team rushes from player gamelog, so always use estimate
    if (games > 0) total_rushes = games * 26;

    return {
        total_targets,
        total_rushes,
        total_snaps: games * 65,
        games
    };
};

const calculateDerivedStats = (stats: NFLPlayerStats, teamTotals: TeamTotals, position: string) => {
    const derived: Partial<NFLPlayerStats> = {};
    
    // QB Specific
    if (position === 'QB') {
        if (stats.pass_att > 0) {
            derived.completion_pct = parseFloat(((stats.pass_cmp / stats.pass_att) * 100).toFixed(1));
            derived.yards_per_attempt = parseFloat((stats.pass_yds / stats.pass_att).toFixed(1));
            derived.sack_rate = parseFloat((stats.pass_sacks / (stats.pass_att + stats.pass_sacks) * 100).toFixed(1));
        }
        if (stats.pass_int > 0) {
            derived.td_int_ratio = parseFloat((stats.pass_td / stats.pass_int).toFixed(1));
        } else if (stats.pass_td > 0) {
            derived.td_int_ratio = stats.pass_td; // Infinite ratio practically
        }
    }
    
    // Rushing Efficiency (Applicable to all positions with carries)
    if (stats.rush_carries > 0) {
        derived.yards_per_carry = parseFloat((stats.rush_yds / stats.rush_carries).toFixed(1));
        
        if (teamTotals.total_rushes > 0) {
            derived.carry_share = parseFloat(((stats.rush_carries / teamTotals.total_rushes) * 100).toFixed(1));
        }
    }

    // Receiving Efficiency (Applicable to all positions with targets/receptions)
    if (stats.targets > 0 || stats.receptions > 0) {
        if (teamTotals.total_targets > 0) {
            derived.target_share = parseFloat(((stats.targets / teamTotals.total_targets) * 100).toFixed(1));
        }
        
        if (stats.targets > 0) {
            derived.catch_rate = parseFloat(((stats.receptions / stats.targets) * 100).toFixed(1));
            derived.yards_per_target = parseFloat((stats.rec_yds / stats.targets).toFixed(1));
            // YPRR (Estimated)
            derived.yprr = parseFloat((stats.rec_yds / (stats.targets * 2.5)).toFixed(2));
        }
        
        if (stats.receptions > 0) {
            derived.yards_per_reception = parseFloat((stats.rec_yds / stats.receptions).toFixed(1));
            derived.td_per_reception = parseFloat(((stats.rec_td / stats.receptions) * 100).toFixed(1));
        }
    }
    
    // General Efficiency
    derived.total_touches = stats.rush_carries + stats.receptions;
    if (derived.total_touches > 0) {
        derived.yards_per_touch = parseFloat(((stats.rush_yds + stats.rec_yds) / derived.total_touches).toFixed(1));
    }
    
    return derived;
};

const fetchPlayerById = async (playerId: string): Promise<NFLPlayerProfile | null> => {
    try {
        // 1. Fetch Overview (Profile + Stats)
        const overviewRes = await fetch(`/api/espn/common/sports/football/nfl/athletes/${playerId}/overview`);
        if (!overviewRes.ok) {
             console.error(`[Error] Overview fetch failed for ${playerId}: ${overviewRes.status}`);
             return null;
        }
        const overviewData = await overviewRes.json();
        console.log(`[Debug] Overview Data for ${playerId}:`, overviewData);
        
        // Handle different response structures:
        // 1. Standard: wrapped in 'athlete'
        // 2. Direct: root has 'id' and 'displayName'
        // 3. Dev.md style: root has 'statistics' and 'news', need to extract profile from news or infer
        
        let athlete = overviewData.athlete || (overviewData.id && overviewData.displayName ? overviewData : null);

        // Fallback: Extract from news if athlete object is missing (based on dev.md structure)
        if (!athlete && overviewData.news) {
            try {
                const athleteNode = overviewData.news[0]?.categories?.find((c: any) => c.type === 'athlete');
                const teamNode = overviewData.news[0]?.categories?.find((c: any) => c.type === 'team');
                
                if (athleteNode) {
                    athlete = {
                        id: athleteNode.athleteId || playerId,
                        displayName: athleteNode.description,
                        team: {
                            displayName: teamNode?.description || 'Free Agent',
                            id: teamNode?.team?.id
                        },
                        position: { abbreviation: 'N/A' } // Inferred later
                    };
                    
                    // Infer position from statistics title
                    if (overviewData.statistics?.displayName?.includes('Passing')) {
                        athlete.position.abbreviation = 'QB';
                    } else if (overviewData.statistics?.displayName?.includes('Rushing')) {
                        athlete.position.abbreviation = 'RB';
                    } else if (overviewData.statistics?.displayName?.includes('Receiving')) {
                        athlete.position.abbreviation = 'WR';
                    }
                    console.log(`[Debug] Extracted athlete from news:`, athlete);
                }
            } catch (e) {
                console.error("Failed to extract athlete from news:", e);
            }
        }

        if (!athlete) {
             console.error(`[Error] Athlete data not found for ${playerId}`);
             return null;
        }

        // 2. Fetch Game Log (Season 2025)
        const gameMap = new Map<string, any>();
        let gameLogList: any[] = [];

        try {
            const gamelogRes = await fetch(`/api/espn/common/sports/football/nfl/athletes/${playerId}/gamelog?season=2025`);
            const gamelogData = await gamelogRes.json();
            console.log(`[Debug] Gamelog Data for ${playerId}:`, gamelogData);
            
            // Traverse seasonTypes -> categories -> events
            let allCategories: any[] = [];
            if (gamelogData.seasonTypes) {
                gamelogData.seasonTypes.forEach((st: any) => {
                    if (st.categories) allCategories = allCategories.concat(st.categories);
                });
            } else if (gamelogData.categories) {
                // Fallback for flat structure
                allCategories = gamelogData.categories;
            }

            // Headers might be at root level (common in flat structure) or category level
            const rootHeaders = gamelogData.names || gamelogData.labels || [];
            const eventsMap = gamelogData.events || {};

            for (const cat of allCategories) {
                const headers = cat.names || cat.labels || rootHeaders;
                const events = cat.events || [];
                
                for (const event of events) {
                    const gameId = event.eventId || event.id;
                    if (!gameId) continue;

                    // Parse stats
                    const statsObj: any = {};
                    if (event.stats && Array.isArray(event.stats)) {
                        event.stats.forEach((val: string, idx: number) => {
                            const header = headers[idx];
                            if (header) {
                                statsObj[header] = parseFloat(val);
                            }
                        });
                    }

                    // Get game details from events map or event itself
                    const gameDetails = eventsMap[gameId] || event;
                    
                    const gameEntry = {
                        gameDate: gameDetails.gameDate,
                        opponent: gameDetails.opponent?.abbreviation || gameDetails.opponent?.id, // Fallback
                        stats: statsObj
                    };
                    
                    gameMap.set(gameId, gameEntry);
                    gameLogList.push(gameEntry);
                }
            }
        } catch (e) {
            console.error("Game Log Fetch Error:", e);
        }

        // Helper to extract stats from game log entry (Moved up for reuse)
        const getGameLogStat = (gameEntry: any, statName: string) => {
             // Try variations
             const variations = {
                 'passingYards': ['passingYards', 'passYards', 'passing_YDS'],
                 'passingTouchdowns': ['passingTouchdowns', 'passTD', 'passing_TD'],
                 'interceptions': ['interceptions', 'ints', 'passing_INT'],
                 'sacks': ['sacks', 'passingSacks'],
                 'passingAttempts': ['passingAttempts', 'passAttempts'],
                 'completions': ['completions', 'passCompletions'],
                 
                 'rushingYards': ['rushingYards', 'rushYards', 'rushing_YDS'],
                 'rushingTouchdowns': ['rushingTouchdowns', 'rushTD', 'rushing_TD'],
                 'rushingAttempts': ['rushingAttempts', 'rushAttempts', 'carries'],
                 
                 'receivingYards': ['receivingYards', 'recYards', 'receiving_YDS'],
                 'receivingTouchdowns': ['receivingTouchdowns', 'recTD', 'receiving_TD'],
                 'receptions': ['receptions', 'rec', 'receiving_REC'],
                 'receivingTargets': ['receivingTargets', 'targets']
             };
             
             const possibleNames = variations[statName as keyof typeof variations] || [statName];
             for (const name of possibleNames) {
                 if (gameEntry.stats[name] !== undefined) {
                     return gameEntry.stats[name];
                 }
             }
             return 0;
        };

        // Parse Season Stats from Overview
        let statsRoot = overviewData.statistics || athlete.statistics; 
        
        // Fallback: If no stats in overview, try fetching stats endpoint
        if (!statsRoot) {
             try {
                 console.log(`[Debug] No stats in overview for ${playerId}, fetching stats endpoint...`);
                 const statsRes = await fetch(`/api/espn/common/sports/football/nfl/athletes/${playerId}/stats`);
                 if (statsRes.ok) {
                     const statsData = await statsRes.json();
                     console.log(`[Debug] Stats Data for ${playerId}:`, statsData);
                     statsRoot = statsData.statistics || statsData;
                 }
             } catch (e) {
                 console.error("Stats Fetch Error:", e);
             }
        }
        
        const statNames = statsRoot?.names || statsRoot?.labels || [];
        // Look for Regular Season split
        const regularSeasonSplit = statsRoot?.splits?.find((s: any) => 
            s.displayName === "Regular Season" || s.name === "Regular Season" || s.description === "Regular Season"
        ) || statsRoot?.splits?.find((s: any) => s.displayName?.includes("Regular") || s.name?.includes("Regular"));
        
        const statValues = regularSeasonSplit?.stats || [];
        
        const getStat = (nameKey: string) => {
            const nameMap: Record<string, string[]> = {
                'PASS_YDS': ['passingYards', 'passYards', 'passingYds', 'avgPassingYards'],
                'PASS_TD': ['passingTouchdowns', 'passTouchdowns', 'passTD', 'passingTD'],
                'PASS_INT': ['interceptions', 'passingInterceptions', 'ints'],
                'PASS_SACK': ['sacks', 'passingSacks'],
                'PASS_ATT': ['passingAttempts', 'passAttempts', 'attempts'],
                'PASS_CMP': ['completions', 'passCompletions', 'completions'],
                
                'RUSH_YDS': ['rushingYards', 'rushYards', 'rushingYds'],
                'RUSH_TD': ['rushingTouchdowns', 'rushTouchdowns', 'rushTD'],
                'RUSH_ATT': ['rushingAttempts', 'rushAttempts', 'carries'],
                
                'REC_YDS': ['receivingYards', 'recYards', 'receivingYds'],
                'REC_TD': ['receivingTouchdowns', 'recTouchdowns', 'recTD'],
                'REC': ['receptions', 'totalReceptions', 'rec'],
                'REC_TGT': ['receivingTargets', 'targets', 'totalTargets'],
                
                'GP': ['gamesPlayed', 'totalGamesPlayed', 'GP']
            };
            
            const targetNames = nameMap[nameKey] || [nameKey];
            let idx = -1;
            
            for (const tName of targetNames) {
                idx = statNames.indexOf(tName);
                if (idx !== -1) break;
            }

            if (idx === -1) return 0;
            return parseFloat(statValues[idx]);
        };

        let baseStats: NFLPlayerStats = {
            pass_yds: getStat('PASS_YDS'),
            pass_td: getStat('PASS_TD'),
            pass_int: getStat('PASS_INT'),
            pass_sacks: getStat('PASS_SACK'),
            pass_att: getStat('PASS_ATT'),
            pass_cmp: getStat('PASS_CMP'),
            
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
        
        // Fallback: If overview stats are empty (e.g. games_played is 0) but we have gamelogs
        if (baseStats.games_played === 0 && gameLogList.length > 0) {
            console.log(`[Debug] Aggregating stats from ${gameLogList.length} gamelogs for ${playerId}`);
            
            const aggStats = {
                pass_yds: 0, pass_td: 0, pass_int: 0, pass_sacks: 0, pass_att: 0, pass_cmp: 0,
                rush_yds: 0, rush_td: 0, rush_carries: 0,
                rec_yds: 0, rec_td: 0, receptions: 0, targets: 0,
                games_played: 0,
                fantasy_points: 0
            };

            gameLogList.forEach(g => {
                aggStats.pass_yds += getGameLogStat(g, 'passingYards');
                aggStats.pass_td += getGameLogStat(g, 'passingTouchdowns');
                aggStats.pass_int += getGameLogStat(g, 'interceptions');
                aggStats.pass_sacks += getGameLogStat(g, 'sacks');
                aggStats.pass_att += getGameLogStat(g, 'passingAttempts');
                aggStats.pass_cmp += getGameLogStat(g, 'completions');
                
                aggStats.rush_yds += getGameLogStat(g, 'rushingYards');
                aggStats.rush_td += getGameLogStat(g, 'rushingTouchdowns');
                aggStats.rush_carries += getGameLogStat(g, 'rushingAttempts');
                
                aggStats.rec_yds += getGameLogStat(g, 'receivingYards');
                aggStats.rec_td += getGameLogStat(g, 'receivingTouchdowns');
                aggStats.receptions += getGameLogStat(g, 'receptions');
                aggStats.targets += getGameLogStat(g, 'receivingTargets');
                
                aggStats.games_played++;
            });

            baseStats = aggStats;
        }
        
        baseStats.fantasy_points = calculateFantasyPoints(baseStats);

        // Estimate Team Totals & Calculate Derived Stats
        const position = athlete.position?.abbreviation || 'N/A';
        const teamTotals = estimateTeamTotals(gameLogList, position);
        const derivedStats = calculateDerivedStats(baseStats, teamTotals, position);
        
        const seasonStats = { ...baseStats, ...derivedStats };

        // Parse Last 5 Games
        // Sort by date descending
        const sortedGameLog = gameLogList.sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime());
        const last5GamesLog = sortedGameLog.slice(0, 5);
        
        const last5Fantasy: number[] = [];
        
        const last5Agg: NFLPlayerStats = {
            pass_yds: 0, pass_td: 0, pass_int: 0, pass_sacks: 0, pass_att: 0, pass_cmp: 0,
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
                pass_att: getGameLogStat(g, 'passingAttempts'),
                pass_cmp: getGameLogStat(g, 'completions'),
                
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
            
            // Calculate Fantasy for this game
            const fp = calculateFantasyPoints(stats);
            last5Fantasy.push(fp);

            last5Agg.pass_yds += stats.pass_yds;
            last5Agg.pass_td += stats.pass_td;
            last5Agg.pass_int += stats.pass_int;
            last5Agg.pass_sacks += stats.pass_sacks;
            last5Agg.pass_att += stats.pass_att;
            last5Agg.pass_cmp += stats.pass_cmp;
            
            last5Agg.rush_yds += stats.rush_yds;
            last5Agg.rush_td += stats.rush_td;
            last5Agg.rush_carries += stats.rush_carries;
            
            last5Agg.rec_yds += stats.rec_yds;
            last5Agg.rec_td += stats.rec_td;
            last5Agg.receptions += stats.receptions;
            last5Agg.targets += stats.targets;
        });

        const div = last5Agg.games_played || 1;
        const last5Avg: NFLPlayerStats = {
            pass_yds: parseFloat((last5Agg.pass_yds / div).toFixed(1)),
            pass_td: parseFloat((last5Agg.pass_td / div).toFixed(1)),
            pass_int: parseFloat((last5Agg.pass_int / div).toFixed(1)),
            pass_sacks: parseFloat((last5Agg.pass_sacks / div).toFixed(1)),
            pass_att: parseFloat((last5Agg.pass_att / div).toFixed(1)),
            pass_cmp: parseFloat((last5Agg.pass_cmp / div).toFixed(1)),
            
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

        const boom_potential = last5Fantasy.some(fp => fp >= 25);

        const profile: NFLPlayerProfile = {
            id: playerId,
            name: athlete.displayName || 'Unknown Player',
            team: athlete.team?.displayName || 'FA',
            teamId: athlete.team?.id,
            position: position,
            avatar: athlete.headshot?.href || `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${playerId}.png&w=350&h=254`,
            status: (athlete.injuries?.length > 0 ? athlete.injuries[0].status : 'Active') || 'Active',
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

        return profile;
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
