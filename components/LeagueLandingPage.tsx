import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import StandingsWidget from './StandingsWidget';
import Header from './Header';
import Footer from './Footer';
import { ArrowRight, Trophy, Calendar, Activity, TrendingUp, Users, Star } from 'lucide-react';

interface LeagueSEOData {
    intro: string;
    popularTeams: string[];
    searchKeywords: string[];
    narrative: string;
    faq: { question: string; answer: string }[];
}

const LEAGUE_SPECIFIC_CONTENT: Record<string, LeagueSEOData> = {
    'eng.1': {
        intro: "The Premier League is widely regarded as the most competitive and entertaining football league globally. Featuring iconic clubs and world-class talent, every matchweek delivers high-octane drama, from the title race to the battle for survival.",
        popularTeams: ["Manchester City", "Arsenal", "Liverpool", "Manchester United", "Chelsea", "Tottenham Hotspur"],
        searchKeywords: ["Premier League Table", "EPL Live Scores", "Man City vs Arsenal", "Liverpool Fixtures", "EPL Top Scorers", "Fantasy Premier League Stats"],
        narrative: "Follow the intense rivalry for the Premier League title. Will Manchester City continue their dominance, or will Arsenal and Liverpool reclaim the throne? Track the 'Big Six' clashes, the race for Champions League spots, and the unpredictable relegation dogfight. Our dashboard provides real-time updates on goals, assists, and clean sheets for all 20 EPL clubs.",
        faq: [
            { question: "When does the Premier League season start?", answer: "The Premier League season typically kicks off in August and concludes in May, featuring 38 matchweeks of non-stop action." },
            { question: "How many teams qualify for the Champions League?", answer: "Usually, the top four teams in the Premier League standings qualify directly for the UEFA Champions League group stage." }
        ]
    },
    'esp.1': {
        intro: "La Liga represents the pinnacle of technical football, home to the legendary 'El Clasico' rivalry. It features some of the most decorated clubs in history, Real Madrid and FC Barcelona, competing for supremacy in Spanish football.",
        popularTeams: ["Real Madrid", "FC Barcelona", "Atletico Madrid", "Real Sociedad", "Sevilla", "Athletic Club"],
        searchKeywords: ["La Liga Standings", "El Clasico Results", "Real Madrid Score", "Barcelona Fixtures", "La Liga Top Scorers", "Spanish Football Live"],
        narrative: "Witness the magic of La Liga. From the tactical battles of Atletico Madrid to the flair of Barcelona's La Masia graduates and Real Madrid's Galacticos. Keep up with every goal from stars like Jude Bellingham, Vinicius Jr, and Lamine Yamal. We provide comprehensive coverage of every matchday in Spain's top flight.",
        faq: [
            { question: "What is El Clasico?", answer: "El Clasico is the name given to any football match between fierce rivals FC Barcelona and Real Madrid." },
            { question: "Who has won the most La Liga titles?", answer: "Real Madrid holds the record for the most La Liga championships in history." }
        ]
    },
    'ita.1': {
        intro: "Serie A is synonymous with tactical sophistication and passionate defending. The Italian top flight, known as 'Calcio', features historic giants like Juventus, AC Milan, and Inter Milan battling for the coveted Scudetto.",
        popularTeams: ["Inter Milan", "Juventus", "AC Milan", "Napoli", "AS Roma", "Lazio"],
        searchKeywords: ["Serie A Table", "Juventus Live Score", "Milan Derby", "Scudetto Race", "Italian Football News", "Serie A Fixtures"],
        narrative: "Experience the passion of Italian football. Follow the Derby della Madonnina, the tactical masterclasses, and the resurgence of Napoli. Whether it's Inter's disciplined attack or Juventus's defensive solidity, get minute-by-minute updates on every Serie A clash.",
        faq: [
            { question: "What is the Scudetto?", answer: "The Scudetto is the decoration worn by Italian sports clubs that won the annual championship of their respective sport in the previous season." },
            { question: "Which teams play in the Milan Derby?", answer: "The Milan Derby, or Derby della Madonnina, is contested between crosstown rivals AC Milan and Inter Milan." }
        ]
    },
    'ger.1': {
        intro: "The Bundesliga is famous for its high-scoring matches, fan-centric culture, and world-class stadiums. It showcases a thrilling mix of Bayern Munich's dominance and the high-pressing intensity of challengers like Borussia Dortmund and Bayer Leverkusen.",
        popularTeams: ["Bayern Munich", "Borussia Dortmund", "Bayer Leverkusen", "RB Leipzig", "Eintracht Frankfurt"],
        searchKeywords: ["Bundesliga Standings", "Bayern Munich Score", "Dortmund Fixtures", "German Football Results", "Der Klassiker", "Bundesliga Top Scorers"],
        narrative: "Don't miss a beat of German football. Track the 'Meisterschale' race, the intense 'Der Klassiker', and the rise of exciting young talents. The Bundesliga offers the highest average goals per game among Europe's top leagues, ensuring entertainment in every fixture.",
        faq: [
            { question: "What is Der Klassiker?", answer: "Der Klassiker refers to the football match between Germany's two most successful clubs, Bayern Munich and Borussia Dortmund." }
        ]
    },
    'fra.1': {
        intro: "Ligue 1 is the home of French football flair, featuring global superstars and a hotbed of emerging talent. Paris Saint-Germain (PSG) leads the way, but historic clubs like Marseille, Lyon, and Monaco provide fierce competition.",
        popularTeams: ["Paris Saint-Germain", "Marseille", "AS Monaco", "Lyon", "Lille", "Lens"],
        searchKeywords: ["Ligue 1 Table", "PSG Match Result", "Marseille Fixtures", "French League Scores", "Le Classique", "Ligue 1 Stats"],
        narrative: "Follow the drama of 'Le Classique' between PSG and Marseille. Watch the next generation of football stars emerge in a league renowned for its youth development. Get live scores and stats for every Ligue 1 match right here.",
        faq: [
            { question: "Who are the current champions of Ligue 1?", answer: "Paris Saint-Germain (PSG) have been the dominant force in recent years, frequently winning the Ligue 1 title." }
        ]
    },
    'uefa.champions': {
        intro: "The UEFA Champions League is the most prestigious club competition in the world. It brings together the elite teams from across Europe to battle for the ultimate prize in club football.",
        popularTeams: ["Real Madrid", "Manchester City", "Bayern Munich", "Paris Saint-Germain", "Liverpool", "Inter Milan"],
        searchKeywords: ["Champions League Results", "UCL Fixtures", "UCL Draw", "Champions League Standings", "Live Football Scores Europe"],
        narrative: "Experience the magic of European nights. From the group stages to the knockout drama, follow every twist and turn on the road to the final. Track the giants of Europe as they vie for the iconic 'Big Ears' trophy.",
        faq: [
            { question: "How many teams compete in the Champions League?", answer: "The format has evolved, but the competition traditionally features the best clubs from Europe's top leagues competing in a group phase followed by knockouts." }
        ]
    },
    'nba': {
        intro: "The NBA is the premier basketball league in the world, showcasing the greatest athletes on the planet. From buzzer-beaters to high-flying dunks, the NBA offers unmatched excitement and entertainment.",
        popularTeams: ["Los Angeles Lakers", "Golden State Warriors", "Boston Celtics", "Milwaukee Bucks", "Denver Nuggets", "Phoenix Suns"],
        searchKeywords: ["NBA Scores", "NBA Standings", "Lakers Game", "Warriors Score", "NBA Playoffs", "Live Basketball Stats"],
        narrative: "Follow the journey to the NBA Finals. Track the MVP race, the playoff picture, and individual brilliance from superstars like LeBron James, Stephen Curry, Giannis Antetokounmpo, and Nikola Jokic. Get real-time updates on every quarter, every point, and every assist.",
        faq: [
            { question: "How many games are in an NBA season?", answer: "A standard NBA regular season consists of 82 games for each team." },
            { question: "When do the NBA Playoffs start?", answer: "The NBA Playoffs usually begin in April, following the conclusion of the regular season." }
        ]
    },
    'esp.copa_del_rey': {
        intro: "The Copa del Rey is Spain's oldest football competition, known for its thrilling knockout format where giant-killings are always on the cards. It offers a path to glory for clubs across all divisions of Spanish football.",
        popularTeams: ["Athletic Club", "Real Madrid", "FC Barcelona", "Real Betis", "Valencia", "Sevilla"],
        searchKeywords: ["Copa del Rey Scores", "Spanish Cup Results", "Copa del Rey Fixtures", "King's Cup Spain", "Copa del Rey Draw"],
        narrative: "Experience the raw emotion of cup football. From early-round upsets to the grandeur of the final, the Copa del Rey delivers passion and drama. Follow every round as teams fight for the prestigious trophy.",
        faq: [
            { question: "Who has won the most Copa del Rey titles?", answer: "FC Barcelona holds the record for the most Copa del Rey victories." }
        ]
    },
    'ita.coppa_italia': {
        intro: "The Coppa Italia is Italy's premier cup competition, pitting the best of Serie A against challengers from the lower divisions. It is a tournament steeped in history and fiercely contested by Italy's biggest clubs.",
        popularTeams: ["Juventus", "Inter Milan", "AS Roma", "Lazio", "Napoli", "Fiorentina"],
        searchKeywords: ["Coppa Italia Results", "Italian Cup Scores", "Coppa Italia Fixtures", "Juventus Coppa Italia", "Coppa Italia Bracket"],
        narrative: "Follow the road to Rome. The Coppa Italia offers a chance for silverware and glory. Watch as the giants of Calcio battle it out in knockout fixtures that leave no margin for error.",
        faq: [
            { question: "Where is the Coppa Italia final played?", answer: "The Coppa Italia final is traditionally played at the Stadio Olimpico in Rome." }
        ]
    },
    'eng.fa': {
        intro: "The FA Cup is the oldest national football competition in the world. Famous for its magic, it allows non-league dreamers to share the pitch with Premier League titans, creating unforgettable moments of sporting history.",
        popularTeams: ["Manchester United", "Arsenal", "Liverpool", "Chelsea", "Manchester City"],
        searchKeywords: ["FA Cup Scores", "FA Cup Draw", "FA Cup Fixtures", "Wembley Final", "FA Cup Third Round"],
        narrative: "Witness the magic of the FA Cup. From the muddy pitches of non-league grounds to the hallowed turf of Wembley Stadium. Follow every round, every replay, and every giant-killing act in this historic competition.",
        faq: [
            { question: "Why is the FA Cup special?", answer: "It is open to all eligible clubs down to Level 10 of the English football league system, allowing unmatched opportunities for underdogs." }
        ]
    }
};

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
  
  const content = LEAGUE_SPECIFIC_CONTENT[leagueId] || {
      intro: description,
      popularTeams: [],
      searchKeywords: [],
      narrative: `Stay ahead of the game with our comprehensive coverage. We provide instant updates, ensuring you never miss a goal, basket, or critical moment. Access detailed match statistics, team lineups, and historical data all in one place.`,
      faq: []
  };

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
                        {content.intro}
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
                
                {/* Popular Teams Section */}
                {content.popularTeams.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Users className="text-gray-400" />
                            Popular Teams
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {content.popularTeams.map(team => (
                                <span key={team} className="px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                                    {team}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Narrative Content */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold mb-8 text-center">Why Follow {title.split(' ')[0]} on Sports Match?</h2>
                    <div className="prose dark:prose-invert max-w-none space-y-6 text-lg text-gray-600 dark:text-gray-300">
                        <p>{content.narrative}</p>
                        <p>
                            Our platform is designed for speed and accuracy. Whether you are tracking 
                            <strong> {leagueId === 'nba' ? 'NBA playoff races' : 'relegation battles'}</strong> or 
                            following your favorite team's journey to the championship, we have the data you need.
                        </p>
                    </div>
                </div>

                {/* Trending Keywords */}
                {content.searchKeywords.length > 0 && (
                    <div className="mb-12 p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <TrendingUp size={18} className="text-blue-500" />
                            Trending Topics
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {content.searchKeywords.map(keyword => (
                                <span key={keyword} className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-black/20 px-2 py-1 rounded border border-gray-200 dark:border-white/10">
                                    #{keyword.replace(/\s+/g, '')}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* FAQ Section */}
                {content.faq && content.faq.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            {content.faq.map((item, index) => (
                                <div key={index} className="border-b border-gray-200 dark:border-white/10 pb-6 last:border-0">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.question}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">{item.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

             </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LeagueLandingPage;
