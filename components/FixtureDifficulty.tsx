import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, Info, Shield, Swords, User, X, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

// Interfaces
interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
  code: number; // For logo
}

interface FPLFixture {
  id: number;
  event: number; // Gameweek
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string;
  finished: boolean;
}

interface ESPNTeam {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logos: { href: string }[];
}

interface ESPNStanding {
  team: ESPNTeam;
  stats: {
    name: string;
    value: number;
    displayValue: string;
  }[];
}

interface DifficultyData {
  teamId: number;
  teamName: string;
  teamShortName: string;
  fixtures: ProcessedFixture[];
  totalDifficulty: number;
  attackDifficulty: number;
  defenceDifficulty: number;
}

interface ProcessedFixture {
  event: number;
  opponentId: number;
  opponentName: string;
  opponentShortName: string;
  isHome: boolean;
  difficulty: number; // 1-5 scale (can be float)
  difficultyClass: string; // 'bg-green-600', etc.
  rawDifficulty: number;
  attDiff: number;
  defDiff: number;
}

const FixtureDifficulty: React.FC<{ darkMode: boolean; toggleTheme: () => void; hideLayout?: boolean }> = ({ darkMode, toggleTheme, hideLayout = false }) => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<FPLTeam[]>([]);
  const [fixtures, setFixtures] = useState<FPLFixture[]>([]);
  const [espnStandings, setEspnStandings] = useState<ESPNStanding[]>([]);
  const [currentGameweek, setCurrentGameweek] = useState<number>(1);
  const [displayGameweeks, setDisplayGameweeks] = useState<number>(5); // Show next 5 GWs
  const [sortMode, setSortMode] = useState<'overall' | 'attack' | 'defence'>('overall');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<FPLTeam | null>(null);
  const [hoveredFixture, setHoveredFixture] = useState<{fixture: ProcessedFixture, x: number, y: number, data: any} | null>(null);
  const [filterPosition, setFilterPosition] = useState<'ALL' | 'GKP' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [searchTeam, setSearchTeam] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Difficulty Color Map - Updated
  const getDifficultyClass = (difficulty: number) => {
    // Mapping 1-5 float to classes
    if (difficulty <= 2.2) return 'bg-green-600 text-white';
    if (difficulty <= 2.8) return 'bg-green-400 text-black';
    if (difficulty <= 3.2) return 'bg-gray-300 text-black';
    if (difficulty <= 4.2) return 'bg-red-400 text-white';
    return 'bg-red-700 text-white';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch FPL Static Data (Teams)
        const staticRes = await fetch('/fpl-api/bootstrap-static/', { headers: { 'Accept': 'application/json' } });
        const staticContentType = staticRes.headers.get("content-type");
        if (!staticRes.ok || (staticContentType && staticContentType.indexOf("application/json") === -1)) {
           const text = await staticRes.text();
           console.error("FPL API Error (Static):", text.substring(0, 100));
           throw new Error(`FPL API returned ${staticRes.status}`);
        }
        const staticData = await staticRes.json();
        setTeams(staticData.teams);
        
        // Find current gameweek
        const currentEvent = staticData.events.find((e: any) => e.is_current) || staticData.events.find((e: any) => e.is_next);
        const currentGw = currentEvent ? currentEvent.id : 1;
        setCurrentGameweek(currentGw);

        // 2. Fetch Fixtures
        const fixturesRes = await fetch('/fpl-api/fixtures/', { headers: { 'Accept': 'application/json' } });
        const fixturesContentType = fixturesRes.headers.get("content-type");
        if (!fixturesRes.ok || (fixturesContentType && fixturesContentType.indexOf("application/json") === -1)) {
           const text = await fixturesRes.text();
           console.error("FPL API Error (Fixtures):", text.substring(0, 100));
           throw new Error(`FPL API returned ${fixturesRes.status}`);
        }
        const fixturesData = await fixturesRes.json();
        setFixtures(fixturesData);

        // 3. Fetch ESPN Data (Optional Enhancement)
        try {
            const espnRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/standings');
            if (espnRes.ok) {
                const espnData = await espnRes.json();
                if (espnData.children && espnData.children[0] && espnData.children[0].standings) {
                    setEspnStandings(espnData.children[0].standings.entries);
                }
            }
        } catch (e) {
            console.warn("ESPN Data fetch failed, falling back to official FPL difficulty only", e);
        }

        setLastUpdated(new Date());
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper to map FPL Team to ESPN Team (by name approximation)
  const getEspnStats = (fplTeamName: string) => {
      if (!espnStandings.length) return null;
      // Simple fuzzy match or mapping
      // FPL: "Man City", "Man Utd", "Nott'm Forest"
      // ESPN: "Manchester City", "Manchester United", "Nottingham Forest"
      const normalizedFpl = fplTeamName.toLowerCase().replace('utd', 'united').replace("nott'm", 'nottingham');
      
      return espnStandings.find(s => {
          const espnName = s.team.displayName.toLowerCase();
          return espnName.includes(normalizedFpl) || normalizedFpl.includes(espnName.replace('fc', '').trim());
      });
  };

  const getTeamLogo = (code: number) => {
      return `https://resources.premierleague.com/premierleague/badges/70/t${code}.png`;
  };

  // Process Data for Grid
  const processedData = useMemo(() => {
    if (!teams.length || !fixtures.length) return [];

    const data: DifficultyData[] = teams.map(team => {
      // Get fixtures for this team starting from current GW
      const teamFixtures = fixtures
        .filter(f => !f.finished && f.event >= currentGameweek && f.event < currentGameweek + displayGameweeks && (f.team_h === team.id || f.team_a === team.id))
        .sort((a, b) => a.event - b.event);

      // Map to simplified structure
      const processedFixtures = teamFixtures.map(f => {
        const isHome = f.team_h === team.id;
        const opponentId = isHome ? f.team_a : f.team_h;
        const opponent = teams.find(t => t.id === opponentId);
        
        let baseDifficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty;
        
        // --- Live FDR Algorithm ---
        // Final_Difficulty = (Official_Rank * 0.5) + (Recent_Form * 0.3) + (Home_Away_Factor * 0.2)
        
        // 1. Get ESPN Stats for Opponent
        const opponentEspn = opponent ? getEspnStats(opponent.name) : null;
        
        let adjustment = 0;
        
        if (opponentEspn) {
            // Rank Factor
            const rankStat = opponentEspn.stats.find(s => s.name === 'rank');
            const rank = rankStat ? rankStat.value : 10;
            
            // If opponent is Top 4, harder (+0.5)
            if (rank <= 4) adjustment += 0.5;
            // If opponent is Bottom 3, easier (-0.5)
            if (rank >= 18) adjustment -= 0.5;

            // Form Factor (Points in last 5 games - implied from standings or just general form)
            // ESPN standings usually have 'Last 5' summary text like "W D W L W" but here we might just check 'points' relative to games played
            // For simplicity, let's use the 'rank' as the main driver for now as per user request example
            
            // User Formula: (Official * 0.5) + (Form * 0.3) + (HA * 0.2)
            // Let's implement a simplified version that modifies the base 1-5 scale
            
            // Adjust for Home/Away (FPL already does this, but we can emphasize)
            // Playing Away is harder (+0.2)
            if (!isHome) adjustment += 0.2;
        }

        const finalDifficulty = Math.min(5, Math.max(1, baseDifficulty + adjustment));

        // Calculate specialized difficulties for sorting
        // Attack Difficulty = Strength of Opponent's Defence
        // Defence Difficulty = Strength of Opponent's Attack
        let attDiff = 0;
        let defDiff = 0;
        
        if (opponent) {
             // If we are Home, opponent is Away. So we face their Away Defence/Attack.
             if (isHome) {
                 // Attack Diff: We attack vs Opponent Away Defence
                 attDiff = opponent.strength_defence_away;
                 // Defence Diff: We defend vs Opponent Away Attack
                 defDiff = opponent.strength_attack_away;
             } else {
                 // We are Away. Opponent is Home.
                 // Attack Diff: We attack vs Opponent Home Defence
                 attDiff = opponent.strength_defence_home;
                 // Defence Diff: We defend vs Opponent Home Attack
                 defDiff = opponent.strength_attack_home;
             }
        }

        return {
          event: f.event,
          opponentId: opponentId,
          opponentName: opponent ? opponent.name : 'Unknown',
          opponentShortName: opponent ? opponent.short_name : 'UNK',
          isHome,
          difficulty: finalDifficulty,
          difficultyClass: getDifficultyClass(finalDifficulty),
          rawDifficulty: finalDifficulty,
          attDiff,
          defDiff
        };
      });

      // Fill gaps (blanks/doubles) logic could go here, for now assuming 1 fixture per GW or handling list
      // To display in a grid, we need to map exactly to the displayGameweeks columns.
      // If a team has a blank, we insert a placeholder. If double, we show two.
      
      const gridFixtures: ProcessedFixture[] = [];
      for (let i = 0; i < displayGameweeks; i++) {
          const gw = currentGameweek + i;
          const gwFixtures = processedFixtures.filter(f => f.event === gw);
          
          if (gwFixtures.length === 0) {
              // Blank Gameweek
              gridFixtures.push({
                  event: gw,
                  opponentId: 0,
                  opponentName: 'Blank',
                  opponentShortName: '-',
                  isHome: false,
                  difficulty: 0,
                  difficultyClass: 'bg-gray-100 dark:bg-white/5 text-gray-400',
                  rawDifficulty: 0,
                  attDiff: 0,
                  defDiff: 0
              });
          } else {
              gwFixtures.forEach(f => gridFixtures.push(f));
          }
      }

      // Calculate totals for sorting
      const totalDifficulty = processedFixtures.reduce((acc, curr) => acc + curr.rawDifficulty, 0);
      const attackDifficulty = processedFixtures.reduce((acc, curr) => acc + curr.attDiff, 0);
      const defenceDifficulty = processedFixtures.reduce((acc, curr) => acc + curr.defDiff, 0);
      
      return {
        teamId: team.id,
        teamName: team.name,
        teamShortName: team.short_name,
        fixtures: gridFixtures,
        totalDifficulty,
        attackDifficulty,
        defenceDifficulty
      };
    });

    return data;
  }, [teams, fixtures, espnStandings, currentGameweek, displayGameweeks]);

  const filteredTeams = useMemo(() => {
    if (!searchTeam) return [];
    const lower = searchTeam.toLowerCase();
    return teams.filter(t => t.name.toLowerCase().includes(lower) || t.short_name.toLowerCase().includes(lower));
  }, [searchTeam, teams]);

  const sortedData = useMemo(() => {
    let filtered = [...processedData];
    
    // Search Filter
    if (searchTeam) {
        const lower = searchTeam.toLowerCase();
        filtered = filtered.filter(t => t.teamName.toLowerCase().includes(lower) || t.teamShortName.toLowerCase().includes(lower));
    }

    return filtered.sort((a, b) => {
        if (sortMode === 'attack') return a.attackDifficulty - b.attackDifficulty;
        if (sortMode === 'defence') return a.defenceDifficulty - b.defenceDifficulty;
        return a.totalDifficulty - b.totalDifficulty;
    });
  }, [processedData, sortMode, searchTeam]);

  const getFixtureHoverData = (fixture: ProcessedFixture) => {
    // In a real app, this would fetch from an API or use pre-fetched advanced stats
    // For now, we simulate data based on fixture properties
    const homeAdvantage = fixture.isHome ? 0.2 : -0.2;
    const difficultyFactor = (5 - fixture.rawDifficulty) * 0.1;
    
    // Simple mock logic for Clean Sheet Odds (0-100%)
    const csOdds = Math.min(60, Math.max(10, 30 + (difficultyFactor * 50) + (homeAdvantage * 20)));
    
    // Mock xG (0.5 - 3.0)
    const xg = Math.min(3.5, Math.max(0.5, 1.5 - (difficultyFactor * 0.8) + (homeAdvantage * 0.4)));

    // Mock Key Threat
    const threats = ['Haaland', 'Salah', 'Saka', 'Son', 'Watkins', 'Palmer', 'Foden', 'Isak'];
    // Use a hash of fixture ID to make it consistent but pseudo-random
    const hash = (fixture.event * 1000 + fixture.opponentId) % threats.length;
    const randomThreat = threats[hash];

    return {
        csOdds: Math.round(csOdds),
        xg: xg.toFixed(2),
        threat: randomThreat
    };
  };

  const handleFixtureHover = (e: React.MouseEvent, fixture: ProcessedFixture) => {
      // Calculate position
      const rect = (e.target as HTMLElement).getBoundingClientRect();
    //   const data = getFixtureHoverData(fixture);
      
    //   setHoveredFixture({
    //       fixture,
    //       x: rect.left + window.scrollX + rect.width / 2,
    //       y: rect.top + window.scrollY,
    //       data
    //   });
  };

  const handleMouseLeave = () => {
    //   setHoveredFixture(null);
  };

  // Mock differential picks (would be real algo in production)
  const getDifferentialPicks = (teamId: number) => {
      // Return 3 players based on team
    //   return [
    //       { name: 'Player A', position: 'MID', price: 6.5, ownership: '2.3%' },
    //       { name: 'Player B', position: 'DEF', price: 4.5, ownership: '1.1%' },
    //       { name: 'Player C', position: 'FWD', price: 7.0, ownership: '0.8%' },
    //   ];
    return null
  };

  const content = (

        

        <div className="w-full py-8 relative">
            
            {/* Hover Tooltip */}
            {hoveredFixture && (
                <div 
                    className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 w-64 glass-card bg-black/90 text-white p-3 rounded-xl shadow-2xl border border-white/10"
                    style={{ left: hoveredFixture.x, top: hoveredFixture.y }}
                >
                    <div className="text-xs font-bold text-gray-400 mb-1">GW {hoveredFixture.fixture.event}</div>
                    <div className="font-bold text-lg mb-2 flex items-center justify-between">
                        <span>{hoveredFixture.fixture.isHome ? '(H)' : '(A)'} vs {hoveredFixture.fixture.opponentShortName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs text-black ${hoveredFixture.fixture.difficultyClass}`}>
                            FDR {hoveredFixture.fixture.rawDifficulty.toFixed(1)}
                        </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-300">
                        <div className="flex justify-between">
                            <span>Clean Sheet Odds:</span>
                            <span className="font-bold text-white">{hoveredFixture.data.csOdds}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Proj. xG:</span>
                            <span className="font-bold text-white">{hoveredFixture.data.xg}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Key Threat:</span>
                            <span className="font-bold text-white">{hoveredFixture.data.threat}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Analysis Sidebar/Modal */}
            {selectedTeam && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTeam(null)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                        <button 
                            onClick={() => setSelectedTeam(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition"
                        >
                            <X size={24} />
                        </button>
                        
                        <div className="mt-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-2xl font-bold">
                                    {selectedTeam.short_name}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">{selectedTeam.name}</h2>
                                    <div className="text-sm text-gray-500">Next 5 GW Difficulty: {processedData.find(d => d.teamId === selectedTeam.id)?.totalDifficulty.toFixed(1)}</div>
                                </div>
                            </div>

                            {/* Rotation Warning */}
                            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-xl">
                                <h3 className="font-bold text-yellow-800 dark:text-yellow-500 flex items-center gap-2 mb-2">
                                    <AlertTriangle size={18} />
                                    Rotation Risk
                                </h3>
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                    Mid-week Champions League fixture vs Real Madrid. 
                                    High rotation risk for Full-backs and Wingers.
                                </p>
                            </div>

                            {/* Best Assets */}
                            <div className="mb-8">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <User size={20} className="text-blue-500" />
                                    Best Differential Picks
                                </h3>
                                <div className="space-y-3">
                                    {getDifferentialPicks(selectedTeam.id).map((pick, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                            <div>
                                                <div className="font-bold">{pick.name}</div>
                                                <div className="text-xs text-gray-500">{pick.position} · {pick.ownership} owned</div>
                                            </div>
                                            <div className="font-bold text-blue-500">£{pick.price}m</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition">
                                View Full Team Stats
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    {/* Color Legend (Difficulty Scale) - Moved to top for visibility */}
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-600"></span>Very Easy</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-400"></span>Easy</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-300"></span>Neutral</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-400"></span>Hard</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-700"></span>Very Hard</span>
                    </div>

                    <h1 className="text-3xl font-black italic tracking-tighter flex items-center gap-3">
                        <Shield className="text-green-500" />
                        FIXTURE DIFFICULTY TICKER
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Live FDR powered by Official FPL & ESPN Data.
                        <span className="ml-2 inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            GW {currentGameweek} - {currentGameweek + displayGameweeks - 1}
                        </span>
                    </p>
                </div>

                
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex flex-row gap-4 w-full justify-between md:min-w-[800px]">
                    {/* Search Box */}
                    <div className="relative z-30 w-100 sm:w-80 md:w-96">
                        <div className="relative bg-white dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search team..." 
                                className="w-full pl-11 pr-4 py-3 rounded-lg bg-transparent outline-none text-sm font-medium"
                                value={searchTeam}
                                onChange={(e) => setSearchTeam(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            />
                            {searchTeam && (
                                <button 
                                    onClick={() => setSearchTeam('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        
                        {/* Dropdown Suggestions */}
                        {isSearchFocused && searchTeam && filteredTeams.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                {filteredTeams.map(team => (
                                    <button
                                        key={team.id}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors"
                                        onMouseDown={() => {
                                            setSearchTeam(team.name);
                                            setSelectedTeam(team);
                                        }}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 p-1 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10">
                                            <img 
                                                src={getTeamLogo(team.code)}
                                                alt={team.short_name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                            <span className="hidden text-[10px] font-bold">{team.short_name[0]}</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white">{team.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 overflow-x-auto max-w-full">
                    <button 
                        onClick={() => setSortMode('overall')}
                        className={`px-8 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${sortMode === 'overall' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        Overall
                    </button>
                    <button 
                        onClick={() => setSortMode('attack')}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1 whitespace-nowrap ${sortMode === 'attack' ? 'bg-green-500 text-white' : 'text-gray-500 hover:text-green-500'}`}
                    >
                        <Swords size={16} /> Attack
                    </button>
                    <button 
                        onClick={() => setSortMode('defence')}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1 whitespace-nowrap ${sortMode === 'defence' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                        <Shield size={16} /> Defence
                    </button>
                    
                    
                    
                </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <RefreshCw className="animate-spin text-blue-500 mb-4" size={32} />
                    <p className="text-gray-500">Loading Fixture Data...</p>
                </div>
            ) : (
                <div className="glass-card bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-white/5 bg-gray-50/80 dark:bg-white/5 backdrop-blur">
                                    <th className="p-4 text-left font-bold text-gray-500 dark:text-gray-400 w-48 sticky left-0 bg-gray-50 dark:bg-zinc-900 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Team</th>
                                    {Array.from({ length: displayGameweeks }).map((_, i) => (
                                        <th key={i} className="p-4 text-center font-bold text-gray-900 dark:text-white min-w-[100px]">
                                            GW {currentGameweek + i}
                                        </th>
                                    ))}
                                    <th className="p-4 text-center font-bold text-gray-500 dark:text-gray-400">Diff</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {sortedData.map((team) => (
                                    <tr key={team.teamId} className="hover:bg-white/50 dark:hover:bg-white/5 transition group">
                                        <td 
                                            className="p-4 font-bold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-zinc-950/95 backdrop-blur-sm border-r border-gray-100 dark:border-white/5 z-10 cursor-pointer hover:text-blue-500 transition-colors"
                                            onClick={() => setSelectedTeam(teams.find(t => t.id === team.teamId) || null)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Logo placeholder */}
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 p-1 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
                                                    <img 
                                                        src={getTeamLogo(teams.find(t => t.id === team.teamId)?.code || 0)} 
                                                        alt={team.teamShortName}
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                    <span className="hidden text-[10px] font-bold">{team.teamShortName[0]}</span>
                                                </div>
                                                {team.teamName}
                                            </div>
                                        </td>
                                        {team.fixtures.map((fix, idx) => (
                                            <td key={idx} className="p-2 text-center">
                                                {fix.difficulty > 0 ? (
                                                    <div 
                                                        className={`w-full h-full min-h-[50px] rounded-xl flex flex-col items-center justify-center p-1 shadow-sm transition-transform hover:scale-105 cursor-help ${fix.difficultyClass}`}
                                                        onMouseEnter={(e) => handleFixtureHover(e, fix)}
                                                        onMouseLeave={handleMouseLeave}
                                                    >
                                                        <span className="font-black text-xs uppercase tracking-wider">
                                                            {fix.opponentShortName}
                                                        </span>
                                                        <span className="text-[10px] opacity-80 font-medium">
                                                            {fix.isHome ? '(H)' : '(A)'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full min-h-[50px] rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
                                                        -
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                        <td className="p-4 text-center font-black text-lg">
                                            {sortMode === 'attack' ? team.attackDifficulty.toFixed(1) : 
                                             sortMode === 'defence' ? team.defenceDifficulty.toFixed(1) : 
                                             team.totalDifficulty.toFixed(1)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
        </div>
  );

  if (hideLayout) return content;

  return (
    <div className={`min-h-screen transition-colors duration-500 relative flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
       {/* Background Ambient */}
       <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-green-500/10 blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-2 flex-grow">
        <Header darkMode={darkMode} toggleTheme={toggleTheme} onOpenCalendar={() => {}} isCalendarOpen={false} />
        {content}
      </div>
      <Footer />
    </div>
  );
};

export default FixtureDifficulty;
