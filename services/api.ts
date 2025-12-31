import { MatchStatus, MatchDetailData, MatchEvent, MatchStat, PlayerStat, StandingEntry, PlayerStatCategory, Article } from '../types';
import { formatDateForApi, isSameDay } from '../utils';
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
  nfl: 'https://images.unsplash.com/photo-1597481929652-9bdc374e8f81?q=80&w=1931&auto=format&fit=crop',
  'eng.1': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1600&auto=format&fit=crop',
  'esp.1': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1600&auto=format&fit=crop',
  'ita.1': 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=1600&auto=format&fit=crop',
  'ger.1': 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1600&auto=format&fit=crop',
  'fra.1': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1600&auto=format&fit=crop',
  'esp.copa_del_rey': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1600&auto=format&fit=crop',
  'ita.coppa_italia': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2192.png',
  'eng.fa': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1600&auto=format&fit=crop',
};

const attachBanner = (matches: MatchWithHot[]): MatchWithHot[] => {
  return matches.map(m => ({
    ...m,
    bannerImage: m.bannerImage || leagueBanner[m.leagueId] || leagueBanner['eng.1'],
  }));
};

const LEAGUE_TIMEZONES: Record<string, string> = {
  'nba': 'America/New_York',
  'nfl': 'America/New_York',
  'eng.1': 'Europe/London',
  'esp.1': 'Europe/Madrid',
  'ita.1': 'Europe/Rome',
  'ger.1': 'Europe/Berlin',
  'fra.1': 'Europe/Paris',
  'uefa.champions': 'Europe/Paris',
  'esp.copa_del_rey': 'Europe/Madrid',
  'ita.coppa_italia': 'Europe/Rome',
  'eng.fa': 'Europe/London',
};

// Helper to format date for specific league timezone
const formatDateForLeague = (date: Date, timezone: string): string => {
  const d = new Date(date);
  // Set to noon to represent the "day" robustly regardless of timezone shift at midnight
  d.setHours(12, 0, 0, 0);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(d);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  return `${year}${month}${day}`;
};

export const fetchMatches = async (leagueId: string, date: Date): Promise<MatchesResponse> => {
  // If "top" fetch matches for the selected date across top leagues
  if (leagueId === 'top') {
    const leaguesToFetch = [
      'nba',
      'nfl',
      'eng.1', // Premier League
      'esp.1', // La Liga
      'ita.1', // Serie A
      'ger.1', // Bundesliga
      'fra.1', // Ligue 1
      'uefa.champions', // UCL
      'uefa.europa', // Europa League
      'uefa.europa.conf', // Conference League
      'esp.copa_del_rey', // Copa del Rey
      'ita.coppa_italia', // Coppa Italia
      'eng.fa' // FA Cup
    ];

    try {
      // Fetch matches for the selected date for all leagues
      // Note: Recursive calls will handle timezone/date filtering logic
      const results = await Promise.all(
        leaguesToFetch.map(id => fetchMatches(id, date))
      );

      const allMatches = results.flatMap(r => r.matches);
      
      // Merge and deduplicate calendar entries
      const allCalendar = results.flatMap(r => r.calendar);
      // Optional: Deduplicate calendar if needed, but for now flatMap is fine
      // or we could use a Map to unique by date+league

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

  // Helper to fetch matches for a single date
  const fetchForDate = async (d: Date): Promise<MatchesResponse> => {
    let url = '';
    const queryId = leagueId;
    const timezone = LEAGUE_TIMEZONES[queryId];
    const queryDateStr = timezone ? formatDateForLeague(d, timezone) : formatDateForApi(d);

    if (queryId === 'nba') {
      url = `/api/espn/site/sports/basketball/nba/scoreboard?dates=${queryDateStr}`;
    } else if (queryId === 'nfl') {
      url = `/api/espn/site/sports/football/nfl/scoreboard?dates=${queryDateStr}`;
    } else {
      url = `/api/espn/site/sports/soccer/${queryId}/scoreboard?dates=${queryDateStr}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        // Silently fail for individual dates
        return { matches: [], calendar: [] };
      }
      const data = await response.json();

      const calendar: { date: Date; sport: 'basketball' | 'soccer'; leagueId: string }[] =
        Array.isArray(data?.leagues?.[0]?.calendar)
          ? data.leagues[0].calendar.map((c: string) => ({
            date: new Date(c),
            sport: leagueId === 'nba' ? 'basketball' : (leagueId === 'nfl' ? 'football' : 'soccer'),
            leagueId,
          }))
          : [];

      if (!data.events) return { matches: [], calendar };

      const matches = data.events.map((event: any) => transformEspnEvent(event, leagueId));
      return { matches: attachBanner(matches), calendar };
    } catch (error) {
      console.error(`Failed to fetch matches for ${queryDateStr}:`, error);
      return { matches: [], calendar: [] };
    }
  };

  // Fetch for current date and previous date to cover timezone overlaps
  // especially for "early morning" games (which might be "yesterday" in league time)
  const prevDate = new Date(date);
  prevDate.setDate(date.getDate() - 1);

  try {
    const [current, previous] = await Promise.all([
      fetchForDate(date),
      fetchForDate(prevDate)
    ]);

    // Merge and deduplicate matches
    const allMatches = [...current.matches, ...previous.matches];
    const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());

    // Filter by local date
    const filteredMatches = uniqueMatches.filter(m => isSameDay(m.startTime, date));

    // Merge calendars
    const allCalendar = [...current.calendar, ...previous.calendar];

    return { matches: filteredMatches, calendar: allCalendar };
  } catch (error) {
    console.error("Error in fetchMatches strategy:", error);
    return { matches: [], calendar: [] };
  }
};

const fetchNbaTeamRecord = async (teamId: string): Promise<string> => {
  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}`);
    if (!response.ok) return '';
    const data = await response.json();
    
    if (data.team?.record?.items && Array.isArray(data.team.record.items)) {
         const overall = data.team.record.items.find((r: any) => r.type === 'total' || r.description === 'Overall Record');
         return overall?.summary || '';
    }
    return '';
  } catch (error) {
    console.error(`Error fetching team record for ${teamId}:`, error);
    return '';
  }
};

export const fetchMatchDetails = async (matchId: string, leagueId: string): Promise<MatchDetailData | null> => {
  const sport = leagueId === 'nba' ? 'basketball' : (leagueId === 'nfl' ? 'football' : 'soccer');

  let url = '';
  if (sport === 'basketball') {
    url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${matchId}`;
  } else if (sport === 'football') {
    url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${matchId}`;
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

    const getRecord = (competitor: any) => {
        if (competitor.record && typeof competitor.record === 'string') return competitor.record;
        
        if (competitor.record && typeof competitor.record === 'object' && Array.isArray(competitor.record.items)) {
             const overall = competitor.record.items.find((r: any) => r.type === 'total' || r.description === 'Overall Record');
             return overall?.summary || '';
        }

        if (competitor.standingSummary && typeof competitor.standingSummary === 'string') return competitor.standingSummary;

        if (Array.isArray(competitor.records)) {
            const overall = competitor.records.find((r: any) => r.type === 'total' || r.name === 'overall');
            return overall?.summary || '';
        }
        return '';
    };

    const baseMatch: MatchWithHot = {
      id: header.id,
      leagueId: leagueId,
      homeTeam: {
        id: home.id,
        name: home.team.shortDisplayName || home.team.displayName || home.team.name || 'Home Team',
        shortName: home.team.abbreviation || home.team.shortDisplayName || home.team.displayName || 'Home',
        logo: home.team.logos?.[0]?.href || home.team.logo || '',
        linescores: home.linescores,
        record: getRecord(home),
      },
      awayTeam: {
        id: away.id,
        name: away.team.shortDisplayName || away.team.displayName || away.team.name || 'Away Team',
        shortName: away.team.abbreviation || away.team.shortDisplayName || away.team.displayName || 'Away',
        logo: away.team.logos?.[0]?.href || away.team.logo || '',
        linescores: away.linescores,
        record: getRecord(away),
      },
      homeScore: parseInt(home.score || '0'),
      awayScore: parseInt(away.score || '0'),
      status: getMatchStatus(header.status || competition.status),
      minute: getMinute(header.status || competition.status),
      startTime: new Date(header.date || competition.date),
      stadium: data.gameInfo?.venue?.fullName || competition.venue?.fullName || 'Unknown Venue',
    };

    // Fetch records if missing for NBA
    if (leagueId === 'nba') {
        const promises = [];
        if (!baseMatch.homeTeam.record) {
            promises.push(fetchNbaTeamRecord(baseMatch.homeTeam.id).then(r => { if (r) baseMatch.homeTeam.record = r; }));
        }
        if (!baseMatch.awayTeam.record) {
            promises.push(fetchNbaTeamRecord(baseMatch.awayTeam.id).then(r => { if (r) baseMatch.awayTeam.record = r; }));
        }
        if (promises.length > 0) {
            await Promise.all(promises);
        }
    }

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
        text: d.text || d.shortText || '',
        minute: d.clock?.displayValue || d.time?.displayValue || '',
        teamId: d.team?.id || '',
        player: participants[0]?.name || '',
        assist: assistName,
        participants
      };
    });

    // Extract NFL Specifics
    const drives = data.drives?.previous?.map((d: any) => ({
      id: d.id,
      description: d.description,
      start: {
        yardLine: d.start?.yardLine,
        teamId: d.start?.team?.id,
        text: d.start?.text,
        time: d.start?.clock?.displayValue
      },
      end: {
        yardLine: d.end?.yardLine,
        teamId: d.end?.team?.id,
        text: d.end?.text,
        time: d.end?.clock?.displayValue
      },
      timeElapsed: d.timeElapsed?.displayValue,
      yards: d.yards,
      result: d.result,
      plays: d.offensivePlays,
      team: {
        id: d.team?.id,
        shortDisplayName: d.team?.shortDisplayName || d.team?.displayName,
        logo: d.team?.logos?.[0]?.href
      }
    })) || [];

    const scoringPlays = data.scoringPlays?.map((p: any) => ({
      id: p.id,
      type: p.type,
      text: p.text,
      scoreValue: p.scoreValue,
      team: p.team,
      period: p.period,
      clock: p.clock,
      awayScore: p.awayScore,
      homeScore: p.homeScore
    })) || [];

    const winProbability = data.winProbability?.map((w: any) => ({
      homeWinPercentage: w.homeWinPercentage,
      playId: w.playId,
      tiePercentage: w.tiePercentage,
      secondsLeft: w.secondsLeft
    })) || [];

    const gameInfo = data.gameInfo;

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
              headshot: athlete.headshot?.href,
              category: group.name
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
      awayPlayers,
      drives,
      scoringPlays,
      winProbability,
      gameInfo
    };

  } catch (error) {
    console.error("Error fetching match details:", error);
    return null;
  }
};

export const fetchStandings = async (leagueId: string): Promise<StandingEntry[]> => {
  let url = '';
  const isNba = leagueId === 'nba';
  const isNfl = leagueId === 'nfl';

  if (isNba) {
    url = `https://site.api.espn.com/apis/v2/sports/basketball/nba/standings`;
  } else if (isNfl) {
    url = `https://site.api.espn.com/apis/v2/sports/football/nfl/standings`;
  } else {
    url = `https://site.api.espn.com/apis/v2/sports/soccer/${leagueId}/standings`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch standings');
    const data = await response.json();

    const result: StandingEntry[] = [];
    const children = data.children || []; // Sometimes top level has children

    // Flatten logic for NBA which has conferences/divisions
    // Usually NBA response: children[0] (East) -> standings, children[1] (West) -> standings
    // Or sometimes just children -> standings entries directly if minimal param used
    // Let's recursively find "standings" entries or "entries"

    // Helper to process a "standings" array
    const processEntries = (entries: any[], groupName?: string) => {
      entries.forEach((entry: any) => {
        const team = entry.team;
        const stats = entry.stats || [];

        const getStat = (name: string) => {
          const s = stats.find((x: any) => x.name === name || x.type === name);
          return s ? s.value : undefined;
        };

        const rank = parseInt(getStat('rank') || entry.seed || '0'); // seed for NBA usually nice, or rank

        // NBA Stats
        // wins, losses, winPercent, gamesBehind
        // Soccer Stats
        // wins, losses, ties, points, gamesPlayed, goalDiff, goalsFor, goalsAgainst

        const wins = parseInt(getStat('wins') || '0');
        const losses = parseInt(getStat('losses') || '0');

        let statsObj: any = {
          rank: rank || 0,
          wins,
          losses
        };

        if (isNba) {
          statsObj.winPct = parseFloat(getStat('winPercent') || '0');
          statsObj.gamesBehind = parseFloat(getStat('gamesBehind') || '0');
        } else if (isNfl) {
          statsObj.winPct = parseFloat(getStat('winPercent') || '0');
          statsObj.draws = parseInt(getStat('ties') || '0');
          statsObj.streak = getStat('streak') || '';
          statsObj.pf = parseInt(getStat('pointsFor') || '0');
          statsObj.pa = parseInt(getStat('pointsAgainst') || '0');
          statsObj.diff = parseInt(getStat('pointDifferential') || '0');
        } else {
          statsObj.draws = parseInt(getStat('ties') || '0');
          statsObj.points = parseInt(getStat('points') || '0');
          statsObj.gamesPlayed = parseInt(getStat('gamesPlayed') || '0');
          statsObj.goalDiff = parseInt(getStat('pointDifferential') || '0'); // Soccer uses pointDifferential for GD in API often
          statsObj.goalsFor = parseInt(getStat('pointsFor') || '0');
          statsObj.goalsAgainst = parseInt(getStat('pointsAgainst') || '0');
        }

        result.push({
          group: groupName,
          team: {
            id: team.id,
            name: team.displayName,
            shortName: team.shortDisplayName || team.abbreviation,
            logo: team.logos?.[0]?.href || ''
          },
          stats: statsObj
        });
      });
    };

    // Traverse logic
    const traverse = (node: any, paramGroupName?: string) => {
      const currentGroupName = node.name || paramGroupName;
      if (node.standings && node.standings.entries) {
        processEntries(node.standings.entries, currentGroupName);
      } else if (node.children) {
        node.children.forEach((child: any) => traverse(child, currentGroupName));
      }
    };

    traverse(data);

    // Sort by rank if available, otherwise points/winPct
    return result.sort((a, b) => {
      if (a.stats.rank && b.stats.rank) return a.stats.rank - b.stats.rank;
      if (isNba) return (b.stats.winPct || 0) - (a.stats.winPct || 0);
      return (b.stats.points || 0) - (a.stats.points || 0);
    });

  } catch (error) {
    console.error(`Error fetching standings for ${leagueId}:`, error);
    return [];
  }
};

export const fetchPlayerStats = async (leagueId: string): Promise<PlayerStatCategory[]> => {
  let url = '';
  const isNba = leagueId === 'nba';

  if (isNba) {
    url = `https://site.web.api.espn.com/apis/site/v3/sports/basketball/nba/leaders?region=us&lang=en&contentorigin=espn&limit=5&qualified=true`;
  } else {
    url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/statistics`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch player stats');
    const data = await response.json();
    const categories: PlayerStatCategory[] = [];

    // NBA uses 'leaders.categories' structure
    // Soccer uses 'statistics' or 'stats' array at root
    let statsSource: any[] = [];

    if (isNba && data.leaders && data.leaders.categories) {
      statsSource = data.leaders.categories;
    } else {
      statsSource = data.statistics || data.stats || [];
    }

    // Filter interesting stats
    // We used to filter, but user requested ALL stats to be shown
    // Keeping the list just for reference or priority sorting if needed later
    /*
    const interestedStats = isNba
      ? ['points', 'rebounds', 'assists', 'steals', 'blocks']
      : ['goals', 'assists', 'yellow', 'red', 'shutouts', 'clean'];
    */

    statsSource.forEach((cat: any) => {
      // User requested all stats
      // const catName = (cat.name || '').toLowerCase();
      // if (!interestedStats.some(k => catName.includes(k))) return;

      // The user specified structure: cat.groups[0].athletes
       // But we should also support the old structure cat.leaders just in case
       // And the NEW NBA structure: cat.leaders (array of athletes directly)
       
       let leadersRaw: any[] = [];
       
       if (isNba) {
          // NBA V3 API structure: cat.leaders is the array of athletes
          leadersRaw = cat.leaders || [];
       } else {
          // Soccer Structure
          if (cat.groups && cat.groups.length > 0) {
             // Check for athletes first, then teams
             leadersRaw = cat.groups[0].athletes || cat.groups[0].teams || [];
          } else if (cat.leaders) {
             leadersRaw = cat.leaders;
          }
       }

      const leaders = leadersRaw.map((lead: any, idx: number) => {
        // Handle both Athlete (player) and Team structures
        // Player structure: lead.athlete, lead.statistics
        // Team structure: lead.team, lead.statistics
        // Old structure: lead.athlete, lead.value/displayValue directly
        
        const entity = lead.athlete || lead.team || {};
        const isTeam = !!lead.team && !lead.athlete; // If it's a team leaderboard
        
        // Value extraction
        let displayValue = lead.displayValue;
        let value = lead.value;

        // User specified: statistics[].displayValue
        if (lead.statistics && lead.statistics.length > 0) {
            displayValue = lead.statistics[0].displayValue;
            value = lead.statistics[0].value;
        }

        // Clean up displayValue if it's too verbose (e.g., "Matches: 15, Goals: 15")
        // We prefer just the number if possible, or try to extract it
        if (displayValue && displayValue.includes(':')) {
            // Try to find the relevant number at the end or matching the category
            // But simpler is to rely on 'value' if available and format it, 
            // OR just show the number if value is present.
            // However, sometimes value is raw (e.g. 15.0).
            if (value !== undefined) {
                displayValue = String(value);
            } else {
                // Fallback: extract last number
                const match = displayValue.match(/(\d+)$/);
                if (match) displayValue = match[1];
            }
        }

        // For team leaderboards, entity is the team itself
        // For player leaderboards, entity is the athlete, and athlete.team contains team info
        
        const id = entity.id;
        const name = entity.displayName || entity.shortName || entity.name || '';
        const headshot = entity.headshot?.href || entity.logo || entity.logos?.[0]?.href || ''; // Team uses logo
        
        // Team info for players
        let teamName = '';
        let teamLogo = '';
        
        if (!isTeam && entity.team) {
            teamName = entity.team.abbreviation || entity.team.shortDisplayName || '';
            teamLogo = entity.team.logos?.[0]?.href || entity.team.logo || '';
        } else if (isTeam) {
            // It is a team, so we don't have a "parent team"
             teamName = entity.abbreviation || entity.shortDisplayName || '';
             teamLogo = entity.logos?.[0]?.href || '';
        }

        // Special handling for NBA V3 structure
        // The team info might be directly on 'lead.team' instead of 'lead.athlete.team'
        if (isNba && lead.team) {
             teamName = lead.team.abbreviation || lead.team.shortDisplayName || '';
             teamLogo = lead.team.logos?.[0]?.href || lead.team.logo || '';
        }

        return {
          id,
          name,
          team: teamName,
          teamLogo,
          headshot,
          value: value || 0,
          rank: lead.rank || (idx + 1),
          displayValue: displayValue || String(value || '')
        };
      });

      categories.push({
        name: cat.name,
        displayName: cat.displayName || cat.header || cat.name,
        leaders
      });
    });

    return categories;

  } catch (error) {
    console.error(`Error fetching player stats for ${leagueId}:`, error);
    return [];
  }
};

export const fetchNews = async (leagueId: string, matchId?: string): Promise<Article[]> => {
  // Handle "top" request - fetch news from major leagues and combine
  if (leagueId === 'top') {
    const leaguesToFetch = [
      'nba',
      'nfl',
      'eng.1', // Premier League
      'esp.1', // La Liga
      'uefa.champions', // UCL
    ];

    try {
      const results = await Promise.all(
        leaguesToFetch.map(id => fetchNews(id))
      );
      
      const allArticles = results.flat();
      
      // Sort by date descending
      return allArticles.sort((a, b) => 
        new Date(b.published).getTime() - new Date(a.published).getTime()
      );
    } catch (error) {
      console.error('Error fetching top news:', error);
      return [];
    }
  }

  let endpoint = '';
  if (leagueId === 'nba') {
    endpoint = 'basketball/nba';
  } else if (leagueId === 'nfl') {
    endpoint = 'football/nfl';
  } else {
    endpoint = `soccer/${leagueId}`;
  }
  
  let url = `https://site.api.espn.com/apis/site/v2/sports/${endpoint}/news`;
  
  if (leagueId != 'nba' && leagueId != 'nfl' && matchId) {
    url += `?event=${matchId}`;
  }

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed to fetch news');
    const data = await resp.json();
    const articles = Array.isArray(data?.articles) ? data.articles : [];
    
    return articles.map((a: any) => ({
        headline: a.headline,
        description: a.description,
        published: a.published,
        link: a.links?.web?.href || a.links?.web?.self?.href || a.links?.api?.self?.href,
        images: a.images?.map((i: any) => ({ url: i.url })) || []
    }));
  } catch (error) {
    console.error(`Error fetching news for ${leagueId} ${matchId ? 'event ' + matchId : ''}:`, error);
    return [];
  }
};
