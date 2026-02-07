// ============ League 相关 ============
export interface YahooLeague {
  league_key: string;        // "nba.l.12345"
  league_id: string;
  name: string;
  url: string;
  logo_url?: string;
  num_teams: number;
  scoring_type: 'head' | 'rot';
  current_week: number;
  start_week: number;
  end_week: number;
  is_finished: boolean;
  draft_status: 'predraft' | 'draft' | 'postdraft';
  weekly_deadline?: string;
  settings?: YahooLeagueSettings;
}

export interface YahooLeagueSettings {
  draft_type: 'live' | 'auto' | 'offline';
  scoring_type: 'head' | 'rot';
  uses_playoff: boolean;
  playoff_start_week: number;
  uses_faab: boolean;
  trade_end_date?: string;
  trade_ratify_type: 'commish' | 'vote';
  roster_positions: YahooPosition[];
  stat_categories: {
    stats: YahooStat[];
  };
}

export interface YahooPosition {
  position: string;
  count: number;
}

export interface YahooStat {
  stat_id: string;
  name: string;
  display_name: string;
  enabled: boolean;
  value?: number;
  sort_order?: number;
  position_type?: 'O' | 'DT' | 'K' | 'P';
}

// ============ Team 相关 ============
export interface YahooTeam {
  team_key: string;          // "nba.l.12345.t.1"
  team_id: string;
  name: string;
  url: string;
  team_logos?: {
    team_logo: {
      size: string;
      url: string;
    };
  }[];
  managers: YahooManager[];
  division_id?: number;
  faab_balance?: number;
  clinched_playoffs?: boolean;
}

export interface YahooManager {
  manager_id: string;
  nickname: string;
  guid: string;
  is_commissioner?: boolean;
}

export interface YahooRoster {
  coverage_type: 'week' | 'date';
  week?: number;
  date?: string;
  players: YahooPlayer[];
}

export interface YahooTeamStandings {
  rank: number;
  outcome_totals: {
    wins: number;
    losses: number;
    ties: number;
    percentage: string;
  };
  divisional_outcome_totals?: {
    wins: number;
    losses: number;
    ties: number;
  };
}

export interface YahooTeamPoints {
  coverage_type: 'week' | 'season';
  week?: number;
  season?: number;
  total: number;
}

// ============ Player 相关 ============
export interface YahooPlayer {
  player_key: string;        // "nba.p.12345"
  player_id: string;
  name: {
    full: string;
    first: string;
    last: string;
    ascii_first: string;
    ascii_last: string;
  };
  editorial_team_key: string;
  editorial_team_full_name: string;
  editorial_team_abbr: string;
  uniform_number: string;
  display_position: string;
  image_url: string;
  is_undroppable: boolean;
  position_type: 'B' | 'P' | 'O' | 'DT' | 'K';
  eligible_positions: {
    position: string;
  }[];
  has_player_notes?: boolean;
  has_recent_player_notes?: boolean;
  percent_owned?: number;
  ownership?: {
    percent_owned: number;
  };
  status?: string;            // "INJ", "OUT", "Q", "DL"
  on_disabled_list?: boolean;
  selected_position?: {
    coverage_type: 'week' | 'date';
    position: string;
  };
  starting_status?: {
    coverage_type: 'week' | 'date';
    is_starting: boolean;
  };
  player_stats?: YahooPlayerStats[];
  player_points?: YahooPlayerPoints[];
  bye_weeks?: {
    week: number;
  }[];
}

export interface YahooPlayerStats {
  coverage_type: 'season' | 'week' | 'date' | 'lastweek' | 'lastmonth';
  season?: number;
  week?: number;
  date?: string;
  stats: {
    stat: {
      stat_id: string;
      value: string | number;
    };
  }[];
}

export interface YahooPlayerPoints {
  coverage_type: 'season' | 'week' | 'date';
  season?: number;
  week?: number;
  total: number;
}

// ============ Matchup 相关 ============
export interface YahooMatchup {
  week: number;
  status: 'pregame' | 'inprogress' | 'postevent';
  is_tied: boolean;
  winner_team_key?: string;
  teams: YahooMatchupTeam[];
}

export interface YahooMatchupTeam {
  team: YahooTeam;
  team_points?: YahooTeamPoints;
  team_projected_points?: YahooTeamPoints;
}

// ============ Standings 相关 ============
export interface YahooStandings {
  teams: YahooTeamWithStandings[];
}

export interface YahooTeamWithStandings extends YahooTeam {
  team_standings: YahooTeamStandings;
  team_points?: YahooTeamPoints;
}

// ============ Transaction 相关 ============
export interface YahooTransaction {
  transaction_key: string;
  transaction_id: string;
  type: 'add' | 'drop' | 'add/drop' | 'trade' | 'commish';
  status: 'successful' | 'pending' | 'failed';
  timestamp: number;
  players: YahooTransactionPlayer[];
  faab_bid?: number;
  trade_note?: string;
}

export interface YahooTransactionPlayer {
  player: YahooPlayer;
  transaction_data: {
    type: 'add' | 'drop' | 'pending_trade';
    source_type: 'team' | 'freeagents' | 'waivers';
    destination_type: 'team' | 'waivers' | 'freeagents';
    source_team_key?: string;
    destination_team_key?: string;
  };
}

// ============ User 相关 ============
export interface YahooUser {
  guid: string;
  display_name: string;
  fantasy_profile?: {
    profile_image_url: string;
  };
}

export interface YahooUserGames {
  user: YahooUser;
  games: YahooGame[];
}

export interface YahooGame {
  game_key: string;
  game_id: string;
  name: string;
  code: string;
  type: string;
  url: string;
  season: number;
  is_registration_over: boolean;
  is_game_over: boolean;
  is_offseason: boolean;
  leagues: YahooLeague[];
}

// ============ Analysis 相关 ============
export interface LeagueAnalysis {
  league: YahooLeague;
  teams: YahooTeamWithRosterAndStats[];
  standings: YahooTeamWithStandings[];
  currentMatchups: YahooMatchup[];
  recommendations: Recommendation[];
  powerRankings: PowerRanking[];
}

export interface YahooTeamWithRosterAndStats extends YahooTeam {
  roster: YahooRoster;
  stats?: YahooPlayerStats[];
}

export interface Recommendation {
  type: 'waiver' | 'trade' | 'roster_move';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  player_keys?: string[];
  reasoning: string;
  impact_score?: number;
}

export interface PowerRanking {
  rank: number;
  team_key: string;
  team_name: string;
  score: number;
  trend: 'up' | 'down' | 'neutral';
  change: number;
}

// ============ OAuth 相关 ============
export interface YahooOAuthToken {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  xoauth_yahoo_guid: string;
}

export interface YahooOAuthSession {
  token: YahooOAuthToken;
  expiresAt: number;
  userGuid: string;
}

// ============ API Response 格式 ============
export interface YahooFantasyContent<T> {
  fantasy_content: {
    time: string;
    copyright: string;
    [K: string]: T | string | any;
  };
}

export interface YahooErrorResponse {
  error: {
    description: string;
    detail?: string;
  };
}

// ============ Filter 相关 ============
export interface PlayerFilterOptions {
  position?: string;
  status?: 'A' | 'FA' | 'W' | 'T' | 'K';
  search?: string;
  sort?: string;
  sort_type?: 'season' | 'date' | 'week' | 'lastweek' | 'lastmonth';
  sort_season?: number;
  sort_date?: string;
  sort_week?: number;
  start?: number;
  count?: number;
}

export interface LeagueFilterOptions {
  league_keys?: string[];
  game_keys?: string[];
  is_available?: boolean;
}

// ============ 分析相关工具类型 ============
export interface RosterAnalysis {
  totalScore: number;
  positionalBreakdown: Record<string, {
    count: number;
    averageScore: number;
    topPlayer: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  injuryCount: number;
  benchStrength: number;
}

export interface MatchupAnalysis {
  week: number;
  opponent: string;
  projectedScore: number;
  winProbability: number;
  keyAdvantages: string[];
  keyDisadvantages: string[];
  recommendedMoves: string[];
}

export interface WaiverSuggestion {
  player: YahooPlayer;
  reason: string;
  fitScore: number;
  priority: number;
  dropCandidate?: YahooPlayer;
}
