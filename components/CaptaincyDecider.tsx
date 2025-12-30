import React, { useState, useEffect } from 'react';
import { Shield, Sword, Sparkles, TrendingUp, AlertTriangle, ArrowRight, BarChart2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FPLPlayer {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  selected_by_percent: string;
  form: string;
  points_per_game: string;
  status: string;
  photo: string;
  minutes: number;
  total_points: number;
  ep_next: string;
}

interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
}

interface FPLEvent {
  id: number;
  name: string;
  is_current: boolean;
  is_next: boolean;
}

interface FPLFixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string;
}

interface PlayerHistory {
  fixture: number;
  opponent_team: number;
  total_points: number;
  was_home: boolean;
  expected_goal_involvements: string;
  round: number;
}

interface OpponentInfo {
  name: string;
  difficulty: number;
  isHome: boolean;
}

interface CandidateScore {
  player: FPLPlayer;
  score: number;
  breakdown: {
    scoringPotential: number; // 60%
    opponentWeakness: number; // 30%
    homeFactor: number;       // 10%
  };
  details: {
    last3xGI: number;
    seasonPPG: number;
    opponents: OpponentInfo[];
  };
}

const CaptaincyDecider: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<CandidateScore[]>([]);
  const [nextEvent, setNextEvent] = useState<FPLEvent | null>(null);
  const [shieldPick, setShieldPick] = useState<CandidateScore | null>(null);
  const [swordPick, setSwordPick] = useState<CandidateScore | null>(null);
  const [wildcardPick, setWildcardPick] = useState<CandidateScore | null>(null);
  const [teams, setTeams] = useState<Record<number, FPLTeam>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Static Data
      const res = await fetch('/fpl-api/bootstrap-static/');
      const data = await res.json();
      
      const events: FPLEvent[] = data.events;
      const nextGw = events.find(e => e.is_next);
      setNextEvent(nextGw || null);

      const teamMap: Record<number, FPLTeam> = {};
      data.teams.forEach((t: FPLTeam) => teamMap[t.id] = t);
      setTeams(teamMap);

      if (!nextGw) {
        setLoading(false);
        return;
      }

      // 2. Fetch Fixtures for Next GW
      const fixturesRes = await fetch(`/fpl-api/fixtures/?event=${nextGw.id}`);
      const fixtures: FPLFixture[] = await fixturesRes.json();
      
      // Map team ID to their next fixture info (Support Multiple Fixtures/DGW)
      const teamFixtureMap: Record<number, { opponent: number; isHome: boolean; difficulty: number }[]> = {};
      fixtures.forEach(f => {
        if (!teamFixtureMap[f.team_h]) teamFixtureMap[f.team_h] = [];
        teamFixtureMap[f.team_h].push({ opponent: f.team_a, isHome: true, difficulty: f.team_h_difficulty });
        
        if (!teamFixtureMap[f.team_a]) teamFixtureMap[f.team_a] = [];
        teamFixtureMap[f.team_a].push({ opponent: f.team_h, isHome: false, difficulty: f.team_a_difficulty });
      });

      // 3. Filter Initial Candidates (Top 30 by projected points ep_next to save API calls)
      // Only available players, not injured
      const allPlayers: FPLPlayer[] = data.elements;
      const initialCandidates = allPlayers
        .filter(p => p.status === 'a' && parseFloat(p.ep_next) > 3.0) // Filter active players with decent projection
        .sort((a, b) => parseFloat(b.ep_next) - parseFloat(a.ep_next))
        .slice(0, 30);

      // 4. Fetch Detailed History for Candidates (in parallel)
      const scoredCandidates: CandidateScore[] = await Promise.all(initialCandidates.map(async (p) => {
        // Fetch history
        const historyRes = await fetch(`/fpl-api/element-summary/${p.id}/`);
        const historyData = await historyRes.json();
        const history: PlayerHistory[] = historyData.history;

        // Get last 3 games
        // Sort by round desc just in case
        const last3 = history.slice(-3);
        const last3xGI = last3.reduce((acc, match) => acc + parseFloat(match.expected_goal_involvements), 0);
        
        const seasonPPG = parseFloat(p.points_per_game);

        // Opponent Info & Scoring
        const playerFixtures = teamFixtureMap[p.team] || [];
        const opponents: OpponentInfo[] = [];
        let totalScore = 0;
        
        // Base Potential Score (Player Intrinsic)
        // Normalize xGI (Top tier ~ 3.0 for 3 games) -> 0-1
        // Normalize PPG (Top tier ~ 8.0) -> 0-1
        const normXGI = Math.min(last3xGI / 3.0, 1); 
        const normPPG = Math.min(seasonPPG / 9.0, 1);
        const scorePotential = (normXGI * 0.7 + normPPG * 0.3) * 100;

        let totalOpponentScore = 0;
        let totalHomeScore = 0;

        if (playerFixtures.length > 0) {
          playerFixtures.forEach(fix => {
            const opponentTeam = teamMap[fix.opponent];
            
            // Record opponent info
            opponents.push({
              name: opponentTeam?.name || 'Unknown',
              difficulty: fix.difficulty,
              isHome: fix.isHome
            });

            // --- SCORING LOGIC PER MATCH ---

            // 2. Opponent Weakness (30%)
            let fdrScore = 0;
            if (fix.difficulty <= 2) fdrScore = 1;
            else if (fix.difficulty === 3) fdrScore = 0.5;
            else fdrScore = 0.2;

            // Boost if opponent concedes a lot
            const oppDefStrength = fix.isHome ? opponentTeam?.strength_defence_away : opponentTeam?.strength_defence_home;
            const defScore = oppDefStrength ? (1500 - oppDefStrength) / 500 : 0.5; 
            
            const scoreOpponent = ((fdrScore * 0.6) + (defScore * 0.4)) * 100;

            // 3. Home Factor (10%)
            const scoreHome = fix.isHome ? 100 : 0;

            // Weighted Match Score
            const matchScore = (scorePotential * 0.6) + (scoreOpponent * 0.3) + (scoreHome * 0.1);
            
            totalScore += matchScore;
            totalOpponentScore += scoreOpponent;
            totalHomeScore += scoreHome;
          });
        } else {
           // Blank Gameweek - minimal score
           totalScore = 0;
        }
        
        // Average the component scores for breakdown display (approximate)
        const avgOpponentScore = playerFixtures.length > 0 ? totalOpponentScore / playerFixtures.length : 0;
        const avgHomeScore = playerFixtures.length > 0 ? totalHomeScore / playerFixtures.length : 0;

        return {
          player: p,
          score: totalScore, // Total Score accumulates for DGW
          breakdown: {
            scoringPotential: scorePotential,
            opponentWeakness: avgOpponentScore,
            homeFactor: avgHomeScore
          },
          details: {
            last3xGI,
            seasonPPG,
            opponents
          }
        };
      }));

      // Sort by Total Score
      scoredCandidates.sort((a, b) => b.score - a.score);
      setCandidates(scoredCandidates);

      // --- PICK SELECTION ---
      
      // 1. The Shield: Highest ownership among top 10 candidates (or just top candidate if gap is huge)
      // Usually the highest owned player in the game is the shield.
      // Let's find the highest ownership player in our top 15 results.
      const top15 = scoredCandidates.slice(0, 15);
      const shield = [...top15].sort((a, b) => parseFloat(b.player.selected_by_percent) - parseFloat(a.player.selected_by_percent))[0];
      setShieldPick(shield);

      // 2. The Sword: Best Score but ownership < 40% (or significantly lower than Shield)
      // If Shield is top score, find next best score with reasonable ownership.
      const sword = scoredCandidates.find(c => 
        c.player.id !== shield?.player.id && 
        parseFloat(c.player.selected_by_percent) < 40 &&
        parseFloat(c.player.selected_by_percent) > 5
      );
      setSwordPick(sword || scoredCandidates[1]);

      // 3. The Wildcard: Score in top half, Ownership < 5%
      const wildcard = scoredCandidates.find(c => 
        parseFloat(c.player.selected_by_percent) < 5
      );
      setWildcardPick(wildcard || scoredCandidates[scoredCandidates.length - 1]);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getDifficultyColor = (diff: number) => {
    if (diff <= 2) return 'bg-green-500';
    if (diff === 3) return 'bg-gray-400';
    if (diff === 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const CandidateCard = ({ type, data }: { type: 'shield' | 'sword' | 'wildcard', data: CandidateScore }) => {
    if (!data) return null;

    const config = {
      shield: {
        icon: Shield,
        title: "The Shield",
        desc: "High ownership, safe rank protector.",
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800"
      },
      sword: {
        icon: Sword,
        title: "The Sword",
        desc: "High potential, differential opportunity.",
        color: "text-purple-600",
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-200 dark:border-purple-800"
      },
      wildcard: {
        icon: Sparkles,
        title: "The Wildcard",
        desc: "Low ownership, massive upside risk.",
        color: "text-orange-500",
        bg: "bg-orange-50 dark:bg-orange-900/20",
        border: "border-orange-200 dark:border-orange-800"
      }
    };

    const C = config[type];
    const Icon = C.icon;

    return (
      <div className={`relative overflow-hidden rounded-2xl border-2 ${C.border} ${C.bg} p-6 transition-all hover:scale-[1.02] hover:shadow-lg`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Icon size={120} className={C.color} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={C.color} size={24} />
            <h3 className={`text-xl font-black uppercase tracking-wider ${C.color}`}>{C.title}</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{C.desc}</p>

          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <img 
                src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${data.player.photo.replace('.jpg', '.png')}`} 
                onError={(e) => { e.currentTarget.src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'; }}
                alt={data.player.web_name}
                className={`w-24 h-24 rounded-full object-cover border-4 ${type === 'shield' ? 'border-blue-500' : type === 'sword' ? 'border-purple-500' : 'border-orange-500'} shadow-md bg-white`}
              />
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 text-xs font-bold px-2 py-1 rounded-full shadow border border-gray-100">
                {teams[data.player.team]?.short_name}
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-none mb-1">{data.player.web_name}</h2>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                <span>£{(data.player.now_cost / 10).toFixed(1)}m</span>
                <span className="flex items-center gap-1">
                   <TrendingUp size={14} />
                   {data.player.selected_by_percent}% Owned
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
             <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
               <div className="text-xs text-gray-500 mb-1">Projected Score</div>
               <div className="text-2xl font-black text-gray-900 dark:text-white">
                 {data.score.toFixed(0)}<span className="text-xs font-normal text-gray-400">/100</span>
               </div>
             </div>
             <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
               <div className="text-xs text-gray-500 mb-1">Opponent{data.details.opponents.length > 1 ? 's' : ''}</div>
               <div className="flex flex-col gap-1">
                 {data.details.opponents.map((opp, idx) => (
                   <div key={idx} className="flex items-center gap-2">
                     <span className="font-bold text-gray-900 dark:text-white truncate max-w-[80px] text-xs">{opp.name}</span>
                     <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${getDifficultyColor(opp.difficulty)}`}>
                       {opp.difficulty}
                     </span>
                     <span className="text-[10px] text-gray-500">{opp.isHome ? '(H)' : '(A)'}</span>
                   </div>
                 ))}
               </div>
             </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
               <span>Scoring Potential (Last 3 xGI + PPG)</span>
               <span className="font-bold">{data.breakdown.scoringPotential.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full ${type === 'shield' ? 'bg-blue-500' : type === 'sword' ? 'bg-purple-500' : 'bg-orange-500'}`} style={{ width: `${data.breakdown.scoringPotential}%` }} />
            </div>

            <div className="flex justify-between text-xs text-gray-500 pt-1">
               <span>Fixture Favorability</span>
               <span className="font-bold">{data.breakdown.opponentWeakness.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full ${type === 'shield' ? 'bg-blue-500' : type === 'sword' ? 'bg-purple-500' : 'bg-orange-500'}`} style={{ width: `${data.breakdown.opponentWeakness}%` }} />
            </div>
          </div>
          
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <RefreshCw className="animate-spin text-blue-500" size={32} />
      <p className="text-gray-500 font-medium">Analyzing Captaincy Options...</p>
      <p className="text-xs text-gray-400">Processing recent form, xGI, and fixture difficulty</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Shield className="text-yellow-500 fill-yellow-500" />
              Captaincy Decider
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              AI-driven captain picks based on xP, opponent weakness, and home advantage.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Upcoming Gameweek</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{nextEvent?.name || 'Next GW'}</div>
          </div>
        </div>

        {/* Main Picks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {shieldPick && <CandidateCard type="shield" data={shieldPick} />}
          {swordPick && <CandidateCard type="sword" data={swordPick} />}
          {wildcardPick && <CandidateCard type="wildcard" data={wildcardPick} />}
        </div>

        {/* Comparison Section */}
        <div className="bg-white dark:bg-[#111] rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div>
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <BarChart2 className="text-blue-500" />
                 Head-to-Head Comparison
               </h2>
               <p className="text-sm text-gray-500 mt-1">
                 Algorithm: Score (100) = Potential (60%) + Opponent Weakness (30%) + Home Advantage (10%)
               </p>
             </div>
             {/* Search or Select dropdowns could go here */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 md:gap-32 relative">
             <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white dark:bg-[#222] rounded-full p-3 border shadow-lg text-sm font-black text-gray-400">VS</div>
             
             {candidates.slice(0, 2).map((c, idx) => (
               <div key={c.player.id} className="relative">
                 {/* Mobile VS badge */}
                 {idx === 0 && <div className="md:hidden absolute -bottom-16 left-1/2 -translate-x-1/2 z-10 bg-white dark:bg-[#222] rounded-full p-2 border shadow-sm text-xs font-bold text-gray-400">VS</div>}
                 
                 <div className="flex items-center gap-4 mb-8">
                    <img 
                      src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${c.player.photo.replace('.jpg', '.png')}`} 
                      onError={(e) => { e.currentTarget.src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png'; }}
                      alt={c.player.web_name}
                      className="w-20 h-20 rounded-full object-cover bg-gray-50 shadow-md border-2 border-white dark:border-[#333]"
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{c.player.web_name}</h3>
                      <div className="text-sm font-medium text-gray-500">{teams[c.player.team]?.name}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-3xl font-black text-blue-600 dark:text-blue-500">{c.score.toFixed(0)}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Score</div>
                    </div>
                 </div>

                 <div className="space-y-6">
                   <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5">
                     <span className="text-gray-500 font-medium">Last 3 Matches xGI</span>
                     <span className="font-bold text-xl text-gray-900 dark:text-white">{c.details.last3xGI.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5">
                     <span className="text-gray-500 font-medium">Season PPG</span>
                     <span className="font-bold text-xl text-gray-900 dark:text-white">{c.details.seasonPPG.toFixed(1)}</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5">
                     <span className="text-gray-500 font-medium">Effective Ownership</span>
                     <span className="font-bold text-xl text-gray-900 dark:text-white">{c.player.selected_by_percent}%</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5">
                     <span className="text-gray-500 font-medium">Next Opponent{c.details.opponents.length > 1 ? 's' : ''}</span>
                     <div className="text-right flex flex-col gap-2 items-end">
                       {c.details.opponents.map((opp, i) => (
                         <div key={i} className="flex items-center gap-2">
                           <span className="block font-bold text-lg text-gray-900 dark:text-white">{opp.name} {opp.isHome ? '(H)' : '(A)'}</span>
                           <span className={`inline-block text-xs font-bold text-white px-2 py-0.5 rounded ${getDifficultyColor(opp.difficulty)}`}>
                             FDR {opp.difficulty}
                           </span>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CaptaincyDecider;
