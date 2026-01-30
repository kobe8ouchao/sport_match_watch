
export interface NBASeasonStats {
  season: number; // e.g. 2024 for 2023-24
  seasonDisplay: string; // "2023-24"
  team: string;
  gp: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fg_pct: number;
  ft_pct: number;
  fg3_pct: number;
  fg3m: number;
  tov: number;
}

export interface NBAPlayerDetail {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  displayName: string;
  shortName: string;
  weight: number;
  displayWeight: string;
  height: number;
  displayHeight: string;
  age: number;
  dateOfBirth: string;
  displayBirthPlace?: string;
  birthPlace?: {
    city: string;
    state: string;
    country: string;
  };
  slug: string;
  jersey: string;
  position: {
    id: string;
    name: string;
    displayName: string;
    abbreviation: string;
  };
  team: {
    id: string;
    location: string;
    name: string;
    abbreviation: string;
    displayName: string;
    logo: string;
  };
  headshot: string;
  status: {
    id: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  careerStats: {
    avg: NBASeasonStats; // Career Averages
    seasons: NBASeasonStats[]; // Season by Season
  };
}

const STAT_MAPPING: Record<string, string> = {
  'GP': 'gp',
  'GS': 'gs',
  'MIN': 'min',
  'PTS': 'pts',
  'REB': 'reb',
  'AST': 'ast',
  'STL': 'stl',
  'BLK': 'blk',
  'FG%': 'fg_pct',
  'FT%': 'ft_pct',
  '3P%': 'fg3_pct',
  '3PM': 'fg3m',
  '3PT': 'fg3m', // Maps to Made-Attempted, need to parse
  '3PTM': 'fg3m',
  'TO': 'tov'
};

const STAT_MAPPING_SPLITS: Record<string, string> = {
  'gp': 'gp',
  'gs': 'gs',
  'min': 'min',
  'mpg': 'min',
  'pts': 'pts',
  'ppg': 'pts',
  'reb': 'reb',
  'rpg': 'reb',
  'ast': 'ast',
  'apg': 'ast',
  'stl': 'stl',
  'spg': 'stl',
  'blk': 'blk',
  'bpg': 'blk',
  'fg%': 'fg_pct',
  'ft%': 'ft_pct',
  '3p%': 'fg3_pct',
  '3pm': 'fg3m',
  'avg3p': 'fg3m',
  'to': 'tov',
  'topg': 'tov'
};

export interface NBAGameLogItem {
    gameId: string;
    gameDate: string;
    opponent: {
        id: string;
        abbreviation: string;
        displayName: string;
        logo: string;
    };
    result: {
        outcome: 'W' | 'L';
        score: string;
    };
    stats: {
        pts: number;
        reb: number;
        ast: number;
        stl: number;
        blk: number;
        min: number;
        fg3m: number;
        fg_pct: number;
        ft_pct: number;
        fg3_pct: number;
        tov: number;
    };
}

export const fetchNBAPlayerGameLog = async (playerId: string): Promise<NBAGameLogItem[]> => {
    try {
        const res = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/gamelog`);
        if (!res.ok) return [];
        const data = await res.json();
        
        // Parse events
        // The structure often is seasonTypes -> categories -> events
        // Or directly events in some versions
        let events: any[] = [];
        let labels: string[] = data.labels || data.displayNames || [];

        if (data.seasonTypes) {
             // Usually we want the current season (last in array or specific type)
             // seasonType 2 is Regular Season
             const regSeason = data.seasonTypes.find((st: any) => st.id === '2' || st.name === 'Regular Season');
             if (regSeason && regSeason.categories) {
                 const cat = regSeason.categories[0];
                 if (cat) {
                     events = cat.events || [];
                     if (labels.length === 0) labels = cat.labels || cat.displayNames || [];
                 }
             } else {
                 // Fallback: take any events found
                 events = data.seasonTypes.flatMap((st: any) => st.categories?.flatMap((c: any) => c.events) || []);
                 // Try to find labels anywhere
                 if (labels.length === 0) {
                     const firstCat = data.seasonTypes[0]?.categories?.[0];
                     if (firstCat) labels = firstCat.labels || firstCat.displayNames || [];
                 }
             }
        } else if (data.events) {
            events = data.events;
        }

        if (labels.length === 0) {
             // Fallback to common order
             // MIN, FGM-A, FG%, 3PM-A, 3P%, FTM-A, FT%, REB, AST, BLK, STL, PF, TO, PTS
             labels = ["MIN", "FG", "FG%", "3PT", "3P%", "FT", "FT%", "REB", "AST", "BLK", "STL", "PF", "TO", "PTS"];
        }

        const parseVal = (val: string) => {
           if (typeof val === 'string' && val.includes('-')) {
               return parseFloat(val.split('-')[0]);
           }
           return parseFloat(val);
        };

        return events.map((evt: any) => {
            const stats: any = {};
            evt.stats?.forEach((val: string, idx: number) => {
                const label = labels[idx];
                const key = STAT_MAPPING[label];
                if (key) {
                     stats[key] = parseVal(val);
                }
            });
            
            return {
                gameId: evt.eventId,
                gameDate: evt.gameDate,
                opponent: {
                    id: evt.opponent?.id,
                    abbreviation: evt.opponent?.abbreviation,
                    displayName: evt.opponent?.displayName,
                    logo: evt.opponent?.logo
                },
                result: {
                    outcome: evt.gameResult || (evt.score ? (evt.score.includes('W') ? 'W' : 'L') : 'N/A'),
                    score: evt.score
                },
                stats: stats
            };
        }).reverse(); // Usually returns latest first, we might want chronological or keep as is. User asked for "trend", usually chronological (left to right) is better. API often gives latest first. Let's reverse to have Start -> End of season.

    } catch (e) {
        console.error("Error fetching game log:", e);
        return [];
    }
};

export const fetchNBAPlayerDetail = async (playerId: string): Promise<NBAPlayerDetail | null> => {
  try {
    // 1. Fetch Player Profile (Overview Data for Display Fields)
    const profileRes = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/overview`);
    const profileData = await profileRes.json();
    const player = profileData.athlete || profileData; // Handle possible wrapper

    // Fallback: If 'athlete' data is missing from overview (as seen in some responses), try fetching basic profile
    let basicProfile = {};
    if (!player.fullName && !player.displayName) {
        try {
             const basicRes = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}`);
             if (basicRes.ok) {
                 const basicData = await basicRes.json();
                 basicProfile = basicData.athlete || basicData;
             }
        } catch (e) {
            console.warn("Could not fetch basic profile fallback", e);
        }
    }
    
    const profileSource = { ...player, ...basicProfile };

    if (!profileSource) {
        console.error("Player profile not found for ID:", playerId);
        return null;
    }

    // 2. Fetch Player Stats (Prioritize 'stats' endpoint as per user instruction)
    let statsData: any = {};
    try {
        // Try 'stats' endpoint first (returns categories structure)
        const statsRes = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/stats`);
        if (statsRes.ok) {
            statsData = await statsRes.json();
        }
        
        // If 'stats' endpoint didn't return valid categories, try 'statistics' endpoint (returns splits)
        if (!statsData.categories) {
            const splitsRes = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/statistics`);
            if (splitsRes.ok) {
                const splitsData = await splitsRes.json();
                // Only use if it has splits
                if (splitsData.splits) {
                    statsData = splitsData;
                }
            }
        }
    } catch (e) {
        console.error("Error fetching player stats:", e);
        // Continue with empty stats if fetching fails
    }

    // Parse Stats
    const careerStats: { avg: any, seasons: any[] } = { avg: {}, seasons: [] };
    
    // Check if we have the 'splits' structure (from /statistics endpoint)
    if (statsData.splits) {
        // Parse using splits structure
        
        // 1. Process Seasons (Regular Season)
        const seasonSplits = statsData.splits.filter((s: any) => 
            s.name?.includes('Regular Season') || s.abbreviation === 'reg' || s.type?.name === 'Regular Season'
        );

        careerStats.seasons = seasonSplits.map((split: any) => {
             const statObj: any = {
                 season: split.season?.year || parseInt(split.id),
                 seasonDisplay: split.displayName || split.name,
                 team: split.team?.abbreviation || 'TOT' 
             };
             
             // Iterate all categories to find stats
             split.categories?.forEach((cat: any) => {
                 cat.stats?.forEach((stat: any) => {
                     const key = STAT_MAPPING_SPLITS[stat.name];
                     if (key) {
                         statObj[key] = parseFloat(stat.value);
                     }
                 });
             });
             
             return statObj;
        }) || [];

        // 2. Process Career (type 0 or name 'Career')
        const careerSplit = statsData.splits.find((s: any) => s.id === '0' || s.name === 'Career' || s.type?.id === '0');
        if (careerSplit) {
            const statObj: any = {};
             careerSplit.categories?.forEach((cat: any) => {
                 cat.stats?.forEach((stat: any) => {
                     const key = STAT_MAPPING_SPLITS[stat.name];
                     if (key) {
                         statObj[key] = parseFloat(stat.value);
                     }
                 });
             });
             careerStats.avg = statObj;
        }

    } else {
        // Fallback: Parse using 'categories' structure (from /stats endpoint)
        // The stats API structure is typically categories -> statistics
        
        // 1. Find "averages" category (Regular Season Averages)
        const avgCategory = statsData.categories?.find((c: any) => 
            c.name === 'averages' || c.displayName === 'Regular Season Averages'
        );
        
        if (avgCategory) {
           const labels = avgCategory.labels || [];
           
           // Helper to parse value (handle "Made-Attempted" format like "1.5-3.3")
           const parseVal = (val: string) => {
               if (typeof val === 'string' && val.includes('-')) {
                   return parseFloat(val.split('-')[0]);
               }
               return parseFloat(val);
           };

           // Season by Season
           careerStats.seasons = avgCategory.statistics?.map((s: any) => {
               // Resolve Team Abbreviation from statsData.teams
               let teamAbbrev = 'TOT';
               if (s.teamId && statsData.teams) {
                   const teamData = Object.values(statsData.teams).find((t: any) => t.id === s.teamId) as any;
                   if (teamData) teamAbbrev = teamData.abbreviation;
               } else if (s.team?.abbreviation) {
                   teamAbbrev = s.team.abbreviation;
               }

               const statObj: any = {
                   season: s.season?.year,
                   seasonDisplay: s.season?.displayName,
                   team: teamAbbrev
               };
               
               // Map values to keys based on labels
               s.stats?.forEach((val: string, idx: number) => {
                   const label = labels[idx];
                   const key = STAT_MAPPING[label];
                   if (key) {
                       statObj[key] = parseVal(val);
                   }
               });
               
               return statObj;
           }) || [];

           // Career Averages (from totals array in averages category)
           if (avgCategory.totals) {
                const statObj: any = {};
                avgCategory.totals.forEach((val: string, idx: number) => {
                    const label = labels[idx];
                    const key = STAT_MAPPING[label];
                    if (key) {
                        statObj[key] = parseVal(val);
                    }
                });
                careerStats.avg = statObj;
           }
        }
    }

    return {
      id: profileSource.id || playerId,
      firstName: profileSource.firstName,
      lastName: profileSource.lastName,
      fullName: profileSource.fullName || profileSource.displayName || "Unknown Player",
      displayName: profileSource.displayName || "Unknown Player",
      shortName: profileSource.shortName,
      weight: profileSource.weight || 0,
      displayWeight: profileSource.displayWeight || '',
      height: profileSource.height || 0,
      displayHeight: profileSource.displayHeight || '',
      age: profileSource.age,
      dateOfBirth: profileSource.displayDOB || profileSource.dateOfBirth,
      displayBirthPlace: profileSource.displayBirthPlace,
      birthPlace: profileSource.birthPlace,
      slug: profileSource.slug,
      jersey: profileSource.jersey,
      position: profileSource.position || { id: '0', name: 'Unknown', displayName: 'Unknown', abbreviation: 'N/A' },
      team: {
          id: '0',
          location: 'Unknown',
          name: 'Unknown',
          abbreviation: 'N/A',
          displayName: 'Unknown',
          ...(profileSource.team || {}),
          logo: profileSource.team?.logos?.[0]?.href || ''
      },
      headshot: profileSource.headshot?.href || `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${playerId}.png&w=350&h=254`,
      status: profileSource.status,
      careerStats: careerStats as any
    };

  } catch (e) {
    console.error("Error fetching NBA player details:", e);
    return null;
  }
};
