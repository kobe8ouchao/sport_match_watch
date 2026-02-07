/*
 * @Descripttion: 
 * @Author: ouchao
 * @Email: ouchao@sendpalm.com
 * @version: 1.0
 * @Date: 2026-02-06 14:38:46
 * @LastEditors: ouchao
 * @LastEditTime: 2026-02-07 21:25:14
 */
import { getRedisClient } from '../_lib/redis.js';

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
    
    // 3. Save to Redis
    const redis = getRedisClient();
    if (redis) {
        // Use JSON.stringify because standard Redis stores strings
        await redis.set('nfl_player_map', JSON.stringify(playerMap));
        return response.status(200).json({ success: true, count: Object.keys(playerMap).length, source: 'redis' });
    } else {
        console.warn("Redis client not initialized. Skipping save.");
        return response.status(200).json({ success: true, count: Object.keys(playerMap).length, source: 'memory_only', warning: 'Redis not configured' });
    }
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
