/*
 * @Descripttion: 
 * @Author: ouchao
 * @Email: ouchao@sendpalm.com
 * @version: 1.0
 * @Date: 2025-12-13 16:35:41
 * @LastEditors: ouchao
 * @LastEditTime: 2025-12-13 18:10:29
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Github, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-12 border-t border-gray-200/50 dark:border-white/5 bg-white/30 dark:bg-black/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
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
                  <Link to="/world-cup-2026" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-blue-300 transition-colors flex items-center gap-1">
                    FIFA World Cup 2026™
                  </Link>
              </li>
            </ul>
          </div>

          {/* Partners & External */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Partners</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="https://www.nba.com" target="_blank" rel="noopener noreferrer" title="Visit NBA Official Site" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  NBA Official
                </a>
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
                  <Link to="/sitemap" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    Sitemap
                  </Link>
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