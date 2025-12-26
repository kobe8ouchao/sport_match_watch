import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { LEAGUES } from '../constants';

const SitemapPage: React.FC<{ toggleTheme: () => void; darkMode: boolean }> = ({ toggleTheme, darkMode }) => {
  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-orange-100/40 dark:bg-orange-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        <Header
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          onOpenCalendar={() => {}}
          isCalendarOpen={false}
          hideCalendarButton
        />

        <div className="mt-8 mb-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Sitemap</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* General Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">General</h2>
                    <ul className="space-y-2">
                        <li><Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Home</Link></li>
                        <li><Link to="/leagues" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Leagues</Link></li>
                        <li><Link to="/schedule" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Schedule</Link></li>
                        <li><Link to="/news" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">News</Link></li>
                        <li><Link to="/player-comparison" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Player Comparison</Link></li>
                        <li><Link to="/world-cup-2026" className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">FIFA World Cup 2026™</Link></li>
                    </ul>
                </div>

                {/* Leagues Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">Leagues</h2>
                    <ul className="space-y-2">
                        {LEAGUES.filter(l => l.id !== 'top').map(league => (
                            <li key={league.id}>
                                <Link to={`/standings/${league.id}`} className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    {league.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Resources Section */}
                  {/* Partners & External */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">Partners</h2>
           
            <ul className="space-y-2 gap-8">
              <li>
                <a href="https://www.nba.com" target="_blank" rel="noopener noreferrer" title="Visit NBA Official Site" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  NBA Official
                </a>
              </li>
              <li>
                <a href="https://www.espn.com" target="_blank" rel="noopener noreferrer" title="Visit ESPN Sports News" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  ESPN
                </a>
              </li>
               <li>
                <a href="https://www.premierleague.com" target="_blank" rel="noopener noreferrer" title="Visit Premier League Official Site" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  Premier League
                </a>
              </li>
              <li>
                <a href="https://www.uefa.com/uefachampionsleague/" target="_blank" rel="noopener noreferrer" title="Visit UEFA Champions League" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  Champions League
                </a>
              </li>
              <li>
                <a href="https://www.bbc.com/sport" target="_blank" rel="noopener noreferrer" title="Visit BBC Sport" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  BBC Sport
                </a>
              </li>
              <li>
                <a href="https://www.skysports.com/" target="_blank" rel="noopener noreferrer" title="Visit Sky Sports" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  Sky Sports
                </a>
              </li>
              <li>
                <a href="https://sports.yahoo.com/" target="_blank" rel="noopener noreferrer" title="Visit Yahoo Sports" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  Yahoo Sports
                </a>
              </li>
            </ul>
          </div>  
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SitemapPage;
