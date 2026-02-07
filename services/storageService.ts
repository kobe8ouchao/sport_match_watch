import { Team } from '../types/auth';

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const storageService = {
  getFollowedTeams: async (): Promise<Team[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return [];

    const res = await fetch('/api/user/following', {
      headers: getHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) return []; // Not logged in or token invalid
      throw new Error('Failed to fetch teams');
    }
    return res.json();
  },

  followTeam: async (team: Team): Promise<Team[]> => {
    const res = await fetch('/api/user/following', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(team)
    });
    if (!res.ok) throw new Error('Failed to follow team');
    return res.json();
  },

  unfollowTeam: async (teamId: string): Promise<Team[]> => {
    const res = await fetch(`/api/user/following?teamId=${teamId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to unfollow team');
    return res.json();
  },

  isFollowing: async (teamId: string): Promise<boolean> => {
    try {
      const teams = await storageService.getFollowedTeams();
      return teams.some(t => t.id === teamId);
    } catch {
      return false;
    }
  }
};
