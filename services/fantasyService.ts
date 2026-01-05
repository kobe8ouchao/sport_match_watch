import { fetchMatches } from './api';

// Types
export interface TeamScheduleInfo {
  id: string;
  abbrev: string;
  logo: string;
  games: {
    date: string;
    opponent: string;
    isHome: boolean;
    isB2B: boolean;
  }[];
  score: number;
  qualityGames: number; // Games on low-volume days
  totalGames: number;
  b2b?: number;
}

export interface PlayerStreamInfo {
  id: string;
  fullName: string;
  teamAbbrev: string;
  position: string;
  percentOwned: number;
  avatar: string;
  stats: {
    pts: number;
    reb: number;
    ast: number;
    last3Mins: number;
    seasonMins: number;
    minDiffPercent: number;
  };
  streamScore: number;
  nextOpponent: string;
  scheduleSummary: string; // e.g. "4 games (2 off-nights)"
  injuryStatus?: string;
}

// Helper to format date as YYYYMMDD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0].replace(/-/g, '');
};

const formatDateReadable = (dateStr: string): string => {
    // 20231025 -> 2023-10-25
    const y = dateStr.substring(0, 4);
    const m = dateStr.substring(4, 6);
    const d = dateStr.substring(6, 8);
    return `${y}-${m}-${d}`;
};

// 1. Fetch Schedule for Next 7 Days
export const fetchWeeklySchedule = async (): Promise<{ teamSchedules: TeamScheduleInfo[], dailyGameCounts: Record<string, number> }> => {
  const dates = [];
  const today = new Date();
  
  // Generate next 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(formatDate(d));
  }

  // Fetch scoreboards in parallel
  const promises = dates.map(date => 
    fetch(`/api/espn/site/sports/basketball/nba/scoreboard?dates=${date}`)
      .then(res => res.json())
      .catch(e => ({ events: [] })) // Handle errors gracefully
  );

  const results = await Promise.all(promises);
  
  // Process results
  const teamGamesMap: Record<string, { info: any, games: any[] }> = {};
  const dailyGameCounts: Record<string, number> = {};

  results.forEach((data, index) => {
    const dateStr = dates[index];
    const events = data.events || [];
    dailyGameCounts[dateStr] = events.length;

    events.forEach((event: any) => {
      const competitors = event.competitions[0].competitors;
      const team1 = competitors[0];
      const team2 = competitors[1];

      // Add game to Team 1
      if (!teamGamesMap[team1.team.id]) teamGamesMap[team1.team.id] = { info: team1.team, games: [] };
      teamGamesMap[team1.team.id].games.push({
        date: dateStr,
        opponent: team2.team.abbreviation,
        isHome: team1.homeAway === 'home',
        opponentId: team2.team.id
      });

      // Add game to Team 2
      if (!teamGamesMap[team2.team.id]) teamGamesMap[team2.team.id] = { info: team2.team, games: [] };
      teamGamesMap[team2.team.id].games.push({
        date: dateStr,
        opponent: team1.team.abbreviation,
        isHome: team2.homeAway === 'home',
        opponentId: team1.team.id
      });
    });
  });

  // Calculate Scores and Format
  const teamSchedules: TeamScheduleInfo[] = Object.values(teamGamesMap).map((t: any) => {
    const games = t.games.sort((a: any, b: any) => a.date.localeCompare(b.date));
    
    // Identify B2Bs
    const gamesWithB2B = games.map((g: any, idx: number) => {
      let isB2B = false;
      if (idx > 0) {
        const prevDate = new Date(formatDateReadable(games[idx-1].date));
        const currDate = new Date(formatDateReadable(g.date));
        const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays === 1) isB2B = true;
      }
      return { ...g, isB2B };
    });

    // Calculate Score
    // Base: +1 per game
    // Off-night (<= 8 games): +1.5 bonus
    // B2B: +0.5 bonus (volume is good)
    let score = 0;
    let qualityGames = 0;

    gamesWithB2B.forEach((g: any) => {
      score += 10; // Base value
      if (dailyGameCounts[g.date] <= 8) {
        score += 15; // Off-night bonus
        qualityGames += 1;
      }
      if (g.isB2B) score += 5; // Volume bonus
    });

    return {
      id: t.info.id,
      abbrev: t.info.abbreviation,
      logo: t.info.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${t.info.abbreviation}.png`,
      games: gamesWithB2B,
      score,
      qualityGames,
      totalGames: games.length
    };
  });

  return { teamSchedules, dailyGameCounts };
};

// Generic Fetch Helper
const fetchFantasyPlayers = async (leagueId: string, filter: any): Promise<any[]> => {
  try {
    // If no league ID, use a default public one for generic data (e.g. ESPN's challenge league or similar)
    // Or just fail gracefully. For now, assume generic access might work with a dummy ID or user provided one.
    // If leagueId is empty, this URL might 404. We need a fallback.
    const targetLeagueId = leagueId || '48303866'; // Fallback to a known public league ID if possible, or just fail.
    
    const response = await fetch(
      `/api/espn/fantasy/games/fba/seasons/2026/segments/0/leagues/${targetLeagueId}?view=kona_player_info`,
      {
        headers: {
          'X-Fantasy-Filter': JSON.stringify(filter)
        }
      }
    );

    if (!response.ok) {
      // Try fallback to generic api if 401/404? 
      // For now, throw to handle in UI
      throw new Error(`League Access Error: ${response.status}`);
    }

    const data = await response.json();
    return data.players || [];
  } catch (err: any) {
    console.error("Error fetching fantasy players:", err);
    return [];
  }
};

// 2. Fetch Waiver Wire Players (Reused Logic)
export const fetchWaiverPlayers = async (leagueId: string): Promise<any[]> => {
  const filter = {
    players: {
      filterSlotIds: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      sortPercOwned: { sortAsc: false, sortPriority: 1 },
      limit: 50,
      filterStatsForTopScoringPeriodIds: { value: 3 } // Last 7/15/30 days scoring period usually
    }
  };

  const players = await fetchFantasyPlayers(leagueId, filter);
  return players.filter((p: any) => p.player.ownership?.percentOwned < 50);
};

// 4. Fetch Injured Stars (Status = OUT, Minutes > 28)
export const fetchInjuredStars = async (leagueId: string): Promise<any[]> => {
  const filter = {
    players: {
      filterStatus: { value: ["OUT"] },
      filterSlotIds: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      sortPercOwned: { sortAsc: false, sortPriority: 1 },
      limit: 100, // Get top 100 owned injured players to ensure we find valid candidates
      filterStatsForTopScoringPeriodIds: { value: 2 }
    }
  };

  const players = await fetchFantasyPlayers(leagueId, filter);
  
  // Filter for "Core" players (Avg Mins > 28)
  return players.filter((p: any) => {
    const stats = p.player.stats || [];
    const seasonStat = stats.find((s: any) => s.id === "002026") || stats[0];
    const avgMins = seasonStat?.averageStats?.minutes || 0;
    return avgMins > 28;
  });
};

// 5. Fetch Team Handcuffs (Candidates on same team)
export const fetchTeamHandcuffs = async (leagueId: string, teamId: number): Promise<any[]> => {
    const filter = {
      players: {
        filterProTeamIds: { value: [teamId] },
        filterSlotIds: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
        sortPercOwned: { sortAsc: false, sortPriority: 1 },
        limit: 20,
        filterStatsForTopScoringPeriodIds: { value: 2 }
      }
    };
  
    return await fetchFantasyPlayers(leagueId, filter);
};

// 6. Fetch League Info (Name)
export const fetchLeagueInfo = async (leagueId: string): Promise<{ name: string; id: string } | null> => {
    try {
        const response = await fetch(
            `/api/espn/fantasy/games/fba/seasons/2026/segments/0/leagues/${leagueId}?view=mSettings`
        );
        if (!response.ok) return null;
        const data = await response.json();
        return {
            name: data.settings?.name || `League ${leagueId}`,
            id: leagueId
        };
    } catch (e) {
        console.error("Fetch League Info Error", e);
        return null;
    }
};


// 7. Fetch Top Players (for Playoff Value)
export const fetchTopPlayers = async (leagueId: string): Promise<any[]> => {
  const filter = {
    players: {
      filterSlotIds: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      sortPercOwned: { sortAsc: false, sortPriority: 1 },
      limit: 150, // Top 150 players
      filterStatsForTopScoringPeriodIds: { value: 2 }
    }
  };

  return await fetchFantasyPlayers(leagueId, filter);
};

// 8. Fetch Schedule for Specific Weeks (Playoff Planning)
// 2025-26 Season Week Map (Approximate for Monday start)
const WEEK_START_DATES: Record<number, string> = {
    17: '20260209', // Feb 9
    18: '20260223', // Feb 23 (All-Star break usually splits/skips a week, keeping simple)
    19: '20260302', // Mar 2
    20: '20260309', // Mar 9
    21: '20260316', // Mar 16
    22: '20260323', // Mar 23
    23: '20260330', // Mar 30
    24: '20260406', // Apr 6
};

export const fetchScheduleForWeeks = async (weeks: number[]): Promise<{ teamSchedules: TeamScheduleInfo[] }> => {
    const allDates: string[] = [];

    weeks.forEach(week => {
        const startStr = WEEK_START_DATES[week];
        if (!startStr) return;

        // Parse YYYYMMDD
        const y = parseInt(startStr.substring(0, 4));
        const m = parseInt(startStr.substring(4, 6)) - 1;
        const d = parseInt(startStr.substring(6, 8));
        
        const startDate = new Date(y, m, d);

        // Add 7 days for the week
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            allDates.push(formatDate(date));
        }
    });

    // Fetch in batches to avoid overwhelming (though browser limits parallel anyway)
    // We'll just Promise.all them all, usually okay for ~21 requests (3 weeks)
    const promises = allDates.map(date => 
        fetch(`/api/espn/site/sports/basketball/nba/scoreboard?dates=${date}`)
            .then(res => res.json())
            .catch(() => ({ events: [] }))
    );

    const results = await Promise.all(promises);

    // Process
    const teamGamesMap: Record<string, { info: any, games: any[] }> = {};
    const dailyGameCounts: Record<string, number> = {};

    results.forEach((data, index) => {
        const dateStr = allDates[index];
        const events = data.events || [];
        dailyGameCounts[dateStr] = events.length;

        events.forEach((event: any) => {
            const competitors = event.competitions[0].competitors;
            const team1 = competitors[0];
            const team2 = competitors[1];

            [team1, team2].forEach(t => {
                if (!teamGamesMap[t.team.id]) {
                    teamGamesMap[t.team.id] = { info: t.team, games: [] };
                }
                teamGamesMap[t.team.id].games.push({
                    date: dateStr,
                    opponent: t === team1 ? team2.team.abbreviation : team1.team.abbreviation,
                    isHome: t.homeAway === 'home',
                    isB2B: false // Calc later
                });
            });
        });
    });

    // Calc Stats
    const teamSchedules: TeamScheduleInfo[] = Object.values(teamGamesMap).map((t: any) => {
        const games = t.games.sort((a: any, b: any) => a.date.localeCompare(b.date));
        
        let b2bCount = 0;
        let offNightCount = 0; // Tue/Thu usually, or low volume days

        const gamesWithB2B = games.map((g: any, idx: number) => {
            let isB2B = false;
            if (idx > 0) {
                const prevDate = new Date(formatDateReadable(games[idx-1].date));
                const currDate = new Date(formatDateReadable(g.date));
                const diff = (currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
                if (Math.abs(diff) <= 1.1) { // ~1 day
                    isB2B = true;
                    b2bCount++;
                }
            }

            // Off-night check (Low volume days or specific days)
            // Let's use Volume check: <= 8 games
            if (dailyGameCounts[g.date] <= 8) {
                offNightCount++;
            }

            return { ...g, isB2B };
        });

        return {
            id: t.info.id,
            abbrev: t.info.abbreviation,
            logo: t.info.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${t.info.abbreviation}.png`,
            games: gamesWithB2B,
            score: 0, // Not used for this view
            qualityGames: offNightCount, // Using this field for Off-Nights
            totalGames: games.length,
            b2b: b2bCount // We'll need to extend the type or use score/qualityGames field if strictly typed
        };
    });

    return { teamSchedules };
};

// 3. Analyze Player for Streaming (Restored)
export const analyzeStreamPlayer = async (playerData: any, teamSchedule: TeamScheduleInfo | undefined): Promise<PlayerStreamInfo | null> => {
    if (!teamSchedule) return null;

    const playerId = playerData.player.id;
    const teamId = playerData.player.proTeamId;
    
    // Quick extract stats (using provided data instead of extra fetches if possible to save time)
    // The kona_player_info endpoint has a LOT of data.
    // player.stats is an array of stat splits.
    
    const stats = playerData.player.stats || [];
    // Usually:
    // id: "002026" -> Season 2026
    // id: "102026" -> Last 7 Days? Or projected?
    // We need to check structure. Assuming simple projection for now or using Last 15/30 days.
    
    // Let's use the first available stat set for simplicity or look for "Regular Season"
    const seasonStat = stats.find((s: any) => s.id === "002026") || stats[0];
    const avgStats = seasonStat?.averageStats || {};
    
    const pts = avgStats.points || 0;
    const reb = avgStats.rebounds || 0;
    const ast = avgStats.assists || 0;
    const mins = avgStats.minutes || 0;

    // Stream Score Calculation
    // 1. Team Schedule Score (already calculated)
    // 2. Player Production (Fantasy Points approx)
    const fantasyPoints = pts + (reb * 1.2) + (ast * 1.5);
    const scheduleScore = teamSchedule.score; // e.g. 50-80 range

    // Normalized Score
    // Fantasy Points: 10 FP = Low, 30 FP = Good, 50 FP = Great
    // Schedule: 30 = Bad, 60 = Good
    const streamScore = (fantasyPoints * 2) + (scheduleScore * 0.8);

    return {
        id: playerId,
        fullName: playerData.player.fullName,
        teamAbbrev: teamSchedule.abbrev,
        position: playerData.player.defaultPositionId === 1 ? 'PG' : (playerData.player.defaultPositionId === 2 ? 'SG' : (playerData.player.defaultPositionId === 3 ? 'SF' : (playerData.player.defaultPositionId === 4 ? 'PF' : 'C'))), 
        percentOwned: playerData.player.ownership.percentOwned,
        avatar: `https://a.espncdn.com/i/headshots/nba/players/full/${playerId}.png`,
        stats: {
            pts: Math.round(pts * 10) / 10,
            reb: Math.round(reb * 10) / 10,
            ast: Math.round(ast * 10) / 10,
            last3Mins: mins, // Placeholder for now without extra fetch
            seasonMins: mins,
            minDiffPercent: 0
        },
        streamScore: Math.round(streamScore),
        nextOpponent: teamSchedule.games[0]?.opponent || "N/A",
        scheduleSummary: `${teamSchedule.totalGames} Games (${teamSchedule.qualityGames} Off-nights)`
    };
};
