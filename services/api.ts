import { Match, MatchStatus } from '../types';
import { formatDateForApi } from '../utils';

// Helper to determine match status from ESPN data
const getMatchStatus = (status: any): MatchStatus => {
  const state = status?.type?.state;
  if (state === 'pre') return 'SCHEDULED';
  if (state === 'in') return 'LIVE';
  if (state === 'post') return 'FINISHED';
  return 'SCHEDULED';
};

// Helper to format minute
const getMinute = (status: any) => {
  if (status?.type?.state !== 'in') return undefined;
  return status?.displayClock || status?.period;
};

// Transform API data to our Match interface
const transformEspnEvent = (event: any, leagueId: string): Match => {
  const competition = event.competitions[0];
  const competitors = competition.competitors;
  const home = competitors.find((c: any) => c.homeAway === 'home');
  const away = competitors.find((c: any) => c.homeAway === 'away');

  return {
    id: event.id,
    leagueId: leagueId,
    homeTeam: {
      id: home.id,
      name: home.team.shortDisplayName || home.team.displayName, // Use shortDisplayName
      shortName: home.team.abbreviation,
      logo: home.team.logo || '',
    },
    awayTeam: {
      id: away.id,
      name: away.team.shortDisplayName || away.team.displayName, // Use shortDisplayName
      shortName: away.team.abbreviation,
      logo: away.team.logo || '',
    },
    homeScore: parseInt(home.score || '0'),
    awayScore: parseInt(away.score || '0'),
    status: getMatchStatus(event.status),
    minute: getMinute(event.status),
    startTime: new Date(event.date), // JavaScript Date handles ISO strings correctly
    stadium: competition.venue?.fullName || 'Unknown Venue',
  };
};

export const fetchMatches = async (leagueId: string, date: Date): Promise<Match[]> => {
  const dateStr = formatDateForApi(date);
  let url = '';

  // Handle duplicate ID for "TOP" (Premier League default)
  const queryId = leagueId === 'top' ? 'eng.1' : leagueId;

  if (queryId === 'nba') {
    url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
  } else {
    // Soccer
    url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${queryId}/scoreboard?dates=${dateStr}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    
    // Safety check for events
    if (!data.events) return [];

    return data.events.map((event: any) => transformEspnEvent(event, leagueId));
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return [];
  }
};
