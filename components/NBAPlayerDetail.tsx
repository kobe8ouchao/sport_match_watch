import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, User, Ruler, Weight, Activity, Search, 
  TrendingUp, BarChart2, Table as TableIcon, Loader2 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar, AreaChart, Area 
} from 'recharts';
import { fetchNBAPlayerDetail } from '../services/nbaService';
import type { NBAPlayerDetail, NBASeasonStats } from '../services/nbaService';


function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const DASHBOARD_STATS: { key: keyof NBASeasonStats; label: string; color: string }[] = [
  { key: 'pts', label: 'Points', color: '#3b82f6' },      // Blue
  { key: 'reb', label: 'Rebounds', color: '#10b981' },    // Emerald
  { key: 'ast', label: 'Assists', color: '#f59e0b' },     // Amber
  { key: 'fg3m', label: '3-Pointers', color: '#06b6d4' }, // Cyan
  { key: 'stl', label: 'Steals', color: '#ef4444' },      // Red
  { key: 'blk', label: 'Blocks', color: '#8b5cf6' },      // Violet
  { key: 'fg_pct', label: 'FG%', color: '#6366f1' },      // Indigo
  { key: 'ft_pct', label: 'FT%', color: '#ec4899' },      // Pink
  { key: 'tov', label: 'Turnovers', color: '#64748b' },   // Slate
];

const NBAPlayerDetail: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<NBAPlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/espn/common/search?region=us&lang=en&contentonly=true&plugin=isex&limit=5&mode=prefix&type=player&sport=basketball&league=nba&query=${encodeURIComponent(debouncedQuery)}`);
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
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (playerId) {
      loadPlayer(playerId);
    }
  }, [playerId]);

  useEffect(() => {
    if (player) {
      // SEO Optimization
      const title = `${player.fullName} Stats & Fantasy Profile | NBA | Sport Match Watch`;
      document.title = title;

      // Update meta description
      const description = `Get detailed NBA fantasy stats, career averages, and season trends for ${player.fullName} (${player.team.name}). View points, rebounds, assists, and more for your fantasy basketball league.`;
      let metaDesc = document.querySelector("meta[name='description']");
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);

      // Update meta keywords
      const keywords = `${player.fullName}, ${player.firstName} ${player.lastName}, NBA, Fantasy Basketball, ${player.team.name}, ${player.position.name}, Player Stats, Sport Match Watch, NBA Stats`;
      let metaKeywords = document.querySelector("meta[name='keywords']");
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }
  }, [player]);

  const loadPlayer = async (id: string) => {
    setLoading(true);
    const data = await fetchNBAPlayerDetail(id);
    setPlayer(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Player Not Found</h2>
        <Link to="/game-tools/fantasy-nba/player-compare" className="text-blue-500 hover:underline">
          Return to Player Comparison
        </Link>
      </div>
    );
  }

  // Sort seasons for chart (Oldest -> Newest)
  const chartData = player.careerStats?.seasons 
    ? [...player.careerStats.seasons].sort((a, b) => (a.season || 0) - (b.season || 0)) 
    : [];
  const hasStats = chartData.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-12">
      {/* Header / Banner */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative mb-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={24} />
              <input
                type="text"
                placeholder="Search player..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-14 pr-4 py-4 bg-gray-100 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-zinc-900 border focus:border-blue-500 rounded-2xl text-lg transition-all outline-none text-gray-900 dark:text-white placeholder-gray-500 shadow-sm focus:shadow-md"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={20} />
              )}
            </div>
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    className="w-full text-left px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-4 border-b border-gray-50 dark:border-white/5 last:border-0"
                    onClick={() => {
                      navigate(`/game-tools/fantasy-nba/player/${item.id}`);
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                  >
                     <img 
                        src={item.headshot?.href || (item.id ? `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${item.id}.png&w=350&h=254` : 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/0.png&w=350&h=254')}
                        alt={item.displayName}
                        className="w-12 h-12 rounded-full bg-gray-100 object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; 
                            target.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/0.png&w=350&h=254';
                        }}
                    />
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-base">{item.displayName}</div>
                      <div className="text-sm text-gray-500">{item.team?.displayName || 'NBA'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            {/* Avatar */}
            <div className="relative shrink-0">
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden border-4 border-white dark:border-zinc-800 shadow-lg">
                <img 
                  src={player.headshot || 'https://a.espncdn.com/combiner/i?img=/i/headshots/nophoto.png&w=350&h=254'} 
                  alt={player.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nophoto.png&w=350&h=254';
                  }}
                />
              </div>
              {player.team.logo && (
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-800 p-2 rounded-full shadow-md border border-gray-100 dark:border-white/5">
                  <img 
                    src={player.team.logo} 
                    alt={player.team.abbreviation}
                    className="w-8 h-8 md:w-10 md:h-10 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                 <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                   {player.fullName}
                 </h1>
                 <span className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-bold text-sm">
                  {player.jersey ? `#${player.jersey}` : ''}
                  {player.jersey && player.position?.abbreviation ? ' • ' : ''}
                  {player.position?.abbreviation || player.position?.displayName || 'N/A'}
                </span>
              </div>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                {player.team.location} {player.team.name}
              </p>

              <div className="grid grid-cols-2 md:flex md:flex-wrap gap-4 md:gap-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Ruler size={16} />
                  <span>{player.displayHeight}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Weight size={16} />
                  <span>{player.displayWeight}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Calendar size={16} />
                  <span>{player.age} Years Old</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <User size={16} />
                  <span>
                    {player.displayBirthPlace 
                      ? player.displayBirthPlace 
                      : player.birthPlace 
                        ? `${player.birthPlace.city}, ${player.birthPlace.state || ''} ${player.birthPlace.country}`
                        : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Career Averages Badge */}
            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-4 md:p-6 min-w-[200px]">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">
                Career Average
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {player.careerStats?.avg?.pts?.toFixed(1) || '-'}
                  </div>
                  <div className="text-[10px] font-bold text-gray-500">PTS</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {player.careerStats?.avg?.reb?.toFixed(1) || '-'}
                  </div>
                  <div className="text-[10px] font-bold text-gray-500">REB</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {player.careerStats?.avg?.ast?.toFixed(1) || '-'}
                  </div>
                  <div className="text-[10px] font-bold text-gray-500">AST</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 border-t border-gray-200 dark:border-white/5">
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'chart' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Activity size={16} />
            Stats Trend
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'table' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <TableIcon size={16} />
            Season Stats
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!hasStats ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/5">
                <BarChart2 className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Career Stats Available</h3>
                <p className="text-gray-500 dark:text-gray-400">We couldn't find career statistics for this player.</p>
            </div>
        ) : activeTab === 'chart' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DASHBOARD_STATS.map((stat) => {
              // Get the last value (most recent season)
              const lastValue = chartData.length > 0 ? chartData[chartData.length - 1][stat.key] : 0;
              // Get career average
              const careerAvg = player.careerStats.avg[stat.key] || 0;
              
              return (
                <div key={stat.key} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                   {/* Header */}
                   <div className="flex justify-between items-start mb-4 relative z-10">
                     <div>
                       <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                       <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                         {typeof lastValue === 'number' ? lastValue.toFixed(1) : '-'}
                       </h3>
                     </div>
                     <div className="text-right">
                       <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block mb-1">Career Avg</span>
                       <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md">
                         {typeof careerAvg === 'number' ? careerAvg.toFixed(1) : '-'}
                       </span>
                     </div>
                   </div>

                   {/* Chart */}
                   <div className="h-24 -mx-2 -mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                         <defs>
                           <linearGradient id={`grad-${stat.key}`} x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor={stat.color} stopOpacity={0.25}/>
                             <stop offset="100%" stopColor={stat.color} stopOpacity={0.05}/>
                           </linearGradient>
                         </defs>
                         <XAxis 
                           dataKey="seasonDisplay" 
                           hide={false} 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fill: '#9CA3AF', fontSize: 10 }}
                           interval="preserveStartEnd"
                           minTickGap={20}
                         />
                         <Area 
                           type="monotone" 
                           dataKey={stat.key} 
                           stroke={stat.color} 
                           strokeWidth={2.5}
                           fill={`url(#grad-${stat.key})`} 
                           animationDuration={1500}
                         />
                         <Tooltip 
                           cursor={{ stroke: 'white', strokeWidth: 1, strokeDasharray: '2 2' }}
                           content={({ active, payload, label }) => {
                             if (active && payload && payload.length) {
                               return (
                                 <div className="bg-zinc-900/90 backdrop-blur-sm text-white text-xs py-1.5 px-3 rounded-lg shadow-xl border border-white/10">
                                   <div className="font-bold mb-0.5">{payload[0].value}</div>
                                   <div className="text-gray-400 text-[10px]">{payload[0].payload.seasonDisplay}</div>
                                 </div>
                               );
                             }
                             return null;
                           }}
                         />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'table' && hasStats && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider text-xs border-b border-gray-200 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-4">Season</th>
                    <th className="px-6 py-4">Team</th>
                    <th className="px-6 py-4 text-right">GP</th>
                    <th className="px-6 py-4 text-right">MIN</th>
                    <th className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">PTS</th>
                    <th className="px-6 py-4 text-right">REB</th>
                    <th className="px-6 py-4 text-right">AST</th>
                    <th className="px-6 py-4 text-right">STL</th>
                    <th className="px-6 py-4 text-right">BLK</th>
                    <th className="px-6 py-4 text-right">FG%</th>
                    <th className="px-6 py-4 text-right">3PM</th>
                    <th className="px-6 py-4 text-right">3P%</th>
                    <th className="px-6 py-4 text-right">FT%</th>
                    <th className="px-6 py-4 text-right">TO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {player.careerStats.seasons.map((season, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {season.seasonDisplay}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {season.team}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{season.gp}</td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{season.min}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white bg-gray-50/50 dark:bg-white/5">
                        {season.pts.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{season.reb.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{season.ast.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{season.stl.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{season.blk.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{season.fg_pct.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{season.fg3m?.toFixed(1) || '-'}</td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{season.fg3_pct.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{season.ft_pct.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{season.tov.toFixed(1)}</td>
                    </tr>
                  ))}
                  {/* Career Avg Row */}
                  <tr className="bg-gray-100 dark:bg-white/10 font-bold">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">Career</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">-</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.gp}</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.min}</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.pts?.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.reb?.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.ast?.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.stl?.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.blk?.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.fg_pct?.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.fg3m?.toFixed(1) || '-'}</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.fg3_pct?.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.ft_pct?.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{player.careerStats.avg.tov?.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default NBAPlayerDetail;
