import React from 'react';
import { Moon, Sun, CalendarDays } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  toggleTheme: () => void;
  onOpenCalendar: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleTheme, onOpenCalendar }) => {
  return (
    <div className="flex items-center justify-between py-5 mb-2">
      {/* Logo Area */}
      <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="h-9 w-9 bg-black dark:bg-white rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 duration-300">
              <span className="text-white dark:text-black font-bold text-lg font-mono">S</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white leading-none">
                Sports<span className="font-light text-gray-500 dark:text-gray-400">Live</span>
            </span>
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-widest uppercase mt-0.5">
                Dashboard
            </span>
          </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
          <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm hover:shadow-md text-gray-600 dark:text-gray-300"
              aria-label="Toggle Theme"
          >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {/* Calendar Button - Visible only on Mobile/Tablet (Hidden on LG) */}
          <button 
              onClick={onOpenCalendar}
              className="lg:hidden relative p-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg hover:opacity-90 transition-transform active:scale-95"
          >
              <CalendarDays size={18} />
          </button>

          {/* User Profile Placeholder (Desktop visual balance) */}
          <div className="hidden lg:flex h-10 w-10 rounded-full bg-gradient-to-tr from-gray-200 to-white dark:from-zinc-800 dark:to-zinc-700 border border-white/20 items-center justify-center shadow-sm">
             <span className="text-xs font-bold text-gray-500 dark:text-gray-300">U</span>
          </div>
      </div>
    </div>
  );
};

export default Header;