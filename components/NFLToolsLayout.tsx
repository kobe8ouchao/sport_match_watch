import React from 'react';
import { Outlet } from 'react-router-dom';
import { BarChart2, Calendar } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ToolsNav, { ToolItem } from './ToolsNav';
import { NFLComparisonProvider } from '../context/NFLComparisonContext';

interface NFLToolsLayoutProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const NFLToolsLayout: React.FC<NFLToolsLayoutProps> = ({ darkMode, toggleTheme }) => {
  const tools: ToolItem[] = [
    {
      id: 'comparison',
      name: 'Player Comparison',
      path: '/game-tools/fantasy-nfl/player-compare',
      icon: <BarChart2 size={16} />
    },
    {
      id: 'schedule',
      name: 'Schedule Difficulty',
      path: '/game-tools/fantasy-nfl/schedule-difficulty',
      icon: <Calendar size={16} />
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      
      {/* Ambient Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-green-100/50 dark:bg-green-900/10 blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-100/40 dark:bg-blue-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-grow w-full">
        <Header
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          onOpenCalendar={() => {}}
          isCalendarOpen={false}
          hideCalendarButton
        />

        <div className="py-4">
            <ToolsNav items={tools} />

            <div className="mt-2">
                <NFLComparisonProvider>
                    <Outlet />
                </NFLComparisonProvider>
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NFLToolsLayout;
