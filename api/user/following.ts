import { prisma } from '../_lib/prisma.js';
import { getSession } from '../_lib/auth.js';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const session = await getSession(token);
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const userId = session.userId;

  try {
    if (req.method === 'GET') {
      const teams = await prisma.followedTeam.findMany({
        where: { userId }
      });
      
      return res.status(200).json(teams.map(t => ({
        id: t.teamId,
        name: t.name,
        logo: t.logo,
        leagueId: t.leagueId
      })));
    }

    if (req.method === 'POST') {
      const team = req.body;
      if (!team || !team.id) {
        return res.status(400).json({ error: 'Invalid team data' });
      }

      // Check if already following
      const existing = await prisma.followedTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId: team.id
          }
        }
      });

      if (!existing) {
        await prisma.followedTeam.create({
          data: {
            userId,
            teamId: team.id,
            name: team.name,
            logo: team.logo,
            leagueId: team.leagueId
          }
        });
      }
      
      // Return updated list
      const teams = await prisma.followedTeam.findMany({ where: { userId } });
      return res.status(200).json(teams.map(t => ({
        id: t.teamId,
        name: t.name,
        logo: t.logo,
        leagueId: t.leagueId
      })));
    }

    if (req.method === 'DELETE') {
      const teamId = req.query.teamId || req.body?.teamId;

      if (!teamId) {
        return res.status(400).json({ error: 'Team ID required' });
      }

      try {
        await prisma.followedTeam.delete({
          where: {
            userId_teamId: {
              userId,
              teamId
            }
          }
        });
      } catch (e) {
        // Ignore if not found
      }
      
      // Return updated list
      const teams = await prisma.followedTeam.findMany({ where: { userId } });
      return res.status(200).json(teams.map(t => ({
        id: t.teamId,
        name: t.name,
        logo: t.logo,
        leagueId: t.leagueId
      })));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Following error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
