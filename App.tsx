import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation, Navigate, Link } from 'react-router-dom';
import Header from './components/Header';
import LeagueNav from './components/LeagueNav';
import MatchCard from './components/MatchCard';
import CalendarModal from './components/CalendarModal';
import InlineCalendar from './components/InlineCalendar';
import FeaturedCarousel from './components/FeaturedCarousel';
import Footer from './components/Footer';
import { LEAGUES, MOCK_MATCHES, MatchWithHot } from './constants';
import { Team as AuthTeam } from './types/auth';
import { fetchMatches } from './services/api';
import { isSameDay } from './utils';
import { Loader2, ArrowUp, CalendarDays, ArrowDown, Heart } from 'lucide-react';
import MatchDetail from './components/MatchDetail';
import NewsSection from './components/NewsSection';
import NewsCarousel from './components/NewsCarousel';
import StandingsWidget from './components/StandingsWidget';

// Wrapper to handle navigation
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLeagueId, setSelectedLeagueId] = useState('top');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const navigate = useNavigate();

  const handleSelectLeague = (id: string) => {
    setSelectedLeagueId(id);
    if (id === 'top') {
      setSelectedDate(new Date());
    }
  };

  const [matches, setMatches] = useState<MatchWithHot[]>([]);
  const [pastMatches, setPastMatches] = useState<MatchWithHot[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);
  // Keep track of how many days back we have loaded
  const [daysBackLoaded, setDaysBackLoaded] = useState(0);

  const [calendarEntries, setCalendarEntries] = useState<{ date: Date; sport: 'basketball' | 'soccer'; leagueId: string }[]>([]);
  const [featuredMatches, setFeaturedMatches] = useState<MatchWithHot[]>([]);
  const [featuredCalendarEntries, setFeaturedCalendarEntries] = useState<{ date: Date; sport: 'basketball' | 'soccer'; leagueId: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [followedTeamIds, setFollowedTeamIds] = useState<Set<string>>(new Set());
  const [followedTeamsList, setFollowedTeamsList] = useState<AuthTeam[]>([]);

  // Theme Toggle Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // FETCH MATCHES FROM API
  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      try {
        if (selectedLeagueId === 'following') {
          if (!user) {
             setMatches([]);
             setCalendarEntries([]);
             setLoading(false);
             return;
          }
          
          const followedTeams = await storageService.getFollowedTeams();
          setFollowedTeamIds(new Set(followedTeams.map(t => t.id)));
          setFollowedTeamsList(followedTeams);
          
          if (followedTeams.length === 0) {
             setMatches([]);
             setCalendarEntries([]);
             setLoading(false);
             return;
          }
          
          // Fetch matches from all available leagues to filter
          // We broaden the search to include all defined leagues to ensure we catch followed teams
          const leaguesToFetch = LEAGUES
            .filter(l => l.id !== 'following' && l.id !== 'top')
            .map(l => l.id);
            
          const fetchPromises = leaguesToFetch.map(id => fetchMatches(id, selectedDate));
          // Add 'top' to ensure we catch major games
          fetchPromises.push(fetchMatches('top', selectedDate));

          const responses = await Promise.all(fetchPromises);
          
          const allMatches = responses.flatMap(r => r.matches);
          
          // Deduplicate by ID
          const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());
          
          // Filter matches involving followed teams
          console.log("Filtering matches for followed teams:", followedTeams);
          const filteredMatches = uniqueMatches.filter(match => {
            const homeId = match.homeTeam.id;
            const awayId = match.awayTeam.id;
            const homeName = match.homeTeam.name.toLowerCase();
            const awayName = match.awayTeam.name.toLowerCase();
            
            // Check if any followed team matches home or away
            return followedTeams.some(team => {
                 if (!team.id || !team.name) return false;

                 const teamIdBase = team.id.split('_')[1] || team.id; // e.g. 'nba_lakers' -> 'lakers'
                 const teamName = team.name.toLowerCase();

                 // 1. ID Match (Prioritize strict ID matching)
                 const idMatch = 
                     homeId === team.id || 
                     homeId === teamIdBase || 
                     awayId === team.id || 
                     awayId === teamIdBase;
                 
                 if (idMatch) return true;

                 // 2. Name Match (Stricter than before)
                 // Only allow partial match if the team name is long enough to be unique (e.g. > 3 chars)
                 // and avoids common short words unless exact match.
                 if (teamName.length < 4) {
                    return homeName === teamName || awayName === teamName;
                 }

                 // Check if team name is part of home/away name (e.g. "Lakers" in "LA Lakers")
                 const nameMatchHome = homeName.includes(teamName);
                 const nameMatchAway = awayName.includes(teamName);
                 
                 // Reverse check: home name part of team name (e.g. "Jazz" in "Utah Jazz")
                 // But be careful: "Man" in "Man Utd" is dangerous if homeName is just "Man"
                 const reverseMatchHome = teamName.includes(homeName) && homeName.length > 3;
                 const reverseMatchAway = teamName.includes(awayName) && awayName.length > 3;

                 return nameMatchHome || nameMatchAway || reverseMatchHome || reverseMatchAway;
            });
          });
          
          setMatches(filteredMatches);
          // The last response corresponds to 'top' which we use for the calendar
          setCalendarEntries(responses[responses.length - 1].calendar); 
        } else {
          const { matches, calendar } = await fetchMatches(selectedLeagueId, selectedDate);
          // Deduplicate matches by ID to avoid key warnings
          const uniqueMatches = Array.from(new Map(matches.map(m => [m.id, m])).values());
          setMatches(uniqueMatches);
          setCalendarEntries(calendar);
        }
      } catch (error) {
        console.error("Error loading matches:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [selectedDate, selectedLeagueId, user]);

  // Reset past matches when selection changes
  useEffect(() => {
    setPastMatches([]);
    setDaysBackLoaded(0);
  }, [selectedDate, selectedLeagueId]);

  // Scroll to Top Logic
  useEffect(() => {
    const handleScrollTopVisibility = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScrollTopVisibility);
    return () => window.removeEventListener('scroll', handleScrollTopVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const loadMorePastMatches = async (daysToLoad = 1) => {
    if (loadingPast) return;
    setLoadingPast(true);
    try {
      const requests = [];
      for (let i = 1; i <= daysToLoad; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (daysBackLoaded + i));
        requests.push(fetchMatches(selectedLeagueId, d));
      }
      
      const results = await Promise.all(requests);
      const newMatches = results.flatMap(r => r.matches);
      
      setPastMatches(prev => {
        // Filter out duplicates just in case
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNewMatches = newMatches.filter(m => !existingIds.has(m.id));
        return [...prev, ...uniqueNewMatches].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      });
      setDaysBackLoaded(prev => prev + daysToLoad);
    } catch (error) {
      console.error("Error loading past matches:", error);
    } finally {
      setLoadingPast(false);
    }
  };

  // Fetch hero/featured matches
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(selectedDate.getDate() + 1);
        const [nbaResp, soccerResp] = await Promise.all([
          fetchMatches('nba', nextDay),
          fetchMatches('eng.1', nextDay),
        ]);
        const combined = [...nbaResp.matches, ...soccerResp.matches];
        setFeaturedMatches(combined);
        setFeaturedCalendarEntries([
          ...nbaResp.calendar,
          ...soccerResp.calendar,
        ]);
      } catch (error) {
        console.error('Error loading featured matches:', error);
        setFeaturedMatches([]);
        setFeaturedCalendarEntries([]);
      }
    };
    loadFeatured();
  }, [selectedDate]);

  // Derive hot matches
  const hotMatches = useMemo(() => {
    if (featuredMatches.length > 0) return featuredMatches;
    return MOCK_MATCHES.filter(m => m.isHot);
  }, [featuredMatches]);

  // Merge calendar entries
  const mergedCalendarEntries = useMemo(() => {
    const key = (c: { date: Date; sport: string; leagueId: string }) => {
      try {
        return `${c.sport}-${c.leagueId}-${c.date.toISOString().slice(0, 10)}`;
      } catch (e) {
        return `${c.sport}-${c.leagueId}-invalid-${Math.random()}`;
      }
    };
    const map = new Map<string, { date: Date; sport: 'basketball' | 'soccer'; leagueId: string }>();
    [...calendarEntries, ...featuredCalendarEntries].forEach((c) => {
      if (c.date instanceof Date && !isNaN(c.date.getTime())) {
        map.set(key(c), c);
      }
    });
    return Array.from(map.values());
  }, [calendarEntries, featuredCalendarEntries]);

  // Group past matches by date for display
  const groupedPastMatches = useMemo(() => {
    const groups = pastMatches.reduce((acc, match) => {
      const dateKey = match.startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(match);
      return acc;
    }, {} as Record<string, MatchWithHot[]>);

    // Sort by date descending
    return Object.entries(groups)
      .map(([date, matches]) => ({ date, matches }))
      .sort((a, b) => b.matches[0].startTime.getTime() - a.matches[0].startTime.getTime());
  }, [pastMatches]);

  const openMatchDetail = (matchId: string, leagueId: string) => {
    // Use window.open to open in new tab as requested
    const url = `/match/${leagueId}/${matchId}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'
      }`}>

      {/* Ambient Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-orange-100/40 dark:bg-orange-900/10 blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-grow w-full">

        <Header
          darkMode={darkMode}
          toggleTheme={() => setDarkMode(!darkMode)}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          isCalendarOpen={isCalendarOpen}
        />

        {/* Navigation Section - Sticky Top */}
        <div className="sticky top-0 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2 mb-6 bg-pantone-cloud/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-500 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between gap-4">
          <div className="flex-1 overflow-hidden">
            <LeagueNav
              leagues={LEAGUES}
              selectedLeagueId={selectedLeagueId}
              onSelectLeague={handleSelectLeague}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8 min-h-[400px]">
          
          {/* LEFT COLUMN: Match Cards */}
          <div className="lg:col-span-8 space-y-6">
             {/* Context Title */}
             <div className="flex items-center space-x-2 h-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isSameDay(selectedDate, new Date()) ? "Today's Matches" : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <span className="text-sm text-gray-500 font-medium bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                  {matches.length}
                </span>
              </div>

              {selectedLeagueId === 'following' && !user ? (
                <div className="bg-white dark:bg-white/5 rounded-2xl p-8 text-center border border-dashed border-gray-200 dark:border-white/10">
                   <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Follow Your Teams</h3>
                   <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Sign in to select your favorite teams and see their matches right here.
                   </p>
                   <div className="flex justify-center gap-4">
                      <Link 
                        to="/login"
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link 
                        to="/register"
                        className="px-6 py-2 bg-white dark:bg-transparent border border-gray-200 dark:border-white/20 text-gray-700 dark:text-white rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                      >
                        Register
                      </Link>
                   </div>
                </div>
              ) : loading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin text-gray-400" size={40} />
                </div>
              ) : matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                  {matches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onClick={() => openMatchDetail(match.id, match.leagueId)}
                      showLeagueLogo={selectedLeagueId === 'top'}
                    />
                  ))}
      </div>
    ) : (
      selectedLeagueId === 'following' ? (
        followedTeamsList.length === 0 ? (
          <div className="bg-white dark:bg-white/5 rounded-2xl p-8 text-center border border-dashed border-gray-200 dark:border-white/10">
              <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Heart className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Followed Teams</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                 You haven't followed any teams yet. Add teams to see their matches here.
              </p>
               <Link 
                 to="/following"
                 className="px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
               >
                 Find Teams to Follow
               </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/5 rounded-2xl p-8 text-center border border-dashed border-gray-200 dark:border-white/10">
              <p className="text-gray-500 dark:text-gray-400">
                 No matches found for your followed teams on this date.
              </p>
               <Link 
                 to="/following"
                 className="mt-4 inline-block px-4 py-2 text-sm text-teal-600 dark:text-teal-400 font-medium hover:underline"
               >
                 Manage Followed Teams
               </Link>
          </div>
        )
      ) : (
        <NewsSection leagueId={selectedLeagueId} />
      )
    )}

            {/* Past Matches Section - Infinite Scroll */}
            {!loading && isSameDay(selectedDate, new Date()) && (
              <div className="mt-8 space-y-8">
                {groupedPastMatches.map(({ date, matches: dayMatches }) => (
                  <div key={date} className="space-y-4 animate-slide-up">
                    <div className="flex items-center space-x-3 border-b border-gray-200 dark:border-white/10 pb-2">
                       <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {date}
                      </h3>
                       <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        {dayMatches.length} Games
                      </span>
                    </div>
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dayMatches.map(match => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          onClick={() => openMatchDetail(match.id, match.leagueId)}
                          showLeagueLogo={selectedLeagueId === 'top'}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-center pt-4 pb-8">
                  <button
                    onClick={() => loadMorePastMatches(1)}
                    disabled={loadingPast}
                    className="px-6 py-2.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingPast ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load Previous Day
                        <ArrowDown size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Banner & Standings */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Banner / Featured Carousel */}
            <div className="w-full">
               <div className="flex items-center justify-between h-8 mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Show & Standings</h3>
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="p-2 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center"
                  title="Select Date"
                >
                  <CalendarDays size={18} />
                </button>
               </div>
              {hotMatches.length > 0 ? (
                <FeaturedCarousel
                  matches={hotMatches}
                  onMatchClick={(m) => openMatchDetail(m.id, m.leagueId)}
                />
              ) : (
                <NewsCarousel />
              )}
            </div>

            {/* Standings */}
            <div className="w-full space-y-6">
              {(selectedLeagueId === 'top' || selectedLeagueId === 'following') ? (
                <>
                  <StandingsWidget leagueId="nba" highlightTeamIds={selectedLeagueId === 'following' ? followedTeamIds : undefined} />
                  <StandingsWidget leagueId="eng.1" highlightTeamIds={selectedLeagueId === 'following' ? followedTeamIds : undefined} />
                  <StandingsWidget leagueId="esp.1" highlightTeamIds={selectedLeagueId === 'following' ? followedTeamIds : undefined} />
                  <StandingsWidget leagueId="ita.1" highlightTeamIds={selectedLeagueId === 'following' ? followedTeamIds : undefined} />
                  <StandingsWidget leagueId="ger.1" highlightTeamIds={selectedLeagueId === 'following' ? followedTeamIds : undefined} />
                  <StandingsWidget leagueId="fra.1" highlightTeamIds={selectedLeagueId === 'following' ? followedTeamIds : undefined} />
                  {selectedLeagueId === 'following' && (() => {
                      const defaultLeagues = new Set(['nba', 'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1']);
                      const extraLeagues = new Set<string>();
                      followedTeamsList.forEach(t => {
                          if (t.leagueId && !defaultLeagues.has(t.leagueId) && t.leagueId !== 'following') {
                              extraLeagues.add(t.leagueId);
                          }
                      });
                      return Array.from(extraLeagues).map(lid => (
                          <StandingsWidget key={lid} leagueId={lid} highlightTeamIds={followedTeamIds} />
                      ));
                  })()}
                </>
              ) : (
                <StandingsWidget leagueId={selectedLeagueId} />
              )}
            </div>
          </div>

        </div>
      </div>

      <Footer />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        matches={matches}
        calendarEntries={mergedCalendarEntries}
      />

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg hover:opacity-90 transition-all z-50 animate-in fade-in zoom-in duration-300"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

// Detail Page Component
const MatchDetailPageWrapper: React.FC = () => {
  const { leagueId, matchId: paramMatchId, slugAndId } = useParams<{ leagueId: string; matchId: string; slugAndId: string }>();
  const navigate = useNavigate();

  // Handle SEO-friendly URLs: extract matchId from slugAndId if present
  // Also handle case where matchId param catches the slug (if routing is ambiguous)
  let matchId = slugAndId || paramMatchId;
  
  if (matchId && matchId.includes('-')) {
    // Expected format: "slug-matchId"
    const parts = matchId.split('-');
    const lastPart = parts[parts.length - 1];
    // Simple check: matchId is usually numeric for ESPN
    if (/^\d+$/.test(lastPart)) {
        matchId = lastPart;
    }
  }

  const [darkMode, setDarkMode] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // Theme Toggle Effect - minimal for detail page
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'
      }`}>
      {/* Ambient Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-orange-100/40 dark:bg-orange-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        <Header
          darkMode={darkMode}
          toggleTheme={() => setDarkMode(!darkMode)}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          isCalendarOpen={isCalendarOpen}
        />
        {matchId && leagueId ? (
          <MatchDetail
            matchId={matchId}
            leagueId={leagueId}
            onBack={() => { }}
          />
        ) : (
          <div>Invalid Match ID</div>
        )}
      </div>
      <Footer />
    </div>
  );
};

import StandingsPage from './components/StandingsPage';
import LeaguesPage from './components/LeaguesPage';
import NewsPage from './components/NewsPage';
import SchedulePage from './components/SchedulePage';
import SitemapPage from './components/SitemapPage';
import SEO from './components/SEO';
import LeagueLandingPage from './components/LeagueLandingPage';
import WorldCupPage from './components/WorldCupPage';
import SEOArticlePage from './components/SEOArticlePage';
import { SEO_PAGES } from './constants/seoPages';
import PlayerComparisonPage from './components/PlayerComparisonPage';
import FixtureDifficulty from './components/FixtureDifficulty';
import DifferentialFinder from './components/DifferentialFinder';
import DifferentialRadar from './components/DifferentialRadar';
import BudgetAlternativeFinder from './components/BudgetAlternativeFinder';
import CaptaincyDecider from './components/CaptaincyDecider';
import FantasyToolsPage from './components/FantasyToolsPage';
import FPLLanding from './components/FPLLanding';
import GameToolsMenu from './components/GameToolsMenu';
import FPLToolsLayout from './components/FPLToolsLayout';
import NBAPlayerCompare from './components/NBAPlayerCompare';
import NBAToolsLayout from './components/NBAToolsLayout';
import NBAFantasyLanding from './components/NBAFantasyLanding';
import NBAFantasyDashboard from './components/NBAFantasyDashboard';
import NBASleeperPicker from './components/NBASleeperPicker';
import NBAB2BOptimizer from './components/NBAB2BOptimizer';
import NBAPlayerDetail from './components/NBAPlayerDetail';
import NFLToolsLayout from './components/NFLToolsLayout';
import NFLPlayerCompare from './components/NFLPlayerCompare';
import NFLScheduleDifficulty from './components/NFLScheduleDifficulty';
import NFLTrending from './components/NFLTrending';
import NFLFantasyLanding from './components/NFLFantasyLanding';
import SuperBowlPage from './components/SuperBowlPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import FollowingPage from './components/following/FollowingPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { storageService } from './services/storageService';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pantone-cloud dark:bg-zinc-950">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  // Shared state for theme
  const [darkMode, setDarkMode] = useState(false);

  // Effect to toggle body class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <Router>
      <AuthProvider>
        <SEO />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/following" element={<FollowingPage />} />
          <Route path="/" element={<Dashboard />} />
        {/* Super Bowl LX Landing Page */}
        <Route path="/match/nfl/401772988" element={<SuperBowlPage darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/match/nfl/seahawks-vs-patriots-super-bowl-lx-2026" element={<SuperBowlPage darkMode={darkMode} toggleTheme={toggleTheme} />} />
        
        <Route path="/match/:leagueId/:matchId" element={<MatchDetailPageWrapper />} />
        {/* Support SEO-friendly URLs: /match/[leagueId]/[slug]-[matchId] */}
        <Route path="/match/:leagueId/:slugAndId" element={<MatchDetailPageWrapper />} />
        <Route path="/standings/:leagueId" element={<StandingsPage darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/leagues" element={<LeaguesPage darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/news" element={<NewsPage darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/world-cup-2026" element={<WorldCupPage darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/schedule" element={<SchedulePage darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/sitemap" element={<SitemapPage darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/player-compare" element={<PlayerComparisonPage darkMode={darkMode} toggleTheme={toggleTheme} />} />   
        <Route path="/fixture-difficulty" element={<FixtureDifficulty darkMode={darkMode} toggleTheme={toggleTheme} />} />
        {/* Redirect old route to new one */}
        <Route path="/fantasy-nba/player-compare" element={<Navigate to="/game-tools/fantasy-nba/player-compare" replace />} />
        <Route path="/fantasy-premier-league-tool" element={<FantasyToolsPage darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/fantasy-premier-league" element={<FPLLanding darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/nba-fantasy" element={<NBAFantasyLanding darkMode={darkMode} toggleTheme={toggleTheme} />} />

        {/* Game Tools Routes */}
        <Route path="/game-tools" element={<GameToolsMenu darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/game-tools/fantasy-premier-league" element={<FPLToolsLayout darkMode={darkMode} toggleTheme={toggleTheme} />}>
            <Route index element={<Navigate to="comparison" replace />} />
            <Route path="comparison" element={<PlayerComparisonPage darkMode={darkMode} toggleTheme={toggleTheme} hideLayout={true} />} />
            <Route path="differential" element={<DifferentialFinder />} />
            <Route path="radar" element={<DifferentialRadar />} />
            <Route path="budget-finder" element={<BudgetAlternativeFinder />} />
            <Route path="captaincy" element={<CaptaincyDecider />} />
            <Route path="standings" element={<StandingsPage darkMode={darkMode} toggleTheme={toggleTheme} leagueId="eng.1" hideLayout={true} />} />
            <Route path="fixture" element={<FixtureDifficulty darkMode={darkMode} toggleTheme={toggleTheme} hideLayout={true} />} />
        </Route>
        
        {/* NBA Tools Routes */}
        <Route path="/game-tools/fantasy-nba" element={<NBAToolsLayout darkMode={darkMode} toggleTheme={toggleTheme} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<NBAFantasyDashboard />} />
            <Route path="player-compare" element={<NBAPlayerCompare />} />
            <Route path="sleeper" element={<NBASleeperPicker />} />
            <Route path="b2b" element={<NBAB2BOptimizer />} />
            <Route path="player/:playerId/:playerName?" element={<NBAPlayerDetail />} />
        </Route>

        {/* NFL Tools Routes */}
        <Route path="/game-tools/fantasy-nfl" element={<NFLToolsLayout darkMode={darkMode} toggleTheme={toggleTheme} />}>
            <Route index element={<Navigate to="player-compare" replace />} />
            <Route path="player-compare" element={<NFLPlayerCompare />} />
            <Route path="trending" element={<NFLTrending />} />
            <Route path="schedule-difficulty" element={<NFLScheduleDifficulty />} />
        </Route>
        <Route path="/nfl-fantasy" element={<NFLFantasyLanding darkMode={darkMode} toggleTheme={toggleTheme} />} />

        {/* Super Bowl LX Landing Page */}
        <Route path="/match/nfl/seahawks-vs-patriots-super-bowl-lx-2026" element={<SuperBowlPage darkMode={darkMode} toggleTheme={toggleTheme} />} />

        {/* Dynamic SEO Landing Pages */}
        {SEO_PAGES.map((page) => (
          <React.Fragment key={page.slug}>
            <Route
              path={`/${page.slug}`}
              element={
                <SEOArticlePage
                  title={page.title}
                  description={page.description}
                  h1={page.h1}
                  content={page.content}
                  keywords={page.keyword}
                  relatedLeagueId={page.relatedLeagueId}
                  darkMode={darkMode}
                  toggleTheme={toggleTheme}
                />
              }
            />
          </React.Fragment>
        ))}

        {/* SEO Landing Pages */}
        <Route 
          path="/nba-live-scores" 
          element={
            <LeagueLandingPage 
              leagueId="nba"
              title="NBA Live Scores, Standings & Schedule 2025"
              description="Get real-time NBA scores, live updates, standings, and schedule for the 2025-26 season. Follow your favorite teams with instant match statistics."
              keywords="NBA Scores, NBA Standings, NBA Schedule, Live Basketball Scores, NBA Results 2025, nfl scores, nba scores, champions league, cricket live, mlb scores, formula 1, nhl scores, super bowl, nba games today, epl table, football scores, nfl games today, nba standings, tennis, live sports, nba playoffs, soccer, mma, boxing, world cup"
              heroColor="bg-orange-600"
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          } 
        />
        <Route 
          path="/nfl-scores" 
          element={
            <LeagueLandingPage 
              leagueId="nfl"
              title="NFL Live Scores, Standings & Schedule"
              description="Get real-time NFL scores, live updates, standings, and schedule. Follow the road to the Super Bowl with instant match statistics."
              keywords="NFL Scores, NFL Standings, NFL Schedule, Live Football Scores, Super Bowl"
              heroColor="bg-blue-900"
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          } 
        />
        <Route 
          path="/champions-league-results"  
          element={
            <LeagueLandingPage 
              leagueId="uefa.champions"
              title="UEFA Champions League Results & Fixtures"
              description="Follow the UEFA Champions League with live scores, match results, group tables, and knockout stage fixtures. The ultimate European football coverage."
              keywords="Champions League Scores, UCL Results, UEFA Fixtures, Live Football Scores, European Football"
              heroColor="bg-blue-800"
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          } 
        />
        <Route 
          path="/premier-league-fixtures" 
          element={
            <LeagueLandingPage 
              leagueId="eng.1"
              title="Premier League Live Scores, Table & News"
              description="Experience the English Premier League like never before. Live scores, up-to-the-minute table standings, and fixtures for all 20 EPL clubs."
              keywords="Premier League Scores, EPL Table, Premier League Fixtures, Live Football, England Football Results, nfl scores, nba scores, champions league, cricket live, mlb scores, formula 1, nhl scores, super bowl, nba games today, epl table, football scores, nfl games today, nba standings, tennis, live sports, nba playoffs, soccer, mma, boxing, world cup"
              heroColor="bg-purple-700"
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          } 
        />
        <Route 
          path="/la-liga-standings" 
          element={
            <LeagueLandingPage 
              leagueId="esp.1"
              title="La Liga Match Results & Standings"
              description="Real-time Spanish La Liga football scores and standings. Follow Real Madrid, Barcelona, and Atletico Madrid with live match statistics."
              keywords="La Liga Scores, Spanish Football, La Liga Table, El Clasico, Live Soccer Results, nfl scores, nba scores, champions league, cricket live, mlb scores, formula 1, nhl scores, super bowl, nba games today, epl table, football scores, nfl games today, nba standings, tennis, live sports, nba playoffs, soccer, mma, boxing, world cup"
              heroColor="bg-red-600"
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          } 
        />
        <Route 
          path="/bundesliga-scores" 
          element={
            <LeagueLandingPage 
              leagueId="ger.1"
              title="Bundesliga Scores & Fixtures"
              description="Track every German Bundesliga match with live scores, team lineups, and comprehensive stats. The home of German top-flight football."
              keywords="Bundesliga Scores, German Football, Bundesliga Table, Bayern Munich, Dortmund, Live Results"
              heroColor="bg-red-700"
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          } 
        />
        <Route 
          path="/ligue-1-match-stats" 
          element={
            <LeagueLandingPage 
              leagueId="fra.1"
              title="Ligue 1 Live Stats & Results"
              description="Your source for French Ligue 1 live scores and match statistics. Follow PSG, Marseille, and Lyon with instant goal updates."
              keywords="Ligue 1 Scores, French Football, Ligue 1 Standings, PSG Live, Soccer Stats"
              heroColor="bg-blue-600"
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          } 
        />
        <Route 
          path="/serie-a-live-football" 
          element={
            <LeagueLandingPage 
              leagueId="ita.1"
              title="Serie A Match Schedule & Standings"
              description="Live Italian Serie A football scores, schedule, and league table. Keep up with Juventus, AC Milan, and Inter Milan match results."
              keywords="Serie A Scores, Italian Football, Serie A Table, Calcio, Live Matches, nfl scores, nba scores, champions league, cricket live, mlb scores, formula 1, nhl scores, super bowl, nba games today, epl table, football scores, nfl games today, nba standings, tennis, live sports, nba playoffs, soccer, mma, boxing, world cup"
              heroColor="bg-blue-500"
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          } 
        />
        <Route 
          path="/copa-del-rey-scores" 
          element={
            <LeagueLandingPage 
              leagueId="esp.copa_del_rey"
              title="Copa del Rey Live Scores & Fixtures"
              description="Follow the Spanish Copa del Rey with live scores, match results, and tournament fixtures. Real-time updates for Spain's premier cup competition."
              keywords="Copa del Rey Scores, Spanish Cup, Copa del Rey Fixtures, Live Football Scores, Spain Soccer"
              heroColor="bg-orange-600"
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          } 
        />
        <Route 
          path="/coppa-italia-results" 
          element={
            <LeagueLandingPage 
              leagueId="ita.coppa_italia"
              title="Coppa Italia Match Results & Schedule"
              description="Get real-time Coppa Italia scores, live updates, and tournament schedule. Follow Italy's top cup competition with instant match statistics."
              keywords="Coppa Italia Scores, Italian Cup, Coppa Italia Fixtures, Live Soccer Results, Italy Football"
              heroColor="bg-green-600"
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          } 
        />
        <Route 
          path="/fa-cup-fixtures" 
          element={
            <LeagueLandingPage 
              leagueId="eng.fa"
              title="FA Cup Live Scores, Draw & News"
              description="Experience the magic of the FA Cup. Live scores, tournament bracket updates, and fixtures for the world's oldest national football competition."
              keywords="FA Cup Scores, FA Cup Draw, FA Cup Fixtures, Live Football, England Cup Results, nfl scores, nba scores, champions league, cricket live, mlb scores, formula 1, nhl scores, super bowl, nba games today, epl table, football scores, nfl games today, nba standings, tennis, live sports, nba playoffs, soccer, mma, boxing, world cup"
              heroColor="bg-red-600"
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          } 
        />

      </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
