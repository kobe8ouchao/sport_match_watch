import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DAYS_TO_FETCH = 3; // Generate pages for matches in the next 3 days
const OUTPUT_DIR = path.resolve(__dirname, '../dist');
const INDEX_HTML_PATH = path.join(OUTPUT_DIR, 'index.html');
const SITEMAP_PATH = path.join(OUTPUT_DIR, 'sitemap.xml');
const BASE_URL = 'https://sportlive.win';

// Static Routes to include in Sitemap (from existing sitemap)
const STATIC_ROUTES = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/leagues', changefreq: 'weekly', priority: '0.8' },
    { loc: '/schedule', changefreq: 'daily', priority: '0.9' },
    { loc: '/news', changefreq: 'daily', priority: '0.8' },
    { loc: '/standings/nba', changefreq: 'daily', priority: '0.8' },
    { loc: '/standings/eng.1', changefreq: 'daily', priority: '0.8' },
    { loc: '/standings/esp.1', changefreq: 'daily', priority: '0.8' },
    { loc: '/standings/ita.1', changefreq: 'daily', priority: '0.8' },
    { loc: '/standings/ger.1', changefreq: 'daily', priority: '0.8' },
    { loc: '/standings/fra.1', changefreq: 'daily', priority: '0.8' },
    { loc: '/nba-live-scores', changefreq: 'daily', priority: '0.9' },
    { loc: '/champions-league-results', changefreq: 'daily', priority: '0.9' },
    { loc: '/premier-league-fixtures', changefreq: 'daily', priority: '0.9' },
    { loc: '/la-liga-standings', changefreq: 'daily', priority: '0.9' },
    { loc: '/bundesliga-scores', changefreq: 'daily', priority: '0.9' },
    { loc: '/ligue-1-match-stats', changefreq: 'daily', priority: '0.9' },
    { loc: '/serie-a-live-football', changefreq: 'daily', priority: '0.9' }
];

// Keywords Data (will be populated dynamically)
let KEYWORD_DATA = [];

const NBA_TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams';

const fetchNBAKeywords = async () => {
    try {
        console.log('Fetching NBA teams data for keywords...');
        const data = await fetchJson(NBA_TEAMS_URL);
        const teams = data.sports[0].leagues[0].teams.map(t => t.team);
        
        KEYWORD_DATA = teams.map(team => {
            const name = team.name.toLowerCase(); // e.g., lakers
            const displayName = team.displayName.toLowerCase(); // e.g., los angeles lakers
            const shortName = team.shortDisplayName.toLowerCase(); // e.g., lakers

            // Generate variations
            const keywords = [
                `how to watch ${displayName} game tonight`,
                `where to watch ${displayName}`,
                `what channel is the ${name} game on`,
                `${displayName} live score`,
                `${displayName} vs`,
                `watch ${name} online free`,
                `${name} schedule 2025`,
                `live stream ${displayName}`
            ];

            return { team: shortName, keywords };
        });
        console.log(`Loaded keywords for ${KEYWORD_DATA.length} NBA teams.`);
    } catch (error) {
        console.error('Failed to fetch NBA keywords:', error);
        // Fallback to empty or minimal list if fetch fails
    }
};


const GENERAL_KEYWORDS = [
    'when is the nba season',
    'what time is nba game tonight',
    'where to watch playoffs',
    'where can i stream nba games for free',
    'who won the basketball game last night nba'
];

// Helper to fetch data
const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

// Leagues to process
const LEAGUES = ['nba', 'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'uefa.champions'];

// Date formatting
const formatDate = (date) => {
    return date.toISOString().split('T')[0].replace(/-/g, '');
};

const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
};

const getKeywordsForTeam = (teamName) => {
    const lowerName = teamName.toLowerCase();
    const specific = KEYWORD_DATA.filter(k => lowerName.includes(k.team)).flatMap(k => k.keywords);
    return [...new Set([...specific, ...GENERAL_KEYWORDS])]; // Unique
};

const generateSitemap = (matchUrls) => {
    const today = new Date().toISOString().split('T')[0];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add Static Routes
    STATIC_ROUTES.forEach(route => {
        xml += '  <url>\n';
        xml += `    <loc>${BASE_URL}${route.loc}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
        xml += `    <priority>${route.priority}</priority>\n`;
        xml += '  </url>\n';
    });

    // Add Match Routes
    matchUrls.forEach(url => {
        xml += '  <url>\n';
        xml += `    <loc>${BASE_URL}${url}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>';
    
    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`Sitemap generated at ${SITEMAP_PATH} with ${STATIC_ROUTES.length + matchUrls.length} URLs.`);
};

const generatePages = async () => {
    console.log('Starting static page generation...');
    
    // Fetch NBA keywords before generating pages
    await fetchNBAKeywords();

    const generatedUrls = [];

    if (!fs.existsSync(INDEX_HTML_PATH)) {
        console.error(`Error: ${INDEX_HTML_PATH} does not exist. Run "npm run build" first.`);
        process.exit(1);
    }

    const template = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

    for (const league of LEAGUES) {
        console.log(`Processing league: ${league}`);
        
        // Fetch matches for next few days
        for (let i = 0; i < DAYS_TO_FETCH; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = formatDate(date);
            
            const sport = league === 'nba' ? 'basketball' : 'soccer';
            const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${dateStr}`;

            try {
                const data = await fetchJson(url);
                const events = data.events || [];

                for (const event of events) {
                    const matchId = event.id;
                    
                    const competitors = event.competitions[0].competitors;
                    const home = competitors.find(c => c.homeAway === 'home');
                    const away = competitors.find(c => c.homeAway === 'away');
                    
                    const homeName = home.team.displayName;
                    const awayName = away.team.displayName;
                    
                    // Generate Slug: [home-slug]-vs-[away-slug]-[date]-[matchId]
                    // We append matchId to ensure uniqueness and easy ID extraction in React
                    const slugify = (text) => text.toLowerCase()
                        .replace(/[^\w\s-]/g, '') // Remove special chars
                        .replace(/\s+/g, '-')     // Replace spaces with hyphens
                        .replace(/-+/g, '-');     // Remove duplicate hyphens
                        
                    const homeSlug = slugify(homeName);
                    const awaySlug = slugify(awayName);
                    const matchDateSlug = dateStr; // YYYYMMDD
                    
                    // Format: team-a-vs-team-b-20231225-123456
                    const urlSlug = `${homeSlug}-vs-${awaySlug}-${matchDateSlug}-${matchId}`;

                    // 1. Generate Title: [Team A] vs [Team B] 实时比分 (Live Score)
                    const pageTitle = `${homeName} vs ${awayName} 实时比分 (Live Score)`;

                    // 2. Generate Keywords
                    const homeKeywords = getKeywordsForTeam(homeName);
                    const awayKeywords = getKeywordsForTeam(awayName);
                    const allKeywords = [...new Set([...homeKeywords, ...awayKeywords, ...GENERAL_KEYWORDS])];
                    const keywordsStr = allKeywords.join(', ');

                    // 3. Generate Description
                    const description = `Watch ${homeName} vs ${awayName} live. Find out how to watch the game tonight, check live scores, and see match stats. ${allKeywords.slice(0, 3).join('. ')}.`;

                    // 4. Create File Path: dist/match/[leagueId]/[urlSlug]/index.html
                    // This matches the route /match/:leagueId/:slugAndId
                    const outputFilePath = path.join(OUTPUT_DIR, 'match', league, urlSlug, 'index.html');
                    ensureDirectoryExistence(outputFilePath);

                    // 5. Inject Content
                    let content = template;
                    
                    // Replace Title
                    content = content.replace(
                        /<title>.*?<\/title>/, 
                        `<title>${pageTitle}</title>`
                    );

                    // Replace Description
                    content = content.replace(
                        /<meta name="description" content=".*?" \/>/,
                        `<meta name="description" content="${description}" />`
                    );

                    // Replace Keywords
                    content = content.replace(
                        /<meta name="keywords" content=".*?" \/>/,
                        `<meta name="keywords" content="${keywordsStr}" />`
                    );

                    // Write File
                    fs.writeFileSync(outputFilePath, content);
                    
                    // Add to Sitemap list
                    generatedUrls.push(`/match/${league}/${urlSlug}`);
                }
            } catch (err) {
                console.error(`Failed to fetch/process for ${league} on ${dateStr}:`, err.message);
            }
        }
    }
    
    // Generate Sitemap
    generateSitemap(generatedUrls);
    
    console.log('Static page generation complete.');
};

generatePages();
