/*
 * @Descripttion: 
 * @Author: ouchao
 * @Email: ouchao@sendpalm.com
 * @version: 1.0
 * @Date: 2025-12-13 16:35:41
 * @LastEditors: ouchao
 * @LastEditTime: 2025-12-27 18:31:46
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Github, Mail } from 'lucide-react';

// Discord Icon Component
const DiscordIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <footer className="w-full mt-12 border-t border-gray-200/50 dark:border-white/5 bg-white/30 dark:bg-black/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" onClick={scrollToTop} className="flex items-center space-x-2">
                <img 
                  src="/logo.png" 
                  alt="SportsLive Logo" 
                  className="h-8 w-8 rounded-xl object-cover"
                />
                <span className="font-bold text-lg text-gray-900 dark:text-white">SportsLive</span>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
              The premium destination for real-time sports scores, schedules, and statistics.   
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-2.5">
              <li>
                  <Link to="/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    Live Scores
                  </Link>
              </li>
              <li>
                  <Link to="/leagues" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    Leagues
                  </Link>
              </li>
              <li>
                  <Link to="/schedule" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    Schedule
                  </Link>
              </li>
              <li>
                  <Link to="/news" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    News
                  </Link>
              </li>
             
              <li>
                  <Link to="/world-cup-2026" onClick={scrollToTop} className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-blue-300 transition-colors flex items-center gap-1">
                    FIFA World Cup 2026™
                  </Link>
              </li>
              <li>
                  <a
                    href="https://discord.gg/JVhxHWtM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#5865F2] dark:hover:text-[#5865F2] transition-colors flex items-center gap-1"
                  >
                    <DiscordIcon className="w-3 h-3" />
                    Join Discord
                  </a>
              </li>
            </ul>
          </div>

          {/* Partners & External */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Official External</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="https://www.nba.com" target="_blank" rel="noopener noreferrer" title="Visit NBA Official Site" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  NBA Official
                </a>
              </li>
              <li>
                <a href="https://www.nfl.com" target="_blank" rel="noopener noreferrer" title="Visit NFL Official Site" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  NFL Official
                </a>
              </li>
              <li>
                <a href="https://fantasy.nfl.com/" target="_blank" rel="noopener noreferrer" title="Play NFL Fantasy Football" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  NFL Fantasy
                </a>
              </li>
              <li>
                <Link to="/nfl-fantasy" onClick={scrollToTop} className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  NFL Fantasy Tools
                </Link>
              </li>
              <li>
                <a href="https://www.espn.com" target="_blank" rel="noopener noreferrer" title="Visit ESPN Sports News" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  ESPN
                </a>
              </li>
               <li>
                <a href="https://www.premierleague.com" target="_blank" rel="noopener noreferrer" title="Visit Premier League Official Site" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  Premier League
                </a>
              </li>
              <li>
                <a href="https://www.uefa.com/uefachampionsleague/" target="_blank" rel="noopener noreferrer" title="Visit UEFA Champions League" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  Champions League
                </a>
              </li>
              <li>
                <a href="https://www.bbc.com/sport" target="_blank" rel="noopener noreferrer" title="Visit BBC Sport" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  BBC Sport
                </a>
              </li>
              <li>
                <a href="https://www.skysports.com/" target="_blank" rel="noopener noreferrer" title="Visit Sky Sports" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  Sky Sports
                </a>
              </li>
              <li>
                <a href="https://sports.yahoo.com/" target="_blank" rel="noopener noreferrer" title="Visit Yahoo Sports" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  Yahoo Sports
                </a>
              </li>
            </ul>
          </div>
          
           {/* Newsletter / Social Placeholder (kept empty for now as per original) */}
           <div>
               <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Website</h3>
            <ul className="space-y-2.5">
              <li>
                  <Link to="/sitemap" target="_blank" onClick={scrollToTop} rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    Sitemap
                  </Link>
                 <li>
                  <Link to="/game-tools" onClick={scrollToTop} className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    Fantasy Game Tools
                  </Link>
              </li>
              <li>
                  <Link alt="Fantasy Premier League Tools" to="/game-tools/fantasy-premier-league" onClick={scrollToTop} className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    Fantasy Premier League Tools
                  </Link>
              </li>
              <li>
                  <Link to="/nba-fantasy" onClick={scrollToTop} className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    NBA Fantasy
                  </Link>
              </li>
              <li>
                  <Link to="/game-tools/fantasy-nfl" onClick={scrollToTop} className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    NFL Fantasy Tools
                  </Link>
              </li>
              </li>
              </ul>
           </div>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-200/50 dark:border-white/5 flex flex-col items-center justify-center text-xs text-gray-400">
          <p className="text-center">&copy; {new Date().getFullYear()} SportsLive Dashboard. All rights reserved.</p>   
        </div>
      </div>
    </footer>
  );
};

export default Footer;
