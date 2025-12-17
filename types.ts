import React from 'react';

export type MatchStatus = 'LIVE' | 'FINISHED' | 'SCHEDULED' | 'HT';

export interface Team {
  id: string;
  name: string;
  logo: string; // URL
  shortName: string;
  linescores?: { value: number; displayValue?: string }[];
  record?: string;
}

export interface Match {
  id: string;
  leagueId: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  minute?: string | number; // For live matches
  startTime: Date; // The full date object
  stadium?: string;
}

export interface MatchEvent {
  id: string;
  type: string; // e.g., "Goal", "Yellow Card", "Substitution"
  minute: string; // clock.displayValue
  teamId: string;
  player: string; // athletesInvolved[0].shortName
  assist?: string;
  participants: { name: string; role?: string }[];
}

export interface MatchStat {
  name: string; // e.g., "Possession", "Shots"
  homeValue: string | number;
  awayValue: string | number;
  isPercentage?: boolean;
}

export interface PlayerStat {
  id: string;
  name: string;
  position: string;
  positionName?: string;
  jersey: string;
  stats: Record<string, string>; // e.g., { "G": "1", "A": "0" }
  isStarter: boolean;
  active?: boolean;
  formationPlace?: number;
  subbedIn?: boolean;
  subbedOut?: boolean;
  headshot?: string;
}

export interface MatchDetailData extends Match {
  events: MatchEvent[];
  stats: MatchStat[];
  homePlayers: PlayerStat[];
  awayPlayers: PlayerStat[];
}

export interface League {
  id: string;
  name: string;
  logo: string | React.ReactNode; // Can be a URL string or an Icon component
}

export interface StandingEntry {
  group?: string; // e.g. "Eastern Conference"
  team: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
  };
  stats: {
    rank: number;
    wins?: number;
    losses?: number;
    draws?: number;
    points?: number;
    gamesPlayed?: number;
    goalDiff?: number; // Soccer
    goalsFor?: number; // Soccer
    goalsAgainst?: number; // Soccer
    winPct?: number; // NBA
    gamesBehind?: number; // NBA
  };
}

export interface PlayerLeader {
  id: string;
  name: string;
  team: string; // Team ID or Abbreviation
  teamLogo?: string;
  headshot?: string;
  value: number; // The stat value (e.g. 20 goals)
  rank: number;
  displayValue: string;
}

export interface PlayerStatCategory {
  name: string; // e.g. "goals", "assists"
  displayName: string; // e.g. "Goals"
  leaders: PlayerLeader[];
}

export interface Article {
  headline: string;
  description: string;
  published: string;
  link: string;
  images: { url: string }[];
}
