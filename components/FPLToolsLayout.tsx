import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart2, Shield, Calendar, Target, Calculator } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ToolsNav, { ToolItem } from './ToolsNav';

interface FPLToolsLayoutProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const FPLToolsLayout: React.FC<FPLToolsLayoutProps> = ({ darkMode, toggleTheme }) => {
  const location = useLocation();
  const tools: ToolItem[] = [
    {
      id: 'comparison',
      name: 'Player Comparison',
      path: '/game-tools/fantasy-premier-league/comparison',
      icon: <BarChart2 size={16} />
    },
    {
      id: 'differential',
      name: 'Differential Finder',
      path: '/game-tools/fantasy-premier-league/differential',
      icon: <Target size={16} />
    },
    {
      id: 'budget-finder',
      name: 'Budget Finder',
      path: '/game-tools/fantasy-premier-league/budget-finder',
      icon: <Calculator size={16} />
    },
    {
      id: 'captaincy',
      name: 'Captaincy Decider',
      path: '/game-tools/fantasy-premier-league/captaincy',
      icon: <Shield size={16} />
    },
    {
      id: 'fixture',
      name: 'Fixture Difficulty',
      path: '/game-tools/fantasy-premier-league/fixture',
      icon: <Calendar size={16} />
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      
      {/* Ambient Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-purple-100/40 dark:bg-purple-900/10 blur-[120px]" />
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
                <Outlet />
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FPLToolsLayout;
