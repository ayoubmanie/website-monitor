const https = require('https');
const http = require('http');
const { extractTextFromHTML } = require('../utils/extractTextFromHTML.js');

async function checkWebsiteContent(url, keyword) {
  keyword = keyword.toLowerCase();
  const protocol = url.startsWith('https') ? https : http;
  
  try {
    const { statusCode, body } = await new Promise((resolve, reject) => {
      const req = protocol.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({
          statusCode: res.statusCode,
          body: data
        }));
      });
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy(new Error('Request timeout'));
      });
    });

    // Check if status code is OK
    if (statusCode < 200 || statusCode >= 400) {
      return {
        success: false,
        error: `HTTP Status Code: ${statusCode}`,
        body: null
      };
    }

    // Extract visible text content (basic version)
    const visibleText = extractTextFromHTML(body).toLowerCase();
      
    // Check for keyword in content
    if (!visibleText.includes(keyword)) {
      return {
        success: false,
        error: `Keyword "${keyword}" not found in page content`,
        body: visibleText.substring(0, 500) // Return first 500 chars for debugging
      };
    }

    return { success: true, body: null };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      body: null
    };
  }
}


module.exports = { checkWebsiteContent }