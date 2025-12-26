import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { Search, X, ArrowLeft, Users, Trophy } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface FPLPlayer {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number; // 1=GK, 2=DEF, 3=MID, 4=FWD
  goals_scored: number;
  assists: number;
  minutes: number;
  yellow_cards: number;
  red_cards: number;
  expected_goals: string;
  creativity: string; // Proxy for Key Passes
  threat: string; // Proxy for Touches in Box
  now_cost: number;
  total_points: number;
  points_per_game: string;
  selected_by_percent: string;
  form: string;
  ict_index: string;
  clean_sheets: number;
  goals_conceded: number;
  bonus: number;
  saves: number;
  penalties_saved: number;
  photo: string;
}

interface ProcessedPlayer {
  id: number;
  name: string;
  fullName: string;
  position: string;
  team: string;
  image: string;
  stats: {
    goals: number;
    assists: number;
    minutes: number;
    yellow_cards: number;
    red_cards: number;
    xg: number;
    keyPasses: number; // creativity
    touchesInBox: number; // threat
    price: number;
    total_points: number;
    points_per_game: number;
    selected_by_percent: number;
    form: number;
    ict_index: number;
    clean_sheets: number;
    goals_conceded: number;
    bonus: number;
    saves: number;
    penalties_saved: number;
  };
  raw: FPLPlayer;
}

interface PlayerComparisonProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const PlayerComparison: React.FC<PlayerComparisonProps> = ({ darkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const [allPlayers, setAllPlayers] = useState<ProcessedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [p1, setP1] = useState<ProcessedPlayer | null>(null);
  const [p2, setP2] = useState<ProcessedPlayer | null>(null);
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');

  // Update search inputs when players are selected
  useEffect(() => {
    if (p1) setSearch1(p1.name);
  }, [p1]);

  useEffect(() => {
    if (p2) setSearch2(p2.name);
  }, [p2]);

  const [isSearch1Focused, setIsSearch1Focused] = useState(false);
  const [isSearch2Focused, setIsSearch2Focused] = useState(false);

  // Max values for normalization
  const [maxValues, setMaxValues] = useState({
    goals: 1,
    assists: 1,
    xg: 1,
    keyPasses: 1,
    touchesInBox: 1,
    price: 1,
    total_points: 1,
    ict_index: 1,
    form: 1
  });

  // Teams map (simplified for now, ideally fetched from bootstrap-static 'teams')
  // We can just use ID if we don't fetch teams, but names are better.
  // I'll fetch teams too.
  const [teams, setTeams] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/fpl-api/bootstrap-static/');
        const data = await res.json();
        
        // Process Teams
        const teamMap: Record<number, string> = {};
        if (data.teams) {
            data.teams.forEach((t: any) => {
                teamMap[t.id] = t.short_name || t.name;
            });
        }
        setTeams(teamMap);

        // Process Players
        const processed: ProcessedPlayer[] = data.elements.map((p: FPLPlayer) => ({
            id: p.id,
            name: p.web_name,
            fullName: `${p.first_name} ${p.second_name}`,
            position: p.element_type === 1 ? 'GK' : p.element_type === 2 ? 'DEF' : p.element_type === 3 ? 'MID' : 'FWD',
            team: teamMap[p.team] || '',
            image: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.photo.replace('.jpg', '.png')}`,
            stats: {
                goals: p.goals_scored,
                assists: p.assists,
                minutes: p.minutes,
                yellow_cards: p.yellow_cards,
                red_cards: p.red_cards,
                xg: parseFloat(p.expected_goals) || 0,
                keyPasses: parseFloat(p.creativity) || 0,
                touchesInBox: parseFloat(p.threat) || 0,
                price: p.now_cost / 10,
                total_points: p.total_points,
                points_per_game: parseFloat(p.points_per_game) || 0,
                selected_by_percent: parseFloat(p.selected_by_percent) || 0,
                form: parseFloat(p.form) || 0,
                ict_index: parseFloat(p.ict_index) || 0,
                clean_sheets: p.clean_sheets,
                goals_conceded: p.goals_conceded,
                bonus: p.bonus,
                saves: p.saves,
                penalties_saved: p.penalties_saved
            },
            raw: p
        }));

        // Calculate Max Values for Normalization
        const maxs = {
            goals: Math.max(...processed.map(p => p.stats.goals), 1),
            assists: Math.max(...processed.map(p => p.stats.assists), 1),
            xg: Math.max(...processed.map(p => p.stats.xg), 1),
            keyPasses: Math.max(...processed.map(p => p.stats.keyPasses), 1),
            touchesInBox: Math.max(...processed.map(p => p.stats.touchesInBox), 1),
            price: Math.max(...processed.map(p => p.stats.price), 1),
            total_points: Math.max(...processed.map(p => p.stats.total_points), 1),
            ict_index: Math.max(...processed.map(p => p.stats.ict_index), 1),
            form: Math.max(...processed.map(p => p.stats.form), 1)
        };
        
        setMaxValues(maxs);
        setAllPlayers(processed.sort((a, b) => b.raw.total_points - a.raw.total_points)); // Sort by points initially
        setLoading(false);

        // Set default players if empty (e.g. top 2 scorers)
        if (processed.length >= 2) {
             const topScorers = [...processed].sort((a, b) => b.stats.goals - a.stats.goals);
             // Try to find Palmer and Saka as defaults since user mentioned them
             const palmer = processed.find(p => p.name === 'Palmer');
             const saka = processed.find(p => p.name === 'Saka');
             
             if (palmer && saka) {
                 setP1(palmer);
                 setP2(saka);
             } else {
                 setP1(topScorers[0]);
                 setP2(topScorers[1]);
             }
        }

      } catch (error) {
        console.error("Failed to fetch FPL data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPlayers1 = useMemo(() => {
    if (!search1) return allPlayers.slice(0, 50);
    const lower = search1.toLowerCase();
    return allPlayers.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.fullName.toLowerCase().includes(lower)
    ).slice(0, 20);
  }, [search1, allPlayers]);

  const filteredPlayers2 = useMemo(() => {
    if (!search2) return allPlayers.slice(0, 50);
    const lower = search2.toLowerCase();
    return allPlayers.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.fullName.toLowerCase().includes(lower)
    ).slice(0, 20);
  }, [search2, allPlayers]);

  const chartData = useMemo(() => {
    if (!p1 && !p2) return [];
    
    const dimensions = [
        { key: 'total_points', label: 'Total Pts', max: maxValues.total_points },
        { key: 'ict_index', label: 'ICT Index', max: maxValues.ict_index },
        { key: 'goals', label: 'Goals', max: maxValues.goals },
        { key: 'assists', label: 'Assists', max: maxValues.assists },
        { key: 'xg', label: 'xG', max: maxValues.xg },
        { key: 'form', label: 'Form', max: maxValues.form },
    ];

    return dimensions.map(dim => {
        const val1 = p1 ? p1.stats[dim.key as keyof typeof p1.stats] : 0;
        const val2 = p2 ? p2.stats[dim.key as keyof typeof p2.stats] : 0;
        
        return {
            subject: dim.label,
            // Normalized values (0-100)
            A: (val1 / dim.max) * 100,
            B: (val2 / dim.max) * 100,
            // Raw values for tooltip
            rawA: val1,
            rawB: val2,
            fullMark: 100
        };
    });
  }, [p1, p2, maxValues]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-100 dark:border-white/10">
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">{label}</h4>
          {payload.map((entry: any, index: number) => {
             const player = index === 0 ? p1 : p2;
             if (!player) return null;
             return (
                <div key={index} className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{player.name}:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {entry.payload[`raw${index === 0 ? 'A' : 'B'}`].toFixed(1)}
                        {label === 'Price' && 'm'}
                    </span>
                </div>
             );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 relative flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      
      {/* Background Ambient */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px]" />
         <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-grow w-full">
          <Header darkMode={darkMode} toggleTheme={toggleTheme} onOpenCalendar={() => {}} isCalendarOpen={false} />
          
          <div className="w-full py-8 flex-grow">
              
              <div className="flex items-center gap-4 mb-8">
                  
                  <h1 className="text-3xl font-black italic tracking-tighter">PLAYER COMPARISON RADAR</h1>
              </div>

              {loading ? (
                  <div className="flex items-center justify-center h-96">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
              ) : (
                  <div className="flex flex-col gap-8">
                      {/* Search Inputs Area */}
                      <div className="flex flex-col md:flex-row gap-4 md:gap-12 w-full relative z-50">
                          {/* Player 1 Search */}
                          <div className="flex-1 relative">
                              <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                  <input 
                                    type="text" 
                                    placeholder="Search Player 1..." 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    value={search1}
                                    onChange={(e) => setSearch1(e.target.value)}
                                    onFocus={() => setIsSearch1Focused(true)}
                                    onBlur={() => setTimeout(() => setIsSearch1Focused(false), 200)}
                                  />
                              </div>
                              {isSearch1Focused && (
                                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                                      {filteredPlayers1.map(p => (
                                          <button 
                                            key={p.id} 
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 border-b border-gray-100 dark:border-white/5 last:border-0"
                                            onMouseDown={() => { setP1(p); }}
                                          >
                                              <img src={p.image} alt={p.name} className="w-8 h-8 rounded-full object-cover bg-gray-200" onError={(e) => (e.target as HTMLImageElement).src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'} />
                                              <div>
                                                  <div className="font-bold text-sm">{p.name}</div>
                                                  <div className="text-xs text-gray-500">{p.team} · {p.position}</div>
                                              </div>
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>

                          {/* VS Divider (Optional, or just gap) */}
                          <div className="hidden md:flex items-center justify-center font-black text-gray-300 dark:text-white/20 italic text-xl">
                              VS
                          </div>

                          {/* Player 2 Search */}
                          <div className="flex-1 relative">
                              <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                  <input 
                                    type="text" 
                                    placeholder="Search Player 2..." 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-red-500 outline-none transition"
                                    value={search2}
                                    onChange={(e) => setSearch2(e.target.value)}
                                    onFocus={() => setIsSearch2Focused(true)}
                                    onBlur={() => setTimeout(() => setIsSearch2Focused(false), 200)}
                                  />
                              </div>
                              {isSearch2Focused && (
                                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                                      {filteredPlayers2.map(p => (
                                          <button 
                                            key={p.id} 
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 border-b border-gray-100 dark:border-white/5 last:border-0"
                                            onMouseDown={() => { setP2(p); }}
                                          >
                                              <img src={p.image} alt={p.name} className="w-8 h-8 rounded-full object-cover bg-gray-200" onError={(e) => (e.target as HTMLImageElement).src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'} />
                                              <div>
                                                  <div className="font-bold text-sm">{p.name}</div>
                                                  <div className="text-xs text-gray-500">{p.team} · {p.position}</div>
                                              </div>
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                          
                          {/* Player 1 Card */}
                          <div className="lg:col-span-3 order-2 lg:order-1">
                              {p1 ? (
                                  <div className="glass-card bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-3xl p-6 flex flex-col items-center animate-in fade-in zoom-in duration-300 relative overflow-hidden group">
                                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-1 mb-4 shadow-lg group-hover:scale-105 transition-transform duration-500">
                                          <img src={p1.image} alt={p1.name} className="w-full h-full rounded-full object-cover bg-gray-200 border-2 border-white" onError={(e) => (e.target as HTMLImageElement).src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'} />
                                      </div>
                                      <h2 className="text-2xl font-black text-center mb-1">{p1.name}</h2>
                                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 mb-6">
                                          <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-xs">{p1.team}</span>
                                          <span>{p1.position}</span>
                                      </div>
                                      
                                      <div className="w-full space-y-3">
                                          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                              <div className="flex justify-between items-center mb-1">
                                                  <span className="text-xs text-gray-500 uppercase tracking-wider">Total Points</span>
                                                  <span className="text-xl font-black text-purple-600 dark:text-purple-400">{p1.stats.total_points}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                  <span className="text-xs text-gray-500 uppercase tracking-wider">ICT Index</span>
                                                  <span className="font-bold">{p1.stats.ict_index.toFixed(1)}</span>
                                              </div>
                                          </div>

                                          <StatRow label="Form" value={p1.stats.form} color="text-green-500" />
                                          <StatRow label="Points/Game" value={p1.stats.points_per_game} color="text-gray-700 dark:text-gray-300" />
                                          <StatRow label="Selected By" value={`${p1.stats.selected_by_percent}%`} color="text-gray-700 dark:text-gray-300" />
                                          <div className="h-px bg-gray-200 dark:bg-white/10 my-2"></div>
                                          <StatRow label="Minutes" value={p1.stats.minutes} color="text-gray-700 dark:text-gray-300" />
                                          <StatRow label="Goals" value={p1.stats.goals} color="text-blue-500" />
                                          <StatRow label="Assists" value={p1.stats.assists} color="text-blue-500" />
                                          <StatRow label="xG" value={p1.stats.xg.toFixed(2)} color="text-blue-500" />
                                          <StatRow label="Bonus Pts" value={p1.stats.bonus} color="text-yellow-500" />
                                          <StatRow label="Clean Sheets" value={p1.stats.clean_sheets} color="text-green-500" />
                                          {['GK', 'DEF'].includes(p1.position) && (
                                              <StatRow label="Goals Conceded" value={p1.stats.goals_conceded} color="text-red-500" />
                                          )}
                                          {p1.position === 'GK' && (
                                              <StatRow label="Saves" value={p1.stats.saves} color="text-blue-500" />
                                          )}
                                          <StatRow label="Cards (Y/R)" value={`${p1.stats.yellow_cards} / ${p1.stats.red_cards}`} color="text-yellow-500" />
                                          <StatRow label="Price" value={`£${p1.stats.price}m`} color="text-gray-500" />
                                      </div>
                                  </div>
                              ) : (
                                <div className="hidden lg:flex h-full items-center justify-center text-gray-300 dark:text-white/10 font-medium italic">
                                    Select Player 1
                                </div>
                              )}
                          </div>

                          {/* Radar Chart Area */}
                          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-center justify-center min-h-[500px]">
                               <div className="glass-card w-full h-full min-h-[500px] bg-white/30 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[3rem] p-4 md:p-8 flex flex-col items-center justify-center relative">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        <Trophy size={20} />
                                        Performance Radar
                                    </h3>
                                    
                                    {p1 && p2 ? (
                                        <div className="w-full h-[400px] md:h-[500px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                                    <PolarGrid stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} strokeWidth={1} />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 13, fontWeight: 700 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} tickCount={6} axisLine={false} />
                                                    
                                                    <Radar
                                                        name={p1.name}
                                                        dataKey="A"
                                                        stroke="#3b82f6"
                                                        strokeWidth={4}
                                                        fill="#3b82f6"
                                                        fillOpacity={0.5}
                                                    />
                                                    <Radar
                                                        name={p2.name}
                                                        dataKey="B"
                                                        stroke="#ef4444"
                                                        strokeWidth={4}
                                                        fill="#ef4444"
                                                        fillOpacity={0.5}
                                                    />
                                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                                                    <RechartsTooltip content={<CustomTooltip />} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400 dark:text-gray-600">
                                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>Select two players to compare their stats</p>
                                        </div>
                                    )}
                                    
                                    <div className="absolute bottom-4 right-6 text-[10px] text-gray-400 max-w-[200px] text-right">
                                        *ICT Index: Influence, Creativity, Threat combined score
                                    </div>
                               </div>
                          </div>

                          {/* Player 2 Card */}
                          <div className="lg:col-span-3 order-3">
                              {p2 ? (
                                  <div className="glass-card bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-3xl p-6 flex flex-col items-center animate-in fade-in zoom-in duration-300 relative overflow-hidden group">
                                      <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-red-500 to-orange-600 p-1 mb-4 shadow-lg group-hover:scale-105 transition-transform duration-500">
                                          <img src={p2.image} alt={p2.name} className="w-full h-full rounded-full object-cover bg-gray-200 border-2 border-white" onError={(e) => (e.target as HTMLImageElement).src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'} />
                                      </div>
                                      <h2 className="text-2xl font-black text-center mb-1">{p2.name}</h2>
                                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 mb-6">
                                          <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-xs">{p2.team}</span>
                                          <span>{p2.position}</span>
                                      </div>
                                      
                                      <div className="w-full space-y-3">
                                          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                              <div className="flex justify-between items-center mb-1">
                                                  <span className="text-xs text-gray-500 uppercase tracking-wider">Total Points</span>
                                                  <span className="text-xl font-black text-purple-600 dark:text-purple-400">{p2.stats.total_points}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                  <span className="text-xs text-gray-500 uppercase tracking-wider">ICT Index</span>
                                                  <span className="font-bold">{p2.stats.ict_index.toFixed(1)}</span>
                                              </div>
                                          </div>

                                          <StatRow label="Form" value={p2.stats.form} color="text-green-500" />
                                          <StatRow label="Points/Game" value={p2.stats.points_per_game} color="text-gray-700 dark:text-gray-300" />
                                          <StatRow label="Selected By" value={`${p2.stats.selected_by_percent}%`} color="text-gray-700 dark:text-gray-300" />
                                          <div className="h-px bg-gray-200 dark:bg-white/10 my-2"></div>
                                          <StatRow label="Minutes" value={p2.stats.minutes} color="text-gray-700 dark:text-gray-300" />
                                          <StatRow label="Goals" value={p2.stats.goals} color="text-red-500" />
                                          <StatRow label="Assists" value={p2.stats.assists} color="text-red-500" />
                                          <StatRow label="xG" value={p2.stats.xg.toFixed(2)} color="text-red-500" />
                                          <StatRow label="Bonus Pts" value={p2.stats.bonus} color="text-yellow-500" />
                                          <StatRow label="Clean Sheets" value={p2.stats.clean_sheets} color="text-green-500" />
                                          {['GK', 'DEF'].includes(p2.position) && (
                                              <StatRow label="Goals Conceded" value={p2.stats.goals_conceded} color="text-red-500" />
                                          )}
                                          {p2.position === 'GK' && (
                                              <StatRow label="Saves" value={p2.stats.saves} color="text-red-500" />
                                          )}
                                          <StatRow label="Cards (Y/R)" value={`${p2.stats.yellow_cards} / ${p2.stats.red_cards}`} color="text-yellow-500" />
                                          <StatRow label="Price" value={`£${p2.stats.price}m`} color="text-gray-500" />
                                      </div>
                                  </div>
                              ) : (
                                <div className="hidden lg:flex h-full items-center justify-center text-gray-300 dark:text-white/10 font-medium italic">
                                    Select Player 2
                                </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
          </div>
          <Footer />
      </div>
    </div>
  );
};

const StatRow = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2 last:border-0">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`font-black ${color}`}>{value}</span>
    </div>
);

export default PlayerComparison;
