import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { Team } from '../../types/auth';
import { Search, Loader2, Star, Check, Plus, LogOut, X } from 'lucide-react';
import { fetchStandings } from '../../services/api';
import Header from '../Header';
import Footer from '../Footer';

const FollowingPage: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [followedTeams, setFollowedTeams] = useState<Team[]>([]);
  const [popularTeams, setPopularTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [followedLoading, setFollowedLoading] = useState(false);
  const [processingTeamId, setProcessingTeamId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Theme Toggle Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load followed teams
  useEffect(() => {
    if (user) {
      loadFollowedTeams();
    } else {
      setFollowedTeams([]);
    }
  }, [user]);

  // Fetch all teams for search and popular list
  useEffect(() => {
    loadAllTeams();
  }, []);

  const loadFollowedTeams = async () => {
    setFollowedLoading(true);
    try {
      const teams = await storageService.getFollowedTeams();
      setFollowedTeams(teams);
    } catch (error) {
      console.error('Failed to load followed teams', error);
    } finally {
      setFollowedLoading(false);
    }
  };

  const loadAllTeams = async () => {
    setLoading(true);
    try {
      const leagues = ['nba', 'nfl', 'eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1'];
      const promises = leagues.map(id => fetchStandings(id));
      const results = await Promise.all(promises);
      
      const all: Team[] = [];
      const popular: Team[] = [];

      results.forEach((standings, index) => {
        const leagueId = leagues[index];
        
        standings.forEach((entry, i) => {
           const team: Team = {
             id: `${leagueId}_${entry.team.id}`, // Ensure unique ID with prefix like in TeamSearch
             name: entry.team.name,
             logo: entry.team.logo,
             leagueId: leagueId
           };
           all.push(team);
           
           if (i < 6) {
             popular.push(team);
           }
        });
      });
      
      setAllTeams(all);
      setPopularTeams(popular);
    } catch (error) {
      console.error('Failed to load teams', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleFollow = async (team: Team) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/following' } } });
      return;
    }

    if (processingTeamId) return; // Prevent multiple clicks
    setProcessingTeamId(team.id);

    try {
      const isFollowing = followedTeams.some(t => t.id === team.id);
      if (isFollowing) {
        await storageService.unfollowTeam(team.id);
        setFollowedTeams(prev => prev.filter(t => t.id !== team.id));
      } else {
        await storageService.followTeam(team);
        setFollowedTeams(prev => [...prev, team]);
      }
    } catch (error) {
      console.error('Failed to update follow status', error);
    } finally {
      setProcessingTeamId(null);
    }
  };

  const filteredSearchResults = allTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === 'all' || team.leagueId === selectedLeague;
    return matchesSearch && matchesLeague;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pantone-cloud dark:bg-zinc-950">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  // Filter display teams based on selected league as well, if we are in popular view
  let displayTeams = searchTerm ? filteredSearchResults : (followedTeams.length > 0 ? followedTeams : popularTeams);
  
  // If not searching but filtering by league, filter the current view (followed or popular)
  if (!searchTerm && selectedLeague !== 'all') {
      displayTeams = displayTeams.filter(team => team.leagueId === selectedLeague);
  }
  const isPopularView = !searchTerm && followedTeams.length === 0 && !followedLoading;

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-pantone-cloud text-gray-900'}`}>
      
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-orange-100/40 dark:bg-orange-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-grow w-full">
        <Header
          darkMode={darkMode}
          toggleTheme={() => setDarkMode(!darkMode)}
          onOpenCalendar={() => {}} // No calendar
          isCalendarOpen={false}
          hideCalendarButton={true}
        />

        <div className="space-y-8 py-6">
          {/* Header Title */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Following</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage your favorite teams</p>
            </div>
            {user ? (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login', { state: { from: { pathname: '/following' } } })}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative max-w-2xl flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                type="text"
                className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl leading-5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all shadow-sm"
                placeholder="Search teams to follow..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
            </div>
            <select
                className="block w-full md:w-48 pl-3 pr-10 py-3 text-base border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-white transition-all shadow-sm"
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
            >
                <option value="all">All Leagues</option>
                <option value="nba">NBA</option>
                <option value="nfl">NFL</option>
                <option value="eng.1">Premier League</option>
                <option value="ger.1">Bundesliga</option>
                <option value="esp.1">La Liga</option>
                <option value="ita.1">Serie A</option>
                <option value="fra.1">Ligue 1</option>
            </select>
          </div>

          {/* Team List */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {searchTerm ? 'Search Results' : (isPopularView ? 'Popular Teams' : 'My Teams')}
                  {isPopularView && <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full">Top 6 from Leagues</span>}
                </h2>
             </div>

             {(loading && (isPopularView || searchTerm)) || (followedLoading && !searchTerm) ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-teal-600" size={32} />
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayTeams.map((team) => {
                    const isFollowing = followedTeams.some(t => t.id === team.id);
                    const isProcessing = processingTeamId === team.id;
                    
                    return (
                      <div key={team.id} className="bg-white dark:bg-zinc-900/50 rounded-xl p-4 border border-gray-100 dark:border-white/5 flex items-center justify-between hover:shadow-md transition-all group">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-full p-2 shadow-sm flex items-center justify-center">
                             <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                           </div>
                           <div>
                             <h3 className="font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                             <p className="text-xs text-gray-500 uppercase">{team.leagueId}</p>
                           </div>
                         </div>
                         <button
                           onClick={() => handleFollow(team)}
                           disabled={isProcessing}
                           className={`p-2 rounded-full transition-all border ${
                             isFollowing 
                               ? 'bg-yellow-50 border-yellow-200 text-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-700' 
                               : 'bg-white border-gray-200 text-gray-300 hover:text-yellow-400 hover:border-yellow-200 dark:bg-white/5 dark:border-white/10 dark:text-gray-500 dark:hover:text-yellow-400'
                           } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                         >
                           {isProcessing ? (
                             <Loader2 size={20} className="animate-spin text-yellow-500" />
                           ) : (
                             <Star size={20} className={isFollowing ? "fill-yellow-500" : ""} />
                           )}
                         </button>
                      </div>
                    );
                  })}
                  
                  {displayTeams.length === 0 && searchTerm && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                      No teams found matching "{searchTerm}"
                    </div>
                  )}
                </div>
             )}
          </div>

        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FollowingPage;