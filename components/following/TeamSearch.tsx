import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, Star } from 'lucide-react';
import { Team } from '../../types/auth';
import { storageService } from '../../services/storageService';

// Mock data for teams (since we don't have a real team database API yet)
const POPULAR_TEAMS: Team[] = [
  // NBA
  { id: 'nba_lakers', name: 'Los Angeles Lakers', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png', leagueId: 'nba' },
  { id: 'nba_warriors', name: 'Golden State Warriors', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png', leagueId: 'nba' },
  { id: 'nba_celtics', name: 'Boston Celtics', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png', leagueId: 'nba' },
  // NFL
  { id: 'nfl_chiefs', name: 'Kansas City Chiefs', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png', leagueId: 'nfl' },
  { id: 'nfl_49ers', name: 'San Francisco 49ers', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png', leagueId: 'nfl' },
  // Premier League
  { id: 'epl_city', name: 'Manchester City', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png', leagueId: 'eng.1' },
  { id: 'epl_arsenal', name: 'Arsenal', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png', leagueId: 'eng.1' },
  { id: 'epl_liverpool', name: 'Liverpool', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png', leagueId: 'eng.1' },
  // La Liga
  { id: 'laliga_real', name: 'Real Madrid', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png', leagueId: 'esp.1' },
  { id: 'laliga_barca', name: 'Barcelona', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png', leagueId: 'esp.1' },
];

interface TeamSearchProps {
  onFollowChange: () => void;
}

const TeamSearch: React.FC<TeamSearchProps> = ({ onFollowChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [followedTeamIds, setFollowedTeamIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadFollowedTeams();
  }, []);

  const loadFollowedTeams = async () => {
    const teams = await storageService.getFollowedTeams();
    setFollowedTeamIds(new Set(teams.map(t => t.id)));
  };

  const handleFollow = async (team: Team) => {
    if (followedTeamIds.has(team.id)) {
      await storageService.unfollowTeam(team.id);
      setFollowedTeamIds(prev => {
        const next = new Set(prev);
        next.delete(team.id);
        return next;
      });
    } else {
      await storageService.followTeam(team);
      setFollowedTeamIds(prev => new Set(prev).add(team.id));
    }
    onFollowChange();
  };

  const filteredTeams = POPULAR_TEAMS.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === 'all' || team.leagueId === selectedLeague;
    return matchesSearch && matchesLeague;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl leading-5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="block w-full md:w-48 pl-3 pr-10 py-2.5 text-base border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-white transition-all"
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
        >
          <option value="all">All Leagues</option>
          <option value="nba">NBA</option>
          <option value="nfl">NFL</option>
          <option value="eng.1">Premier League</option>
          <option value="esp.1">La Liga</option>
        </select>
      </div>
      
      {/* Popular/Recommended Label */}
      {!searchTerm && selectedLeague === 'all' && (
         <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Popular Teams
         </h3>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => {
          const isFollowed = followedTeamIds.has(team.id);
          return (
            <div
              key={team.id}
              className="group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                  <p className="text-xs text-gray-500 uppercase">{team.leagueId.replace('.', ' ')}</p>
                </div>
              </div>
              <button
                onClick={() => handleFollow(team)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isFollowed
                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                    : 'bg-gray-50 dark:bg-zinc-800 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                }`}
              >
                {isFollowed ? <Check size={20} /> : <Plus size={20} />}
              </button>
            </div>
          );
        })}
      </div>
      
      {filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No teams found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default TeamSearch;
