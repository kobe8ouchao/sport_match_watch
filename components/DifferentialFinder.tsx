import React, { useState, useEffect } from 'react';
import { Target, Filter, Info, AlertTriangle, TrendingUp, Search, Activity, CheckCircle2, XCircle, Play, HelpCircle, X } from 'lucide-react';

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
  expected_goals_per_90: string;
}

interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  strength: number;
}

interface FPLFixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  finished: boolean;
  kickoff_time: string;
}

interface HistoryEvent {
    element: number;
    fixture: number;
    opponent_team: number;
    total_points: number;
    was_home: boolean;
    kickoff_time: string;
    team_h_score: number;
    team_a_score: number;
    round: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    value: number;
    transfers_balance: number;
    selected: number;
    transfers_in: number;
    transfers_out: number;
    expected_goals: string;
    expected_assists: string;
    expected_goal_involvements: string;
    expected_goals_conceded: string;
}

interface AnalyzedPlayer extends FPLPlayer {
    teamName: string;
    position: string;
    nextFixtures: {
        opponent: string;
        difficulty: number;
        isHome: boolean;
    }[];
    avgDifficulty: number;
    xgDelta: number; // Sum of last 3 xG - (Goals * 1.5)
    last3xG: number;
    last3Goals: number;
    recommendationScore: number;
}

const STORAGE_KEY = 'differential-finder-state';

const DifferentialFinder: React.FC = () => {
    // Helper to get initial state from storage
    const getSavedState = <T,>(key: string, defaultValue: T): T => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed[key] !== undefined ? parsed[key] : defaultValue;
            }
        } catch (e) {
            console.error('Error reading from sessionStorage', e);
        }
        return defaultValue;
    };

    // Settings
    const [ownershipLimit, setOwnershipLimit] = useState<number>(() => getSavedState('ownershipLimit', 10));
    const [priceRange, setPriceRange] = useState<'budget' | 'mid' | 'premium'>(() => getSavedState('priceRange', 'mid'));
    const [riskProfile, setRiskProfile] = useState<'safe' | 'high_risk'>(() => getSavedState('riskProfile', 'safe'));
    
    // Data
    const [allPlayers, setAllPlayers] = useState<FPLPlayer[]>([]);
    const [teams, setTeams] = useState<Record<number, FPLTeam>>({});
    const [fixtures, setFixtures] = useState<FPLFixture[]>([]);
    const [currentGameweek, setCurrentGameweek] = useState<number>(1);
    
    // State
    const [loading, setLoading] = useState<boolean>(true);
    const [analyzing, setAnalyzing] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [results, setResults] = useState<AnalyzedPlayer[]>(() => getSavedState('results', []));
    const [error, setError] = useState<string | null>(null);
    const [showLogic, setShowLogic] = useState(false);

    // Save state changes
    useEffect(() => {
        const state = {
            ownershipLimit,
            priceRange,
            riskProfile,
            results
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [ownershipLimit, priceRange, riskProfile, results]);

    // Initial Data Fetch
    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Bootstrap Static
                const res = await fetch('/fpl-api/bootstrap-static/');
                if (!res.ok) throw new Error('Failed to fetch FPL data');
                const data = await res.json();
                
                setAllPlayers(data.elements);
                
                const teamMap: Record<number, FPLTeam> = {};
                data.teams.forEach((t: FPLTeam) => teamMap[t.id] = t);
                setTeams(teamMap);

                const currentEvent = data.events.find((e: any) => e.is_current) || data.events.find((e: any) => e.is_next);
                setCurrentGameweek(currentEvent ? currentEvent.id : 1);

                // 2. Fetch Fixtures
                const fixturesRes = await fetch('/fpl-api/fixtures/');
                if (!fixturesRes.ok) throw new Error('Failed to fetch fixtures');
                const fixturesData = await fixturesRes.json();
                setFixtures(fixturesData);

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load FPL data. Please try again later.');
                setLoading(false);
            }
        };

        // Only fetch if we haven't already (though we need players/fixtures anyway for analysis)
        // We always fetch base data because it's static-ish but needed for new analysis
        fetchBaseData();
    }, []);

    // Auto-run analysis on initial load if no results
    useEffect(() => {
        if (!loading && allPlayers.length > 0 && results.length === 0 && !analyzing && !error) {
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => {
                runAnalysis();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, allPlayers]); // eslint-disable-line react-hooks/exhaustive-deps

    // Analysis Logic
    const runAnalysis = async () => {
        setAnalyzing(true);
        // Do not clear results immediately to avoid flash if possible, but user wants to know it's running.
        // Clearing is better to show new results are coming.
        setResults([]);
        setProgress(0);
        setError(null);

        try {
            // Step 1: Base Filtering
            const candidates = allPlayers.filter(p => {
                const ownership = parseFloat(p.selected_by_percent);
                const price = p.now_cost / 10;
                
                // Ownership Filter
                if (ownership > ownershipLimit) return false;

                // Price Filter
                let priceMatch = false;
                if (priceRange === 'budget') priceMatch = price <= 6.0;
                else if (priceRange === 'mid') priceMatch = price > 6.0 && price <= 9.0;
                else priceMatch = price > 9.0;
                if (!priceMatch) return false;

                // Status Filter (Available only)
                if (p.status !== 'a' && p.status !== 'd') return false;

                // Risk Profile Filter (Heuristic)
                // Safe: Played > 60% of minutes (approx) or Form > 3.0
                // High Risk: Low minutes but high potential? Or just ignore minutes check
                if (riskProfile === 'safe') {
                    if (p.minutes < 400 && parseFloat(p.form) < 2.0) return false;
                }

                return true;
            });

            // Limit candidates to avoid API rate limits (e.g., top 50 by ICT Index or Form)
            const topCandidates = candidates
                .sort((a, b) => parseFloat(b.ict_index) - parseFloat(a.ict_index))
                .slice(0, 30);

            const analyzedResults: AnalyzedPlayer[] = [];
            let completed = 0;

            // Step 2 & 3: Deep Dive
            for (const player of topCandidates) {
                // Update Progress
                completed++;
                setProgress(Math.round((completed / topCandidates.length) * 100));

                try {
                    // Fetch History
                    const historyRes = await fetch(`/fpl-api/element-summary/${player.id}/`);
                    if (!historyRes.ok) continue;
                    const historyData = await historyRes.json();
                    const history: HistoryEvent[] = historyData.history;

                    // Get last 3 matches (that were actually played)
                    const playedMatches = history.filter(h => h.minutes > 0).slice(-3);
                    
                    if (playedMatches.length < 1) continue;

                    // Calculate xG Sum and Goals Sum
                    let xGSum = 0;
                    let goalsSum = 0;
                    playedMatches.forEach(m => {
                        xGSum += parseFloat(m.expected_goals);
                        goalsSum += m.goals_scored;
                    });

                    // Algorithm: xG_sum > Goals * 1.5 (Unlucky)
                    // If goals is 0, we check if xG > 0.3 (arbitrary threshold for "some threat")
                    const isUnlucky = goalsSum === 0 ? xGSum > 0.4 : xGSum > (goalsSum * 1.5);

                    if (!isUnlucky && riskProfile === 'safe') continue; // Skip if not "due" a goal (unless high risk mode maybe?)
                    
                    // Actually, let's keep them but give them a lower score if not meeting strict criteria, 
                    // but the prompt says "You are looking for..." so maybe filter strict.
                    // Let's stick to the prompt: "Filter logic: xG > Goals * 1.5"
                    if (!isUnlucky) continue;

                    // Step 3: Fixture Analysis
                    // Find next 3 fixtures
                    const playerTeam = teams[player.team];
                    const futureFixtures = fixtures
                        .filter(f => !f.finished && (f.team_h === player.team || f.team_a === player.team) && f.event >= currentGameweek)
                        .sort((a, b) => a.event - b.event)
                        .slice(0, 3);

                    if (futureFixtures.length === 0) continue;

                    const nextFixturesDetails = futureFixtures.map(f => {
                        const isHome = f.team_h === player.team;
                        const opponentId = isHome ? f.team_a : f.team_h;
                        const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty;
                        return {
                            opponent: teams[opponentId]?.short_name || 'UNK',
                            difficulty,
                            isHome
                        };
                    });

                    const avgDifficulty = nextFixturesDetails.reduce((acc, curr) => acc + curr.difficulty, 0) / nextFixturesDetails.length;

                    // Filter: if avg difficulty > 3.5, remove
                    if (avgDifficulty > 3.5) continue;

                    // Construct Result
                    analyzedResults.push({
                        ...player,
                        teamName: playerTeam?.short_name || '',
                        position: player.element_type === 1 ? 'GK' : player.element_type === 2 ? 'DEF' : player.element_type === 3 ? 'MID' : 'FWD',
                        nextFixtures: nextFixturesDetails,
                        avgDifficulty,
                        xgDelta: xGSum - goalsSum,
                        last3xG: xGSum,
                        last3Goals: goalsSum,
                        recommendationScore: xGSum - (avgDifficulty * 0.1) // Simple ranking score
                    });

                    // Add slight delay to be nice to API? (Browser limits parallel usually, serial loop is safe)
                    await new Promise(r => setTimeout(r, 50));

                } catch (e) {
                    console.error(`Error analyzing player ${player.web_name}`, e);
                }
            }

            setResults(analyzedResults.sort((a, b) => b.recommendationScore - a.recommendationScore));

        } catch (err) {
            console.error(err);
            setError('Analysis failed.');
        } finally {
            setAnalyzing(false);
        }
    };

    const getDifficultyColor = (difficulty: number) => {
        if (difficulty <= 2) return 'bg-green-500 text-white';
        if (difficulty === 3) return 'bg-gray-400 text-white'; // Grey for 3 is standard FPL style usually, or yellow? Let's use grey/neutral
        if (difficulty === 4) return 'bg-orange-500 text-white';
        return 'bg-red-600 text-white';
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6 relative">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Target className="text-teal-500" size={24} />
                    The Differential Finder
                </h1>
                <button 
                    onClick={() => setShowLogic(true)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                    title="How it works"
                >
                    <HelpCircle size={18} />
                </button>
            </div>

            {/* Logic Modal */}
            {showLogic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLogic(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-white/10 relative" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setShowLogic(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-teal-500" />
                            Algorithm Logic
                        </h3>
                        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <span className="font-bold block mb-1 text-gray-900 dark:text-white">Step 1: Base Filter</span>
                                Excludes players with ownership above your limit and prices outside your budget.
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <span className="font-bold block mb-1 text-gray-900 dark:text-white">Step 2: Underperformance (xG)</span>
                                Finds players who are "unlucky".
                                <div className="mt-1 font-mono text-xs bg-gray-200 dark:bg-black/50 p-1.5 rounded">
                                    Last 3 Games xG Sum &gt; Goals * 1.5
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <span className="font-bold block mb-1 text-gray-900 dark:text-white">Step 3: Fixture Difficulty</span>
                                Checks upcoming 3 matches.
                                <div className="mt-1 font-mono text-xs bg-gray-200 dark:bg-black/50 p-1.5 rounded">
                                    Avg Difficulty &lt; 3.5
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Control Panel */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/10 p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center">
                    
                    {/* Controls Group */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        
                        {/* Ownership Toggle - Compact */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Max Ownership</label>
                                <span className="text-teal-600 dark:text-teal-400 font-bold text-xs">{ownershipLimit}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" max="25" step="1"
                                value={ownershipLimit}
                                onChange={(e) => setOwnershipLimit(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500 block"
                            />
                        </div>

                        {/* Price Range - Compact Segmented Control */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Budget</label>
                            <div className="flex bg-gray-100 dark:bg-black/20 p-1 rounded-lg">
                                {[
                                    { id: 'budget', label: 'Cheap', desc: '<6.0' },
                                    { id: 'mid', label: 'Mid', desc: '6-9' },
                                    { id: 'premium', label: 'High', desc: '>9.0' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setPriceRange(opt.id as any)}
                                        className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all ${
                                            priceRange === opt.id 
                                            ? 'bg-teal-500 text-white shadow-md transform scale-[1.02]' 
                                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        {opt.label} <span className={`text-[9px] font-normal hidden xl:inline ${priceRange === opt.id ? 'text-teal-100 opacity-90' : 'opacity-60'}`}>({opt.desc})</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Risk Profile - Compact Segmented Control */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Risk Level</label>
                            <div className="flex bg-gray-100 dark:bg-black/20 p-1 rounded-lg">
                                <button
                                    onClick={() => setRiskProfile('safe')}
                                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                        riskProfile === 'safe'
                                        ? 'bg-blue-500 text-white shadow-md transform scale-[1.02]'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    Safe
                                </button>
                                <button
                                    onClick={() => setRiskProfile('high_risk')}
                                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                        riskProfile === 'high_risk'
                                        ? 'bg-purple-500 text-white shadow-md transform scale-[1.02]'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    Risky
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Action Button - Compact */}
                    <div className="w-full lg:w-auto min-w-[140px]">
                        <button
                            onClick={runAnalysis}
                            disabled={loading || analyzing}
                            className={`
                                w-full h-11 rounded-xl font-bold text-sm text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2
                                ${analyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500'}
                            `}
                        >
                            {analyzing ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Search size={16} />
                            )}
                            <span>{analyzing ? 'Scanning...' : 'Find Picks'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Analysis Progress - Main Display Area */}
            {analyzing && (
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/10 p-8 shadow-sm flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
                     <div className="relative w-20 h-20 mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-gray-200 dark:text-gray-700"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={36 * 2 * Math.PI}
                                strokeDashoffset={36 * 2 * Math.PI - (progress / 100) * (36 * 2 * Math.PI)}
                                className="text-teal-500 transition-all duration-300 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-teal-600 dark:text-teal-400">
                            {progress}%
                        </div>
                     </div>
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Analyzing Player Data</h3>
                     <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                        Scanning recent form, xG performance, and upcoming fixture difficulties to find the best differential picks for you.
                     </p>
                </div>
            )}

            {/* Results Section */}
            {results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((player) => (
                        <div key={player.id} className="group relative bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                             <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                             
                             <div className="relative z-10">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img 
                                                src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo.replace('.jpg', '.png')}`} 
                                                alt={player.web_name}
                                                className="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-white/10"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/p232323.png' }} // Fallback
                                            />
                                            <div className="absolute -bottom-1.5 -right-1.5 bg-white dark:bg-zinc-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-white/10 shadow-sm">
                                                {player.position}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{player.web_name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{player.teamName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-teal-600 dark:text-teal-400">£{(player.now_cost / 10).toFixed(1)}</div>
                                        <div className="text-[10px] text-gray-400">{player.selected_by_percent}% owned</div>
                                    </div>
                                </div>

                                {/* Key Stats */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-2 text-center">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">xG Delta</div>
                                        <div className="font-bold text-green-500">+{player.xgDelta.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-2 text-center">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Form</div>
                                        <div className="font-bold text-gray-700 dark:text-gray-300">{player.form}</div>
                                    </div>
                                </div>

                                {/* Fixtures */}
                                <div>
                                    <div className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Upcoming</div>
                                    <div className="flex gap-1">
                                        {player.nextFixtures.map((f, i) => (
                                            <div key={i} className={`flex-1 ${getDifficultyColor(f.difficulty)} rounded-md p-1 text-center`}>
                                                <div className="text-[10px] font-bold truncate">{f.opponent}</div>
                                                <div className="text-[9px] opacity-80">{f.isHome ? '(H)' : '(A)'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DifferentialFinder;