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
    const searchParams = new URLSearchParams(location.search);
    
    // Default values
    let title = 'Live Scores & Results for NBA, Premier League, La Liga - Sports Match';
    let description = 'Get real-time live scores, fixtures, results, and standings for major sports events including NBA, Premier League, La Liga, and UEFA. Fast, accurate, and instantly updated data.';
    let image = 'https://sportlive.win/logo.png';
    let url = 'https://sportlive.win' + path + location.search;
    let type = 'website';

    // Route-specific logic
    if (path.startsWith('/standings/')) {
        const leagueId = path.split('/')[2];
        const league = LEAGUES.find(l => l.id === leagueId);
        const leagueName = league ? league.name : 'League';
        title = `${leagueName} Standings & Stats - Sports Match`;
        description = `Check the latest ${leagueName} standings, team stats, and rankings. Updated in real-time.`;
    } else if (path === '/leagues') {
        title = 'All Leagues - Sports Match';
        description = 'Browse all available sports leagues including NBA, Premier League, La Liga, Bundesliga, and more.';
    } else if (path === '/news') {
        title = 'Sports News - Latest Headlines - Sports Match';
        description = 'Stay updated with the latest sports news, transfer rumors, and match previews from around the world.';
    } else if (path === '/schedule') {
        const dateParam = searchParams.get('date');
        if (dateParam) {
            const date = new Date(dateParam + 'T12:00:00');
            const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            title = `Match Schedule for ${dateStr} - Sports Match`;
            description = `View the full match schedule for ${dateStr}. NBA, NFL, Premier League, and more.`;
        } else {
            title = 'Match Schedule - Upcoming Fixtures - Sports Match';
            description = 'Check upcoming sports fixtures and match schedules for all major leagues.';
        }
    } else if (path === '/sitemap') {
        title = 'Sitemap - Sports Match';
    } else if (path === '/nba-live-scores') {
        title = 'NBA Live Scores, Standings & Schedule 2025';
        description = 'Follow NBA live scores, check team standings, and view the latest season schedule.';
    } else if (path === '/champions-league-results') {
        title = 'UEFA Champions League Results & Fixtures';
        description = 'Get the latest UEFA Champions League results, fixtures, and group standings.';
    } else if (path === '/premier-league-fixtures') {
        title = 'Premier League Live Scores, Table & News';
        description = 'Follow the Premier League with live scores, updated tables, and breaking news.';
    } else if (path === '/la-liga-standings') {
        title = 'La Liga Match Results & Standings';
        description = 'Real-time La Liga match results and comprehensive league standings.';
    } else if (path === '/bundesliga-scores') {
        title = 'Bundesliga Scores & Fixtures';
        description = 'Latest Bundesliga scores, match fixtures, and team performance stats.';
    } else if (path === '/ligue-1-match-stats') {
        title = 'Ligue 1 Live Stats & Results';
        description = 'Track Ligue 1 matches live with detailed stats and results.';
    } else if (path === '/serie-a-live-football') {
        title = 'Serie A Match Schedule & Standings';
        description = 'Serie A football schedule, live scores, and current standings.';
    } else if (path === '/player-comparison') {
        title = 'FPL Player Comparison Tool - Stats Radar';
        description = 'Compare Fantasy Premier League players head-to-head. Analyze goals, assists, xG, and more with our interactive radar chart.';
    }
    // Note: Match detail pages handle their own title to include team names
    // However, if we want global OG tags for them, we might need to handle them here or let them override.
    // For now, this covers the main pages requested.

    // Update document title
    document.title = title;

    // Helper to update or create meta tags
    const updateMeta = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('name', name);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    const updateOG = (property: string, content: string) => {
        let element = document.querySelector(`meta[property="${property}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('property', property);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    // Standard Meta
    updateMeta('description', description);
    updateMeta('keywords', 'NBA, Premier League, La Liga, Bundesliga, Ligue 1, Serie A, live scores, results, standings, fixtures, sports news');

    // OpenGraph
    updateOG('og:title', title);
    updateOG('og:description', description);
    updateOG('og:image', image);
    updateOG('og:url', url);
    updateOG('og:type', type);
    updateOG('og:site_name', 'Sports Match');

    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image);
    // Optional: updateMeta('twitter:site', '@YourTwitterHandle');

    // Canonical Link
    let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    // Remove query params for canonical unless it's the schedule page where date is needed
    // But typically canonical should be the clean URL. 
    // For this specific app, we'll use the full URL if it's a schedule page with date, otherwise strip params if possible?
    // Actually, simple rule: just use the current full URL without tracking params. 
    // Since we don't have tracking params logic here, using the constructed 'url' variable is safe enough for now.
    link.setAttribute('href', url);

  }, [location]);

  return null;
};


export default SEO;
