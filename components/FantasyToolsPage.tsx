import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import PlayerComparison from './PlayerComparison';
import FixtureDifficulty from './FixtureDifficulty';
import { Gamepad2, Shield } from 'lucide-react';

interface FantasyToolsPageProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const FantasyToolsPage: React.FC<FantasyToolsPageProps> = ({ darkMode, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'difficulty'>('comparison');

  // SEO Keywords and Title
  React.useEffect(() => {
    document.title = "FPL Tools - Player Comparison & Fixture Difficulty | SportsLive";
    
    // Helper to set meta tags
    const setMeta = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('name', name);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    setMeta('description', 'Advanced Fantasy Premier League (FPL) tools. Compare players head-to-head, analyze fixture difficulty, and optimize your fantasy team with real-time stats.');
    setMeta('keywords', 'FPL, Fantasy Premier League, Player Comparison, Fixture Difficulty, FPL Tools, Fantasy Football, Premier League Stats');
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-500 relative flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      
      {/* Shared Background for the Header/Tab area */}
      <div className="absolute top-0 left-0 w-full h-96 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-50%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-2 flex-grow flex flex-col">
        <Header darkMode={darkMode} toggleTheme={toggleTheme} onOpenCalendar={() => {}} isCalendarOpen={false} />

        {/* Tab Navigation (Home Page Style) */}
        <div className="flex justify-center mb-8 relative z-20">
            <div className="flex gap-4">
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={`
                      relative group flex items-center space-x-2.5 px-6 py-3 rounded-full transition-all duration-300 overflow-hidden
                      backdrop-blur-md border select-none
                      ${activeTab === 'comparison' 
                        ? 'border-white/40 dark:border-white/20 text-gray-900 dark:text-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]' 
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/10'
                      }
                    `}
                >
                    {/* Liquid Glass Background (Active) */}
                    {activeTab === 'comparison' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/30 to-white/5 dark:from-white/20 dark:via-white/5 dark:to-transparent opacity-100" />
                    )}
                    
                    {/* 45-degree Specular Highlight */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none transform -skew-x-12
                        ${activeTab === 'comparison' ? 'opacity-50' : 'opacity-0 group-hover:opacity-20'}
                    `} />

                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-2">
                        <Gamepad2 size={18} />
                        <span className="font-bold">Player Comparison</span>
                    </div>
                </button>

                <button
                    onClick={() => setActiveTab('difficulty')}
                    className={`
                      relative group flex items-center space-x-2.5 px-6 py-3 rounded-full transition-all duration-300 overflow-hidden
                      backdrop-blur-md border select-none
                      ${activeTab === 'difficulty' 
                        ? 'border-white/40 dark:border-white/20 text-gray-900 dark:text-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]' 
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/10'
                      }
                    `}
                >
                    {/* Liquid Glass Background (Active) */}
                    {activeTab === 'difficulty' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/30 to-white/5 dark:from-white/20 dark:via-white/5 dark:to-transparent opacity-100" />
                    )}
                    
                    {/* 45-degree Specular Highlight */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none transform -skew-x-12
                        ${activeTab === 'difficulty' ? 'opacity-50' : 'opacity-0 group-hover:opacity-20'}
                    `} />

                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-2">
                        <Shield size={18} />
                        <span className="font-bold">Fixture Difficulty</span>
                    </div>
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow">
            {activeTab === 'comparison' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                     {/* Pass hideLayout to prevent double header/footer */}
                    <PlayerComparison darkMode={darkMode} toggleTheme={toggleTheme} hideLayout={true} />
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <FixtureDifficulty darkMode={darkMode} toggleTheme={toggleTheme} hideLayout={true} />
                </div>
            )}
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default FantasyToolsPage;
