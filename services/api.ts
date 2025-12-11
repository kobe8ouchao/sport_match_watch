import { MatchStatus, MatchDetailData, MatchEvent, MatchStat, PlayerStat } from '../types';
import { formatDateForApi } from '../utils';
import { MatchWithHot } from '../constants';

export interface MatchesResponse {
  matches: MatchWithHot[];
  calendar: { date: Date; sport: 'basketball' | 'soccer'; leagueId: string }[];
}

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
const transformEspnEvent = (event: any, leagueId: string): MatchWithHot => {
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
      linescores: home.linescores,
    },
    awayTeam: {
      id: away.id,
      name: away.team.shortDisplayName || away.team.displayName, // Use shortDisplayName
      shortName: away.team.abbreviation,
      logo: away.team.logo || '',
      linescores: away.linescores,
    },
    homeScore: parseInt(home.score || '0'),
    awayScore: parseInt(away.score || '0'),
    status: getMatchStatus(event.status),
    minute: getMinute(event.status),
    startTime: new Date(event.date), // JavaScript Date handles ISO strings correctly
    stadium: competition.venue?.fullName || 'Unknown Venue',
  };
};

const leagueBanner: Record<string, string> = {
  nba: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1600&auto=format&fit=crop',
  'eng.1': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1600&auto=format&fit=crop',
  'esp.1': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1600&auto=format&fit=crop',
  'ita.1': 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=1600&auto=format&fit=crop',
  'ger.1': 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1600&auto=format&fit=crop',
  'fra.1': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1600&auto=format&fit=crop',
};

const attachBanner = (matches: MatchWithHot[]): MatchWithHot[] => {
  return matches.map(m => ({
    ...m,
    bannerImage: m.bannerImage || leagueBanner[m.leagueId] || leagueBanner['eng.1'],
  }));
};

export const fetchMatches = async (leagueId: string, date: Date): Promise<MatchesResponse> => {
  const dateStr = formatDateForApi(date);

  // If "top" fetch upcoming matches (today and tomorrow)
  if (leagueId === 'top') {
    const leaguesToFetch = [
      'nba',
      'eng.1', // Premier League
      'esp.1', // La Liga
      'ita.1', // Serie A
      'ger.1', // Bundesliga
      'fra.1', // Ligue 1
      'uefa.champions' // UCL
    ];

    try {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      // Fetch matches for today AND tomorrow for all leagues
      const results = await Promise.all(
        leaguesToFetch.flatMap(id => [
          fetchMatches(id, today),
          fetchMatches(id, tomorrow)
        ])
      );

      const allMatches = results.flatMap(r => r.matches);
      // We don't really need to merge calendars for "top" view extensively but we can if we want dots
      // However, "top" might be treated as a special list.
      // Let's just return unique calendar entries from results.
      const allCalendar = results.flatMap(r => r.calendar);

      // Sort: Live first, then by time
      const sortedMatches = allMatches.sort((a, b) => {
        if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
        if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
        return a.startTime.getTime() - b.startTime.getTime();
      });

      return {
        matches: sortedMatches,
        calendar: allCalendar
      };
    } catch (error) {
      console.error("Failed to fetch mixed matches:", error);
      return { matches: [], calendar: [] };
    }
  }

  let url = '';
  const queryId = leagueId;

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

    // Calendar dates from API (if provided)
    const calendar: { date: Date; sport: 'basketball' | 'soccer'; leagueId: string }[] =
      Array.isArray(data?.leagues?.[0]?.calendar)
        ? data.leagues[0].calendar.map((c: string) => ({
          date: new Date(c),
          sport: leagueId === 'nba' ? 'basketball' : 'soccer',
          leagueId,
        }))
        : [];

    // Safety check for events
    if (!data.events) return { matches: [], calendar };

    const matches = data.events.map((event: any) => transformEspnEvent(event, leagueId));
    return { matches: attachBanner(matches), calendar };
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return { matches: [], calendar: [] };
  }
};

export const fetchMatchDetails = async (matchId: string, leagueId: string): Promise<MatchDetailData | null> => {
  const sport = leagueId === 'nba' ? 'basketball' : 'soccer';

  let url = '';
  if (sport === 'basketball') {
    url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${matchId}`;
  } else {
    url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/summary?event=${matchId}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch details');
    const data = await response.json();

    // Transform data
    // header contains the same info as an event in scoreboard
    const header = data.header;

    // Sometimes header doesn't contain all competition info like in scoreboard
    // We need to map it carefully. 
    // NOTE: summary endpoint structure is slightly different for team logos sometimes

    const competition = header.competitions[0];
    const competitors = competition.competitors;
    const home = competitors.find((c: any) => c.homeAway === 'home');
    const away = competitors.find((c: any) => c.homeAway === 'away');

    const baseMatch: MatchWithHot = {
      id: header.id,
      leagueId: leagueId,
      homeTeam: {
        id: home.id,
        name: home.team.shortDisplayName,
        shortName: home.team.abbreviation || home.team.shortDisplayName,
        logo: home.team.logos?.[0]?.href || home.team.logo || '',
        linescores: home.linescores,
      },
      awayTeam: {
        id: away.id,
        name: away.team.shortDisplayName,
        shortName: away.team.abbreviation || away.team.shortDisplayName,
        logo: away.team.logos?.[0]?.href || away.team.logo || '',
        linescores: away.linescores,
      },
      homeScore: parseInt(home.score || '0'),
      awayScore: parseInt(away.score || '0'),
      status: getMatchStatus(header.status || competition.status),
      minute: getMinute(header.status || competition.status),
      startTime: new Date(header.date || competition.date),
      stadium: data.gameInfo?.venue?.fullName || competition.venue?.fullName || 'Unknown Venue',
    };

    // Extract Details (Events) - Primary source for Soccer Timeline
    // Use keyEvents first if available, otherwise details
    const eventsSource = data.keyEvents || header.competitions?.[0]?.details || [];

    const events: MatchEvent[] = eventsSource.map((d: any, index: number) => {
      const typeText = d.type?.text || d.text || 'Unknown';
      const rawParticipants = d.participants || d.athletesInvolved || [];
      const participants = rawParticipants.map((p: any, idx: number) => {
        const name = p.athlete?.shortName || p.athlete?.displayName || p.shortName || p.displayName || '';
        let role = p.role?.text || p.role || p.type?.text || '';
        const lowerType = String(typeText).toLowerCase();
        if (!role) {
          if (lowerType.includes('substitution')) role = idx === 0 ? 'out' : 'in';
          else if (lowerType.includes('goal')) role = idx === 0 ? 'scorer' : 'assist';
        }
        return { name, role };
      });

      const assistName = participants.find(p => String(p.role).toLowerCase().includes('assist'))?.name
        || (participants.length > 1 ? participants[1].name : undefined);

      return {
        id: d.id || `event-${index}`,
        type: typeText,
        minute: d.clock?.displayValue || d.time?.displayValue || '',
        teamId: d.team?.id || '',
        player: participants[0]?.name || '',
        assist: assistName,
        participants
      };
    });

    // Extract Statistics
    // data.boxscore.teams contains statistical comparison
    const boxscoreTeams = data.boxscore?.teams || [];
    const homeStatsRaw = boxscoreTeams.find((t: any) => t.team.id === baseMatch.homeTeam.id)?.statistics || [];
    const awayStatsRaw = boxscoreTeams.find((t: any) => t.team.id === baseMatch.awayTeam.id)?.statistics || [];

    const statsMap = new Map<string, MatchStat>();

    homeStatsRaw.forEach((s: any) => {
      statsMap.set(s.name, {
        name: s.label || s.name,
        homeValue: s.displayValue,
        awayValue: '0',
        isPercentage: typeof s.displayValue === 'string' && s.displayValue.includes('%')
      });
    });

    awayStatsRaw.forEach((s: any) => {
      const stat = statsMap.get(s.name);
      if (stat) {
        stat.awayValue = s.displayValue;
      } else {
        statsMap.set(s.name, {
          name: s.label || s.name,
          homeValue: '0',
          awayValue: s.displayValue,
          isPercentage: typeof s.displayValue === 'string' && s.displayValue.includes('%')
        });
      }
    });

    const stats = Array.from(statsMap.values());

    // Extract Player Statistics (Rosters)
    const rosters = data.rosters || data.boxscore?.players || [];

    const processRoster = (teamId: string): PlayerStat[] => {
      const teamRoster = rosters.find((r: any) => String(r.team?.id) === String(teamId));
      if (!teamRoster) return [];

      const players: PlayerStat[] = [];

      if (Array.isArray(teamRoster.statistics)) {
        teamRoster.statistics.forEach((group: any) => {
          const labels = group.labels || [];
          const athletes = group.athletes || [];
          athletes.forEach((athleteEntry: any) => {
            const athlete = athleteEntry.athlete;
            const statValues = athleteEntry.stats || [];
            const statObj: Record<string, string> = {};
            labels.forEach((label: string, idx: number) => {
              statObj[label] = statValues[idx];
            });
            players.push({
              id: athlete.id,
              name: athlete.shortName || athlete.displayName,
              position: athlete.position?.abbreviation || '',
              positionName: athlete.position?.displayName || athlete.position?.name || '',
              jersey: athlete.jersey || '',
              stats: statObj,
              isStarter: typeof athleteEntry.starter === 'boolean' ? athleteEntry.starter : (group.name === 'starters' || group.name === 'starter'),
              headshot: athlete.headshot?.href
            });
          });
        });
      } else if (Array.isArray(teamRoster.roster)) {
        teamRoster.roster.forEach((entry: any) => {
          const athlete = entry.athlete || {};
          const pos = entry.position || {};
          const labels = entry.labels || []; // sometimes provided
          const statsArr = entry.stats || [];
          const statObj: Record<string, string> = {};

          if (Array.isArray(statsArr)) {
            statsArr.forEach((s: any) => {
              const key = s.name || s.label;
              const val = s.displayValue ?? s.value ?? s.stat;
              if (key) statObj[key] = String(val ?? '');
            });
          } else if (statsArr && typeof statsArr === 'object') {
            Object.keys(statsArr).forEach(k => {
              statObj[k] = String(statsArr[k]);
            });
          }

          players.push({
            id: athlete.id,
            name: athlete.shortName || athlete.displayName,
            position: pos.abbreviation || '',
            positionName: pos.displayName || pos.name || '',
            jersey: entry.jersey || athlete.jersey || '',
            stats: statObj,
            isStarter: !!entry.starter,
            active: !!entry.active,
            formationPlace: typeof entry.formationPlace === 'number' ? entry.formationPlace : undefined,
            subbedIn: !!entry.subbedIn,
            subbedOut: !!entry.subbedOut,
            headshot: athlete.headshot?.href
          });
        });
      }

      return players;
    };

    const homePlayers = processRoster(baseMatch.homeTeam.id);
    const awayPlayers = processRoster(baseMatch.awayTeam.id);

    return {
      ...baseMatch,
      events,
      stats,
      homePlayers,
      awayPlayers
    };

  } catch (error) {
    console.error("Error fetching match details:", error);
    return null;
  }
};
