import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import StandingsWidget from './StandingsWidget';
import NewsSection from './NewsSection';
import { ArrowRight, Trophy, Calendar, Activity, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SEOArticlePageProps {
  title: string;
  description: string;
  h1: string;
  content: string; // HTML content
  keywords: string;
  relatedLeagueId?: string;
  darkMode: boolean;
  toggleTheme: () => void;
}

const SEOArticlePage: React.FC<SEOArticlePageProps> = ({
  title,
  description,
  h1,
  content,
  keywords,
  relatedLeagueId,
  darkMode,
  toggleTheme,
}) => {
  
  // Update Meta Tags
  useEffect(() => {
    document.title = title;

    const updateMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const updateOG = (property: string, content: string) => {
        let element = document.querySelector(`meta[property="${property}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('property', property);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords);
    
    // OpenGraph
    updateOG('og:title', title);
    updateOG('og:description', description);
    updateOG('og:type', 'article');
    // Using a default image or could be passed in props
    updateOG('og:image', 'https://sportlive.win/logo.png'); 

  }, [title, description, keywords]);

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      
      {/* Ambient Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-100/40 dark:bg-blue-900/10 blur-[120px]" />
         <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-100/40 dark:bg-purple-900/10 blur-[120px]" />
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

        {/* Main Content Area */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row gap-12">
                
                {/* Article Column */}
                <div className="lg:w-2/3">
                    <article className="prose dark:prose-invert lg:prose-xl max-w-none">
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-8 text-gray-900 dark:text-white">
                            {h1}
                        </h1>
                        
                        {/* Render HTML Content safely */}
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                    </article>

                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10">
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Activity className="text-blue-500" />
                            Live Action
                        </h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-300">
                            Don't just read about it. Experience the action live on our main dashboard.
                        </p>
                        <Link 
                            to="/"
                            className="inline-flex items-center px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-xl hover:bg-blue-700 transition-colors"
                        >
                            View Live Scores
                            <ArrowRight className="ml-2" size={20} />
                        </Link>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:w-1/3 space-y-8">
                    
                    {/* Related League Standings (if applicable) */}
                    {relatedLeagueId && (
                        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-white/40 dark:border-white/5 shadow-xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Trophy size={20} className="text-yellow-500" />
                                Standings
                            </h3>
                            <StandingsWidget leagueId={relatedLeagueId} />
                            <div className="mt-4 text-center">
                                <Link to={`/standings/${relatedLeagueId}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                    View Full Table
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Latest News Widget */}
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-white/40 dark:border-white/5 shadow-xl">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-green-500" />
                            Latest Headlines
                        </h3>
                        <NewsSection leagueId={relatedLeagueId || 'top'} limit={3} compact />
                    </div>

                    {/* Quick Links */}
                    <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-6 border border-gray-200 dark:border-white/5">
                        <h3 className="text-lg font-bold mb-4">Popular Pages</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/nba-live-scores" className="block p-3 rounded-xl bg-white dark:bg-black/20 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-gray-100 dark:border-white/5">
                                    <div className="font-semibold text-gray-900 dark:text-white">NBA Live Scores</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Real-time basketball updates</div>
                                </Link>
                            </li>
                            <li>
                                <Link to="/premier-league-fixtures" className="block p-3 rounded-xl bg-white dark:bg-black/20 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border border-gray-100 dark:border-white/5">
                                    <div className="font-semibold text-gray-900 dark:text-white">Premier League</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">EPL fixtures & results</div>
                                </Link>
                            </li>
                            <li>
                                <Link to="/schedule" className="block p-3 rounded-xl bg-white dark:bg-black/20 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border border-gray-100 dark:border-white/5">
                                    <div className="font-semibold text-gray-900 dark:text-white">Full Schedule</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Upcoming matches calendar</div>
                                </Link>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SEOArticlePage;
