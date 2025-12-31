import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, TrendingUp, Users, Award, ChevronRight, BarChart3, Calendar, Target, HelpCircle, Trophy, Activity } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface NBAFantasyLandingProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const NBAFantasyLanding: React.FC<NBAFantasyLandingProps> = ({ darkMode, toggleTheme }) => {
  
  // SEO Meta Tags
  useEffect(() => {
    document.title = "NBA Fantasy Basketball - Official Fantasy Game & Tools | SportsLive";
    
    const setMeta = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('name', name);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    setMeta('description', 'The official NBA Fantasy Basketball game. Create or join a league, draft your team, and compete against friends. Access advanced player comparison tools and stats.');
    setMeta('keywords', 'NBA Fantasy, Fantasy Basketball, NBA Fantasy League, Fantasy Draft, NBA Player Stats, Fantasy Basketball Tools, Waiver Wire, Sleeper Picks, NBA Commish');
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-500 relative flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      
      {/* Background Ambient */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-2 flex-grow flex flex-col">
        <Header darkMode={darkMode} toggleTheme={toggleTheme} onOpenCalendar={() => {}} isCalendarOpen={false} />

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center py-20 lg:py-32 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-6 border border-orange-500/20">
                <Trophy size={14} />
                <span>The Official Game</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-gray-400">
                Dominate Your <br/> NBA Fantasy League
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl leading-relaxed">
                Experience the thrill of managing your own NBA team. Draft stars, make trades, and use our advanced <strong>Player Comparison</strong> tools to gain the edge.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <a 
                    href="http://fantasy.nba.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all shadow-lg hover:shadow-orange-600/30 hover:scale-105 active:scale-95"
                >
                    <Gamepad2 size={20} />
                    <span>Play Now</span>
                    <ChevronRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                </a>
                <Link 
                    to="/game-tools/fantasy-nba/player-compare" 
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
            <Link to="/game-tools/fantasy-nba/player-compare" className="group relative p-8 rounded-3xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-orange-500/30 dark:hover:border-orange-500/30 transition-all hover:shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Users size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Head-to-Head Comparison</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Compare NBA players side-by-side. Analyze usage rates, shooting efficiency, and fantasy points per game to make the smartest trade and waiver wire decisions.
                    </p>
                </div>
            </Link>

            {/* Live Scoring Card (External) */}
            <a href="http://fantasy.nba.com/" target="_blank" rel="noopener noreferrer" className="group relative p-8 rounded-3xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all hover:shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Live Scoring & Leagues</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Track your team's performance in real-time. Join public leagues or create a private league with friends. The ultimate fantasy basketball experience.
                    </p>
                </div>
            </a>
        </div>

        {/* Value Proposition Section */}
        <div className="w-full max-w-6xl mx-auto py-16 mb-20 border-t border-b border-gray-200 dark:border-white/5">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Play NBA Fantasy?</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Take your love for the game to the next level. Managing a fantasy team gives you a rooting interest in every game on the schedule.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 mb-6">
                        <BarChart3 size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Deep Stats</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Go beyond points and rebounds. Analyze advanced metrics like Player Efficiency Rating (PER), Usage Rate, and True Shooting Percentage.
                    </p>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Daily Action</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        With games almost every night, the action never stops. Set your lineup daily or weekly and watch the points pile up.
                    </p>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                        <Target size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Draft & Trade</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Build your dynasty through the draft or pull off a blockbuster trade. Manage your roster spots and work the waiver wire to find hidden gems.
                    </p>
                </div>
            </div>
        </div>

        {/* SEO / FAQ Content */}
        <div className="max-w-4xl mx-auto w-full mb-20 px-4">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <HelpCircle className="text-orange-500" />
                <span>Frequently Asked Questions</span>
            </h2>

            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">How do I join an NBA Fantasy League?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        You can join a public league on the <a href="http://fantasy.nba.com/" className="text-blue-500 hover:underline">official NBA Fantasy site</a> or create a private league to play with friends. Leagues typically range from 8 to 12 teams.
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">What is the difference between Points and Category leagues?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        In <strong>Points Leagues</strong>, everything a player does (points, rebounds, assists) has a point value, and the team with the most total points wins. In <strong>Category Leagues</strong>, you compete to win specific stat categories (like FG%, 3PM, STL) against your opponent each week.
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Who are the top fantasy players for the 2025-26 season?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        Perennial superstars like Nikola Jokic, Luka Doncic, and Giannis Antetokounmpo are top picks due to their ability to fill the stat sheet. Emerging stars like Victor Wembanyama are also highly coveted for their unique stat profiles (blocks + 3s).
                    </p>
                </div>
            </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default NBAFantasyLanding;
