import React, { useState, useEffect } from 'react';
import { Search, Calculator, TrendingDown, ArrowRight, DollarSign, BarChart2, Filter, Info, RefreshCw, User, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FPLPlayer {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number; // 1=GK, 2=DEF, 3=MID, 4=FWD
  now_cost: number;
  selected_by_percent: string;
  form: string;
  ict_index: string;
  minutes: number;
  status: string;
  photo: string;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  creativity: string;
  threat: string;
  saves: number;
  expected_goals_conceded: string;
  points_per_game: string;
  total_points: number;
}

interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
}

interface ComparisonResult extends FPLPlayer {
  similarity: number;
  price_diff: number;
  stats_vector: number[];
}

const STORAGE_KEY = 'budget-finder-state';

const BudgetAlternativeFinder: React.FC = () => {
  // SEO Configuration
  useEffect(() => {
    document.title = "FPL Budget Alternative Finder - Find Cheaper Players | SportsLive";
    
    // Helper to update or create meta tags
    const updateMeta = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('name', name);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    // Meta Description & Keywords
    updateMeta('description', 'Find high-value FPL budget enablers using our advanced similarity algorithm. Compare cheap players to premiums like Salah or Haaland based on underlying stats.');
    updateMeta('keywords', 'FPL Budget Finder, Fantasy Premier League, FPL Value Players, Cheap FPL Players, FPL Player Comparison, xG Analysis, FPL Transfer Tool');

    // Open Graph Tags
    const updateOG = (property: string, content: string) => {
        let element = document.querySelector(`meta[property="${property}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('property', property);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    updateOG('og:title', 'FPL Budget Alternative Finder - Find Cheaper Players');
    updateOG('og:description', 'Find high-value FPL budget enablers using our advanced similarity algorithm. Compare cheap players to premiums like Salah or Haaland based on underlying stats.');
    updateOG('og:type', 'website');
    // updateOG('og:image', 'https://sportlive.win/fpl-tools-preview.png'); // Placeholder

  }, []);

  // Data State
  const [allPlayers, setAllPlayers] = useState<FPLPlayer[]>([]);
  const [teams, setTeams] = useState<Record<number, FPLTeam>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User Input State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<FPLPlayer | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(10.0);
  const [minMinutes, setMinMinutes] = useState<number>(270); // Minimum 3 full games
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);

  // Derived State
  const [searchResults, setSearchResults] = useState<FPLPlayer[]>([]);

  useEffect(() => {
    fetchData();
    const savedState = sessionStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.selectedPlayer) setSelectedPlayer(parsed.selectedPlayer);
      if (parsed.maxPrice) setMaxPrice(parsed.maxPrice);
    }
  }, []);

  // Set default Haaland
  useEffect(() => {
    if (allPlayers.length > 0 && !selectedPlayer) {
      // Find Haaland
      const haaland = allPlayers.find(p => p.web_name === 'Haaland' || (p.first_name === 'Erling' && p.second_name === 'Haaland'));
      if (haaland) {
        selectPlayer(haaland);
      }
    }
  }, [allPlayers]);

  useEffect(() => {
    if (selectedPlayer && allPlayers.length > 0) {
      // Save state
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedPlayer,
        maxPrice
      }));

      // Run Analysis
      // 1. Filter candidates
      const candidates = allPlayers.filter(p => 
        p.id !== selectedPlayer.id &&
        p.element_type === selectedPlayer.element_type && // Same position
        p.minutes >= minMinutes && // Minimum minutes
        (p.now_cost / 10) <= maxPrice // Budget filter
      );

      // 2. Calculate Max values for normalization (to prevent Threat/Creativity dominating xG/xA)
      const pool = [selectedPlayer, ...candidates];
      const maxValues = {
        saves: Math.max(...pool.map(p => getPer90(p.saves, p.minutes))) || 1,
        expected_goals_conceded: Math.max(...pool.map(p => getPer90(p.expected_goals_conceded, p.minutes))) || 1,
        clean_sheets: Math.max(...pool.map(p => getPer90(p.clean_sheets, p.minutes))) || 1,
        threat: Math.max(...pool.map(p => getPer90(p.threat, p.minutes))) || 1,
        creativity: Math.max(...pool.map(p => getPer90(p.creativity, p.minutes))) || 1,
        expected_goals: Math.max(...pool.map(p => getPer90(p.expected_goals, p.minutes))) || 1,
        expected_assists: Math.max(...pool.map(p => getPer90(p.expected_assists, p.minutes))) || 1
      };
  
      const getNormalizedVector = (p: FPLPlayer) => {
        let rawVector: number[] = [];
        let weights: number[] = [];
    
        if (p.element_type === 1) { // GK
          rawVector = [
            getPer90(p.saves, p.minutes) / maxValues.saves,
            getPer90(p.expected_goals_conceded, p.minutes) / maxValues.expected_goals_conceded, 
            getPer90(p.clean_sheets, p.minutes) / maxValues.clean_sheets
          ];
          weights = [0.5, 0.3, 0.2];
        } else if (p.element_type === 2) { // DEF
          rawVector = [
            getPer90(p.clean_sheets, p.minutes) / maxValues.clean_sheets,
            getPer90(p.expected_goals_conceded, p.minutes) / maxValues.expected_goals_conceded,
            getPer90(p.threat, p.minutes) / maxValues.threat,
            getPer90(p.creativity, p.minutes) / maxValues.creativity
          ];
          weights = [0.3, 0.3, 0.2, 0.2];
        } else { // MID (3) & FWD (4)
          rawVector = [
            getPer90(p.expected_goals, p.minutes) / maxValues.expected_goals,
            getPer90(p.threat, p.minutes) / maxValues.threat,
            getPer90(p.expected_assists, p.minutes) / maxValues.expected_assists,
            getPer90(p.creativity, p.minutes) / maxValues.creativity
          ];
          weights = [0.4, 0.4, 0.1, 0.1];
        }
        return rawVector.map((val, i) => val * weights[i]);
      };

      const targetVector = getNormalizedVector(selectedPlayer);
  
      const scoredCandidates = candidates.map(p => {
        const pVector = getNormalizedVector(p);
        const similarity = cosineSimilarity(targetVector, pVector);
        return {
          ...p,
          similarity,
          price_diff: (selectedPlayer.now_cost - p.now_cost) / 10,
          stats_vector: pVector
        };
      });
  
      // Sort by similarity desc
      scoredCandidates.sort((a, b) => b.similarity - a.similarity);
      setResults(scoredCandidates.slice(0, 20));
    }
  }, [selectedPlayer, maxPrice, minMinutes, allPlayers]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      const filtered = allPlayers.filter(p => 
        (p.web_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         p.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.second_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setSearchResults(filtered.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, allPlayers]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/fpl-api/bootstrap-static/');
      if (!res.ok) throw new Error('Failed to fetch FPL data');
      const data = await res.json();
      
      setAllPlayers(data.elements);
      const teamMap: Record<number, FPLTeam> = {};
      data.teams.forEach((t: FPLTeam) => teamMap[t.id] = t);
      setTeams(teamMap);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load data. Please refresh.');
      setLoading(false);
    }
  };

  const getPer90 = (val: number | string, mins: number) => {
    if (mins === 0) return 0;
    return (Number(val) / mins) * 90;
  };

  const getPlayerVector = (p: FPLPlayer) => {
    // Position-specific weights and features
    let rawVector: number[] = [];
    let weights: number[] = [];

    if (p.element_type === 1) { // GK
      // Features: Saves, xGA (lower is better, but here we want similarity, so we track magnitude), Clean Sheets
      // Weights: Saves (0.5), xGA (0.3), Clean Sheets (0.2)
      // Note: For similarity, we want to match the *profile*.
      rawVector = [
        getPer90(p.saves, p.minutes),
        getPer90(p.expected_goals_conceded, p.minutes), 
        getPer90(p.clean_sheets, p.minutes)
      ];
      weights = [0.5, 0.3, 0.2];
    } else if (p.element_type === 2) { // DEF
      // Features: Clean Sheets (xCS proxy), xGC (Defense), Threat (Attacking), Creativity (Progressive proxy)
      // Weights: Defensive (0.6), Attacking (0.4) -> Split into specific metrics
      rawVector = [
        getPer90(p.clean_sheets, p.minutes),          // ~xCS
        getPer90(p.expected_goals_conceded, p.minutes), // Defense
        getPer90(p.threat, p.minutes),                // Attacking Threat (Touches in box/final third proxy)
        getPer90(p.creativity, p.minutes)             // Progressive/Creativity
      ];
      weights = [0.3, 0.3, 0.2, 0.2]; // 60% Def, 40% Att
    } else { // MID (3) & FWD (4)
      // Features: xG (npxG proxy), xA, Threat (Shots/Touches proxy), Creativity (Key Passes proxy)
      // Weights: Attack (0.8), Creativity (0.2)
      rawVector = [
        getPer90(p.expected_goals, p.minutes),        // ~npxG
        getPer90(p.threat, p.minutes),                // ~Shots/Touches in Box
        getPer90(p.expected_assists, p.minutes),      // xA
        getPer90(p.creativity, p.minutes)             // ~Key Passes
      ];
      // Attack: xG + Threat = 0.8? Or mix. 
      // User said: Attack (80%), Creativity (20%)
      // Let's assign: xG (0.4), Threat (0.4) -> 80% Attack
      //               xA (0.1), Creativity (0.1) -> 20% Creativity
      weights = [0.4, 0.4, 0.1, 0.1];
    }

    // Apply weights directly to vector components for weighted cosine similarity
    return rawVector.map((val, i) => val * weights[i]);
  };

  const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
  };

  const selectPlayer = (p: FPLPlayer) => {
    setSelectedPlayer(p);
    setSearchTerm('');
    setSearchResults([]);
    // Default max price to slightly less than selected player if not set
    if (maxPrice >= p.now_cost / 10) {
      setMaxPrice((p.now_cost / 10) - 0.1);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="animate-spin text-blue-500" size={32} />
        <p className="text-gray-500">Loading FPL Database...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Calculator className="text-blue-500" />
              Budget Alternative Finder
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Find cheaper players with similar underlying stats (xG, xA, ICT) using Cosine Similarity.
            </p>
            <div className="relative mt-2">
              <button 
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                <Info size={14} />
                How is similarity calculated?
              </button>
              
              {showTooltip && (
                <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-50 text-xs text-gray-600 dark:text-gray-300">
                  <h4 className="font-bold mb-2 text-gray-900 dark:text-white">Weighted Algorithm Dimensions</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-blue-500">MID/FWD:</span> 80% Attack (xG, Threat), 20% Creativity (xA, Key Passes)
                    </div>
                    <div>
                      <span className="font-bold text-green-500">DEF:</span> 60% Defense (xGC, Clean Sheets), 40% Attack (Threat, Progression)
                    </div>
                    <div>
                      <span className="font-bold text-orange-500">GK:</span> 70% Saves (Saves, xGA), 30% Stability (Clean Sheets)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Control Panel */}
        <div className="bg-white dark:bg-[#111] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 space-y-6">
          
          {/* Step 1: Search Template Player */}
          <div className="relative z-10">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              1. Select High-Price Player (Template)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search player (e.g. Salah, Haaland)..."
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={16} />
                </button>
              )}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => selectPlayer(p)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                        src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.photo.replace('.jpg', '.png')}`} 
                        onError={(e) => { e.currentTarget.src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'; }}
                        alt={p.web_name}
                        className="w-10 h-10 rounded-full object-cover bg-gray-100"
                      />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{p.web_name}</div>
                          <div className="text-xs text-gray-500">{teams[p.team]?.name} • {p.element_type === 1 ? 'GK' : p.element_type === 2 ? 'DEF' : p.element_type === 3 ? 'MID' : 'FWD'}</div>
                        </div>
                      </div>
                      <div className="font-bold text-blue-600">£{(p.now_cost / 10).toFixed(1)}m</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedPlayer && (
            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4">
              {/* Selected Player Card */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20 flex items-center gap-4">
                <img 
                  src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${selectedPlayer.photo.replace('.jpg', '.png')}`} 
                  onError={(e) => { e.currentTarget.src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'; }}
                  alt={selectedPlayer.web_name}
                  className="w-20 h-24 rounded-lg object-cover bg-white"
                />
                <div>
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Target</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPlayer.web_name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>£{(selectedPlayer.now_cost / 10).toFixed(1)}m</span>
                    <span>•</span>
                    <span>{getPer90(selectedPlayer.expected_goal_involvements, selectedPlayer.minutes).toFixed(2)} xGI/90</span>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Max Price: £{maxPrice.toFixed(1)}m</label>
                  </div>
                  <input 
                    type="range" 
                    min="4.0" 
                    max="14.0" 
                    step="0.1"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Min Minutes: {minMinutes}</label>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1000" 
                    step="90"
                    value={minMinutes}
                    onChange={(e) => setMinMinutes(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {selectedPlayer && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="text-green-500" />
                Best Alternatives
              </h2>
              <span className="text-sm text-gray-500">
                Found {results.length} matches
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((player, idx) => {
                const playerXGI = getPer90(player.expected_goal_involvements, player.minutes);
                const targetXGI = getPer90(selectedPlayer.expected_goal_involvements, selectedPlayer.minutes);
                const playerXG = getPer90(player.expected_goals, player.minutes);
                const targetXG = getPer90(selectedPlayer.expected_goals, selectedPlayer.minutes);
                const playerXA = getPer90(player.expected_assists, player.minutes);
                const targetXA = getPer90(selectedPlayer.expected_assists, selectedPlayer.minutes);
                
                return (
                  <div key={player.id} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-white/5 p-5 hover:shadow-xl hover:border-blue-500/30 transition-all group relative overflow-hidden">
                    {/* Rank Badge */}
                    <div className="absolute top-0 right-0 bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-bl-xl text-xs font-bold text-gray-500">
                      #{idx + 1}
                    </div>

                    {/* Header: Photo & Basic Info */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="relative">
                        <img 
                          src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo.replace('.jpg', '.png')}`} 
                          onError={(e) => { e.currentTarget.src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'; }}
                          alt={player.web_name}
                          className="w-14 h-14 rounded-full object-cover bg-gray-50 border-2 border-white dark:border-[#222] shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#222] rounded-full p-0.5">
                          {/* Could put team logo here if available, or just nothing */}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{player.web_name}</h3>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 font-medium">
                            {teams[player.team]?.short_name}
                          </span>
                          <span>•</span>
                          <span>{player.element_type === 1 ? 'GK' : player.element_type === 2 ? 'DEF' : player.element_type === 3 ? 'MID' : 'FWD'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score & Savings */}
                    <div className="flex items-end justify-between mb-6 pb-5 border-b border-gray-50 dark:border-white/5">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Similarity</div>
                        <div className="text-3xl font-black text-blue-600 dark:text-blue-500 leading-none">
                          {(player.similarity * 100).toFixed(0)}<span className="text-sm align-top ml-0.5 text-blue-400">%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Price</div>
                        <div className="font-bold text-gray-900 dark:text-white text-lg">£{(player.now_cost / 10).toFixed(1)}m</div>
                        <div className="text-xs font-bold text-green-500 mt-0.5 flex items-center justify-end gap-1">
                          <TrendingDown size={12} />
                          Save £{player.price_diff.toFixed(1)}m
                        </div>
                      </div>
                    </div>

                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      {/* xGI Comparison */}
                      <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                        <div className="text-[10px] text-gray-500 mb-1">xGI / 90</div>
                        <div className="flex items-end justify-between">
                          <span className="font-bold text-gray-900 dark:text-white text-base">
                            {playerXGI.toFixed(2)}
                          </span>
                          {playerXGI > targetXGI && (
                            <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded">
                              Better
                            </span>
                          )}
                        </div>
                        {/* Mini bar relative to target */}
                        <div className="mt-2 h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${playerXGI > targetXGI ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((playerXGI / (Math.max(targetXGI, 0.01) * 1.5)) * 100, 100)}%` }} 
                          />
                        </div>
                      </div>

                      {/* xG or xA based on position (Generic for now) */}
                      <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                        <div className="text-[10px] text-gray-500 mb-1">xG / 90</div>
                        <div className="flex items-end justify-between">
                          <span className="font-bold text-gray-900 dark:text-white text-base">
                            {playerXG.toFixed(2)}
                          </span>
                          {playerXG > targetXG && (
                            <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded">
                              Better
                            </span>
                          )}
                        </div>
                         <div className="mt-2 h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${playerXG > targetXG ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((playerXG / (Math.max(targetXG, 0.01) * 1.5)) * 100, 100)}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Secondary Stats Row */}
                    <div className="grid grid-cols-2 gap-4 px-1">
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">xA/90</span>
                          <span className={`font-medium ${playerXA > targetXA ? 'text-green-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            {playerXA.toFixed(2)}
                          </span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">ICT/90</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {getPer90(player.ict_index, player.minutes).toFixed(2)}
                          </span>
                       </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetAlternativeFinder;
