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
    const data = await fetchAlphaVantage('MSFT', 'VPT992792A1V2TEJ');
    if (data.quarterlyReports) {
      console.log(`MSFT Quarterly Reports: ${data.quarterlyReports.length}`);
      const recent = data.quarterlyReports.slice(0, 4);
      console.log("Recent CapEx:", recent.map(r => ({ date: r.fiscalDateEnding, capex: r.capitalExpenditures })));
    } else {
      console.log("Error or limit reached:", data);
    }
  } catch(e) {
    console.error(e);
  }
}

test();
