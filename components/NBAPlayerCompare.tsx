import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, TrendingUp, AlertTriangle, Flame, Activity, 
  ChevronLeft, Share2, Info, X, Plus, Trash2, Loader2, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis 
} from 'recharts';
import { useNBAComparison, PlayerProfile, PlayerStats } from '../context/NBAComparisonContext';

// --- Helper Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    'Active': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'GTD': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'OUT': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Probable': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[status as keyof typeof colors] || colors.Active}`}>
      {status}
    </span>
  );
};

const TrendSparkline = ({ data, className = "" }: { data: number[], className?: string }) => {
  const chartData = data.map((val, idx) => ({ i: idx, val }));
  return (
    <div className={`h-full w-full min-h-[32px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey="val" 
            stroke="#0d9488" 
            strokeWidth={2} 
            dot={{ r: 2, fill: "#0d9488" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Helper Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- Main Component ---

const NBAPlayerCompare: React.FC = () => {
  const { players, loading, addPlayer, removePlayer, clearPlayers, refreshPlayers, setPlayers } = useNBAComparison();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Initial Sync Logic
  useEffect(() => {
    const init = async () => {
        // Parse URL params
        const ids: string[] = [];
        for (let i = 1; i <= 5; i++) {
            const id = searchParams.get(`p${i}`);
            if (id) ids.push(id);
        }
        const playersParam = searchParams.get('players');
        if (playersParam) {
            ids.push(...playersParam.split(','));
        }
        const uniqueIds = Array.from(new Set(ids));

        if (uniqueIds.length > 0) {
            // If URL has players, load them (overwriting context if different?)
            // For now, if URL is present, we assume it's the source of truth
            // But checking equality is hard without IDs. 
            // We'll just add them if not present.
            // Actually, if I paste a link, I want THOSE players.
            // So I should probably clear and add?
            // But if I'm just refreshing, context is empty anyway.
            
            // To be safe: if context is empty, load from URL.
            if (players.length === 0) {
                 for (const id of uniqueIds) {
                     await addPlayer(id);
                 }
            }
        } else {
            // URL is empty.
            if (players.length > 0) {
                // Context has players. Sync URL to Context.
                const params: Record<string, string> = {};
                players.forEach((p, idx) => {
                    params[`p${idx + 1}`] = p.id;
                });
                setSearchParams(params, { replace: true });
            } else {
                // Both empty. Load Defaults.
                await addPlayer('1966'); // LeBron
                await addPlayer('6450'); // Kawhi
            }
        }
    };
    init();
  }, []); // Run once on mount

  // Sync to URL when players change
  useEffect(() => {
    if (players.length > 0) {
        const params: Record<string, string> = {};
        players.forEach((p, idx) => {
            params[`p${idx + 1}`] = p.id;
        });
        setSearchParams(params, { replace: true });
        
        const names = players.map(p => p.name).join(' vs ');
        document.title = `Compare ${names} - NBA Stats | Sport Match Watch`;
    } else {
        setSearchParams({}, { replace: true });
        document.title = 'NBA Player Comparison Tool - Sport Match Watch';
    }
  }, [players, setSearchParams]);

  // Fetch Suggestions
  useEffect(() => {
    const fetchSuggestions = async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/espn/common/search?region=us&lang=en&contentonly=true&plugin=isex&limit=5&mode=prefix&type=player&sport=basketball&league=nba&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            const items = data.items || data.results?.[0]?.contents || [];
            setSuggestions(items);
        } catch (e) {
            console.error("Autocomplete Error:", e);
        } finally {
            setIsSearching(false);
        }
    };

    if (debouncedQuery) {
        fetchSuggestions(debouncedQuery);
    } else {
        setSuggestions([]);
        setIsSearching(false);
    }
  }, [debouncedQuery]);

  const handleAddPlayer = async (playerItem: any) => {
    setSearchQuery('');
    setSuggestions([]);
    setIsSearchOpen(false);
    await addPlayer(playerItem.id);
  };

  const renderStatRow = (label: string, key: keyof PlayerStats, inverse: boolean = false) => {
     let bestVal = -Infinity;
     let worstVal = Infinity;
     
     players.forEach(p => {
         const val = p.seasonStats[key];
         if (val > bestVal) bestVal = val;
         if (val < worstVal) worstVal = val;
     });

     const targetVal = inverse ? worstVal : bestVal;

     return (
        <tr className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
            <td className="py-4 px-4 text-left">
                <span className="font-bold text-gray-500 text-sm uppercase tracking-wide">{label}</span>
            </td>
            {players.map(p => {
                const val = p.seasonStats[key];
                const isBest = val === targetVal;
                
                const last5Val = p.last5Games[key];
                const isHot = !inverse && p.seasonStats[key] > 0 && ((last5Val - p.seasonStats[key]) / p.seasonStats[key] > 0.25);

                return (
                    <td key={p.id} className={`py-4 px-4 text-center relative ${isBest ? 'bg-green-50/30 dark:bg-green-900/10' : ''}`}>
                        <div className="flex flex-col items-center">
                            <span className={`text-lg font-bold ${isBest ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                {key.includes('pct') ? `${val.toFixed(1)}%` : val}
                            </span>
                            <span className="text-xs text-gray-400 font-medium mt-0.5">
                                L5: <span className={isHot ? 'text-amber-500 font-bold' : ''}>
                                    {key.includes('pct') ? `${last5Val.toFixed(1)}%` : last5Val}
                                </span>
                            </span>
                        </div>
                        {isHot && (
                             <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" title="Hot Streak!"></span>
                        )}
                    </td>
                );
            })}
        </tr>
     );
  };

  return (
    <div className="relative py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Player Comparison</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Compare stats, trends, and projections for up to 5 players</p>
          </div>
          <div className="flex items-center gap-3">
            <button
                onClick={refreshPlayers}
                disabled={loading}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
            >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
            </button>
            <button 
                onClick={() => {
                    clearPlayers();
                    setSearchParams({});
                }}
                className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
            >
                <Trash2 size={16} /> Clear All
            </button>
          </div>
      </div>

      {loading && (
          <div className="fixed inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl flex flex-col items-center animate-pulse border border-gray-100 dark:border-white/10">
                  <Activity className="w-10 h-10 text-teal-500 mb-3" />
                  <span className="font-bold text-gray-900 dark:text-white">Scouting Players...</span>
              </div>
          </div>
      )}

      {/* Players Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {players.map(p => (
              <div key={p.id} className="relative bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm group hover:border-teal-500/30 transition-all">
                  <button 
                      onClick={() => removePlayer(p.id)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                      <X size={16} />
                  </button>
                  
                  <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                          <img 
                              src={p.avatar} 
                              alt={p.name} 
                              className="w-16 h-16 rounded-full object-cover bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-md"
                          />
                          <div className="absolute -bottom-1 -right-1">
                             <StatusBadge status={p.status} />
                          </div>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-1">{p.name}</h3>
                      <div className="text-xs text-gray-500 mb-2">{p.team} • {p.position}</div>
                      
                      {/* Mini Badges */}
                      <div className="flex flex-wrap justify-center gap-1">
                          {p.evaluation.trend === 'Rising' && <TrendingUp size={14} className="text-green-500" />}
                          {p.evaluation.trend === 'Falling' && <TrendingUp size={14} className="text-red-500 rotate-180" />}
                          {p.evaluation.breakout && <Flame size={14} className="text-purple-500" />}
                          {p.evaluation.opportunity && <Activity size={14} className="text-amber-500" />}
                      </div>
                  </div>
              </div>
          ))}

          {/* Add Player Button */}
          {players.length < 5 && (
              <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="flex flex-col items-center justify-center min-h-[160px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 hover:text-teal-600 hover:border-teal-500 hover:bg-teal-50/10 transition-all group"
              >
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 transition-colors">
                      <Plus size={24} />
                  </div>
                  <span className="font-medium text-sm">Add Player</span>
              </button>
          )}
      </div>

      {/* Search Overlay/Modal */}
      {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
              <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-3">
                      <Search className="text-gray-400" size={20} />
                      <input 
                          autoFocus
                          type="text"
                          placeholder="Search NBA player..."
                          className="flex-1 bg-transparent outline-none text-lg text-gray-900 dark:text-white placeholder:text-gray-400"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <button onClick={() => setIsSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                      {isSearching ? (
                          <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                              <Loader2 className="w-6 h-6 animate-spin mb-2 text-teal-500" />
                              <span className="text-sm">Searching...</span>
                          </div>
                      ) : (
                          <>
                              {suggestions.map((item) => (
                                  <button
                                      key={item.id}
                                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 border-b border-gray-50 dark:border-white/5 last:border-0"
                                      onClick={() => handleAddPlayer(item)}
                                  >
                                      <img 
                                          src={item.headshot?.href || (item.id ? `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${item.id}.png&w=350&h=254` : 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/0.png&w=350&h=254')}
                                          alt={item.displayName}
                                          className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                                          onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.onerror = null;
                                              target.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/0.png&w=350&h=254';
                                          }}
                                      />
                                      <div>
                                          <div className="font-bold text-gray-900 dark:text-white">{item.displayName}</div>
                                          <div className="text-xs text-gray-500">{item.team?.displayName || 'NBA'}</div>
                                      </div>
                                  </button>
                              ))}
                              {searchQuery && suggestions.length === 0 && !isSearching && (
                                  <div className="p-8 text-center text-gray-400">No players found</div>
                              )}
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Comparison Content */}
      {players.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Projections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {players.map((p, idx) => (
                      <div key={p.id} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Projected Pts</div>
                          <div className="flex items-baseline gap-1 mb-4">
                              <span className="text-3xl font-black text-gray-900 dark:text-white">
                                  {(p.seasonStats.ppm * p.last5Games.mpg).toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">pts</span>
                          </div>
                          
                          <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">PPM</span>
                                  <span className="font-bold text-teal-600 dark:text-teal-400">{p.seasonStats.ppm.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">L5 Mins</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{p.last5Games.mpg}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Usage Est</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{p.seasonStats.usage_est}</span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>

              {/* Stats Table */}
              <div className="bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full">
                          <thead>
                              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                  <th className="py-4 px-4 text-left font-bold text-gray-400 text-xs uppercase tracking-wider w-32">Stat Category</th>
                                  {players.map(p => (
                                      <th key={p.id} className="py-4 px-4 text-center font-bold text-gray-900 dark:text-white min-w-[120px]">
                                          <div className="flex flex-col items-center gap-2">
                                              <img src={p.avatar} className="w-8 h-8 rounded-full" alt="" />
                                              <span>{p.name.split(' ').pop()}</span>
                                          </div>
                                      </th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                              {renderStatRow('Points', 'pts')}
                              {renderStatRow('Rebounds', 'reb')}
                              {renderStatRow('Assists', 'ast')}
                              {renderStatRow('Steals', 'stl')}
                              {renderStatRow('Blocks', 'blk')}
                              {renderStatRow('3PM', 'tpm')}
                              {renderStatRow('FG %', 'fg_pct')}
                              {renderStatRow('FT %', 'ft_pct')}
                              {renderStatRow('Turnovers', 'tov', true)}
                              {renderStatRow('Minutes', 'mpg')}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Opportunity Radar */}
                  <div className="bg-white dark:bg-white/5 rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
                      <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                          <Activity className="text-teal-500" />
                          Opportunity Radar
                      </h3>
                      <div className="space-y-4">
                          {players.map(p => (
                              <div key={p.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                                  <img src={p.avatar} className="w-10 h-10 rounded-full bg-white dark:bg-gray-800" alt="" />
                                  <div>
                                      <div className="font-bold text-gray-900 dark:text-white">{p.name}</div>
                                      <div className="text-sm mt-1">
                                          {p.evaluation.opportunity ? (
                                              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                                  <AlertTriangle size={14} />
                                                  {p.evaluation.opportunityReason}
                                              </span>
                                          ) : (
                                              <span className="text-gray-400">No major injury opportunities detected.</span>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Trends */}
                  <div className="bg-white dark:bg-white/5 rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
                       <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                          <TrendingUp className="text-teal-500" />
                          Recent Trends (Last 5 Games)
                      </h3>
                      <div className="space-y-6">
                          {players.map(p => (
                              <div key={p.id}>
                                  <div className="flex justify-between items-center mb-2">
                                      <div className="flex items-center gap-2">
                                          <img src={p.avatar} className="w-6 h-6 rounded-full" alt="" />
                                          <span className="font-bold text-sm text-gray-700 dark:text-gray-300">{p.name}</span>
                                      </div>
                                      <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                                          p.evaluation.trend === 'Rising' ? 'bg-green-100 text-green-700' :
                                          p.evaluation.trend === 'Falling' ? 'bg-red-100 text-red-700' :
                                          'bg-gray-100 text-gray-600'
                                      }`}>
                                          {p.evaluation.trend}
                                      </div>
                                  </div>
                                  <div className="h-10">
                                      <TrendSparkline data={p.last5Games.minutes} />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

          </div>
      )}
      
      {players.length === 0 && !loading && (
          <div className="text-center py-20 opacity-50">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-400">Add players to start comparing</p>
          </div>
      )}
    </div>
  );
};

export default NBAPlayerCompare;
