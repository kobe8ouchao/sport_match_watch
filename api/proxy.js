
export default async function handler(req, res) {
  const { endpoint } = req.query;
  
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint parameter is required' });
  }

  // 构建目标 URL，确保 endpoint 不包含开头的斜杠
  const cleanEndpoint = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;
  const targetUrl = `https://fantasy.premierleague.com/api/${cleanEndpoint}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://fantasy.premierleague.com/'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `FPL API responded with ${response.status}` });
    }

    const data = await response.json();
    
    // 设置缓存头，允许 Vercel 边缘缓存 10 分钟，浏览器缓存 1 分钟
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=30');
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data from FPL API' });
  }
}
