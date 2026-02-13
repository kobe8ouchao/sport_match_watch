import React, { useEffect } from 'react';
import { Calendar, MapPin, Star, Trophy, Users, Zap, Award } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface NBAAllStar2026Props {
  darkMode: boolean;
  toggleTheme: () => void;
}

const NBAAllStar2026: React.FC<NBAAllStar2026Props> = ({ darkMode, toggleTheme }) => {
  // Dynamic SEO
  useEffect(() => {
    document.title = "2026 NBA All-Star Game | Team USA vs Team World | Intuit Dome";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', "Experience the 2026 NBA All-Star Weekend at Intuit Dome! Watch Team USA vs. Team World, Damian Lillard's 3-point defense, and the Rising Stars challenge. Get the latest schedule, highlights, and expert predictions.");
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = "Experience the 2026 NBA All-Star Weekend at Intuit Dome! Watch Team USA vs. Team World, Damian Lillard's 3-point defense, and the Rising Stars challenge. Get the latest schedule, highlights, and expert predictions.";
      document.head.appendChild(meta);
    }

    // Add Keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    const keywords = "2026 NBA All-Star Game, Intuit Dome, Rising Stars, Slam Dunk Contest, 3-Point Contest, Team USA vs Team World, Damian Lillard, Donovan Mitchell, Victor Wembanyama, Kevin Durant, NBA All-Star Weekend Schedule";
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = keywords;
      document.head.appendChild(meta);
    }
  }, []);

  const schedule = [
    {
      day: "Friday",
      date: "Feb 13",
      events: [
        { time: "7 p.m. ET", name: "NBA All-Star Celebrity Game", desc: "Featuring NBA governors Mat Ishbia & Rick Schnall, plus NFL stars Keenan Allen & Amon-Ra St. Brown." },
        { time: "9 p.m. ET", name: "Rising Stars Challenge", desc: "Headlined by Rookie of the Year contender Kon Knueppel. Team Vince vs Team T-Mac." }
      ]
    },
    {
      day: "Saturday",
      date: "Feb 14",
      events: [
        { time: "8 p.m. ET", name: "All-Star Saturday Night", desc: "Skills Challenge, 3-Point Contest (Lillard, Mitchell, Booker), and Slam Dunk Contest." }
      ]
    },
    {
      day: "Sunday",
      date: "Feb 15",
      events: [
        { time: "8 p.m. ET", name: "75th NBA All-Star Game", desc: "New Format: Team USA vs. Team World. LeBron, Durant vs. Giannis, Wembanyama." }
      ]
    }
  ];

  const highlights = [
    {
      title: "USA vs. World",
      icon: <Users className="w-6 h-6 text-blue-500" />,
      desc: "A brand new format pits the best American-born players against the top International stars. Can Victor Wembanyama lead Team World to victory against Kevin Durant's Team USA?"
    },
    {
      title: "Dame Time Defense",
      icon: <Trophy className="w-6 h-6 text-yellow-500" />,
      desc: "Damian Lillard returns to defend his 3-Point Contest crown despite injury, aiming for a 3-peat against sharpshooters like Donovan Mitchell and Devin Booker."
    },
    {
      title: "Rising Stars",
      icon: <Star className="w-6 h-6 text-purple-500" />,
      desc: "With Cooper Flagg out, Kon Knueppel takes center stage in the Rising Stars showcase, featuring a mini-tournament format with NBA legends as coaches."
    },
    {
      title: "Dunk Contest",
      icon: <Zap className="w-6 h-6 text-red-500" />,
      desc: "A mix of high-flyers including Jaxson Hayes and Keshad Johnson look to electrify the Intuit Dome crowd. Keep an eye on Jase Richardson, son of 2x champ Jason Richardson."
    }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      <Header darkMode={darkMode} toggleTheme={toggleTheme} />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
            <MapPin size={16} className="text-blue-300" />
            <span>Intuit Dome, Los Angeles</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
            2026 NBA All-Star Weekend
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            The biggest stars align in LA. Witness the new <span className="font-bold text-white">USA vs. World</span> format, high-flying dunks, and legendary shootouts.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="#schedule" className="bg-white text-blue-900 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2">
              <Calendar size={20} />
              View Schedule
            </a>
            <a href="#highlights" className="bg-blue-700/50 backdrop-blur-sm text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700/70 transition-colors border border-white/10 flex items-center gap-2">
              <Star size={20} />
              Key Highlights
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        
        {/* Highlights Section */}
        <section id="highlights">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Weekend Highlights</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              From the Celebrity Game to the Sunday showdown, here's what makes the 2026 All-Star Weekend unmissable.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-gray-50 dark:bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Schedule Section */}
        <section id="schedule" className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-[3rem] -z-10 transform -rotate-1"></div>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 md:p-12 shadow-xl">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/20">
                <Calendar size={24} />
              </div>
              <h2 className="text-3xl font-bold">Event Schedule</h2>
            </div>
            
            <div className="space-y-8">
              {schedule.map((day, idx) => (
                <div key={idx} className="relative pl-8 border-l-2 border-gray-200 dark:border-white/10 last:border-0 pb-8 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white dark:ring-zinc-900"></div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 mb-4">
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{day.day}</h3>
                    <span className="text-gray-400 font-medium">{day.date}</span>
                  </div>
                  <div className="space-y-4">
                    {day.events.map((event, eIdx) => (
                      <div key={eIdx} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                          <h4 className="font-bold text-lg">{event.name}</h4>
                          <span className="text-sm font-bold px-3 py-1 bg-white dark:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300 shadow-sm whitespace-nowrap">
                            {event.time}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {event.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Content / Footer Text */}
        <section className="bg-gray-100 dark:bg-white/5 rounded-3xl p-8 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">About NBA All-Star 2026</h3>
          <p>
            The 2026 NBA All-Star Game is set to take place at the brand new Intuit Dome in Inglewood, California. 
            This year marks a historic shift in format as the league adopts a "USA vs. World" structure for the Sunday showcase, 
            highlighting the global growth of basketball. Fans can expect a star-studded weekend featuring the Rising Stars Challenge, 
            the Celebrity Game, and the iconic Saturday Night events including the Slam Dunk Contest and 3-Point Contest. 
            Stay tuned for live updates, scores, and highlights right here on SportsLive.
          </p>
        </section>

      </div>

      <Footer />
    </div>
  );
};

export default NBAAllStar2026;
