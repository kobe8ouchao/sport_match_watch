export default async function handler(req, res) {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Path parameter is required' });
  }

  // Construct target URL
  // path might be array or string
  const pathStr = Array.isArray(path) ? path.join('/') : path;
  
  // Reconstruct query string (excluding 'path')
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') {
      queryParams.append(key, value);
    }
  }
  const queryString = queryParams.toString();
  // Use lm-api-reads for public read-only access (better for tools without auth)
  const targetUrl = `https://lm-api-reads.fantasy.espn.com/apis/v3/${pathStr}${queryString ? `?${queryString}` : ''}`;

  try {
    // Forward specific headers from the incoming request if needed
    // Especially X-Fantasy-Filter
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://fantasy.espn.com/',
        'Origin': 'https://fantasy.espn.com'
    };

    // Case-insensitive header lookup
    const filterHeader = Object.keys(req.headers).find(key => key.toLowerCase() === 'x-fantasy-filter');
    if (filterHeader) {
        headers['X-Fantasy-Filter'] = req.headers[filterHeader];
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers
    });

    if (!response.ok) {
       const text = await response.text();
       console.error(`ESPN API Error: ${response.status} ${text}`);
       return res.status(response.status).send(text);
    }

    const data = await response.json();
    
    // Set CORS for our frontend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Fantasy-Filter');
    
    // Disable caching to prevent 304 Not Modified issues
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.removeHeader('ETag');
    res.removeHeader('Last-Modified');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
