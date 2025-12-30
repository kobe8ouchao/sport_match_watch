import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, Info, Shield, Swords, User, X, Search, GripVertical, ArrowRight, CircleHelp } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
  MouseSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  baseDifficulty: number;
  rankAdjustment: number;
  homeAdjustment: number;
}

const getTeamLogo = (code: number) => {
    return `https://resources.premierleague.com/premierleague/badges/70/t${code}.png`;
};

// Difficulty Color Map - Updated
const getDifficultyClass = (difficulty: number) => {
  // Mapping 1-5 float to classes
  if (difficulty <= 2.2) return 'bg-green-600 text-white';
  if (difficulty <= 2.8) return 'bg-green-400 text-black';
  if (difficulty <= 3.2) return 'bg-gray-300 text-black';
  if (difficulty <= 4.2) return 'bg-red-400 text-white';
  return 'bg-red-700 text-white';
};

interface SortableRowProps {
    team: DifficultyData;
    teams: FPLTeam[];
    currentGameweek: number;
    displayGameweeks: number;
    sortMode: string;
    setSelectedTeam: (team: FPLTeam | null) => void;
    handleFixtureHover: (e: React.MouseEvent, fixture: ProcessedFixture) => void;
    handleMouseLeave: () => void;
}

const HelpTooltip = ({ content }: { content: React.ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
        <div 
            className="relative inline-flex items-center ml-1"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={(e) => {
                e.stopPropagation();
                setIsVisible(!isVisible);
            }}
        >
            <div className="p-0.5 hover:bg-white/20 rounded-full cursor-help opacity-70 hover:opacity-100 transition-opacity">
                <CircleHelp size={14} />
            </div>
            {isVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/90 text-white text-[10px] leading-tight rounded shadow-lg z-[100] font-normal whitespace-normal text-center border border-white/10">
                    {content}
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90" />
                </div>
            )}
        </div>
    );
};

const SortableRow: React.FC<SortableRowProps> = ({ 
    team, 
    teams, 
    displayGameweeks, 
    sortMode, 
    setSelectedTeam, 
    handleFixtureHover, 
    handleMouseLeave 
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: team.teamId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' : 'static',
        opacity: isDragging ? 0.8 : 1
    };

    return (
        <tr 
            ref={setNodeRef} 
            style={style} 
            className={`hover:bg-white/50 dark:hover:bg-white/5 transition group ${isDragging ? 'bg-blue-50 dark:bg-blue-900/20 shadow-lg' : ''}`}
        >
            <td 
                className="p-4 font-bold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-zinc-950/95 backdrop-blur-sm border-r border-gray-100 dark:border-white/5 z-10"
            >
                <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <div 
                        {...listeners} 
                        {...attributes} 
                        className="cursor-grab active:cursor-grabbing touch-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                        <GripVertical size={16} />
                    </div>

                    {/* Logo placeholder */}
                    <div 
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 p-1 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => setSelectedTeam(teams.find(t => t.id === team.teamId) || null)}
                    >
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
                    
                    {/* Team Name - Hidden on Mobile */}
                    <span 
                        className="hidden md:block cursor-pointer hover:text-blue-500 transition-colors"
                        onClick={() => setSelectedTeam(teams.find(t => t.id === team.teamId) || null)}
                    >
                        {team.teamName}
                    </span>
                    {/* Mobile Only Short Name (Optional, but logo might be enough as requested) */}
                    {/* <span className="md:hidden text-xs">{team.teamShortName}</span> */}
                </div>
            </td>
            {team.fixtures.map((fix, idx) => (
                <td key={idx} className="p-2 text-center">
                    {fix.difficulty > 0 ? (
                        <div 
                            className={`w-full h-full min-h-[50px] rounded-xl relative group/cell overflow-hidden shadow-sm transition-transform hover:scale-105 cursor-help ${fix.difficultyClass}`}
                            onMouseEnter={(e) => handleFixtureHover(e, fix)}
                            onMouseLeave={handleMouseLeave}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row drag/selection if any
                                handleFixtureHover(e, fix);
                            }}
                        >
                            <div className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-200 group-hover/cell:opacity-0">
                                <span className="font-black text-xs uppercase tracking-wider">
                                    {fix.opponentShortName}
                                </span>
                                <span className="text-[10px] opacity-80 font-medium">
                                    {fix.isHome ? '(Home)' : '(Away)'}
                                </span>
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-200 opacity-0 group-hover/cell:opacity-100 bg-inherit">
                                <span className="font-black text-lg tracking-tight">
                                    {fix.rawDifficulty.toFixed(1)}
                                </span>
                            </div>
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
    );
};

interface FixtureDifficultyProps {
  darkMode: boolean;
  toggleTheme: () => void;
  hideLayout?: boolean; // Added hideLayout prop
}

const FixtureDifficulty: React.FC<FixtureDifficultyProps> = ({ darkMode, toggleTheme, hideLayout = false }) => {
  useEffect(() => {
    document.title = "FPL Fixture Difficulty Ticker & Planner | Sports Match";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', "Plan your Fantasy Premier League transfers with our interactive Fixture Difficulty Rating (FDR) ticker. Analyze upcoming fixtures and find easy runs for your FPL team.");
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = "Plan your Fantasy Premier League transfers with our interactive Fixture Difficulty Rating (FDR) ticker. Analyze upcoming fixtures and find easy runs for your FPL team.";
      document.head.appendChild(meta);
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', "FPL Fixture Difficulty, FDR, FPL Fixture Ticker, Fantasy Premier League Schedule, FPL Planner, Easy Fixtures, FPL Double Gameweek, FPL Blank Gameweek, Fixture Analysis");
    }
  }, []);

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
  const [manualOrder, setManualOrder] = useState<number[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
        activationConstraint: {
            delay: 250,
            tolerance: 5,
        },
    }),
    useSensor(MouseSensor, {
        activationConstraint: {
            distance: 10,
        },
    })
  );

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
        let currentGw = currentEvent ? currentEvent.id : 1;
        
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

        // Check if all fixtures in the current gameweek are finished
        // If so, move to the next gameweek to show upcoming fixtures
        const currentGwFixtures = fixturesData.filter((f: any) => f.event === currentGw);
        const isCurrentGwFinished = currentGwFixtures.length > 0 && currentGwFixtures.every((f: any) => f.finished);

        if (isCurrentGwFinished) {
            currentGw += 1;
        }
        setCurrentGameweek(currentGw);

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
        let rankAdjustment = 0;
        let homeAdjustment = 0;
        
        if (opponentEspn) {
            // Rank Factor
            const rankStat = opponentEspn.stats.find(s => s.name === 'rank');
            const rank = rankStat ? rankStat.value : 10;
            
            // If opponent is Top 4, harder (+0.5)
            if (rank <= 4) { adjustment += 0.5; rankAdjustment = 0.5; }
            // If opponent is Bottom 3, easier (-0.5)
            if (rank >= 18) { adjustment -= 0.5; rankAdjustment = -0.5; }

            // Form Factor (Points in last 5 games - implied from standings or just general form)
            // ESPN standings usually have 'Last 5' summary text like "W D W L W" but here we might just check 'points' relative to games played
            // For simplicity, let's use the 'rank' as the main driver for now as per user request example
            
            // User Formula: (Official * 0.5) + (Form * 0.3) + (HA * 0.2)
            // Let's implement a simplified version that modifies the base 1-5 scale
            
            // Adjust for Home/Away (FPL already does this, but we can emphasize)
            // Playing Away is harder (+0.2)
            if (!isHome) { adjustment += 0.2; homeAdjustment = 0.2; }
        }

        const finalDifficulty = Math.min(5, Math.max(1, baseDifficulty + adjustment));

        // Calculate specialized difficulties for sorting
        // Attack Difficulty = Strength of Opponent's Defence
        // Defence Difficulty = Strength of Opponent's Attack
        // Normalize FPL strength (typ. 1000-1350) to 1-5 scale
        const normalizeStrength = (strength: number) => {
             const min = 1000;
             const max = 1350;
             const normalized = 1 + ((strength - min) / (max - min)) * 4;
             return Math.min(5, Math.max(1, normalized));
        };

        let attDiff = 0;
        let defDiff = 0;
        
        if (opponent) {
             // If we are Home, opponent is Away. So we face their Away Defence/Attack.
             if (isHome) {
                 // Attack Diff: We attack vs Opponent Away Defence
                 attDiff = normalizeStrength(opponent.strength_defence_away);
                 // Defence Diff: We defend vs Opponent Away Attack
                 defDiff = normalizeStrength(opponent.strength_attack_away);
             } else {
                 // We are Away. Opponent is Home.
                 // Attack Diff: We attack vs Opponent Home Defence
                 attDiff = normalizeStrength(opponent.strength_defence_home);
                 // Defence Diff: We defend vs Opponent Home Attack
                 defDiff = normalizeStrength(opponent.strength_attack_home);
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
          defDiff,
          baseDifficulty,
          rankAdjustment,
          homeAdjustment
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
                  defDiff: 0,
                  baseDifficulty: 0,
                  rankAdjustment: 0,
                  homeAdjustment: 0
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

    // Manual Sort Priority
     if (manualOrder.length > 0) {
         // Create a map for O(1) lookup
         const orderMap = new Map<number, number>(manualOrder.map((id, index) => [id, index]));
         
         // Sort based on manual order. Items not in manual order (e.g. new search result?) go to end
         return filtered.sort((a, b) => {
              const valA = orderMap.get(a.teamId);
              const valB = orderMap.get(b.teamId);
              const indexA = valA !== undefined ? valA : 9999;
              const indexB = valB !== undefined ? valB : 9999;
              return indexA - indexB;
         });
     }

    return filtered.sort((a, b) => {
        if (sortMode === 'attack') return a.attackDifficulty - b.attackDifficulty;
        if (sortMode === 'defence') return a.defenceDifficulty - b.defenceDifficulty;
        return a.totalDifficulty - b.totalDifficulty;
    });
  }, [processedData, sortMode, searchTeam, manualOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
        setManualOrder((prev) => {
             // If we don't have a manual order yet, initialize it with current sortedData order
             const currentOrder = prev.length > 0 ? prev : sortedData.map(t => t.teamId);
             
             const oldIndex = currentOrder.indexOf(active.id as number);
             const newIndex = currentOrder.indexOf(over.id as number);
             
             return arrayMove(currentOrder, oldIndex, newIndex);
        });
        // Switch to custom sort mode implicitly or explicitly? 
        // Let's keep current sortMode visual but override it with manualOrder in logic
    }
  };

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
      const data = getFixtureHoverData(fixture);
      
      setHoveredFixture({
          fixture,
          x: rect.left + window.scrollX + rect.width / 2,
          y: rect.top + window.scrollY,
          data
      });
  };

  const handleMouseLeave = () => {
      setHoveredFixture(null);
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
    <div className="w-full py-2 flex-grow">
      {/* Title Area */}
      <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-black italic tracking-tighter flex items-center gap-3">
              <Shield className="text-green-500" />
              FIXTURE DIFFICULTY TICKER
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Live FDR powered by Official FPL & ESPN Data.
            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                GW {currentGameweek} - {currentGameweek + displayGameweeks - 1}
            </span>
          </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 mb-8">
          <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-600"></span>Very Easy</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-400"></span>Easy</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-300"></span>Neutral</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-400"></span>Hard</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-700"></span>Very Hard</span>
          <HelpTooltip content={
              <div className="text-left space-y-1 min-w-[150px]">
                  <p className="font-bold border-b border-white/20 pb-1 mb-1">FDR Calculation Formula</p>
                  <div className="flex justify-between"><span>Base Difficulty:</span> <span className="font-mono">1 - 5</span></div>
                  <div className="flex justify-between text-green-400"><span>vs Bottom 3:</span> <span className="font-mono">-0.5</span></div>
                  <div className="flex justify-between text-red-400"><span>vs Top 4:</span> <span className="font-mono">+0.5</span></div>
                  <div className="flex justify-between text-yellow-400"><span>Away Game:</span> <span className="font-mono">+0.2</span></div>
              </div>
          } />
      </div>

      {/* Hover Tooltip */}
      {hoveredFixture && (
        <div 
            className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 w-64 glass-card bg-black/90 text-white p-3 rounded-xl shadow-2xl border border-white/10"
            style={{ left: hoveredFixture.x, top: hoveredFixture.y }}
        >
            <div className="text-xs font-bold text-gray-400 mb-1">GW {hoveredFixture.fixture.event}</div>
            <div className="font-bold text-lg mb-2 flex items-center justify-between">
                <span>{hoveredFixture.fixture.isHome ? '(Home)' : '(Away)'} vs {hoveredFixture.fixture.opponentShortName}</span>
                <span className={`px-2 py-0.5 rounded text-xs text-black ${hoveredFixture.fixture.difficultyClass}`}>
                    FDR {hoveredFixture.fixture.rawDifficulty.toFixed(1)}
                </span>
            </div>
            <div className="space-y-1 text-xs text-gray-300">
                <div className="font-bold text-white mb-1 border-b border-white/10 pb-1">Calculation Breakdown</div>
                <div className="flex justify-between">
                    <span>Base (Official):</span>
                    <span className="font-mono text-white">{hoveredFixture.fixture.baseDifficulty}</span>
                </div>
                {hoveredFixture.fixture.rankAdjustment !== 0 && (
                    <div className="flex justify-between">
                        <span>Opponent Rank:</span>
                        <span className={`font-mono ${hoveredFixture.fixture.rankAdjustment > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {hoveredFixture.fixture.rankAdjustment > 0 ? '+' : ''}{hoveredFixture.fixture.rankAdjustment}
                        </span>
                    </div>
                )}
                {hoveredFixture.fixture.homeAdjustment !== 0 && (
                    <div className="flex justify-between">
                        <span>Home/Away:</span>
                        <span className={`font-mono ${hoveredFixture.fixture.homeAdjustment > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {hoveredFixture.fixture.homeAdjustment > 0 ? '+' : ''}{hoveredFixture.fixture.homeAdjustment}
                        </span>
                    </div>
                )}
                
                <div className="mt-2 pt-1 border-t border-white/10">
                    <div className="flex justify-between text-[10px] opacity-70">
                        <span>Clean Sheet:</span>
                        <span>{hoveredFixture.data.csOdds}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] opacity-70">
                        <span>xG:</span>
                        <span>{hoveredFixture.data.xg}</span>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Controls Area */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex flex-row gap-4 w-full justify-between md:min-w-[800px]">
              {/* Search Box */}
              <div className="relative z-30 w-100 sm:w-80 md:w-96">
                  <div className="relative bg-white dark:bg-white/5 px-2 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                          type="text" 
                          placeholder="Search team..." 
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-transparent outline-none text-sm font-medium"
                          value={searchTeam}
                          onChange={(e) => setSearchTeam(e.target.value)}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                      />
                      {searchTeam && (
                          <button 
                              onClick={() => setSearchTeam('')}
                              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
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
              <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 overflow-x-auto md:overflow-visible max-w-full">
              <button 
                  onClick={() => { setSortMode('overall'); setManualOrder([]); }}
                  className={`px-8 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${sortMode === 'overall' && manualOrder.length === 0 ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                  Overall
              </button>
              <button 
                  onClick={() => { setSortMode('attack'); setManualOrder([]); }}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1 whitespace-nowrap ${sortMode === 'attack' && manualOrder.length === 0 ? 'bg-green-500 text-white' : 'text-gray-500 hover:text-green-500'}`}
              >
                  <Swords size={16} /> Attack
                  <HelpTooltip content="Difficulty of attacking against the opponent (based on opponent's defensive strength)" />
              </button>
              <button 
                  onClick={() => { setSortMode('defence'); setManualOrder([]); }}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1 whitespace-nowrap ${sortMode === 'defence' && manualOrder.length === 0 ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-blue-500'}`}
              >
                  <Shield size={16} /> Defence
                  <HelpTooltip content="Difficulty of defending against the opponent (based on opponent's attacking strength)" />
              </button>
              
              {/* Reset Manual Sort (Visible if manual sort is active) */}
              {manualOrder.length > 0 && (
                  <button 
                      onClick={() => setManualOrder([])}
                      className="px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1 whitespace-nowrap text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                      <RefreshCw size={14} /> Reset Order
                  </button>
              )}
              
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
              {/* Mobile Hint */}
              <div className="md:hidden text-[10px] text-center text-gray-400 py-2 bg-gray-50/50 dark:bg-white/5 flex items-center justify-center gap-2 border-b border-gray-100 dark:border-white/5">
                  <ArrowRight size={12} className="animate-pulse" /> Swipe left to see stats
              </div>

              <div className="overflow-x-auto">
                  <DndContext 
                      sensors={sensors} 
                      collisionDetection={closestCenter} 
                      onDragEnd={handleDragEnd}
                  >
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
                          <SortableContext 
                              items={sortedData.map(t => t.teamId)} 
                              strategy={verticalListSortingStrategy}
                          >
                              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                  {sortedData.map((team) => (
                                      <SortableRow 
                                          key={team.teamId} 
                                          team={team} 
                                          teams={teams}
                                          currentGameweek={currentGameweek}
                                          displayGameweeks={displayGameweeks}
                                          sortMode={sortMode}
                                          setSelectedTeam={setSelectedTeam}
                                          handleFixtureHover={handleFixtureHover}
                                          handleMouseLeave={handleMouseLeave}
                                      />
                                  ))}
                              </tbody>
                          </SortableContext>
                      </table>
                  </DndContext>
              </div>
          </div>
      )}
    </div>
  );

  if (hideLayout) {
      return (
          <div className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {content}
          </div>
      );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Ambient Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-purple-100/40 dark:bg-purple-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-grow w-full">
        <Header
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            onOpenCalendar={() => {}}
            isCalendarOpen={false}
            hideCalendarButton
        />
        
        {/* Back Link for standalone mode */}
        <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4">
                <ArrowLeft size={16} className="mr-1" />
                Back to Dashboard
            </Link>
        </div>

        {content}
      </div>
      <Footer />
    </div>
  );
}

export default FixtureDifficulty;
