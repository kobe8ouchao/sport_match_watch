/*
 * @Descripttion: 
 * @Author: ouchao
 * @Email: ouchao@sendpalm.com
 * @version: 1.0
 * @Date: 2025-12-13 18:03:56
 * @LastEditors: ouchao
 * @LastEditTime: 2025-12-13 20:30:53
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { LEAGUES } from '../constants';
import Header from './Header';
import Footer from './Footer';

const LeaguesPage: React.FC<{ toggleTheme: () => void; darkMode: boolean }> = ({ toggleTheme, darkMode }) => {
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

        <div className="mt-8 mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Leagues</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Explore coverage for top basketball and soccer leagues worldwide.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {LEAGUES.filter(l => l.id !== 'top').map((league) => (
              <Link 
                key={league.id} 
                to={`/?league=${league.id}`} // Or maybe we should link to standings or filtered home? Let's link to home filtered by league logic if implemented, or just a simple card for now. The user said "list website's league categories". 
                // Since clicking a league usually filters the dashboard, maybe I should link to home with a query param? 
                // But App.tsx doesn't seem to read query params for league selection yet. 
                // I'll just make it a visual list for now, or link to Standings which is a dedicated page.
                // Let's link to Standings as it's a solid page for a league.
                className="group relative glass-card p-6 rounded-3xl border border-white/40 dark:border-white/5 hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center justify-center text-center gap-4 bg-white/60 dark:bg-white/5"
              >
                <div className="h-20 w-20 flex items-center justify-center p-4 bg-white dark:bg-white/10 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                  {typeof league.logo === 'string' ? (
                    <img src={league.logo} alt={league.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-black dark:text-white">{league.logo}</div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
                    {league.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {league.id === 'nba' ? 'Basketball' : 'Soccer'}
                  </p>
                </div>
                
                <div className="mt-4 w-full grid grid-cols-2 gap-2">
                    <Link 
                        to={`/standings/${league.id}`}
                        className="text-xs font-semibold py-1.5 px-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-black dark:hover:text-white transition-colors block text-center"
                    >
                        Standings
                    </Link>
                     <span className="text-xs font-semibold py-1.5 px-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-black dark:hover:text-white transition-colors">
                        News
                    </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LeaguesPage;
