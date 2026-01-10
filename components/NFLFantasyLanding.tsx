import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, TrendingUp, Users, Award, ChevronRight, BarChart3, Calendar, Target, HelpCircle, Trophy, Activity, ArrowUpRight } from 'lucide-react';

// Discord Icon Component
const DiscordIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

import Header from './Header';
import Footer from './Footer';

interface NFLFantasyLandingProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const NFLFantasyLanding: React.FC<NFLFantasyLandingProps> = ({ darkMode, toggleTheme }) => {
  
  // SEO Meta Tags
  useEffect(() => {
    document.title = "NFL Fantasy Football - Official Game, News & Tools | SportsLive";
    
    const setMeta = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('name', name);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    setMeta('description', 'The official home of NFL Fantasy Football. Get the latest fantasy news, rankings, projections, and start/sit advice. Use our advanced player comparison and schedule difficulty tools to dominate your league.');
    setMeta('keywords', 'NFL Fantasy, Fantasy Football, NFL Fantasy Football, Fantasy News, Player Rankings, Start Sit Advice, Waiver Wire, Fantasy Sleepers, NFL Draft, Mock Draft, PPR Rankings, Dynasty Fantasy Football, Schedule Difficulty, SOS, Strength of Schedule, Fantasy Playoffs');
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-500 relative flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      
      {/* Background Ambient */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-red-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-2 flex-grow flex flex-col">
        <Header darkMode={darkMode} toggleTheme={toggleTheme} onOpenCalendar={() => {}} isCalendarOpen={false} />

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center py-20 lg:py-32 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 border border-blue-600/20">
                <Trophy size={14} />
                <span>The Gridiron Awaits</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-gray-400">
                Win Your <br/> Fantasy Football League
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl leading-relaxed">
                Stay ahead of the competition with real-time stats, expert analysis, and powerful <strong>Player Comparison</strong> tools. The ultimate companion for your championship run.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <a
                    href="https://fantasy.nfl.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold transition-all shadow-lg hover:shadow-blue-700/30 hover:scale-105 active:scale-95"
                >
                    <Gamepad2 size={20} />
                    <span>Play Official Fantasy</span>
                    <ArrowUpRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                    href="https://discord.gg/JVhxHWtM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold transition-all shadow-lg hover:shadow-[#5865F2]/30 hover:scale-105 active:scale-95"
                >
                    <DiscordIcon className="w-5 h-5" />
                    <span>Join Discord</span>
                </a>
                <Link
                    to="/game-tools/fantasy-nfl/player-compare"
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold transition-all hover:scale-105 active:scale-95"
                >
                    <Activity size={20} />
                    <span>Comparison Tool</span>
                </Link>
            </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full mb-20">
            {/* Player Comparison Card */}
            <Link to="/game-tools/fantasy-nfl/player-compare" className="group relative p-8 rounded-3xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all hover:shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Users size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Head-to-Head Comparison</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Compare NFL players side-by-side. Analyze last 5 games, season trends, and fantasy points (PPR) to make the smartest start/sit decisions.
                    </p>
                </div>
            </Link>

            {/* Schedule Difficulty Card */}
            <Link to="/game-tools/fantasy-nfl/schedule-difficulty" className="group relative p-8 rounded-3xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-green-500/30 dark:hover:border-green-500/30 transition-all hover:shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Calendar size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Schedule Difficulty (SOS)</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Visualize defensive strength with our SOS Heatmap. Identify favorable matchups, regression warnings, and sleepers for the next 3 weeks.
                    </p>
                </div>
            </Link>

            {/* Official NFL Card (External) */}
            <a href="https://www.nfl.com/" target="_blank" rel="noopener noreferrer" className="group relative p-8 rounded-3xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-red-500/30 dark:hover:border-red-500/30 transition-all hover:shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Award size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                        Official NFL Site
                        <ArrowUpRight size={18} className="opacity-50" />
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Get the latest news, scores, stats, standings, and highlights directly from the National Football League official website.
                    </p>
                </div>
            </a>
        </div>

        {/* Quick Links Section */}
        <div className="max-w-4xl mx-auto w-full mb-20">
             <h2 className="text-2xl font-bold mb-8 text-center">Essential Fantasy Resources</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                     { name: 'Fantasy News', url: 'https://www.nfl.com/fantasy/', icon: <TrendingUp size={20} /> },
                     { name: 'Player Rankings', url: 'https://www.nfl.com/fantasy/football/rankings', icon: <BarChart3 size={20} /> },
                     { name: 'Schedule', url: 'https://www.nfl.com/schedules/', icon: <Calendar size={20} /> },
                     { name: 'Rulebook', url: 'https://operations.nfl.com/the-rules/2023-nfl-rulebook/', icon: <HelpCircle size={20} /> },
                 ].map((link, i) => (
                     <a 
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/30 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors gap-3 text-center group"
                     >
                         <div className="text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                             {link.icon}
                         </div>
                         <span className="font-semibold text-sm">{link.name}</span>
                     </a>
                 ))}
             </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default NFLFantasyLanding;
