import React from 'react';

export type MatchStatus = 'LIVE' | 'FINISHED' | 'SCHEDULED' | 'HT';

export interface Team {
  id: string;
  name: string;
  logo: string; // URL
  shortName: string;
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

export interface League {
  id: string;
  name: string;
  logo: string | React.ReactNode; // Can be a URL string or an Icon component
}