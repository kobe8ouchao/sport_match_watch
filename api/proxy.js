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
      // Local development fallback - Attempt to find Chrome/Chromium
      // This path works for Windows, but we should make it more robust or just rely on fetch fallback for local
      executablePath = process.platform === 'win32' 
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome';
    } else {
      executablePath = await chromium.executablePath();
    }

    // If we are local and the executable path doesn't exist, this will fail and trigger the catch block
    // which then falls back to fetch. This is acceptable behavior.

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
        // Force User-Agent to look like a browser to bypass some basic checks
        const fetchRes = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            }
        });
        
        if (!fetchRes.ok) {
            // Try reading error text if possible
            const errText = await fetchRes.text().catch(() => 'No error text');
            throw new Error(`Fetch failed with ${fetchRes.status}: ${errText.substring(0, 100)}`);
        }
        
        const contentType = fetchRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
             const data = await fetchRes.json();
             return res.status(200).json(data);
        } else {
             // Sometimes it might return text that is actually JSON
             const text = await fetchRes.text();
             try {
                 const data = JSON.parse(text);
                 return res.status(200).json(data);
             } catch (e) {
                 throw new Error(`Received non-JSON response: ${text.substring(0, 50)}...`);
             }
        }
    } catch (fetchError) {
        console.error('Proxy Error (Fetch Fallback):', fetchError);
        return res.status(500).json({ 
            error: 'Failed to fetch data from FPL API', 
            details: error.message, 
            fallbackError: fetchError.message 
        });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
