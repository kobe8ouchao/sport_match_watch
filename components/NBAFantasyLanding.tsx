import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, TrendingUp, Users, Award, ChevronRight, BarChart3, Calendar, Target, HelpCircle, Trophy, Activity } from 'lucide-react';

// Discord Icon Component
const DiscordIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);
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

    setMeta('description', 'The official NBA Fantasy Basketball game. Create or join a league, draft your team, and compete against friends. Access advanced player comparison, sleeper picker, and playoff schedule analysis tools.');
    setMeta('keywords', 'NBA Fantasy, Fantasy Basketball, NBA Fantasy League, Fantasy Draft, NBA Player Stats, Fantasy Basketball Tools, Waiver Wire, Sleeper Picks, NBA Commish, Playoff Schedule, Schedule Analysis, Fantasy Playoffs');
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
                    to="/game-tools/fantasy-nba/player-compare"
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

            {/* Playoff Schedule Analysis Card */}
            <Link to="/game-tools/fantasy-nba/dashboard" className="group relative p-8 rounded-3xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-purple-500/30 dark:hover:border-purple-500/30 transition-all hover:shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Trophy size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Playoff Schedule Analysis</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Plan your championship run. Visualize schedule density, identify off-night advantages, and maximize games played during the fantasy playoffs.
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
                <Link to="/game-tools/fantasy-nba/sleeper" className="group flex flex-col items-center text-center hover:transform hover:scale-105 transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
                        <TrendingUp size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Sleeper Picker</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Find hidden gems before your opponents. Filter by ownership % and identify players with recent minutes surges.
                    </p>
                </Link>

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
