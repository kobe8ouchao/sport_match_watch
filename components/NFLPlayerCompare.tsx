import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, TrendingUp, AlertTriangle, Flame, Activity, 
  X, Plus, Trash2, Loader2, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { useNFLComparison, NFLPlayerProfile, NFLPlayerStats } from '../context/NFLComparisonContext';

// --- Helper Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    'Active': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Questionable': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Doubtful': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'OUT': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'IR': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${colors[status as keyof typeof colors] || colors.Active}`}>
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

const NFLPlayerCompare: React.FC = () => {
  const { players, loading, addPlayer, removePlayer, clearPlayers, refreshPlayers, setPlayers } = useNFLComparison();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Position cache
  const positionCache = React.useRef<Map<string, string>>(new Map());

  // Fetch player position
  const fetchPlayerPosition = async (playerId: string): Promise<string> => {
    if (positionCache.current.has(playerId)) {
      return positionCache.current.get(playerId)!;
    }

    try {
      const res = await fetch(`/api/espn/common/sports/football/nfl/athletes/${playerId}`);
      const data = await res.json();
      const position = data.athlete?.position?.abbreviation || '';
      if (position) {
        positionCache.current.set(playerId, position);
      }
      return position;
    } catch (e) {
      console.error('Error fetching position:', e);
      return '';
    }
  };

  // Initial Sync Logic
  const initialized = React.useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
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
            if (players.length === 0) {
                 for (const id of uniqueIds) {
                     await addPlayer(id);
                 }
            }
        } else {
            if (players.length > 0) {
                const params: Record<string, string> = {};
                players.forEach((p, idx) => {
                    params[`p${idx + 1}`] = p.id;
                });
                setSearchParams(params, { replace: true });
            } else {
                // Defaults: Lamar Jackson, Josh Allen
                await addPlayer('3916387'); 
                await addPlayer('3918298'); 
            }
        }
    };
    init();
  }, []);

  // Sync to URL
  useEffect(() => {
    if (players.length > 0) {
        const params: Record<string, string> = {};
        players.forEach((p, idx) => {
            params[`p${idx + 1}`] = p.id;
        });
        setSearchParams(params, { replace: true });
        
        const names = players.map(p => p.name).join(' vs ');
        document.title = `Compare ${names} - NFL Stats | Sport Match Watch`;
    } else {
        setSearchParams({}, { replace: true });
        document.title = 'NFL Player Comparison Tool - Sport Match Watch';
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
            const res = await fetch(`/api/espn/common/search?region=us&lang=en&contentonly=true&plugin=isex&limit=5&mode=prefix&type=player&sport=football&league=nfl&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            const items = data.items || data.results?.[0]?.contents || [];

            // Fetch position for each player
            const itemsWithPositions = await Promise.all(
                items.map(async (item: any) => {
                    const position = await fetchPlayerPosition(item.id);
                    return { ...item, position };
                })
            );

            setSuggestions(itemsWithPositions);
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

  const renderSectionHeader = (title: string) => (
      <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
          <td colSpan={players.length + 1} className="py-2 px-4 text-left">
              <span className="font-bold text-teal-600 dark:text-teal-400 text-xs uppercase tracking-wider">{title}</span>
          </td>
      </tr>
  );

    const renderStatRow = (label: string, key: keyof NFLPlayerStats, inverse: boolean = false, isPremium: boolean = false) => {
     let bestVal = -Infinity;
     let worstVal = Infinity;
     
     // Percentage keys
     const percentageKeys: (keyof NFLPlayerStats)[] = [
         'completion_pct', 'sack_rate', 'carry_share', 
         'target_share', 'catch_rate', 'td_per_reception'
     ];
     const isPercentage = percentageKeys.includes(key);

     // Find best/worst only if values exist
     const hasValues = players.some(p => p.seasonStats[key] !== undefined);
     
     if (hasValues && !isPremium) {
         players.forEach(p => {
             const val = p.seasonStats[key] || 0;
             if (val > bestVal) bestVal = val;
             if (val < worstVal) worstVal = val;
         });
     }

     const targetVal = inverse ? worstVal : bestVal;

     return (
        <tr className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
            <td className="py-4 px-4 text-left">
                <span className="font-bold text-gray-500 text-sm uppercase tracking-wide flex items-center gap-1">
                    {label}
                    {isPremium && <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" title="Requires Advanced/Premium Data Source">PRO</span>}
                </span>
            </td>
            {players.map(p => {
                const val = p.seasonStats[key];
                let displayVal: string | number = '-';
                
                if (val !== undefined) {
                    displayVal = val;
                    if (isPercentage) displayVal = `${val}%`;
                }

                const isBest = !isPremium && players.length > 1 && val === targetVal && val !== 0 && typeof val === 'number';
                
                return (
                    <td key={p.id} className={`py-4 px-4 text-center relative ${isBest ? 'bg-green-50/30 dark:bg-green-900/10' : ''}`}>
                        <div className="flex flex-col items-center">
                            <span className={`text-lg font-bold ${isBest ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'} ${val === undefined ? 'text-gray-300 dark:text-gray-600' : ''}`}>
                                {displayVal}
                            </span>
                        </div>
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
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">NFL Player Comparison</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Compare fantasy stats and trends for up to 5 players</p>
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
                          {p.evaluation.boom_potential && <Flame size={14} className="text-orange-500" />}
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
                          placeholder="Search NFL player..."
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
                                          src={item.headshot?.href || (item.id ? `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${item.id}.png&w=350&h=254` : 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/0.png&w=350&h=254')}
                                          alt={item.displayName}
                                          className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                                          onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.onerror = null;
                                              target.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/0.png&w=350&h=254';
                                          }}
                                      />
                                      <div>
                                          <div className="font-bold text-gray-900 dark:text-white">{item.displayName}</div>
                                          <div className="text-xs text-gray-500">
                                              {item.team?.displayName || 'NFL'}
                                              {item.position && <span> • {item.position}</span>}
                                          </div>
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
                              {renderSectionHeader('Standard Stats (Passing)')}
                              {renderStatRow('Passing Yds', 'pass_yds')}
                              {renderStatRow('Passing TDs', 'pass_td')}
                              {renderStatRow('Ints', 'pass_int', true)}
                              {renderStatRow('Sacks', 'pass_sacks', true)}
                              {renderStatRow('Attempts', 'pass_att')}

                              {renderSectionHeader('QB Efficiency')}
                              {renderStatRow('Comp %', 'completion_pct')}
                              {renderStatRow('Yds/Att', 'yards_per_attempt')}
                              {renderStatRow('TD:INT Ratio', 'td_int_ratio')}
                              {renderStatRow('Sack Rate %', 'sack_rate', true)}

                              {renderSectionHeader('Standard Stats (Rushing)')}
                              {renderStatRow('Carries', 'rush_carries')}
                              {renderStatRow('Rushing Yds', 'rush_yds')}
                              {renderStatRow('Rushing TDs', 'rush_td')}

                              {renderSectionHeader('Rushing Efficiency')}
                              {renderStatRow('Yds/Carry', 'yards_per_carry')}
                              {renderStatRow('Carry Share %', 'carry_share')}
                              {renderStatRow('Total Touches', 'total_touches')}
                              {renderStatRow('Yds/Touch', 'yards_per_touch')}

                              {renderSectionHeader('Standard Stats (Receiving)')}
                              {renderStatRow('Targets', 'targets')}
                              {renderStatRow('Receptions', 'receptions')}
                              {renderStatRow('Rec Yds', 'rec_yds')}
                              {renderStatRow('Rec TDs', 'rec_td')}

                              {renderSectionHeader('Receiving Efficiency')}
                              {renderStatRow('Target Share %', 'target_share')}
                              {renderStatRow('Catch Rate %', 'catch_rate')}
                              {renderStatRow('Yds/Rec', 'yards_per_reception')}
                              {renderStatRow('Yds/Tgt', 'yards_per_target')}
                              {renderStatRow('YPRR (Est)', 'yprr')}
                              {renderStatRow('TD/Rec %', 'td_per_reception')}
                              
                              {renderSectionHeader('Fantasy Summary')}
                              {renderStatRow('Fantasy Pts (Tot)', 'fantasy_points')}
                          </tbody>
                      </table>
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

export default NFLPlayerCompare;
