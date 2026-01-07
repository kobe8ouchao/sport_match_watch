import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, TrendingUp, Users, Award, ChevronRight, BarChart3, Calendar, Target, HelpCircle, Trophy, Activity, ArrowUpRight } from 'lucide-react';
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

    setMeta('description', 'The official home of NFL Fantasy Football. Get the latest fantasy news, rankings, projections, and start/sit advice. Use our advanced player comparison tools to dominate your league.');
    setMeta('keywords', 'NFL Fantasy, Fantasy Football, NFL Fantasy Football, Fantasy News, Player Rankings, Start Sit Advice, Waiver Wire, Fantasy Sleepers, NFL Draft, Mock Draft, PPR Rankings, Dynasty Fantasy Football');
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full mb-20">
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
