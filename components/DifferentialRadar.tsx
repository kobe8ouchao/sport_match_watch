import React, { useState, useEffect, useMemo } from 'react';
import { Target, Radar, Crosshair, Zap, Activity, TrendingUp, Info, Shield, Award, X, Sparkles, AlertTriangle } from 'lucide-react';
import { error } from 'console';


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
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  ep_next: string;
  ep_this: string;
  points_per_game: string;
  total_points: number;
  creativity: string;
  threat: string;
}

interface AnalyzedPlayer extends FPLPlayer {
    teamName: string;
    position: string;
    diffScore: number;
    tags: string[];
    xgiSlope: 'up' | 'down' | 'flat';
    recentMinutes: number; // Last 3 games
    comparisonPlayer?: FPLPlayer; // The template player to compare against
    nextFixtures: { opponent: string; difficulty: number; isHome: boolean }[];
    category: 'comeback' | 'new' | 'gem' | 'normal';
    reasoning: string;
}

const DifferentialRadar: React.FC = () => {
    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [results, setResults] = useState<AnalyzedPlayer[]>([]);
    const [scanStage, setScanStage] = useState<string>('');
    const [showLogic, setShowLogic] = useState(false);
    const [ownershipCap, setOwnershipCap] = useState(5.0);
    const [activeTab, setActiveTab] = useState<'all' | 'comeback' | 'new' | 'gem'>('all');

    // Data Cache - Lifted to module scope or use ref if we want to persist across re-renders but not page refreshes.
    // Ideally use a global store, but for now we can check if results exist.
    // Actually, React Router keeps state if we don't unmount? No, it unmounts.
    // Let's use sessionStorage to persist results across navigation.
    const [allPlayers, setAllPlayers] = useState<FPLPlayer[]>([]);
    const [teams, setTeams] = useState<Record<number, any>>({});
    
    // Constants
    const MIN_MINUTES_LAST_3 = 180;

    useEffect(() => {
        // Load cached results
        const cachedResults = sessionStorage.getItem('radar_results');
        const cachedOwnership = sessionStorage.getItem('radar_ownership_cap');
        
        if (cachedResults) {
            setResults(JSON.parse(cachedResults));
            // If we have results, we don't need to auto-scan
        }
        
        if (cachedOwnership) {
            setOwnershipCap(parseFloat(cachedOwnership));
        }

        fetchBaseData();
    }, []);

    // Save settings when changed
    useEffect(() => {
        sessionStorage.setItem('radar_ownership_cap', ownershipCap.toString());
    }, [ownershipCap]);

    const fetchBaseData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/fpl-api/bootstrap-static/');
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            
            const data = await res.json();
            
            if (!data.elements || !Array.isArray(data.elements)) {
                throw new Error('Invalid Data Format');
            }
            
            setAllPlayers(data.elements);
            const teamMap: Record<number, any> = {};
            if (data.teams) {
                data.teams.forEach((t: any) => teamMap[t.id] = t);
            }
            setTeams(teamMap);
            
            setLoading(false);
            
            // Only auto-start if no results and no cache
            if (!sessionStorage.getItem('radar_results')) {
               // startRadarScan(data.elements, teamMap); // Disabled auto-scan per user request
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to load data');
            setLoading(false);
        }
    };

    const startRadarScan = async (players: FPLPlayer[], teamMap: Record<number, any>) => {
        try {
            setScanning(true);
            setError(null);
            setResults([]);
            setScanProgress(0);
            sessionStorage.removeItem('radar_results'); // Clear cache on new scan

            // Step 1: Initial Filtering (The Broad Sweep)
            setScanStage(`Filtering candidates (< ${ownershipCap}% owned)...`);
            await new Promise(r => setTimeout(r, 800)); // Visual delay
            setScanProgress(20);

            const candidates = players.filter(p => {
                if (!p) return false;
                const ownership = parseFloat(p.selected_by_percent);
                const isAvailable = p.status === 'a';
                
                // Allow 0 minutes for "New Arrivals" (High Cost) or "Comeback"
                // So we don't strictly filter by activity here, but by potential
                const isHighPotentialNew = p.minutes === 0 && p.now_cost > 50; // > 5.0m
                
                // Basic activity filter: Must be active OR be a high potential new player
                const hasActivity = parseFloat(p.ict_index) > 15 || isHighPotentialNew;

                return ownership < ownershipCap && isAvailable && hasActivity;
            });

            // Sort by Potential to prioritize who to scan deep
            // We mix ICT Index (proven activity) with Price (potential for new players)
            const topCandidates = candidates.sort((a, b) => {
                // Give new players a synthetic score based on price
                const scoreA = a.minutes === 0 ? (a.now_cost * 1.5) : parseFloat(a.ict_index);
                const scoreB = b.minutes === 0 ? (b.now_cost * 1.5) : parseFloat(b.ict_index);
                return scoreB - scoreA;
            }).slice(0, 60); // Scan top 60 to cast a wider net

            if (topCandidates.length === 0) {
                setScanning(false);
                return;
            }

            // Find Template Players for Comparison (High ownership, same position, similar price range)
            const templatePlayers = players.filter(p => parseFloat(p.selected_by_percent) > 15);

            // Step 2: Deep Dive (Recursive Fetching)
            setScanStage('Analyzing xGI Slope & Recovery Factors...');
            const finalPicks: AnalyzedPlayer[] = [];
            
            const BATCH_SIZE = 5;
            for (let i = 0; i < topCandidates.length; i += BATCH_SIZE) {
                const batch = topCandidates.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(async (p) => {
                    try {
                        const res = await fetch(`/fpl-api/element-summary/${p.id}/`);
                        if (!res.ok) return null;
                        const summary = await res.json();
                        const history = summary.history; // Past matches
                        const fixtures = summary.fixtures; // Future matches

                        // Check Recent Minutes (Last 3 GWs)
                        const last3 = history.slice(-3);
                        const recentMinutes = last3.reduce((sum: number, m: any) => sum + m.minutes, 0);

                        // --- NEW LOGIC: Factor Detection ---
                        
                        // 1. The Recovery Boost (伤愈复出因子)
                        // Logic: Status 'a', Recent Minutes < 120 (easing in), High Value (>6.0m OR >50 pts history)
                        const isComeback = p.status === 'a' && 
                                           (recentMinutes < 120) && 
                                           (p.total_points > 50 || p.now_cost > 60 );
                        
                        // 2. The Fresh Blood Factor (新援首秀因子)
                        // Logic: 0 Total Minutes (Season), Status 'a', Cost > 5.0m
                        const isNew = p.minutes === 0 && p.status === 'a' && p.now_cost > 50;

                        // Filter: Must have minutes OR be a special category
                        if (recentMinutes < MIN_MINUTES_LAST_3 && !isComeback && !isNew) return null;

                        // Calculate xGI Slope
                        const xgis = last3.map((m: any) => parseFloat(m.expected_goal_involvements));
                        let slope: 'up' | 'down' | 'flat' = 'flat';
                        if (xgis.length >= 2) {
                            const latest = xgis[xgis.length - 1];
                            const prev = xgis[xgis.length - 2];
                            if (latest > prev * 1.2) slope = 'up';
                            else if (latest < prev * 0.8) slope = 'down';
                        }

                        // Calculate Differential Score
                        const epNext = parseFloat(p.ep_next) || 0;
                        const expPoints3 = epNext * 3; // Rough projection
                        const ownership = parseFloat(p.selected_by_percent);
                        const safeOwnership = ownership < 0.1 ? 0.1 : ownership;
                        
                        let baseScore = (expPoints3 / safeOwnership) * 10;
                        
                        // Apply Multipliers
                        let multiplier = 1.0;
                        let category: AnalyzedPlayer['category'] = 'normal';
                        let reasoning = '';
                        const tags: string[] = [];

                        if (isComeback) {
                            multiplier = 1.5; // 1.5x Boost
                            category = 'comeback';
                            tags.push("Recovery Boost 🩹");
                            reasoning = "High-value asset returning to fitness. Low ownership window.";
                            baseScore += 20; // Flat bonus to ensure visibility
                        } else if (isNew) {
                            multiplier = 1.2; // 1.2x Boost
                            category = 'new';
                            tags.push("Fresh Blood 🩸");
                            reasoning = "New signing/debut potential. High risk, high reward.";
                            baseScore += 15; // Flat bonus
                        } else {
                            // Standard Gem Logic
                            if (baseScore > 50) category = 'gem';
                            reasoning = `Strong xGI trends with low ownership (${ownership}%).`;
                        }

                        const diffScore = baseScore * multiplier;

                        // Additional Tags
                        const totalThreat = last3.reduce((s: number, m: any) => s + parseFloat(m.threat), 0);
                        const totalCreativity = last3.reduce((s: number, m: any) => s + parseFloat(m.creativity), 0);
                        const totalGoals = last3.reduce((s: number, m: any) => s + m.goals_scored, 0);

                        if (totalThreat > 100 && totalGoals === 0) tags.push("The Sniper 🎯");
                        if (totalCreativity > 80 && parseFloat(p.expected_assists) > 0.5) tags.push("The Engine 🅰️");
                        if (p.element_type === 2 && (totalThreat > 50 || parseFloat(p.expected_goals) > 0.3)) tags.push("OOP Potential 🚀");

                        // Find Comparison Player
                        const comparison = templatePlayers.find(tp => 
                            tp.element_type === p.element_type && 
                            Math.abs(tp.now_cost - p.now_cost) <= 10 
                        );

                        // Next Fixtures
                        const next3Fixtures = fixtures.slice(0, 3).map((f: any) => ({
                            opponent: f.is_home ? teamMap[f.team_a]?.short_name : teamMap[f.team_h]?.short_name,
                            difficulty: f.difficulty,
                            isHome: f.is_home
                        }));

                        return {
                            ...p,
                            teamName: teamMap[p.team].name,
                            position: p.element_type === 1 ? 'GK' : p.element_type === 2 ? 'DEF' : p.element_type === 3 ? 'MID' : 'FWD',
                            diffScore,
                            tags,
                            xgiSlope: slope,
                            recentMinutes,
                            comparisonPlayer: comparison,
                            nextFixtures: next3Fixtures,
                            category,
                            reasoning
                        } as AnalyzedPlayer;

                    } catch (e) {
                        return null;
                    }
                });

                const processedBatch = (await Promise.all(batchPromises)).filter(Boolean) as AnalyzedPlayer[];
                finalPicks.push(...processedBatch);
                
                // Update progress
                const currentProgress = 20 + ((i + BATCH_SIZE) / topCandidates.length) * 80;
                setScanProgress(Math.min(currentProgress, 95));
            }

            // Sort by Differential Score
            const sortedPicks = finalPicks.sort((a, b) => b.diffScore - a.diffScore);
            
            setResults(sortedPicks);
            setScanProgress(100);
            setScanStage('Scan Complete');
            
            // Cache results
            sessionStorage.setItem('radar_results', JSON.stringify(sortedPicks));
            
            setTimeout(() => setScanning(false), 500);
        } catch (err: any) {
            console.error("Scan Error:", err);
            setError(err.message || "Scan failed unexpectedly");
            setScanning(false);
        }
    };

    const getDifficultyColor = (difficulty: number) => {
        if (difficulty <= 2) return 'bg-green-500 text-white';
        if (difficulty === 3) return 'bg-gray-400 text-white';
        if (difficulty === 4) return 'bg-orange-500 text-white';
        return 'bg-red-600 text-white';
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl p-6 border border-white/20 dark:border-white/5 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Radar className={`text-teal-500 ${scanning ? 'animate-spin-slow' : ''}`} size={32} />
                            Differential Radar
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                             <p className="text-gray-500 dark:text-gray-400 max-w-xl text-sm">
                                Identify high-potential players with low ownership.
                            </p>
                            <button 
                                onClick={() => setShowLogic(true)}
                                className="text-teal-600 dark:text-teal-400 text-xs font-bold hover:underline flex items-center gap-1"
                            >
                                <Info size={12} /> How it works
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                        {/* Ownership Control */}
                        <div className="flex items-center gap-3 bg-white dark:bg-black/20 px-4 py-2 rounded-full border border-gray-100 dark:border-white/10">
                            <span className="text-xs font-bold text-gray-500 uppercase">Max Ownership</span>
                            <input 
                                type="range" 
                                min="1" 
                                max="20" 
                                step="0.5" 
                                value={ownershipCap}
                                onChange={(e) => setOwnershipCap(parseFloat(e.target.value))}
                                className="w-24 accent-teal-500 cursor-pointer"
                                disabled={scanning}
                            />
                            <span className="text-sm font-bold text-teal-600 dark:text-teal-400 w-12 text-right">{ownershipCap}%</span>
                        </div>

                        <button 
                            onClick={() => !scanning && startRadarScan(allPlayers, teams)}
                            disabled={loading || scanning}
                            className={`
                                group relative px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all w-full sm:w-auto text-center
                                ${scanning ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:scale-105 active:scale-95 hover:shadow-teal-500/30'}
                            `}
                        >
                            {scanning ? 'Scanning...' : 'Run Scan'}
                            {!scanning && <Zap size={18} className="inline ml-2 group-hover:text-yellow-300 transition-colors" />}
                        </button>
                    </div>
                </div>

                {/* Scan Progress Bar */}
                {scanning && (
                    <div className="mt-8">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                            <span>{scanStage}</span>
                            <span>{Math.round(scanProgress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-300 ease-out"
                                style={{ width: `${scanProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Logic Modal */}
            {showLogic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLogic(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-gray-100 dark:border-white/10 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        
                        <button 
                            onClick={() => setShowLogic(false)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black flex items-center gap-3 mb-2 text-gray-900 dark:text-white">
                                <Activity className="text-teal-500" />
                                The Radar Algorithm
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                How we find hidden gems before they become popular.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">1. The Filter</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        We first eliminate noise by filtering for players with <strong>&lt; {ownershipCap}% ownership</strong> who are active starters (played &gt; 180 mins in last 3 games).
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">2. The Trigger (xGI Slope)</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        We analyze the "Slope" of their Expected Goal Involvement (xGI) over the last 3 matches. A positive slope (↗️) indicates form is heating up.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">3. Differential Score</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-mono bg-gray-50 dark:bg-black/20 p-2 rounded-lg mt-1 border border-gray-100 dark:border-white/5">
                                        Score = (Proj. Points Next 3 GWs) / Ownership %
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        This proprietary formula highlights players who offer the highest potential reward relative to their rarity.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex justify-end">
                            <button 
                                onClick={() => setShowLogic(false)}
                                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-full hover:opacity-90 transition-opacity"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                    <AlertTriangle className="text-red-500" />
                    <div className="flex-1">
                        <p className="text-red-700 dark:text-red-300 font-bold">Data Load Error</p>
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                    <button 
                        onClick={fetchBaseData}
                        className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg text-sm font-bold hover:bg-red-200 dark:hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Results Grid */}
            {!scanning && results.length > 0 && (
                <>
                    {/* Category Tabs */}
                    <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2">
                        {[
                            { id: 'all', label: 'All Picks', icon: Zap },
                            { id: 'comeback', label: 'Recovery Boost', icon: Shield },
                            { id: 'new', label: 'Fresh Blood', icon: Sparkles },
                            { id: 'gem', label: 'Hidden Gems', icon: Target },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap
                                    ${activeTab === tab.id 
                                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' 
                                        : 'bg-white dark:bg-zinc-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-700'}
                                `}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {results
                            .filter(p => activeTab === 'all' || p.category === activeTab)
                            .map((player, idx) => (
                            <div 
                                key={player.id} 
                                className="group relative bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                                style={{
                                    animation: `fadeInUp 0.6s ease-out forwards ${idx * 0.1}s`,
                                    opacity: 0 // Start hidden for animation
                                }}
                            >
                                {/* Card Glow Effect */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br 
                                    ${player.category === 'comeback' ? 'from-blue-500/5 via-transparent to-purple-500/5' : 
                                      player.category === 'new' ? 'from-red-500/5 via-transparent to-orange-500/5' : 
                                      'from-teal-500/5 via-transparent to-blue-500/5'}`} 
                                />
                                
                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Reasoning Header */}
                                    {player.reasoning && (
                                        <div className="mb-4 bg-gray-50 dark:bg-white/5 p-3 rounded-xl text-xs text-gray-600 dark:text-gray-300 italic border-l-2 border-teal-500">
                                            "{player.reasoning}"
                                        </div>
                                    )}

                                    {/* Header: Name & Team */}
                                    <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm">
                                                <img 
                                                    src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}
                                                    alt={player.web_name}
                                                    className="w-full h-full object-cover transform scale-110 pt-1"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
                                                    }}
                                                />
                                            </div>
                                            {/* Team Badge */}
                                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-800 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-gray-100 dark:border-white/10">
                                                {player.teamName}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{player.web_name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="font-mono bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{player.position}</span>
                                                <span className="text-teal-600 dark:text-teal-400 font-bold">£{(player.now_cost / 10).toFixed(1)}</span>
                                                <span>•</span>
                                                <span>{player.selected_by_percent}% TSB</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Differential Score Badge */}
                                    <div className="flex flex-col items-end">
                                        <div className="bg-gradient-to-br from-teal-500 to-blue-600 text-white px-3 py-1 rounded-xl shadow-lg shadow-teal-500/20">
                                            <span className="text-[10px] font-bold uppercase tracking-wider block text-teal-100 text-center">Score</span>
                                            <span className="text-xl font-black">{player.diffScore.toFixed(0)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                {player.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {player.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs font-bold border border-yellow-200 dark:border-yellow-500/20">
                                                {tag}
                                            </span>
                                        ))}
                                        {player.xgiSlope === 'up' && (
                                            <span className="px-2 py-1 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-500/20 flex items-center gap-1">
                                                <TrendingUp size={12} /> xGI Rising
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Comparison Bar */}
                                {player.comparisonPlayer && (
                                    <div className="mb-5 bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="text-xs text-gray-500">vs {player.comparisonPlayer.web_name} ({player.comparisonPlayer.selected_by_percent}%)</div>
                                            <div className="text-xs font-bold text-teal-600 dark:text-teal-400">xGI Comparison</div>
                                        </div>
                                        
                                        {/* Bars */}
                                        <div className="space-y-2">
                                            {/* Differential Player */}
                                            <div className="relative h-6 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                <div className="absolute inset-0 flex items-center px-3 justify-between z-10 text-[10px] font-bold text-white mix-blend-difference">
                                                    <span>{player.web_name}</span>
                                                    <span>{player.expected_goal_involvements}</span>
                                                </div>
                                                <div 
                                                    className="h-full bg-teal-500" 
                                                    style={{ width: `${Math.min((parseFloat(player.expected_goal_involvements) / (parseFloat(player.comparisonPlayer.expected_goal_involvements) + parseFloat(player.expected_goal_involvements))) * 100, 100)}%` }}
                                                />
                                            </div>
                                            
                                            {/* Template Player */}
                                            <div className="relative h-6 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden opacity-60">
                                                <div className="absolute inset-0 flex items-center px-3 justify-between z-10 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                    <span>{player.comparisonPlayer.web_name}</span>
                                                    <span>{player.comparisonPlayer.expected_goal_involvements}</span>
                                                </div>
                                                <div 
                                                    className="h-full bg-gray-500 dark:bg-gray-400" 
                                                    style={{ width: `${Math.min((parseFloat(player.comparisonPlayer.expected_goal_involvements) / (parseFloat(player.comparisonPlayer.expected_goal_involvements) + parseFloat(player.expected_goal_involvements))) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Fixtures */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Next 3 Opponents</div>
                                        <div className="text-[10px] text-gray-400">{player.recentMinutes} mins last 3</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {player.nextFixtures.map((f, i) => (
                                            <div key={i} className={`${getDifficultyColor(f.difficulty)} rounded-lg p-2 text-center shadow-sm`}>
                                                <div className="text-xs font-black truncate">{f.opponent}</div>
                                                <div className="text-[10px] opacity-80">{f.isHome ? '(H)' : '(A)'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                </>
            )}
            
            {/* Empty State / Intro */}
            {!scanning && results.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Crosshair className="text-gray-400" size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Scan</h3>
                    <p className="text-gray-500 max-w-md">
                        Click "Run Scan" to analyze the database for players with high potential and low ownership.
                    </p>
                </div>
            )}
            
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default DifferentialRadar;
