import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, RefreshCw, ChevronRight, Loader2 } from 'lucide-react';
import { fetchTrendingPlayers, NFLTrendingPlayer } from '../services/nflFantasyService';

const PlayerList = ({ players, type, onPlayerClick, navigatingId }: { 
    players: NFLTrendingPlayer[], 
    type: 'add' | 'drop',
    onPlayerClick: (p: NFLTrendingPlayer) => void,
    navigatingId: string | null
}) => {
    if (!players || !Array.isArray(players)) return null;
    
    return (
    <div className="flex flex-col gap-3">
      {players.map((p, idx) => (
        <div 
          key={p.player_id} 
          onClick={() => onPlayerClick(p)}
          className="bg-white dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-lg p-3 flex items-center gap-3 hover:border-gray-300 dark:hover:border-white/20 transition-all group cursor-pointer"
        >
          <div className="relative">
              <img 
                src={p.player.avatar} 
                alt={p.player.fullName}
                className="w-12 h-12 rounded-full object-cover bg-gray-100 dark:bg-white/10"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://sleepercdn.com/images/v2/icons/player_default.webp';
                }}
              />
              <div className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center bg-gray-900 text-white text-[10px] font-bold rounded-full">
                  {idx + 1}
              </div>
          </div>
          
          <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white truncate">{p.player.fullName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 font-medium">
                      {p.player.position} - {p.player.team}
                  </span>
              </div>
          </div>

          <div className={`flex flex-col items-end px-2 ${type === 'add' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <span className="text-xl font-black tracking-tight leading-none">
                {type === 'add' ? '+' : '-'}{p.count}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Leagues</span>
          </div>

          {navigatingId === p.player_id ? (
             <Loader2 size={16} className="animate-spin text-gray-400" />
          ) : (
             <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400" />
          )}
        </div>
      ))}
    </div>
  );
};

const NFLTrending: React.FC = () => {
  const [adds, setAdds] = useState<NFLTrendingPlayer[]>([]);
  const [drops, setDrops] = useState<NFLTrendingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'adds' | 'drops'>('adds');
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [addsData, dropsData] = await Promise.all([
        fetchTrendingPlayers('add', 24),
        fetchTrendingPlayers('drop', 24)
      ]);
      setAdds(Array.isArray(addsData) ? addsData : []);
      setDrops(Array.isArray(dropsData) ? dropsData : []);
    } catch (e) {
      console.error("Error loading trending data", e);
      setAdds([]);
      setDrops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePlayerClick = async (player: NFLTrendingPlayer) => {
    if (navigatingId) return;
    setNavigatingId(player.player_id);
    
    try {
        // Search for player in ESPN to get ID
        const res = await fetch(`/api/espn/common/search?region=us&lang=en&contentonly=true&plugin=isex&limit=1&mode=prefix&type=player&sport=football&league=nfl&query=${encodeURIComponent(player.player.fullName)}`);
        const data = await res.json();
        const items = data.items || data.results?.[0]?.contents || [];
        
        if (items.length > 0 && items[0].id) {
            navigate(`/game-tools/fantasy-nfl/player-compare?p1=${items[0].id}`);
        } else {
             // Fallback to name search if ID not found (let the comparison page handle it or show error)
             console.warn(`Could not resolve ESPN ID for ${player.player.fullName}`);
             navigate(`/game-tools/fantasy-nfl/player-compare?player=${encodeURIComponent(player.player.fullName)}`);
        }
    } catch (e) {
        console.error("Error resolving player:", e);
        navigate(`/game-tools/fantasy-nfl/player-compare?player=${encodeURIComponent(player.player.fullName)}`);
    } finally {
        setNavigatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-orange-500" />
                NFL Fantasy Trending
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Real-time add/drop trends from Sleeper across thousands of leagues (Last 24h).
            </p>
        </div>
        <button 
            onClick={loadData}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
            title="Refresh Data"
        >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Mobile Tabs */}
      <div className="flex md:hidden bg-gray-100 dark:bg-white/5 p-1 rounded-lg mb-6">
        <button
            onClick={() => setActiveTab('adds')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                activeTab === 'adds' 
                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
            <TrendingUp size={16} className={activeTab === 'adds' ? 'text-green-500' : ''} />
            Trending Adds
        </button>
        <button
            onClick={() => setActiveTab('drops')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                activeTab === 'drops' 
                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
            <TrendingDown size={16} className={activeTab === 'drops' ? 'text-red-500' : ''} />
            Trending Drops
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Adds Column */}
        <div className={activeTab === 'adds' ? 'block' : 'hidden md:block'}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-white/10">
                <TrendingUp className="text-green-500" size={20} />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Trending Adds</h2>
            </div>
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : (
                <PlayerList 
                    players={adds} 
                    type="add" 
                    onPlayerClick={handlePlayerClick}
                    navigatingId={navigatingId}
                />
            )}
        </div>

        {/* Drops Column */}
        <div className={activeTab === 'drops' ? 'block' : 'hidden md:block'}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-white/10">
                <TrendingDown className="text-red-500" size={20} />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Trending Drops</h2>
            </div>
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : (
                <PlayerList 
                    players={drops} 
                    type="drop" 
                    onPlayerClick={handlePlayerClick}
                    navigatingId={navigatingId}
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default NFLTrending;