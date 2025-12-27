import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Shield, TrendingUp, Users, Award, ChevronRight, BarChart3, Calendar, Target, HelpCircle } from 'lucide-react';
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
