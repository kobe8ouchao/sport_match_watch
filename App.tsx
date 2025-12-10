import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import LeagueNav from './components/LeagueNav';
import MatchCard from './components/MatchCard';
import CalendarModal from './components/CalendarModal';
import InlineCalendar from './components/InlineCalendar';
import FeaturedCarousel from './components/FeaturedCarousel';
import Footer from './components/Footer';
import { LEAGUES, MOCK_MATCHES } from './constants';
import { Match } from './types';
import { fetchMatches } from './services/api';
import { isSameDay } from './utils';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Default to Premier League (eng.1) instead of generic top to ensure data
  const [selectedLeagueId, setSelectedLeagueId] = useState('eng.1'); 
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [matches, setMatches] = useState<Match[]>([]);
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
        const data = await fetchMatches(selectedLeagueId, selectedDate);
        setMatches(data);
      } catch (error) {
        console.error("Error loading matches:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [selectedDate, selectedLeagueId]);

  // Derive hot matches for banner (Mix of mock for visuals + real if available, or just mock for banner stability)
  const hotMatches = useMemo(() => {
    return MOCK_MATCHES.filter(m => m.isHot);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${
        darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'
    }`}>
      
      {/* Ambient Background Elements (Liquid Glass Effect - Pantone Theme) */}
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
        />

        {/* Top Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-4 animate-fade-in">
           <div className="lg:col-span-9 h-full">
              <FeaturedCarousel matches={hotMatches} />
           </div>
           <div className="hidden lg:block lg:col-span-3 h-80 md:h-96">
              <InlineCalendar 
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  matches={matches} // Use real matches for dots
              />
           </div>
        </div>

        {/* Navigation Section */}
        <div className="sticky top-0 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2 mb-6 backdrop-blur-xl bg-white/10 dark:bg-black/10 transition-all">
            <LeagueNav 
                leagues={LEAGUES}
                selectedLeagueId={selectedLeagueId}
                onSelectLeague={setSelectedLeagueId}
            />
        </div>

        {/* Content Section */}
        <div className="pb-8 min-h-[400px]">
            {/* Context Title */}
            <div className="mb-4 flex items-center space-x-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {isSameDay(selectedDate, new Date()) ? "Today's Matches" : selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
                    {matches.map(match => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500 text-center glass-card rounded-3xl mx-auto max-w-lg">
                    <div className="h-16 w-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <span className="text-3xl grayscale">⚽</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No matches found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-xs mx-auto">
                        No games scheduled for this league on this date.
                    </p>
                </div>
            )}
        </div>
      </div>

      <Footer />

      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        matches={matches}
      />
    </div>
  );
};

export default App;