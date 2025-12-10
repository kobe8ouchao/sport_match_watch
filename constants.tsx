import { League, Match } from './types';
import { Star } from 'lucide-react';

export interface MatchWithHot extends Match {
  isHot?: boolean;
  bannerImage?: string; // Optional custom background for banner
}

// UCL Logo Base64 (Truncated for brevity, but functional as a placeholder if full string was provided)
const UCL_LOGO = "https://a.espncdn.com/i/leaguelogos/soccer/500/2.png"; // Using ESPN CDN for reliability instead of massive Base64

export const LEAGUES: League[] = [
  // Using 'eng.1' as the default for TOP for now, or we could aggregate manually.
  { id: 'eng.1', name: 'TOP', logo: <Star size={16} /> }, 
  { id: 'nba', name: 'NBA', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png' },
  { id: 'uefa.champions', name: 'Champions League', logo: UCL_LOGO },
  { id: 'eng.1', name: 'Premier League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png' },
  { id: 'esp.1', name: 'La Liga', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png' },
  { id: 'ita.1', name: 'Serie A', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png' },
  { id: 'ger.1', name: 'Bundesliga', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png' },
  { id: 'fra.1', name: 'Ligue 1', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png' },
];

// Fallback Mock data in case API fails or for initial render
const today = new Date();
export const MOCK_MATCHES: MatchWithHot[] = [
  {
    id: 'm1',
    leagueId: 'nba',
    homeTeam: { id: 'lakers', name: 'Lakers', shortName: 'LAL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png' },
    awayTeam: { id: 'warriors', name: 'Warriors', shortName: 'GSW', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/gsw.png' },
    homeScore: 102,
    awayScore: 98,
    status: 'LIVE',
    minute: 34,
    startTime: today,
    stadium: 'Crypto.com Arena, LA',
    isHot: true,
    bannerImage: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop'
  }
];