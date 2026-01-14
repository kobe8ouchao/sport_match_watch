
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchTrending(type) {
    console.log(`Fetching trending ${type}...`);
    const res = await fetch(`https://api.sleeper.app/v1/players/nfl/trending/${type}?lookback_hours=24&limit=25`);
    if (!res.ok) throw new Error(`Failed to fetch trending ${type}`);
    return await res.json();
}

async function fetchAllPlayers() {
    console.log('Fetching all players (this may take a moment)...');
    const res = await fetch('https://api.sleeper.app/v1/players/nfl');
    if (!res.ok) throw new Error('Failed to fetch all players');
    return await res.json();
}

async function main() {
    try {
        const [adds, drops, allPlayers] = await Promise.all([
            fetchTrending('add'),
            fetchTrending('drop'),
            fetchAllPlayers()
        ]);

        console.log('Processing data...');

        const processList = (list) => {
            return list.map(item => {
                const player = allPlayers[item.player_id];
                return {
                    player_id: item.player_id,
                    count: item.count,
                    player: player ? {
                        fullName: `${player.first_name} ${player.last_name}`,
                        team: player.team || 'FA',
                        position: player.position,
                        avatar: `https://sleepercdn.com/content/nfl/players/${item.player_id}.jpg`
                    } : {
                        fullName: `Unknown Player (${item.player_id})`,
                        team: 'N/A',
                        position: 'N/A',
                        avatar: `https://sleepercdn.com/content/nfl/players/${item.player_id}.jpg`
                    }
                };
            }).filter(item => item.player.fullName && !item.player.fullName.startsWith('Unknown Player'));
        };

        const data = {
            add: processList(adds),
            drop: processList(drops),
            lastUpdated: new Date().toISOString()
        };

        const outputPath = path.join(__dirname, '../public/mock_nfl_trending.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

        console.log(`Successfully synced trending data to ${outputPath}`);
        console.log(`Adds: ${data.add.length}, Drops: ${data.drop.length}`);

    } catch (error) {
        console.error('Error syncing local data:', error);
        process.exit(1);
    }
}

main();
