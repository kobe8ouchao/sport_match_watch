import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Activity, ArrowRight, Gamepad2, TrendingUp } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface GameToolsMenuProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const GameToolsMenu: React.FC<GameToolsMenuProps> = ({ darkMode, toggleTheme }) => {
  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Ambient Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-purple-100/40 dark:bg-purple-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-grow w-full">
        <Header
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          onOpenCalendar={() => {}}
          isCalendarOpen={false}
          hideCalendarButton
        />

        <div className="py-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl md:text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    Fantasy Game Tools
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    Gain the competitive edge with our advanced analytics and planning tools for your fantasy leagues.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* FPL Tool Card */}
                <Link to="/game-tools/fpl" className="group relative overflow-hidden rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-4 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                <Trophy size={32} />
                            </div>
                            <ArrowRight className="text-gray-300 dark:text-gray-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                        </div>
                        
                        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            Fantasy Premier League
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            Comprehensive tools for FPL managers including Player Comparison Radar, Fixture Difficulty Planner, and Live Bonus Points tracker.
                        </p>

                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                Player Comparison
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                Team Stats
                            </span>
                        </div>
                    </div>
                </Link>

                {/* NBA Tool Card */}
                <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-xl opacity-75 cursor-not-allowed">
                     <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-4 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                <Activity size={32} />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-gray-500">COMING SOON</span>
                        </div>
                        
                        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                            NBA Fantasy Tool
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            Advanced metrics for NBA Fantasy including Daily Projections, Schedule Grid, and Player Rater.
                        </p>

                        <div className="flex flex-wrap gap-2">
                             <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                Projections
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                Schedule Grid
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GameToolsMenu;
