import { fetchMatches } from './api';

export interface NFLTeamSchedule {
    teamId: string;
    teamAbbrev: string;
    teamName: string;
    logo: string;
    games: NFLGameInfo[];
}

export interface NFLGameInfo {
    week: number;
    date: string;
    opponentId: string;
    opponentAbbrev: string;
    opponentName: string;
    isHome: boolean;
    difficultyRank: number; // 1 (Hardest) - 32 (Easiest) -> User wants colors based on Rank 1-32? 
    // User says: #E74C3C (Rank 1-5 Hard), #2ECC71 (Rank 28-32 Easy).
    // So Rank 1 = Best Defense (Hard for Offense), Rank 32 = Worst Defense (Easy for Offense).
    sosColor?: string;
    opponentStats?: any; 
}

// Mock or Real Position Difficulty Map
// In a real app, we'd fetch "Points Allowed vs Position"
// For now, we will generate or fetch basic Team Defense Ranks
export const fetchNFLDefenseRankings = async (): Promise<Record<string, Record<string, number>>> => {
    // Returns { 'TEAM_ID': { 'QB': 12, 'WR': 5, ... } }
    // Rank 1 = Best Defense (Hardest matchup), 32 = Worst Defense (Easiest)
    
    // Since we don't have a direct endpoint for DvP, we'll mock this with consistent random data 
    // or fetch Standings/Stats and derive a proxy.
    // Let's fetch NFL Teams to get IDs first.
    const teams = await fetchNFLTeams();
    
    const rankings: Record<string, Record<string, number>> = {};
    
    teams.forEach(team => {
        rankings[team.id] = {
            'QB': Math.floor(Math.random() * 32) + 1,
            'RB': Math.floor(Math.random() * 32) + 1,
            'WR': Math.floor(Math.random() * 32) + 1,
            'TE': Math.floor(Math.random() * 32) + 1,
            'K': Math.floor(Math.random() * 32) + 1,
            'DST': Math.floor(Math.random() * 32) + 1, // For DST, it's Opponent Offense Rank
        };
    });
    
    return rankings;
};

export const fetchNFLTeams = async (): Promise<any[]> => {
    try {
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=32');
        const data = await res.json();
        return data.sports?.[0]?.leagues?.[0]?.teams?.map((t: any) => t.team) || [];
    } catch (e) {
        console.error("Error fetching NFL teams", e);
        return [];
    }
};

export const fetchNFLScheduleForWeeks = async (startWeek: number, endWeek: number): Promise<NFLTeamSchedule[]> => {
    const teams = await fetchNFLTeams();
    const teamMap: Record<string, NFLTeamSchedule> = {};
    
    // Initialize map
    teams.forEach(t => {
        teamMap[t.id] = {
            teamId: t.id,
            teamAbbrev: t.abbreviation,
            teamName: t.displayName,
            logo: t.logos?.[0]?.href,
            games: []
        };
    });

    // Fetch Scoreboard for each week
    const promises = [];
    for (let w = startWeek; w <= endWeek; w++) {
        promises.push(
            fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=${w}`)
                .then(res => res.json())
                .then(data => ({ week: w, events: data.events || [] }))
                .catch(e => ({ week: w, events: [] }))
        );
    }

    const results = await Promise.all(promises);

    results.forEach(({ week, events }) => {
        events.forEach((event: any) => {
            const comps = event.competitions[0].competitors;
            const team1 = comps[0];
            const team2 = comps[1];
            
            // Add to Team 1
            if (teamMap[team1.team.id]) {
                teamMap[team1.team.id].games.push({
                    week,
                    date: event.date,
                    opponentId: team2.team.id,
                    opponentAbbrev: team2.team.abbreviation,
                    opponentName: team2.team.displayName,
                    isHome: team1.homeAway === 'home',
                    difficultyRank: 0 // Will fill later
                });
            }

            // Add to Team 2
            if (teamMap[team2.team.id]) {
                teamMap[team2.team.id].games.push({
                    week,
                    date: event.date,
                    opponentId: team1.team.id,
                    opponentAbbrev: team1.team.abbreviation,
                    opponentName: team1.team.displayName,
                    isHome: team2.homeAway === 'home',
                    difficultyRank: 0 // Will fill later
                });
            }
        });
    });

    // Handle Bye Weeks (missing games)
    // If a team has no game for a week in range, we might want to insert a BYE marker?
    // The UI can handle missing weeks or we can pad them.

    return Object.values(teamMap);
};

export const getDifficultyColor = (rank: number): string => {
    // Rank 1-32. 
    // 1 (Hardest) -> Red
    // 32 (Easiest) -> Green
    
    // User Spec:
    // #2ECC71 (Deep Green): 28-32 (Easy)
    // #ABEBC6 (Light Green): 20-27
    // #F7F9F9 (Grey): 13-19
    // #FAD7A0 (Orange): 6-12
    // #E74C3C (Red): 1-5 (Hard)

    if (rank >= 28) return '#2ECC71';
    if (rank >= 20) return '#ABEBC6';
    if (rank >= 13) return '#F7F9F9'; // Actually grey might be too light for text? Using user spec.
    if (rank >= 6) return '#FAD7A0';
    return '#E74C3C';
};
