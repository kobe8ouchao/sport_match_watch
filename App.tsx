import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './components/Header';
import LeagueNav from './components/LeagueNav';
import MatchCard from './components/MatchCard';
import CalendarModal from './components/CalendarModal';
import InlineCalendar from './components/InlineCalendar';
import FeaturedCarousel from './components/FeaturedCarousel';
import Footer from './components/Footer';
import { LEAGUES, MOCK_MATCHES, MatchWithHot } from './constants';
import { fetchMatches } from './services/api';
import { isSameDay } from './utils';
import { Loader2 } from 'lucide-react';
import MatchDetail from './components/MatchDetail';
import StandingsWidget from './components/StandingsWidget';

// Wrapper to handle navigation
const Dashboard: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLeagueId, setSelectedLeagueId] = useState('top');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const navigate = useNavigate();

  const handleSelectLeague = (id: string) => {
    setSelectedLeagueId(id);
    if (id === 'top') {
      setSelectedDate(new Date());
    }
  };

  const [matches, setMatches] = useState<MatchWithHot[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<{ date: Date; sport: 'basketball' | 'soccer'; leagueId: string }[]>([]);
  const [featuredMatches, setFeaturedMatches] = useState<MatchWithHot[]>([]);
  const [featuredCalendarEntries, setFeaturedCalendarEntries] = useState<{ date: Date; sport: 'basketball' | 'soccer'; leagueId: string }[]>([]);
  const [loading, setLoading] = useState(false);

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
        const { matches, calendar } = await fetchMatches(selectedLeagueId, selectedDate);
        setMatches(matches);
        setCalendarEntries(calendar);
      } catch (error) {
        console.error("Error loading matches:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [selectedDate, selectedLeagueId]);

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
          
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="flex-shrink-0 p-2.5 rounded-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-all shadow-sm hover:shadow-md active:scale-95"
            title="Select Date"
          >
            <span className="sr-only">Select Date</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </button>
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

              {loading ? (
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
                    />
                  ))}
                </div>
              ) : (
                 <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl">
                    <div className="h-16 w-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                      <span className="text-3xl grayscale">⚽</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No matches found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      No games scheduled for this league on this date.
                    </p>
                 </div>
              )}
          </div>

          {/* RIGHT COLUMN: Banner & Standings */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Banner / Featured Carousel */}
            <div className="w-full">
               <div className="flex items-center space-x-2 h-8 mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Featured</h3>
               </div>
              <FeaturedCarousel
                matches={hotMatches}
                onMatchClick={(m) => openMatchDetail(m.id, m.leagueId)}
              />
            </div>

            {/* Standings */}
            <div className="w-full space-y-6">
              {selectedLeagueId === 'top' ? (
                <>
                  <StandingsWidget leagueId="nba" />
                  <StandingsWidget leagueId="eng.1" />
                  <StandingsWidget leagueId="esp.1" />
                  <StandingsWidget leagueId="ita.1" />
                  <StandingsWidget leagueId="ger.1" />
                  <StandingsWidget leagueId="fra.1" />
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
    </div>
  );
};

// Detail Page Component
const MatchDetailPageWrapper: React.FC = () => {
  const { leagueId, matchId } = useParams<{ leagueId: string; matchId: string }>();
  const navigate = useNavigate();

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

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/match/:leagueId/:matchId" element={<MatchDetailPageWrapper />} />
        <Route path="/standings/:leagueId" element={<StandingsPage darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />} />
      </Routes>
    </Router>
  );
};

export default App;
