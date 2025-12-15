import React from 'react';
import { LEAGUES } from '../constants';
import Header from './Header';
import Footer from './Footer';
import NewsSection from './NewsSection';

const NewsPage: React.FC<{ toggleTheme: () => void; darkMode: boolean }> = ({ toggleTheme, darkMode }) => {
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
          onOpenCalendar={() => {}}
          isCalendarOpen={false}
          hideCalendarButton
        />

        <div className="mt-8 mb-12 space-y-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sports News</h1>
                <p className="text-gray-500 dark:text-gray-400">Latest headlines from around the world of sports.</p>
            </div>

            {/* Top Headlines */}
            <section>
                <div className="flex items-center space-x-2 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Headlines</h2>
                </div>
                <NewsSection leagueId="top" />
            </section>
            
            {/* NBA News */}
            <section className="pt-8 border-t border-gray-200/50 dark:border-white/5">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="h-8 w-8 flex items-center justify-center">
                        <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nba.png" alt="NBA" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">NBA News</h2>
                </div>
                <NewsSection leagueId="nba" />
            </section>

            {/* Iterate over leagues */}
            {LEAGUES.filter(l => l.id !== 'top' && l.id !== 'nba').map((league) => (
                <section key={league.id} className="pt-8 border-t border-gray-200/50 dark:border-white/5">
                    <div className="flex items-center space-x-3 mb-6">
                         <div className="h-8 w-8 flex items-center justify-center">
                            {typeof league.logo === 'string' ? (
                                <img src={league.logo} alt={league.name} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-blue-500">{league.logo}</span>
                            )}
                         </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{league.name} News</h2>
                    </div>
                    <NewsSection leagueId={league.id} />
                </section>
            ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NewsPage;
