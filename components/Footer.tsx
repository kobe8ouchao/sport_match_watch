import React from 'react';
import { Facebook, Twitter, Instagram, Github, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-12 border-t border-gray-200/50 dark:border-white/5 bg-white/30 dark:bg-black/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <span className="text-white dark:text-black font-bold font-mono text-sm">S</span>
                </div>
                <span className="font-bold text-lg text-gray-900 dark:text-white">SportsLive</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
              The premium destination for real-time sports scores, schedules, and statistics. Designed with the Pantone 2026 Cloud Dancer aesthetic.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-2.5">
              {['Live Scores', 'Leagues', 'Schedule', 'News', 'Mobile App'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Partners & External */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Partners</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="https://www.nba.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                  NBA Official
                </a>
              </li>
              <li>
                <a href="https://www.espn.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1">
                  ESPN
                </a>
              </li>
               <li>
                <a href="https://www.premierleague.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1">
                  Premier League
                </a>
              </li>
              <li>
                <a href="https://www.uefa.com/uefachampionsleague/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
                  Champions League
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter / Social */}
          <div>
             <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Connect</h3>
             <div className="flex space-x-4 mb-6">
                <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors"><Twitter size={18} /></a>
                <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors"><Instagram size={18} /></a>
                <a href="#" className="text-gray-400 hover:text-blue-700 transition-colors"><Facebook size={18} /></a>
                <a href="#" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Github size={18} /></a>
             </div>
             <div className="flex items-center space-x-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-1 rounded-lg">
                <Mail size={16} className="text-gray-400 ml-2" />
                <input 
                    type="email" 
                    placeholder="Subscribe to updates" 
                    className="bg-transparent border-none text-xs text-gray-800 dark:text-white focus:ring-0 w-full p-1 outline-none placeholder-gray-400"
                />
             </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200/50 dark:border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} SportsLive Dashboard. All rights reserved.</p>
          <div className="flex space-x-4 mt-2 md:mt-0">
             <span>v2.4.0</span>
             <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span> Systems Normal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;