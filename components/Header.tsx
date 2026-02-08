/*
 * @Descripttion: 
 * @Author: ouchao
 * @Email: ouchao@sendpalm.com
 * @version: 1.0
 * @Date: 2025-12-13 16:35:41
 * @LastEditors: ouchao
 * @LastEditTime: 2026-02-06 14:55:48
 */
import React from 'react';
import { Menu, X, Calendar, Search, Sun, Moon, BarChart2, Gamepad2, Shield, CalendarDays, Activity, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Discord Icon Component
const DiscordIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

interface HeaderProps {
  darkMode: boolean;
  toggleTheme: () => void;
  onOpenCalendar: () => void;
  isCalendarOpen?: boolean;
  hideCalendarButton?: boolean;
}
  
const Header: React.FC<HeaderProps> = ({ darkMode, toggleTheme, onOpenCalendar, isCalendarOpen, hideCalendarButton }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between py-5 mb-2 relative">
      {/* Logo Area */}
      <Link to="/" className="flex items-center space-x-3 group cursor-pointer z-20">
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

      {/* Desktop Actions */}
      <div className="hidden md:flex items-center space-x-3">
          <Link
            to="/game-tools/fantasy-premier-league"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm hover:shadow-md text-gray-600 dark:text-gray-300 flex items-center gap-1"
            title="Fantasy Premier League Tools"
        >

            <img src="https://a.espncdn.com/i/leaguelogos/soccer/500/23.png" alt="Fantasy Premier League Logo" className="w-7 h-7 object-contain" />
              <span className="text-sm font-bold">Fantasy</span>
        </Link>
           <Link
              to="/game-tools/fantasy-nba"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm hover:shadow-md text-gray-600 dark:text-gray-300 flex items-center gap-1"
              title="NBA Fantasy Tools"
          >
               <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nba.png" alt="NBA Fantasy Logo" className="w-7 h-7 object-contain" />
              <span className="text-sm font-bold">Fantasy</span>
          </Link>
          <Link
                to="/game-tools/fantasy-nfl"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm hover:shadow-md text-gray-600 dark:text-gray-300 flex items-center gap-1"
                title="NFL Fantasy Tools"
            >
                <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png" alt="NFL" className="w-6 h-6 object-contain" />
                <span className="text-sm font-bold">Fantasy</span>
            </Link>
          <a
            href="https://discord.gg/JVhxHWtM"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm hover:shadow-md text-gray-600 dark:text-gray-300"
            title="Join our Discord community"
          >
              <DiscordIcon className="w-5 h-5" />
          </a>


          <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm hover:shadow-md text-gray-600 dark:text-gray-300"
              aria-label="Toggle Theme"
          >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            to="/following"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-full border transition-all shadow-sm hover:shadow-md flex items-center justify-center ${
              user 
                ? 'bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/10 text-black dark:text-white' 
                : 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
            }`}
            title={user ? "Manage Following" : "Sign In"}
          >
             {user && user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
             ) : (
                <User size={18} />
             )}
          </Link>
      </div>

      {/* Mobile Actions */}
      <div className="md:hidden flex items-center space-x-2 z-20">
          <a
              href="https://discord.gg/JVhxHWtM"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300"
              title="Join our Discord community"
          >
              <DiscordIcon className="w-5 h-5" />
          </a>
          <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300"
          >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!hideCalendarButton && (
            <button
                onClick={onOpenCalendar}
                className="lg:hidden relative p-2 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg"
            >
                <CalendarDays size={18} />
            </button>
          )}

          <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
          >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 p-2 z-50 flex flex-col gap-2 md:hidden animate-in slide-in-from-top-2 duration-200">
             <Link
                 to="/following"
                 target="_blank"
                 rel="noopener noreferrer"
                 onClick={() => setIsMenuOpen(false)}
                 className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
             >
                 {user && user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                 ) : (
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
                      <User size={14} className="text-gray-600 dark:text-gray-300" />
                    </div>
                 )}
                 <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                   {user ? "Following" : "Sign In"}
                 </span>
             </Link>
             <div className="h-px bg-gray-100 dark:bg-white/5 mx-2 my-1" />
            <Link
                to="/game-tools/fantasy-premier-league"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
                <img src="https://a.espncdn.com/i/leaguelogos/soccer/500/23.png" alt="FPL" className="w-6 h-6 object-contain" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">FPL Tools</span>
            </Link>
            <Link
                to="/game-tools/fantasy-nba"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
                <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nba.png" alt="NBA" className="w-6 h-6 object-contain" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">NBA Fantasy</span>
            </Link>
            <Link
                to="/game-tools/fantasy-nfl"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
                <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png" alt="NFL" className="w-6 h-6 object-contain" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">NFL Fantasy</span>
            </Link>
          </div>
      )}
    </div>
  );
};

export default Header;