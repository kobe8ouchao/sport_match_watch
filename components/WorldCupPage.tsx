import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { MapPin, Calendar, Ticket, Trophy, Users, Globe } from 'lucide-react';

const COUNTRY_CODES: { [key: string]: string } = {
    'Mexico': 'mx',
    'South Africa': 'za',
    'South Korea': 'kr',
    'Canada': 'ca',
    'Qatar': 'qa',
    'Switzerland': 'ch',
    'Brazil': 'br',
    'Morocco': 'ma',
    'Haiti': 'ht',
    'Scotland': 'gb-sct',
    'United States': 'us',
    'Paraguay': 'py',
    'Australia': 'au',
    'Germany': 'de',
    'Curaçao': 'cw',
    'Ivory Coast': 'ci',
    'Ecuador': 'ec',
    'Netherlands': 'nl',
    'Japan': 'jp',
    'Tunisia': 'tn',
    'Belgium': 'be',
    'Egypt': 'eg',
    'Iran': 'ir',
    'New Zealand': 'nz',
    'Spain': 'es',
    'Cape Verde': 'cv',
    'Saudi Arabia': 'sa',
    'Uruguay': 'uy',
    'France': 'fr',
    'Senegal': 'sn',
    'Norway': 'no',
    'Argentina': 'ar',
    'Algeria': 'dz',
    'Austria': 'at',
    'Jordan': 'jo',
    'Portugal': 'pt',
    'Uzbekistan': 'uz',
    'Colombia': 'co',
    'England': 'gb-eng',
    'Croatia': 'hr',
    'Ghana': 'gh',
    'Panama': 'pa'
};

const getFlagUrl = (countryName: string) => {
    const code = COUNTRY_CODES[countryName];
    if (code) {
        return `https://flagcdn.com/w40/${code}.png`;
    }
    return null;
};

const GROUPS = [
    {
        name: 'Group A',
        teams: ['Mexico', 'South Africa', 'South Korea', 'European Playoff D']
    },
    {
        name: 'Group B',
        teams: ['Canada', 'European Playoff A', 'Qatar', 'Switzerland']
    },
    {
        name: 'Group C',
        teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland']
    },
    {
        name: 'Group D',
        teams: ['United States', 'Paraguay', 'Australia', 'European Playoff C']
    },
    {
        name: 'Group E',
        teams: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador']
    },
    {
        name: 'Group F',
        teams: ['Netherlands', 'Japan', 'European Playoff B', 'Tunisia']
    },
    {
        name: 'Group G',
        teams: ['Belgium', 'Egypt', 'Iran', 'New Zealand']
    },
    {
        name: 'Group H',
        teams: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay']
    },
    {
        name: 'Group I',
        teams: ['France', 'Senegal', 'FIFA Playoff 2', 'Norway']
    },
    {
        name: 'Group J',
        teams: ['Argentina', 'Algeria', 'Austria', 'Jordan']
    },
    {
        name: 'Group K',
        teams: ['Portugal', 'FIFA Playoff 1', 'Uzbekistan', 'Colombia']
    },
    {
        name: 'Group L',
        teams: ['England', 'Croatia', 'Ghana', 'Panama']
    }
];

const WorldCupPage: React.FC<{ toggleTheme: () => void; darkMode: boolean }> = ({ toggleTheme, darkMode }) => {
    
    useEffect(() => {
        document.title = "FIFA World Cup 2026™ - Canada, Mexico, USA - Match Schedule & Groups";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', "FIFA World Cup 2026™ in Canada, Mexico, and USA. View the match schedule, groups, ticket information, and latest news for the 48-team tournament.");
        } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = "FIFA World Cup 2026™ in Canada, Mexico, and USA. View the match schedule, groups, ticket information, and latest news for the 48-team tournament.";
            document.head.appendChild(meta);
        }
    }, []);

    return (
        <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
             {/* Background Effects */}
             <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-green-100/40 dark:bg-green-900/10 blur-[120px]" />
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

                {/* Hero Banner */}
                <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-black/80 to-black z-10"></div>
                    {/* Abstract Stadium/Crowd Background */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522770179533-24471fcdba45?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 z-0"></div>
                    
                    <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
                        <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-bold uppercase tracking-widest">
                            <Globe size={16} /> Official Tournament Page
                        </div>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl">
                            FIFA World Cup <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">2026™</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 font-medium max-w-3xl mx-auto mb-10 leading-relaxed">
                            Canada, Mexico, and the United States welcome the world for the biggest sporting event ever. 
                            <span className="block mt-2 text-white font-bold">48 Teams. 104 Matches. 3 Host Nations.</span>
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href="#groups" className="px-8 py-4 rounded-full bg-white text-gray-900 font-bold text-lg hover:scale-105 transition-transform shadow-xl w-full sm:w-auto">
                                View Groups
                            </a>
                            <a href="#info" className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-colors w-full sm:w-auto">
                                Tournament Info
                            </a>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-20">
                    
                    {/* Groups Section */}
                    <section id="groups" className="scroll-mt-24">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">Final Draw Groups</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-lg">The 48 qualified nations have been drawn into 12 groups.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {GROUPS.map((group) => (
                                <div key={group.name} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{group.name}</h3>
                                        <Trophy size={20} className="text-yellow-500" />
                                    </div>
                                    <ul className="space-y-3">
                                        {group.teams.map((team, idx) => {
                                            const flagUrl = getFlagUrl(team);
                                            return (
                                                <li key={idx} className="flex items-center gap-3">
                                                    <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-white/10 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    {flagUrl ? (
                                                        <img 
                                                            src={flagUrl} 
                                                            alt={`${team} flag`} 
                                                            className="w-6 h-4 object-cover rounded-sm shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-white/10 rounded-full shrink-0">
                                                            <Globe size={14} className="text-gray-400" />
                                                        </div>
                                                    )}
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{team}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SEO / Info Section */}
                    <section id="info" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start scroll-mt-24">
                         <div className="lg:col-span-8 space-y-8">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Tournament Information</h2>
                            
                            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                                <p>
                                    The <strong>FIFA World Cup 2026™</strong> will be the 23rd FIFA World Cup, the quadrennial international men's football championship contested by the national teams of the member associations of FIFA. The tournament will take place from a period of <strong>June 11 to July 19, 2026</strong>. It will be jointly hosted by 16 cities in three North American countries: Canada, Mexico, and the United States. The tournament will be the first hosted by three nations.
                                </p>
                                <p>
                                    This tournament will be the first to include 48 teams, expanded from 32. The United 2026 bid beat a rival bid by Morocco during a final vote at the 68th FIFA Congress in Moscow. It will be the first World Cup since 2002 to be hosted by more than one nation. With its past hosting of the 1970 and 1986 tournaments, Mexico will become the first country to host or co-host the men's World Cup three times. The United States last hosted the World Cup in 1994, whereas it will be Canada's first time hosting or co-hosting the men's tournament.
                                </p>
                                
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Host Cities & Venues</h3>
                                <p>
                                    Matches will be played in 16 venues across the three host nations. The United States will host 60 matches, including every match from the quarterfinals onward, while neighboring Canada and Mexico will each host 10 matches.
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 list-none pl-0">
                                    <li className="flex items-center gap-2"><MapPin size={18} className="text-blue-500" /> <span>Toronto, Vancouver (Canada)</span></li>
                                    <li className="flex items-center gap-2"><MapPin size={18} className="text-green-500" /> <span>Mexico City, Guadalajara, Monterrey (Mexico)</span></li>
                                    <li className="flex items-center gap-2"><MapPin size={18} className="text-red-500" /> <span>New York/New Jersey, Los Angeles, Dallas, etc. (USA)</span></li>
                                </ul>

                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Tickets & Hospitality</h3>
                                <p>
                                    Supporter Entry Tier tickets are priced at USD 60 and will be available for all 104 matches, including the FIFA World Cup 2026 final. Fans can apply for tickets during the random selection draw phases. Hospitality packages offering luxurious comfort and first-class amenities are also available for those seeking a premium experience.
                                </p>
                            </div>
                         </div>

                         <div className="lg:col-span-4 space-y-6 sticky top-24">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl">
                                <Calendar className="w-12 h-12 mb-4 opacity-80" />
                                <h3 className="text-2xl font-bold mb-2">Key Dates</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm opacity-70 uppercase tracking-wider font-bold">Opening Match</div>
                                        <div className="text-xl font-bold">June 11, 2026</div>
                                        <div className="text-sm opacity-80">Estadio Azteca, Mexico City</div>
                                    </div>
                                    <div>
                                        <div className="text-sm opacity-70 uppercase tracking-wider font-bold">Final Match</div>
                                        <div className="text-xl font-bold">July 19, 2026</div>
                                        <div className="text-sm opacity-80">MetLife Stadium, New York/New Jersey</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 rounded-3xl p-8 shadow-lg">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Qualified Teams</div>
                                        <div className="text-2xl font-black text-gray-900 dark:text-white">48 Nations</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                                        <Ticket size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Matches</div>
                                        <div className="text-2xl font-black text-gray-900 dark:text-white">104 Games</div>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default WorldCupPage;
