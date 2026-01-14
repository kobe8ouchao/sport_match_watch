import { kv } from '@vercel/kv';

export default async function handler(request: any, response: any) {
  try {
    // 1. Fetch full player list from Sleeper
    const sleeperRes = await fetch('https://api.sleeper.app/v1/players/nfl');
    if (!sleeperRes.ok) throw new Error('Failed to fetch players');
    
    const allPlayers = await sleeperRes.json();
    
    // 2. Filter and Map
    const playerMap: Record<string, any> = {};
    
    for (const [id, data] of Object.entries(allPlayers)) {
      const p = data as any;
      
      // Filter logic: Keep active or team-affiliated players
      if (p.active || p.team) {
         playerMap[id] = {
           n: `${p.first_name} ${p.last_name}`,
           t: p.team || 'FA',
           p: p.position
         };
      }
    }
    
    // 3. Save to KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        await kv.set('nfl_player_map', playerMap);
        return response.status(200).json({ success: true, count: Object.keys(playerMap).length, source: 'kv' });
    } else {
        console.warn("KV_REST_API_URL or KV_REST_API_TOKEN missing. Skipping KV save.");
        return response.status(200).json({ success: true, count: Object.keys(playerMap).length, source: 'memory_only', warning: 'KV not configured' });
    }
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
