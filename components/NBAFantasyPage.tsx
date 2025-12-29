import React from 'react';
import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NBAFantasyPageProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const NBAFantasyPage: React.FC<NBAFantasyPageProps> = ({ darkMode }) => {
  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden flex flex-col items-center justify-center ${darkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
       {/* Ambient Background */}
       <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px]" />
       </div>

       <div className="relative z-10 text-center px-4">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center animate-bounce">
                <Construction size={40} className="text-orange-500" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">NBA Fantasy Tool</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
            We are building something distinctively amazing for NBA fans. Stay tuned for advanced stats and lineup optimizers.
          </p>
          
          <Link 
            to="/game-tools"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all shadow-lg hover:shadow-orange-500/25"
          >
            Back to Tools
          </Link>
       </div>
    </div>
  );
};

export default NBAFantasyPage;
