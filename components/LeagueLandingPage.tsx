import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import StandingsWidget from './StandingsWidget';
import Header from './Header';
import Footer from './Footer';
import { ArrowRight, Trophy, Calendar, Activity } from 'lucide-react';

interface LeagueLandingPageProps {
  leagueId: string;
  title: string;
  description: string;
  keywords: string;
  heroColor: string; // Tailwind class like 'bg-blue-600'
  darkMode: boolean;
  toggleTheme: () => void;
}

const LeagueLandingPage: React.FC<LeagueLandingPageProps> = ({
  leagueId,
  title,
  description,
  keywords,
  heroColor,
  darkMode,
  toggleTheme,
}) => {

  // Update meta description and keywords on mount
  useEffect(() => {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    }
  }, [description, keywords]);

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      
      {/* Ambient Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full opacity-30 blur-[120px] ${heroColor.replace('bg-', 'bg-')}`} />
      </div>

      <div className="relative z-10 w-full flex-grow flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <Header
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                onOpenCalendar={() => {}}
                isCalendarOpen={false}
                hideCalendarButton
            />
        </div>

        {/* Hero Section */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="lg:w-1/2 space-y-8">
                    <h1 className="text-4xl lg:text-6xl font-black tracking-tight leading-tight">
                        {title}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                        {description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 pt-4">
                        <Link 
                            to={`/?league=${leagueId}`}
                            className={`inline-flex items-center px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-xl hover:scale-105 transition-transform duration-300 ${heroColor}`}
                        >
                            View Live Dashboard
                            <ArrowRight className="ml-2" size={20} />
                        </Link>
                        <Link 
                            to={`/standings/${leagueId}`}
                            className="inline-flex items-center px-8 py-4 rounded-2xl bg-white dark:bg-white/10 text-gray-900 dark:text-white font-bold text-lg shadow-lg hover:bg-gray-50 dark:hover:bg-white/20 transition-colors border border-gray-200 dark:border-white/10"
                        >
                            Full Standings
                        </Link>
                    </div>

                    {/* Features List */}
                    <div className="grid grid-cols-3 gap-6 pt-8">
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Activity size={24} />
                            </div>
                            <span className="font-semibold text-sm">Real-Time Scores</span>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                <Calendar size={24} />
                            </div>
                            <span className="font-semibold text-sm">Match Schedule</span>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                                <Trophy size={24} />
                            </div>
                            <span className="font-semibold text-sm">Live Standings</span>
                        </div>
                    </div>
                </div>

                <div className="lg:w-1/2 w-full">
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-white/40 dark:border-white/5 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 flex items-center">
                            <span className={`w-1.5 h-8 rounded-full mr-3 ${heroColor}`}></span>
                            Latest Standings
                        </h2>
                        <StandingsWidget leagueId={leagueId} />
                    </div>
                </div>
            </div>
        </div>

        {/* SEO Content Section */}
        <div className="bg-white dark:bg-zinc-900 py-16">
             <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold mb-8 text-center">Why Follow {title.split(' ')[0]} on Sports Match?</h2>
                <div className="prose dark:prose-invert max-w-none space-y-6 text-lg text-gray-600 dark:text-gray-300">
                    <p>
                        Stay ahead of the game with our comprehensive coverage of <strong>{title}</strong>. 
                        We provide instant updates, ensuring you never miss a goal, basket, or critical moment.
                    </p>
                    <p>
                        Our platform is designed for speed and accuracy. Whether you are tracking 
                        <strong> {leagueId === 'nba' ? 'NBA playoff races' : 'relegation battles'}</strong> or 
                        following your favorite team's journey to the championship, we have the data you need.
                    </p>
                    <p>
                        Access detailed <strong>match statistics</strong>, <strong>team lineups</strong>, and 
                        <strong>historical data</strong> all in one place. Join thousands of sports fans who trust 
                        Sports Match for their daily sports news and live score updates.
                    </p>
                </div>
             </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LeagueLandingPage;
