/*
 * @Descripttion: 
 * @Author: ouchao
 * @Email: ouchao@sendpalm.com
 * @version: 1.0
 * @Date: 2025-12-13 21:27:15
 * @LastEditors: ouchao
 * @LastEditTime: 2025-12-14 10:49:22
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LEAGUES } from '../constants';

const SEO = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'Live Scores & Results for NBA, Premier League, La Liga - Sports Match';
    
    if (path.startsWith('/standings/')) {
        const leagueId = path.split('/')[2];
        const league = LEAGUES.find(l => l.id === leagueId);
        const leagueName = league ? league.name : 'League';
        title = `${leagueName} Standings & Stats - Sports Match`;
    } else if (path === '/leagues') {
        title = 'All Leagues - Sports Match';
    } else if (path === '/news') {
        title = 'Sports News - Latest Headlines - Sports Match';
    } else if (path === '/schedule') {
        title = 'Match Schedule - Upcoming Fixtures - Sports Match';
    } else if (path === '/sitemap') {
        title = 'Sitemap - Sports Match';
    } else if (path === '/nba-live-scores') {
        title = 'NBA Live Scores, Standings & Schedule 2025';
    } else if (path === '/champions-league-results') {
        title = 'UEFA Champions League Results & Fixtures';
    } else if (path === '/premier-league-fixtures') {
        title = 'Premier League Live Scores, Table & News';
    } else if (path === '/la-liga-standings') {
        title = 'La Liga Match Results & Standings';
    } else if (path === '/bundesliga-scores') {
        title = 'Bundesliga Scores & Fixtures';
    } else if (path === '/ligue-1-match-stats') {
        title = 'Ligue 1 Live Stats & Results';
    } else if (path === '/serie-a-live-football') {
        title = 'Serie A Match Schedule & Standings';
    }
    // Note: Match detail pages handle their own title to include team names

    document.title = title;
  }, [location]);

  return null;
};

export default SEO;
