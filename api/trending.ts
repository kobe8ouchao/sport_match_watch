import { kv } from '@vercel/kv';

export default async function handler(request: any, response: any) {
  const { type = 'add', hours = '24' } = request.query;
  
  try {
    // 1. Fetch Trending Data from Sleeper
    const trendingRes = await fetch(`https://api.sleeper.app/v1/players/nfl/trending/${type}?lookback_hours=${hours}&limit=25`);
    if (!trendingRes.ok) throw new Error('Failed to fetch trending data');
    
    const trendingData = await trendingRes.json();
    
    // 2. Fetch Player Map from KV
    let playerMap: Record<string, any> = {};
    try {
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            playerMap = (await kv.get('nfl_player_map')) || {};
        } else {
            console.warn("KV_REST_API_URL or KV_REST_API_TOKEN missing. Skipping KV fetch.");
        }
    } catch (e) {
        console.warn("Failed to fetch from KV:", e);
    }
    
    // 3. Enrich Data (Map keys n/t/p -> fullName/team/position)
    const enrichedData = trendingData.map((item: any) => {
        const player = playerMap[item.player_id];
        return {
            player_id: item.player_id,
            count: item.count,
            player: player ? {
                fullName: player.n,      // Map 'n' to 'fullName'
                team: player.t,          // Map 't' to 'team'
                position: player.p,      // Map 'p' to 'position'
                avatar: `https://sleepercdn.com/content/nfl/players/${item.player_id}.jpg`
            } : {
                fullName: `Unknown Player (${item.player_id})`,
                team: 'N/A',
                position: 'N/A',
                avatar: `https://sleepercdn.com/content/nfl/players/${item.player_id}.jpg`
            }
        };
    }).filter((item) => item.player.fullName && !item.player.fullName.startsWith('Unknown Player'));
    
    return response.status(200).json(enrichedData);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
