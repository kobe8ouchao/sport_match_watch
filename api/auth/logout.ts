import { prisma } from '../_lib/prisma.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(200).json({ success: true });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    await prisma.session.delete({
      where: { sessionToken: token }
    });
  } catch (e) {
    // Ignore error if session doesn't exist
  }

  return res.status(200).json({ success: true });
}
