import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import InlineCalendar from './InlineCalendar';
import MatchCard from './MatchCard';
import { fetchMatches } from '../services/api';
import { MatchWithHot, LEAGUES } from '../constants';
import { Loader2 } from 'lucide-react';
import { isSameDay } from '../utils';

const SchedulePage: React.FC<{ toggleTheme: () => void; darkMode: boolean }> = ({ toggleTheme, darkMode }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [matches, setMatches] = useState<MatchWithHot[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarEntries, setCalendarEntries] = useState<{ date: Date; sport: 'basketball' | 'soccer'; leagueId: string }[]>([]);

  // We can fetch 'top' or allow user to filter. For a "Schedule" page, showing all (top) is good, or maybe a dropdown?
  // Let's stick to 'top' (aggregated) by default, similar to home but focused on date navigation.
  const [selectedLeagueId, setSelectedLeagueId] = useState('top');

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

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-orange-100/40 dark:bg-orange-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        <Header
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          onOpenCalendar={() => {}}
          isCalendarOpen={false}
          hideCalendarButton
        />

        <div className="mt-8 mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Match Schedule</h1>
                    <p className="text-gray-500 dark:text-gray-400">View upcoming fixtures and results.</p>
                </div>
                
                {/* Simple League Filter */}
                <select 
                    value={selectedLeagueId} 
                    onChange={(e) => setSelectedLeagueId(e.target.value)}
                    className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                >
                    {LEAGUES.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Calendar */}
                <div className="lg:col-span-4 order-2 lg:order-1">
                     <div className="sticky top-24">
                        <InlineCalendar
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                            entries={calendarEntries}
                        />
                     </div>
                </div>

                {/* Right: Matches */}
                <div className="lg:col-span-8 order-1 lg:order-2">
                     <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                             {isSameDay(selectedDate, new Date()) ? "Today's Matches" : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h2>
                        <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full">
                            {matches.length} Games
                        </span>
                     </div>

                     {loading ? (
                        <div className="flex justify-center py-20">
                             <Loader2 className="animate-spin text-gray-400" size={40} />
                        </div>
                     ) : matches.length > 0 ? (
                        <div className="grid gap-4">
                            {matches.map(match => (
                                <MatchCard 
                                    key={match.id} 
                                    match={match} 
                                    showLeagueLogo={selectedLeagueId === 'top'}
                                    // No onClick navigation for now or reuse logic? 
                                    // User didn't specify, but linking to detail is standard.
                                    onClick={() => window.open(`/match/${match.leagueId}/${match.id}`, '_blank')}
                                />
                            ))}
                        </div>
                     ) : (
                        <div className="glass-card rounded-3xl p-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No matches scheduled for this date.</p>
                        </div>
                     )}
                </div>
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SchedulePage;
