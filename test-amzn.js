const https = require('https');

function fetchAlphaVantage(symbol, apiKey) {
  return new Promise((resolve, reject) => {
    const url = `https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${symbol}&apikey=${apiKey}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  try {
    const data = await fetchAlphaVantage('AMZN', 'VPT992792A1V2TEJ');
    console.log("AMZN response:", data);
  } catch(e) {
    console.error(e);
  }
}

test();
