import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, TrendingUp, Shield, Users, ArrowRight } from 'lucide-react';
import { fetchMatchDetails } from '../services/api';
import { MatchDetailData } from '../types';
import NFLMatchDetail from './NFLMatchDetail';
import Footer from './Footer';

const SuperBowlPage: React.FC<{ darkMode: boolean; toggleTheme: () => void }> = ({ darkMode, toggleTheme }) => {
  const [matchData, setMatchData] = useState<MatchDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const matchId = '401772988';
  const leagueId = 'nfl';

  useEffect(() => {
    // SEO Update
    document.title = "Super Bowl LX 2026: Seahawks vs Patriots | Preview, Odds & Live Score";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', "Super Bowl LX 2026 coverage: Seattle Seahawks vs New England Patriots. Expert predictions, matchup analysis, key stats, Sam Darnold vs Drake Maye, and live score updates.");
    } else {
        const meta = document.createElement('meta');
        meta.name = "description";
        meta.content = "Super Bowl LX 2026 coverage: Seattle Seahawks vs New England Patriots. Expert predictions, matchup analysis, key stats, Sam Darnold vs Drake Maye, and live score updates.";
        document.head.appendChild(meta);
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
        metaKeywords.setAttribute('content', "Super Bowl LX, Seahawks vs Patriots, Super Bowl 2026, NFL Final, Sam Darnold, Drake Maye, Seattle Seahawks, New England Patriots, Super Bowl Prediction, Live Score");
    }

    const loadData = async () => {
      try {
        const data = await fetchMatchDetails(matchId, leagueId);
        setMatchData(data);
      } catch (e) {
        console.error("Failed to load match data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": "Super Bowl LX: Seahawks vs Patriots",
    "startDate": "2026-02-08T18:30:00-05:00",
    "location": {
      "@type": "Place",
      "name": "Levi's Stadium",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Santa Clara",
        "addressRegion": "CA",
        "addressCountry": "US"
      }
    },
    "competitor": [
      {
        "@type": "SportsTeam",
        "name": "Seattle Seahawks"
      },
      {
        "@type": "SportsTeam",
        "name": "New England Patriots"
      }
    ],
    "description": "Super Bowl LX preview, prediction and live score. Seattle Seahawks vs New England Patriots match analysis, key players to watch, and betting odds."
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-gray-100' : 'bg-gray-50 text-gray-900'} font-sans`}>
      <script type="application/ld+json">
          {JSON.stringify(structuredData)}
      </script>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-slate-900 to-red-900 text-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/0.png')] opacity-5 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold tracking-wide uppercase">Super Bowl LX</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Seahawks</span>
              <span className="mx-4 text-gray-400 text-3xl md:text-5xl font-light">vs</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300">Patriots</span>
            </h1>

            <div className="flex flex-wrap justify-center gap-6 text-sm md:text-base text-gray-300 mt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>Sunday, Feb 8, 2026 • 6:30 PM ET</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>Levi's Stadium, Santa Clara, CA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Column: Analysis & Content */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Live Match Component (if data loads) */}
          {matchData && (
             <div className="bg-white dark:bg-white/5 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-white/10">
                <div className="p-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Live Game Center
                    </h2>
                </div>
                <div className="p-0">
                    <NFLMatchDetail match={matchData} onBack={() => {}} />
                </div>
             </div>
          )}

          {/* Analysis Article */}
          <article className="prose dark:prose-invert max-w-none">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="text-teal-500" />
                Matchup Preview: The Explosive Play Bowl
            </h2>
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Super Bowl LX features a classic matchup of strengths. The Seattle Seahawks, boasting the NFL's top-ranked scoring defense (16.4 PPG), face off against the New England Patriots and their explosive offense led by breakout sensation Drake Maye.
            </p>
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              ESPN analyst Bill Barnwell has dubbed this the "Explosive Play Bowl." The Seahawks led the league with a +4.7% explosive-play differential, while the Patriots ranked fourth. This game will likely be decided by which unit controls the big plays: Seattle's suffocating secondary or New England's dynamic downfield attack.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 not-prose">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Seahawks Keys</h3>
                    </div>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                            <ArrowRight className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300"><strong>Suffocating Defense:</strong> Allowed fewest points in regular season (16.4 PPG).</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ArrowRight className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300"><strong>Sam Darnold's Redemption:</strong> Pro Bowl season with 4,000+ yards, despite turnover concerns.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ArrowRight className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300"><strong>JSN Factor:</strong> Jaxon Smith-Njigba is a matchup nightmare in the slot.</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Patriots Keys</h3>
                    </div>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                            <ArrowRight className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300"><strong>Drake Maye Magic:</strong> Led NFL in Total QBR (77.1) and completion % (72%).</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ArrowRight className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300"><strong>Explosive Offense:</strong> League-best explosive creation rate of 13.6%.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ArrowRight className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300"><strong>Mike Vrabel Effect:</strong> Turned 4-13 team to Super Bowl contenders in Year 1.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4">Prediction & Expert Picks</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
                The experts are leaning heavily towards Seattle. In ESPN's expert panel, <strong>82.8% (48 of 58)</strong> picked the Seahawks to win. The consensus score prediction hovers around <strong>27-17</strong>, favoring Seattle's balanced attack and elite defense.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
                <strong>Betting Odds:</strong> Seattle opens as -4.5 point favorites with an Over/Under of 45.5.
            </p>
          </article>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm sticky top-24">
                <h3 className="text-lg font-bold mb-4 border-b border-gray-100 dark:border-white/10 pb-2">Quick Facts</h3>
                <dl className="space-y-4">
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Matchup History</dt>
                        <dd className="font-medium">Rematch of Super Bowl XLIX (2014)</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Seahawks Record</dt>
                        <dd className="font-medium">14-3 (NFC No. 1 Seed)</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Patriots Record</dt>
                        <dd className="font-medium">14-3 (AFC No. 2 Seed)</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Halftime Show</dt>
                        <dd className="font-medium">TBA</dd>
                    </div>
                </dl>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
                    <Link 
                        to="/game-tools/fantasy-nfl/player-compare" 
                        className="block w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white text-center rounded-xl font-bold transition-colors shadow-lg hover:shadow-xl transform active:scale-95"
                    >
                        Compare Players
                    </Link>
                </div>
            </div>
        </div>

      </div>
      
      <Footer />
    </div>
  );
};

export default SuperBowlPage;
