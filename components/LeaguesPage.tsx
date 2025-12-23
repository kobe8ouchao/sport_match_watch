/*
 * @Descripttion: 
 * @Author: ouchao
 * @Email: ouchao@sendpalm.com
 * @version: 1.0
 * @Date: 2025-12-13 18:03:56
 * @LastEditors: ouchao
 * @LastEditTime: 2025-12-13 20:30:53
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { LEAGUES } from '../constants';
import Header from './Header';
import Footer from './Footer';

// Enhanced league details
const LEAGUE_DETAILS: Record<string, { description: string; keywords: string[]; shortDesc: string }> = {
  'nba': {
    shortDesc: 'Top Basketball League',
    description: 'The National Basketball Association (NBA) is the premier men\'s professional basketball league in North America. It features 30 teams and attracts the best players from around the world.',
    keywords: ['NBA', 'Basketball', 'LeBron James', 'Stephen Curry', 'Lakers', 'Celtics', 'Playoffs', 'Finals', 'MVP']
  },
  'nfl': {
    shortDesc: 'Professional American Football',
    description: 'The National Football League (NFL) is a professional American football league consisting of 32 teams. It culminates in the Super Bowl, one of the biggest sporting events globally.',
    keywords: ['NFL', 'Football', 'Super Bowl', 'Quarterback', 'Touchdown', 'Chiefs', 'Cowboys', 'Brady', 'Mahomes']
  },
  'uefa.champions': {
    shortDesc: 'Elite European Soccer',
    description: 'The UEFA Champions League is an annual club football competition organised by the Union of European Football Associations (UEFA) and contested by top-division European clubs.',
    keywords: ['UCL', 'Champions League', 'UEFA', 'Soccer', 'Football', 'Europe', 'Real Madrid', 'Man City', 'Goals']
  },
  'eng.1': {
    shortDesc: 'English Top Flight',
    description: 'The Premier League is the top level of the English football league system. It is the most-watched sports league in the world, known for its competitiveness and star power.',
    keywords: ['Premier League', 'EPL', 'England', 'Soccer', 'Football', 'Man Utd', 'Liverpool', 'Arsenal', 'Chelsea']
  },
  'esp.1': {
    shortDesc: 'Spanish Football Excellence',
    description: 'La Liga, the Campeonato Nacional de Liga de Primera División, is the men\'s top professional football division of the Spanish football league system.',
    keywords: ['La Liga', 'Spain', 'Soccer', 'Football', 'El Clasico', 'Real Madrid', 'Barcelona', 'Atletico']
  },
  'ita.1': {
    shortDesc: 'Italian Serie A',
    description: 'Serie A is a professional league competition for football clubs located at the top of the Italian football league system.',
    keywords: ['Serie A', 'Italy', 'Calcio', 'Soccer', 'Football', 'Juventus', 'AC Milan', 'Inter Milan', 'Napoli']
  },
  'ger.1': {
    shortDesc: 'German Bundesliga',
    description: 'The Bundesliga is a professional association football league in Germany. It is the football league with the highest average stadium attendance worldwide.',
    keywords: ['Bundesliga', 'Germany', 'Soccer', 'Football', 'Bayern Munich', 'Dortmund', 'Leverkusen', 'Goals']
  },
  'fra.1': {
    shortDesc: 'French Ligue 1',
    description: 'Ligue 1 is a French professional league for men\'s association football clubs. It is the primary football competition in France.',
    keywords: ['Ligue 1', 'France', 'Soccer', 'Football', 'PSG', 'Marseille', 'Lyon', 'Monaco']
  },
   'uefa.europa': {
    shortDesc: 'European Club Competition',
    description: 'The UEFA Europa League is an annual football club competition organised by UEFA for eligible European football clubs.',
    keywords: ['Europa League', 'UEL', 'UEFA', 'Soccer', 'Football', 'Thursday Night Football']
  },
  'uefa.europa.conf': {
    shortDesc: 'UEFA Conference League',
    description: 'The UEFA Europa Conference League is an annual football club competition organised by UEFA for eligible European football clubs.',
    keywords: ['Conference League', 'UECL', 'UEFA', 'Soccer', 'Football']
  },
  'esp.copa_del_rey': {
      shortDesc: 'Spanish Cup',
      description: 'The Copa del Rey is an annual knockout football competition in Spanish football, organized by the Royal Spanish Football Federation.',
      keywords: ['Copa del Rey', 'Spain', 'Cup', 'Knockout', 'Soccer']
  },
  'ita.coppa_italia': {
      shortDesc: 'Italian Cup',
      description: 'The Coppa Italia is an Italian football annual cup competition.',
      keywords: ['Coppa Italia', 'Italy', 'Cup', 'Soccer', 'Football']
  },
  'eng.fa': {
      shortDesc: 'The FA Cup',
      description: 'The Football Association Challenge Cup, commonly known as the FA Cup, is an annual knockout football competition in men\'s domestic English football.',
      keywords: ['FA Cup', 'England', 'Wembley', 'Oldest Competition', 'Soccer']
  }
};

const LeaguesPage: React.FC<{ toggleTheme: () => void; darkMode: boolean }> = ({ toggleTheme, darkMode }) => {
  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-orange-100/40 dark:bg-orange-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        <Header
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          onOpenCalendar={() => {}}
          isCalendarOpen={false}
          hideCalendarButton
        />

        <div className="mt-8 mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Leagues</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Explore coverage for top basketball and soccer leagues worldwide. Get live scores, standings, stats, and news for your favorite competitions.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {LEAGUES.filter(l => l.id !== 'top').map((league) => {
                const details = LEAGUE_DETAILS[league.id] || { 
                    shortDesc: league.id === 'nba' || league.id === 'nfl' ? 'Professional League' : 'Football League', 
                    description: `Follow the latest ${league.name} matches, results, and standings.`,
                    keywords: [league.name, 'Sport', 'Live Score']
                };

                return (
                  <Link 
                    key={league.id} 
                    to={`/standings/${league.id}`}
                    className="group relative glass-card p-6 rounded-3xl border border-white/40 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-start text-left bg-white/60 dark:bg-white/5 h-full"
                  >
                    <div className="flex items-center gap-4 mb-4 w-full">
                        <div className="h-16 w-16 shrink-0 flex items-center justify-center p-3 bg-white dark:bg-white/10 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {typeof league.logo === 'string' ? (
                            <img src={league.logo} alt={league.name} className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-black dark:text-white">{league.logo}</div>
                        )}
                        </div>
                        <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {league.name}
                        </h3>
                        <p className="text-sm font-semibold text-blue-500 dark:text-blue-400">
                            {details.shortDesc}
                        </p>
                        </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">
                        {details.description}
                    </p>
                    
                    {/* Keywords / Tags */}
                    <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                        {details.keywords.slice(0, 5).map((kw, i) => (
                            <span key={i} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/5">
                                {kw}
                            </span>
                        ))}
                    </div>

                    <div className="w-full grid grid-cols-2 gap-3 mt-auto">
                        <span 
                            className="text-sm font-semibold py-2 px-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-center"
                        >
                            View Standings
                        </span>
                        <span className="text-sm font-semibold py-2 px-4 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-center">
                            Latest News
                        </span>
                    </div>
                  </Link>
                );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LeaguesPage;
