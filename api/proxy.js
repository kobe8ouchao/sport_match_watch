export default async function handler(req, res) {
  const { endpoint } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint parameter is required' });
  }

  // Ensure endpoint is a string
  const path = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;
  
  // Get other query parameters
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'endpoint') {
      queryParams.append(key, value);
    }
  }
  
  const queryString = queryParams.toString();
  
  // Construct the target URL
  const targetUrl = `https://fantasy.premierleague.com/api/${path}${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://fantasy.premierleague.com/',
        'Origin': 'https://fantasy.premierleague.com'
      },
    });

    if (!response.ok) {
      console.error(`FPL API Error: ${response.status} ${response.statusText} for ${targetUrl}`);
      return res.status(response.status).json({ error: `FPL API returned ${response.status}` });
    }

    // Check content type before parsing as JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('FPL API returned non-JSON:', text.substring(0, 100));
      return res.status(502).json({ error: 'Received non-JSON response from FPL API' });
    }

    const data = await response.json();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    
    // Cache control: 1 minute cache, serve stale
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data from FPL API' });
  }
}
