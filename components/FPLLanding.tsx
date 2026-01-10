import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Shield, TrendingUp, Users, Award, ChevronRight, BarChart3, Calendar, Target, HelpCircle } from 'lucide-react';

// Discord Icon Component
const DiscordIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);
import Header from './Header';
import Footer from './Footer';

interface FPLLandingProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const FPLLanding: React.FC<FPLLandingProps> = ({ darkMode, toggleTheme }) => {
  
  // SEO Meta Tags
  useEffect(() => {
    document.title = "Fantasy Premier League (FPL) Tools - Player Comparison & Stats | SportsLive";
    
    const setMeta = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('name', name);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    setMeta('description', 'Free Fantasy Premier League (FPL) tools to help you win your mini-league. Advanced player comparison, fixture difficulty ticker (FDR), and expected goals (xG) stats.');
    setMeta('keywords', 'Fantasy Premier League, FPL, FPL Tools, FPL Stats, Player Comparison, Fixture Difficulty, FDR, xG, Expected Goals, FPL Tips, Premier League Fantasy, FPL Planner, Double Gameweek');
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-500 relative flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      
      {/* Background Ambient */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-2 flex-grow flex flex-col">
        <Header darkMode={darkMode} toggleTheme={toggleTheme} onOpenCalendar={() => {}} isCalendarOpen={false} />

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center py-20 lg:py-32 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 border border-blue-500/20">
                <Award size={14} />
                <span>The Ultimate FPL Companion</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-gray-400">
                Win Your Fantasy <br/> Premier League
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl leading-relaxed">
                Make data-driven transfer decisions with our advanced <strong>Player Comparison</strong> and <strong>Fixture Difficulty</strong> tools. Join thousands of managers using stats to climb the ranks.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link
                    to="/fantasy-premier-league-tool"
                    className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg hover:shadow-blue-600/30 hover:scale-105 active:scale-95"
                >
                    <Gamepad2 size={20} />
                    <span>Launch Free Tools</span>
                    <ChevronRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                    href="https://discord.gg/JVhxHWtM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold transition-all shadow-lg hover:shadow-[#5865F2]/30 hover:scale-105 active:scale-95"
                >
                    <DiscordIcon className="w-5 h-5" />
                    <span>Join Discord</span>
                </a>
                <a
                    href="https://fantasy.premierleague.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold transition-all hover:scale-105 active:scale-95"
                >
                    <span>Official FPL Site</span>
                </a>
            </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full mb-20">
            {/* Player Comparison Card */}
            <Link to="/fantasy-premier-league-tool" className="group relative p-8 rounded-3xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all hover:shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Users size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Head-to-Head Comparison</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Stuck between two premium assets? Compare goals, assists, <strong>xG (Expected Goals)</strong>, creativity, and influence side-by-side to make the optimal transfer.
                    </p>
                </div>
            </Link>

            {/* Fixture Difficulty Card */}
            <Link to="/fantasy-premier-league-tool" className="group relative p-8 rounded-3xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-green-500/30 dark:hover:border-green-500/30 transition-all hover:shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Fixture Difficulty Ticker</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Plan ahead with our advanced FDR. Visualize the next 5 gameweeks, sort by <strong>Attack Strength</strong> or <strong>Defensive Weakness</strong>, and find the teams with the easiest run.
                    </p>
                </div>
            </Link>
        </div>

        {/* Value Proposition Section */}
        <div className="w-full max-w-6xl mx-auto py-16 mb-20 border-t border-b border-gray-200 dark:border-white/5">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Use Our FPL Tools?</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Success in Fantasy Premier League requires more than just luck. Our platform provides the deep insights you need to consistently beat the average.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                        <BarChart3 size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Underlying Stats</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Don't just look at points. We track Expected Goals (xG), Key Passes, and Touches in the Box to identify players who are due for a haul before they explode.
                    </p>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Long-term Planning</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Our ticker looks 5 weeks ahead. Identify fixture swings early to plan your transfers, Wildcards, and Free Hits for maximum impact.
                    </p>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                        <Target size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Differential Picker</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Find low-ownership gems with high potential. Filter by price point and position to find the budget enablers that unlock your premium assets.
                    </p>
                </div>
            </div>
        </div>

        {/* SEO / FAQ Content */}
        <div className="max-w-4xl mx-auto w-full mb-20 px-4">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <HelpCircle className="text-blue-500" />
                <span>Frequently Asked Questions</span>
            </h2>

            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">What is the best way to compare FPL players?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        The most effective way is to look beyond total points. Use our <strong>Player Comparison Tool</strong> to analyze underlying stats like xG (Expected Goals) and xA (Expected Assists). A player with high xG but low actual goals is often "unlucky" and likely to score soon, making them a great differential pick.
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">How does the Fixture Difficulty Rating (FDR) work?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        FDR assigns a difficulty score to each match based on the opponent's strength. We calculate this using a blend of home/away form, defensive solidity, and attacking threat. A low score (green) indicates an easy fixture, while a high score (red) suggests a tough match where points might be hard to come by.
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">When should I play my Wildcard?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        Common strategies include using the first Wildcard between Gameweek 4-8 to jump on early bandwagons, or saving it for a fixture swing or double gameweek announcement. Use our <strong>Fixture Difficulty</strong> tool to spot when top teams (like Man City, Arsenal, or Liverpool) are entering a run of easy games.
                    </p>
                </div>
            </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default FPLLanding;
