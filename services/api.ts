import { MatchStatus, MatchDetailData, MatchEvent, MatchStat, PlayerStat, StandingEntry, PlayerStatCategory, Article, TennisRankingPlayer, TennisTourEvent } from '../types';
import { formatDateForApi, isSameDay } from '../utils';
import { MatchWithHot } from '../constants';
import atpPlayer1000 from './atp-player1000.json';
import wtaPlayer1000 from './wta-player1000.json';

export interface MatchesResponse {
  matches: MatchWithHot[];
  calendar: { date: Date; sport: 'basketball' | 'soccer' | 'football' | 'tennis'; leagueId: string }[];
}

type TennisHeadshotMap = Map<string, string>;

interface AtpRankingEntry {
  Name?: string;
  UrlHeadshotImage?: string;
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

const getEntityName = (competitor: any) => {
  if (competitor?.athlete) return competitor.athlete.displayName || competitor.athlete.shortName;
  if (competitor?.team) return competitor.team.displayName || competitor.team.shortDisplayName || competitor.team.name;
  return 'Unknown';
};

const getEntityShortName = (competitor: any) => {
  if (competitor?.athlete) return competitor.athlete.shortName || competitor.athlete.displayName;
  if (competitor?.team) return competitor.team.shortDisplayName || competitor.team.abbreviation;
  return 'Unknown';
};

const getEntityLink = (competitor: any) => {
  return competitor?.athlete?.links?.find((link: any) =>
    Array.isArray(link?.rel) && link.rel.includes('athlete')
  )?.href;
};

const getImageHref = (image: any): string | undefined => {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  if (typeof image?.href === 'string') return image.href;
  return undefined;
};

const normalizeTennisPlayerName = (name?: string): string => {
  if (!name) return '';

  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const toAbsoluteUrl = (value?: string, base = 'https://www.atptour.com'): string | undefined => {
  if (!value) return undefined;

  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
};

const buildTennisNameAliases = (name?: string): string[] => {
  const normalized = normalizeTennisPlayerName(name);
  if (!normalized) return [];

  const parts = normalized.split(' ').filter(Boolean);
  const aliases = new Set<string>([normalized]);

  if (parts.length >= 2) {
    aliases.add(`${parts[0].charAt(0)} ${parts.slice(1).join(' ')}`.trim());
    aliases.add(parts.slice(1).join(' '));
  }

  return Array.from(aliases).filter(Boolean);
};

const getCompetitorNameCandidates = (competitor: any): string[] => {
  const rawNames = [
    competitor?.athlete?.displayName,
    competitor?.athlete?.fullName,
    competitor?.athlete?.shortName,
    getEntityName(competitor),
    getEntityShortName(competitor),
  ];

  const aliases = new Set<string>();
  rawNames.forEach((name) => {
    buildTennisNameAliases(name).forEach((alias) => aliases.add(alias));
  });

  return Array.from(aliases);
};

const ATP_HEADSHOT_MAP: TennisHeadshotMap = new Map(
  (Array.isArray(atpPlayer1000) ? atpPlayer1000 : []).flatMap((item: AtpRankingEntry) => {
    const headshotUrl = toAbsoluteUrl(item?.UrlHeadshotImage);

    if (!headshotUrl) return [];

    return buildTennisNameAliases(item?.Name).map((alias) => [alias, headshotUrl] as const);
  })
);

interface WtaRankingEntry {
  player?: {
    id?: number;
    fullName?: string;
  };
}

const WTA_HEADSHOT_MAP: TennisHeadshotMap = new Map(
  (Array.isArray(wtaPlayer1000) ? wtaPlayer1000 : []).flatMap((item: WtaRankingEntry) => {
    const playerId = item?.player?.id;
    const fullName = item?.player?.fullName;
    if (!playerId || !fullName) return [];

    const headshotUrl = `https://wtafiles.blob.core.windows.net/images/headshots/${playerId}.jpg`;
    return buildTennisNameAliases(fullName).map((alias) => [alias, headshotUrl] as const);
  })
);

const fetchAtpHeadshotMap = async (): Promise<TennisHeadshotMap> => ATP_HEADSHOT_MAP;
const fetchWtaHeadshotMap = async (): Promise<TennisHeadshotMap> => WTA_HEADSHOT_MAP;

const getAthleteId = (competitor: any): string | undefined => {
  const directId = competitor?.athlete?.id || competitor?.id;
  if (directId) return String(directId);

  const playerCardHref = competitor?.athlete?.links?.find((link: any) =>
    Array.isArray(link?.rel) && link.rel.includes('athlete')
  )?.href;
  const matchedId = typeof playerCardHref === 'string' ? playerCardHref.match(/\/id\/(\d+)\//)?.[1] : undefined;

  return matchedId;
};

const getTennisHeadshotById = (athleteId?: string): string | undefined => {
  if (!athleteId) return undefined;
  return `https://a.espncdn.com/i/headshots/tennis/players/full/${athleteId}.png`;
};

const getEntityLogo = (competitor: any) => {
  if (competitor?.athlete?.flag) return getImageHref(competitor.athlete.flag) || '';
  if (competitor?.team?.logo) return competitor.team.logo;
  return '';
};

const getEntityHeadshot = (
  competitor: any,
  options?: { leagueId?: string; tennisHeadshotMap?: TennisHeadshotMap }
) => {
  const espnHeadshot = getImageHref(competitor?.athlete?.headshot);
  if (espnHeadshot) return espnHeadshot;

  if ((options?.leagueId === 'tennis.atp' || options?.leagueId === 'tennis.wta') && options.tennisHeadshotMap) {
    for (const candidate of getCompetitorNameCandidates(competitor)) {
      const headshot = options.tennisHeadshotMap.get(candidate);
      if (headshot) return headshot;
    }
  }

  return getTennisHeadshotById(getAthleteId(competitor));
};

const getCompetitorScore = (competitor: any) => {
  if (competitor?.score !== undefined && competitor?.score !== null && competitor?.score !== '') {
    return parseInt(String(competitor.score), 10) || 0;
  }

  if (Array.isArray(competitor?.linescores) && competitor.linescores.length > 0) {
    return competitor.linescores.reduce((wins: number, set: any) => wins + (set?.winner ? 1 : 0), 0);
  }

  return 0;
};

const getVenueLabel = (competition: any, fallback?: string) => {
  const parts = [competition?.venue?.fullName, competition?.venue?.court].filter(Boolean);
  if (parts.length > 0) return parts.join(' - ');
  return fallback || 'Unknown Venue';
};

const getSetScores = (home: any, away: any) => {
  const homeSets = Array.isArray(home?.linescores) ? home.linescores : [];
  const awaySets = Array.isArray(away?.linescores) ? away.linescores : [];
  const totalSets = Math.max(homeSets.length, awaySets.length);

  const formatSetValue = (set: any) => {
    const baseValue = set?.displayValue ?? set?.value;
    if (baseValue === undefined || baseValue === null || baseValue === '') return '-';
    if (set?.tiebreak !== undefined && set?.tiebreak !== null && set?.tiebreak !== '') {
      return `${baseValue}(${set.tiebreak})`;
    }
    return baseValue;
  };

  return Array.from({ length: totalSets }, (_, index) => ({
    home: formatSetValue(homeSets[index]),
    away: formatSetValue(awaySets[index]),
  }));
};

const normalizeTennisPointScore = (value: any): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const stringValue = String(value).trim();
  if (!stringValue) return undefined;

  const upper = stringValue.toUpperCase();
  if (upper === 'ADV' || upper === 'AD' || upper === 'A') return 'Ad';
  return stringValue;
};

const getTennisLiveGameScore = (competition: any, home: any, away: any) => {
  const homeCandidates = [
    home?.pointScore,
    home?.currentGameScore,
    home?.gameScore,
    home?.statistics?.find?.((stat: any) => /point|game/i.test(String(stat?.name || stat?.label || '')))?.displayValue,
    competition?.situation?.homeScore,
    competition?.situation?.score?.home,
    competition?.situation?.lastPlay?.homeScore,
  ];

  const awayCandidates = [
    away?.pointScore,
    away?.currentGameScore,
    away?.gameScore,
    away?.statistics?.find?.((stat: any) => /point|game/i.test(String(stat?.name || stat?.label || '')))?.displayValue,
    competition?.situation?.awayScore,
    competition?.situation?.score?.away,
    competition?.situation?.lastPlay?.awayScore,
  ];

  const homeScore = homeCandidates.map(normalizeTennisPointScore).find(Boolean);
  const awayScore = awayCandidates.map(normalizeTennisPointScore).find(Boolean);

  if (!homeScore || !awayScore) return undefined;
  return { home: homeScore, away: awayScore };
};

const getTennisServingSide = (competition: any, home: any, away: any): 'home' | 'away' | undefined => {
  const servingIdCandidates = [
    competition?.situation?.servingCompetitorId,
    competition?.situation?.serving?.id,
    competition?.situation?.lastPlay?.servingCompetitorId,
    competition?.situation?.lastPlay?.serving?.id,
  ].map((value) => (value !== undefined && value !== null ? String(value) : undefined)).filter(Boolean);

  if (servingIdCandidates.includes(String(home?.id))) return 'home';
  if (servingIdCandidates.includes(String(away?.id))) return 'away';

  const homeServing = [home?.serving, home?.isServing, home?.hasServe].some((value) => value === true);
  const awayServing = [away?.serving, away?.isServing, away?.hasServe].some((value) => value === true);

  if (homeServing && !awayServing) return 'home';
  if (awayServing && !homeServing) return 'away';
  return undefined;
};

const normalizeMatchDuration = (value: any): string | undefined => {
  if (value === undefined || value === null) return undefined;

  const raw = String(value).trim();
  if (!raw) return undefined;

  const compact = raw.replace(/\s+/g, ' ');
  const hourMinuteMatch = compact.match(/(\d+)\s*h(?:ours?)?(?:\s*(\d+)\s*m(?:in(?:utes?)?)?)?/i);
  if (hourMinuteMatch) {
    const hours = hourMinuteMatch[1];
    const minutes = hourMinuteMatch[2];
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  const minuteOnlyMatch = compact.match(/^(\d+)\s*m(?:in(?:utes?)?)?$/i);
  if (minuteOnlyMatch) {
    return `${minuteOnlyMatch[1]}m`;
  }

  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(compact)) {
    const parts = compact.split(':').map((part) => parseInt(part, 10));
    if (parts.length === 2) {
      const [minutes, seconds] = parts;
      if (seconds === 0) return `${minutes}m`;
      return `${minutes}m`;
    }

    if (parts.length === 3) {
      const [hours, minutes] = parts;
      return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  return undefined;
};

const getTennisMatchDuration = (source: any): string | undefined => {
  const candidates = [
    source?.matchTime?.displayValue,
    source?.matchTime,
    source?.timeElapsed?.displayValue,
    source?.timeElapsed,
    source?.duration?.displayValue,
    source?.duration,
    source?.status?.displayClock,
    source?.status?.type?.detail,
    source?.status?.type?.shortDetail,
    source?.note,
    source?.notes?.[0]?.text,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeMatchDuration(candidate);
    if (normalized) return normalized;
  }

  return undefined;
};

const isTennisLeague = (leagueId: string) => leagueId === 'tennis.atp' || leagueId === 'tennis.wta';

const getTennisLeagueSlug = (leagueId: string): 'atp' | 'wta' => leagueId === 'tennis.wta' ? 'wta' : 'atp';

const getTennisSinglesSlug = (leagueId: string) => leagueId === 'tennis.wta' ? 'womens-singles' : 'mens-singles';

// Extract World Cup stage label from ESPN event data
const getWorldCupStageLabel = (event: any, leagueId: string): string | undefined => {
  if (leagueId !== 'fifa.world') return undefined;
  const competition = event?.competitions?.[0];

  // Try group name first (e.g. "Group A")
  const groupName = competition?.group?.name || competition?.group?.shortName;
  if (groupName) return groupName;

  // Try event shortName / name (e.g. "Round of 16", "Quarter Final")
  const eventName = event?.shortName || event?.name;
  if (eventName) return eventName;

  // Try competition type text
  const compType = competition?.type?.text;
  if (compType) return compType;

  return undefined;
};

// Transform API data to our Match interface
const transformEspnEvent = (event: any, leagueId: string): MatchWithHot | null => {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];
  const home = competitors.find((c: any) => c.homeAway === 'home');
  const away = competitors.find((c: any) => c.homeAway === 'away');

  if (!competition || !home || !away) return null;

  return {
    id: event.id,
    leagueId: leagueId,
    homeTeam: {
      id: home.id,
      name: getEntityName(home),
      shortName: getEntityShortName(home),
      logo: getEntityLogo(home),
      headshot: getEntityHeadshot(home),
      link: getEntityLink(home),
      linescores: home.linescores,
    },
    awayTeam: {
      id: away.id,
      name: getEntityName(away),
      shortName: getEntityShortName(away),
      logo: getEntityLogo(away),
      headshot: getEntityHeadshot(away),
      link: getEntityLink(away),
      linescores: away.linescores,
    },
    homeScore: getCompetitorScore(home),
    awayScore: getCompetitorScore(away),
    status: getMatchStatus(event.status),
    minute: getMinute(event.status),
    startTime: new Date(event.date), // JavaScript Date handles ISO strings correctly
    stadium: getVenueLabel(competition),
    tournamentName: getWorldCupStageLabel(event, leagueId),
  };
};

const transformTennisCompetition = (
  competition: any,
  leagueId: string,
  tournamentName?: string,
  tennisHeadshotMap?: TennisHeadshotMap
): MatchWithHot | null => {
  const competitors = competition?.competitors || [];
  const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
  const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

  if (!competition || !home || !away) return null;
  if (!home.athlete || !away.athlete) return null;
  if (competition?.type?.slug !== getTennisSinglesSlug(leagueId)) return null;

  return {
    id: competition.id,
    leagueId,
    homeTeam: {
      id: home.id,
      name: getEntityName(home),
      shortName: getEntityShortName(home),
      logo: getEntityLogo(home),
      headshot: getEntityHeadshot(home, { leagueId, tennisHeadshotMap }),
      linescores: home.linescores,
    },
    awayTeam: {
      id: away.id,
      name: getEntityName(away),
      shortName: getEntityShortName(away),
      logo: getEntityLogo(away),
      headshot: getEntityHeadshot(away, { leagueId, tennisHeadshotMap }),
      linescores: away.linescores,
    },
    homeScore: getCompetitorScore(home),
    awayScore: getCompetitorScore(away),
    status: getMatchStatus(competition.status),
    minute: getMinute(competition.status),
    startTime: new Date(competition.date || competition.startDate),
    stadium: getVenueLabel(competition, tournamentName),
    tournamentName,
    roundName: competition?.round?.displayName || competition?.type?.text,
    setScores: getSetScores(home, away),
    liveGameScore: getTennisLiveGameScore(competition, home, away),
    servingSide: getTennisServingSide(competition, home, away),
    matchDuration: getTennisMatchDuration(competition),
  };
};

const TENNIS_LOW_LEVEL_NAME_PATTERNS = [
  'challenger',
  'itf',
  '125k',
  'challenger tour',
  'world tennis tour',
];

const isTournamentLevel250OrAbove = (event: any): boolean => {
  if (event?.major === true) return true;

  const eventName = ((event?.name || '') + ' ' + (event?.shortName || '')).toLowerCase();
  for (const pattern of TENNIS_LOW_LEVEL_NAME_PATTERNS) {
    if (eventName.includes(pattern)) return false;
  }

  return true;
};

const extractTennisMatches = (events: any[], leagueId: string, tennisHeadshotMap?: TennisHeadshotMap): MatchWithHot[] => {
  return events
    .filter(isTournamentLevel250OrAbove)
    .flatMap((event: any) => {
      const groupedCompetitions = Array.isArray(event?.groupings)
        ? event.groupings.flatMap((group: any) => group?.competitions || [])
        : [];

      const directCompetitions = Array.isArray(event?.competitions) ? event.competitions : [];
      const competitions = groupedCompetitions.length > 0 ? groupedCompetitions : directCompetitions;

      return competitions
        .map((competition: any) => transformTennisCompetition(competition, leagueId, event.shortName || event.name, tennisHeadshotMap))
        .filter((match: MatchWithHot | null): match is MatchWithHot => Boolean(match));
    });
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
  'fifa.world': 'https://images.unsplash.com/photo-1522770179533-24471fcdba45?q=80&w=1600&auto=format&fit=crop',
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
  'fifa.world': 'America/New_York', // World Cup 2026 in USA/Canada/Mexico
  'tennis.atp': 'America/New_York', // default, ATP matches occur globally
  'tennis.wta': 'America/New_York',
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
      'fifa.world', // FIFA World Cup 2026
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
      'eng.fa', // FA Cup
      'tennis.atp', // ATP
      'tennis.wta', // WTA
    ];

    try {
      const results = await Promise.all(
        leaguesToFetch.map(id => fetchMatches(id, date))
      );

      const allMatches = results.flatMap(r => r.matches);
      const allCalendar = results.flatMap(r => r.calendar);

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
      url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${queryDateStr}`;
    } else if (queryId === 'nfl') {
      url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${queryDateStr}`;
    } else if (isTennisLeague(queryId)) {
      url = `https://site.api.espn.com/apis/site/v2/sports/tennis/${getTennisLeagueSlug(queryId)}/scoreboard?dates=${queryDateStr}`;
    } else {
      url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${queryId}/scoreboard?dates=${queryDateStr}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        // Silently fail for individual dates
        return { matches: [], calendar: [] };
      }
      const data = await response.json();

      const calendar: { date: Date; sport: 'basketball' | 'soccer' | 'football' | 'tennis'; leagueId: string }[] =
        Array.isArray(data?.leagues?.[0]?.calendar)
          ? data.leagues[0].calendar.map((c: string) => ({
            date: new Date(c),
            sport: leagueId === 'nba' ? 'basketball' : (leagueId === 'nfl' ? 'football' : (isTennisLeague(leagueId) ? 'tennis' : 'soccer')),
            leagueId,
          }))
          : [];

      if (!data.events) return { matches: [], calendar };

      const tennisHeadshotMap = leagueId === 'tennis.atp'
        ? await fetchAtpHeadshotMap()
        : leagueId === 'tennis.wta'
          ? await fetchWtaHeadshotMap()
          : undefined;

      const matches = isTennisLeague(leagueId)
        ? extractTennisMatches(data.events, leagueId, tennisHeadshotMap)
        : data.events
            .map((event: any) => transformEspnEvent(event, leagueId))
            .filter((match: MatchWithHot | null): match is MatchWithHot => Boolean(match));

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

const buildTennisMonthRange = (date: Date) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${start.getUTCFullYear()}${pad(start.getUTCMonth() + 1)}${pad(start.getUTCDate())}-${end.getUTCFullYear()}${pad(end.getUTCMonth() + 1)}${pad(end.getUTCDate())}`;
};

const fetchTennisFallbackMatchDetails = async (matchId: string, leagueId: string): Promise<MatchDetailData | null> => {
  const tennisHeadshotMap = leagueId === 'tennis.atp'
    ? await fetchAtpHeadshotMap()
    : leagueId === 'tennis.wta'
      ? await fetchWtaHeadshotMap()
      : undefined;

  const monthAnchors = [-1, 0, 1].map((offset) => {
    const date = new Date();
    date.setUTCMonth(date.getUTCMonth() + offset);
    return date;
  });

  for (const anchor of monthAnchors) {
    try {
      const range = buildTennisMonthRange(anchor);
      const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/tennis/${getTennisLeagueSlug(leagueId)}/scoreboard?dates=${range}`);
      if (!response.ok) continue;

      const scoreboard = await response.json();
      const eventEntry = (scoreboard?.events || []).find((event: any) => {
        const groupedCompetitions = Array.isArray(event?.groupings)
          ? event.groupings.flatMap((group: any) => group?.competitions || [])
          : [];
        const directCompetitions = Array.isArray(event?.competitions) ? event.competitions : [];
        const competitions = groupedCompetitions.length > 0 ? groupedCompetitions : directCompetitions;

        return competitions.some((competition: any) => String(competition?.id) === String(matchId));
      });

      if (!eventEntry) continue;

      const groupedCompetitions = Array.isArray(eventEntry?.groupings)
        ? eventEntry.groupings.flatMap((group: any) => group?.competitions || [])
        : [];
      const directCompetitions = Array.isArray(eventEntry?.competitions) ? eventEntry.competitions : [];
      const competitions = groupedCompetitions.length > 0 ? groupedCompetitions : directCompetitions;
      const competition = competitions.find((item: any) => String(item?.id) === String(matchId));
      if (!competition) continue;

      const competitors = competition?.competitors || [];
      const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
      const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];
      if (!home || !away) continue;

      return {
        id: String(competition.id),
        leagueId,
        homeTeam: {
          id: home.id,
          name: getEntityName(home),
          shortName: getEntityShortName(home),
          logo: getEntityLogo(home),
          headshot: getEntityHeadshot(home, { leagueId, tennisHeadshotMap }),
          link: getEntityLink(home),
          linescores: home.linescores,
        },
        awayTeam: {
          id: away.id,
          name: getEntityName(away),
          shortName: getEntityShortName(away),
          logo: getEntityLogo(away),
          headshot: getEntityHeadshot(away, { leagueId, tennisHeadshotMap }),
          link: getEntityLink(away),
          linescores: away.linescores,
        },
        homeScore: getCompetitorScore(home),
        awayScore: getCompetitorScore(away),
        status: getMatchStatus(competition.status),
        minute: getMinute(competition.status),
        startTime: new Date(competition.date || competition.startDate || eventEntry.date),
        stadium: competition?.venue?.fullName || eventEntry?.name || 'Unknown Venue',
        court: competition?.venue?.court,
        tournamentName: eventEntry?.shortName || eventEntry?.name,
        roundName: competition?.round?.displayName || competition?.type?.text,
        setScores: getSetScores(home, away),
        liveGameScore: getTennisLiveGameScore(competition, home, away),
        servingSide: getTennisServingSide(competition, home, away),
        bestOf: competition?.format?.regulation?.periods,
        matchDuration: getTennisMatchDuration(competition) || getTennisMatchDuration(eventEntry),
        summaryNote: competition?.notes?.[0]?.text,
        statusDetail: competition?.status?.type?.detail || competition?.status?.type?.description,
        events: [],
        stats: [],
        homePlayers: [],
        awayPlayers: [],
      };
    } catch (error) {
      console.error(`Error loading tennis fallback details for ${matchId}:`, error);
    }
  }

  return null;
};

export const fetchMatchDetails = async (matchId: string, leagueId: string): Promise<MatchDetailData | null> => {
  const sport = leagueId === 'nba' ? 'basketball' : (leagueId === 'nfl' ? 'football' : (isTennisLeague(leagueId) ? 'tennis' : 'soccer'));
  const tennisHeadshotMap = leagueId === 'tennis.atp'
    ? await fetchAtpHeadshotMap()
    : leagueId === 'tennis.wta'
      ? await fetchWtaHeadshotMap()
      : undefined;

  let url = '';
  if (sport === 'basketball') {
    url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${matchId}`;
  } else if (sport === 'football') {
    url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${matchId}`;
  } else if (sport === 'tennis') {
    url = `https://site.api.espn.com/apis/site/v2/sports/tennis/${getTennisLeagueSlug(leagueId)}/summary?event=${matchId}`;
  } else {
    url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/summary?event=${matchId}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (sport === 'tennis') {
        return await fetchTennisFallbackMatchDetails(matchId, leagueId);
      }
      throw new Error('Failed to fetch details');
    }
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

    const getEntityName = (competitor: any) => {
      if (competitor.athlete) return competitor.athlete.displayName || competitor.athlete.shortName;
      if (competitor.team) return competitor.team.shortDisplayName || competitor.team.displayName || competitor.team.name;
      return 'Unknown';
    };

    const getEntityShortName = (competitor: any) => {
      if (competitor.athlete) return competitor.athlete.shortName || competitor.athlete.displayName;
      if (competitor.team) return competitor.team.abbreviation || competitor.team.shortDisplayName || competitor.team.displayName;
      return 'Unknown';
    };

    const getEntityLogo = (competitor: any) => {
      if (competitor.athlete && competitor.athlete.flag) return getImageHref(competitor.athlete.flag) || '';
      if (competitor.team && competitor.team.logos?.[0]?.href) return competitor.team.logos[0].href;
      if (competitor.team && competitor.team.logo) return competitor.team.logo;
      return '';
    };

    const baseMatch: MatchWithHot = {
      id: header.id,
      leagueId: leagueId,
      homeTeam: {
        id: home.id,
        name: getEntityName(home),
        shortName: getEntityShortName(home),
        logo: getEntityLogo(home),
        headshot: getEntityHeadshot(home, { leagueId, tennisHeadshotMap }),
        link: getEntityLink(home),
        linescores: home.linescores,
        record: getRecord(home),
      },
      awayTeam: {
        id: away.id,
        name: getEntityName(away),
        shortName: getEntityShortName(away),
        logo: getEntityLogo(away),
        headshot: getEntityHeadshot(away, { leagueId, tennisHeadshotMap }),
        link: getEntityLink(away),
        linescores: away.linescores,
        record: getRecord(away),
      },
      homeScore: parseInt(home.score || '0'),
      awayScore: parseInt(away.score || '0'),
      status: getMatchStatus(header.status || competition.status),
      minute: getMinute(header.status || competition.status),
      startTime: new Date(header.date || competition.date),
      stadium: data.gameInfo?.venue?.fullName || competition.venue?.fullName || 'Unknown Venue',
      court: competition?.venue?.court,
      tournamentName: competition?.event?.shortName || competition?.event?.name || data?.event?.shortName || data?.event?.name,
      roundName: competition?.round?.displayName || competition?.type?.text,
      setScores: getSetScores(home, away),
      liveGameScore: getTennisLiveGameScore(competition, home, away),
      servingSide: getTennisServingSide(competition, home, away),
      bestOf: competition?.format?.regulation?.periods,
      matchDuration: getTennisMatchDuration(competition) || getTennisMatchDuration(header),
      summaryNote: competition?.notes?.[0]?.text || header?.note,
      statusDetail: header?.status?.type?.detail || competition?.status?.type?.detail,
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
    if (sport === 'tennis') {
      const fallback = await fetchTennisFallbackMatchDetails(matchId, leagueId);
      if (fallback) return fallback;
    }
    console.error("Error fetching match details:", error);
    return null;
  }
};

export const fetchStandings = async (leagueId: string): Promise<StandingEntry[]> => {
  if (leagueId === 'following' || leagueId === 'top') {
    return [];
  }

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
  if (leagueId === 'following' || leagueId === 'top') {
    return [];
  }
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
  } else if (isTennisLeague(leagueId)) {
    endpoint = `tennis/${getTennisLeagueSlug(leagueId)}`;
  } else {
    endpoint = `soccer/${leagueId}`;
  }
  
  let url = `https://site.api.espn.com/apis/site/v2/sports/${endpoint}/news`;
  
  if (leagueId !== 'nba' && leagueId !== 'nfl' && !isTennisLeague(leagueId) && matchId) {
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

const normalizeCoreApiUrl = (url: string): string => {
  return url.replace(/^http:\/\//, 'https://');
};

const fetchTennisLeagueRanking = async (
  leagueSlug: 'atp' | 'wta',
  rankingId: number,
  limit = 10
): Promise<TennisRankingPlayer[]> => {
  try {
    const headshotMap = leagueSlug === 'atp'
      ? await fetchAtpHeadshotMap()
      : await fetchWtaHeadshotMap();

    const rankingListResp = await fetch(`https://sports.core.api.espn.com/v2/sports/tennis/leagues/${leagueSlug}/rankings?limit=20`);
    if (!rankingListResp.ok) throw new Error(`Failed to fetch ${leagueSlug} rankings list`);

    const rankingListData = await rankingListResp.json();
    const rankingRef = rankingListData?.items?.find((item: any) => String(item?.$ref || '').includes(`/rankings/${rankingId}`))?.$ref
      || rankingListData?.items?.[0]?.$ref;

    if (!rankingRef) return [];

    const rankingResp = await fetch(normalizeCoreApiUrl(rankingRef));
    if (!rankingResp.ok) throw new Error(`Failed to fetch ${leagueSlug} ranking details`);

    const rankingData = await rankingResp.json();
    const ranks = Array.isArray(rankingData?.ranks) ? rankingData.ranks.slice(0, limit) : [];

    const players = await Promise.all(
      ranks.map(async (rank: any): Promise<TennisRankingPlayer | null> => {
        try {
          const athleteRef = rank?.athlete?.$ref;
          if (!athleteRef) return null;

          const athleteResp = await fetch(normalizeCoreApiUrl(athleteRef));
          if (!athleteResp.ok) return null;

          const athleteData = await athleteResp.json();
          const athleteId = String(athleteData?.id || '');

          return {
            athleteId,
            rank: rank?.current || 0,
            previousRank: rank?.previous,
            points: Number(rank?.points || 0),
            trend: rank?.trend,
            displayName: athleteData?.displayName || athleteData?.fullName || 'Unknown Player',
            shortName: athleteData?.shortName || athleteData?.displayName || 'Unknown Player',
            headshot:
              getImageHref(athleteData?.headshot)
              || headshotMap?.get(normalizeTennisPlayerName(athleteData?.displayName || athleteData?.fullName))
              || getTennisHeadshotById(athleteId),
            flag: getImageHref(athleteData?.flag) || getImageHref(athleteData?.citizenshipCountry?.flag),
          };
        } catch (error) {
          console.error(`Failed to fetch ${leagueSlug} athlete ranking detail:`, error);
          return null;
        }
      })
    );

    return players.filter((player: TennisRankingPlayer | null): player is TennisRankingPlayer => Boolean(player));
  } catch (error) {
    console.error(`Error fetching ${leagueSlug} rankings:`, error);
    return [];
  }
};

export const fetchTennisRankings = async (limit = 10): Promise<{ atp: TennisRankingPlayer[]; wta: TennisRankingPlayer[] }> => {
  const [atp, wta] = await Promise.all([
    fetchTennisLeagueRanking('atp', 1, limit),
    fetchTennisLeagueRanking('wta', 2, limit),
  ]);

  return { atp, wta };
};

const getTennisTourEventStatus = (startDate: Date, endDate: Date): TennisTourEvent['status'] => {
  const now = new Date();
  if (now < startDate) return 'UPCOMING';
  if (now > endDate) return 'COMPLETED';
  return 'ONGOING';
};

const normalizeTournamentName = (name: string) => name.toLowerCase().replace(/[''.]/g, '').trim();

const inferTennisSurface = (name: string, isMajor: boolean, indoor?: boolean): TennisTourEvent['surface'] => {
  const normalized = normalizeTournamentName(name);

  if (indoor) return 'indoor-hard';

  const clayKeywords = [
    'roland garros', 'french open', 'monte carlo', 'madrid', 'internazionali', 'italian open',
    'rome', 'barcelona', 'geneva', 'hamburg', 'gstaad', 'bastad', 'lyon', 'marrakech',
    'rio', 'buenos aires', 'santiago', 'strasbourg', 'estoril', 'parma'
  ];
  const grassKeywords = [
    'wimbledon', 'halle', 'queens', "queen's", 'eastbourne', 'mallorca', 's hertogenbosch',
    'stuttgart', 'nottingham', 'berlin'
  ];
  const hardKeywords = [
    'australian open', 'us open', 'indian wells', 'miami', 'cincinnati', 'shanghai', 'paris',
    'beijing', 'wuhan', 'dubai', 'doha', 'tokyo', 'adelaide', 'auckland', 'brisbane',
    'washington', 'delray beach', 'acapulco', 'montreal', 'toronto', 'national bank open'
  ];

  if (grassKeywords.some((keyword) => normalized.includes(keyword))) return 'grass';
  if (clayKeywords.some((keyword) => normalized.includes(keyword))) return 'clay';
  if (hardKeywords.some((keyword) => normalized.includes(keyword))) return 'hard';

  if (isMajor) return normalized.includes('wimbledon') ? 'grass' : normalized.includes('french open') || normalized.includes('roland garros') ? 'clay' : 'hard';
  return 'unknown';
};

const inferTennisLevel = (name: string, leagueSlug: 'atp' | 'wta', isMajor: boolean): string => {
  const normalized = normalizeTournamentName(name);
  const leagueLabel = leagueSlug.toUpperCase();

  if (isMajor) return 'Grand Slam';
  if (normalized.includes('finals')) return `${leagueLabel} Finals`;

  const masters1000Keywords = [
    'indian wells', 'miami', 'monte carlo', 'madrid', 'italian open', 'internazionali',
    'national bank open', 'cincinnati', 'shanghai', 'paris', 'beijing', 'wuhan', 'dubai', 'doha'
  ];
  const level500Keywords = [
    'barcelona', 'queens', 'halle', 'washington', 'tokyo', 'china open', 'vienna',
    'basel', 'hamburg', 'stuttgart', 'berlin', 'charleston'
  ];
  const level250Keywords = [
    'geneva', 'strasbourg', 'estoril', 'eastbourne', 'mallorca', 'auckland', 'adelaide',
    'brisbane', 'marrakech', 'lyon', 'delray beach', 'acapulco', 'gstaad', 'bastad', 'nottingham'
  ];

  if (masters1000Keywords.some((keyword) => normalized.includes(keyword))) return `${leagueLabel} 1000`;
  if (level500Keywords.some((keyword) => normalized.includes(keyword))) return `${leagueLabel} 500`;
  if (level250Keywords.some((keyword) => normalized.includes(keyword))) return `${leagueLabel} 250`;

  return `${leagueLabel} Tour`;
};

const getTennisTournamentBackground = (name: string, surface: TennisTourEvent['surface']): string | undefined => {
  const normalized = normalizeTournamentName(name);

  const knownBackgrounds: Record<string, string> = {
    'australian open': 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1200&q=80',
    'french open': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80',
    'roland garros': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80',
    'wimbledon': 'https://images.unsplash.com/photo-1560012057-4372e14c5085?auto=format&fit=crop&w=1200&q=80',
    'us open': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80',
    'indian wells': 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
    'miami': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
    'monte carlo': 'https://images.unsplash.com/photo-1531315630201-bb15abeb1653?auto=format&fit=crop&w=1200&q=80',
    'madrid': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    'italian open': 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1200&q=80',
    'geneva': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
    'strasbourg': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
  };

  const matchedKey = Object.keys(knownBackgrounds).find((key) => normalized.includes(key));
  if (matchedKey) return knownBackgrounds[matchedKey];

  if (surface === 'clay') return 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80';
  if (surface === 'grass') return 'https://images.unsplash.com/photo-1560012057-4372e14c5085?auto=format&fit=crop&w=1200&q=80';
  if (surface === 'hard' || surface === 'indoor-hard') return 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80';
  return undefined;
};

const fetchMonthlyLeagueTourEvents = async (
  leagueSlug: 'atp' | 'wta',
  monthRange: string
): Promise<TennisTourEvent[]> => {
  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/tennis/${leagueSlug}/scoreboard?dates=${monthRange}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${leagueSlug} monthly tour events`);
    }

    const data = await response.json();
    const events = Array.isArray(data?.events) ? data.events : [];

    return events
      .map((event: any): TennisTourEvent | null => {
        const competitions = Array.isArray(event?.groupings)
          ? event.groupings.flatMap((group: any) => group?.competitions || [])
          : Array.isArray(event?.competitions)
            ? event.competitions
            : [];

        const singlesCompetitions = competitions.filter((competition: any) => competition?.type?.slug?.includes('singles'));
        if (singlesCompetitions.length === 0) return null;

        const firstCompetition = singlesCompetitions[0];
        const startDate = new Date(event?.date || firstCompetition?.date);
        const endDate = new Date(event?.endDate || event?.date || firstCompetition?.date);

        return {
          id: String(event?.id || `${leagueSlug}-${event?.name}`),
          league: leagueSlug,
          name: event?.shortName || event?.name || 'Unknown Tournament',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          location: firstCompetition?.venue?.fullName,
          court: firstCompetition?.venue?.court,
          isMajor: Boolean(event?.major),
          status: getTennisTourEventStatus(startDate, endDate),
          singlesMatchCount: singlesCompetitions.length,
          surface: inferTennisSurface(event?.shortName || event?.name || '', Boolean(event?.major), Boolean(firstCompetition?.venue?.indoor)),
          level: inferTennisLevel(event?.shortName || event?.name || '', leagueSlug, Boolean(event?.major)),
          backgroundImage: getTennisTournamentBackground(
            event?.shortName || event?.name || '',
            inferTennisSurface(event?.shortName || event?.name || '', Boolean(event?.major), Boolean(firstCompetition?.venue?.indoor))
          ),
        };
      })
      .filter((event: TennisTourEvent | null): event is TennisTourEvent => Boolean(event))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } catch (error) {
    console.error(`Error fetching monthly ${leagueSlug} tour events:`, error);
    return [];
  }
};

export const fetchMonthlyTennisTourEvents = async (): Promise<{ atp: TennisTourEvent[]; wta: TennisTourEvent[] }> => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  const pad = (value: number) => String(value).padStart(2, '0');
  const monthRange = `${start.getUTCFullYear()}${pad(start.getUTCMonth() + 1)}${pad(start.getUTCDate())}-${end.getUTCFullYear()}${pad(end.getUTCMonth() + 1)}${pad(end.getUTCDate())}`;

  const [atp, wta] = await Promise.all([
    fetchMonthlyLeagueTourEvents('atp', monthRange),
    fetchMonthlyLeagueTourEvents('wta', monthRange),
  ]);

  return { atp, wta };
};
