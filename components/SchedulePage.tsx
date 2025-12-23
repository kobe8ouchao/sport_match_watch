import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import HorizontalCalendar from './HorizontalCalendar';
import MatchCard from './MatchCard';
import NewsSection from './NewsSection';
import { fetchMatches } from '../services/api';
import { MatchWithHot, LEAGUES } from '../constants';
import { Loader2 } from 'lucide-react';
import { isSameDay } from '../utils';

const SchedulePage: React.FC<{ toggleTheme: () => void; darkMode: boolean }> = ({ toggleTheme, darkMode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get date from URL or default to today
  const dateParam = searchParams.get('date');
  const initialDate = dateParam ? new Date(dateParam + 'T12:00:00') : new Date(); // Adding time to avoid timezone shifts
  
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [matches, setMatches] = useState<MatchWithHot[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarEntries, setCalendarEntries] = useState<{ date: Date; sport: 'basketball' | 'soccer'; leagueId: string }[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState('top');

  // Update URL when date changes
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    setSearchParams({ date: dateStr });
  };

  // SEO: Update document title
  useEffect(() => {
    const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.title = `Match Schedule for ${dateStr} - Sports Match`;
    
    // Update meta description if possible (requires a meta tag manager or direct DOM manipulation)
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', `View the full sports match schedule for ${dateStr}. NBA, Premier League, La Liga, and more.`);
    }
  }, [selectedDate]);

  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      try {
        const { matches, calendar } = await fetchMatches(selectedLeagueId, selectedDate);
        // Sort matches by time
        const sortedMatches = [...matches].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        setMatches(sortedMatches);
        setCalendarEntries(calendar);
      } catch (error) {
        console.error("Error loading matches:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [selectedDate, selectedLeagueId]);

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-orange-100/40 dark:bg-orange-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        <Header
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          onOpenCalendar={() => {}} // We have inline calendar
          isCalendarOpen={false}
          hideCalendarButton
        />

        <div className="mt-6 mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Match Schedule</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Upcoming fixtures and results for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
                    </p>
                </div>
                
                {/* League Filter */}
                <div className="relative">
                    <select 
                        value={selectedLeagueId} 
                        onChange={(e) => setSelectedLeagueId(e.target.value)}
                        className="appearance-none bg-transparent text-gray-900 dark:text-white text-sm font-medium pr-8 outline-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        {LEAGUES.map(l => (
                            <option key={l.id} value={l.id} className="text-gray-900 bg-white">{l.name}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                </div>
            </div>

            {/* Horizontal Calendar */}
            <div className="mb-8 sticky top-20 z-20">
                <HorizontalCalendar
                    selectedDate={selectedDate}
                    onSelectDate={handleDateSelect}
                    matches={matches}
                    calendarEntries={calendarEntries}
                />
            </div>

            {/* Matches List */}
            <div className="space-y-4">
                 <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                         {isSameDay(selectedDate, new Date()) ? "Today's Matches" : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h2>
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-normal pt-1">
                        ({matches.length} games)
                    </span>
                    {matches.length === 0 && !loading && (
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 italic pt-1">
                            - No matches scheduled
                        </span>
                    )}
                 </div>

                 {loading ? (
                    <div className="flex justify-center py-20">
                         <Loader2 className="animate-spin text-gray-400" size={40} />
                    </div>
                 ) : matches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {matches.map((match) => (
                            <MatchCard 
                                key={match.id} 
                                match={match} 
                                onClick={() => window.open(`/match/${match.leagueId}/${match.id}`, '_blank')}
                                showLeagueLogo={true}
                            />
                        ))}
                    </div>
                 ) : (
                    <div className="w-full text-left pt-4">
                        <NewsSection leagueId="top" />
                    </div>
                 )}
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SchedulePage;
