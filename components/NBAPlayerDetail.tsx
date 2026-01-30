import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, User, Ruler, Weight, Activity, 
  TrendingUp, BarChart2, Table as TableIcon, Loader2 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, AreaChart, Area 
} from 'recharts';
import { fetchNBAPlayerDetail } from '../services/nbaService';
import type { NBAPlayerDetail, NBASeasonStats } from '../services/nbaService';

const STAT_LABELS: Record<string, string> = {
  pts: 'Points',
  reb: 'Rebounds',
  ast: 'Assists',
  stl: 'Steals',
  blk: 'Blocks',
  fg_pct: 'FG%',
  ft_pct: 'FT%',
  fg3_pct: '3P%',
  fg3m: '3PM',
  tov: 'Turnovers',
  min: 'Minutes',
  gp: 'Games Played'
};

const NBAPlayerDetail: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [player, setPlayer] = useState<NBAPlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const [selectedStat, setSelectedStat] = useState<keyof NBASeasonStats>('pts');

  useEffect(() => {
    if (playerId) {
      loadPlayer(playerId);
    }
  }, [playerId]);

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

  // Reverse seasons for chart (Oldest -> Newest)
  const chartData = player.careerStats?.seasons ? [...player.careerStats.seasons].reverse() : [];
  const hasStats = chartData.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-12">
      {/* Header / Banner */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            to="/game-tools/fantasy-nba/player-compare" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Tools
          </Link>

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
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-white/5 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-blue-500" />
                Career Trend: {STAT_LABELS[selectedStat]}
              </h2>
              
              <div className="flex flex-wrap justify-center gap-2">
                {Object.keys(STAT_LABELS).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedStat(key as keyof NBASeasonStats)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedStat === key
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {key.toUpperCase().replace('_PCT', '%')}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="seasonDisplay" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '8px',
                      color: '#fff' 
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedStat} 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorStat)" 
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
