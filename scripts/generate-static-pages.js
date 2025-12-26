import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { SEO_PAGES_DATA } from '../constants/seoPagesData.js';

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
    { loc: '/standings/nfl', changefreq: 'daily', priority: '0.8' },
    { loc: '/standings/eng.1', changefreq: 'daily', priority: '0.8' },
    { loc: '/standings/esp.1', changefreq: 'daily', priority: '0.8' },
    { loc: '/standings/ita.1', changefreq: 'daily', priority: '0.8' },
    { loc: '/standings/ger.1', changefreq: 'daily', priority: '0.8' },
    { loc: '/standings/fra.1', changefreq: 'daily', priority: '0.8' },
    { loc: '/nba-live-scores', changefreq: 'daily', priority: '0.9' },
    { loc: '/nfl-scores', changefreq: 'daily', priority: '0.9' },
    { loc: '/champions-league-results', changefreq: 'daily', priority: '0.9' },
    { loc: '/premier-league-fixtures', changefreq: 'daily', priority: '0.9' },
    { loc: '/la-liga-standings', changefreq: 'daily', priority: '0.9' },
    { loc: '/bundesliga-scores', changefreq: 'daily', priority: '0.9' },
    { loc: '/ligue-1-match-stats', changefreq: 'daily', priority: '0.9' },
    { loc: '/serie-a-live-football', changefreq: 'daily', priority: '0.9' }
];

// Generate Schedule Pages for the next 14 days
const today = new Date();
for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    STATIC_ROUTES.push({ 
        loc: `/schedule?date=${dateStr}`, 
        changefreq: 'daily', 
        priority: '0.8' 
    });
}

// Keywords Data (will be populated dynamically)
let KEYWORD_DATA = [];

const NBA_TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams';
const NFL_TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams';

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

const fetchNFLKeywords = async () => {
    try {
        console.log('Fetching NFL teams data for keywords...');
        const data = await fetchJson(NFL_TEAMS_URL);
        const teams = data.sports[0].leagues[0].teams.map(t => t.team);
        
        const nflKeywords = teams.map(team => {
            const name = team.name.toLowerCase(); 
            const displayName = team.displayName.toLowerCase();
            const shortName = team.shortDisplayName.toLowerCase();

            const keywords = [
                `how to watch ${displayName} game`,
                `where to watch ${displayName}`,
                `what channel is the ${name} game on`,
                `${displayName} live score`,
                `${displayName} vs`,
                `watch ${name} online free`,
                `${name} schedule 2025`,
                `live stream ${displayName}`,
                `nfl scores ${name}`
            ];

            return { team: shortName, keywords };
        });
        
        KEYWORD_DATA = [...KEYWORD_DATA, ...nflKeywords];
        console.log(`Loaded keywords for ${nflKeywords.length} NFL teams.`);
    } catch (error) {
        console.error('Failed to fetch NFL keywords:', error);
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

    // Add Match and SEO Routes
    matchUrls.forEach(urlItem => {
        const loc = typeof urlItem === 'string' ? urlItem : urlItem.loc;
        const priority = typeof urlItem === 'string' ? '0.7' : (urlItem.priority || '0.7');
        const changefreq = typeof urlItem === 'string' ? 'daily' : (urlItem.changefreq || 'daily');

        xml += '  <url>\n';
        xml += `    <loc>${BASE_URL}${loc}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${changefreq}</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;
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
    await fetchNFLKeywords();

    const generatedUrls = [];

    if (!fs.existsSync(INDEX_HTML_PATH)) {
        console.error(`Error: ${INDEX_HTML_PATH} does not exist. Run "npm run build" first.`);
        process.exit(1);
    }

    const template = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

    // Generate SEO Landing Pages
    console.log('Generating SEO landing pages...');
    for (const page of SEO_PAGES_DATA) {
        try {
            // Create output directory: dist/[slug]
            const outputFilePath = path.join(OUTPUT_DIR, page.slug, 'index.html');
            ensureDirectoryExistence(outputFilePath);

            let html = template;

            // Replace Title
            html = html.replace(
                /<title>.*?<\/title>/,
                `<title>${page.title}</title>`
            );

            // Replace Description
            html = html.replace(
                /<meta name="description" content=".*?" \/>/,
                `<meta name="description" content="${page.description}" />`
            );

            // Replace Keywords
            if (html.includes('<meta name="keywords"')) {
                 html = html.replace(
                    /<meta name="keywords" content=".*?" \/>/,
                    `<meta name="keywords" content="${page.keyword}" />`
                );
            } else {
                 html = html.replace('</head>', `<meta name="keywords" content="${page.keyword}" />\n</head>`);
            }

            // Add Canonical URL
            const canonicalUrl = `${BASE_URL}/${page.slug}`;
            if (html.includes('<link rel="canonical"')) {
                html = html.replace(
                    /<link rel="canonical" href=".*?" \/>/,
                    `<link rel="canonical" href="${canonicalUrl}" />`
                );
            } else {
                html = html.replace('</head>', `<link rel="canonical" href="${canonicalUrl}" />\n</head>`);
            }

            // Inject Content into #root for SEO
            const contentHtml = `
                <div class="min-h-screen bg-pantone-cloud text-gray-900">
                    <div class="max-w-7xl mx-auto px-4 py-12">
                        <article class="prose lg:prose-xl max-w-none">
                            <h1>${page.h1}</h1>
                            ${page.content}
                        </article>
                    </div>
                </div>
            `;
            html = html.replace('<div id="root"></div>', `<div id="root">${contentHtml}</div>`);

            fs.writeFileSync(outputFilePath, html);
            generatedUrls.push({ loc: `/${page.slug}`, priority: '0.9', changefreq: 'daily' });
            console.log(`Generated ${page.slug}`);

        } catch (e) {
            console.error(`Error generating ${page.slug}:`, e);
        }
    }

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
                    const slugify = (text) => text.toLowerCase()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-');
                        
                    const homeSlug = slugify(homeName);
                    const awaySlug = slugify(awayName);
                    const matchDateSlug = dateStr;
                    
                    const urlSlug = `${homeSlug}-vs-${awaySlug}-${matchDateSlug}-${matchId}`;

                    const pageTitle = `${homeName} vs ${awayName} 实时比分 (Live Score)`;

                    const homeKeywords = getKeywordsForTeam(homeName);
                    const awayKeywords = getKeywordsForTeam(awayName);
                    const allKeywords = [...new Set([...homeKeywords, ...awayKeywords, ...GENERAL_KEYWORDS])];
                    const keywordsStr = allKeywords.join(', ');

                    const description = `Watch ${homeName} vs ${awayName} live. Find out how to watch the game tonight, check live scores, and see match stats. ${allKeywords.slice(0, 3).join('. ')}.`;

                    const outputFilePath = path.join(OUTPUT_DIR, 'match', league, urlSlug, 'index.html');
                    ensureDirectoryExistence(outputFilePath);

                    let content = template;
                    
                    content = content.replace(
                        /<title>.*?<\/title>/, 
                        `<title>${pageTitle}</title>`
                    );

                    content = content.replace(
                        /<meta name="description" content=".*?" \/>/,
                        `<meta name="description" content="${description}" />`
                    );

                    content = content.replace(
                        /<meta name="keywords" content=".*?" \/>/,
                        `<meta name="keywords" content="${keywordsStr}" />`
                    );

                    // Add Canonical URL
                    const canonicalUrl = `${BASE_URL}/match/${league}/${urlSlug}`;
                    if (content.includes('<link rel="canonical"')) {
                        content = content.replace(
                            /<link rel="canonical" href=".*?" \/>/,
                            `<link rel="canonical" href="${canonicalUrl}" />`
                        );
                    } else {
                        content = content.replace('</head>', `<link rel="canonical" href="${canonicalUrl}" />\n</head>`);
                    }

                    fs.writeFileSync(outputFilePath, content);
                    
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
