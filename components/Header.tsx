/*
 * @Descripttion: 
 * @Author: ouchao
 * @Email: ouchao@sendpalm.com
 * @version: 1.0
 * @Date: 2025-12-13 16:35:41
 * @LastEditors: ouchao
 * @LastEditTime: 2025-12-27 16:27:26
 */
import React from 'react';
import { Menu, X, Calendar, Search, Sun, Moon, BarChart2, Gamepad2, Shield, CalendarDays } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  darkMode: boolean;
  toggleTheme: () => void;
  onOpenCalendar: () => void;
  isCalendarOpen?: boolean;
  hideCalendarButton?: boolean;
}
  
const Header: React.FC<HeaderProps> = ({ darkMode, toggleTheme, onOpenCalendar, isCalendarOpen, hideCalendarButton }) => {
  return (
    <div className="flex items-center justify-between py-5 mb-2">
      {/* Logo Area */}
      <Link to="/" className="flex items-center space-x-3 group cursor-pointer">
          <img 
            src="/logo.png" 
            alt="SportsLive Logo" 
            className="h-14 w-14 rounded-2xl shadow-lg transition-transform group-hover:scale-105 duration-300 object-cover bg-white"
          />
          <div className="flex flex-col">
            <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white leading-none">
                Sports<span className="font-light text-gray-500 dark:text-gray-400">Live</span>
            </span>
            
          </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center space-x-3">
          <Link 
            to="/game-tools/fpl"
            className="p-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm hover:shadow-md text-gray-600 dark:text-gray-300 flex items-center gap-1"
            title="Fantasy Premier League Tools"
        >
           
            <img src="https://a.espncdn.com/i/leaguelogos/soccer/500/23.png" alt="Fantasy Premier League Logo" className="w-7 h-7 object-contain" />
              <span className="hidden md:inline text-sm font-bold">Fantasy</span>
        </Link>
           <Link 
              to="/game-tools/nbaf"
              className="p-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm hover:shadow-md text-gray-600 dark:text-gray-300 flex items-center gap-1"
              title="NBA Fantasy Tools"
          >
               <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nba.png" alt="NBA Fantasy Logo" className="w-7 h-7 object-contain" />
              <span className="hidden md:inline text-sm font-bold">Fantasy</span>
          </Link>

          <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm hover:shadow-md text-gray-600 dark:text-gray-300"
              aria-label="Toggle Theme"
          >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {/* Calendar Button - Visible only on Mobile/Tablet (Hidden on LG) */}
          {!hideCalendarButton && (
            <button 
                onClick={onOpenCalendar}
                className="lg:hidden relative p-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg hover:opacity-90 transition-transform active:scale-95"
            >
                <CalendarDays size={18} />
            </button>
          )}
      </div>
    </div>
  );
};

export default Header;