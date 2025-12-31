import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

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

  let browser = null;

  try {
    // Configuration for Vercel/AWS Lambda
    // @sparticuz/chromium is designed to work in Serverless environments
    
    // Check if we are running locally or on Vercel
    const isLocal = process.env.VERCEL_ENV === 'development' || !process.env.AWS_LAMBDA_FUNCTION_VERSION;
    
    let executablePath;
    if (isLocal) {
      // Local development fallback - You might need to adjust this path for your local machine
      // or install full 'puppeteer' package for local dev
      executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; 
    } else {
      executablePath = await chromium.executablePath();
    }

    browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Set a realistic User Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    // Optimize: Block images/fonts/styles to save bandwidth/time
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Go to the URL
    const response = await page.goto(targetUrl, {
      waitUntil: 'networkidle0', // Wait until network is idle
      timeout: 15000 // 15s timeout
    });

    if (!response.ok()) {
      throw new Error(`Puppeteer received status ${response.status()}`);
    }

    // Get the JSON content
    // FPL API returns pure JSON, so the body text is the JSON
    const data = await response.json();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy Error (Puppeteer):', error);
    
    // Fallback to simple fetch if Puppeteer fails (e.g., locally without Chrome path)
    try {
        console.log('Falling back to fetch...');
        const fetchRes = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        if (!fetchRes.ok) throw new Error(`Fetch failed with ${fetchRes.status}`);
        const data = await fetchRes.json();
        return res.status(200).json(data);
    } catch (fetchError) {
        return res.status(500).json({ error: 'Failed to fetch data from FPL API', details: error.message });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
